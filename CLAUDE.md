# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For current project state, remaining work, and gotchas, see **[CLAUDE.local.md](CLAUDE.local.md)**.

## Project Overview

Full-stack Todo application: an Express/TypeScript REST API (`claude-todo-backend/`) and a React/Vite/TypeScript SPA (`claude-todo-frontend-ts/`). The backend stores data in SQLite via `better-sqlite3` (singleton `DatabaseService`, migrations in `src/db/`).

## Commands

### Backend (`claude-todo-backend/`)
```bash
npm run dev      # tsx watch — hot-reloads src/app.ts
npm run build    # tsc compilation → dist/
npm start        # run compiled dist/app.js
npm run lint     # ESLint on src/**/*.ts
```

### Frontend (`claude-todo-frontend-ts/`)
```bash
npm run dev      # Vite dev server on port 5173
npm run build    # tsc check + Vite production build
npm run preview  # serve production build locally
npm run lint     # ESLint on src/**/*.{ts,tsx}
```

### Docker
```bash
docker compose up --build   # build + start backend and frontend at http://localhost
```

There are no automated tests in this repo.

## Architecture

### Backend layers (strict order: route → middleware → controller → service → db)
- **`src/app.ts`** — entry point; mounts CORS, JSON body parser, `/health`, `/api/export`, and routers
- **`src/routes/`** — route definitions; attach Zod `validate()` middleware before controllers
- **`src/controllers/`** — thin HTTP handlers; delegate all logic to services
- **`src/services/`** — `TodoService` and `TagService` own business logic; both use `db` from `DatabaseService`
- **`src/db/database.ts`** — singleton `better-sqlite3` instance with PRAGMA setup and migration boot
- **`src/db/migrations.ts`** — versioned SQL migrations tracked via `schema_migrations` table
- **`src/middlewares/`** — `validate.middleware.ts` (Zod factory), `error.middleware.ts` (global error + 404 handler)
- **`src/types/index.ts`** — single source of truth for all TypeScript interfaces and DTOs

### Frontend layers
- **`src/store/todo.store.ts`** — Zustand store; owns all async API calls and is the single source of state for todos and tags
- **`src/api/`** — Axios client with interceptors; `todo.api.ts` and `tag.api.ts` call `/api/*` endpoints (proxied to port 3000 by Vite)
- **`src/hooks/useLocalSync.ts`** — syncs Zustand state with `localStorage` for offline caching
- **`src/pages/`** — `HomePage`, `AddTodoPage`, `EditTodoPage` (routed via React Router v6 at `/`, `/add`, `/edit/:id`)
- **`src/components/`** — presentational components (`TodoCard`, `SortableTodoCard`, `TodoForm`, `FilterBar`, `ConfirmDialog`, `Navbar`)
- **`src/types/index.ts`** — mirrors backend types; keep in sync manually when changing backend DTOs

### Key conventions
- All API responses use an envelope: `{ success, data, error, message }` — unwrapped automatically by Axios interceptors in `client.ts`
- IDs are `nanoid`-generated strings (backend uses nanoid v3 / CommonJS; frontend uses nanoid v5 / ESM — do not mix)
- The Vite proxy (`vite.config.js`) rewrites `/api/*` → `http://localhost:3000/*`, so frontend code never hardcodes the backend port
- Backend CORS is locked to `CLIENT_URL` env var (default `http://localhost:5173`; Docker uses `http://localhost`)
- `AppError(statusCode, code, message)` in any service is caught by the global error handler — use it instead of raw `res.status()`
