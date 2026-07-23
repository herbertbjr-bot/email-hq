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

Use the "+" button next to **Accounts** in the sidebar. The **Quick connect**
row in the form (`frontend/src/components/accounts/providerPresets.ts`)
one-click-fills IMAP/SMTP host and port for Gmail, Yahoo Mail, AOL Mail, and
iCloud Mail - pick a provider, and the username fields auto-fill from the
email address too. All presets use STARTTLS on port 587 for SMTP to match
what the backend supports.

**Almost all of these require an app-specific password, not your normal
login password** - IMAP/SMTP login with your regular password will fail
with an authentication error even if the host/port are correct. Each preset
shows a hint plus a direct link to that provider's official app-password
page once you pick it. Links point at each provider's own documentation
(help.yahoo.com, help.aol.com, Google/Apple account pages), verified
against their current published pages - not third-party guides.

**Outlook / Microsoft 365 is not supported** for IMAP/SMTP login in this
app: Microsoft has fully and permanently disabled Basic Authentication
(including app passwords) for POP/IMAP/SMTP AUTH across Exchange Online and
Outlook.com. There is no password of any kind that makes it work anymore -
connecting would require implementing OAuth 2.0, which this app doesn't do.
The Outlook preset button explains this rather than filling in settings
that can't work.

Before saving, click **Test connection** to verify your IMAP and SMTP
credentials against the real server - it calls `POST /api/accounts/test-connection`
(`backend/app/api/routes/accounts.py`), which tries the login without
persisting anything, and reports each protocol's real error message (e.g.
"AUTHENTICATIONFAILED" almost always means you need an app password, not
your account password).

Credentials are encrypted at rest with Fernet (`CREDENTIAL_ENCRYPTION_KEY`)
and are only decrypted in-memory for the duration of a single IMAP/SMTP
connection - see `backend/app/core/security.py`.

## Deleting an account

Hover an account in the sidebar and click the trash icon that appears -
this opens a confirmation dialog (`frontend/src/components/common/ConfirmDialog.tsx`)
showing exactly what will be removed. Nothing is deleted until you click
**Delete account** in that dialog; **Cancel** aborts with no changes. This
two-step flow is deliberate - account deletion also removes the encrypted
IMAP/SMTP credentials, and there's no undo.

## Multi-account profiles

Each account is tagged `personal`, `business`, or `other` and has its own
color. The sidebar's account switcher lists all configured accounts;
selecting one scopes the folder list and message view to that mailbox.
One account can be marked as the default (selected on load).

## Mail

The message list (`MailboxList` / `MailToolbar`) supports:

- **Search** - a debounced search box that hits IMAP `SEARCH TEXT` server-side
  (subject + from/to headers + body in one pass; see `_build_search_criteria`
  in `backend/app/services/imap_service.py`), not a client-side filter.
- **Filters** - Unread and Flagged chips, combinable with search and with
  each other (`UNSEEN`/`FLAGGED` IMAP criteria, ANDed with the text search).
- **Sort** - Newest/Oldest first. UID order is used as a cheap, reliable
  proxy for date order (true on essentially every IMAP server) rather than
  fetching every message's date - so it's fast even on large folders. Sorting
  by subject/sender isn't implemented (would need fetching headers for every
  matched message before paging, which is real added latency for a feature
  that's rarely essential - text search covers most of the same need).
- **Pagination** - "Load more" fetches the next page (30 at a time) and
  appends rather than re-fetching everything.
- **Density** - Comfortable/Compact list view, persisted to `localStorage`
  (`emailhq.mail-view-preferences.v1`, same pattern as the dashboard layout
  and icon-pack preferences).
- **Quick actions** - hover a message in the list for inline flag/read/delete
  toggles, no need to open it first.

The message view (`MessageView`) adds a full action toolbar: **Reply**,
**Reply All** (deduces the recipient list, excluding your own address),
**Forward** (quotes the original with a forwarded-message header block),
flag toggle, mark-unread, **Move to** any folder, and **Delete**
(auto-detects a Trash-like folder to move to; permanently deletes only if
already in Trash or none exists - `imap_service.delete_message`). All of
these hit real IMAP operations (`COPY` + `STORE \Deleted` + `EXPUNGE` for
move/delete - `UID MOVE` isn't universally supported, so this is the classic
portable approach) rather than just updating local UI state.

**HTML email rendering is sanitized in two independent layers** (see
`frontend/src/utils/sanitizeHtml.ts` and `SafeHtmlEmail.tsx`):

1. DOMPurify strips `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`,
   all event-handler attributes (`onerror`, `onclick`, ...), and
   `javascript:`/`data:` URIs. Inline `style` attributes are kept (DOMPurify
   sanitizes their CSS) so formatted emails don't render as plain text.
   External links get `target="_blank" rel="noopener noreferrer"` injected.
2. The sanitized result is rendered inside a **sandboxed iframe**
   (`sandbox="allow-same-origin"`, deliberately *without* `allow-scripts`) -
   so even a DOMPurify bypass couldn't execute script in this app's window.
   `allow-same-origin` without `allow-scripts` is the safe half of that
   pair; the classic sandbox-escape needs both together, and script
   execution is impossible here regardless.

Plain-text bodies are shown as-is when there's no HTML part; if neither is
present, an empty state is shown instead of guessing.

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
