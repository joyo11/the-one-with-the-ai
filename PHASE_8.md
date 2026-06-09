# Phase 8 — The Best Friends Fan App in the World

_Drafted: 2026-06-01. Owner: Shafay. Team: the gang._

## Goal

Turn "neat AI demo of the cast" into **the app a Friends fan opens three times a day.**

Phases 1-7 built the cast. You can chat with all six and they sound right. The product works. But it's not sticky — median session is "pick a character, chat for five minutes, close the tab." There is no reason to come back tomorrow.

**Phase 8 is the relationship layer.** Identity, memory, async messaging, a living world, and a share loop. It turns six chatbots into a friend group whose lives are actually happening, and gives the user a *seat* in that group.

---

## The 5 pillars

### Pillar 1 — Be the 7th Friend  *(identity + memory)*

**What.** Real user accounts. Each user has a name, a profile, a few optional details (job, hometown, favorite character, what shows you've watched). Characters remember you across sessions and reference details unprompted.

**Why first.** Every other pillar depends on it. You can't text someone proactively if you don't know who they are. The living world can't reference "your audition tomorrow" without memory.

**Tech.**
- **Auth:** Supabase Auth (Postgres comes free, which we'll need anyway).
- **User state + history:** Postgres tables — `users`, `messages`, `memories`.
- **Onboarding:** 3-4 question form, skippable. "What should we call you?" "Favorite character?" "Anything you want them to know?"
- **Memory write:** after each conversation, a side-channel Claude call extracts new facts ("user mentioned they're learning Spanish", "user just started a new job at a hospital") and stores them tagged by character relevance and confidence.
- **Memory read:** on every request, fetch top-K relevant facts about the user (by embedding similarity to the current message) and inject into the character's system prompt as `## What you remember about <user>`.

**Done bar.** Sign up, tell Joey one thing about yourself, close tab, come back the next day. Joey brings it up unprompted.

---

### Pillar 2 — Agents text first  *(proactive / async messaging)*

**What.** Characters initiate. Push notifications. Async, like real iMessage. Joey at 11pm: "you up?" Monica at 9am: "did you eat breakfast?" You reply when you reply. The relationship persists in the background.

**Why second.** With identity in place, proactive messaging makes sense — they have a person to text. Without the living world (pillar 3) yet, frequency is throttled and messages are vibes-based, not event-driven.

**Tech.**
- **Transport:** Web Push (PWA already supports it) + email fallback for users without push permission.
- **Scheduler:** per-user `next_touch_at` per character. Vercel Cron (or Supabase Edge Function) ticks hourly and dispatches due touches.
- **Throttle:** max 2 messages/day per character, max 5/day total. Configurable per user.
- **Quiet hours:** no notifications 11pm-7am local time. Joey is the only exception (he's nocturnal — opt in).
- **Per-character opt-out + master mute.** Both must be one tap.

**Done bar.** Opt in to notifications, walk away from the app, get a push from Phoebe within 24 hours that makes you smile.

---

### Pillar 3 — Living World  *(calendar version)*

**What.** A shared calendar of events that happen in the gang's world whether you log in or not. Tuesday 8pm: Joey has an audition. Thursday: dinner at Monica's. Friday: Phoebe's open mic. Characters reference these events organically — nervous before, debriefing after, asking your advice in between.

**Why third.** This is what gives Pillar 2 *meaning.* Without a living world, "Phoebe just texted me" is hollow. With it, the text is "Monica just blew up at me over the place settings — am I crazy?" That's a real message. That's why you reply.

**Tech.**
- **World calendar table:** `events(id, character_ids, title, start_at, status, theme)`.
- **Seed:** ~20-30 recurring + one-off events per month, themed per character (Joey auditions, Monica dinners, Ross museum drama, Phoebe gigs, Rachel fashion shows, Chandler work weirdness).
- **Touch templates:** each event has `pre`, `mid`, `post` slots. When dispatched, Claude composes the message using current world state + user memory.
- **World state is queryable.** Every character's system prompt gets a `## This week in the apartment` section listing the next few events, so chats reference them naturally too.

**Done bar.** Open the app on a Tuesday night — Joey is freaking out about his audition. Open it Wednesday — he tells you how it went. The world moved without you.

---

### Pillar 4 — Translate-your-life  *(share loop)*

**What.** An upload widget. Paste any text (annoying email, text from your ex, group chat screenshot, work message). Upload an image (selfie, outfit, screenshot). Pick a character. Get a take rendered as a shareable card.

**Why fourth.** Standalone tool — doesn't depend on the relationship layer but benefits from it (Rachel's outfit rating is funnier if she's seen your closet before). This is the top-of-funnel + viral loop. It's how the product leaves the app.

**Tech.**
- **Upload component:** text area + image upload (Supabase Storage).
- **Templates to ship in v1:** Rachel rates outfit · Monica reorganizes email · Joey writes a comeback · Ross over-explains the science · Chandler quips · Phoebe interprets your dream · Group reacts to a headline · "What would the gang say about \_\_\_."
- **Render:** Vercel OG (or Satori) → PNG. Card design uses the same Central Perk aesthetic as the rest of the app.
- **Optional public gallery:** users opt-in to make a card public; moderation queue before it shows.

**Done bar.** Upload one outfit, get a Rachel rating card, share it to a group chat, two people you don't know visit the app from that link.

---

### Pillar 5 — Episode Companion Mode  *(second screen)*

**What.** Tell the app "I'm watching S2E14" — the gang reacts in real time as the episode plays. Pause and ask "wait, why is Monica mad?" Get an in-character answer that knows the actual scene context.

**Why last.** Highest craft requirement (per-episode context, character continuity tied to canon). Benefits most from everything else being solid. Also the most uniquely *ours* — no other AI product does second-screen for a sitcom.

**Tech.**
- **Episode database:** all 236 episodes with scene-level breakdowns. Already have the scripts from the classifier dataset — needs scene segmentation pass.
- **UI:** episode timeline scrubber, current scene highlighted, "ask the cast" button per scene.
- **Per-scene RAG context** augments the character's system prompt with what happens in that scene and that character's headspace at that moment.
- **Sync to Max** is out of scope for v1 — user manually tells the app what scene they're on (paste a timestamp or tap a scene).

**Done bar.** Start "The One Where No One's Ready," tap a scene, ask Chandler "why are you wearing all the clothes," get an answer that references the actual gag and his actual emotional logic in that scene.

---

## Build order

Sequenced to maximize compounding — each pillar makes the next one better.

| Order | Pillar | Est. weeks | Why this slot |
|------:|--------|-----------:|---------------|
| 1 | 7th Friend (identity + memory) | 2 | Foundation. Nothing else works without it. |
| 2 | Agents text first | 1.5 | Needs identity. Cheap to add once auth is wired. |
| 3 | Living world (calendar) | 2 | Gives proactive messages real meaning. |
| 4 | Translate-your-life | 1 | Parallel-buildable, ships fast, drives top-of-funnel. |
| 5 | Episode companion mode | 2 | Highest craft. Ship when foundation is rock-solid. |

**Honest timeline.** 8 weeks if focused. 12-14 if interruptions. The first three weeks are the riskiest — auth + memory wiring is fiddly. After that it's mostly content and templating.

---

## Out of scope for Phase 8

Listed here so we don't forget — explicitly *not* shipping in this phase.

- **Group chat / the gang in one room.** Earlier favorite. Living-world calendar covers ~70% of the magic at ~20% of the cost. Revisit in Phase 9 if the calendar isn't enough.
- **Voice replies (ElevenLabs / sound-alikes).** Phase 9. The IP question and cost question both deserve their own decision. Visual product needs to be airtight first.
- **Live Central Perk (multiplayer presence).** Phase 9+. Real-time + WebSockets + Claude-moderated turn-taking across users is its own beast.
- **AI-generated lost episodes (Phoebe's Friday drop).** Free if we have living-world infra — ship as a recurring event type in Phase 9.
- **Conflict mode (Chandler's "pick a side").** Narrative branching on top of the living world. Phase 9.
- **News-of-the-day reactions (Rachel's).** Trivial add inside the living world infra. Ship as a recurring event type once Pillar 3 is stable.

---

## Risks

- **LLM costs scale with users × messages.** Proactive messages add load. Need cost-per-active-user modeled before we open signups widely. Cache the world-state and memory-retrieval prompts aggressively.
- **HF Spaces free tier sleeps after ~48h idle** (Chandler flagged this 2026-06-01). Cold start kills the "they texted me" magic if the user taps and waits 30s. Either upgrade to HF paid (always-on CPU) or move to Fly.io once we have real users. Decision required before pillar 2 ships.
- **Memory accuracy is sacred.** If the bot says "you said you hate cilantro" when the user said they love it, trust collapses in one message. Need a "what does \<character\> remember about me" review screen and a one-tap "forget that" button.
- **Notification spam = uninstall.** Aggressive defaults will burn users. Default to ~1 push/day per character, max 3/day total. Honor quiet hours. Test with one user (Shafay) for two weeks before opening to anyone else.
- **IP exposure scales with reach.** Right now we're a small fan project. At 10K users with WB-recognizable photos and (eventually) voices, the calculus shifts. Keep "educational, non-commercial fan project" disclaimer visible and don't monetize directly.

---

## What "done" looks like for Phase 8

A Friends fan signs up on Sunday night. By Wednesday, they have:
- Told Joey one thing about themselves and seen him bring it up
- Gotten an unexpected push from Phoebe that made them screenshot it
- Caught up on what happened at Monica's Thursday dinner
- Shared a Rachel-rates-outfit card to a group chat that brought in two new users
- Watched an episode with Chandler reacting in real time

When that happens for one user, Phase 8 is done. When it happens for 100, the product is the best Friends fan app in the world.
