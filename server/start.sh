#!/usr/bin/env bash
# Start the FastAPI backend on port 8000.
# First run: creates venv, installs deps, precomputes game data (one-time).
set -e
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  echo ">> creating .venv"
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

if [ ! -f game_lines.jsonl ]; then
  echo ">> precomputing game data (one-time, ~3-5 min on M2)"
  python precompute_game_lines.py
fi

PORT="${PORT:-8000}"
echo ">> starting server on http://localhost:$PORT"
exec uvicorn main:app --reload --host 0.0.0.0 --port "$PORT"
