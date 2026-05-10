# Architecture

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
│   │  + Zod  │  │            │  │ Todo / Tag       │ │
│   └─────────┘  └────────────┘  └────────┬─────────┘ │
│                                         │            │
│                               ┌─────────▼──────────┐ │
│                               │  DatabaseService   │ │
│                               │  better-sqlite3    │ │
│                               │    todo.db         │ │
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
| **Database** | **SQLite via better-sqlite3** | **latest** |

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

---

## Backend Architecture

### Layer Pattern (Strict Order)

```
Request → Routes → Middleware (Zod) → Controllers → Services → DatabaseService → todo.db
```

### โครงสร้าง src/

```
src/
├── app.ts                    # Entry point: CORS, body-parser, mount routers
├── types/
│   └── index.ts              # Interfaces และ DTOs ทั้งหมด (source of truth)
├── routes/
│   ├── todo.routes.ts        # GET/POST/PUT/DELETE /api/todos
│   └── tag.routes.ts         # GET/POST/PUT/DELETE /api/tags
├── middlewares/
│   ├── validate.middleware.ts # Zod schema factory → 400 เมื่อ invalid
│   └── error.middleware.ts   # Global error handler + 404 handler
├── controllers/
│   ├── todo.controller.ts    # รับ req/res → เรียก TodoService
│   └── tag.controller.ts     # รับ req/res → เรียก TagService
├── services/
│   ├── todo.service.ts       # Business logic: CRUD, filter, reorder
│   └── tag.service.ts        # Business logic: tag management
└── db/
    ├── database.ts           # Singleton better-sqlite3 instance + PRAGMA setup
    └── migrations.ts         # รัน SQL migration ตามลำดับ version
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

## Database Design (SQLite)

### เหตุผลที่เลือก `better-sqlite3`
- API แบบ **synchronous** — ไม่ต้องใช้ async/await ในชั้น DB
- รองรับ TypeScript ได้ดี มี `@types/better-sqlite3`
- เร็วที่สุดในกลุ่ม SQLite libraries ของ Node.js
- รองรับ prepared statements และ transactions ในตัว

### ติดตั้ง

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

### Schema — 4 Tables

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

### SQL DDL

```sql
-- เปิด Foreign Key enforcement (ต้องรันทุกครั้งที่เปิด connection)
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;  -- รองรับ concurrent reads

CREATE TABLE IF NOT EXISTS tags (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'in_progress', 'done')),
  priority     TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low', 'medium', 'high')),
  due_date     TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS subtasks (
  id         TEXT PRIMARY KEY,
  todo_id    TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  completed  INTEGER NOT NULL DEFAULT 0,  -- SQLite ไม่มี BOOLEAN ใช้ 0/1
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);

