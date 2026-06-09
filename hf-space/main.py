"""FastAPI backend for The One With the AI.

Three endpoints:
  POST /chat       — streaming RAG chat with a chosen character
  GET  /watch      — JustWatch links for Friends
  GET  /game/round — random Friends line + classifier's prediction for "Guess Who"

Run:
  ./start.sh                       # default port 8000
  uvicorn main:app --reload        # dev mode

Frontend talks to this via NEXT_PUBLIC_API_URL (e.g. http://localhost:8000).
"""

import asyncio
import json
import os
import random
from pathlib import Path

import anthropic
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

# --- paths and config ----------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / "agents" / ".env")

EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
CHAT_MODEL = "claude-opus-4-8"
INDEX_DIR = REPO_ROOT / "chatbots" / "index"
GAME_LINES_PATH = Path(__file__).resolve().parent / "game_lines.jsonl"

CHARACTERS = ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"]
RETRIEVAL_K = 8

# Same voice notes as chatbots/rag.py — single source of truth would be nicer,
# but the chatbots module imports torch transitively; keep it duplicated to
# avoid pulling torch into the server process at import time.
VOICE_NOTES = {
    "Monica": "Type-A perfectionist. Competitive, demanding, especially about cleanliness, cooking, and rules. Catchphrase: 'I KNOW!'",
    "Joey": "Easy-going actor. Loves food (especially sandwiches and pizza). Not the sharpest but big-hearted. Catchphrase: 'How you doin'?'",
    "Ross": "Nerdy paleontologist. Pedantic, anxious about being right ('Actually...'). Three divorces. Loves dinosaurs.",
    "Chandler": "Self-deprecating, sarcastic. Uses humor to deflect. Speech pattern: 'Could this BE any more...?' / 'I'm not great at the advice.'",
    "Rachel": "Started spoiled and self-absorbed, grew into someone with taste and ambition. Works in fashion. Says 'Oh my god' a lot.",
    "Phoebe": "Quirky, unfiltered, has lived a chaotic life. Plays guitar, sings 'Smelly Cat'. Believes in spirits/auras. Says blunt things.",
}

# --- startup: load embedder + per-character indices + game data ----------------
print("[startup] loading embedder:", EMBED_MODEL_NAME)
embedder = SentenceTransformer(EMBED_MODEL_NAME)

print("[startup] loading character indices from", INDEX_DIR)
char_indices: dict[str, tuple[np.ndarray, list[str]]] = {}
for c in CHARACTERS:
    emb_path = INDEX_DIR / f"{c}.emb.npy"
    texts_path = INDEX_DIR / f"{c}.texts.json"
    if not emb_path.exists() or not texts_path.exists():
        raise SystemExit(
            f"Missing index for {c}. Run: cd chatbots && ./start.sh (or python build_index.py)"
        )
    char_indices[c] = (np.load(emb_path), json.loads(texts_path.read_text()))
    print(f"  {c:9s} {char_indices[c][0].shape[0]:,} lines")

print("[startup] loading game lines:", GAME_LINES_PATH)
game_lines: list[dict] = []
if GAME_LINES_PATH.exists():
    game_lines = [json.loads(line) for line in open(GAME_LINES_PATH)]
    print(f"  {len(game_lines):,} game lines ready")
else:
    print("  WARN: game_lines.jsonl missing — /game/round will 503")
    print("  fix: cd server && python precompute_game_lines.py")

claude_async = anthropic.AsyncAnthropic()

# --- FastAPI app ---------------------------------------------------------------
app = FastAPI(title="The One With the AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://howudoinai.vercel.app",
        "https://the-one-with-the-ai.vercel.app",
    ],
    # Allow any preview/branch deploy on this Vercel project
    allow_origin_regex=r"https://the-one-with-the-[a-z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# --- request models ------------------------------------------------------------
class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    character: str
    messages: list[ChatMessage]
    # Optional user-context block injected by the Next.js proxy when the user is
    # signed in. Contains the user's name + any persisted memories the character
    # should reference. Empty/None for anonymous chats.
    user_context: str | None = None


# --- helpers -------------------------------------------------------------------
def top_k(query_emb: np.ndarray, emb: np.ndarray, texts: list[str], k: int = RETRIEVAL_K) -> list[str]:
    """Cosine similarity (embeddings are pre-normalized → dot product)."""
    scores = emb @ query_emb
    idx = np.argpartition(-scores, k)[:k]
    idx = idx[np.argsort(-scores[idx])]
    return [texts[i] for i in idx]


