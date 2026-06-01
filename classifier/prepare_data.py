"""Phase 2 — data prep.

Fetches the emorynlp Friends transcript dataset (one JSON per season,
10 seasons total), filters to the six main characters, drops noise,
and writes a clean (speaker, line) CSV for training.

Drop rules (Phoebe's edge cases):
  - joint dialogue (more than one speaker per utterance)
  - speaker not in the six main characters
  - line tokenizes to fewer than 4 tokens (e.g. "Hi.")

Output: classifier/data/clean/lines.csv with columns: speaker, line
"""

import csv
import json
import urllib.request
from collections import Counter
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_ROOT / "classifier" / "data" / "raw"
CLEAN_DIR = REPO_ROOT / "classifier" / "data" / "clean"
OUTPUT_CSV = CLEAN_DIR / "lines.csv"

DATASET_BASE = "https://raw.githubusercontent.com/emorynlp/character-mining/master/json"
SEASONS = range(1, 11)  # seasons 1-10

# Full speaker names in the source → short label we use as the class
SIX_MAIN = {
    "Monica Geller": "Monica",
    "Joey Tribbiani": "Joey",
    "Ross Geller": "Ross",
    "Chandler Bing": "Chandler",
    "Rachel Green": "Rachel",
    "Phoebe Buffay": "Phoebe",
}

MIN_TOKENS = 4


def download_seasons() -> list[Path]:
    """Download each season JSON into data/raw/ (skip if already cached)."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    paths = []
    for n in SEASONS:
        path = RAW_DIR / f"friends_season_{n:02d}.json"
        if not path.exists():
            url = f"{DATASET_BASE}/friends_season_{n:02d}.json"
            print(f"  downloading season {n}...")
            urllib.request.urlretrieve(url, path)
        paths.append(path)
    return paths


def iter_utterances(season_paths: list[Path]):
    """Yield (speakers, transcript, token_count) for every utterance, all seasons."""
    for path in season_paths:
        with open(path) as f:
            season = json.load(f)
        for episode in season["episodes"]:
            for scene in episode["scenes"]:
                for utt in scene["utterances"]:
                    speakers = utt.get("speakers") or []
                    transcript = (utt.get("transcript") or "").strip()
                    if not transcript:
                        continue
                    # Token count = sum across pre-tokenized sentences
                    tokens = utt.get("tokens") or []
                    token_count = sum(len(s) for s in tokens)
                    yield speakers, transcript, token_count


def clean_and_collect(season_paths: list[Path]) -> tuple[list[tuple[str, str]], Counter]:
    """Apply drop rules. Return (rows, drop_counter)."""
    rows: list[tuple[str, str]] = []
    dropped = Counter()
    total = 0

    for speakers, transcript, token_count in iter_utterances(season_paths):
        total += 1
        if len(speakers) != 1:
            dropped["joint_or_no_speaker"] += 1
            continue
        speaker = speakers[0]
        if speaker not in SIX_MAIN:
            dropped["not_main_six"] += 1
            continue
        if token_count < MIN_TOKENS:
            dropped["too_short"] += 1
            continue
        rows.append((SIX_MAIN[speaker], transcript))

    dropped["TOTAL_INPUT"] = total
    return rows, dropped


def write_csv(rows: list[tuple[str, str]]) -> None:
    CLEAN_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["speaker", "line"])
        w.writerows(rows)


def main():
    print("Fetching emorynlp Friends dataset (10 seasons)")
    season_paths = download_seasons()

    print("Cleaning + filtering")
    rows, dropped = clean_and_collect(season_paths)

    print("Writing", OUTPUT_CSV.relative_to(REPO_ROOT))
    write_csv(rows)

    total_in = dropped.pop("TOTAL_INPUT")
    print()
    print(f"=== Stats ===")
    print(f"Total utterances seen:    {total_in:,}")
    print(f"  dropped (joint speaker): {dropped['joint_or_no_speaker']:,}")
    print(f"  dropped (not main six):  {dropped['not_main_six']:,}")
    print(f"  dropped (< {MIN_TOKENS} tokens):     {dropped['too_short']:,}")
    print(f"Kept:                     {len(rows):,}")
    print()
    print("Per-character balance:")
    balance = Counter(r[0] for r in rows)
    for name in ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"]:
        n = balance[name]
        pct = 100 * n / len(rows) if rows else 0
        print(f"  {name:9s} {n:>6,}  ({pct:5.2f}%)")


if __name__ == "__main__":
    main()
