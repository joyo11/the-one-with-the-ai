"""Score each chatbot reply with the trained DistilBERT classifier.

Reads evals/data/replies.jsonl, runs each reply through the classifier,
writes evals/data/scored_classifier.jsonl with predicted character + match flag.
"""
import json
from pathlib import Path

import torch
from transformers import (
    DistilBertForSequenceClassification,
    DistilBertTokenizerFast,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = REPO_ROOT / "classifier" / "models" / "best"
DATA_DIR = REPO_ROOT / "evals" / "data"
IN_PATH = DATA_DIR / "replies.jsonl"
OUT_PATH = DATA_DIR / "scored_classifier.jsonl"

LABELS = ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"]


def device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def main() -> None:
    if not MODEL_DIR.exists():
        raise SystemExit(f"No model at {MODEL_DIR}. Run classifier/train.py first.")
    if not IN_PATH.exists():
        raise SystemExit(f"No replies at {IN_PATH}. Run generate_replies.py first.")

    dev = device()
    print(f"Device: {dev}")
    tokenizer = DistilBertTokenizerFast.from_pretrained(str(MODEL_DIR))
    model = DistilBertForSequenceClassification.from_pretrained(str(MODEL_DIR)).to(dev)
    model.eval()

    rows = [json.loads(line) for line in open(IN_PATH)]
    print(f"Scoring {len(rows)} replies")

    scored = []
    with torch.no_grad():
        for i, r in enumerate(rows, 1):
            enc = tokenizer(
                r["reply"],
                truncation=True,
                max_length=96,
                padding=True,
                return_tensors="pt",
            ).to(dev)
            logits = model(**enc).logits.squeeze(0)
            probs = torch.softmax(logits, dim=-1).cpu().tolist()
            pred_id = int(logits.argmax().item())
            pred_name = LABELS[pred_id]
            r_out = {
                **r,
                "classifier_pred": pred_name,
                "classifier_confidence": round(probs[pred_id], 4),
                "classifier_match": pred_name == r["character"],
                "classifier_probs": {LABELS[k]: round(p, 4) for k, p in enumerate(probs)},
            }
            scored.append(r_out)

    with open(OUT_PATH, "w") as f:
        for s in scored:
            f.write(json.dumps(s) + "\n")
    matched = sum(1 for s in scored if s["classifier_match"])
    print(f"  Classifier matched intended character: {matched}/{len(scored)} ({100*matched/len(scored):.1f}%)")
    print(f"Saved to {OUT_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