def build_system_prompt(
    character: str, retrieved: list[str], user_context: str | None = None
) -> str:
    voice = VOICE_NOTES[character]
    lines = "\n".join(f"- {line}" for line in retrieved)
    base = f"""You are {character} from the TV show Friends.

{voice}

Below are lines {character} actually said in the show, retrieved because they are semantically related to what the user just said. Use these to anchor your voice — match the cadence, vocabulary, and energy. Do NOT just copy them; respond naturally to the user.

Reference lines from {character}:
{lines}

Rules:
- Stay completely in character. You are {character}, not an AI.
- Match the show's casual conversational tone. 1-3 short sentences usually.
- No stage directions, no italics narration, no quoting yourself.
- Do not start with your name. Just speak.
- If the user asks a meta question (about the show, about being an AI), stay in character and answer however {character} would — confused, dismissive, deflecting with humor, etc.
"""
    if user_context:
        base += "\n" + user_context.strip() + "\n"
    return base


# --- routes --------------------------------------------------------------------
@app.get("/")
def root():
    return {
        "service": "The One With the AI",
        "characters": CHARACTERS,
        "endpoints": ["POST /chat", "GET /watch", "GET /game/round"],
        "game_lines_loaded": len(game_lines),
    }


@app.post("/chat")
async def chat(req: ChatRequest):
    if req.character not in CHARACTERS:
        raise HTTPException(400, f"Unknown character: {req.character}. Valid: {CHARACTERS}")
    if not req.messages:
        raise HTTPException(400, "messages cannot be empty")

    last_user_msg = next(
        (m.content for m in reversed(req.messages) if m.role == "user"), None
    )
    if not last_user_msg:
        raise HTTPException(400, "no user message found in conversation")

    # Embed off the event loop (CPU-bound, ~50ms on M2)
    q_emb = await asyncio.to_thread(
        embedder.encode,
        last_user_msg,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )

    emb, texts = char_indices[req.character]
    retrieved = top_k(q_emb, emb, texts, k=RETRIEVAL_K)
    system_prompt = build_system_prompt(req.character, retrieved, req.user_context)
    history = [m.model_dump() for m in req.messages]

    async def stream():
        try:
            async with claude_async.messages.stream(
                model=CHAT_MODEL,
                max_tokens=400,
                system=system_prompt,
                messages=history,
            ) as response_stream:
                async for text in response_stream.text_stream:
                    yield f"data: {json.dumps({'delta': text})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
        except anthropic.RateLimitError as e:
            yield f"data: {json.dumps({'error': 'Rate limited — try again in a few seconds.'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'{type(e).__name__}: {e}'})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx/proxy buffering if any
        },
    )


@app.get("/watch")
def watch(character: str = "Friends"):
    """Stub for now — production would call a real JustWatch API.

    Returns canonical Friends streaming links. The character param is kept for
    forward compatibility (per-character offers if licensing ever varies).
    """
    return {
        "show": "Friends",
        "character": character,
        "options": [
            {
                "service": "Max",
                "url": "https://www.max.com/series/friends",
                "type": "stream",
            },
            {
                "service": "Amazon Prime",
                "url": "https://www.amazon.com/gp/video/detail/B000K7VHOA",
                "type": "rent",
            },
            {
                "service": "Apple TV",
                "url": "https://tv.apple.com/us/show/friends",
                "type": "rent",
            },
            {
                "service": "JustWatch",
                "url": "https://www.justwatch.com/us/tv-show/friends",
                "type": "stream",
            },
        ],
    }


@app.get("/game/round")
def game_round():
    """One random round of Guess Who Said It.

    Returns a real Friends line, its true speaker, and our DistilBERT
    classifier's pre-computed prediction + confidence. The frontend shows
    the line and the 6 character options, then after the user picks
    reveals both the truth and what the AI guessed.
    """
    if not game_lines:
        raise HTTPException(
            503,
            "Game data not loaded. Run: cd server && python precompute_game_lines.py",
        )
    line = random.choice(game_lines)
    return {
        "line": line["line"],
        "answer": line["speaker"],
        "classifier_pred": line["classifier_pred"],
        "classifier_confidence": line["classifier_confidence"],
        "options": CHARACTERS,
    }