-- Indexes สำหรับ query ที่ใช้บ่อย
CREATE INDEX IF NOT EXISTS idx_todos_status   ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_order    ON todos(order_index);
CREATE INDEX IF NOT EXISTS idx_subtasks_todo  ON subtasks(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_tags_todo ON todo_tags(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_tags_tag  ON todo_tags(tag_id);
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

## DatabaseService (Singleton)

```ts
// src/db/database.ts
import Database from 'better-sqlite3';

class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database('todo.db');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('journal_mode = WAL');
  }

  getDb(): Database.Database {
    return this.db;
  }
}

export const databaseService = new DatabaseService();
```

Services เรียกผ่าน `databaseService.getDb()` แล้วใช้ prepared statements:

```ts
// ตัวอย่างใน TodoService
const stmt = db.prepare('SELECT * FROM todos WHERE id = ?');
const row = stmt.get(id);
```

### Mapping: DB Row → TypeScript Interface

เนื่องจาก SQLite เก็บ `BOOLEAN` เป็น `0/1` และ `Array` เป็น rows แยก ต้องมี mapper:

```ts
function mapRowToTodo(row: TodoRow, tagIds: string[], subtasks: SubTask[]): Todo {
  return {
    ...row,
    description: row.description ?? null,
    dueDate: row.due_date ?? null,
    completedAt: row.completed_at ?? null,
    order: row.order_index,
    tagIds,
    subtasks: subtasks.map(s => ({ ...s, completed: Boolean(s.completed) })),
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

### Directory Structure

```
src/
├── main.tsx                  # React 18 StrictMode entry
├── App.tsx                   # BrowserRouter + useLocalSync bootstrap
├── index.css                 # Tailwind directives + custom component classes
├── types/index.ts            # Mirror of backend types (sync manually)
├── api/
│   ├── client.ts             # Axios instance (baseURL /api, 10s timeout) + error interceptor
│   ├── todo.api.ts           # getAll, getById, create, update, patchStatus, reorder, delete
│   └── tag.api.ts            # getAll, create, update, delete
├── store/
│   └── todo.store.ts         # Zustand store — state + all async actions
├── hooks/
│   └── useLocalSync.ts       # Hydrates from localStorage → fetches API on mount
├── pages/
│   ├── HomePage.tsx          # /        — stats cards, FilterBar, todo list
│   ├── AddTodoPage.tsx       # /add     — create form
│   └── EditTodoPage.tsx      # /edit/:id — edit form + delete button
├── components/
│   ├── Navbar.tsx            # Sticky header with logo and nav links
│   ├── TodoCard.tsx          # Task card with inline status toggle and delete
│   ├── TodoForm.tsx          # Shared form for Add and Edit
│   ├── FilterBar.tsx         # Search + status/priority filter + sort controls
│   └── ConfirmDialog.tsx     # Portal-based confirmation modal
└── utils/index.ts            # Label maps, CSS class maps, TAG_COLORS, formatDate, isOverdue, cn()
```

### Routing (React Router v6)

| Path | Page | Responsibility |
|------|------|---------------|
| `/` | HomePage | Stats overview, filter/search, todo list with empty states |
| `/add` | AddTodoPage | TodoForm wired to `createTodo` action |
| `/edit/:id` | EditTodoPage | TodoForm with initial data, delete via ConfirmDialog |

### State Management (Zustand)

`todo.store.ts` is the single source of truth:

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
| `fetchTags()` | GET /api/tags |
| `createTag(dto)` | POST → append to tags |
| `deleteTag(id)` | DELETE → remove tag and strip tagId from all todos in state |

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

## Key Design Decisions

### 1. SQLite + better-sqlite3
แทน `db.json` เดิม — ได้ ACID transactions, foreign key constraints, index-based queries  
Synchronous API ของ `better-sqlite3` ทำให้ services ไม่ต้องเปลี่ยนจาก sync เป็น async

### 2. ตาราง `todo_tags` (Junction Table)
ความสัมพันธ์ Todo ↔ Tag เป็น many-to-many  
แทนที่จะเก็บ `tagIds[]` ใน JSON column ใช้ junction table เพื่อให้ query และ cascade delete ทำงานถูกต้อง

### 3. ตาราง `subtasks` แยก
Subtasks เดิมเก็บเป็น JSON array ในฟิลด์เดียว  
แยกเป็นตารางแทนเพื่อให้ update subtask แต่ละรายการได้โดยไม่ต้อง serialize/deserialize ทั้งอาร์เรย์

### 4. `ON DELETE CASCADE`
ลบ Todo → ลบ subtasks และ todo_tags อัตโนมัติ  
ลบ Tag → ลบ todo_tags อัตโนมัติ (ไม่กระทบ todo ตัวอื่น)

### 5. Vite Proxy
Frontend ไม่เคย hardcode port ของ backend  
`/api/*` ถูก rewrite เป็น `http://localhost:3000/*` ผ่าน `vite.config.js`

### 6. Axios Interceptors
`client.ts` จัดการ unwrap response envelope อัตโนมัติ  
Components ได้รับข้อมูล `data` โดยตรง ไม่ต้องเข้าถึง `.data.data`

### 7. nanoid Version Split
- Backend: nanoid **v3** (CommonJS) — `require('nanoid')`
- Frontend: nanoid **v5** (ESM) — `import { nanoid } from 'nanoid'`  
ต้องระวังเมื่ออัปเดต dependency ฝั่งใดฝั่งหนึ่ง

### 8. Types Sync
`src/types/index.ts` ใน frontend เป็น manual mirror ของ backend  
เมื่อเปลี่ยน interface ใน backend ต้องอัปเดต frontend ด้วยเสมอ

---

## Environment Variables

| Variable | Service | Default | หน้าที่ |
|----------|---------|---------|--------|
| `PORT` | Backend | `3000` | Port ที่ Express ฟัง |
| `CLIENT_URL` | Backend | `http://localhost:5173` | CORS origin (ใน Docker ใช้ `http://localhost`) |
| `DB_PATH` | Backend | `./todo.db` | Path ของ SQLite file (ใน Docker ใช้ `/data/todo.db`) |

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
│   DB_PATH=/data/todo.db             │
└──────────────┬───────────────────────┘
               │ volume mount
               ▼
          todo_data (named volume)
              /data/todo.db
```

### Dockerfile Strategy

**Backend** (`claude-todo-backend/Dockerfile`):

| Stage | Base | Role |
|-------|------|------|
| `builder` | `node:22-alpine` | Installs `python3 make g++` (for better-sqlite3 native compile), runs `tsc` + `npm prune --production` |
| `runner` | `node:22-alpine` | Copies pruned `node_modules` + `dist`, runs as non-root `app` user |

**Frontend** (`claude-todo-frontend-ts/Dockerfile`):

| Stage | Base | Role |
|-------|------|------|
| `builder` | `node:22-alpine` | `npm ci` + `vite build` → `dist/` |
| `runner` | `nginx:1.27-alpine` | Serves static files, proxies `/api/` to backend |

### Running with Docker

```bash
# Build and start both services
docker compose up --build

# App available at http://localhost
# API health check: http://localhost/health
```

### Key Docker Decisions

**better-sqlite3 on Alpine (musl libc)**  
Prebuilt binaries aren't available for musl; the builder stage installs `python3 make g++ apk` so the native addon compiles from source. The runner copies the already-compiled `node_modules` — no build tools in the final image.

**SQLite persistence**  
Named Docker volume `todo_data` mounted at `/data` inside the container. `DB_PATH=/data/todo.db` ensures the file survives container restarts and image rebuilds.

**CORS in Docker**  
All browser traffic flows through nginx on port 80 — frontend and API share the same origin (`http://localhost`). `CLIENT_URL=http://localhost` is set in compose to match.

**SPA routing via nginx**  
`try_files $uri $uri/ /index.html` catches all non-asset paths and returns `index.html` so React Router handles client-side navigation correctly.
