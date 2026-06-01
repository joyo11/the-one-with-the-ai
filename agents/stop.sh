#!/usr/bin/env bash
# Stop any background bot process.
PID=$(pgrep -f "python app.py" || true)
if [ -z "$PID" ]; then
  echo "Bot not running."
  exit 0
fi
echo "Stopping bot (PID: $PID)..."
kill "$PID"
sleep 1
if pgrep -f "python app.py" >/dev/null; then
  echo "Still alive — sending SIGKILL"
  kill -9 "$PID"
fi
echo "Stopped."
