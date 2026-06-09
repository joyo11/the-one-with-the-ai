# Hugging Face Spaces (Docker SDK) — FastAPI backend for The One With the AI.
# Listens on port 7860 (HF default).
FROM python:3.11-slim

# Set HF cache to a writeable location at the Space's tmp area to avoid
# permission errors on the read-only image layers.
ENV HF_HOME=/tmp/hf-cache \
    TRANSFORMERS_CACHE=/tmp/hf-cache \
    SENTENCE_TRANSFORMERS_HOME=/tmp/hf-cache \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# Mirror the repo layout main.py expects:
#   /app/server/main.py reads ../chatbots/index/ and ./game_lines.jsonl
COPY main.py            /app/server/main.py
COPY game_lines.jsonl   /app/server/game_lines.jsonl
COPY index              /app/chatbots/index

WORKDIR /app/server

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
