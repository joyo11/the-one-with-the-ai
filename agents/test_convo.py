"""Local conversation test — runs the same routing + persona + Claude pipeline
the live bot uses, but prints to stdout instead of posting to Slack.

Useful for catching: routing bugs, identity confusion ("Monica replied as Ross"),
self-intro leaks ("Monica here"), hallucinated phases, broken trigger keywords.

Chandler owns this script as his Slack Convo QA tool.
"""
import os
import sys
from collections import defaultdict, deque
from pathlib import Path

import anthropic
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
sys.path.insert(0, str(Path(__file__).parent))
from app import (  # noqa: E402
    AGENTS,
    TRIGGERS,
    build_system_prompt,
    clean_reply,
    pick_agent,
    last_speaker,
    channel_history,
)

claude = anthropic.Anthropic()
CHANNEL = "test"


def send(user_text: str) -> None:
    print(f"\n  YOU: {user_text}")
    agent_key = pick_agent(user_text, CHANNEL)
    if agent_key is None:
        print(f"   →  [no agent matched, no last speaker — IGNORED]")
        return
    persona = AGENTS[agent_key]
    channel_history[CHANNEL].append({"role": "user", "content": user_text})
    messages = [
        {"role": e["role"], "content": e["content"]}
        for e in channel_history[CHANNEL]
    ]
    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=build_system_prompt(agent_key),
        messages=messages,
    )
    raw = next(b.text for b in response.content if b.type == "text")
    cleaned = clean_reply(raw)
    sanitized = " ✂️SELF-INTRO STRIPPED" if cleaned != raw else ""
    print(f"   →  [{persona['name']} {persona['emoji']}]{sanitized}")
    for line in cleaned.split("\n"):
        print(f"      {line}")
    channel_history[CHANNEL].append({"role": "assistant", "content": cleaned})
    last_speaker[CHANNEL] = agent_key


def reset():
    """Clear state between independent scenarios."""
    channel_history.clear()
    last_speaker.clear()


# ─── Scenarios reproducing Chandler's catches from the live Slack log ────────

print("=" * 70)
print("SCENARIO A — Reproduce the 11:28 bug:")
print("  Hey Monica → Monica replies → 'what's the update again'")
print("  EXPECTED: Monica continues (she was last speaker)")
print("=" * 70)
reset()
send("Hey Monica")
send("What's the update again one more time")

print()
print("=" * 70)
print("SCENARIO B — Reproduce the 11:29 identity-confusion bug:")
print("  Address Ross → Ross replies → user complains 'I asked Monica not u Ross' →")
print("  EXPECTED: Monica (or whoever is addressed) acknowledges Ross posted,")
print("            doesn't claim ownership of Ross's reply.")
print("=" * 70)
reset()
send("What's the update?")  # Routes via trigger or no-agent; might go anywhere
send("I asked Monica not Ross")

print()
print("=" * 70)
print("SCENARIO C — Cold start with no last speaker:")
print("  Bare 'Hey' with no prior context")
print("  EXPECTED: IGNORED (no name, no trigger, no last speaker)")
print("=" * 70)
reset()
send("Hey")

print()
print("=" * 70)
print("SCENARIO D — Cold start then question with 'status' word:")
print("  'What's the status' — 'status' isn't a trigger keyword")
print("  EXPECTED: IGNORED if cold start, last speaker otherwise")
print("=" * 70)
reset()
send("What's the status")

print()
print("=" * 70)
print("SCENARIO E — User reproduces full Slack flow exactly:")
print("=" * 70)
reset()
send("Is chandler here")
send("Hey")
send("Update on the project yapaa?")
send("Hey Monica")
send("What's the update again one more time")
