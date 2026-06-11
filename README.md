# Daily Suspect

**Make them talk.** An AI interrogation game: one suspect, a handful of questions, one hidden truth. Tap tactic chips (or type your own questions), hit pressure points to break their composure, get the confession — or run out of questions and stake your accusation.

Live: https://daily-suspect.vercel.app

## How it works

- Each **case** is a pure data object in `lib/cases.ts` — character, hidden truth, pressure points, intel fragments, theories.
- Each player question = one server-side Sapiens chat-completions call (`app/api/interrogate/route.ts`) returning structured JSON: in-character reply, composure delta, three suggested follow-up questions.
- The **hidden truth never reaches the browser.** `app/page.tsx` strips secrets via `toPublic()`; verdicts resolve through `app/api/accuse/route.ts`.
- Zero audio assets: SFX are procedural Web Audio. The noir theme (`public/media/theme.mp3`) and portraits were AI-generated.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your SAPIENS_API_KEY
npm run dev
```

## Deploy

Pushes to `main` auto-deploy via the linked Vercel project. Required env var (Production + Preview): `SAPIENS_API_KEY`. Optional: `SAPIENS_BASE_URL` (defaults to `https://apihub.agnes-ai.com/v1`) and `SAPIENS_MODEL` (defaults to `agnes-2.0-flash`).

## For AI agents

Read `AGENTS.md` first. Game design rules live in `docs/SPEC.md`. Planned work in `docs/ROADMAP.md`. Raw ideas in `docs/IDEAS_INBOX.md`.
