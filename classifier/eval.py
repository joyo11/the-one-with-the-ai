"""Phase 2 — eval.

Loads the best model saved by train.py and scores it on the held-out test
split (exactly the split train.py persisted to test_split.json — no leakage).

Reports:
  - overall accuracy
  - per-character F1 (Chandler asked for this)
  - confusion matrix
  - a few example mispredictions (qualitative spot-check)

Pass bar: overall accuracy >= 70% AND no character F1 below 50%.
"""

import json
import random
from collections import Counter
from pathlib import Path

import torch
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from transformers import (
    DistilBertForSequenceClassification,
    DistilBertTokenizerFast,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = REPO_ROOT / "classifier" / "models" / "best"
TEST_SPLIT = REPO_ROOT / "classifier" / "models" / "test_split.json"

LABELS = ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"]
PASS_OVERALL = 0.70
PASS_PER_CHARACTER_F1 = 0.50
BATCH = 64


def device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def main():
    if not MODEL_DIR.exists():
        raise SystemExit(f"No model at {MODEL_DIR}. Run train.py first.")
    if not TEST_SPLIT.exists():
        raise SystemExit(f"No test split at {TEST_SPLIT}. Run train.py first.")

    dev = device()
    print(f"Device: {dev}")
    print(f"Loading model from {MODEL_DIR.relative_to(REPO_ROOT)}")
    tokenizer = DistilBertTokenizerFast.from_pretrained(str(MODEL_DIR))
    model = DistilBertForSequenceClassification.from_pretrained(str(MODEL_DIR)).to(dev)
    model.eval()

    test = json.load(open(TEST_SPLIT))
    texts: list[str] = test["texts"]
    y_true: list[int] = test["labels"]
    print(f"Test set: {len(texts):,} lines")

    y_pred: list[int] = []
    with torch.no_grad():
        for i in range(0, len(texts), BATCH):
            chunk = texts[i:i + BATCH]
            enc = tokenizer(
                chunk,
                truncation=True,
                max_length=96,
                padding=True,
                return_tensors="pt",
            ).to(dev)
            logits = model(**enc).logits
            y_pred.extend(logits.argmax(dim=-1).cpu().tolist())

    overall = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro")
    per_class_f1 = f1_score(y_true, y_pred, average=None, labels=list(range(len(LABELS))))

    print()
    print("=== Overall ===")
    print(f"  accuracy : {overall:.4f}")
    print(f"  macro F1 : {macro_f1:.4f}")

    print()
    print("=== Per character ===")
    print(classification_report(
        y_true, y_pred, target_names=LABELS, digits=3, zero_division=0
    ))

    print("=== Confusion matrix (rows = truth, cols = predicted) ===")
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(LABELS))))
    header = "         " + "  ".join(f"{n[:5]:>5s}" for n in LABELS)
    print(header)
    for i, name in enumerate(LABELS):
        row = "  ".join(f"{cm[i][j]:>5d}" for j in range(len(LABELS)))
        print(f"  {name[:7]:7s} {row}")

    # Qualitative spot-check — 5 random mispredictions
    print()
    print("=== Sample mispredictions ===")
    misses = [
        (texts[i], LABELS[y_true[i]], LABELS[y_pred[i]])
        for i in range(len(texts))
        if y_true[i] != y_pred[i]
    ]
    random.seed(42)
    for line, true, pred in random.sample(misses, min(5, len(misses))):
        line_short = line if len(line) <= 90 else line[:87] + "..."
        print(f"  true={true:9s} pred={pred:9s}  {line_short!r}")

    # Pass / fail
    weakest = min(per_class_f1)
    weakest_name = LABELS[per_class_f1.argmin()]
    print()
    print("=== Pass / fail ===")
    overall_ok = overall >= PASS_OVERALL
    char_ok = weakest >= PASS_PER_CHARACTER_F1
    print(f"  overall accuracy >= {PASS_OVERALL}: {'PASS' if overall_ok else 'FAIL'} ({overall:.4f})")
    print(f"  weakest char F1  >= {PASS_PER_CHARACTER_F1}: {'PASS' if char_ok else 'FAIL'} ({weakest_name} {weakest:.4f})")
    print()
    if overall_ok and char_ok:
        print("RESULT: PASS — Phase 2 done. Model + numbers saved.")
    else:
        print("RESULT: FAIL — needs investigation before declaring Phase 2 done.")


if __name__ == "__main__":
    main()
