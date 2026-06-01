"""Chatbot baseline — prompting + RAG.

Given a user message, retrieves the top-K most semantically similar lines
the chosen character actually said in the show, then prompts Claude to
respond in that character's voice using those lines as grounding examples.

Interactive CLI by default. Pick character with --character.
"""
import argparse
import json
import sys
from pathlib import Path
from typing import Any

import anthropic
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

REPO_ROOT = Path(__file__).resolve().parent.parent
INDEX_DIR = REPO_ROOT / "chatbots" / "index"
load_dotenv(REPO_ROOT / "agents" / ".env")

CHARACTERS = ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"]
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CHAT_MODEL = "claude-sonnet-4-6"

# Character-specific voice notes — what makes them THEM. Keep short.
VOICE_NOTES = {
    "Monica": "Type-A perfectionist. Competitive, demanding, especially about cleanliness, cooking, and rules. Catchphrase: 'I KNOW!'",
    "Joey": "Easy-going actor. Loves food (especially sandwiches and pizza). Not the sharpest but big-hearted. Catchphrase: 'How you doin'?'",
    "Ross": "Nerdy paleontologist. Pedantic, anxious about being right ('Actually...'). Three divorces. Loves dinosaurs.",
    "Chandler": "Self-deprecating, sarcastic. Uses humor to deflect. Speech pattern: 'Could this BE any more...?' / 'I'm not great at the advice.'",
    "Rachel": "Started spoiled and self-absorbed, grew into someone with taste and ambition. Works in fashion. Says 'Oh my god' a lot.",
    "Phoebe": "Quirky, unfiltered, has lived a chaotic life. Plays guitar, sings 'Smelly Cat'. Believes in spirits/auras. Says blunt things.",
}


def load_character(name: str) -> tuple[np.ndarray, list[str]]:
    emb_path = INDEX_DIR / f"{name}.emb.npy"
    texts_path = INDEX_DIR / f"{name}.texts.json"
    if not emb_path.exists() or not texts_path.exists():
        raise SystemExit(
            f"No index for {name}. Run: python chatbots/build_index.py"
        )
    emb = np.load(emb_path)
    texts = json.loads(texts_path.read_text())
    return emb, texts


def top_k(query_emb: np.ndarray, emb: np.ndarray, texts: list[str], k: int) -> list[str]:
    # All embeddings are normalized → dot product = cosine similarity
    scores = emb @ query_emb
    idx = np.argpartition(-scores, k)[:k]
    # Sort the K winners descending for prompt order
    idx = idx[np.argsort(-scores[idx])]
    return [texts[i] for i in idx]


def system_prompt(character: str, retrieved: list[str]) -> str:
    voice = VOICE_NOTES[character]
    lines = "\n".join(f"- {line}" for line in retrieved)
    return f"""You are {character} from the TV show Friends.

{voice}

Below are lines {character} actually said in the show, retrieved because they are semantically related to what the user just said. Use these to anchor your voice — match the cadence, vocabulary, and energy. Do NOT just copy them; respond naturally to the user.

Reference lines from {character}:
{lines}

Rules:
- Stay completely in character. You are {character}, not an AI.
- Match the show's casual conversational tone. 1-3 short sentences usually.
- No stage directions, no italics narration, no quoting yourself.
- Do not start with your name ("{character}: ..."). Just speak.
- If the user asks a meta question (about the show, about being an AI), stay in character and answer however {character} would — confused, dismissive, deflecting with humor, etc.
"""


def chat(character: str, k: int) -> None:
    print(f"Loading embedding model ({EMBED_MODEL})", file=sys.stderr)
    embedder = SentenceTransformer(EMBED_MODEL)
    print(f"Loading {character}'s index", file=sys.stderr)
    char_emb, char_texts = load_character(character)
    print(f"  {char_emb.shape[0]:,} lines indexed", file=sys.stderr)
    print(f"Model: {CHAT_MODEL}, retrieval K={k}", file=sys.stderr)
    print(f"\nChatting with {character}. Type 'quit' to exit.\n", file=sys.stderr)

    claude = anthropic.Anthropic()
    history: list[dict[str, Any]] = []

    while True:
        try:
            user_text = input("you: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return
        if not user_text or user_text.lower() in {"quit", "exit", "q"}:
            return

        query_emb = embedder.encode(
            user_text, normalize_embeddings=True, convert_to_numpy=True
        )
        retrieved = top_k(query_emb, char_emb, char_texts, k)

        history.append({"role": "user", "content": user_text})
        resp = claude.messages.create(
            model=CHAT_MODEL,
            max_tokens=400,
            system=system_prompt(character, retrieved),
            messages=history,
        )
        reply = next(b.text for b in resp.content if b.type == "text")
        history.append({"role": "assistant", "content": reply})
        print(f"{character.lower()}: {reply}\n")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--character", default="Joey", choices=CHARACTERS)
    ap.add_argument("--k", type=int, default=8, help="Top-K retrieval (default 8)")
    args = ap.parse_args()
    chat(args.character, args.k)


if __name__ == "__main__":
    main()
