# doable

A full-stack productivity app with todos, habits, focus timer, and a calendar — built with Express, React, and SQLite.

---

## Features

| Category | What's included |
|----------|----------------|
| **Tasks** | Create, edit, delete; subtasks; priority (low/medium/high); due dates; recurring (daily/weekly/monthly/custom) |
| **Organisation** | Tags with custom colours; status filtering; priority filter; full-text search; sort by manual order, created, due date, or priority |
| **Drag & drop** | Manual reorder with `@dnd-kit`; disabled when filters are active to avoid index gaps |
| **Habits** | Daily/weekly habits; streak counter; 7-day mini calendar; check-in toggle |
| **Focus** | Pomodoro-style timer (5/15/25 min + custom); pause/resume; session history; daily focus stats |
| **Calendar** | Month view (priority-colour dots) + week view (todo pills); click a day to see and toggle tasks |
| **Stats** | Completion streak; 7-day trend bar chart; priority donut chart; overdue task list |
| **Import / Export** | One-click JSON backup download; JSON file import |
| **Auth** | JWT authentication; two hardcoded users; per-user data isolation |
| **Theme** | Light and dark mode; persists across sessions; anti-FOUC inline script |
| **Keyboard shortcuts** | `N` new task · `/` focus search · `Escape` clear search · `?` cheat sheet |
| **URL state** | Filters sync to query params — bookmarkable and survive page refresh |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js · Express · TypeScript · better-sqlite3 · Zod · JWT |
| Frontend | React 18 · Vite · TypeScript · Tailwind CSS · Zustand · Axios |
| Testing | Jest + supertest (backend) · Vitest + React Testing Library (frontend) |
| DevOps | Docker Compose · nginx · GitHub Actions (CI + CD to GHCR) · Railway |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Local development

```bash
# 1. Clone
git clone <repo-url> && cd vs

# 2. Backend
cd claude-todo-backend
cp ../.env.example .env      # fill in JWT_SECRET
npm install
npm run dev                  # http://localhost:3000

# 3. Frontend (new terminal)
cd claude-todo-frontend-ts
npm install
npm run dev                  # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:3000` automatically.

### Railway (production — live)

Frontend: `https://independent-nature-production-12ef.up.railway.app`

Two Railway services in the same project, each built from its subdirectory via Dockerfile:

| Service | Root Directory | Key env vars |
|---------|---------------|-------------|
| backend | `claude-todo-backend` | `JWT_SECRET`, `PORT=3000`, `DB_PATH=/data/todo.db`, `CLIENT_URL` |
| frontend | `claude-todo-frontend-ts` | `PORT=80`, `BACKEND_URL=https://<backend>.up.railway.app` |

SQLite data persists in a Railway Volume mounted at `/data` on the backend service.

### Docker (self-hosted)

```bash
# Generate a random secret
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

docker compose up --build
```

Open **http://localhost**. nginx serves the SPA and reverse-proxies `/api/` to the backend container. The SQLite database is persisted in a named Docker volume (`todo_data`).

### Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | — | 256-bit random secret for signing JWTs. The app throws at startup if unset. |
| `PORT` | No | `3000` | Backend listen port |
| `DB_PATH` | No | `./todo.db` | SQLite file path (use `:memory:` for tests) |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | No | — | Set to `test` to skip `app.listen` during Jest runs |

Copy `.env.example` to `claude-todo-backend/.env` and fill in `JWT_SECRET`.

### Default accounts

