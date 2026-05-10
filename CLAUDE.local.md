# CLAUDE.local.md — Project Handoff Context

Extended context for anyone continuing work on this repository. Read `CLAUDE.md` first for commands and architecture fundamentals, then use this file for current state, decisions already made, and what's left to do.

---

## What This Project Is

A full-stack **Todo application** built as a learning/showcase project:

- **Backend** — Express + TypeScript REST API with SQLite storage (`claude-todo-backend/`)
- **Frontend** — React + Vite + TypeScript SPA with Tailwind dark theme (`claude-todo-frontend-ts/`)
- **Docs** — Full architecture and task tracking (`docs/`)
- **Docker** — Production-ready compose setup at repo root (`docker-compose.yml`)

---

## Current State (as of Phase 7 complete)

All core features are implemented and working:

| Feature | Status |
|---------|--------|
| Todo CRUD (create, read, update, delete) | Done |
| Tag management (create, assign to todos, delete) | Done |
| Subtasks per todo | Done |
| Status filtering + priority filter + search | Done |
| Sort by manual order / created / due date / priority | Done |
| Drag-and-drop reorder (disabled when filters active) | Done |
| Optimistic updates with rollback on error | Done |
| localStorage cache (instant paint on reload) | Done |
| Export endpoint (full JSON backup) | Done |
| Docker compose (nginx + node alpine, SQLite volume) | Done |

---

## How to Run

### Local Development

```bash
# Terminal 1 — backend (port 3000)
cd claude-todo-backend
npm install
npm run dev

# Terminal 2 — frontend (port 5173)
cd claude-todo-frontend-ts
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to `http://localhost:3000`.

### Docker (Production Build)

```bash
docker compose up --build
```

Open `http://localhost`. nginx serves the frontend and proxies `/api/` to the backend container.

---

## What's Still Remaining

From `docs/tasks.md` Phase 6 & 7:

### UI Features
- **Tag management page** — a `/tags` route where users can rename tags, change their color, and see how many todos use each tag. The backend API already supports all these operations (`PUT /api/tags/:id`, `GET /api/tags`).
- **Import UI** — a counterpart to the existing `GET /api/export` endpoint. Backend doesn't have a `POST /api/import` route yet; needs to be added alongside the UI.
- **Light theme toggle** — Tailwind dark mode via `class` strategy. Add a `ThemeProvider` context, a toggle button in `Navbar`, and switch `dark:` variants throughout `index.css`.

### Engineering
- **Unit/integration tests** — No tests exist. Recommended: `vitest` for frontend, `jest` + `supertest` for backend route integration tests hitting a real in-memory SQLite.
- **CI/CD pipeline** — GitHub Actions: `npm ci && npm run build` on PRs, `docker build + push` to a registry on main merge.
- **`docker-compose.override.yml`** — For local dev with Docker: bind-mount `src/` directories so changes reflect without rebuilding images.

---

## Architecture Decisions Already Made (don't revisit without good reason)

### Storage
- **SQLite via `better-sqlite3`** (not file JSON, not Postgres) — chosen for zero-infrastructure simplicity and synchronous API. The DB file lives at `DB_PATH` env var (default `./todo.db`, Docker: `/data/todo.db`).
- **4-table schema** — `todos`, `tags`, `subtasks`, `todo_tags`. Subtasks and tag associations are normalized into separate tables (not JSON columns).
- **Migration system** — `schema_migrations` table tracks applied versions. Add new migrations to `claude-todo-backend/src/db/migrations.ts` as new numbered entries.

### API
- **Response envelope** — every endpoint returns `{ success, data?, error?, message? }`. The Axios interceptor in `client.ts` unwraps this automatically; frontend code receives `data` directly.
- **Zod validation** — all mutating endpoints validate via the `validate()` middleware factory. Add schemas to the route file, not the controller.
- **AppError class** — `throw new AppError(statusCode, code, message)` anywhere in a service; the global error handler catches it and formats the response.

