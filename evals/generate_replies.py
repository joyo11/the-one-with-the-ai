"""Generate chatbot replies for every probe → evals/data/replies.jsonl.

Reuses chatbots/rag.py pipeline (retrieval + Sonnet 4.6).
Run from the chatbots venv (has sentence-transformers, anthropic, dotenv).
"""
import json
import sys
import time
from pathlib import Path

import anthropic
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "chatbots"))
sys.path.insert(0, str(REPO_ROOT / "evals"))

from rag import CHAT_MODEL, EMBED_MODEL, load_character, system_prompt, top_k  # noqa: E402
from probes import all_probes  # noqa: E402

load_dotenv(REPO_ROOT / "agents" / ".env")

DATA_DIR = REPO_ROOT / "evals" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUT = DATA_DIR / "replies.jsonl"


def main() -> None:
    embedder = SentenceTransformer(EMBED_MODEL)
    claude = anthropic.Anthropic(max_retries=8)
    probes = all_probes()
    print(f"Generating {len(probes)} replies → {OUT.relative_to(REPO_ROOT)}")

    char_cache: dict[str, tuple] = {}
    rows = []
    started = time.monotonic()

    for i, (character, probe) in enumerate(probes, 1):
        if character not in char_cache:
            char_cache[character] = load_character(character)
        emb, texts = char_cache[character]
        q_emb = embedder.encode(probe, normalize_embeddings=True, convert_to_numpy=True)
        retrieved = top_k(q_emb, emb, texts, k=8)

        resp = claude.messages.create(
            model=CHAT_MODEL,
            max_tokens=400,
            system=system_prompt(character, retrieved),
            messages=[{"role": "user", "content": probe}],
        )
        reply = next(b.text for b in resp.content if b.type == "text")

        rows.append({"character": character, "probe": probe, "reply": reply.strip()})
        elapsed = time.monotonic() - started
        rate = i / elapsed
        eta = (len(probes) - i) / rate if rate else 0
        print(f"  [{i:>2d}/{len(probes)}] {character:9s} ({rate:.2f}/s, ETA {eta:.0f}s)", flush=True)

    with open(OUT, "w") as f:
        for r in rows:
            f.write(json.dumps(r) + "\n")
    print(f"\nSaved {len(rows)} replies to {OUT.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
