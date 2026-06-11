# ROADMAP

## Now (v0.7 - Casefile mode, shipped; new-mode jury 5x8/10)
- [x] Long-form closed-circle whodunit mode at `/casefile` (additive; daily game untouched)
- [x] Season engine: topic interrogation, presentOnly cross-examination, deduction board, server-validated accusation
- [x] Season 1 "A Death at Holloway House" (5 suspects, watertight clue web) + consistency validator
- [x] AI noir portraits + a generated theme; save/resume
- [ ] More seasons / episodes; a surviving plausible suspect (real branching/misdirection)
- [ ] Board accepts any *sufficient* proof set; suspects escalate under pressure; tighter question→topic routing
- [ ] Surface full clue text + a board "what's still needed" checklist in the room UI

## Now (v0.4 - shipped)
- [x] Move game compute from Vercel API routes to Hetzner Node backend
- [x] Add backend-owned sessions for transcript, composure, question count, cracked state, and verdicts
- [x] Add Postgres session store for Hetzner plus memory store for tests/local development
- [x] Convert Vercel app to frontend-only API client
- [x] Deploy backend to Hetzner systemd + Cloudflare Tunnel
- [x] Set `NEXT_PUBLIC_DAILY_SUSPECT_API_URL` in Vercel
- [x] Production desktop and 390px mobile playtest against the Hetzner API

## Now (v0.6 - polish pass, shipped; jury 5x8/10)
- [x] Difficulty rework: severity->deterministic delta, temp 0.2 consistency, filler floor, repeat guard
- [x] Accusation integrity: HUNCH (no 0-question win), sealed truth on wrong, NEAR_MISS for worked-but-wrong
- [x] First-class BLUFF (names-truth / plausible lands, absurd glances off) + per-turn "read" feedback
- [x] 4 new cases -> 7 total (Tupperware, The Date, Salieri/History, Voight-Kampff) + AI noir portraits
- [x] Room CASE FILE panel, separated ACCUSE, shuffled theories, outcome-aware verdict, SFX default on
- [x] Spoiler-free share card with day number + localStorage streak
- [x] 5-profile AI playtest jury harness (docs/jury/)

## Next (pick one per session)
- [ ] Rate limit `/api/interrogate` before sharing the URL widely
- [ ] Featured single "Today's Suspect" + cloud-persisted streak (currently free menu + browser-only streak)
- [ ] Reveal a partial truth / "the thread you missed" on a wrong accusation (retention)
- [ ] Theories earned via intel rather than all shown up front; an occasional "obvious theory is a trap" case
- [ ] Anonymous results table + per-case leaderboard
- [ ] Daily case pipeline: agent writes a new case, adversarial playtest, human approves, merge

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
