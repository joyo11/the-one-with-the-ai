"""One-time precompute: run DistilBERT on all 42,819 cleaned lines and save
per-line (line, speaker, classifier_pred, classifier_confidence).

The running server reads this file for /game/round — much lighter than loading
torch + the classifier model at server startup. Re-run if classifier changes.

Output: server/game_lines.jsonl
"""
import csv
import json
from pathlib import Path

import torch
from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast

REPO_ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = REPO_ROOT / "classifier" / "models" / "best"
CSV_PATH = REPO_ROOT / "classifier" / "data" / "clean" / "lines.csv"
OUT_PATH = Path(__file__).resolve().parent / "game_lines.jsonl"

LABELS = ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"]
BATCH = 64


def device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def main() -> None:
    if not MODEL_DIR.exists():
        raise SystemExit(f"No classifier model at {MODEL_DIR}. Run classifier/train.py first.")
    if not CSV_PATH.exists():
        raise SystemExit(f"No data at {CSV_PATH}. Run classifier/prepare_data.py first.")

    dev = device()
    print(f"Device: {dev}")
    tokenizer = DistilBertTokenizerFast.from_pretrained(str(MODEL_DIR))
    model = DistilBertForSequenceClassification.from_pretrained(str(MODEL_DIR)).to(dev)
    model.eval()

    with open(CSV_PATH) as f:
        rows = list(csv.DictReader(f))
    print(f"Scoring {len(rows):,} lines in batches of {BATCH}")

    results: list[dict] = []
    with torch.no_grad():
        for i in range(0, len(rows), BATCH):
            batch = rows[i : i + BATCH]
            lines = [r["line"] for r in batch]
            enc = tokenizer(
                lines,
                truncation=True,
                max_length=96,
                padding=True,
                return_tensors="pt",
            ).to(dev)
            logits = model(**enc).logits
            probs = torch.softmax(logits, dim=-1)
            preds = logits.argmax(dim=-1)
            for r, p, conf in zip(batch, preds.cpu().tolist(), probs.cpu()):
                results.append({
                    "line": r["line"],
                    "speaker": r["speaker"],
                    "classifier_pred": LABELS[p],
                    "classifier_confidence": round(conf[p].item(), 4),
                })
            done = i + len(batch)
            if done % (BATCH * 20) == 0 or done == len(rows):
                print(f"  {done:>6,} / {len(rows):,}", flush=True)

    with open(OUT_PATH, "w") as f:
        for r in results:
            f.write(json.dumps(r) + "\n")

    matched = sum(1 for r in results if r["classifier_pred"] == r["speaker"])
    print(f"\nSaved {len(results):,} rows to {OUT_PATH}")
    print(f"Classifier accuracy on all lines: {matched}/{len(results)} ({100*matched/len(results):.1f}%)")


if __name__ == "__main__":
    main()
