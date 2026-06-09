"""HF Spaces wrapper for the Slack bot.

HF Docker Spaces require a process listening on a port (default 7860).
The Slack bot runs Socket Mode (outbound websocket) and doesn't need
its own port, so this wrapper spawns the bot in a background thread
and exposes a tiny FastAPI health endpoint on 7860 to satisfy HF's
readiness check.
"""

import os
import sys
import threading
from pathlib import Path

# Make `agents` importable as a package from the HF working dir.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
import uvicorn
from slack_bolt.adapter.socket_mode import SocketModeHandler

# Import the configured Slack Bolt app (with all handlers registered)
from agents.app import slack_app


def start_slack_bot():
    auth = slack_app.client.auth_test()
    print(
        f"[slack] connected as {auth['user']} ({auth['user_id']})",
        flush=True,
    )
    SocketModeHandler(slack_app, os.environ["SLACK_APP_TOKEN"]).start()


# Spawn the bot in a daemon thread. SocketModeHandler.start() blocks; this
# keeps the process alive while uvicorn serves the health endpoint.
bot_thread = threading.Thread(target=start_slack_bot, daemon=True)
bot_thread.start()


app = FastAPI(title="Friends Slack bot health")


@app.get("/")
def root():
    return {
        "service": "The One With the AI Slack bot",
        "slack_thread_alive": bot_thread.is_alive(),
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
