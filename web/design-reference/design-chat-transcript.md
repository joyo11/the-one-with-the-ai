# Figma Design System

_Started 2026-06-01 20:12 UTC_

---

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "Friends_AI"
Project is currently empty (no files)
Current date is now June 1, 2026
</system-info>

<pasted_text name="Pasted text (207 lines)">
# Design Brief — "The One With the AI"

Paste this entire file into a new claude.ai/design conversation. Use Sonnet 4.6 or Opus 4.7. Artifacts ON.

---

## What to output

**One self-contained HTML file** that acts as a **"Figma file as a single web page"** — a pannable / scrollable design canvas containing every screen of the product at both breakpoints, every component in isolation, and live microinteractions where the page actually animates.

- One HTML, one paste — no build step. Tailwind via CDN, Google Fonts via `<link>`, vanilla JS or Framer Motion via CDN for animations.
- Organized into **5 numbered sections** (table of contents below). Each section is a row of frames; the page scrolls vertically through sections.
- Each frame is wrapped in a "Figma frame" container: 1px border, soft shadow, label above showing **section.frame — name • breakpoint • dimensions**.
- **Two breakpoints per screen**: 1440px desktop AND 390px mobile, side by side, so I can review responsive behavior at a glance.
- **Live microinteractions** — hover, typewriter intro, loading dots, fade transitions all run in the page. Annotate each with **Framer Motion-named timing values** in a small mono caption.
- **Tailwind utility classes** annotated next to key elements as small mono captions (e.g. `bg-[#F5EFE3] dark:bg-[#1A1410]`).
- **STOP after the HTML.** Do NOT generate Next.js code yet.

---

## Sections

| # | Section | What's in it |
|---|---|---|
| **00** | Cover & Design System | title slide, color tokens, typography, 6 character markers in isolation, button states, chat bubble in isolation, chip in isolation, toast variants, couch SVG, brand mark static + mid-intro keyframe |
| **01** | Landing | desktop light, desktop dark, mobile, brand mark mid-typewriter keyframe, picker card hover zoomed |
| **02** | Chat | desktop light mid-conversation, desktop dark mid-conversation, empty state, typing indicator, where-to-watch dropdown OPEN, mobile portrait, loading skeleton |
| **03** | Guess Who | game start, round in progress, answer reveal CORRECT, answer reveal WRONG, end of round |
| **04** | States & Errors | rate-limit toast, failed message + retry, 404, offline, classifier-confidence bar variants |

Each section has a section header (Permanent Marker, large) above its row of frames.

---

## Project context

A non-commercial educational Friends-themed AI chatbot. Two modes:
1. **Chat with a character** — RAG-grounded replies sounding like Monica/Joey/Ross/Chandler/Rachel/Phoebe.
2. **Guess Who Said It** — game: show a real line, user picks, reveal answer + our AI classifier's guess.

**Aesthetic to hit**: feel like you walked into Central Perk. Cinematic, warm, cafe-coded. Reference: **centralperkcoffee.com**.

**IP guardrails**: no actor photos, no clip embedding, no emoji as avatars (we tried, looks childish). Footer must say: *"Educational, non-commercial fan project. Friends™ is owned by Warner Bros."*

---

## The five visual rules

### 1. Character markers — INITIALS in Permanent Marker, NO emoji

80px round avatars. Initial in Permanent Marker, stroke-colored in their strong accent, on their pastel tint background.

| Character | Initial | Marker stroke | Background |
|---|---|---|---|
| Monica | **M** | rose-500 `#F43F5E` | rose-100 `#FFE4E6` |
| Joey | **J** | amber-500 `#F59E0B` | amber-100 `#FEF3C7` |
| Ross | **R** | emerald-600 `#059669` | emerald-100 `#D1FAE5` |
| Chandler | **C** | sky-500 `#0EA5E9` | sky-100 `#E0F2FE` |
| Rachel | **R** | pink-500 `#EC4899` | pink-100 `#FCE7F3` |
| Phoebe | **P** | violet-500 `#8B5CF6` | violet-100 `#EDE9FE` |

### 2. Central Perk orange couch motif (SVG)

