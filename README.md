# Daily Suspect

**Make them talk.** An AI interrogation game: one suspect, a handful of questions, one hidden truth. Tap tactic chips (or type your own questions), hit pressure points to break their composure, get the confession — or run out of questions and stake your accusation.

Live: deployed on Vercel (see project `daily-suspect`).

## How it works

- Each **case** is a pure data object in `lib/cases.ts` — character, hidden truth, pressure points, intel fragments, theories.
- Each player question = one server-side Claude call (`app/api/interrogate/route.ts`) returning structured JSON: in-character reply, composure delta, three suggested follow-up questions.
- The **hidden truth never reaches the browser.** `app/page.tsx` strips secrets via `toPublic()`; verdicts resolve through `app/api/accuse/route.ts`.
- Zero audio assets: SFX are procedural Web Audio. The noir theme (`public/media/theme.mp3`) and portraits were AI-generated.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

## Deploy

Pushes to `main` auto-deploy via the linked Vercel project. Required env var (Production + Preview): `ANTHROPIC_API_KEY`. Optional: `ANTHROPIC_MODEL` (defaults to `claude-sonnet-4-6`).

## For AI agents

Read `AGENTS.md` first. Game design rules live in `docs/SPEC.md`. Planned work in `docs/ROADMAP.md`. Raw ideas in `docs/IDEAS_INBOX.md`.
