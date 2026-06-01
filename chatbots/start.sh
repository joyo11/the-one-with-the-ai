#!/usr/bin/env bash
# One-time index build + interactive chat with a character.
# First run takes ~2 min (downloads MiniLM, builds 6 indices). Subsequent runs <5s.
set -e
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  echo ">> creating .venv"
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

# Build indices if missing
if [ ! -f index/Joey.emb.npy ]; then
  echo ">> building character indices (first run only)"
  python build_index.py
fi

CHARACTER="${1:-Joey}"
echo ">> starting chat with $CHARACTER"
exec python rag.py --character "$CHARACTER"
