# Changelog

## 2026-06-11 - Sapiens provider migration

### Changed
- Replaced the Anthropic Messages API call in `app/api/interrogate/route.ts` with a Sapiens/Agnes OpenAI-compatible chat-completions request.
- Added `lib/sapiens.ts` as the server-side provider adapter.
- Swapped server configuration from `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` to:
  - `SAPIENS_API_KEY`
  - `SAPIENS_BASE_URL` (defaults to `https://apihub.agnes-ai.com/v1`)
  - `SAPIENS_MODEL` (defaults to `agnes-2.0-flash`)
- Updated README, `.env.example`, AGENTS notes, ROADMAP, and in-game missing-key messaging.
- Added `metadataBase` for the production URL so `next build` resolves social images cleanly.

### Tests
- Added `lib/sapiens.test.mts` for Sapiens request construction and response extraction.
- `npm test` passes.
- `npm run build` passes.
- Local HTTP smoke passes after a clean dev-server restart:
  - `GET /` returns `200`
  - `POST /api/interrogate` without `SAPIENS_API_KEY` returns `{"error":"SAPIENS_API_KEY is not configured on the server."}`
- Browser playtest passed on desktop and 390px mobile viewports:
  - title screen
  - briefing
  - interrogation room
  - missing-key ask state
  - accusation
  - verdict

### Follow-ups
- Set `SAPIENS_API_KEY` in Vercel before production play.
- Re-run a live interrogation turn once the server environment has the key.
- Add a server-side session gate if `/api/accuse` should not reveal case truth before a legitimate accusation state.
