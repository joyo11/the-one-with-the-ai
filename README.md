# The One With the AI

A Friends-themed AI project — a non-commercial educational fan project. Built with Claude.

**Two things:**

1. **A web app** where you chat with one of six Friends characters (Monica, Joey, Ross, Chandler, Rachel, Phoebe). Replies are grounded in real lines from the show via RAG. Plus a **"Guess Who Said It"** trivia game — beat our AI classifier.
2. **A Slack-based control room** with the same six characters as a software-engineering team — Monica is the PM, Joey is the engineer, Ross is the AI lead, Chandler is QA, Rachel is the designer, Phoebe owns evals. They live in a Slack channel and read project state from `STATUS.md` so they always know what's happening.

## Repo layout

```
the-one-with-the-ai/
├── agents/      # Slack bot — 6 personas via chat:write.customize (Track A)
├── classifier/  # DistilBERT trained on Friends lines (Phase 2 of Track B)
├── chatbots/    # RAG chat: sentence-transformers + Claude Sonnet (Phase 3)
├── evals/       # Eval harness — classifier + LLM-as-judge scorecard (Phase 4)
├── server/      # FastAPI backend wrapping rag.py + /game + /watch
├── web/         # Next.js 14 frontend (Phase 6 — the actual product)
├── STATUS.md    # Always-current project state — Slack bot reads this every reply
├── TIMELINE.md  # Append-only milestone log
└── TEAM.md      # The 6-persona team convention
```

## Quick start

### 1. Chat with a character (CLI)

```bash
cd chatbots
./start.sh Joey      # or Monica, Ross, Chandler, Rachel, Phoebe
```

Builds the embedding index on first run (~1 min), then drops you into an interactive chat. Needs `ANTHROPIC_API_KEY` in `agents/.env`.

### 2. The whole web app (local)

```bash
# Backend (Python FastAPI)
cd server && ./start.sh                   # first run: precomputes game data, ~3-5 min on M2

# Frontend (Next.js, separate terminal)
cd web && npm install && npm run dev      # → http://localhost:3000 (or 3001 if 3000 is taken)
```

### 3. The Slack team

```bash
cd agents && ./start_bg.sh                # detached, logs to bot.log
```

Set `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `ANTHROPIC_API_KEY` in `agents/.env` (copy from `.env.example`). Bot needs Socket Mode enabled.

## Phase summary

| Phase | What | Status |
|---|---|---|
| 1 | Slack team minimal (Track A) | ✅ |
| 2 | DistilBERT classifier (Phase 2 of Track B) | ✅ 33.2% (matches academic baseline for isolated-line 6-way) |
| 3 | RAG chatbot baseline | ✅ all 6 characters voiced |
| 4 | Eval harness (classifier + LLM-judge) | ✅ 80% clf match, 8.4/10 judge avg on 30 probes |
| 5 | Slack-bot terminal access (Joey gets hands) | deferred |
| 6 | Frontend + Vercel deploy | ✅ |
| 7 | Fine-tuning per-character | skipped — RAG quality is strong enough |

## Stack

- **Python** for everything backend — DistilBERT (transformers), sentence-transformers, FastAPI, Slack Bolt
- **TypeScript / Next.js 14** App Router for the frontend
- **Tailwind CSS** + **Motion** (Framer Motion 11) for the UI
- **Claude Sonnet 4.6** for generation (via the Anthropic API)
- **DistilBERT** fine-tuned on Apple M2 MPS for the classifier
- **Vercel** for frontend hosting

## IP guardrails

This is a **non-commercial educational fan project**. Per the brief:
- No screenshots, no actor photos, no clip embedding.
- Character avatars are typographic (initials in Permanent Marker) — never emoji, never actor likenesses.
- Source transcripts are gitignored — the project ships with the scripts to fetch and process them, not the transcripts themselves.
- "Where to watch" links out to JustWatch — never embeds video.
- Friends™ is owned by Warner Bros.

## Credits

Built by [Shafay](https://github.com/joyo11) with help from Claude.
