# CLAUDE.local.md — Project Handoff Context

Extended context for anyone continuing work on this repository. Read `CLAUDE.md` first for commands and architecture fundamentals, then use this file for current state, decisions already made, and non-obvious behaviours.

---

## What This Project Is

**doable** — a full-stack productivity application built as a learning/showcase project:

- **Backend** — Express + TypeScript REST API with SQLite storage (`claude-todo-backend/`)
- **Frontend** — React + Vite + TypeScript SPA with Tailwind dark/light theme (`claude-todo-frontend-ts/`)
- **Docs** — Architecture and task history (`docs/`)
- **CI/CD** — GitHub Actions workflows + Docker Compose (`docker-compose.yml`, `.github/workflows/`)

---

## Current State (Phase 19 — all phases complete)

| Feature | Status |
|---------|--------|
| Todo CRUD (create, read, update, delete) | Done |
| Tag management (rename, recolor, usage count) | Done |
| Subtasks per todo | Done |
| Status / priority / search filtering | Done |
| Sort by manual order / created / due date / priority | Done |
| URL-synced filters (bookmarkable, survive refresh) | Done |
| Drag-and-drop reorder (disabled when filters active) | Done |
| Optimistic updates with rollback on error | Done |
| localStorage cache (instant paint on reload) | Done |
| Export / Import (full JSON backup) | Done |
| JWT auth — 2 hardcoded users, per-user data isolation | Done |
| Responsive layout + mobile-friendly touch targets | Done |
| Light / dark theme toggle (persists, anti-FOUC) | Done |
| Recurring tasks (daily / weekly / monthly / custom) | Done |
| Focus / Pomodoro timer with session history | Done |
| Stats dashboard (streak, completion trend, overdue aging) | Done |
| Habit tracker (streaks, 7-day mini calendar, check-in) | Done |
| Calendar view (month + week, day panel, status toggle) | Done |
| Keyboard shortcuts (N / / / ? / Escape) | Done |
| Docker Compose (nginx + node alpine, SQLite volume) | Done |
| docker-compose.override.yml (hot reload without rebuild) | Done |
| GitHub Actions CI (lint + build on every PR) | Done |
| GitHub Actions CD (GHCR push + SSH deploy on main) | Done |
| Jest integration tests — backend (21 tests) | Done |
| Vitest unit tests — frontend (10 tests) | Done |

---

## How to Run

### Local Development

```bash
# Terminal 1 — backend (port 3000)
cd claude-todo-backend
cp ../.env.example .env          # set JWT_SECRET
npm install
npm run dev

# Terminal 2 — frontend (port 5173)
cd claude-todo-frontend-ts
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` → `http://localhost:3000`.

Default credentials: see `.env.example` or ask the project owner (passwords are bcrypt-hashed in `src/config/users.ts`).

### Docker (Production Build)

```bash
JWT_SECRET=<random-256-bit> docker compose up --build
```

Open `http://localhost`. nginx serves the frontend and proxies `/api/` to the backend.

### Running Tests

```bash
cd claude-todo-backend   && npm test   # 21 Jest integration tests
cd claude-todo-frontend-ts && npm test  # 10 Vitest unit tests
```

---

## Architecture Decisions Already Made (don't revisit without good reason)

### Storage
- **SQLite via `better-sqlite3`** — zero-infrastructure simplicity, synchronous API. DB file at `DB_PATH` env var (`./todo.db` default, `/data/todo.db` in Docker).
- **6-table schema** — `todos`, `tags`, `subtasks`, `todo_tags`, `focus_sessions`, `habits`, `habit_logs`. All normalized; no JSON columns except `recurrence` (optional JSON string on todos) and `target_days` on habits.
- **Migration system** — `schema_migrations` table tracks applied versions (v1–v5). Add new entries to `claude-todo-backend/src/db/migrations.ts`.

### Auth
- **2 hardcoded users, no registration** — IDs are opaque nanoid strings (not usernames). Passwords are bcrypt (rounds=12) hashed in `src/config/users.ts`.
- **`JWT_SECRET` is required** — the module throws at load time if the env var is unset. Never use a fallback string in production.
- **Per-user data isolation** — every service method receives `userId` as first param; all SQL queries filter by `user_id`.

### API
- **Response envelope** — every endpoint returns `{ success, data?, error?, message? }`. The Axios interceptor in `client.ts` unwraps `data` automatically.
- **Zod validation** — all mutating endpoints validate via `validateBody()` / `validateQuery()`. Add schemas to the route file, not the controller.
- **`AppError(statusCode, code, message)`** — throw in any service; the global error handler catches and formats it.

### Frontend
- **Zustand as the only state layer** — do not add React Query, SWR, or Redux. All API calls live in the store actions.
- **No shared types package** — `src/types/index.ts` in the frontend is a manual mirror of the backend types. Update both sides when changing DTOs.
- **`nanoid` version split** — backend: nanoid v3 (CJS `require`), frontend: nanoid v5 (ESM `import`). Do not upgrade independently.
- **Drag-and-drop disabled when filters are active** — `isDragEnabled` in `HomePage.tsx` checks `sortBy === "order" && !status && !priority && !search`. Intentional; filtered reorder would produce confusing `order_index` gaps.
- **Theme** — `darkMode: 'class'` in Tailwind; `ThemeProvider` in `src/context/theme.tsx`; persists as `doable-theme` in localStorage. Anti-FOUC inline script in `index.html` runs before React hydrates.

### Docker
- **nginx proxies `/api/`** — in production the browser talks only to nginx on port 80; the backend is not externally exposed.
- **Named volume `todo_data`** — never bind-mount the DB file in production; use the named volume.
- **`docker-compose.override.yml`** is auto-applied for local dev — overrides backend to run `tsx watch` with bind-mount.

