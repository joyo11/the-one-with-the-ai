# Design Brief — "The One With the AI"

Paste this entire file into a new claude.ai/design conversation. Use Sonnet 4.6 or Opus 4.7. Artifacts ON.

---

## What to output

**One self-contained HTML file** that acts as a **"Figma file as a single web page"** — a pannable / scrollable design canvas containing every screen of the product at both breakpoints, every component in isolation, and live microinteractions where the page actually animates.

- One HTML, one paste — no build step. Tailwind via CDN, Google Fonts via `<link>`, vanilla JS or Framer Motion via CDN for animations.
- Organized into **5 numbered sections** (table of contents below). Each section is a row of frames; the page scrolls vertically through sections.
- Each frame is wrapped in a "Figma frame" container: 1px border, soft shadow, label above showing **section.frame — name • breakpoint • dimensions**.
- **Two breakpoints per screen**: 1440px desktop AND 390px mobile, side by side, so I can review responsive behavior at a glance.
- **Live microinteractions** — hover, typewriter intro, loading dots, fade transitions all run in the page. Annotate each with **Framer Motion-named timing values** (durations, easings, prop names like `whileHover`, `initial`/`animate`, etc.) in a small mono caption.
- **Tailwind utility classes** annotated next to key elements as small mono captions (e.g. `bg-[#F5EFE3] dark:bg-[#1A1410]`), so the design maps directly to code.
- **STOP after the HTML.** Do NOT generate Next.js code yet. I review first.

---

## Sections (table of contents)

| # | Section | What's in it |
|---|---|---|
| **00** | Cover & Design System | title slide, color tokens, typography, the 6 character markers in isolation, button states, chat bubble in isolation, chip in isolation, toast variants, couch SVG icon, brand mark static + mid-intro keyframe |
| **01** | Landing | desktop light, desktop dark, mobile, brand mark mid-typewriter intro keyframe, picker card hover state zoomed |
| **02** | Chat | desktop light mid-conversation, desktop dark mid-conversation, empty state, character typing, where-to-watch dropdown OPEN, mobile portrait, loading skeleton |
| **03** | Guess Who | game start, round in progress, answer reveal CORRECT, answer reveal WRONG, end of round / final score |
| **04** | States & Errors | error toast (rate limited), failed message with retry, 404 page, offline state, classifier-confidence bar variants |

Each section has a section header (Permanent Marker font, large) above its row of frames.

---

## Project context

**"The One With the AI"** is a non-commercial educational fan project. A Friends-themed AI chatbot. Two modes:

1. **Chat with one of six characters** (Monica, Joey, Ross, Chandler, Rachel, Phoebe). Replies are grounded in real lines via RAG.
2. **Guess Who Said It** — game: show a real Friends line, user picks who said it, reveal the answer + what our trained AI classifier guessed.

**The aesthetic to hit**: the user should feel like they walked into Central Perk. Not "playful AI chatbot." Not "Linear/Vercel SaaS dashboard." Cinematic, warm, cafe-coded, with strong Friends visual identity. Reference: **centralperkcoffee.com** — that's the energy.

**IP guardrails (non-negotiable):**
- NO screenshots from the show, NO photos of the actors, NO clip embedding.
- **NO emoji as character avatars** (the single most childish element — we already tried it and removed it).
- Use illustrated/typographic character markers (rules below).
- "Where to watch" is a link out to JustWatch, never embedded video.
- Footer must say: *"Educational, non-commercial fan project. Friends™ is owned by Warner Bros."*

---

## The five visual rules

### 1. Character markers — INITIALS in Permanent Marker, NO emoji

Each character has a round 80px avatar circle. The avatar shows the character's **first initial in Permanent Marker font**, stroke colored in their strong accent. Background is their light pastel tint.

| Character | Initial | Marker stroke | Background tint |
|---|---|---|---|
| Monica | **M** | rose-500 `#F43F5E` | rose-100 `#FFE4E6` |
| Joey | **J** | amber-500 `#F59E0B` | amber-100 `#FEF3C7` |
| Ross | **R** | emerald-600 `#059669` | emerald-100 `#D1FAE5` |
| Chandler | **C** | sky-500 `#0EA5E9` | sky-100 `#E0F2FE` |
| Rachel | **R** | pink-500 `#EC4899` | pink-100 `#FCE7F3` |
| Phoebe | **P** | violet-500 `#8B5CF6` | violet-100 `#EDE9FE` |

Initial is large (~half avatar height), hand-drawn, slightly off-center.

