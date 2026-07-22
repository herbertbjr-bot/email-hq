# Email HQ

A multi-account email client: FastAPI backend (secure IMAP/SMTP) + React/TypeScript
frontend, with a customizable widget dashboard, a full theming/icon-pack/skin
system, and AI-assisted smart tagging, message prioritization, and quick-reply
generation (real model output when configured, rule-based heuristics
otherwise).

## Project layout

```
Email HQ/
  backend/    FastAPI app - accounts, IMAP/SMTP services, AI services
  frontend/   Vite + React + TypeScript dashboard
```

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
copy .env.example .env        # Windows: copy, macOS/Linux: cp

# Generate a real credential-encryption key and paste it into .env:
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

uvicorn app.main:app --reload --port 8000
```

The API is served at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`. SQLite (`emailhq.db`) is used by default;
point `DATABASE_URL` at Postgres for production.

Run tests: `pytest` (from `backend/`).

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies `/api/*` to the
backend on port 8000 (see `vite.config.ts`).

## Deployment (Vercel + Neon)

**Live**: https://email-hq.vercel.app - Vercel project `seed-level-technologies/email-hq`,
database Neon project `email-hq` (`icy-wildflower-85510558`, `aws-us-east-1`),
source at https://github.com/herbertbjr-bot/email-hq.

**Architecture**: one Vercel project serves both halves, configured by the
root [`vercel.json`](vercel.json):

- `frontend/` builds via `@vercel/static-build` (`npm run build` → Vite
  static output) and is served at `/`.
- `backend/index.py` - a thin re-export of the FastAPI `app` from
  `backend/app/main.py` - runs as a `@vercel/python` serverless function.
  `vercel.json` routes `/api/*` and `/health` to it; everything else falls
  through to the static frontend build.
- Same-origin in production, so no CORS configuration is needed between
  frontend and backend (unlike the two-Vercel-projects alternative).
- The database engine uses `NullPool` (`backend/app/db/database.py`) since
  each serverless invocation is a fresh, short-lived process - a normal
  connection pool would go stale between invocations. `DATABASE_URL` points
  at Neon's **pooled** endpoint (hostname contains `-pooler`, routed through
  PgBouncer) so Postgres itself absorbs that connection churn.

**Redeploying**: pushing to `master` on GitHub auto-deploys to production
(the Vercel project is Git-connected via `vercel git connect`). You can also
deploy directly from a local working tree without pushing first by running
`vercel --prod` from the `Email HQ/` directory (respects `.vercelignore`) -
useful for previewing uncommitted changes.

**Environment variables** (set via `vercel env add <NAME> production`, then
`vercel env pull` if you need to inspect them locally): `DATABASE_URL`
(Neon pooled connection string, `+asyncpg` driver, `?ssl=require`),
`CREDENTIAL_ENCRYPTION_KEY`, `JWT_SECRET_KEY`, `ENVIRONMENT=production`,
`DEBUG=false`. All were generated fresh for production (not copied from a
local `.env`). AI features default to heuristic mode in production - add
`AI_PROVIDER=anthropic` and `AI_API_KEY` the same way to enable live model
output.

**Schema changes**: there's no Alembic migration set up yet (the package is
in `requirements.txt` for future use, but unconfigured). The `email_accounts`
table on Neon was created by running `Base.metadata.create_all` once locally
against the Neon connection string. If you change `backend/app/models/`,
rerun an equivalent `create_all` against the Neon URL (or set up real Alembic
migrations) before deploying - the serverless function does not run
migrations automatically.

## Adding an account

Use the "+" button next to **Accounts** in the sidebar. Most providers
require an app-specific password (not your normal login password) for IMAP/SMTP:

- **Gmail**: enable 2FA, then create an [app password](https://myaccount.google.com/apppasswords).
  IMAP: `imap.gmail.com:993` (SSL). SMTP: `smtp.gmail.com:587` (STARTTLS).
- **Outlook/Office365**: IMAP `outlook.office365.com:993`, SMTP `smtp.office365.com:587`.
- **iCloud**: generate an app-specific password. IMAP `imap.mail.me.com:993`, SMTP `smtp.mail.me.com:587`.

Credentials are encrypted at rest with Fernet (`CREDENTIAL_ENCRYPTION_KEY`)
and are only decrypted in-memory for the duration of a single IMAP/SMTP
connection - see `backend/app/core/security.py`.

## Multi-account profiles

Each account is tagged `personal`, `business`, or `other` and has its own
color. The sidebar's account switcher lists all configured accounts;
selecting one scopes the folder list and message view to that mailbox.
One account can be marked as the default (selected on load).

## Dashboard

The landing view is a customizable widget dashboard (`frontend/src/components/dashboard/`):

- **Accounts overview** - unread counts per account, click through to Mail.
- **Priority inbox** - the selected account's recent messages, ranked by AI priority.
- **Smart tags** - a tag cloud aggregated from recent messages' AI tags.
- **Quick compose** - send a message without leaving the dashboard.
- **AI status** - shows whether live AI or heuristic mode is active.

Click **Customize** to show/hide widgets and reorder them; the layout persists
to `localStorage` (`emailhq.dashboard.layout.v1`). Use the sidebar's
Dashboard/Mail switcher to jump into the full mail view.

## Appearance: themes, icon packs, and skinning

Click **Customize appearance** at the bottom of the sidebar (gear icon) to open
the Settings panel (`frontend/src/components/settings/SettingsPanel.tsx`).

**Theming architecture** (`frontend/src/theme/`):

- `tokens.ts` defines every built-in theme as a plain `ThemeTokens` +
  `ThemeShape` object - no CSS is hand-written per theme. Built-ins: **Light**,
  **Dark**, **High Contrast** (base themes) and **Midnight Blue**, **Emerald**,
  **Sunset**, **Minimalist Mono** (skins). A **System** option follows the OS
  light/dark preference and updates live if it changes.
- `ThemeProvider.tsx` is a React context provider that resolves the active
  theme, merges in an optional custom accent color and font-scale multiplier,
  and writes the result into a `<style id="emailhq-theme-vars">` stylesheet
  (not inline styles - see the comment in `applyThemeToDocument` for why that
  matters for custom CSS overrides). Preferences persist to `localStorage`
  (`emailhq.theme-preferences.v1`).
- Every component consumes CSS custom properties - `--bg-primary`,
  `--bg-secondary`, `--text-primary`, `--text-secondary`, `--accent-color`,
  `--accent-color-hover`, `--accent-soft`, `--border-color`, `--danger-color`,
  `--success-color`, `--warning-color`, plus shape tokens `--radius-sm/md/lg`,
  `--border-width`, `--shadow-sm/md`, and `--font-scale` - never hardcoded
  colors. `theme/contrast.ts` implements the real WCAG relative-luminance
  formula, used by the Settings panel's live contrast badges (checked against
  the actual current theme + any custom accent, not just at design time).

