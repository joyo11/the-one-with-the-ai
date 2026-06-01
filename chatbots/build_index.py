"""Build a retrieval index for each character.

Loads classifier/data/clean/lines.csv (42,819 lines across the 6 characters),
embeds each line with sentence-transformers/all-MiniLM-L6-v2 (local, 80MB,
runs in seconds on M2), and saves per-character (lines.npy + texts.json).

Output: chatbots/index/{character}.lines.npy + {character}.texts.json
"""
import csv
import json
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

REPO_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = REPO_ROOT / "classifier" / "data" / "clean" / "lines.csv"
INDEX_DIR = REPO_ROOT / "chatbots" / "index"
INDEX_DIR.mkdir(parents=True, exist_ok=True)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
CHARACTERS = ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"]


def main() -> None:
    print(f"Loading {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    print(f"Reading {CSV_PATH.relative_to(REPO_ROOT)}")
    by_char: dict[str, list[str]] = {c: [] for c in CHARACTERS}
    with open(CSV_PATH) as f:
        for row in csv.DictReader(f):
            by_char.setdefault(row["speaker"], []).append(row["line"])

    for char in CHARACTERS:
        texts = by_char[char]
        print(f"  {char}: embedding {len(texts):,} lines")
        emb = model.encode(
            texts,
            batch_size=64,
            convert_to_numpy=True,
            normalize_embeddings=True,  # so cosine similarity = dot product
            show_progress_bar=False,
        )
        np.save(INDEX_DIR / f"{char}.emb.npy", emb.astype(np.float32))
        with open(INDEX_DIR / f"{char}.texts.json", "w") as f:
            json.dump(texts, f)
        print(f"    saved emb shape={emb.shape}, texts={len(texts):,}")

    print()
    print("Done. Files in", INDEX_DIR.relative_to(REPO_ROOT))


if __name__ == "__main__":
    main()