A simple SVG of the iconic curved orange couch. Used:
- **Landing**: faded watermark behind brand mark, 5% opacity `#EA580C`, large
- **Chat empty state**: small 24px icon next to *"the couch is empty — sit down."*
- **Guess Who reveal**: small icon next to the revealed character

Show the SVG in isolation in section 00.

### 3. Paper-grain texture

Faint paper/canvas noise on all cream surfaces (3-5% opacity). SVG filter or PNG. Warms cream toward beige.

### 4. Push the orange — confident, not shy

`#EA580C` is the anchor:
- All primary CTAs solid orange + white text (NO outlined-orange primary buttons)
- "Where to watch": outlined at rest, **fills solid on hover**
- Brand mark intro flashes orange on the dots first
- Couch watermark at 5% opacity — orange in the background of every page

### 5. Cinematic transitions — actually run in the page

The HTML animates. Annotate each with Framer Motion language.

- **Brand mark typewriter intro** (800ms total, on load): letters arrive left-to-right one by one, each with its preceding dot. Dots **start in orange `#EA580C`**, then crossfade to final red/blue/yellow over 400ms.
  - `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.08, delay: i * 0.06, ease: "easeOut" }}`
- **Character card hover**: scale 1.03 + 2px accent ring.
  - `whileHover={{ scale: 1.03 }} transition={{ duration: 0.15, ease: "easeOut" }}`
- **Page transition (card click → chat)**: fade through BLACK for 180ms.
  - `AnimatePresence mode="wait"` + `exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: "easeInOut" }}`
- **Message appear**: opacity 0 → 1 + y 4 → 0, 200ms.
  - `initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}`
- **Typing indicator**: 3 dots, sequential opacity 0.3 → 1 → 0.3, 1.4s loop.
- **Send button press**: `whileTap={{ scale: 0.96 }} transition={{ duration: 0.1 }}`.

**All transitions respect `prefers-reduced-motion`** — instant when reduced, but the couch watermark still appears.

---

## Color palette

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F5EFE3` | `#1A1410` | page bg |
| `surface` | `#FFFBF5` | `#2A201A` | cards, bubbles |
| `border` | `#E5DCC7` | `#3D2F26` | hairlines |
| `fg` | `#2C1F14` | `#F5EFE3` | primary text |
| `muted` | `#8B7355` | `#B5A285` | secondary text |
| **`accent`** | **`#EA580C`** | **`#FB923C`** | CTAs, hovers, watermark |
| `accent-2` | `#166534` | `#4ADE80` | confirmations (Guess Who CORRECT) |
| `error` | `#DC2626` | `#F87171` | toasts, failures |
| `success` | `#16A34A` | `#4ADE80` | CORRECT, beat-AI moments |
| dots | red `#F87171` / blue `#60A5FA` / yellow `#FBBF24` | same | Friends logo dots — brand mark only |

---

## Typography — two fonts only

- **Permanent Marker** (Google Fonts) — brand mark, headings ≥24px, Friends-line quotes. NEVER for body.
- **DM Sans** (Google Fonts) — everything else. Line-height 1.6.

---

## Section-by-section detail

### 00 — Cover & Design System

- Page title in giant Permanent Marker: *The One With the AI — Design System*
- Color swatches: every token with hex visible
- Typography specimens: Permanent Marker 96/64/32; DM Sans 18/16/14/12 regular + semibold
- 6 character markers in isolation (80px, in a row)
- Buttons in isolation: primary, secondary, ghost — rest / hover / pressed / disabled
- Chat bubble in isolation: character-side (with avatar + accent border) and user-side (neutral cream)
- Chip in isolation: Guess Who selector pill, default + selected
- Toast variants: error / success / info
- Couch SVG in isolation
- Brand mark static + mid-typewriter keyframe (letters arriving, dots still orange)

### 01 — Landing

- **01.1** Desktop light (1440px)
- **01.2** Desktop dark (1440px)
- **01.3** Mobile light (390px), 2-col grid
- **01.4** Brand mark mid-typewriter keyframe (~400ms in)
- **01.5** Picker card hover, zoomed

### 02 — Chat

