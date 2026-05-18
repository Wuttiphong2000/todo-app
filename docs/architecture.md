# Architecture

> **Research basis:** Features selected from competitive analysis of Todoist, TickTick, Things 3, Habitica, Linear, Any.do, and Microsoft To Do (May 2026). Prioritised for a solo full-stack showcase with zero infrastructure dependencies.

---

## System Overview

Full-stack Todo application แบบ Monorepo ประกอบด้วย 2 ส่วนหลัก:

```
┌─────────────────────────────────────────────────────┐
│                    Browser (SPA)                    │
│         React + Vite  :5173                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│   │  Pages   │  │Components│  │  Zustand Store   │ │
│   └────┬─────┘  └──────────┘  └────────┬─────────┘ │
│        │                               │            │
│        └───────────── Axios ───────────┘            │
│                         │ /api/*                    │
│                  Vite Proxy Rewrite                 │
└─────────────────────────┼───────────────────────────┘
                          │ HTTP :3000
┌─────────────────────────▼───────────────────────────┐
│                Express REST API                     │
│   ┌─────────┐  ┌────────────┐  ┌──────────────────┐ │
│   │ Routes  │→ │Controllers │→ │    Services      │ │
│   │  + Zod  │  │            │  │ Todo/Tag/Habit   │ │
│   └─────────┘  └────────────┘  └────────┬─────────┘ │
│                                         │            │
│                               ┌─────────▼──────────┐ │
│                               │     pg Pool        │ │
│                               │   PostgreSQL DB    │ │
│                               └────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend — `claude-todo-backend/`

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js (CommonJS) | - |
| Language | TypeScript | 5.4.5 |
| Framework | Express.js | 4.19.2 |
| Validation | Zod | 3.23.8 |
| ID Generation | nanoid | 3.3.7 (CJS) |
| CORS | cors | 2.8.5 |
| Dev Runtime | tsx watch | 4.15.6 |
| Database | PostgreSQL via pg | 8.x |

### Frontend — `claude-todo-frontend-ts/`

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | 5.4.5 |
| UI Framework | React | 18.3.1 |
| Build Tool | Vite | 5.3.1 |
| Routing | React Router DOM | 6.24.0 |
| State Management | Zustand | 4.5.4 |
| HTTP Client | Axios | 1.7.2 |
| Styling | Tailwind CSS + PostCSS | 3.4.4 |
| ID Generation | nanoid | 5.0.7 (ESM) |
| DnD | @dnd-kit/core + sortable | latest |

---

## Backend Architecture

### Layer Pattern (Strict Order)

```
Request → Routes → Middleware (Zod) → Controllers → Services → pg Pool → PostgreSQL
```

### Source Structure

```
src/
├── app.ts                    # Entry point: CORS, body-parser, mount routers
├── config/
│   └── users.ts              # ★ Hardcoded users (bcrypt hashes) + JWT_SECRET
├── types/
│   └── index.ts              # Interfaces และ DTOs ทั้งหมด (source of truth)
├── routes/
│   ├── auth.routes.ts        # POST /api/auth/login, GET /api/auth/me  (public)
│   ├── todo.routes.ts        # GET/POST/PUT/DELETE /api/todos           (protected)
│   ├── tag.routes.ts         # GET/POST/PUT/DELETE /api/tags            (protected)
│   ├── habit.routes.ts       # GET/POST/PUT/DELETE /api/habits
│   ├── focus.routes.ts       # POST /api/focus/sessions
│   ├── stats.routes.ts       # GET /api/stats
│   └── analytics.routes.ts   # POST /api/analytics/guest-visit, GET /api/analytics/dashboard
├── middlewares/
│   ├── auth.middleware.ts    # ★ requireAuth — jwt.verify + attaches req.user
│   ├── validate.middleware.ts # Zod schema factory → 400 เมื่อ invalid
│   └── error.middleware.ts   # Global error handler + 404 handler
├── controllers/
│   ├── todo.controller.ts    # รับ req/res → เรียก TodoService
│   ├── tag.controller.ts     # รับ req/res → เรียก TagService
│   ├── habit.controller.ts   # Habit CRUD + log/unlog
│   ├── focus.controller.ts   # Session start/end + stats
│   └── stats.controller.ts   # Streak + completion trend
├── services/
│   ├── todo.service.ts       # Business logic: CRUD, filter, reorder, recurrence expand
│   ├── tag.service.ts        # Business logic: tag management
│   ├── habit.service.ts      # Streak calc, check-in, unlog
│   ├── focus.service.ts      # Session CRUD, daily stats
│   ├── stats.service.ts      # Streak + completion trend queries
│   └── analytics.service.ts  # Guest visit tracking, admin dashboard stats
└── db/
    ├── database.ts           # pg Pool + initDb() (runs migrations) + withTransaction()
    └── migrations.ts         # Versioned SQL migrations v1–v6
