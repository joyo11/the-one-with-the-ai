#!/usr/bin/env bash
# Foreground starter — runs in your terminal, prints logs, exits on Ctrl+C.
# For persistent background: use start_bg.sh instead.
set -e
cd "$(dirname "$0")"

# Refuse to start if another bot instance is already running — zombies cause
# duplicate replies and weird routing because each instance has its own
# last-speaker memory.
EXISTING=$(pgrep -f "python app.py" || true)
if [ -n "$EXISTING" ]; then
  echo "ERROR: Bot already running (PID: $EXISTING)"
  echo "Stop it first: ./stop.sh"
  exit 1
fi

if [ ! -d .venv ]; then
  echo ">> creating .venv"
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt
exec python app.py
