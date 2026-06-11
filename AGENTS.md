# AGENTS.md — read this before touching anything

This repo is built for agent-driven development. A human (Alyosha) reviews specs and vibe-checks previews; agents do the implementation. Keep PRs small and phase-seamed so any agent can pick up where another left off.

## Architecture map

```
app/page.tsx                  server component — strips case secrets via toPublic()
components/Game.tsx           ALL client UI + game feel (SFX, typewriter, polygraph, stamps)
lib/cases.ts                  ALL game content. Server-only. THE source of truth.
app/api/interrogate/route.ts  one Claude call per question; server-authoritative composure math
app/api/accuse/route.ts       verdict resolution (theory correctness + reveal)
app/globals.css               design tokens + ds-* animation classes ("case file noir" identity)
public/media/                 portraits (1:1 jpg) + theme.mp3
docs/SPEC.md                  game design rules — composure, tactics, intel, ranks
docs/ROADMAP.md               prioritized next work
docs/IDEAS_INBOX.md           unprioritized ideas; promote to ROADMAP, never build directly
```

## Hard rules

1. **Secrets stay server-side.** `persona`, `reveal`, `confession`, and theory `correct` flags must NEVER be imported into a client component or returned by an API route prematurely. If you add fields to `Case`, update `toPublic()` deliberately.
2. **Content is data, not logic.** New suspects, theories, intel = entries in `lib/cases.ts`. Do not hardcode case-specific behavior in components or routes.
3. **Design identity is fixed**: ink `#14120f`, manila `#e8dfc8`, stamp red `#b3262a`, Special Elite (display) + Courier Prime (body), polaroid portraits, stamp verdicts, polygraph meter. Extend it; don't replace it.
4. **Mobile first.** Everything must work one-handed at 380px wide. Tap-first; typing is the fallback.
5. **One API call per player question.** Don't add chained model calls to a turn without a ROADMAP entry approving the latency/cost.
6. **The interrogate prompt is injection-hardened** (players will type "ignore your instructions"). If you edit the prompt in `route.ts`, keep the anti-manipulation rule and the JSON-only contract.

## How to add a case (most common task)

1. Append a `Case` object to `CASES` in `lib/cases.ts`. Required design beats:
   - a hidden truth with a sympathetic or surprising angle (see Rosie),
   - 3–4 pressure points, one explicit resistance (what does NOT work),
   - 4 theories: 1 correct, 3 plausible distractors,
   - 2 intel fragments (unlocked at 66% / 33% composure) that hint at the correct theory,
   - budget/startComposure tuned to difficulty (EASY ~6q/40c, MEDIUM ~8q/65c, HARD ~10q/90c).
2. Generate a 1:1 noir portrait ("muted desaturated palette, dramatic chiaroscuro, cinematic stylized painterly illustration, moody game art"), save to `public/media/<id>.jpg`.
3. Playtest: the case must be crackable within budget by a good player and NOT crackable by spamming one tactic.

## Verification before any PR

```bash
npm run build   # must pass clean
```
Then manually: play one full case to confession AND one to accusation on a mobile-width viewport.

## Session handoff

End every working session by updating `docs/ROADMAP.md` (move done items, add discovered work). That file is the handoff artifact between agents.
