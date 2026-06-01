# The One With the AI — Web

Next.js 14 (App Router) + Tailwind + Motion. Talks to the FastAPI backend in `../server/`.

## Quick start

```bash
cd web
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000.

Make sure the backend is running: `cd ../server && ./start.sh`.

## Stack

- **Next.js 14** App Router, TypeScript
- **Tailwind v3** with CSS variables for tokens
- **Motion** (Framer Motion 11+) for animations
- **next-themes** for light/dark mode

## Env vars

- `NEXT_PUBLIC_API_URL` — backend URL (default `http://localhost:8000`)

## Routes

- `/` — landing (Central Perk hero + character picker + game CTA)
- `/chat/[character]` — chat surface with streaming RAG
- `/game` — Guess Who Said It

## Backend endpoints used

- `POST /chat` — streaming SSE (`{character, messages[]}` → `data: {delta}` chunks)
- `GET /watch?character=X` — JustWatch links
- `GET /game/round` — random Friends line + classifier prediction

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel, set the project root to `web/`.
3. Set `NEXT_PUBLIC_API_URL` env var to the deployed backend URL.

## Design reference

- `mockups.html` — the original interactive design canvas (open in browser to explore).
- `DESIGN_BRIEF.md` — the spec.
- `design-reference/design-chat-transcript.md` — the back-and-forth that produced the design.
