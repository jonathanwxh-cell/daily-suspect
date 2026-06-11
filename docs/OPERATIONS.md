# Operations Runbook

This is the production handoff for future agents. GitHub is the source of truth; Vercel serves the frontend; Hetzner runs the backend, database, and Cloudflare Tunnel.

## Production URLs

- Frontend: https://daily-suspect.vercel.app
- Backend API: https://daily-suspect-api.alyoechosys.dev
- API health: https://daily-suspect-api.alyoechosys.dev/health

## Source And Deploy Targets

- GitHub repository: `https://github.com/jonathanwxh-cell/daily-suspect`
- Branch: `main`
- Vercel project: `daily-suspect`
- Hetzner SSH alias: `ssh hetzner`
- Hetzner host: `hermes-cx33-01`
- Hetzner project path: `/home/alyosha/workspace/projects/daily-suspect`
- Backend env file: `/home/alyosha/workspace/projects/daily-suspect/backend/.env`
- Backend secret storage: `/home/alyosha/workspace/secrets/daily-suspect/`
- Cloudflare tunnel config: `/home/alyosha/.cloudflared/daily-suspect-api.yml`

Do not print or commit secrets from `.env` or `/home/alyosha/workspace/secrets/daily-suspect/`.

## Runtime Shape

Vercel is frontend-only. It builds the Next app from `main` and the browser calls:

```bash
NEXT_PUBLIC_DAILY_SUSPECT_API_URL=https://daily-suspect-api.alyoechosys.dev
```

Hetzner runs:

```text
daily-suspect-api.service                Node API on 127.0.0.1:4117
cloudflared-daily-suspect-api.service    Cloudflare Tunnel to 127.0.0.1:4117
Postgres database                        daily_suspect
Postgres role                            daily_suspect_app
```

The Sapiens/Agnes key lives only in the Hetzner backend `.env` as `SAPIENS_API_KEY`.

### Casefile mode (additive)

The long-form Casefile mode shares the same Node backend, mounted on `/api/season/*` (see
`backend/season-*.mjs`; `server.mjs` routes `/api/season` to it). It uses its own `season_sessions`
Postgres table in the `daily_suspect` database (auto-created on boot via `ensureSchema`) — the daily
`sessions` table is untouched. Deploy is identical to the daily backend (sync the `backend/*.mjs` files,
restart `daily-suspect-api.service`). The frontend lives at `/casefile`; suspect portraits + theme are
served from `public/media/season/` (Vercel). Validate a season with `validateSeason` before shipping it.

## Systemd Services

Both services are user services under `alyosha`, enabled at boot, and configured to restart automatically. User lingering is enabled, so they should start after reboot without an SSH login.

Check status:

```bash
ssh hetzner 'systemctl --user status daily-suspect-api.service --no-pager -l'
ssh hetzner 'systemctl --user status cloudflared-daily-suspect-api.service --no-pager -l'
ssh hetzner 'loginctl show-user alyosha -p Linger --value'
```

Expected:

```text
daily-suspect-api.service: active, enabled, Restart=always, RestartSec=3
cloudflared-daily-suspect-api.service: active, enabled, Restart=always, RestartSec=5
linger: yes
```

Restart services:

```bash
ssh hetzner 'systemctl --user restart daily-suspect-api.service'
ssh hetzner 'systemctl --user restart cloudflared-daily-suspect-api.service'
```

View logs:

```bash
ssh hetzner 'journalctl --user -u daily-suspect-api.service -n 120 --no-pager'
ssh hetzner 'journalctl --user -u cloudflared-daily-suspect-api.service -n 120 --no-pager'
```

## Backend Verification

Local-to-box checks:

```bash
ssh hetzner 'curl -fsS http://127.0.0.1:4117/health'
ssh hetzner 'curl -fsS http://127.0.0.1:4117/api/cases'
```

Public checks:

```bash
curl -fsS https://daily-suspect-api.alyoechosys.dev/health
curl -fsS https://daily-suspect-api.alyoechosys.dev/api/cases
```

`/api/cases` must not include hidden fields such as `persona`, `reveal`, `confession`, or theory correctness.

## Database Verification

```bash
ssh hetzner "sudo -n -u postgres psql -Atc \"select datname from pg_database where datname='daily_suspect';\""
ssh hetzner "PGPASSWORD=\$(cat /home/alyosha/workspace/secrets/daily-suspect/db_password) psql -h 127.0.0.1 -U daily_suspect_app -d daily_suspect -Atc \"select to_regclass('public.sessions');\""
```

Expected output includes:

```text
daily_suspect
sessions
```

## Cloudflare Tunnel

Tunnel name: `daily-suspect-api`

Tunnel ID:

```text
08a94ddc-f337-4076-bd69-073edb3abb9b
```

DNS route:

```text
daily-suspect-api.alyoechosys.dev -> daily-suspect-api tunnel -> http://127.0.0.1:4117
```

Check tunnel:

```bash
ssh hetzner 'cloudflared tunnel list'
ssh hetzner 'systemctl --user status cloudflared-daily-suspect-api.service --no-pager -l'
```

## Vercel

Required Vercel env var:

```bash
NEXT_PUBLIC_DAILY_SUSPECT_API_URL=https://daily-suspect-api.alyoechosys.dev
```

This was set for `production`, `preview`, and `development` using the Vercel REST API from the Hetzner box. The Vercel token is in:

```text
/home/alyosha/workspace/projects/mcp-deploy/.env
```

Do not print that file. If needed, source it on the box and call the Vercel API from there.

## Deploy Flow

Frontend deploy:

1. Commit changes locally.
2. Push `main` to GitHub.
3. Vercel auto-deploys the frontend from GitHub.
4. Verify https://daily-suspect.vercel.app.

Backend deploy:

1. Commit and push the backend change to GitHub.
2. Sync the working tree to `/home/alyosha/workspace/projects/daily-suspect` on Hetzner, excluding `.git`, `node_modules`, `.next`, and `.vercel`.
3. Run `npm ci --omit=dev` on Hetzner if dependencies changed.
4. Restart `daily-suspect-api.service`.
5. Verify local API, public API, and production frontend.

Current backend deployment was synced as an extracted working copy, not a Git checkout. Keep GitHub as the audit trail and source of truth.

## Local Verification Before Push

```bash
npm test
npm run build
```

For browser checks, run:

```bash
npm run dev:api
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Then open:

```text
http://127.0.0.1:3000
```

## Production Verification Checklist

- `git status --short --branch` is clean and at `main...origin/main`.
- Vercel latest deployment for `main` is `READY`.
- `https://daily-suspect.vercel.app/` returns HTTP 200.
- `https://daily-suspect-api.alyoechosys.dev/health` returns `{"ok":true}`.
- `GET /api/cases` returns public cases without reveal fields.
- `GET /api/season/list` returns the Casefile season(s); `POST /api/season/start` creates a session; `/casefile` loads.
- Browser playtest reaches the case board.
- Starting Lucas creates a session and reaches the interrogation room.
- A live question advances from `Q 0/6` to `Q 1/6` without `Server missing API key` or `Line went dead`.
- 390px viewport has no horizontal overflow on the title board.

## Known Operational Debt

- No rate limiting on `/api/interrogate` yet.
- The backend working copy on Hetzner is not a Git checkout.
- Hidden game truths are protected from the browser/runtime API, but the public GitHub repository contains the case answers in `backend/cases.mjs`.