### Frontend
- **Zustand** as the only state layer — do not add React Query, SWR, or Redux. All API calls live in `todo.store.ts` actions.
- **No shared types package** — `src/types/index.ts` in the frontend is a manual mirror of the backend types. When you add or change a backend DTO, update the frontend types file too.
- **`nanoid` version split** — backend uses nanoid v3 (CommonJS `require`), frontend uses nanoid v5 (ESM `import`). Do not upgrade them independently without checking the other side.
- **Drag-and-drop is disabled when filters are active** — `isDragEnabled` in `HomePage.tsx` checks `sortBy === "order" && !status && !priority && !search`. This is intentional; reordering a filtered list would produce confusing `order_index` gaps.

### Docker
- **nginx proxies `/api/`** — in production the browser only talks to nginx on port 80. The backend container is not exposed externally. `CLIENT_URL=http://localhost` in compose.
- **Named volume `todo_data`** — do not bind-mount the DB file in production; use the named volume so Docker manages it.

---

## Gotchas & Non-Obvious Behaviours

- **`better-sqlite3` on Alpine** requires `python3 make g++` at build time (musl libc, no prebuilt binaries). The backend `Dockerfile` builder stage installs these; the runner stage does not need them because `node_modules` is copied already-compiled.
- **Status filter sends `undefined`, not `""`** — `FilterBar` uses `(opt.value || undefined)` to avoid sending `?status=` as an empty query param, which the Zod schema rejects with 400.
- **`PUT /api/todos/:id` expects full `SubTask[]`** (with `id`, `completed`) not just `{ title }[]`. `TodoForm` branches on the `initial` prop: in edit mode it sends the full SubTask shape; in create mode it sends `{ title }[]` only.
- **CORS is locked to `CLIENT_URL`** — if you test the backend directly from a different origin (e.g., Postman, a different port), you'll get CORS errors. Set `CLIENT_URL=*` for unrestricted local testing, but don't commit that.
- **`order_index` gaps after delete** — deleting a todo does not recompact `order_index` on other rows. The frontend sorts by `order_index ASC` and reorder only updates the positions you explicitly drag. Gaps are harmless.

---

## Project Structure

### Repository Root

```
D:\vs\
├── claude-todo-backend/        # Express + TypeScript REST API
├── claude-todo-frontend-ts/    # React + Vite + TypeScript SPA
├── docs/
│   ├── architecture.md         # Full architecture, schema DDL, design decisions
│   └── tasks.md                # Phased task list with completion status
├── CLAUDE.md                   # Claude Code quick-reference (commands + conventions)
├── CLAUDE.local.md             # This file — handoff context
├── docker-compose.yml          # Production compose (backend + frontend + SQLite volume)
└── .gitignore
```

### Backend — `claude-todo-backend/`

```
claude-todo-backend/
├── src/
│   ├── app.ts                      # Entry point — CORS, /health, /api/export, router mounts
│   ├── types/
│   │   └── index.ts                # ★ Source-of-truth for all interfaces and DTOs
│   ├── db/
│   │   ├── database.ts             # Singleton better-sqlite3 instance + PRAGMA setup
│   │   └── migrations.ts           # ★ Add new schema versions here
│   ├── routes/
│   │   ├── todo.routes.ts          # GET/POST/PUT/PATCH/DELETE /api/todos — Zod schemas here
│   │   └── tag.routes.ts           # GET/POST/PUT/DELETE /api/tags — Zod schemas here
│   ├── controllers/
│   │   ├── todo.controller.ts      # Thin HTTP handlers → delegates to TodoService
│   │   └── tag.controller.ts       # Thin HTTP handlers → delegates to TagService
│   ├── services/
│   │   ├── todo.service.ts         # ★ All todo logic — hydrate(), CRUD, filter, reorder
│   │   └── tag.service.ts          # Tag CRUD, SQLITE_CONSTRAINT_UNIQUE → AppError(409)
│   └── middlewares/
│       ├── validate.middleware.ts  # Zod schema factory → 400 on invalid body/query
│       └── error.middleware.ts     # Global AppError handler + 404 handler
├── Dockerfile                      # Multi-stage: builder (tsc) → runner (non-root alpine)
├── .dockerignore
├── package.json
└── tsconfig.json
```

