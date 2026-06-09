#!/usr/bin/env python3
"""Upgrade authored scene dialogue to verbatim where the real transcript matches.

For each scene in web/lib/episodes.ts:
  1. Find the matching real EmoryNLP episode (mapping in MAP below).
  2. Collect all real utterances from that episode for the relevant characters.
  3. For each authored line, look for a fuzzy match in the real lines for the
     same character. If the Jaccard similarity is >= THRESHOLD, replace.
  4. Print a diff. Do NOT touch the file unless --apply is passed.

Usage:
  python3 scripts/upgrade_scene_dialogue.py           # dry-run with diff
  python3 scripts/upgrade_scene_dialogue.py --apply   # write changes

Mapping below covers all 8 episodes the player ships with.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
RAW_DIR = REPO / "classifier" / "data" / "raw"
EPISODES_TS = REPO / "web" / "lib" / "episodes.ts"

THRESHOLD_REPLACE = 0.85  # only swap in real lines that are essentially verbatim — fuzzy
                          # context matching by Jaccard alone trips on common words and
                          # pulls in lines from the wrong scene. The disclaimer covers
                          # everything else as canonical-style adaptation.
THRESHOLD_VERBATIM = 0.85

# Map our scene-ID prefix → list of (season, episode) tuples to search.
# We search the union — "The Last One" is two parts so we cover both.
OUR_EP_TO_REAL = {
    "no-ones-ready": [(3, 2)],
    "everybody-finds-out": [(5, 14)],
    "embryos": [(4, 12)],
    "prom-video": [(2, 14)],
    "thanksgiving-flashbacks": [(5, 8)],
    "the-prom": [(9, 8)],  # actually "The One With Rachel's Other Sister"; show s9e8
    "last-one": [(10, 17), (10, 18)],
    "the-birth": [(1, 23)],
}

# Our short name → EmoryNLP full name.
NAME_MAP = {
    "Monica": "Monica Geller",
    "Joey": "Joey Tribbiani",
    "Ross": "Ross Geller",
    "Chandler": "Chandler Bing",
    "Rachel": "Rachel Green",
    "Phoebe": "Phoebe Buffay",
}
REVERSE_NAME_MAP = {v: k for k, v in NAME_MAP.items()}


def normalize(s: str) -> str:
    s = re.sub(r"[^a-z0-9 ]", " ", s.lower())
    return re.sub(r"\s+", " ", s).strip()


def load_real_lines(season_eps: list[tuple[int, int]]) -> dict[str, list[str]]:
    """Return {short_name: [real_line, ...]} for the given (season, episode) pairs."""
    out: dict[str, list[str]] = {k: [] for k in NAME_MAP}
    for season, ep in season_eps:
        season_path = RAW_DIR / f"friends_season_{season:02d}.json"
        if not season_path.exists():
            print(f"  WARN: missing {season_path}", file=sys.stderr)
            continue
        data = json.loads(season_path.read_text())
        ep_obj = next(
            (e for e in data["episodes"] if int(e["episode_id"].split("_e")[1]) == ep),
            None,
        )
        if ep_obj is None:
            print(f"  WARN: no episode s{season:02d}e{ep:02d}", file=sys.stderr)
            continue
        for scene in ep_obj.get("scenes", []):
            for u in scene.get("utterances", []):
                speakers = u.get("speakers") or []
                transcript = (u.get("transcript") or "").strip()
                if not transcript or not speakers:
                    continue
                # If a single speaker we know, attribute. Multi-speaker = chorus, skip.
                if len(speakers) == 1:
                    full = speakers[0]
                    short = REVERSE_NAME_MAP.get(full)
                    if short:
                        out[short].append(transcript)
    return out


def jaccard(a: str, b: str) -> float:
    aw, bw = set(a.split()), set(b.split())
    if not aw or not bw:
        return 0.0
    return len(aw & bw) / max(len(aw), len(bw))


def best_match(needle_norm: str, pool: list[str]) -> tuple[float, str]:
    best = (0.0, "")
    for real in pool:
        r = jaccard(needle_norm, normalize(real))
        if r > best[0]:
            best = (r, real)
        if r >= THRESHOLD_VERBATIM:
            break
    return best


def parse_dialogue_blocks(ts: str):
    """Yield (episode_id, scene_id, start_offset, end_offset, lines)
    where lines is a list of {speaker, text, m: span} tuples for the authored
    dialogue arrays inside lib/episodes.ts. We work at the line level so we
    can do surgical text replacement without touching duration_ms etc."""
    # For each "dialogue: [ ... ]" array, capture span.
    # We scan one scene at a time by locating "id:" then "dialogue:" if present.
    pat_scene_id = re.compile(r'id:\s*"([a-z0-9-]+)"')
    # Look for dialogue arrays at scene level
    pat_dialogue = re.compile(r"dialogue:\s*\[", re.DOTALL)

    # Crawl: for each dialogue: [ ... ], capture each
    # { speaker: "X", text: "Y" ... } line with its span.
    line_pat = re.compile(
        r'(\{\s*speaker:\s*"([^"]+)"\s*,\s*text:\s*")((?:[^"\\]|\\.)*)("[^}]*\})',
        re.DOTALL,
    )

    # Also track current episode id from the surrounding episode object
    # We'll attribute lines to most-recent id we saw.
    # Simple, surgical: just yield (speaker, text_with_quotes_span)
    for m in line_pat.finditer(ts):
        prefix, speaker, text_inner, suffix = m.group(1), m.group(2), m.group(3), m.group(4)
        yield {
            "speaker": speaker,
            "text": text_inner.encode().decode("unicode_escape"),
            "text_span": (m.start() + len(prefix), m.start() + len(prefix) + len(text_inner)),
        }


def find_scene_episode(ts: str, char_pos: int) -> tuple[str, str]:
    """Given a character offset, walk backward to find the enclosing scene id
    and episode id. Returns (episode_id, scene_id)."""
    before = ts[:char_pos]
    # Find last "id:" within last episode block
    # Scene ids are nested inside scenes: array of an episode. Both use id: "..."
    # We'll grab all ids before this position; assume the structure is
    # episode { id: "ep", scenes: [ { id: "scene", ... } ] }
    # So the last id BEFORE the dialogue is the scene id, and the one before
    # that (if any) at a smaller indent is the episode id.
    ids = re.findall(r'id:\s*"([a-z0-9-]+)"', before)
    if not ids:
        return ("?", "?")
    scene_id = ids[-1]
    # Find an episode id matching our map
    episode_id = "?"
    for prev in reversed(ids[:-1]):
        if prev in OUR_EP_TO_REAL:
            episode_id = prev
            break
    return (episode_id, scene_id)


def main(apply: bool) -> int:
    ts = EPISODES_TS.read_text()

    # Pre-load real lines per episode group
    real_per_episode = {ep_id: load_real_lines(maps) for ep_id, maps in OUR_EP_TO_REAL.items()}

    # We'll collect replacements as a list of (text_span, new_text, old_text, score, ep_id, scene_id)
    replacements: list[dict] = []
    keep = 0

    for entry in parse_dialogue_blocks(ts):
        if entry["speaker"] not in NAME_MAP:
            keep += 1
            continue
        ep_id, scene_id = find_scene_episode(ts, entry["text_span"][0])
        if ep_id not in real_per_episode:
            keep += 1
            continue
        pool = real_per_episode[ep_id].get(entry["speaker"], [])
        if not pool:
            keep += 1
            continue
        needle = normalize(entry["text"])
        score, real_line = best_match(needle, pool)
        if score >= THRESHOLD_REPLACE:
            replacements.append({
                "old": entry["text"],
                "new": real_line.strip(),
                "score": score,
                "ep_id": ep_id,
                "scene_id": scene_id,
                "speaker": entry["speaker"],
                "text_span": entry["text_span"],
            })
        else:
            keep += 1

    print(f"\n=== AUDIT ===")
    print(f"  authored lines scanned:    {len(replacements) + keep}")
    print(f"  matched (will upgrade):    {len(replacements)}")
    print(f"  kept as canonical-style:   {keep}")
    print(f"  threshold: replace ≥{THRESHOLD_REPLACE}, verbatim ≥{THRESHOLD_VERBATIM}")
    print()

    # Print the diff
    print("=== DIFF ===")
    for r in sorted(replacements, key=lambda x: -x["score"])[:30]:
        tag = "VERBATIM" if r["score"] >= THRESHOLD_VERBATIM else "CLOSE   "
        print(f"\n[{tag} {r['score']:.2f}] {r['ep_id']} / {r['scene_id']} / {r['speaker']}")
        print(f"  -  {r['old'][:130]}")
        print(f"  +  {r['new'][:130]}")
    if len(replacements) > 30:
        print(f"\n  ... and {len(replacements) - 30} more.")

    if not apply:
        print("\n(dry run — pass --apply to write changes)")
        return 0

    # Apply replacements in reverse order so spans stay valid
    new_ts = ts
    for r in sorted(replacements, key=lambda x: -x["text_span"][0]):
        start, end = r["text_span"]
        escaped = r["new"].replace("\\", "\\\\").replace('"', '\\"')
        new_ts = new_ts[:start] + escaped + new_ts[end:]
    EPISODES_TS.write_text(new_ts)
    print(f"\n✓ wrote {len(replacements)} upgrades to {EPISODES_TS.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(apply="--apply" in sys.argv))
