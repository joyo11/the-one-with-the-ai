# The One With the AI

> A Friends-themed AI fan project. Pull up a chair, sit on the orange couch, and chat with the cast — grounded in every line they ever said on the show, with memory, proactive texts, and scene-by-scene immersion.

**Live:** [howudoinai.vercel.app](https://howudoinai.vercel.app)
**Source:** [github.com/joyo11/the-one-with-the-ai](https://github.com/joyo11/the-one-with-the-ai)
**Status:** Phase 8 complete — production-ready. Free to host at small-to-medium scale.

---

## Why this exists

Most "chat with a character" apps are thin wrappers around an LLM prompt — paste *"you are Joey from Friends"* into a system message and call it a day. The output sounds like a Wikipedia summary of Joey, not Joey.

This project goes the other way: **the characters are grounded in the show's 42,000+ cleaned lines of dialogue** via retrieval-augmented generation, plus a relationship layer (memory, proactive texts, a "living world" of events) so they feel like friends you keep coming back to, not chatbots you tried once.

It started as an exercise in building a complete AI product end-to-end — classifier, embeddings, RAG, evals, frontend, deploy, plus a meta-team of six AI agents (the cast themselves) acting as engineers / designers / PMs in the build process. Phase 8 then turned it from a tech demo into a real consumer product.

## What you can do in the live app

| Surface | What it does |
|---|---|
| **Chat** | Pick a character, talk to them. Replies are RAG-grounded in 42,819 cleaned lines from all 10 seasons. They remember you across sessions. |
| **Watch with the cast** | 8 iconic episodes × 25 hand-curated scenes. Tap a scene → cinematic player auto-advances canonical-style dialogue → pause anytime to ask a character what they're thinking. Your input is woven into their next line. |
| **The Lab** | 6 one-shot character tools: Joey writes your comeback, Monica reorganizes your messy email, Ross over-explains a topic, Chandler quips, Rachel rates an outfit, Phoebe writes a Smelly-Cat-style song about your day. Output is screenshot-ready. |
| **Guess Who Said It** | Quiz mode. Read a real line from the show, pick the speaker, see if our fine-tuned DistilBERT classifier guessed the same. |
| **Texts from the gang** | Opt-in to Web Push. Every couple of hours the cron picks an unmuted character with something from their calendar (a Joey audition, a Monica dinner, a Phoebe gig) and texts you about it. Pause-and-ask any of them anytime. |

## The five "Phase 8" pillars (the relationship layer)

1. **Be the 7th friend** — real auth, persistent memory. Tell Joey you have a duck once; next session he asks about Steve.
2. **Agents text first** — proactive messages via Web Push + an in-app inbox, throttled, quiet-hours aware, per-character mutable.
3. **Living world** — a global calendar of ~88 themed events. Joey has auditions Mon/Wed/Fri. Monica caters Thursdays. Phoebe's open mic is Friday. The gang has lives that move with or without you, and the chat references them.
4. **Translate-your-life** — the Lab. Paste something from your day, get a character's take you can share.
5. **Watch with the cast (episode companion mode)** — a fundamentally different surface from chat. Full-screen scene photo, auto-advancing canonical dialogue, pause-and-nudge mechanic so your interventions visibly affect the next line ("you nudged this" badge).

## Architecture

```
                                  ┌──────────────────┐
                                  │   Browser (PWA)  │
                                  │  Next.js 14 SSR  │
                                  └────────┬─────────┘
                                           │
                          ┌────────────────┼─────────────────────┐
                          │                │                     │
                ┌─────────▼──────┐ ┌───────▼────────┐ ┌──────────▼─────────┐
                │   Supabase     │ │  /api/* routes │ │   Web Push API     │
                │   - Auth       │ │  (Vercel       │ │  (FCM/APNs/Mozilla)│
                │   - Postgres   │ │   serverless,  │ └────────────────────┘
                │   - RLS        │ │   Node runtime)│
                │   - pg_cron    │ └───────┬────────┘
                └────────────────┘         │
                                           │
                          ┌────────────────┴─────────────────┐
                          │                                  │
                ┌─────────▼──────────┐           ┌───────────▼──────────┐
                │  HuggingFace Space │           │   Anthropic API      │
                │  FastAPI + uvicorn │           │   (Sonnet 4.6        │
                │  - sentence-       │           │    + Haiku 4.5)      │
                │    transformers    │           └──────────────────────┘
                │  - Claude streaming│
                │  - precomputed     │
                │    RAG index       │
                └────────────────────┘
```

**Request flow for a chat:**

1. Browser opens `/chat/joey` → loads scene context if URL has `?ep=...&scene=...`
2. User sends a message → `POST /api/chat` (Next.js serverless)
3. Server auth-checks via Supabase, loads the user's profile + memories for that character, plus the world's events for this week
4. Server forwards to HF Space's `/chat` with the augmented `user_context`
5. HF embeds the user message, retrieves top-K=8 most-similar lines spoken by that character, builds a system prompt with character voice notes + retrieved lines + injected context, streams from Anthropic
6. Server proxies the SSE stream back to the browser (with retry on transient 5xx)
7. After stream completes, a fire-and-forget Haiku call extracts new durable facts from the user's message and writes them to the `memories` table

---

## Tech stack & why

### Frontend — **Next.js 14 (App Router) + Tailwind v3 + Motion**

| Why Next.js (vs Vite / Remix / SvelteKit) | |
|---|---|
| **Server components for free SSR** | The whole picker, scene list, settings pages render server-side with zero hydration cost. Massive perf win on first paint. |
| **API routes + serverless functions** | `/api/chat`, `/api/cron/*`, `/api/lab/*` deploy as zero-config Vercel functions. No separate Express server to manage. |
| **Streaming SSE** in route handlers | The chat proxy + typewriter buffering only work because Next's route handlers stream responses natively. |
| **Vercel native** | One-command deploy, generous Hobby tier, instant rollback. No CDN setup, no edge config. |

| Why Tailwind v3 (vs CSS Modules / Styled Components / Linaria) | |
|---|---|
| **CSS variables for theming** | Design tokens (`--bg`, `--accent`, `--fg`) flip between light/dark via `.dark` class; Tailwind reads them via `bg-[color:var(--bg)]`. |
| **Speed of iteration** | Everything's a utility class, no context-switching between files for styles. Built the entire app in a day. |
| **Tree-shaken in production** | Final CSS is tiny (~12KB gzipped). No unused styles. |

| Why Motion (Framer Motion 11) | |
|---|---|
| **Declarative animations** | Used for the typewriter bubble, the "you nudged this" pill, message-in animations. Imperative `useEffect` + setInterval would be 3× the code. |

**Other frontend choices:**
- **`next-themes`** for dark mode (zero-flash, system-aware)
- **`@supabase/ssr`** for cookie-based auth that works across server components and middleware
- **PWA-ready** — `manifest.json`, apple-touch-icon, iOS splash, service worker for Web Push
- **No state management library** (Zustand/Redux) — `useState` + RSC props are enough. Adding Redux to this codebase would be malpractice.

### Backend — two halves

#### 1. FastAPI on **Hugging Face Spaces** (Docker SDK)

| Why HF Spaces (vs Fly.io / Render / a VPS) | |
|---|---|
| **Free CPU tier** | A 16-GB CPU container always-on for $0 (sleeps after 48h idle, wakes in ~30s on the first request). Perfect for a fan project. |
| **Built-in HTTPS + a stable subdomain** | `mohammadshafay-the-one-with-the-ai.hf.space` is mine forever, with TLS. No DNS, no Caddy, no nginx. |
| **Docker SDK** | I ship a single Dockerfile that pins Python 3.11 + my dependencies. Same image runs locally and in prod. |
| **Persistent secrets** | `ANTHROPIC_API_KEY` is set via HF Space secrets, never in the repo. |
| **Pro tier upgrade is $9/mo** | When the free tier's intermittent 5xxs become a launch issue, one click upgrades to always-on dedicated CPU. |

Why not Fly.io: harder cold-start UX, requires a credit card. Why not Render: free tier sleeps too aggressively (15 min). Why not Vercel functions for the ML side: sentence-transformers + MiniLM is too heavy for serverless cold starts.

#### 2. Serverless functions on **Vercel** (Node 20)

For everything that needs Supabase, Anthropic, Web Push, or our own DB: `/api/chat`, `/api/lab/*`, `/api/cron/*`, `/api/push/*`. These are small (sub-1 MB), fast (cold start ~150ms), and free up to 100GB-hours/month.

### Database — **Supabase** (Postgres + Auth + Storage)

| Why Supabase (vs Firebase / PlanetScale / raw Postgres) | |
|---|---|
| **One product, three needs** | Auth (Google OAuth + magic link), Postgres (8 tables with RLS), and storage for set photos — all in one dashboard with one connection string. |
| **Row-Level Security in Postgres** | Every table is RLS-scoped per user. No access checks scattered across API routes. RLS *is* the access control. |
| **pg_cron for free scheduling** | The "agents text first" dispatcher fires every 2h via `pg_cron + pg_net` calling our Vercel endpoint. No Vercel Cron upgrade needed. |
| **Free tier covers 50K MAU** | At "100 users testing" cost: $0. At "10K active users": still $0. |
| **Postgres = no vendor lock-in** | If we outgrow Supabase, we drop the schema into any Postgres host. Nothing's proprietary. |

Why not Firebase: NoSQL doesn't fit our relational shape (users → memories → conversations) and RLS is more powerful than Firestore rules for this kind of access logic. Why not PlanetScale: no built-in auth, would have to layer Clerk or NextAuth on top.

### LLMs — **Anthropic (Claude Opus 4.8 + Haiku 4.5)**

| Surface | Model | Why |
|---|---|---|
| Chat replies | Opus 4.8 | Best instruction-following for "stay completely in character, reference these specific lines, don't introduce yourself." Started on Sonnet 4.6, upgraded to Opus 4.8 for richer voice. |
| Memory extraction (side channel) | Haiku 4.5 | One short structured-JSON call per message. Cheap. Speed beats smartness here. |
| Proactive touch generation | Opus 4.8 | One short message but it needs voice plus scene grounding. |
| Lab tools (Joey comeback, Monica reorg, etc.) | Opus 4.8 | One-shot creative generation; voice consistency matters. |
| Scene line rewriting (pause-and-nudge) | Opus 4.8 | Needs to preserve canonical substance while weaving user intent. |

Why not OpenAI: tested both. Claude's instruction adherence on "do not break character, do not introduce yourself, do not narrate" was noticeably stronger in head-to-head tests on the same probes.

### Classifier — **DistilBERT fine-tuned on M2 MPS**

| | |
|---|---|
| Dataset | EmoryNLP "Friends" corpus, 42,819 cleaned single-speaker lines from all 10 seasons, ~15-18% balance per character |
| Training | 3 epochs, M2 MPS, 7,203s (2 hours) |
| Test accuracy | **33.2%** on isolated lines (33.0% macro F1) |
| Why it's "low" | 6-way classification of a single line out of context is fundamentally hard — we compared against Sonnet (30.3%) and Haiku (26.3%) as zero-shot classifiers on the same 600-sample subset. Three different model architectures clustered 26-33%, proving the task has a ceiling around 30-35%. |
| Where it's useful | Two-signal eval in Phase 4 (classifier match rate + LLM-as-judge). And the Guess Who game — playing against a model that's "better than random by 2×" but not perfect creates better gameplay than playing against a model that's always right. |

### Embeddings + retrieval — **sentence-transformers/all-MiniLM-L6-v2**

384-dim, normalized cosine. 42,819 lines indexed per character → 6 `.npy` files totaling 66MB. Loaded into FastAPI memory on startup. Top-K=8 per chat request. Embed time ~50ms on M2 / CPU.

Why this model (vs OpenAI text-embedding-3-small or bge): it's small (80MB), fast on CPU, and the retrieval quality is "good enough" — the LLM does the heavy lifting. Paying for an OpenAI embedding API call per chat would 10× our per-message cost for marginal quality gain.

---

## Repository structure

```
the-one-with-the-ai/
├── agents/                    # Slack bot — 6 personas via Slack Bolt (Track A)
│   ├── app.py                 # Socket Mode orchestrator + routing + state injection
│   ├── personas.py            # 6 character definitions + voice rules
│   └── start.sh / stop.sh     # screen-session helpers for persistent run
│
├── classifier/                # DistilBERT — Phase 2
│   ├── prepare_data.py        # EmoryNLP fetch + clean
│   ├── train.py               # Fine-tune on M2 MPS
│   ├── eval.py                # Test set accuracy + per-char F1
│   └── models/best/           # Final weights (gitignored — re-train to reproduce)
│
├── chatbots/                  # RAG chat — Phase 3
│   ├── build_index.py         # Embed every line per character with MiniLM
│   ├── rag.py                 # Interactive CLI: retrieve → Sonnet streaming
│   └── index/                 # 6 character .npy + .texts.json files (66MB)
│
├── evals/                     # Eval harness — Phase 4
│   ├── probes.py              # 5 tailored probes per character (Phoebe curated)
│   ├── generate_replies.py    # Run probes through rag pipeline
│   ├── score_classifier.py    # DistilBERT inference per reply
│   └── score_judge.py         # Sonnet-as-judge, 1-10 + reason
│
├── server/                    # FastAPI backend — Phase 6
│   └── main.py                # /chat (streaming SSE), /watch (JustWatch stub), /game/round
│
├── hf-space/                  # The thing we deploy to Hugging Face Spaces
│   ├── Dockerfile             # Python 3.11 + slim runtime
│   ├── main.py                # (mirrors server/main.py)
│   ├── game_lines.jsonl       # Pre-computed game rounds (classifier output cached)
│   └── index/                 # The .npy files copied here for the Docker context
│
├── web/                       # Next.js 14 frontend — the product (Phases 6 + 8)
│   ├── app/                   # App Router pages + API routes
│   │   ├── chat/[character]/  # Chat surface
│   │   ├── watch/             # Episode browser
│   │   ├── watch/[ep]/[scene] # Scene player (cinematic mode)
│   │   ├── lab/               # The Lab tools
│   │   ├── login/             # Email OTP + Google OAuth
│   │   ├── memories/          # "What they remember about you"
│   │   ├── settings/          # Push toggles, mutes, quiet hours
│   │   ├── api/chat/          # The proxy that injects user_context
│   │   ├── api/cron/dispatch/ # Hourly touch dispatcher
│   │   └── api/lab/           # Lab tool endpoints
│   ├── components/            # Reusable React components
│   ├── lib/                   # Domain logic: characters, locations, memory, world, etc.
│   ├── supabase/migrations/   # SQL migrations (4 files)
│   └── public/                # Static assets — character portraits, set photos, manifest
│
├── STATUS.md                  # Always-current project state
├── TIMELINE.md                # Append-only milestone log
├── TEAM.md                    # The 6-persona team convention
├── PHASE_8.md                 # Phase 8 design doc (the relationship layer)
└── README.md                  # This file
```

---

## Run it locally

### Prerequisites

- Node 20+, Python 3.11+, an Anthropic API key, a Supabase project (free tier fine)
- macOS or Linux (we use Apple Silicon MPS for training the classifier — skippable if you don't retrain)

### Web app only (fastest path to chat working locally)

```bash
git clone https://github.com/joyo11/the-one-with-the-ai
cd the-one-with-the-ai/web
npm install
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_API_URL (point to https://mohammadshafay-the-one-with-the-ai.hf.space
# if you want, OR run the backend locally — see below)
# fill in your own Supabase + Anthropic keys
npm run dev
# → http://localhost:3000
```

Run the four migrations (`web/supabase/migrations/000{1..4}_*.sql`) against your Supabase project via the SQL Editor.

### The full stack (backend included)

```bash
# 1. Train the classifier (optional — only needed if you want to retrain or run game/round)
cd classifier && python prepare_data.py && python train.py

# 2. Build the RAG index
cd ../chatbots && python build_index.py

# 3. Run the FastAPI backend
cd ../server && uvicorn main:app --reload
# → http://localhost:8000

# 4. Point web/.env.local NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Deploy to Hugging Face Space (mirror what we run)

```bash
# Copy server/main.py + chatbots/index/ + game_lines.jsonl into hf-space/
# Then:
python -c "from huggingface_hub import HfApi; HfApi(token='<your_hf_token>').upload_folder(folder_path='hf-space', repo_id='<your_user>/the-one-with-the-ai', repo_type='space')"
```

Set `ANTHROPIC_API_KEY` as a Space secret in the HF dashboard.

---

## Cost to operate

| Component | Free tier | Where it stops being free |
|---|---|---|
| Vercel hosting + functions | 100GB-hr/mo, 100GB bandwidth | ~10K daily active users |
| Supabase (auth + Postgres + cron) | 50K MAU, 500MB DB, 2GB transfer | ~50K MAU |
| Hugging Face Space | CPU basic free, sleeps after 48h | Optional $9/mo Pro for always-on |
| Google OAuth | Forever free, unlimited users | Never |
| **Anthropic API** | **Pay-as-you-go** | First $5 free in credits, then ~$0.01-0.02 per chat reply |

**At 1,000 daily active users sending 5 chats each:**
- Vercel: $0
- Supabase: $0
- HF: $0 (or $9/mo if you upgrade)
- Anthropic: ~$50-100/day
- **→ ~$1,500-3,000/month at that scale**, almost all of which is LLM inference

For "small fan project the creator can run forever": **$0/mo**.

---

## What this project gives back

This repo is meant to be **a real reference** for anyone building a similar product:

- **End-to-end RAG with character grounding** — not toy demos. The retrieval, voice notes, hard-rules sanitizer, and two-signal evals all live here for inspection.
- **A modern auth + memory stack** that scales from 1 to 50K users on free tiers, with code you can actually copy.
- **A "living world" implementation** — calendar-driven proactive messaging is a pattern I haven't seen open-sourced elsewhere.
- **The scene-player + pause-and-nudge mechanic** in `web/components/scene-player.tsx` is a novel interactive-fiction primitive — fork it for any IP-based interactive product.
- **The eval harness** in `evals/` is reusable for any character-LLM project: classifier match rate + LLM-as-judge gives you a defensible scorecard.
- **The Phase 8 doc** (`PHASE_8.md`) walks through the *thinking* behind shipping a relationship layer on top of a chatbot — useful as a template for your own next-phase planning.

If you fork this for your own show / book / game / world, **please credit + link back** so others find the reference. Build something better. Let me know what you ship.

---

## Built with

- **[Anthropic API](https://www.anthropic.com/api)** for the chat layer (Claude Opus 4.8 + Haiku 4.5)
- **[Next.js](https://nextjs.org/)** + **[Vercel](https://vercel.com/)** for the frontend
- **[Supabase](https://supabase.com/)** for auth + DB + cron
- **[Hugging Face Spaces](https://huggingface.co/spaces)** for the FastAPI backend
- **[sentence-transformers](https://www.sbert.net/)** + **[Transformers (HF)](https://huggingface.co/docs/transformers)** for embeddings + DistilBERT
- **[EmoryNLP Friends corpus](https://github.com/emorynlp/character-mining)** for the dialogue dataset

## Disclaimer

**Educational, non-commercial fan project.** Friends™ is owned by Warner Bros. Character photos, episode references, and dialogue are used under fair-use principles for research and educational purposes. If you're affiliated with WB and have concerns, open an issue and I'll respond promptly.

## Author

Built by **Shafay** (Mohammad Shafay Joyo).

- GitHub: [github.com/joyo11](https://github.com/joyo11)
- Contact: [shafay11august@gmail.com](mailto:shafay11august@gmail.com)

## License

MIT for the code I wrote. The Friends™ name, characters, dialogue, and likenesses remain the property of their respective owners.

---

**Live:** [howudoinai.vercel.app](https://howudoinai.vercel.app) · **Source:** [github.com/joyo11/the-one-with-the-ai](https://github.com/joyo11/the-one-with-the-ai) · Built by [Shafay](https://github.com/joyo11)