- **02.1** Desktop light, mid-conversation (1440px, 5-6 turns, real Friends-y dialogue)
- **02.2** Desktop dark, mid-conversation (1440px)
- **02.3** Empty state (1280×800) — couch icon + *"the couch is empty — sit down"* + welcome bubble
- **02.4** Typing indicator (1280×800)
- **02.5** Where-to-watch dropdown OPEN (1280×800)
- **02.6** Mobile portrait (390×844) — sticky composer
- **02.7** Loading skeleton (1280×800)

### 03 — Guess Who

- **03.1** Game start — rules + "Start round" + score 0/10
- **03.2** Round in progress — line in marker font (e.g. *"WE WERE ON A BREAK!"*) + 6 chips + round counter
- **03.3** Answer reveal CORRECT — green badge, revealed character with couch icon, classifier confidence bar
- **03.4** Answer reveal WRONG — red badge, same layout
- **03.5** End of round — score in giant marker, comparison vs AI, Play Again + Back to Friends

### 04 — States & Errors

- **04.1** Rate-limit toast
- **04.2** Failed message + retry icon (zoomed)
- **04.3** 404 — *"It's like… not happening."* + back link
- **04.4** Offline state — *"Can't reach the chat server."*
- **04.5** Classifier confidence bar — three variants (90%, 50%, 20%)

---

## API contract (informational — for future code gen)

Python FastAPI backend at `process.env.NEXT_PUBLIC_API_URL`:
- `POST /chat` — streaming SSE, `data: {"delta":"..."}` ending with `data: {"done": true}`. Body `{character, messages[]}`.
- `GET /watch?character=Joey` — `{show, options: [{service, url, type}]}`.
- `GET /game/round` — `{line, answer, classifier_pred, classifier_confidence, options}`.

Design should anticipate streaming text, loading states, error states.

---

## Output format

Single HTML file in one code block:

```html
<!DOCTYPE html>
<html>
  <!--
    Sections 00–04 stacked vertically.
    Each section: large Permanent Marker section header + grid of frames at 1440 + 390 breakpoints.
    Each frame: 1px border, soft shadow, label above (section.frame — name • breakpoint • dimensions).
    Tailwind via CDN. Google Fonts (Permanent Marker, DM Sans) via <link>.
    Animations: vanilla CSS or Framer Motion via CDN — must actually run.
    Mono captions next to elements showing Tailwind classes + Framer timing.
  -->
</html>
```

Save as `mockups.html`, double-click, every frame renders, animations play, hovers work.

</pasted_text>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Design System (design system)">
[Design System] This project uses the **Design System** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

    Explore it to find what you need:
    - Always copy out the fonts and colors you need
    - For prototypes and designs, always copy out any relevant components
    - If the design system contains existing mocks of products, and you were asked to design or prototype something similar, copy and fork those mocks to start your design. This helps you make high-quality designs.

    Explore it quickly to find relevant UI kits (e.g. mocks of existing products you can copy and fork)

Full system at `/projects/a4b6ed3b-bd7d-4dd2-916d-4fb9f297397b/`. Before producing any visuals, explore it: call `list_files("/projects/a4b6ed3b-bd7d-4dd2-916d-4fb9f297397b/")` to see the structure, then `read_file` the README/base.md or whatever index file it has. Don't guess at the design system's contents.

CSS tokens: the guide may describe tokens in prose, but the exact `--*` names are defined in the design system's stylesheet(s). Before writing any `var(--*)`, look up the real name in the design system's `.css` files (`list_files` + `read_file` under `/projects/a4b6ed3b-bd7d-4dd2-916d-4fb9f297397b/`). Never guess a token name — an unresolved `var()` silently falls back to the browser default.

For assets and UI kits beyond the guide: `read_file("/projects/a4b6ed3b-bd7d-4dd2-916d-4fb9f297397b/<path>")` and `copy_files` to bring them into the current project.
</attached-skill>

## Assistant

_[tool: list_files]_

I'll start by exploring the design system that's been specified for this project.

_[tool: update_todos]_

The specified design system is empty, so I'll treat the brief itself as the binding spec — it's exhaustively detailed (palette, type, components, motion timings, all 5 sections). This is a paste-and-go deliverable with a clear "STOP after the HTML" instruction, so I'll build it directly rather than asking questions.

Let me lay out my plan.

_[tool: write_file]_

Now let me build the base file — head, design tokens, couch SVG, animations, and the canvas chrome with placeholders for each section.

_[tool: str_replace_edit]_

