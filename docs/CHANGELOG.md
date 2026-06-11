# Changelog

## 2026-06-11 - Casefile mode (long-form whodunit, jury 5x8/10)

A second mode alongside the daily game: **A Death at Holloway House** — a closed-circle murder solved by
interrogation → cross-examination → a deduction board → a reasoned accusation. **Purely additive** — the
daily game and its 7 cases are untouched.

### Added
- **Backend** (`backend/season-*.mjs`, mounted on `/api/season/*` by `server.mjs`): season content format +
  Season 1 (5 suspects, watertight clue web), a topic-interrogation engine (one model call/turn — the model
  voices + classifies, the server owns all state), `presentOnly` topics cracked only by presenting the right
  clue (cross-examination), deterministic clue unlocks, episode gates, and **server-validated** deduction
  board + accusation. New `season_sessions` Postgres table (auto-created); memory store for tests/local.
- **Consistency validator** (`season-validate.mjs`) proves every season is solvable before it ships.
- **Frontend** (`/casefile`, `components/Casefile.tsx`): roster → interrogation room (topic legibility +
  present-evidence) → Case File → Deduction Board → finale, with save/resume, AI noir suspect portraits, and
  a generated noir theme. New nav entry; the daily landing is unchanged.

### Tests
- 8 new season tests (validator + full solve + present + board); `npm test` 14/14; `npm run build` passes.
- A 5-profile AI jury (narrative / short-attention / deduction / QA / casual) all rate the new mode 8/10 and
  solve the case. Record in `docs/jury/2026-06-11-season-final.md`.

## 2026-06-11 - Polish pass (jury-driven, 5x8/10)

A 5-profile AI playtest jury (short-attention / puzzle / narrative / casual / QA) drove this pass
from an average 6.6/10 to 8.0/10, every profile >= 8. Harness + results in `docs/jury/`.

### Gameplay / difficulty (backend)
- Composure damage is now model-judged **severity (0-3) -> deterministic delta** (-2/-9/-16/-26),
  with model temperature 0.2 for consistent run-to-run scoring (killed the old delta dice-roll).
- Accusation integrity: a blind/near-blind correct guess is a **HUNCH** (rank "?", truth sealed) — no
  more 0-question coin-flip win; a wrong accusation **seals the truth** (no spoiler/answer-leak), and a
  worked-but-wrong call is a **NEAR_MISS** (rank D) rather than a flat F. Ranks reflect actual play.
- **Repeat-question guard** (-> delta 0), **filler floor** (-2), and **BLUFF that names the truth or is
  plausible+undisprovable lands** while absurd bluffs glance off.
- Guaranteed in-room confession on a crack; per-turn **`read`** ("why it landed") + `questionsRemaining`.

### Content
- 3 -> **7 cases**: added Tupperware Heist (comedy/EASY), The Plus-One Problem (dating/MED),
  The Vienna Requiem (history/MED), The Off-World Tell (sci-fi/HARD). Each with an AI noir portrait.

### Frontend
- Interrogation room **CASE FILE panel** (fills the empty void) + inline intel; separated **ACCUSE**
  with a stakes hint; shuffled theory order; outcome-aware verdict (incl. sealed-truth + NEAR_MISS);
  spoiler-free **share card with day number + streak**; SFX on by default; per-line `read` feedback.

### Tests
- `npm test` 8/8; `npm run build` passes.

## 2026-06-11 - Free-forever front page

### Changed
- Reworked the first screen into a noir front page inspired by modern web-game launch pages while keeping Daily Suspect's own case-board identity.
- Added hero CTAs, free-forever messaging, compact game facts, a three-step explainer, and a wider responsive case-file grid.
- Kept the game free forever: no account prompt, pricing, subscription, or paywall UI.

### Tests
- `npm test` passes.
- `npm run build` passes.
- Local browser QA passes on desktop and 390px mobile, including no horizontal overflow and click-through into a case briefing.

## 2026-06-11 - Production operations handoff

### Added
- Added `docs/OPERATIONS.md` with production URLs, Hetzner paths, systemd services, Cloudflare Tunnel details, Vercel env configuration, deploy flow, and verification checklist.
- Linked the operations runbook from `README.md` and `AGENTS.md`.

## 2026-06-11 - Hetzner backend and Vercel frontend split

### Changed
- Moved game compute from Next API routes to a standalone Node backend in `backend/`.
- Converted the Vercel app into a browser-facing frontend that reads `NEXT_PUBLIC_DAILY_SUSPECT_API_URL`.
- Added server-created game sessions, so interrogation turns use backend-owned transcript, composure, question count, and cracked state.
- Moved Sapiens calls into `backend/sapiens.mjs`; the Sapiens API key belongs on Hetzner, not in Vercel.
- Added Postgres-backed session storage for Hetzner and an in-memory fallback for local development/tests.
- Added CORS configuration for the production Vercel origin and local preview origins.
- Removed the old `app/api/interrogate`, `app/api/accuse`, `lib/cases.ts`, and frontend-side Sapiens adapter.

### Security
- `/api/accuse` now requires a valid backend session ID before returning a reveal.
- `theoryIndex: -1` only returns the reveal after the session has actually cracked.

### Tests
- Added `backend/app.test.mjs` for the Hetzner API contract.
- `npm test` passes.
- `npm run build` passes.
- Public Hetzner API checks pass through Cloudflare:
  - `GET /health`
  - `GET /api/cases` without reveal fields
  - `POST /api/session`
  - `POST /api/interrogate` with a live Sapiens turn
- Production Vercel playtest passes on desktop and 390px mobile viewport.

## 2026-06-11 - Sapiens provider migration

### Changed
- Replaced the Anthropic provider path with Sapiens/Agnes OpenAI-compatible chat completions.
- Swapped server configuration from `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` to:
  - `SAPIENS_API_KEY`
  - `SAPIENS_BASE_URL` (defaults to `https://apihub.agnes-ai.com/v1`)
  - `SAPIENS_MODEL` (defaults to `agnes-2.0-flash`)
- Added `metadataBase` for the production URL so `next build` resolves social images cleanly.

### Tests
- `npm test` passed.
- `npm run build` passed.
- Browser playtest passed on desktop and 390px mobile viewports.