Two accounts are hardcoded in `claude-todo-backend/src/config/users.ts`. Ask the project owner for the plaintext passwords, or replace the bcrypt hashes with your own:

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('yourpassword', 12))"
```

---

## Project Structure

```
.
├── claude-todo-backend/        # Express + TypeScript API
│   ├── src/
│   │   ├── app.ts              # Entry point
│   │   ├── config/users.ts     # Hardcoded users + JWT_SECRET guard
│   │   ├── db/                 # SQLite singleton + versioned migrations (v1–v5)
│   │   ├── routes/             # auth · todo · tag · focus · habit · stats
│   │   ├── services/           # Business logic (per-user scoped)
│   │   ├── middlewares/        # JWT auth · Zod validation · error handler
│   │   └── __tests__/          # Jest integration tests
│   └── Dockerfile
├── claude-todo-frontend-ts/    # React + Vite SPA
│   ├── src/
│   │   ├── store/              # Zustand: todo, auth, habit
│   │   ├── pages/              # Home · Add · Edit · Tags · Focus · Habits · Calendar · Stats · Login
│   │   ├── components/         # TodoCard · HabitCard · CalendarGrid · ShortcutsDialog · …
│   │   ├── hooks/              # useLocalSync · useKeyboardShortcuts · usePomodoro
│   │   ├── context/theme.tsx   # Light/dark ThemeProvider
│   │   └── __tests__/          # Vitest unit tests
│   ├── nginx.conf.template     # SPA fallback + /api/ proxy (env-var substitution for PORT and BACKEND_URL)
│   └── Dockerfile
├── .github/workflows/
│   ├── ci.yml                  # Lint + build on every PR
│   └── cd.yml                  # Build → GHCR → SSH deploy on main
├── docker-compose.yml          # Production compose
├── docker-compose.override.yml # Local dev: backend hot-reload
└── docs/
    ├── architecture.md
    └── tasks.md                # Phased roadmap (19 phases, all complete)
```

---

## API Overview

All responses use the envelope `{ success, data?, error?, message? }`. Protected routes require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Obtain JWT |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/todos` | List todos (filter by status/priority/search/sort) |
| `POST` | `/api/todos` | Create todo |
| `PUT` | `/api/todos/:id` | Update todo (full replace incl. subtasks) |
| `PATCH` | `/api/todos/:id/status` | Update status only |
| `PATCH` | `/api/todos/reorder` | Update manual order |
| `DELETE` | `/api/todos/:id` | Delete todo |
| `GET/POST/PUT/DELETE` | `/api/tags` | Tag CRUD |
| `POST` | `/api/focus/sessions` | Start focus session |
| `PATCH` | `/api/focus/sessions/:id` | End / cancel session |
| `GET` | `/api/focus/stats` | Today + week focus minutes |
| `GET/POST/PUT/DELETE` | `/api/habits` | Habit CRUD |
| `POST` | `/api/habits/:id/log` | Check in today |
| `DELETE` | `/api/habits/:id/log/:date` | Undo check-in |
| `GET` | `/api/stats` | Streak + completion trend |
| `GET` | `/api/export` | Full JSON backup (scoped to current user) |
| `POST` | `/api/import` | Restore from JSON backup |
| `GET` | `/health` | Health check (public) |

---

## Testing

```bash
# Backend — 21 integration tests (auth, todo CRUD, tag CRUD)
cd claude-todo-backend && npm test

# Frontend — 10 unit tests (auth store, ProtectedRoute, TodoCard)
cd claude-todo-frontend-ts && npm test
```

Tests use an in-memory SQLite database (`DB_PATH=:memory:`) and never touch the development database.

---

## CI / CD

| Trigger | What happens |
|---------|-------------|
| PR / push to any branch | **CI**: lint + build for backend and frontend in parallel |
| Push to `main` | **CD**: build Docker images → push to GHCR → SSH deploy via `docker compose pull && up` |

CD requires four repository secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`.

---

## Database Schema

Five versioned migrations (v1–v5) create and extend these tables:

```
todos        — id, user_id, title, description, status, priority,
               due_date, order_index, recurrence, created_at, updated_at, completed_at
tags         — id, user_id, name, color, created_at  [UNIQUE(user_id, name)]
subtasks     — id, todo_id, title, completed, created_at
todo_tags    — todo_id, tag_id  [composite PK]
focus_sessions — id, user_id, todo_id, duration, completed, started_at, ended_at
habits       — id, user_id, title, color, frequency, target_days, created_at
habit_logs   — id, habit_id, user_id, date, created_at  [UNIQUE(habit_id, date)]
```

Add new migrations at the end of `claude-todo-backend/src/db/migrations.ts`.