Base is in. Now Section 00 — the design system reference. This establishes every atom I'll reuse downstream.

_[tool: str_replace_edit]_

I used `.marker`, `.chip`, and `.brand-final` classes — let me add those component styles to the stylesheet.

_[tool: str_replace_edit]_

Section 01 — Landing. Desktop light + dark, mobile, the typewriter keyframe, and a zoomed card-hover state.

_[tool: str_replace_edit]_

Adding the picker-card component styles:

_[tool: str_replace_edit]_

Section 02 (Chat) is the most repetitive — 7 frames sharing one app shell with different states. I'll render these from a single JS template to keep it DRY, so the markup here is just frame wrappers with target slots.

_[tool: str_replace_edit]_

Section 03 — Guess Who. Five distinct game states; I'll hand-write these for fidelity.

_[tool: str_replace_edit]_

Section 04 — States & Errors.

_[tool: str_replace_edit]_

Now the JavaScript — character data, the chat-shell renderer for all 7 chat states, the landing hero builder, and the live typewriter/animation wiring.

_[tool: str_replace_edit]_

_[tool: update_todos]_

Let me check it loads cleanly.

_[tool: show_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: save_screenshot]_

Clean (just the expected Tailwind CDN notice). Let me screenshot a few sections to verify the rendering.

_[tool: view_image]_

_[tool: eval_js]_

The cover renders, but the headings are showing a **cursive fallback**, not Permanent Marker — the font isn't applying. Let me check whether it loaded.

_[tool: run_script]_

Found it: my hand-written CSS uses a malformed font name — `'"Permanent Marker"'` (quotes nested as part of the name) which falls back to cursive. The Tailwind utilities work, but `.sec-head`, `.marker`, etc. don't. Let me fix all three font tokens globally.

_[tool: grep]_

_[tool: show_html]_

Those remaining matches are just JS string concatenations — harmless. The font fix is complete. Let me reload and verify the marker font renders correctly now.

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: eval_js]_

Still rendering as cursive. Let me re-check the computed font after the reload — maybe the iframe cached or the fix didn't take.

_[tool: save_screenshot]_

The computed font is now correct (`"Permanent Marker", cursive`) and the font check passes — the v2 screenshot was likely a stale capture. Let me take a fresh screenshot to confirm actual rendering.

_[tool: view_image]_

_[tool: eval_js]_

The live DOM reports the font correctly loaded and applied — the screenshot renderer (html-to-image) is just falling back to cursive when it rasterizes, which is a known quirk and not a real bug. Let me confirm the font is genuinely applied by measuring glyph metrics rather than trusting the screenshot.

_[tool: eval_js]_