### Frontend — `claude-todo-frontend-ts/`

```
claude-todo-frontend-ts/
├── src/
│   ├── main.tsx                    # React 18 StrictMode entry point
│   ├── App.tsx                     # BrowserRouter + AppShell + useLocalSync bootstrap
│   ├── index.css                   # Tailwind directives + custom component classes (.btn-*, .card, .input-base)
│   ├── types/
│   │   └── index.ts                # ★ Manual mirror of backend types — keep in sync
│   ├── api/
│   │   ├── client.ts               # ★ Axios instance (baseURL /api) + envelope unwrapper
│   │   ├── todo.api.ts             # getAll, getById, create, update, patchStatus, reorder, delete
│   │   └── tag.api.ts              # getAll, create, update, delete
│   ├── store/
│   │   └── todo.store.ts           # ★ Zustand — single source of state, all async actions
│   ├── hooks/
│   │   └── useLocalSync.ts         # Hydrates from localStorage → fetches API on mount
│   ├── pages/
│   │   ├── HomePage.tsx            # ★ / — stats cards, DnD context, FilterBar, todo list
│   │   ├── AddTodoPage.tsx         # /add — TodoForm wired to createTodo
│   │   └── EditTodoPage.tsx        # /edit/:id — TodoForm with initial data + delete button
│   ├── components/
│   │   ├── Navbar.tsx              # Sticky header with logo and nav links
│   │   ├── TodoCard.tsx            # Task card — status toggle, badges, subtask progress, dragHandle slot
│   │   ├── SortableTodoCard.tsx    # Wraps TodoCard with @dnd-kit useSortable + grip handle
│   │   ├── TodoForm.tsx            # Shared form for Add + Edit (title, priority, tags, subtasks)
│   │   ├── FilterBar.tsx           # Search + status buttons + priority/sort dropdowns
│   │   └── ConfirmDialog.tsx       # Portal modal with backdrop + Escape key dismiss
│   └── utils/
│       └── index.ts                # cn(), formatDate(), isOverdue(), label/class maps, TAG_COLORS
├── nginx.conf                      # nginx SPA fallback + /api/ reverse proxy (Docker only)
├── Dockerfile                      # Multi-stage: Vite build → nginx:1.27-alpine
├── .dockerignore
├── vite.config.js                  # Vite + React plugin + @/ alias + /api proxy → :3000
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

> Files marked ★ are the most frequently touched when adding new features.

---

## File Map (key files at a glance)

| File | What it does |
|------|-------------|
| `claude-todo-backend/src/app.ts` | Express entry, CORS, `/health`, `/api/export`, mounts routers |
| `claude-todo-backend/src/db/migrations.ts` | Add new schema migrations here |
| `claude-todo-backend/src/services/todo.service.ts` | All todo business logic + `hydrate()` batch query |
| `claude-todo-backend/src/types/index.ts` | Backend source-of-truth types and DTOs |
| `claude-todo-frontend-ts/src/store/todo.store.ts` | Zustand store — all async actions |
| `claude-todo-frontend-ts/src/api/client.ts` | Axios instance + response envelope unwrapper |
| `claude-todo-frontend-ts/src/types/index.ts` | Frontend mirror of backend types (keep in sync) |
| `claude-todo-frontend-ts/src/pages/HomePage.tsx` | Main list page — DnD context, filters, stats |
| `claude-todo-frontend-ts/nginx.conf` | nginx SPA + API proxy config (used in Docker) |
| `docker-compose.yml` | Production compose (backend + frontend + SQLite volume) |
| `docs/architecture.md` | Full architecture, schema DDL, design decisions |
| `docs/tasks.md` | Phased task list with completion status |
