"""LLM-as-classifier eval.

Run Claude on the held-out test split (same one DistilBERT was scored on),
ask it to predict the speaker for each line, compute accuracy + per-character F1.
Cheapest-first model ordering: Haiku 4.5 → Sonnet 4.6 → Opus 4.7.

Usage:
    python eval_with_llm.py                   # default: Haiku 4.5
    python eval_with_llm.py --model sonnet    # claude-sonnet-4-6
    python eval_with_llm.py --model opus      # claude-opus-4-7
    python eval_with_llm.py --limit 200       # spot-check on N lines first
"""

import argparse
import asyncio
import json
import random
import re
from collections import Counter, defaultdict
from pathlib import Path
from time import monotonic

import anthropic
from dotenv import load_dotenv
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
TEST_SPLIT = REPO_ROOT / "classifier" / "models" / "test_split.json"
load_dotenv(REPO_ROOT / "agents" / ".env")

LABELS = ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"]
LABEL2ID = {n: i for i, n in enumerate(LABELS)}

MODEL_ALIASES = {
    "haiku": "claude-haiku-4-5",
    "sonnet": "claude-sonnet-4-6",
    "opus": "claude-opus-4-7",
}

SYSTEM_PROMPT = (
    "You are classifying lines from the TV show Friends. "
    "Given a single line of dialogue, predict which of the six main characters spoke it: "
    "Monica, Joey, Ross, Chandler, Rachel, Phoebe. "
    "Reply with ONLY the character's first name — one word, no explanation, no punctuation."
)

_NAME_RE = re.compile(rf"\b({'|'.join(LABELS)})\b", re.IGNORECASE)


def parse_prediction(text: str) -> str | None:
    """Find the first character name in the model's reply; case-insensitive."""
    m = _NAME_RE.search(text)
    if not m:
        return None
    name = m.group(1).capitalize()
    return name if name in LABELS else None


async def classify(
    client: anthropic.AsyncAnthropic,
    model: str,
    idx: int,
    line: str,
    sem: asyncio.Semaphore,
) -> tuple[int, str | None]:
    """Return (original_index, predicted_name) so caller can preserve order."""
    async with sem:
        resp = await client.messages.create(
            model=model,
            max_tokens=20,
            # System prompt cached — saves ~90% on repeated input tokens.
            system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": line}],
        )
        text = next((b.text for b in resp.content if b.type == "text"), "")
        return idx, parse_prediction(text)


def stratified_subsample(
    texts: list[str], labels: list[int], n_per_class: int, seed: int = 42
) -> tuple[list[str], list[int]]:
    """Pick N samples per character for a fast directional read."""
    rng = random.Random(seed)
    by_label: dict[int, list[int]] = defaultdict(list)
    for i, y in enumerate(labels):
        by_label[y].append(i)
    chosen: list[int] = []
    for y, idxs in by_label.items():
        rng.shuffle(idxs)
        chosen.extend(idxs[:n_per_class])
    rng.shuffle(chosen)
    return [texts[i] for i in chosen], [labels[i] for i in chosen]


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="haiku", choices=list(MODEL_ALIASES))
    ap.add_argument("--limit", type=int, default=None, help="Cap to first N lines (no stratification)")
    ap.add_argument("--stratified", type=int, default=100,
                    help="Stratified samples per character (default 100 → 600 total). "
                         "Use --full to override.")
    ap.add_argument("--full", action="store_true", help="Run on full test set (4282 lines)")
    ap.add_argument("--concurrency", type=int, default=3,
                    help="Concurrent requests. Default 3 keeps under low-tier 50 RPM.")
    args = ap.parse_args()

    if not TEST_SPLIT.exists():
        raise SystemExit(f"No test split at {TEST_SPLIT}. Run classifier/train.py first.")

    model_id = MODEL_ALIASES[args.model]
    test = json.load(open(TEST_SPLIT))
    texts: list[str] = test["texts"]
    y_true: list[int] = test["labels"]

    if args.full:
        pass  # use all
    elif args.limit:
        texts, y_true = texts[: args.limit], y_true[: args.limit]
    else:
        texts, y_true = stratified_subsample(texts, y_true, args.stratified)

    print(f"Model:       {model_id}")
    print(f"Test set:    {len(texts):,} lines  ({'full' if args.full else 'stratified subsample' if not args.limit else 'first N'})")
    print(f"Concurrency: {args.concurrency}")
    print()

    # max_retries=8 so SDK auto-backs-off on 429s without us losing requests.
    client = anthropic.AsyncAnthropic(max_retries=8)
    sem = asyncio.Semaphore(args.concurrency)

    started = monotonic()
    tasks = [classify(client, model_id, i, line, sem) for i, line in enumerate(texts)]

    # Allocate aligned slot per index; populate as each task completes.
    preds: list[int] = [-1] * len(texts)
    done = 0
    for coro in asyncio.as_completed(tasks):
        idx, pred_name = await coro
        preds[idx] = LABEL2ID[pred_name] if pred_name else -1
        done += 1
        if done % 50 == 0 or done == len(texts):
            elapsed = monotonic() - started
            rate = done / elapsed
            eta = (len(texts) - done) / rate if rate else 0
            print(f"  {done:>5,} / {len(texts):,}  ({rate:.1f}/s, ETA {eta:.0f}s)", flush=True)

    elapsed = monotonic() - started
    print(f"\nDone in {elapsed:.1f}s.")
    y_pred = preds

    # Drop any failures (-1) from metrics
    valid = [(t, p) for t, p in zip(y_true, y_pred) if p != -1]
    skipped = len(y_pred) - len(valid)
    if skipped:
        print(f"  ⚠ {skipped} predictions could not be parsed (model returned no recognized name)")

    yt, yp = zip(*valid)
    overall = accuracy_score(yt, yp)
    macro_f1 = f1_score(yt, yp, average="macro")
    per_class_f1 = f1_score(yt, yp, average=None, labels=list(range(len(LABELS))))

    print()
    print("=" * 60)
    print(f"=== {model_id} on {len(valid):,} lines ===")
    print("=" * 60)
    print(f"  accuracy : {overall:.4f}")
    print(f"  macro F1 : {macro_f1:.4f}")
    print()
    print(classification_report(yt, yp, target_names=LABELS, digits=3, zero_division=0))

    print("=== Confusion matrix (rows = truth, cols = predicted) ===")
    cm = confusion_matrix(yt, yp, labels=list(range(len(LABELS))))
    print("           " + "  ".join(f"{n[:5]:>5s}" for n in LABELS))
    for i, name in enumerate(LABELS):
        row = "  ".join(f"{cm[i][j]:>5d}" for j in range(len(LABELS)))
        print(f"  {name[:8]:8s} {row}")

    print()
    print(f"=== Comparison vs DistilBERT (33.2%) ===")
    delta = (overall - 0.332) * 100
    direction = "+" if delta >= 0 else ""
    print(f"  {model_id}: {overall:.2%}  ({direction}{delta:.1f}pp vs DistilBERT)")


if __name__ == "__main__":
    asyncio.run(main())