### 2. The orange couch motif (SVG)

A simple SVG of the iconic Central Perk orange couch (long, curved, rounded back). Used throughout:
- **Landing**: faded watermark behind brand mark, 5% opacity `#EA580C`, large.
- **Chat empty state**: small 24px couch icon next to *"the couch is empty — sit down."*
- **Guess Who reveal**: small couch icon next to the revealed character's name.

Provide the couch SVG as a reusable component, shown in isolation in section 00.

### 3. Paper-grain texture

Faint paper/canvas noise texture on all cream surfaces (3-5% opacity). Use an SVG noise filter or repeating PNG. Warms the cream toward beige. Reference: header texture on centralperkcoffee.com.

### 4. Push the orange — confident, not shy

`#EA580C` is the primary accent. Use it like the couch is used in the show — as the visual anchor of the room:
- **All primary CTAs solid orange with white text.** No outlined orange buttons as primary.
- "Where to watch" trigger: outlined orange at rest, **fills solid on hover**.
- Brand mark typewriter intro flashes orange on the dots first (see Motion §).
- Couch watermark uses full `#EA580C` at 5% opacity — every page has orange presence in the background.

### 5. Cinematic transitions — actually run in the page

The HTML must **actually animate** these. Annotate each with Framer Motion's timing language.

- **Brand-mark typewriter intro** (first page load, 800ms total):
  - Each letter of *T·H·E O·N·E W·I·T·H T·H·E A·I* arrives one at a time, left to right, with its preceding dot. 
  - Dots appear in **`#EA580C` orange first**, then crossfade to final red/blue/yellow over 400ms.
  - Annotation: `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.08, delay: i * 0.06, ease: "easeOut" }}`
- **Character card hover**: scale 1.03 + 2px accent-color ring. 
  - Annotation: `whileHover={{ scale: 1.03 }} transition={{ duration: 0.15, ease: "easeOut" }}`
- **Page transition (card click → chat)**: fade through BLACK for 180ms, then chat lands.
  - Annotation: `AnimatePresence mode="wait"` + `exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: "easeInOut" }}` overlay.
- **Message appear**: opacity 0 → 1 + y: 4 → 0, 200ms.
  - Annotation: `initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}`
- **Typing indicator**: 3 dots, sequential opacity 0.3 → 1 → 0.3, 1.4s loop.
- **Composer send button press**: scale 0.96, 100ms ease-out.

**All transitions respect `prefers-reduced-motion`** — instant when reduced, but the orange couch motif still appears.

---

## Color palette

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | warm cream `#F5EFE3` | deep coffee `#1A1410` | page bg |
| `surface` | warm white `#FFFBF5` | warm slate `#2A201A` | cards, chat bubbles |
| `border` | soft tan `#E5DCC7` | warm gray `#3D2F26` | hairlines |
| `fg` | deep espresso `#2C1F14` | warm cream `#F5EFE3` | primary text |
| `muted` | warm gray-brown `#8B7355` | warm tan `#B5A285` | secondary text |
| **`accent`** | **`#EA580C` Central Perk orange** | **`#FB923C` lighter orange** | **CTAs, dropdown hovers, watermark** |
| `accent-2` | sage `#166534` | mint `#4ADE80` | confirmations only (Guess Who "CORRECT") |
| `error` | red-600 `#DC2626` | red-400 `#F87171` | toasts, failed sends |
| `success` | green-600 `#16A34A` | green-400 `#4ADE80` | CORRECT, "you beat the AI" |
| **dots** | red `#F87171` / blue `#60A5FA` / yellow `#FBBF24` | same | Friends logo dots — brand mark only |

---

## Typography — two fonts only

- **Display** (brand mark, headings ≥24px, Friends-line quotes): **Permanent Marker** from Google Fonts.
- **Body** (everything else): **DM Sans** from Google Fonts. Line-height 1.6.

---

## Section-by-section detail

### 00 — Cover & Design System

Top of the page. Acts as the design system reference.

Required:
- **Page title** in huge Permanent Marker: *The One With the AI — Design System*.
- **Color swatches**: every token from the palette table with its hex visible.
- **Typography specimens**: Permanent Marker at 96/64/32px; DM Sans at 18/16/14/12px regular and semibold.
- **6 character markers in isolation**: each at 80px, in a row, labeled.
- **Buttons** in isolation: Primary (solid orange), Secondary (outlined orange), Ghost — at rest, hover, pressed, disabled.
- **Chat bubble** in isolation: character-side (with 2px accent border, avatar) and user-side (neutral cream).
- **Chip** in isolation: Guess Who selector pill, default + selected states.
- **Toast variants**: error (red), success (green), info (cream).
- **Couch SVG** in isolation, the reusable motif element.
- **Brand mark** rendered twice: static final state, AND mid-typewriter keyframe (letters arriving, dots still orange).

