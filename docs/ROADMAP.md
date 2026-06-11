# ROADMAP

## Now (v0.4 - shipped)
- [x] Move game compute from Vercel API routes to Hetzner Node backend
- [x] Add backend-owned sessions for transcript, composure, question count, cracked state, and verdicts
- [x] Add Postgres session store for Hetzner plus memory store for tests/local development
- [x] Convert Vercel app to frontend-only API client
- [x] Deploy backend to Hetzner systemd + Cloudflare Tunnel
- [x] Set `NEXT_PUBLIC_DAILY_SUSPECT_API_URL` in Vercel
- [x] Production desktop and 390px mobile playtest against the Hetzner API

## Next (v0.5 - pick one per session)
- [ ] Rate limit `/api/interrogate` before sharing the URL widely
- [ ] Daily case pipeline: agent writes a new case, second pass adversarially playtests it, human approves, merge
- [ ] Anonymous results table + per-case leaderboard
- [ ] Daily rotation: select case by date and share day number
- [ ] 3 more cases: sci-fi Voight-Kampff, The Date, History

## Later
- [ ] Streaks + local detective rank progression
- [ ] "You're the Suspect" inverted mode
- [ ] UGC case builder with moderation pass
- [ ] Per-case ambient music variants
- [ ] i18n: full Singlish UI mode

## Known Debt
- Media presigned URLs were replaced by committed files; portraits are still unoptimized jpgs.
- No rate limiting on `/api/interrogate`.
- Hidden game truths are protected from the browser/runtime API, but the public GitHub repository still contains case answers in `backend/cases.mjs`.
