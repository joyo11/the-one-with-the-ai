#!/usr/bin/env bash
# Background starter — detaches from terminal, survives shell exit, logs to bot.log.
set -e
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  echo ">> creating .venv"
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

# Already running? Don't double-start.
if pgrep -fl "python app.py" >/dev/null; then
  echo "Bot already running (PID: $(pgrep -f 'python app.py'))"
  echo "To stop: ./stop.sh"
  exit 0
fi

nohup python app.py > bot.log 2>&1 &
PID=$!
disown
echo "Bot started in background (PID: $PID)"
echo "Log:  tail -f $(pwd)/bot.log"
echo "Stop: ./stop.sh"
