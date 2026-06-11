# Daily Suspect

**Make them talk.** An AI interrogation game: one suspect, a handful of questions, one hidden truth. Tap tactic chips or type your own questions, hit pressure points to break their composure, get the confession, or run out of questions and stake your accusation.

Live: https://daily-suspect.vercel.app

## How It Works

- Vercel serves the browser UI only. `components/Game.tsx` fetches public cases and session turns from `NEXT_PUBLIC_DAILY_SUSPECT_API_URL`.
- Hetzner runs the Node backend in `backend/`, keeps Sapiens credentials server-side, and stores game sessions in local Postgres.
- Cloudflare Tunnel exposes the Hetzner backend over HTTPS at `https://daily-suspect-api.alyoechosys.dev`.
- Each player question is one backend Sapiens chat-completions call returning structured JSON: in-character reply, composure delta, and suggested follow-up questions.
- The hidden truth never reaches the browser. `backend/cases.mjs` owns personas, reveals, confession text, and theory correctness.
- Zero audio assets: SFX are procedural Web Audio. The noir theme (`public/media/theme.mp3`) and portraits were AI-generated.

## Run Locally

```bash
npm install
cp .env.example .env.local

# Terminal 1: backend API on http://127.0.0.1:4117
npm run dev:api

# Terminal 2: frontend on http://127.0.0.1:3000
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Set `NEXT_PUBLIC_DAILY_SUSPECT_API_URL=http://127.0.0.1:4117` for local frontend work. Without `DATABASE_URL`, the local backend uses an in-memory session store.

## Deploy

Frontend pushes to `main` auto-deploy via the linked Vercel project. Required Vercel env var:

```bash
NEXT_PUBLIC_DAILY_SUSPECT_API_URL=https://daily-suspect-api.alyoechosys.dev
```

Backend deployment is a Hetzner systemd service running `node backend/server.mjs` with:

```bash
PORT=4117
DATABASE_URL=postgres://...
SAPIENS_API_KEY=...
SAPIENS_BASE_URL=https://apihub.agnes-ai.com/v1
SAPIENS_MODEL=agnes-2.0-flash
CORS_ORIGINS=https://daily-suspect.vercel.app
```

## For AI Agents

Read `AGENTS.md` first. Game design rules live in `docs/SPEC.md`. Planned work lives in `docs/ROADMAP.md`. Raw ideas live in `docs/IDEAS_INBOX.md`.