---

## Gotchas & Non-Obvious Behaviours

- **`JWT_SECRET` throws at startup** — `src/config/users.ts` calls `throw new Error(...)` at module load if `JWT_SECRET` is not set. Set it in `.env` for local dev.
- **`NODE_ENV=test` guards `app.listen`** — the backend test setup sets this before importing `app.ts`; without the guard, Jest and supertest would both try to bind port 3000.
- **`better-sqlite3` on Alpine** requires `python3 make g++` at build time (musl libc, no prebuilt binaries). The backend `Dockerfile` builder stage installs these; the runner stage does not need them.
- **Status filter sends `undefined`, not `""`** — `FilterBar` avoids sending `?status=` as an empty query param (Zod rejects it with 400).
- **`PUT /api/todos/:id` expects full `SubTask[]`** — with `id` and `completed` fields, not just `{ title }[]`. `TodoForm` branches on the `initial` prop: edit mode sends full SubTask shape, create mode sends `{ title }[]` only.
- **CORS locked to `CLIENT_URL`** — set `CLIENT_URL=*` for unrestricted local testing (do not commit).
- **`order_index` gaps after delete** — harmless; the frontend sorts by `order_index ASC` and reorder only updates explicitly dragged positions.
- **Migration v2 makes existing rows invisible** — it adds `user_id TEXT NOT NULL DEFAULT ''` to todos and recreates tags. Existing rows get `user_id = ''` and become invisible. Delete `todo.db` to start fresh after upgrading from pre-Phase-8b data.
- **Calendar uses `dueDate` only** — todos without a `dueDate` do not appear on the calendar.
- **Keyboard shortcuts skip when typing** — `useKeyboardShortcuts` checks `target.tagName === "INPUT" | "TEXTAREA" | "SELECT"` before firing. The `?` shortcut uses `e.key === "?"` which naturally requires Shift on most keyboards.

---

## Project Structure

```
D:\vs\
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint + build on every PR/push
│       └── cd.yml              # GHCR push + SSH deploy on main
├── claude-todo-backend/
│   ├── src/
│   │   ├── __tests__/          # Jest integration tests
│   │   ├── app.ts              # ★ Express entry + router mounts
│   │   ├── config/users.ts     # Hardcoded users + JWT_SECRET validation
│   │   ├── db/
│   │   │   ├── database.ts     # Singleton DB instance
│   │   │   └── migrations.ts   # ★ Add new schema versions here
│   │   ├── routes/             # auth, todo, tag, focus, habit, stats
│   │   ├── controllers/        # Thin HTTP handlers
│   │   ├── services/           # ★ All business logic
│   │   ├── middlewares/        # auth, validate, error
│   │   └── types/index.ts      # ★ Source-of-truth types + DTOs
│   ├── jest.config.js
│   ├── Dockerfile
│   └── package.json
├── claude-todo-frontend-ts/
│   ├── src/
│   │   ├── __tests__/          # Vitest unit tests
│   │   ├── App.tsx             # ★ Router + AppShell + shortcuts + theme
│   │   ├── context/theme.tsx   # ThemeProvider (light/dark)
│   │   ├── api/                # client.ts + per-resource API modules
│   │   ├── store/              # ★ todo.store, auth.store, habit.store
│   │   ├── hooks/              # useLocalSync, useKeyboardShortcuts, usePomodoro
│   │   ├── pages/              # HomePage, AddTodo, EditTodo, Tags, Focus,
│   │   │                       #   Habits, Calendar, Stats, Login
│   │   ├── components/         # Navbar, TodoCard, SortableTodoCard, TodoForm,
│   │   │                       #   FilterBar, ConfirmDialog, ProtectedRoute,
│   │   │                       #   HabitCard, AddHabitModal,
│   │   │                       #   CalendarGrid, CalendarDayPanel, ShortcutsDialog
│   │   ├── types/index.ts      # ★ Mirror of backend types — keep in sync
│   │   └── utils/index.ts      # cn(), formatDate(), isOverdue(), TAG_COLORS
│   ├── vitest.config.ts
│   ├── nginx.conf              # SPA fallback + /api/ proxy (Docker)
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── architecture.md
│   └── tasks.md                # All 19 phases — fully complete
├── CLAUDE.md                   # Commands + architecture quick-reference
├── CLAUDE.local.md             # This file — handoff context + gotchas
├── docker-compose.yml          # Production compose
├── docker-compose.override.yml # Local dev hot-reload override
└── .gitignore
```

---

## File Map (most-touched files)

| File | What it does |
|------|-------------|
| `claude-todo-backend/src/app.ts` | Express entry, routers, export/import endpoints |
| `claude-todo-backend/src/db/migrations.ts` | ★ Add new schema versions here |
| `claude-todo-backend/src/services/todo.service.ts` | Todo CRUD, filter, reorder, recurring logic |
| `claude-todo-backend/src/types/index.ts` | Backend source-of-truth types |
| `claude-todo-frontend-ts/src/store/todo.store.ts` | Zustand — all todo + tag async actions |
| `claude-todo-frontend-ts/src/store/auth.store.ts` | Login, logout, hydrate (JWT expiry check) |
| `claude-todo-frontend-ts/src/api/client.ts` | Axios instance + envelope unwrapper + 401 handler |
| `claude-todo-frontend-ts/src/types/index.ts` | Frontend mirror of backend types |
| `claude-todo-frontend-ts/src/pages/HomePage.tsx` | Stats, DnD context, FilterBar, todo list |
| `claude-todo-frontend-ts/src/App.tsx` | Routes, keyboard shortcuts, theme, shortcuts dialog |
| `docker-compose.yml` | Production compose (backend + frontend + SQLite volume) |
