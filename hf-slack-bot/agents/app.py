"""Orchestrator for the Slack agent team.

One Slack bot, six personas. The router picks an agent per message
(by name-in-text, else trigger keyword, else last speaker), reads the
project state (STATUS.md + TIMELINE.md) and the persona's system prompt,
calls Claude, and posts the reply under the persona's display name + emoji
via chat:write.customize.
"""

import logging
import os
import re
from collections import defaultdict, deque
from pathlib import Path

import anthropic
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

from personas import AGENTS, TRIGGERS

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("the-one")

REPO_ROOT = Path(__file__).resolve().parent.parent
STATE_FILES = ("STATUS.md", "TIMELINE.md")

claude = anthropic.Anthropic()
slack_app = App(token=os.environ["SLACK_BOT_TOKEN"])

HISTORY_LEN = 10
channel_history: dict[str, deque] = defaultdict(lambda: deque(maxlen=HISTORY_LEN))
last_speaker: dict[str, str] = {}


def load_project_state() -> str:
    """Read STATUS.md + TIMELINE.md from repo root, return as one block.

    Re-read every call so changes are picked up without restarting the bot.
    """
    parts = []
    for name in STATE_FILES:
        path = REPO_ROOT / name
        if path.exists():
            parts.append(f"## {name}\n\n{path.read_text()}")
    if not parts:
        return ""
    return "\n\n---\n\n".join(parts)


# "@Name" or "Name," or "Name:" or "Name " at the very start of the message
# means the user is addressing that persona, even if other names appear later.
# e.g. "Ross, did Monica approve?" should go to Ross — not Monica via substring match.
_NAME_GROUP = "|".join(re.escape(p["name"]) for p in AGENTS.values())
_ADDRESSED_AT_START = re.compile(
    rf"^\s*@?({_NAME_GROUP})\b",
    re.IGNORECASE,
)


def pick_agent(text: str, channel: str) -> str | None:
    # 1. Addressed at the start ("Ross, ...", "Monica:", "@joey ...")
    m = _ADDRESSED_AT_START.match(text)
    if m:
        addressed = m.group(1).lower()
        for key, persona in AGENTS.items():
            if persona["name"].lower() == addressed:
                return key

    # 2. Name appears anywhere in the message
    lowered = text.lower()
    for key, persona in AGENTS.items():
        if persona["name"].lower() in lowered:
            return key

    # 3. Trigger keyword
    for key, triggers in TRIGGERS.items():
        for trigger in triggers:
            if trigger.lower() in lowered:
                return key

    # 4. Continue with whoever spoke last in this channel
    return last_speaker.get(channel)


def build_system_prompt(agent_key: str) -> str:
    persona = AGENTS[agent_key]
    state = load_project_state()
    if not state:
        return persona["system_prompt"]
    return (
        persona["system_prompt"]
        + "\n\n# CURRENT PROJECT STATE (ground your answers in this — never make up status)\n\n"
        + state
    )


# --- output sanitizer ---------------------------------------------------------
# The model still occasionally self-introduces ("**Monica here** —") or wraps
# replies in stage directions, despite the persona prompt forbidding it. We
# strip these patterns from the start of the reply before posting to Slack.
_NAMES_RE = "|".join(re.escape(p["name"]) for p in AGENTS.values())
_SELF_INTRO_PATTERNS = [
    # **Monica here** — / **Joey speaking:** / **Ross**:
    re.compile(rf"^\*\*({_NAMES_RE})(?:\s+(?:here|speaking))?\*\*[\s:—\-–.!,]*", re.I),
    # Monica here — / Joey speaking:
    re.compile(rf"^({_NAMES_RE})\s+(?:here|speaking)[\s:—\-–.!,]*", re.I),
    # Hi, I'm Monica — / Hey it's Ross —
    re.compile(rf"^(?:Hi|Hey|Hello|Greetings),?\s+(?:I'?m|it'?s)\s+({_NAMES_RE})[\s:—\-–.!,]*", re.I),
    # Leading stage direction: *(sips coffee)* / *adjusts glasses*
    re.compile(r"^\*[^\*\n]+\*[\s:—\-–.!,]*"),
]


def clean_reply(text: str) -> str:
    """Strip leading self-intros, stage directions, and wrapping quotes."""
    text = text.strip()
    # Strip wrapping quotes if the whole thing is quoted
    if len(text) >= 2 and text[0] in '"“' and text[-1] in '"”':
        text = text[1:-1].strip()
    # Iteratively strip leading garbage — one pattern per pass
    for _ in range(3):
        before = text
        for pat in _SELF_INTRO_PATTERNS:
            new = pat.sub("", text, count=1)
            if new != text:
                text = new.lstrip()
                break
        if text == before:
            break
    return text


def run_agent(agent_key: str, channel: str, user_text: str) -> str:
    messages = [
        {"role": entry["role"], "content": entry["content"]}
        for entry in channel_history[channel]
    ]
    messages.append({"role": "user", "content": user_text})

    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=build_system_prompt(agent_key),
        messages=messages,
    )
    return next(block.text for block in response.content if block.type == "text")


@slack_app.event("message")
def handle_message(event, client):
    if event.get("bot_id") or event.get("subtype") == "bot_message":
        return

    text = (event.get("text") or "").strip()
    if not text:
        return

    channel = event["channel"]
    agent_key = pick_agent(text, channel)
    if not agent_key:
        log.info("No agent matched and no last speaker; ignoring: %r", text[:80])
        return

    channel_history[channel].append({"role": "user", "content": text})

    try:
        raw_reply = run_agent(agent_key, channel, text)
        reply = clean_reply(raw_reply)
        if reply != raw_reply:
            log.info("Sanitized self-intro from %s's reply", AGENTS[agent_key]["name"])
    except Exception as e:
        log.exception("Agent call failed")
        reply = f"(error from {AGENTS[agent_key]['name']}: {e})"

    persona = AGENTS[agent_key]
    client.chat_postMessage(
        channel=channel,
        text=reply,
        username=persona["name"],
        icon_emoji=persona["emoji"],
    )

    channel_history[channel].append({"role": "assistant", "content": reply})
    last_speaker[channel] = agent_key


@slack_app.event("app_mention")
def handle_app_mention(event, client):
    handle_message(event, client)


if __name__ == "__main__":
    auth = slack_app.client.auth_test()
    log.info("Connected as %s (%s)", auth["user"], auth["user_id"])
    log.info("Personas: %s", ", ".join(p["name"] for p in AGENTS.values()))
    log.info("State files: %s (re-read per message)", ", ".join(STATE_FILES))
    SocketModeHandler(slack_app, os.environ["SLACK_APP_TOKEN"]).start()
