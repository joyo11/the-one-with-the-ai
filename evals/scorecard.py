"""Aggregate scorecard: per-character accuracy + judge average + worst replies.

Reads evals/data/scored_final.jsonl. Prints a table to stdout and writes
evals/scorecard.csv for archival.
"""
import csv
import json
from collections import defaultdict
from pathlib import Path
from statistics import mean, stdev

REPO_ROOT = Path(__file__).resolve().parent.parent
IN_PATH = REPO_ROOT / "evals" / "data" / "scored_final.jsonl"
OUT_CSV = REPO_ROOT / "evals" / "scorecard.csv"


def main() -> None:
    if not IN_PATH.exists():
        raise SystemExit(f"No final scored data at {IN_PATH}. Run score_judge.py first.")

    rows = [json.loads(line) for line in open(IN_PATH)]
    by_char: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_char[r["character"]].append(r)

    print()
    print("=" * 80)
    print(f"=== Phase 4 — Eval Harness Scorecard ({len(rows)} replies) ===")
    print("=" * 80)
    header = f"  {'character':9s}  {'n':>3s}  {'clf match':>10s}  {'judge avg':>10s}  {'judge std':>10s}  {'min':>4s}"
    print(header)
    print("  " + "-" * (len(header) - 2))

    csv_rows = []
    for char in ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"]:
        items = by_char[char]
        n = len(items)
        clf_match = sum(1 for it in items if it["classifier_match"])
        clf_rate = clf_match / n if n else 0
        scores = [it["judge_score"] for it in items if it["judge_score"] is not None]
        avg = mean(scores) if scores else 0
        sd = stdev(scores) if len(scores) > 1 else 0
        worst = min(scores) if scores else 0
        print(f"  {char:9s}  {n:>3d}  {clf_match}/{n} ({100*clf_rate:>4.0f}%)  {avg:>10.2f}  {sd:>10.2f}  {worst:>4d}")
        csv_rows.append({
            "character": char,
            "n": n,
            "classifier_match_rate": round(clf_rate, 4),
            "judge_avg": round(avg, 2),
            "judge_stdev": round(sd, 2),
            "judge_min": worst,
        })

    # Overall summary line
    overall_clf = sum(1 for r in rows if r["classifier_match"]) / len(rows)
    all_scores = [r["judge_score"] for r in rows if r["judge_score"] is not None]
    overall_avg = mean(all_scores) if all_scores else 0
    overall_sd = stdev(all_scores) if len(all_scores) > 1 else 0
    print("  " + "-" * (len(header) - 2))
    print(f"  {'OVERALL':9s}  {len(rows):>3d}  {100*overall_clf:>9.0f}%  {overall_avg:>10.2f}  {overall_sd:>10.2f}")

    # Worst-scoring replies for Phoebe to inspect
    print()
    print("=" * 80)
    print("=== Lowest-scoring replies (Phoebe's queue for inspection) ===")
    print("=" * 80)
    worst = sorted(rows, key=lambda r: (r["judge_score"] or 0))[:5]
    for r in worst:
        score = r["judge_score"]
        clf = "✓" if r["classifier_match"] else "✗"
        print(f"\n  [{r['character']} | judge={score} | clf={clf} → {r['classifier_pred']}]")
        print(f"    PROBE : {r['probe']}")
        print(f"    REPLY : {r['reply'][:200]}{'...' if len(r['reply']) > 200 else ''}")
        print(f"    JUDGE : {r['judge_reason']}")

    # CSV out
    with open(OUT_CSV, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(csv_rows[0].keys()))
        w.writeheader()
        w.writerows(csv_rows)
    print(f"\nSaved scorecard to {OUT_CSV.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
