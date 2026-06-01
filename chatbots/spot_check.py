"""Quick spot-check: one tailored question per character to verify voice."""
import sys
from pathlib import Path

import anthropic
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

sys.path.insert(0, str(Path(__file__).parent))
from rag import (  # noqa: E402
    CHAT_MODEL,
    EMBED_MODEL,
    load_character,
    system_prompt,
    top_k,
)

load_dotenv(Path(__file__).resolve().parent.parent / "agents" / ".env")

PROBES = [
    ("Monica",   "How would you organize a kitchen?"),
    ("Ross",     "Tell me something interesting about dinosaurs."),
    ("Chandler", "I just got dumped. What do I do?"),
    ("Rachel",   "What should I wear to a job interview?"),
    ("Phoebe",   "Do you believe in ghosts?"),
]


def main() -> None:
    print(f"Loading {EMBED_MODEL}", file=sys.stderr)
    embedder = SentenceTransformer(EMBED_MODEL)
    claude = anthropic.Anthropic()

    for character, question in PROBES:
        emb, texts = load_character(character)
        q_emb = embedder.encode(
            question, normalize_embeddings=True, convert_to_numpy=True
        )
        retrieved = top_k(q_emb, emb, texts, k=8)
        resp = claude.messages.create(
            model=CHAT_MODEL,
            max_tokens=400,
            system=system_prompt(character, retrieved),
            messages=[{"role": "user", "content": question}],
        )
        reply = next(b.text for b in resp.content if b.type == "text")
        print(f"\n=== {character} ===")
        print(f"  you: {question}")
        print(f"  {character.lower()}: {reply}")


if __name__ == "__main__":
    main()
