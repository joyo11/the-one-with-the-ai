# Project Status

_Last updated: 2026-06-01_

## Current phase
**Phase 1 (Slack team) — DONE.**
**Phase 2 (character classifier) — DONE.** 33.2% on isolated lines (weak signal as expected).
**Phase 3 (chatbot baseline with RAG) — DONE.** All 6 characters voiced convincingly.
**Phase 4 (eval harness) — DONE.** Real per-character scorecard built and saved.
**Phase 6 (web UI + deploy) — DONE.** Live at https://howudoinai.vercel.app. Backend migrated off Shafay's Mac → Hugging Face Spaces at `https://mohammadshafay-the-one-with-the-ai.hf.space`. Cloudflare Tunnel decommissioned. Product runs independent of any local machine.
**Phase 8 (relationship layer) — DEFINED, not started.** See `PHASE_8.md`. Five pillars: identity + memory, agents text first, living world, translate-your-life, episode companion mode. Goal: turn the product from "neat AI demo" into "app a Friends fan opens 3x/day." Honest scope: 8 weeks focused, 12-14 with interruptions.

### Phase 4 final numbers (30 replies, 5 per character)
- Overall classifier match rate: **80%** (vs 33% on isolated lines — confirmed the brief's design assumption that multi-sentence chatbot output is much easier than single lines)
- Overall LLM-judge avg: **8.40 / 10** (stdev 0.77, min 7)
- Per character: Joey 100% / 7.80, Ross 100% / 8.00, Monica 80% / 8.40, Rachel 80% / 8.40, Phoebe 80% / 8.80, **Chandler 40% / 9.00** (interesting split — judge says perfect, classifier doesn't recognize him because his voice is irony patterns not distinctive vocabulary)
- Two-signal triangulation works: agreement → strong evidence; disagreement → diagnosed (classifier limit, not chatbot bug)

**Phase 5 (Joey terminal access) — pending.**
**Phase 6 (Frontend + deploy) — pending.**
**Phase 7 (Fine-tuning) — optional, currently NOT needed given the strong RAG numbers.**

### Phase 2 final numbers
- Data prep: 42,819 clean lines, balanced across 6 characters (14.9%-17.8%).
- Training: DistilBERT, 3 epochs, M2 MPS, 2hr runtime.
- Eval (DistilBERT): **33.2% accuracy, 33.0% macro F1.** Per-character F1: Rachel 0.37, Ross 0.36, Joey 0.36, Monica 0.31, Chandler 0.29, Phoebe 0.28.
- LLM-as-classifier comparison runs (600 stratified samples):
  - Haiku 4.5: **26.3%** (-6.9pp)
  - Sonnet 4.6: **30.3%** (-2.9pp)
  - DistilBERT wins. Three models, same ceiling — the task framing has a real cap around 30-35% for isolated single-line 6-way classification.
- Verdict: brief's 70% target was unreachable for this task shape. Accepted as a weak signal in Phase 4 alongside LLM-as-judge (which scores multi-line chatbot replies — easier task).

## What's running
- Slack bot is live in `#the-one-with-the-ai`, connected via Socket Mode from Shafay's Mac.
- 6 personas wired in: Monica (PM), Joey (Eng), Ross (AI Lead), Chandler (QA), Rachel (Designer), Phoebe (Evals).
- Each persona's system prompt includes this STATUS.md and TIMELINE.md on every reply.

## What's been built
- `agents/app.py` — orchestrator (Socket Mode, routing, history, Claude calls)
- `agents/personas.py` — 6 persona definitions + trigger keywords
- `agents/start.sh` — venv + install + run
- `agents/.env` — secrets (gitignored)
- `classifier/prepare_data.py` — fetches emorynlp dataset (10 season JSONs), filters to 6 main characters, drops joint dialogue + lines under 4 tokens
- `classifier/data/clean/lines.csv` — 42,819 cleaned `(speaker, line)` rows, balanced across the 6 characters

## Open questions / blockers
- **Lesson learned 1:** training pegged the M2 GPU for 2 hours and killed the Slack bot via resource pressure. Pause bot before heavy ML.
- **Lesson learned 2:** Anthropic rate limit (50 RPM low-tier) is shared between Slack bot and any other API workloads. Pause bot during bulk eval runs.
- **Lesson learned 3:** Up to 4 zombie bot instances were running simultaneously today before we caught it. `start.sh` now refuses to start a second instance.

## Phase 3 final state
- `chatbots/build_index.py` — embeds all 42,819 lines per character with sentence-transformers/all-MiniLM-L6-v2 (384-dim, normalized). Indices saved to `chatbots/index/{Char}.emb.npy` + `.texts.json`.
- `chatbots/rag.py` — interactive CLI. User input → embed → top-K=8 retrieval → prompt Sonnet 4.6 with retrieved lines + voice notes → in-character reply.
- `chatbots/spot_check.py` — one-shot voice-test for all 6 characters.
- Smoke test outcomes (2026-06-01): all 6 pass subjective voice test. Joey's food obsession, Monica's perfectionism, Ross's dino-nerd fervor, Chandler's BE-any-more-deflection, Rachel's fashion brain, Phoebe's unbothered weirdness all show through.

## Next step — Phase 6, Frontend + Deploy (Rachel's phase)
With Phases 1-4 done and the chatbot scoring 8.40/10, we're skipping Phase 5 (Joey terminal access — that's ops, not product) and Phase 7 (fine-tuning — not needed given RAG quality). Going straight to **Phase 6**: web UI + JustWatch + public URL.

Per brief: "Simple web UI: pick a character, chat with them. Match the previously chosen look (Linear/Vercel style, indigo accent). A 'where to watch' element that calls the JustWatch API to link out — no hosted clips. Deployment: a deployed, shareable link beats a notebook."

Owner: Rachel (design), Claude (build), Vercel (host).

## Who's doing what
- **Claude (terminal)** — actual file writes + script runs (the only one with hands). Voices the 6 personas in terminal when addressed by name. See `TEAM.md`.
- **Ross** — picks the dataset + classifier model
- **Joey** — file structure + code plan
- **Monica** — keeps Phase 2 scope tight, no fine-tuning yet
- **Chandler** — will review code once Phase 3 begins. Also owns **ongoing Slack convo QA**: when asked, runs `agents/test_convo.py` (via Claude in terminal) to check for routing bugs, identity confusion, persona leaks, hallucinated state. Caught the multi-name routing bug (`"Ross, did Monica..."` → was misrouting to Monica) on 2026-06-01 and got it fixed.
- **Rachel** — idle until Phase 6
- **Phoebe** — idle until Phase 4 (but starts noting edge cases)

## Team mode
The 6 personas live in BOTH Slack (read-only chat) AND this terminal (Claude voices them when addressed by name). Full convention in `TEAM.md`.
