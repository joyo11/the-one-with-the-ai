"""LLM-as-judge: score each reply 1-10 for in-characterness with reasoning.

Reads evals/data/scored_classifier.jsonl, asks Sonnet 4.6 to grade each reply,
writes evals/data/scored_final.jsonl with judge_score (1-10) and judge_reason.
"""
import json
import re
import sys
import time
from pathlib import Path

import anthropic
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / "agents" / ".env")

DATA_DIR = REPO_ROOT / "evals" / "data"
IN_PATH = DATA_DIR / "scored_classifier.jsonl"
OUT_PATH = DATA_DIR / "scored_final.jsonl"

JUDGE_MODEL = "claude-sonnet-4-6"

VOICE_NOTES = {
    "Monica": "Type-A perfectionist. Competitive, demanding, especially about cleanliness, cooking, and rules. Catchphrase: 'I KNOW!'",
    "Joey": "Easy-going actor. Loves food. Not the sharpest but big-hearted. Catchphrase: 'How you doin'?'",
    "Ross": "Nerdy paleontologist. Pedantic ('Actually...'). Three divorces. Loves dinosaurs.",
    "Chandler": "Self-deprecating, sarcastic. Uses humor to deflect. 'Could this BE any more...?'",
    "Rachel": "Started spoiled, grew into someone with taste. Works in fashion. Says 'Oh my god' a lot.",
    "Phoebe": "Quirky, unfiltered, chaotic past. Plays guitar. Believes in spirits. Says blunt things.",
}


def judge_prompt(character: str, probe: str, reply: str) -> str:
    return f"""You are an expert on the TV show Friends, scoring how well a candidate reply matches a character's voice.

Character: {character}
Voice profile: {VOICE_NOTES[character]}

The character was asked:
  USER: {probe}

The candidate reply (claimed to be {character}'s answer):
  REPLY: {reply}

Score the reply on a 1-10 scale for how convincingly it sounds like {character}:
  1-3 = wrong character entirely / generic / out of voice
  4-6 = somewhat plausible but missing the distinctive cues
  7-8 = clearly {character} — voice, vocabulary, energy match
  9-10 = nailed it — could be a real line from the show

Output STRICTLY this JSON format, nothing else:
{{"score": <int 1-10>, "reason": "<one short sentence>"}}"""


def parse(text: str) -> tuple[int | None, str]:
    # Find the JSON object in the response (handle minor formatting variance)
    m = re.search(r'\{[^}]*"score"\s*:\s*(\d+)[^}]*"reason"\s*:\s*"([^"]*)"[^}]*\}', text)
    if m:
        return int(m.group(1)), m.group(2)
    # Fallback: search for any number 1-10
    n = re.search(r"\b([1-9]|10)\b", text)
    return (int(n.group(1)) if n else None), text.strip()[:140]


def main() -> None:
    if not IN_PATH.exists():
        raise SystemExit(f"No classifier-scored input at {IN_PATH}. Run score_classifier.py first.")

    rows = [json.loads(line) for line in open(IN_PATH)]
    print(f"Judging {len(rows)} replies with {JUDGE_MODEL}")

    claude = anthropic.Anthropic(max_retries=8)
    scored = []
    started = time.monotonic()

    for i, r in enumerate(rows, 1):
        resp = claude.messages.create(
            model=JUDGE_MODEL,
            max_tokens=200,
            messages=[{"role": "user", "content": judge_prompt(r["character"], r["probe"], r["reply"])}],
        )
        text = next(b.text for b in resp.content if b.type == "text")
        score, reason = parse(text)
        r_out = {**r, "judge_score": score, "judge_reason": reason}
        scored.append(r_out)
        elapsed = time.monotonic() - started
        rate = i / elapsed
        eta = (len(rows) - i) / rate if rate else 0
        score_s = "?" if score is None else str(score)
        print(f"  [{i:>2d}/{len(rows)}] {r['character']:9s} score={score_s:>2s}  ({rate:.2f}/s, ETA {eta:.0f}s)", flush=True)

    with open(OUT_PATH, "w") as f:
        for s in scored:
            f.write(json.dumps(s) + "\n")
    print(f"\nSaved to {OUT_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
