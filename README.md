# PromptNest

Personal prompt management tool. Local-first, offline-capable, PWA-ready.

## Features

- **Local-first**: All data stored in IndexedDB via Dexie.js
- **Offline capable**: PWA with Service Worker, works without network
- **Fast search**: Instant client-side search with 100ms debounce
- **Tree folders**: Up to 3 levels of folder hierarchy
- **Quick capture**: Cmd/Ctrl+N to quickly save a prompt
- **Command Palette**: Cmd/Ctrl+K to search prompts and commands
- **Quick Preview**: Preview prompt content without entering edit page
- **Auto-save drafts**: LocalStorage draft auto-save every 2 seconds
- **Manual sync**: Push/pull to a personal Hono API backed by Cloudflare D1
- **Conflict resolution**: UI for resolving local/remote conflicts
- **Version history**: Automatic snapshots before each save
- **Share prompts**: Generate public share links
- **Import/export**: JSON backup/restore, Markdown export
- **Variable filling**: Auto-detect `{{variables}}` and generate forms
- **PWA Install**: One-click install to desktop/mobile
- **Dark mode**: Full dark mode support with system preference sync
- **Responsive**: Works on desktop and mobile
- **Cloudflare deployment**: Workers Static Assets + Hono API + D1 + R2

## Tech Stack

- **Frontend**: Vue 3 + Vite + TypeScript + Tailwind CSS + Pinia + Dexie.js
- **Backend**: Hono on Cloudflare Workers; D1 for prompts, folders, sessions, and login rate limits
- **Images**: Cloudflare R2 through the `IMAGES` binding
- **Authentication**: Platform secrets + Web Crypto; seven-day bearer-token sessions in D1
- **PWA**: vite-plugin-pwa + Workbox

## Quick Start

Use Node.js 22.16+ and run commands from the repository root.

```bash
npm ci
npm run build:web
npx wrangler d1 migrations apply promptnest --local
```

Create a root-level `.dev.vars` file with your local login credentials:

```dotenv
ADMIN_EMAIL="your-email@example.com"
ADMIN_PASSWORD="replace-with-a-long-random-password"
```

`.dev.vars` is ignored by Git. There are no default administrator credentials.

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- Local Worker API: <http://localhost:3000>
- Local D1 and R2 state: `.wrangler/state/`

## Build and Test

```bash
npm run typecheck
npm run build
npm run check:worker
node --import tsx --test apps/server/src/auth/*.test.mjs
```

`npm run build` checks server types and builds the frontend. `npm run check:worker` validates the Worker bundle without deploying. See [部署说明](DEPLOYMENT.md#验证) for the local Worker integration test.

## Deploy to Cloudflare

The current deployment uses Worker `promptnest`, D1 database `promptnest`, and the existing R2 bucket `memos`. Settings are in [wrangler.jsonc](wrangler.jsonc).

- Temporary Worker URL: <https://promptnest.liuk.workers.dev>
- Production custom domain: <https://memos.quarker.cc> — Workers cutover complete
- Public image domain: <https://bild.quarker.cc>

```bash
npx wrangler login
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler d1 migrations apply promptnest --remote
npm run deploy
```

`npm run deploy` builds and deploys the Worker and frontend assets. `npm start` starts a local Wrangler server. Docker files are historical; the supported deployment workflow is Cloudflare Workers.

See [部署说明（中文）](DEPLOYMENT.md) for database import, local testing, backups, and domain cutover.

## Configuration

| Binding / Variable | Purpose | Configuration |
|--------------------|---------|---------------|
| `ADMIN_EMAIL` | Administrator login email | Worker secret; local `.dev.vars` |
| `ADMIN_PASSWORD` | Administrator login password | Worker secret; local `.dev.vars` |
| `DB` | D1 database `promptnest` | `wrangler.jsonc` |
| `IMAGES` | R2 bucket `memos` | `wrangler.jsonc`; no S3 access key required |
| `ASSETS` | Built frontend in `apps/web/dist` | Workers Static Assets |
| `R2_PUBLIC_URL` | Public image URL prefix | `https://bild.quarker.cc` |

The Worker no longer uses `DATABASE_PATH`, `PORT`, or `SESSION_SECRET`. Database files, credential files, and backups must stay outside Git. Previously tracked files were removed from the current version; older Git history may still contain credentials or private data. See [备份与历史凭据](DEPLOYMENT.md#备份与历史凭据).

## Project Structure

```
prompt-nest/
  apps/
    web/          # Vue 3 SPA
    server/       # Hono Worker API
  migrations/     # D1 schema migrations
  scripts/        # SQLite export and local integration tests
  wrangler.jsonc  # Worker, D1, R2, assets, and cron configuration
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + N | New Prompt |
| Cmd/Ctrl + K | Command Palette |
| Cmd/Ctrl + S | Save |

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | /api/auth/login | Public |
| POST | /api/auth/logout | Required |
| GET | /api/auth/me | Required |
| GET | /api/prompts | Required |
| POST | /api/prompts/batch-upsert | Required |
| POST | /api/prompts/batch-delete | Required |
| GET | /api/folders | Required |
| POST | /api/folders/batch-upsert | Required |
| POST | /api/folders/batch-delete | Required |
| GET | /api/sync/pull | Required |
| POST | /api/sync/push | Required |
| POST | /api/share/create | Required |
| POST | /api/share/cancel | Required |
| GET | /api/share/:slug | Public |
| GET | /api/health | Public |

## Roadmap

- [ ] Virtual list for large collections
- [ ] AI prompt enhancement
- [ ] Browser extension `/api/capture`
- [ ] Folder drag-and-drop sorting
- [ ] Batch tag editing
