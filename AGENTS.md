# AGENTS.md - read this before touching anything

This repo is built for agent-driven development. A human reviews specs and vibe-checks previews; agents do the implementation. Keep PRs small and make handoffs easy.

## Architecture Map

```text
app/page.tsx                  Vercel frontend shell only
components/Game.tsx           client UI + game feel; fetches the Hetzner API
lib/api-client.ts             browser-safe API base URL helper
lib/types.ts                  public case/session response types only
backend/cases.mjs             all game content, including hidden truth fields
backend/app.mjs               API router: cases, sessions, interrogation, verdicts
backend/sapiens.mjs           Sapiens/Agnes chat-completions adapter
backend/stores.mjs            memory store for tests/local, Postgres store for Hetzner
backend/server.mjs            loopback-only Node server for systemd + Cloudflare Tunnel
app/globals.css               design tokens + ds-* animation classes
public/media/                 portraits (1:1 jpg) + theme.mp3
docs/SPEC.md                  game design rules
docs/OPERATIONS.md            production URLs, Hetzner services, deploy and verification runbook
docs/ROADMAP.md               prioritized next work
docs/IDEAS_INBOX.md           unprioritized ideas; promote to ROADMAP, never build directly
```

## Hard Rules

1. Secrets stay on the Hetzner backend. `persona`, `reveal`, `confession`, and theory `correct` flags must never be imported into a client component or returned before a valid session verdict.
2. Vercel is frontend only. Do not add Next API routes for game compute unless the architecture is deliberately changed.
3. Content is data, not logic. New suspects, theories, and intel belong in `backend/cases.mjs`; do not hardcode case-specific behavior in components.
4. Design identity is fixed: ink `#14120f`, manila `#e8dfc8`, stamp red `#b3262a`, Special Elite display, Courier Prime body, polaroid portraits, stamp verdicts, polygraph meter.
5. Mobile first. Everything must work one-handed at 380px wide. Tap-first; typing is the fallback.
6. One model call per player question. Do not add chained model calls to a turn without a ROADMAP entry approving the latency and cost.
7. The interrogation prompt is injection-hardened. If you edit `backend/app.mjs`, keep the anti-manipulation rule and JSON-only contract.

## How To Add A Case

1. Append a case object to `backend/cases.mjs`. Required design beats:
   - a hidden truth with a sympathetic or surprising angle,
   - 3-4 pressure points and one explicit resistance,
   - 4 theories: 1 correct, 3 plausible distractors,
   - 2 intel fragments unlocked at 66% and 33% composure,
   - budget/startComposure tuned to difficulty (EASY ~6q/40c, MEDIUM ~8q/65c, HARD ~10q/90c).
2. Generate a 1:1 noir portrait and save it to `public/media/<id>.jpg`.
3. Playtest: the case must be crackable within budget by a good player and not crackable by spamming one tactic.

## Verification Before Any PR

```bash
npm test
npm run build
```

Then manually play one full case to confession and one to accusation on a mobile-width viewport.

For production, follow `docs/OPERATIONS.md`. It records the Hetzner paths, systemd services, Cloudflare tunnel, Vercel env var, deploy flow, and live verification checklist.

## Session Handoff

End every working session by updating `docs/ROADMAP.md` with completed work and discovered debt. If infrastructure, deployment, service names, ports, domains, or secret locations change, update `docs/OPERATIONS.md` in the same commit.