### 01 — Landing

- **01.1 Desktop light** (1440px) — full landing with brand mark, couch watermark behind, subtitle, 6 character cards in a row, Guess Who tile below, footer.
- **01.2 Desktop dark** (1440px) — same.
- **01.3 Mobile light** (390px) — 2-column character grid, Guess Who tile, footer.
- **01.4 Brand mark mid-intro** (zoomed keyframe at ~400ms) — half the letters in, dots still showing orange before crossfade.
- **01.5 Picker card hover** (zoomed) — single character card, ring + scale, role tagline visible.

### 02 — Chat

- **02.1 Desktop light, mid-conversation** (1440px) — 5-6 turns, real Friends-y dialogue (use real-sounding lines per character).
- **02.2 Desktop dark, mid-conversation** (1440px) — same.
- **02.3 Empty state** (1280×800) — couch icon + *"the couch is empty — sit down"* + welcome bubble from the character.
- **02.4 Typing indicator** (1280×800) — three pulsing dots in a character-tinted bubble.
- **02.5 Where-to-watch dropdown OPEN** (1280×800) — 4 streaming options visible.
- **02.6 Mobile portrait** (390×844) — sticky composer at bottom with safe-area padding.
- **02.7 Loading skeleton** (1280×800) — first paint before welcome bubble arrives.

### 03 — Guess Who

- **03.1 Game start** (1280×800) — rules card, "Start round" CTA, score 0/10.
- **03.2 Round in progress** (1280×800) — line in marker-font blockquote (e.g. *"WE WERE ON A BREAK!"*), 6 character chips, round counter top-right.
- **03.3 Answer reveal — CORRECT** (1280×800) — green badge, revealed character with small couch icon, classifier prediction shown alongside with confidence bar.
- **03.4 Answer reveal — WRONG** (1280×800) — red badge, same layout.
- **03.5 End of round / final score** (1280×800) — score in giant marker font, comparison with AI ("You beat the AI 🎉" green or "AI beat you" honest), Play Again + Back to Friends buttons.

### 04 — States & Errors

- **04.1 Rate-limit toast** (1280×800) — red toast at top with retry button.
- **04.2 Failed message with retry** (zoomed) — user bubble showing "failed to send" with retry icon.
- **04.3 404 page** (1280×800) — *"It's like… not happening."* + link back to landing.
- **04.4 Offline state** (1280×800) — *"Can't reach the chat server. Make sure the backend is running on port 8000."*
- **04.5 Classifier confidence bar variants** — three variants showing high (90%), medium (50%), low (20%) confidence — used in Guess Who reveal.

---

## API contract (informational — design only)

The frontend talks to a Python FastAPI backend at `process.env.NEXT_PUBLIC_API_URL`:
- `POST /chat` — streaming SSE: `data: {"delta":"..."}` chunks ending with `data: {"done": true}`. Body: `{character, messages[]}`.
- `GET /watch?character=Joey` — returns `{show, options: [{service, url, type}]}`.
- `GET /game/round` — returns `{line, answer, classifier_pred, classifier_confidence, options}`.

Design should accommodate streaming text, loading states, error states — but you don't implement the API.

---

## Output format

Single HTML file, single code block:

```html
<!DOCTYPE html>
<html>
  <!-- 
    Sections 00–04 stacked vertically.
    Each section: large Permanent Marker section header + grid of frames.
    Each frame: labeled, framed (1px border, soft shadow), mockup inside.
    Tailwind via CDN. Google Fonts (Permanent Marker, DM Sans) via <link>.
    Animations: vanilla CSS or Framer Motion via CDN — must actually run.
  -->
</html>
```

Self-contained: open the file directly in a browser, every frame renders, animations play, hover states work. Pannable scroll left/right within sections, vertical scroll between sections is fine.

**STOP after the HTML.** Do NOT generate Next.js code. I review the design canvas first and come back to ask for code.

---

*Brief written by Rachel (Designer) + the team, "The One With the AI", 2026-06-01. Adopts the multi-section "Figma file as one HTML" structure from Shafay's prior project work.*