Confirmed — Permanent Marker is genuinely applied (552px width matches the forced-marker measurement, distinct from cursive's 490px). The screenshot tool's rasterizer just falls back to cursive in captures; the live page is correct.

Let me verify the JS-rendered sections (chat shells, landing) populated correctly, then hand off.Everything rendered — all 7 chat slots populated, landing hero built, brand mark typed (7 letters), 62 character markers placed. Let me surface it to the user and check for console errors.

_[tool: done]_

_[tool: fork_verifier_agent]_

Done — **`mockups.html`** is built and live. One self-contained file, no build step, all 5 sections stacked vertically as a pannable Figma-style canvas.

**What's in it:**
- **00 — Cover & Design System**: full color tokens (light/dark hexes), type specimens, all 6 character markers (initials in Permanent Marker, no emoji), button/bubble/chip/toast states, the Central Perk couch SVG in isolation, and the brand mark static + mid-typewriter keyframe.
- **01 — Landing**: desktop light, desktop dark, mobile, the ~400ms typewriter keyframe, and a zoomed card-hover state.
- **02 — Chat**: 7 frames including mid-conversation (light + dark), empty state, typing indicator, where-to-watch dropdown open, mobile portrait, and loading skeleton — all rendered from one shared shell.
- **03 — Guess Who**: start, round in progress, CORRECT reveal, WRONG reveal, end-of-round with you-vs-AI comparison.
- **04 — States & Errors**: rate-limit toast, failed-message retry, 404, offline, and three confidence-bar variants.

**Live in the page**: the brand mark types itself in on load (dots start orange, crossfade to red/blue/yellow), messages fade-and-rise, typing dots loop, hovers scale, bars fill — each annotated with its Framer-Motion timing in mono captions. Everything respects `prefers-reduced-motion`. Footer carries the WB attribution.

Two notes:
- The orange `#EA580C` is pushed hard per the brief — solid CTAs, outlined "where to watch" that fills on hover, 5% couch watermark on every page.
- Per the brief, I **stopped at the HTML** — no Next.js generated.

One heads-up: in flat screenshot exports the Permanent Marker headings may rasterize as a cursive fallback, but in the live browser they render correctly as Permanent Marker (verified by glyph metrics).

## User

can u make this into fima styles like figma difefnet screens this is is not figma style

## Assistant

_[tool: grep]_

The user wants it to actually feel like a Figma file — an infinite pannable/zoomable gray canvas with Figma chrome (toolbar, layers panel, zoom controls), not a vertical-scrolling document. Let me restructure the shell around my existing frames. First, let me look at the exact markup I need to replace.

_[tool: read_file]_

_[tool: str_replace_edit]_

The design system project is empty (confirmed earlier), so the brief remains my spec. Now let me transform this from a scrolling document into a proper Figma-style workspace: dark Figma chrome (toolbar + layers panel + properties panel), an infinite warm-gray canvas with **pan & zoom**, frame labels in Figma's style, a layers tree that focuses frames on click, and zoom controls.

First, the chrome markup + the dark-UI styles, replacing the old TOC bar:

_[tool: str_replace_edit]_

Now close the canvas/viewport after the footer, add the right properties panel, and the zoom controls:

_[tool: str_replace_edit]_

Now the pan/zoom engine, zoom controls, and the layers-tree builder:

_[tool: show_html]_

Let me check it loads cleanly and capture the result.

_[tool: get_webview_logs]_

_[tool: eval_js]_

_[tool: str_replace_edit]_

The canvas is ~12,900px tall (vertical stack), so "fit everything" collapses to 8% — illegible. In a Figma file you'd open fit-to-width at the top, not fit-all. Let me fix the fit logic to fit width and anchor at the top.

_[tool: str_replace_edit]_

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: str_replace_edit]_

This now reads unmistakably as Figma — dark chrome, layers tree, dotted canvas with floating frames, properties panel, zoom controls. One polish issue: long layer names wrap to two lines. Let me make them truncate with ellipsis like real Figma rows.

_[tool: snip]_

Let me register a snip for the resolved font-debugging exchange, then surface the final result.

_[tool: done]_

_[tool: fork_verifier_agent]_

Done. **`mockups.html`** is now a proper Figma-style workspace instead of a scrolling document.

**What changed:**
- **Dark Figma chrome** — top toolbar with the Figma logo, tool cluster (move/frame/shape/pen/text/hand/comment), the `Drafts / The One With the AI — Mockups` breadcrumb, collaborator avatars, Present, and a blue Share button.
- **Left layers panel** — File/Assets tabs, a Pages list, and a full layers tree with every section group expandable into its frames (e.g. `02.5 — Where-to-watch, OPEN`). Click any layer to fly-to and focus that frame.
- **Right properties panel** — Page fill, the 10 color styles as swatches with hexes, the two text styles, and an export row.
- **Infinite canvas** — warm-gray with a dotted grid; all frames float with shadows and Figma-style labels above them.
- **Pan & zoom** — scroll to pan, ⌘/Ctrl+scroll (or trackpad pinch) to zoom toward the cursor, Space-drag for the hand tool, plus a bottom-right zoom bar (−, %, +, Fit). Opens fit-to-width at the top.

All the original content — every screen, both breakpoints, the live microinteractions and component states — is untouched inside the frames; it's just been re-housed in the canvas.

One note carried over: in flat screenshot exports the Permanent Marker headings rasterize as a cursive fallback, but they render correctly in the live browser (verified by glyph metrics earlier).

## User

Verifier agent check completed

## Assistant

The verifier confirmed everything works — pan/zoom, layer-click focus, zoom controls, and no console errors. `mockups.html` is ready as a Figma-style design canvas.

## User

fro ladnifn page i was thinking mor elike feel of cnertal epk this is cnearl oekr website ignor ethe ocfee thign focus on aldnignp page similar or get the ideas and maek it feel to user when he comes he is in friends

