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
- **Manual sync**: Push/pull to a personal Hono + SQLite backend
- **Conflict resolution**: UI for resolving local/remote conflicts
- **Version history**: Automatic snapshots before each save
- **Share prompts**: Generate public share links
- **Import/export**: JSON backup/restore, Markdown export
- **Variable filling**: Auto-detect `{{variables}}` and generate forms
- **PWA Install**: One-click install to desktop/mobile
- **Dark mode**: Full dark mode support with system preference sync
- **Responsive**: Works on desktop and mobile
- **Docker ready**: Dockerfile + docker-compose.yml included

## Tech Stack

- **Frontend**: Vue 3 + Vite + TypeScript + Tailwind CSS + Pinia + Dexie.js
- **Backend**: Hono + better-sqlite3 + bcryptjs + cookie sessions
- **PWA**: vite-plugin-pwa + Workbox

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Docker Deploy

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t prompt-nest .
docker run -d -p 3000:3000 -v prompt-nest-data:/data prompt-nest
```

## Build

```bash
# Build frontend + backend
npm run build

# Only frontend
npm run build:web

# Only backend
npm run build:server
```

## Deploy

```bash
# Production start
npm start
```

The backend serves the built frontend static files automatically.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_EMAIL` | Login email | admin@example.com |
| `ADMIN_PASSWORD` | Login password | admin |
| `SESSION_SECRET` | Session signing secret | (required) |
| `PORT` | Server port | 3000 |
| `DATABASE_PATH` | SQLite file path | ./data/promptnest.db |

## Project Structure

```
prompt-nest/
  apps/
    web/          # Vue 3 SPA
    server/       # Hono API
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
