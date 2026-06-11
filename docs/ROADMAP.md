# ROADMAP

## Now (v0.3 — shipped in this repo)
- [x] Server-authoritative engine, 3 launch cases, full game feel, procedural SFX, noir score
- [ ] Set ANTHROPIC_API_KEY in Vercel (human task — game is dead without it)
- [ ] Mobile vibe-check on production URL

## Next (v0.4 — pick ONE per session)
- [ ] **Daily case pipeline**: script `scripts/generate-case.ts` — agent writes a new Case JSON, a second adversarial pass auto-playtests it (can it be cracked in budget? does tactic-spam fail?), human approves, merge. This is the moat.
- [ ] Supabase: anonymous results table + per-case leaderboard (fewest questions to crack)
- [ ] Daily rotation: `/api/daily` selects case by date; share grid numbers the day ("Suspect #14")
- [ ] 3 more cases (one per category: sci-fi Voight-Kampff, The Date, History)

## Later
- [ ] Streaks + local detective rank progression
- [ ] "You're the Suspect" inverted mode (AI interrogates the player, tracks contradictions)
- [ ] UGC case builder (users author suspects; needs moderation pass)
- [ ] Per-case ambient music variants
- [ ] i18n: full Singlish UI mode

## Known debt
- Composure is sent from client per turn (server clamps but trusts the value). Fix: server-side session store (Supabase) keyed by game id.
- Media presigned URLs replaced by committed files — done, but portraits are unoptimized jpg (~MBs); consider next/image + compression.
- No rate limiting on /api/interrogate; add per-IP limit before sharing the URL widely.