## Assistant

_[tool: read_file]_

This is exactly the right reference — the magic of the Central Perk site is the cinematic warm hero, the iconic orange couch, hand-marker headlines, the F•R•I•E•N•D•S dotted treatment, and sketchy hand-drawn doodle/frame accents. My current landing is too clean and minimal; it doesn't make you feel like you walked into the café. Let me redesign section 01 to capture that.

Let me look at the exact couch-defs block so I can add a richer couch illustration and the hand-drawn assets.

_[tool: str_replace_edit]_

Now I'll add a richer Central Perk couch illustration, a coffee-bean doodle, and a hand-drawn "rough" filter — inserted right after the existing couch defs.

_[tool: str_replace_edit]_

Now the CSS for the cinematic hero, sketch frames, and doodles. Let me append it after the picker-card styles:

_[tool: read_file]_

Now I'll rewrite the `landingHTML()` builder into the cinematic Central Perk hero + warm picker section. Let me find the current function.

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

Now replacing `landingHTML()` with the cinematic Central Perk version:

_[tool: read_file]_

The `.landing` containers are fixed at 940px tall and will clip the new 1500px content. Let me update section 01's frames — heights, labels, and the mobile version.

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: str_replace_edit]_

Now updating the two desktop landing containers (height + remove clipping bg) and their labels:

_[tool: str_replace_edit]_

Now the mobile landing — I'll convert it to a tall mobile web frame rendered from JS (so it reuses the cinematic hero). Replacing the hand-written mobile block:

_[tool: grep]_

Now add the mobile builder and wire it into boot. Let me find boot():

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: show_html]_

Let me check it loads and view the redesigned landing. I'll focus the desktop landing frame first.

_[tool: get_webview_logs]_

_[tool: eval_js]_

_[tool: eval_js]_

Structure is correct (hero + picker, couch present, all cards rendered). Let me focus the desktop landing frame and capture it.

_[tool: save_screenshot]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: save_screenshot]_

_[tool: sleep]_

_[tool: save_screenshot]_

_[tool: show_html]_

_[tool: multi_screenshot]_

_[tool: snip]_

This nails it — the landing now feels like walking into Central Perk: a cinematic warm hero with café bokeh lights, the **ENJOYED BEST WITH F•R•I•E•N•D•S** dotted treatment, a big hand-marker headline, the iconic **orange tufted couch** as the centerpiece with steam rising, scattered coffee-bean doodles, and below it a warm "pull up a chair — who do you want to talk to?" section with hand-drawn sketch-framed character cards.

Let me snip the screenshot-retry noise and surface the result.

_[tool: done]_

_[tool: fork_verifier_agent]_

Done. The landing page (section 01) is redesigned to make you feel like you've walked straight into Central Perk:

- **Cinematic warm hero** — deep espresso-to-orange glow with blurred café "bokeh" lights and paper grain, instead of the old flat cream.
- **The orange couch front and center** — a proper tufted Central Perk sofa illustration grounding the hero, with steam curling up and hand-drawn coffee beans scattered in the corner.
- **Friends-coded type** — an `ENJOYED BEST WITH F•R•I•E•N•D•S` eyebrow with the colored dots, a big hand-marker headline (*"The one with the AI"*), and marker-lettered CTAs (`Pick a friend →` solid orange + `Play Guess Who` outline-to-fill), plus carousel dots — all echoing the reference site.
- **A warm "pull up a chair" picker section** below — *"Who do you want to talk to?"* with the six characters in **hand-drawn sketch-framed cards** (wobbly marker borders that turn orange and tilt on hover), plus bean/couch doodle accents.
- Carried through to **desktop dark** and a tall **mobile** layout (slim nav, stacked cards).

The desktop frames are now full-height landing pages (1440×1500) so you see the whole experience, hero through picker.

A couple of notes:
- I kept the rest of the canvas (System, Chat, Guess Who, States) as-is — this change is scoped to the landing. If you'd like, I can carry the same café warmth + couch/doodle motifs into the chat empty-state and Guess Who screens too.
- I didn't add extra marketing bands (a "what is this" story section, locations, etc.) since the brief is a product, not a store — happy to add any of those if you want the landing to scroll longer.

