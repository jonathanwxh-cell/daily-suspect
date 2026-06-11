# Changelog

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