**Icon system** (`frontend/src/icons/`): a central registry abstraction -
components render `<Icon name="inbox" />` rather than importing a concrete
SVG. Four interchangeable packs live in `icons/packs/`: **Outline** (default),
**Solid**, **Minimal**, and **Retro**. Switching packs in Settings updates the
Sidebar, Topbar, folder list, message list, dashboard widgets, and AI
Assistant Drawer everywhere at once. Pack choice persists to `localStorage`
(`emailhq.icon-pack.v1`).

**Custom CSS overrides**: the Settings panel includes a raw-CSS textarea for
power users (e.g. `:root { --radius-lg: 24px; }`). It's injected into its own
`<style>` tag, inserted after the theme stylesheet, so normal cascade order
lets it win without needing `!important`. Everything is applied client-side
only - nothing is uploaded anywhere.

The quick Sun/Moon button in the Topbar is a shortcut that only cycles
System → Light → Dark; skins, accent color, icon packs, and font scale live in
the full Settings panel.

## AI Assistant Drawer

A slide-out panel (`frontend/src/components/ai/AIAssistantDrawer.tsx`),
opened via the sparkles icon in the Topbar. Shows live AI status, and when a
message is open in Mail, contextual smart tags, a priority score, and
quick-reply drafts for that message (reuses `QuickReplyPanel`). With no
message open it shows a prompt to go open one.

## AI features

Three endpoints power smart tagging, prioritization, and quick-reply drafts.
By default they run on deterministic, rule-based heuristics (no external
calls, no API key needed) so the app is fully usable out of the box:

| Feature | Backend service | Endpoint |
|---|---|---|
| Smart tagging | `app/services/ai/tagging.py` | `POST /api/ai/tag` |
| Prioritization | `app/services/ai/prioritization.py` | `POST /api/ai/prioritize` |
| Quick replies | `app/services/ai/quick_reply.py` | `POST /api/ai/quick-reply` |
| Status | `app/services/ai/base.py` | `GET /api/ai/status` |

To go live with real Claude-generated output instead of heuristics:

1. `pip install anthropic` in the backend virtualenv (already in `requirements.txt`).
2. Set `AI_PROVIDER=anthropic` and `AI_API_KEY=<your Anthropic API key>` in
   `backend/.env` (optionally `AI_MODEL`, defaults to `claude-sonnet-5`).
3. Restart the backend. Each AI response now carries `"source": "ai"`
   instead of `"source": "heuristic"`, and the Topbar/dashboard AI-status
   badge switches from "Heuristic AI" to "AI live". If a live call ever
   fails (bad key, rate limit, network), each service falls back to its
   heuristic automatically rather than erroring.

The frontend renders AI output via
`frontend/src/components/ai/{SmartTagBadge,PriorityIndicator,QuickReplyPanel}.tsx`
and the dashboard's Priority Inbox / Smart Tags / AI Status widgets.

## Security notes

- IMAP/SMTP credentials are encrypted at rest (Fernet) and never logged.
- All IMAP/SMTP connections require SSL/TLS by default.
- Message HTML bodies are **not** rendered as raw HTML in the frontend
  (`MessageView.tsx`) to avoid executing untrusted content from received
  mail; wire in an HTML sanitizer (e.g. DOMPurify) before enabling that.
- `.env` is git-ignored - never commit real credentials or encryption keys.
- CORS origins are restricted via `CORS_ORIGINS` in `backend/.env`.

## Production considerations

- Done: Postgres via Neon, deployed on Vercel - see **Deployment** above.
- Add authentication/authorization in front of the API if it will be
  exposed beyond a single trusted user (currently single-tenant, no login).
- Set up real Alembic migrations instead of ad hoc `create_all` runs once
  the schema needs to evolve without data loss.
- Consider IDLE/push-based IMAP sync or a background poller instead of
  fetch-on-demand for a livelier inbox experience - harder on Vercel
  specifically, since serverless functions can't hold long-lived connections;
  would need an external worker (e.g. a small always-on service) for that.