```

### API Response Envelope

ทุก endpoint ตอบกลับในรูปแบบเดียวกัน:

```ts
{
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

---

## Database Design (PostgreSQL)

### เหตุผลที่เลือก PostgreSQL + `pg`
- รองรับ concurrent connections ผ่าน connection pool (`max: 10`)
- Railway PostgreSQL plugin ให้ `DATABASE_URL` อัตโนมัติ — zero-config deployment
- `BOOLEAN`, `SERIAL`, และ `ILIKE` รองรับ native ไม่ต้อง workaround
- Async/await API เข้ากันได้กับ Express error handling pattern

### Current Schema — 7 Tables (implemented)

```
┌──────────────┐        ┌───────────────┐
│     tags     │        │     todos     │
├──────────────┤        ├───────────────┤
│ id (PK)      │        │ id (PK)       │
│ name         │        │ title         │
│ color        │        │ description   │
│ created_at   │        │ status        │
└──────┬───────┘        │ priority      │
       │                │ due_date      │
       │  ┌─────────────│ order_index   │
       │  │             │ recurrence    │ ← (planned col)
       │  │             │ created_at    │
       ▼  ▼             │ updated_at    │
┌───────────────┐       │ completed_at  │
│  todo_tags    │       └──────┬────────┘
├───────────────┤              │
│ todo_id (FK)  │◄─────────────┘
│ tag_id  (FK)  │       ┌───────────────┐
└───────────────┘       │   subtasks    │
                        ├───────────────┤
                        │ id (PK)       │
                        │ todo_id (FK)  │
                        │ title         │
                        │ completed     │
                        │ created_at    │
                        └───────────────┘
```

### Planned Schema Extensions

#### Recurring Tasks (migration v2)

```sql
-- เพิ่มใน todos table
ALTER TABLE todos ADD COLUMN recurrence TEXT;
-- JSON: { "type": "daily"|"weekly"|"monthly"|"custom", "interval": 1,
--         "daysOfWeek": [1,3,5], "endDate": "2026-12-31" }
```

#### Habits (migration v3)

```sql
CREATE TABLE IF NOT EXISTS habits (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  frequency    TEXT NOT NULL DEFAULT 'daily',  -- 'daily' | 'weekly'
  target_days  TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7]',  -- JSON days array
  color        TEXT NOT NULL DEFAULT '#f97316',
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id         TEXT PRIMARY KEY,
  habit_id   TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  logged_at  TEXT NOT NULL,           -- ISO date 'YYYY-MM-DD'
  note       TEXT
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date  ON habit_logs(logged_at);
```

#### Focus Sessions (migration v4)

```sql
CREATE TABLE IF NOT EXISTS focus_sessions (
  id          TEXT PRIMARY KEY,
  todo_id     TEXT REFERENCES todos(id) ON DELETE SET NULL,
  duration    INTEGER NOT NULL,   -- minutes (default 25)
  completed   INTEGER NOT NULL DEFAULT 0,
  started_at  TEXT NOT NULL,
  ended_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_todo ON focus_sessions(todo_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_date ON focus_sessions(started_at);
```

### Current SQL DDL (implemented — PostgreSQL)

```sql
CREATE TABLE IF NOT EXISTS tags (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL DEFAULT '',
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS todos (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL DEFAULT '',
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'in_progress', 'done')),
  priority     TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low', 'medium', 'high')),
  due_date     TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  recurrence   TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS subtasks (
  id         TEXT PRIMARY KEY,
  todo_id    TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  todo_id    TEXT REFERENCES todos(id) ON DELETE SET NULL,
  duration   INTEGER NOT NULL DEFAULT 25,
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TEXT NOT NULL,
  ended_at   TEXT
);

CREATE TABLE IF NOT EXISTS habits (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#f97316',
  frequency   TEXT NOT NULL DEFAULT 'daily',
  target_days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7]',
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id         TEXT PRIMARY KEY,
  habit_id   TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  date       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_todos_user     ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_status   ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_order    ON todos(order_index);
CREATE INDEX IF NOT EXISTS idx_subtasks_todo  ON subtasks(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_tags_todo ON todo_tags(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_tags_tag  ON todo_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_focus_user     ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user    ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs     ON habit_logs(habit_id, date);
```

### Migration System

ใช้ตาราง `schema_migrations` ในการ track version:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
```

`migrations.ts` วนลูปรัน migration ที่ยังไม่ถูก apply ตามลำดับ version ก่อน boot server

---

## pg Pool & Transaction Helper

```ts
import { Pool, PoolClient } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

Services query directly via `pool.query(sql, params)` for single statements, or receive a `PoolClient` inside `withTransaction` for multi-step operations. Positional placeholders use `$1, $2, …` (PostgreSQL syntax).

### Mapping: DB Row → TypeScript Interface

`pg` returns `BOOLEAN` columns as JavaScript `boolean` and aggregate functions (COUNT, SUM) as strings. Always coerce aggregates with `Number(row.count)`:

```ts
function mapRowToTodo(row: TodoRow, tagIds: string[], subtasks: SubTask[]): Todo {
  return {
    ...row,
    description: row.description ?? null,
    dueDate: row.due_date ?? null,
    completedAt: row.completed_at ?? null,
    order: row.order_index,
    tagIds,
    subtasks: subtasks.map(s => ({ ...s, completed: s.completed })), // already boolean
  };
}
```

---

## Frontend Architecture

### Data Flow

```
User Interaction
      │
      ▼
   Pages / Components
      │ call action
      ▼
  Zustand Store  ←──────── useLocalSync (localStorage sync)
      │ async
      ▼
  API Layer (Axios)
      │ /api/*
      ▼
  Vite Proxy → Backend :3000
```

### Directory Structure (current + planned)

```
src/
├── main.tsx                  # React 18 StrictMode entry
├── App.tsx                   # BrowserRouter + useLocalSync bootstrap
├── index.css                 # Tailwind directives + custom component classes
├── types/index.ts            # Mirror of backend types (sync manually)
├── api/
│   ├── client.ts             # Axios instance (baseURL /api, 10s timeout) + error interceptor
│   ├── todo.api.ts           # getAll, getById, create, update, patchStatus, reorder, delete
│   ├── tag.api.ts            # getAll, create, update, delete
│   ├── habit.api.ts          # (planned) getAll, create, logToday, delete
│   └── focus.api.ts          # (planned) startSession, endSession, getStats
├── store/
│   ├── auth.store.ts         # ★ Zustand: login/logout/hydrate, token in localStorage
│   ├── todo.store.ts         # Zustand store — state + all todo/tag async actions
│   ├── habit.store.ts        # (planned) habit state + actions
│   └── focus.store.ts        # (planned) timer state + session actions
├── hooks/
│   ├── useLocalSync.ts       # Hydrates from localStorage → fetches API on mount
│   └── usePomodoro.ts        # (planned) countdown timer logic
├── pages/
│   ├── LoginPage.tsx         # ★ /login — login form (public, no auth required)
│   ├── HomePage.tsx          # / — stats cards, FilterBar, todo list
│   ├── AddTodoPage.tsx       # /add — create form
│   ├── EditTodoPage.tsx      # /edit/:id — edit form + delete button
│   ├── TagsPage.tsx          # /tags — (planned) manage tag names/colors
│   ├── HabitsPage.tsx        # /habits — (planned) habit tracker + streaks
│   ├── FocusPage.tsx         # /focus — (planned) Pomodoro timer + task picker
│   └── CalendarPage.tsx      # /calendar — (planned) monthly/weekly view
├── components/
│   ├── Navbar.tsx            # Sticky header: logo, nav links, username badge, logout button
│   ├── ProtectedRoute.tsx    # ★ Redirects to /login if no auth token in store
│   ├── TodoCard.tsx          # Task card with inline status toggle and delete
│   ├── SortableTodoCard.tsx  # Wraps TodoCard with DnD grip handle
│   ├── TodoForm.tsx          # Shared form for Add and Edit
│   ├── FilterBar.tsx         # Search + status/priority filter + sort controls
│   ├── ConfirmDialog.tsx     # Portal-based confirmation modal
│   ├── HabitCard.tsx         # (planned) habit row with check-in button + streak
│   ├── PomodoroTimer.tsx     # (planned) countdown + session controls
│   └── CalendarGrid.tsx      # (planned) month/week grid with todo dots
└── utils/index.ts            # Label maps, CSS class maps, TAG_COLORS, formatDate, isOverdue, cn()
```

### Routing (React Router v6)

| Path | Page | Auth | Status |
|------|------|------|--------|
| `/login` | LoginPage | Public | Done |
| `/` | HomePage | Protected | Done |
| `/add` | AddTodoPage | Protected | Done |
| `/edit/:id` | EditTodoPage | Protected | Done |
| `/tags` | TagsPage | Protected | Planned |
| `/habits` | HabitsPage | Protected | Planned |
| `/focus` | FocusPage | Protected | Planned |
| `/calendar` | CalendarPage | Protected | Planned |

All protected routes are wrapped with `<ProtectedRoute>` in `App.tsx`.

### State Management (Zustand)

`todo.store.ts` — single source of truth for todos and tags:

| State | Type | Description |
|-------|------|-------------|
| `todos` | `Todo[]` | Full todo list |
| `tags` | `Tag[]` | All tags |
| `loading` | `boolean` | API in-flight indicator |
| `error` | `string \| null` | Last error message |

**Actions:**

| Action | Behaviour |
|--------|-----------|
| `fetchTodos(params?)` | GET /api/todos with optional filters |
| `createTodo(dto)` | POST → append to state |
| `updateTodo(id, dto)` | PUT → replace item in state |
| `patchStatus(id, status)` | PATCH with optimistic update + rollback on error |
| `deleteTodo(id)` | DELETE → remove from state |
| `reorderTodos(ids)` | PATCH /api/todos/reorder with optimistic update |
| `fetchTags()` | GET /api/tags |
| `createTag(dto)` | POST → append to tags |
| `updateTag(id, dto)` | PUT → replace tag in state |
| `deleteTag(id)` | DELETE → remove tag and strip tagId from all todos |

### Offline & Caching (useLocalSync)

`useLocalSync` runs once in `App.tsx`:
1. Reads `todo_app_cache` from localStorage → calls `setTodos` / `setTags` (instant paint)
2. Immediately fires `fetchTodos()` + `fetchTags()` for fresh data
3. `useEffect` watches todos/tags → writes to localStorage on every change

### Components

**TodoCard** — renders one task row:
- Checkbox toggles `pending ↔ done` via optimistic `patchStatus`
- Priority badge, status badge, tag chips (custom color), due date with overdue warning
- Subtask progress counter (`X / Y`)
- Edit link → `/edit/:id`, delete opens `ConfirmDialog`

**TodoForm** — shared by Add and Edit pages:
- Fields: title, description, priority (3-button selector), due date, tag multi-select, subtask list
- Inline tag creator (name + color picker from `TAG_COLORS`)
- Subtask items added via Enter key or `+` button

**FilterBar** — controlled by local state in HomePage:
- Search input → re-fetches on change
- Status buttons (All / Pending / In Progress / Done)
- Priority dropdown, Sort dropdown (Manual / Created / Due Date / Priority)

**ConfirmDialog** — rendered via `ReactDOM.createPortal` to `document.body`:
- Closes on backdrop click or Escape key
- Auto-focuses cancel button on open

### Styling System (Tailwind + Custom Classes)

Dark theme built on a surface color palette defined in `index.css`:

| Token | Usage |
|-------|-------|
| `surface-950` | Page background (`#13161d`) |
| `surface-900` | Card / input background |
| `surface-700` | Hover states, borders |
| `accent` | Orange CTA buttons and highlights |

Reusable CSS component classes (defined in `@layer components`):

| Class | Element |
|-------|---------|
| `.btn-primary` | Orange action button |
| `.btn-ghost` | Transparent secondary button |
| `.btn-danger` | Red destructive button |
| `.card` | Dark bordered container |
| `.input-base` | Form inputs with focus ring |
| `.badge-priority-{low\|medium\|high}` | Priority colour badges |
| `.badge-status-{pending\|in_progress\|done}` | Status colour badges |

---

## Authentication

> **Design decision:** No registration. Exactly 2 users are hardcoded with bcrypt-hashed passwords. Each user sees **only their own todos and tags** — data is fully isolated by `user_id`. The login layer controls access and determines whose data is shown.

### Users

| Username | Password | Notes |
|----------|----------|-------|
| `nxmpexng` | `01092004` | Stored as bcrypt hash (rounds=12) |
| `wskt` | `kirikaya43` | Stored as bcrypt hash (rounds=12) |

Passwords are **never stored in plaintext** anywhere in the codebase. Hashes live in `claude-todo-backend/src/config/users.ts`.

### Auth Flow

```
Browser                          Express Backend
  │                                    │
  │  POST /api/auth/login              │
  │  { username, password }  ────────► │  bcrypt.compareSync(password, hash)
  │                                    │  jwt.sign({ id, username }, JWT_SECRET)
  │  { token, user }         ◄──────── │
  │                                    │
  │  Store token in localStorage       │
  │                                    │
  │  GET /api/todos                    │
  │  Authorization: Bearer <token> ──► │  requireAuth middleware
  │                                    │  jwt.verify(token, JWT_SECRET)
  │  { success, data: [...] } ◄─────── │  → sets req.user, calls next()
```

### Backend — Key Files

| File | Role |
|------|------|
| `src/config/users.ts` | Hardcoded user list + bcrypt hashes + `JWT_SECRET` constant + `JWT_EXPIRES_IN` |
| `src/routes/auth.routes.ts` | `POST /api/auth/login`, `GET /api/auth/me` |
| `src/middlewares/auth.middleware.ts` | `requireAuth` — extracts Bearer token, calls `jwt.verify`, attaches `req.user` |

### Public vs Protected Routes

| Route | Auth required? |
|-------|---------------|
| `GET /health` | No |
| `POST /api/auth/login` | No |
| `GET /api/auth/me` | No (self-verifying) |
| `GET/POST/PUT/PATCH/DELETE /api/todos/*` | **Yes** |
| `GET/POST/PUT/DELETE /api/tags/*` | **Yes** |
| `GET /api/export` | **Yes** |
| `POST /api/import` | **Yes** (when implemented) |

### Frontend — Key Files

| File | Role |
|------|------|
| `src/store/auth.store.ts` | Zustand store: `login()`, `logout()`, `hydrate()` (reads token from localStorage on boot) |
| `src/pages/LoginPage.tsx` | Login form with show/hide password; redirects to `/` on success |
| `src/components/ProtectedRoute.tsx` | Wraps routes — redirects to `/login` if no token in store |
| `src/api/client.ts` | Request interceptor: auto-attaches `Authorization: Bearer <token>`; 401 response clears auth + redirects to `/login` |

### Token Storage & Lifecycle

- Token stored in `localStorage` as `auth_token`
- User object stored in `localStorage` as `auth_user` (JSON)
- `useAuthStore.hydrate()` is called once on app mount in `App.tsx` to restore session
- Token expiry: **30 days** (controlled by `JWT_EXPIRES_IN` in `config/users.ts`)
- On logout: both `auth_token` and `auth_user` are removed; `todo_app_cache` is also cleared
- On any 401 response: same cleanup + redirect to `/login`

### Environment Variables for Auth

| Variable | Where | Default | Note |
|----------|-------|---------|------|
| `JWT_SECRET` | Backend | `"doable_app_jwt_secret_2026_change_in_prod"` | **Change in production** — if this leaks, anyone can forge tokens |

> **Gotcha:** The `JWT_SECRET` fallback in `config/users.ts` is fine for local dev but must be overridden via env var in any deployment. Docker Compose should set `JWT_SECRET=<random-256-bit-string>`.

### Adding a Third User (if needed later)

1. Hash the new password: `node -e "const b=require('bcryptjs'); console.log(b.hashSync('PASSWORD',12))"`
2. Add a new entry to the `USERS` array in `src/config/users.ts`
3. Restart the backend — no migration or database change needed

---

## Feature Vision (from Competitive Research)

Features ranked by **value vs complexity** for a solo showcase project:

| Feature | Inspiration | Priority | Complexity |
|---------|-------------|----------|------------|
| Tag management page | Todoist labels | High | Low |
| Import JSON backup | Todoist backup | High | Low |
| Light/dark theme toggle | Universal | High | Low |
| Recurring tasks | Todoist, TickTick | High | Medium |
| Focus mode + Pomodoro timer | TickTick, Focus To-Do | High | Medium |
| Enhanced dashboard stats | Any.do, Todoist | Medium | Low |
| Habit tracker with streaks | TickTick, Habitica | Medium | Medium |
| Calendar view (month/week) | TickTick, Google Tasks | Medium | High |
| Filter URL sync | Linear | Medium | Low |
| Kanban board view | Notion, Linear | Low | High |
| Natural language date input | Todoist, TickTick | Low | High |
| AI task breakdown | Todoist AI | Low | High |

---

## Key Design Decisions

### 1. PostgreSQL + pg
Async pool-based client รองรับ concurrent requests ได้ดี, เข้ากันได้กับ Railway PostgreSQL plugin โดยตรงผ่าน `DATABASE_URL`, รองรับ ACID transactions ผ่าน `withTransaction()` helper, `BOOLEAN` native, `ILIKE` case-insensitive search

### 2. ตาราง `todo_tags` (Junction Table)
ความสัมพันธ์ Todo ↔ Tag เป็น many-to-many — ใช้ junction table แทน JSON column เพื่อให้ query และ cascade delete ทำงานถูกต้อง

### 3. ตาราง `subtasks` แยก
แยกเป็นตารางแทนเพื่อให้ update subtask แต่ละรายการได้โดยไม่ต้อง serialize/deserialize ทั้งอาร์เรย์

### 4. `ON DELETE CASCADE`
ลบ Todo → ลบ subtasks และ todo_tags อัตโนมัติ. ลบ Tag → ลบ todo_tags อัตโนมัติ (ไม่กระทบ todo ตัวอื่น)

### 5. Vite Proxy
Frontend ไม่เคย hardcode port ของ backend. `/api/*` ถูก rewrite เป็น `http://localhost:3000/*` ผ่าน `vite.config.js`

### 6. Axios Interceptors
`client.ts` จัดการ unwrap response envelope อัตโนมัติ. Components ได้รับข้อมูล `data` โดยตรง ไม่ต้องเข้าถึง `.data.data`

### 7. nanoid Version Split
- Backend: nanoid **v3** (CommonJS) — `require('nanoid')`
- Frontend: nanoid **v5** (ESM) — `import { nanoid } from 'nanoid'`
ต้องระวังเมื่ออัปเดต dependency ฝั่งใดฝั่งหนึ่ง

### 8. Types Sync
`src/types/index.ts` ใน frontend เป็น manual mirror ของ backend. เมื่อเปลี่ยน interface ใน backend ต้องอัปเดต frontend ด้วยเสมอ

### 9. Recurrence as JSON Column (planned)
เก็บ recurrence rule เป็น TEXT/JSON ใน `todos.recurrence` แทนที่จะสร้างตารางแยก — เพราะ recurrence rule ของ todo เดียวมีเพียง 1 rule และไม่ต้องการ query ข้าม todos ด้วย recurrence field

### 10. Drag-and-drop disabled when filters active
`isDragEnabled` ใน `HomePage.tsx` ตรวจว่า `sortBy === "order" && !status && !priority && !search` — การเรียงลำดับ filtered list จะสร้าง `order_index` gaps ที่ไม่ consistent

---

## Environment Variables

| Variable | Service | Default | หน้าที่ |
|----------|---------|---------|--------|
| `PORT` | Backend | `3000` | Port ที่ Express ฟัง |
| `DATABASE_URL` | Backend | — | PostgreSQL connection string (required) |
| `CLIENT_URL` | Backend | `http://localhost:5173` | CORS origin (ใน Docker ใช้ `http://localhost`) |
| `JWT_SECRET` | Backend | — | JWT signing secret (required, throws at startup if missing) |

---

## Docker & Deployment

### Production Architecture (Docker Compose)

```
Browser
   │  :80
   ▼
┌──────────────────────────────────────┐
│          nginx:1.27-alpine           │
│   /              → dist/ (static)   │
│   /api/*         → backend:3000     │
│   /health        → backend:3000     │
└──────────────┬───────────────────────┘
               │ internal Docker network
               ▼
┌──────────────────────────────────────┐
│       node:22-alpine (backend)       │
│   Express :3000                      │
│   DATABASE_URL=postgresql://...      │
└──────────────┬───────────────────────┘
               │ internal Docker network
               ▼
┌──────────────────────────────────────┐
│     postgres:16-alpine               │
│   Port 5432 (internal only)          │
└──────────────┬───────────────────────┘
               │ volume mount
               ▼
          postgres_data (named volume)
```

### Dockerfile Strategy

**Backend** (`claude-todo-backend/Dockerfile`):

| Stage | Base | Role |
|-------|------|------|
| `builder` | `node:22-alpine` | Runs `npm ci`, `tsc`, `npm prune --production` |
| `runner` | `node:22-alpine` | Copies pruned `node_modules` + `dist`, runs as non-root `app` user |

**Frontend** (`claude-todo-frontend-ts/Dockerfile`):

| Stage | Base | Role |
|-------|------|------|
| `builder` | `node:22-alpine` | `npm ci` + `vite build` → `dist/` |
| `runner` | `nginx:1.27-alpine` | Serves static files, proxies `/api/` to backend |

### Running with Docker

```bash
docker compose up --build
# App at http://localhost
# Health check: http://localhost/health
```

### Key Docker Decisions

**PostgreSQL as a separate container**
`postgres:16-alpine` runs alongside the backend on the internal Docker network. The backend connects via `DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/todoapp`. Data persists in named volume `postgres_data`.

**No native build tools needed**
`pg` is a pure JavaScript client — no `python3`/`make`/`g++` required in the builder stage, unlike the old `better-sqlite3` setup.

**CORS in Docker**
All browser traffic flows through nginx on port 80. `CLIENT_URL=http://localhost` is set in compose.

**SPA routing via nginx**
`try_files $uri $uri/ /index.html` returns `index.html` for all non-asset paths so React Router handles client-side navigation correctly.

---

## Guest Mode Architecture (Phase 20)

> ให้ผู้เยี่ยมชมใช้แอปได้โดยไม่ต้อง login — ข้อมูลทั้งหมดอยู่ใน localStorage เท่านั้น ไม่มี API call

### Data Flow เปรียบเทียบ

```
Logged-in User                      Guest User
─────────────────────────────────   ─────────────────────────────────
Pages → Zustand Store               Pages → Zustand Store
             │ API call                          │ localStorage only
             ▼                                   ▼
       Express Backend              guest_todos / guest_tags /
       SQLite (server)              guest_habits / guest_habit_logs
                                    (browser localStorage)
```

### isGuest Flag

`auth.store.ts` เพิ่ม `isGuest: boolean` และ `loginAsGuest()`:

```ts
loginAsGuest: () => {
  const guestUser = { id: "guest", username: "Guest" }
  localStorage.setItem("auth_guest", "true")
  set({ user: guestUser, token: null, isGuest: true })
}
```

`hydrate()` อ่าน `auth_guest` key เพื่อ restore guest session เมื่อ reload

### Store Branching Pattern

ทุก action ใน `todo.store.ts` และ `habit.store.ts` ใช้ pattern นี้:

```ts
fetchTodos: async () => {
  if (useAuthStore.getState().isGuest) {
    const cached = localStorage.getItem("guest_todos")
    set({ todos: cached ? JSON.parse(cached) : [] })
    return
  }
  // ...existing API call logic
}

createTodo: async (dto) => {
  if (useAuthStore.getState().isGuest) {
    const newTodo: Todo = { ...dto, id: nanoid(), createdAt: new Date().toISOString(), ... }
    set(s => {
      const todos = [...s.todos, newTodo]
      localStorage.setItem("guest_todos", JSON.stringify(todos))
      return { todos }
    })
    return
  }
  // ...existing API call logic
}
```

### localStorage Keys

| Key | เนื้อหา | ใครใช้ |
|-----|---------|--------|
| `auth_token` | JWT string | Logged-in user |
| `auth_user` | JSON user object | Logged-in user |
| `auth_guest` | `"true"` | Guest session marker |
| `todo_app_cache` | `{ todos, tags }` snapshot | Logged-in user (useLocalSync) |
| `guest_todos` | `Todo[]` JSON | Guest |
| `guest_tags` | `Tag[]` JSON | Guest |
| `guest_habits` | `Habit[]` JSON | Guest |
| `guest_habit_logs` | `HabitLog[]` JSON | Guest |

### GuestBanner Component

แสดงเมื่อ `isGuest === true` ใน `App.tsx` เหนือ router outlet:

```tsx
{isGuest && <GuestBanner />}
```

ประกอบด้วย:
- ข้อความเตือนว่าข้อมูลเก็บในเครื่องเท่านั้น
- ปุ่ม Export → download `guest_todos` + `guest_tags` เป็น JSON
- ปุ่ม Login → navigate ไป `/login`

### Feature Matrix

| Feature | Logged-in | Guest |
|---------|-----------|-------|
| Todo CRUD | ✅ server | ✅ localStorage |
| Tag CRUD | ✅ server | ✅ localStorage |
| Habit tracker | ✅ server | ✅ localStorage |
| Calendar view | ✅ | ✅ (reads local todos) |
| Focus / Pomodoro | ✅ server | ❌ requires server session |
| Stats dashboard | ✅ | ⚠️ ข้อมูล limited (no focus stats) |
| Export | ✅ | ✅ exports localStorage data |
| Import | ✅ | ✅ imports into localStorage |
| Data persistence | ✅ permanent | ⚠️ lost if browser data cleared |
| Cross-device sync | ✅ | ❌ |

### ข้อจำกัด

- **ข้อมูลหายถ้า clear browser data** — guest mode เหมาะสำหรับทดลองใช้เท่านั้น
- **ไม่ sync ข้ามเครื่อง** — localStorage เป็น per-browser
- **Focus timer ไม่รองรับ** — session ต้องบันทึกบน server เพื่อความถูกต้องของ stats
- **ไม่มีการ migrate data อัตโนมัติ** เมื่อ guest สมัครบัญชีจริง — ใช้ Export/Import แทน
