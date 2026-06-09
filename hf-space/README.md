---
title: The One With the AI — Backend
emoji: 🛋️
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# The One With the AI — Backend

FastAPI backend for [howudoinai.vercel.app](https://howudoinai.vercel.app).
Wraps a sentence-transformers retrieval index + Claude (Anthropic SDK) for
in-character chat with the six Friends characters, and serves a Guess Who
Said It round endpoint backed by a DistilBERT classifier (predictions
pre-computed offline).

Source: [github.com/joyo11/the-one-with-the-ai](https://github.com/joyo11/the-one-with-the-ai)

Educational, non-commercial fan project. Friends™ is owned by Warner Bros.

## Endpoints

- `POST /chat` — streaming SSE; body `{character, messages[]}`
- `GET /watch?character=Name` — JustWatch links for Friends
- `GET /game/round` — one random Friends line with the AI classifier's prediction
