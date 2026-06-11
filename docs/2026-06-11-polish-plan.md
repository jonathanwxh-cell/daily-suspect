# Daily Suspect — Polish Plan (2026-06-11)

## Goal
Raise the whole game's quality — difficulty, replayability, UX, gameplay, modern
short-attention-span feel — until a 5-profile AI jury rates it **8/10**.

## Success metric (the gate)
A "fun jury" of 5 distinct player-profile agents each **play** the game through the
backend API (the core loop is text, so an LLM can genuinely play it) **and** review
screenshots of the key screens, then rate it 1–10 with structured critique.
Target: **all 5 ≥ 8/10**. Runs recorded under `docs/jury/`.

### Jury profiles (diverse "people in this era")
1. **Maya, 19** — short attention, TikTok-brain. Quits if bored in 30s. Weights: hook speed, fun, humor, no walls of text.
2. **Devon** — hardcore puzzle/strategy gamer. Weights: fair + deep difficulty, mastery, hates unfair RNG.
3. **Priya** — narrative / interactive-fiction lover (Disco Elysium). Weights: writing, character, payoff.
4. **Carl, 45** — casual mobile commuter, 2-minute bursts. Weights: pick-up-and-play, clarity, replay pull.
5. **Sam** — cynical QA/critic. Weights: craft, polish, bugs, jank, balance.

Each returns JSON: `rating` (1–10), `verdict`, `strengths[3]`, `problems[3]`,
`wouldReplay` (bool), `mustFixToReach8` (list).

## Constraints
- **Coordinate with parallel Codex dev.** Codex owns the **landing/front page** (commit `92bd827`:
  `ds-hero-*`, `ds-front-*`, `ds-steps`, `ds-case-grid`). My lanes: interrogation **room**,
  **verdict/share**, **gameplay/difficulty**, **content (cases)**, **audio/voice/image**, **replay structure**.
  Pull before every push; `git add` explicit paths; work on branch `polish`.
- **AGENTS.md hard rules:** secrets stay server-side; Vercel is frontend-only; content is data not logic;
  design tokens fixed (ink/manila/stamp-red, Special Elite + Courier Prime, polaroids, stamps, polygraph);
  mobile-first @380px; **one model call per player question** (voice/telegraph must be async, not block the turn);
  interrogation prompt stays injection-hardened + JSON-only.

## Local dev
- Backend (my branch): `node backend/server.mjs` on **:4217** with `SAPIENS_API_KEY` (Agnes flash). Memory store.
- Frontend: `next dev` on **:3001**, `.env.local` → `NEXT_PUBLIC_DAILY_SUSPECT_API_URL=http://127.0.0.1:4217`.
- A separate backend (Codex/earlier) runs on :4117 — left untouched.

## Workstreams (re-juried after each)
- **W1 — Core feel & difficulty:** rebalance composure deltas so pressure-point hits land hard and
  resisted tactics clearly fizzle; add a "flinch" telegraph before the delta resolves; punchier room/verdict juice.
- **W2 — Content & replayability (biggest lever):** more cases across categories (comedy / local / thriller /
  the-date / sci-fi); **daily rotation** (the name demands it) + a **random / endless** mode; portraits via our image tools.
- **W3 — Sensory:** suspect **voice** (MiniMax/MiMo TTS) for opening + confession, with a per-line toggle (async, non-blocking);
  mood-reactive music.
- **W4 — UX:** sharper onboarding/quick-play, mobile one-hand pass, cinematic verdict + one-tap share.

## Tools on hand
Agnes flash (gameplay LLM), MiniMax (image / music / voice), Codex image, MiMo TTS, Hetzner deploy MCP (backend),
Vercel (frontend). Jury = Claude sub-agents via the Agent tool.
