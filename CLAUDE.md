# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For current project state and gotchas, see **[CLAUDE.local.md](CLAUDE.local.md)**.

## Project Overview

Full-stack productivity app (**doable**): an Express/TypeScript REST API (`claude-todo-backend/`) and a React/Vite/TypeScript SPA (`claude-todo-frontend-ts/`). Stores data in PostgreSQL via `pg` (connection pool, async queries, versioned migrations in `src/db/`).

## Commands

### Backend (`claude-todo-backend/`)
```bash
npm run dev      # tsx watch — hot-reloads src/app.ts
npm run build    # tsc compilation → dist/
npm start        # run compiled dist/app.js
npm run lint     # ESLint on src/**/*.ts
npm test         # Jest integration tests (--runInBand; requires DATABASE_URL)
```

### Frontend (`claude-todo-frontend-ts/`)
```bash
npm run dev      # Vite dev server on port 5173
npm run build    # tsc check + Vite production build
npm run preview  # serve production build locally
npm run lint     # ESLint on src/**/*.{ts,tsx}
npm test         # Vitest unit tests
```

### Docker
```bash
docker compose up --build          # production build — http://localhost
docker compose up                  # with override: backend hot-reloads via tsx watch
```

> `docker-compose.override.yml` is auto-applied on `docker compose up` — it bind-mounts
> `claude-todo-backend/src/` and runs `tsx watch` so backend changes reflect without rebuild.
> Requires `JWT_SECRET` set in the environment (see `.env.example`).

## Architecture

### Backend layers (strict order: route → middleware → controller → service → db)

- **`src/app.ts`** — entry point; mounts CORS, JSON body parser, all routers; `app.listen` is guarded by `NODE_ENV !== "test"`
- **`src/routes/`** — route definitions with Zod `validate()` middleware attached before controllers
  - `auth.routes.ts` — `POST /api/auth/login`, `GET /api/auth/me`
  - `todo.routes.ts` — full CRUD + reorder + status patch
  - `tag.routes.ts` — full CRUD
  - `focus.routes.ts` — session start/end, stats, history
  - `habit.routes.ts` — CRUD + check-in log/unlog
  - `stats.routes.ts` — streak + completion trend
- **`src/controllers/`** — thin HTTP handlers; pass `req.user!.id` to every service call
- **`src/services/`** — all business logic; `TodoService`, `TagService`, `FocusService`, `HabitService`, `StatsService`
- **`src/db/database.ts`** — `pg` connection pool; reads `DATABASE_URL` env var; exports `initDb()` (runs migrations) and `withTransaction(fn)` helper
- **`src/db/migrations.ts`** — ★ versioned SQL migrations (v1–v6); add new entries here
- **`src/config/users.ts`** — 2 hardcoded users with bcrypt hashes; throws at module load if `JWT_SECRET` is unset
- **`src/middlewares/`** — `auth.middleware.ts` (JWT Bearer), `validate.middleware.ts` (Zod factory), `error.middleware.ts` (global AppError + 404)
- **`src/types/index.ts`** — ★ single source of truth for all TypeScript interfaces and DTOs

### Frontend layers

- **`src/App.tsx`** — `BrowserRouter` + `AppShell`; mounts `useKeyboardShortcuts`, `ShortcutsDialog`, `ThemeProvider`; calls `hydrate()` on boot
- **`src/store/`** — Zustand stores (no React Query / SWR):
  - `todo.store.ts` ★ — all todo + tag async actions, optimistic updates
  - `auth.store.ts` — login, logout, hydrate (client-side JWT expiry check)
  - `habit.store.ts` — habit CRUD + log/unlog actions
- **`src/api/`** — Axios client with Bearer interceptor + 401→logout; `todo.api.ts`, `tag.api.ts`, `focus.api.ts`, `habit.api.ts`, `stats.api.ts`
- **`src/hooks/`** — `useLocalSync.ts` (localStorage cache), `useKeyboardShortcuts.ts` (N/`/`/`?` shortcuts), `usePomodoro.ts` (Focus timer)
- **`src/context/theme.tsx`** — `ThemeProvider`; persists `doable-theme` in localStorage; anti-FOUC inline script in `index.html`
- **`src/pages/`** — `HomePage`, `AddTodoPage`, `EditTodoPage`, `TagsPage`, `FocusPage`, `HabitsPage`, `CalendarPage`, `StatsPage`, `LoginPage`
- **`src/components/`** — `Navbar`, `TodoCard`, `SortableTodoCard`, `TodoForm`, `FilterBar`, `ConfirmDialog`, `ProtectedRoute`, `HabitCard`, `AddHabitModal`, `CalendarGrid`, `CalendarDayPanel`, `ShortcutsDialog`
- **`src/types/index.ts`** — ★ mirrors backend types; keep in sync manually when changing backend DTOs

### Key conventions

- All API responses use an envelope: `{ success, data?, error?, message? }` — unwrapped by the Axios interceptor in `client.ts`
- IDs are `nanoid`-generated strings — backend uses nanoid v3 (CJS), frontend uses nanoid v5 (ESM); do not mix
- Vite proxy (`vite.config.js`) rewrites `/api/*` → `http://localhost:3000/*`; frontend code never hardcodes the backend port
- Backend CORS is locked to `CLIENT_URL` env var (default `http://localhost:5173`; Docker uses `http://localhost`)
- `throw new AppError(statusCode, code, message)` anywhere in a service — the global error handler formats the response
- All protected routes call `requireAuth` middleware, which attaches `req.user` from the JWT payload
- Filter URL state is synced to query params via `useSearchParams` in `HomePage` — filters survive refresh and are bookmarkable
- Keyboard shortcuts (`N` new task, `/` search, `?` cheat sheet) are wired globally in `AppShell` via `useKeyboardShortcuts`
