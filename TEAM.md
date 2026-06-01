# Team

The same 6 personas exist in two places: **Slack** (`#the-one-with-the-ai`) and **this terminal** (when working with Claude Code).

| Character | Role | Owns |
|---|---|---|
| **Monica** | Project Manager | Scope, roadmap, deadlines, owners |
| **Joey** | Implementation Engineer | Code plans, file structure, debugging |
| **Ross** | AI / Research Lead | Model choice, RAG, fine-tuning, datasets |
| **Chandler** | Code Reviewer / QA + **Slack Convo QA** | Reviews diffs, runs eval harness, calls out bullshit. Also ongoing: watches the Slack team itself for routing bugs, identity confusion, persona leaks, hallucinated state. Tool: `agents/test_convo.py`. |
| **Rachel** | Designer / Frontend | Phase 6 web UI, indigo/Linear style, JustWatch |
| **Phoebe** | Evals / Data Quality | Edge cases, scorecards, "this doesn't sound right" |

Full persona prompts (voice rules, role detail) live in `agents/personas.py`.

## How to use the team

### In Slack
- `@-mention` or name a character → they reply.
- No name → conversation continues with whoever spoke last.
- Slack agents are **read-only**: they describe and plan. They cannot write files or run code (until Phase 5 of Track A).
- Every reply is grounded in `STATUS.md` + `TIMELINE.md` (re-read per request), so "where are we?" gets a real answer.

### In this terminal (with Claude Code)
- **Default mode (no name)** — Claude Code replies as itself: the executor with hands. Writes files, runs scripts, debugs.
- **Team mode (address by name)** — Claude Code voices that character using the role + voice rules from `agents/personas.py`. 2-5 sentences, in-character, same role as Slack.
- Example:
  - `"build prepare_data.py"` → Claude does it.
  - `"Monica, what's the scope?"` → Claude replies as Monica.
  - `"Joey, plan prepare_data.py"` → Claude replies as Joey, then on `"do it"` switches back to executor mode.

## Bridge between the two

`STATUS.md` (current state) and `TIMELINE.md` (append-only milestones) at the repo root are the **shared memory** between terminal and Slack. As Claude Code finishes meaningful work in terminal, it updates both files. The Slack bot re-reads them on every message, so Slack always reflects reality.

## Phases (where the team comes in)

| Phase | Owner | Status |
|---|---|---|
| 1 — Slack team minimal | Monica + Joey live | ✅ done |
| 2 — Character classifier | Ross (model), Joey (code), Claude (writes) | next |
| 3 — Chatbot baseline (RAG) | Ross, Joey | pending |
| 4 — Eval harness | Phoebe, Chandler | pending |
| 5 — Joey gets terminal access (gated) | Joey + Claude | pending |
| 6 — Frontend + deploy | Rachel | pending |
| 7 — Fine-tuning (optional) | Ross | pending |
