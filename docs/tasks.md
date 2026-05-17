# Tasks

> Phases 1–7 are complete and running. Phases 8+ are the remaining roadmap, ordered by value vs complexity.
> Feature selection based on competitive analysis of Todoist, TickTick, Habitica, and Linear (May 2026).

---

## Phase 1 — Project Setup ✅

- [x] Initialize Express + TypeScript backend
- [x] Initialize React + Vite + TypeScript frontend
- [x] Setup Tailwind CSS with custom dark theme
- [x] Setup project documentation (CLAUDE.md, architecture.md, tasks.md)

---

## Phase 2 — Backend API ✅

- [x] Define TypeScript types and DTOs (`src/types/index.ts`)
- [x] Setup Express routes for todos and tags
- [x] Implement Todo CRUD API (GET, POST, PUT, PATCH status, DELETE)
- [x] Implement Todo reorder API (PATCH /api/todos/reorder)
- [x] Implement Tag CRUD API
- [x] Zod validation middleware
- [x] Global error handler + 404 middleware
- [x] Export endpoint (GET /api/export)
- [x] CORS setup for Vite dev server

---

## Phase 3 — Database ✅

- [x] Migrate storage from file-based JSON (db.json) to SQLite (better-sqlite3)
- [x] Create `DatabaseService` singleton with PRAGMA foreign_keys + WAL mode
- [x] Create migration system with version tracking (`schema_migrations` table)
- [x] Schema: `todos`, `tags`, `subtasks`, `todo_tags` tables
- [x] Foreign key constraints with `ON DELETE CASCADE`
- [x] Indexes on status, priority, order_index, todo_id

---

## Phase 4 — Frontend Foundation ✅

- [x] Axios API client with base URL and error interceptor (`api/client.ts`)
- [x] Todo and Tag API modules (`api/todo.api.ts`, `api/tag.api.ts`)
- [x] Zustand store with all todo and tag actions (`store/todo.store.ts`)
- [x] Optimistic status update with rollback on error
- [x] localStorage cache hook (`hooks/useLocalSync.ts`)
- [x] React Router v6 routing (/, /add, /edit/:id)
- [x] Utility functions: `formatDate`, `isOverdue`, `cn`, label/class maps

---

## Phase 5 — UI Components & Pages ✅

- [x] Navbar with logo and navigation links
- [x] TodoCard — status toggle, priority/status badges, tag chips, subtask progress, overdue warning
- [x] TodoForm — title, description, priority, due date, tag multi-select, inline tag creator, subtasks
- [x] FilterBar — search, status filter, priority filter, sort selector
- [x] ConfirmDialog — portal modal with backdrop dismiss and Escape key support
- [x] HomePage — stats cards (Total / In Progress / Done / Overdue), todo list, empty states
- [x] AddTodoPage — create form with error banner and redirect on success
- [x] EditTodoPage — edit form with delete button and not-found state

---

## Phase 6 — DnD & Bug Fixes ✅

- [x] Drag-and-drop reorder UI — `SortableTodoCard` with `@dnd-kit/core`, grip handle, optimistic reorder
- [x] Fix 400 error on PUT /api/todos/:id — `TodoForm` was stripping subtasks to `{ title }` in edit mode
- [x] Fix GET /api/todos?status= 400 — FilterBar was sending empty string; changed to `undefined`
- [x] Add React Router v7 future flags (`v7_relativeSplatPath`, `v7_startTransition`)

---

## Phase 7 — Docker & Deployment ✅

- [x] Backend multi-stage Dockerfile — builder (tsc + npm prune) → alpine runner with non-root user
- [x] Frontend multi-stage Dockerfile — Vite build → nginx:1.27-alpine static server
- [x] nginx.conf — reverse proxy `/api/` → backend container, SPA fallback for React Router
- [x] docker-compose.yml — backend + frontend services, named volume for SQLite persistence
- [x] `.dockerignore` for both services
- [x] Fix `.gitignore` — add `todo.db*` exclusion patterns
- [x] Fix `tag.service.ts` — use `err.code === "SQLITE_CONSTRAINT_UNIQUE"` instead of string matching

---

## Phase 8 — Accessibility & UX Fixes (in progress)

> Findings from UI/UX guideline audit. CRITICAL items block Phase 9+.

### CRITICAL

- [ ] **Form labels** — add `htmlFor` + `id` on all inputs in `TodoForm` (title, description, due date, subtask input, tag name input)
- [ ] **Touch targets** — checkbox `w-5 h-5` (20px), Edit/Delete buttons `w-7 h-7` (28px), color picker dots `w-5 h-5` (20px) — all below 44×44px minimum
- [ ] **Mobile action buttons** — Edit/Delete use `opacity-0 group-hover:opacity-100`; invisible on touch devices; need always-visible fallback on mobile
- [ ] **ConfirmDialog ARIA** — add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title `id`
- [ ] **Emoji → SVG icons** — replace `⚠` (overdue), `✓` (tag selected), `✕` (delete subtask) with proper SVG; add `aria-label` to delete subtask button

### HIGH

- [ ] **`transition-all` → specific properties** — `.btn-primary`, `.btn-ghost`, `.btn-danger` in `index.css`; replace with `transition-[background-color,border-color,opacity,transform]`
- [ ] **`color-scheme: dark`** — add to `html` element in `index.css`; add `<meta name="color-scheme" content="dark">` in `index.html` (fixes date picker and scrollbar on Windows)
- [ ] **Edit button → `<Link>`** — `TodoCard` uses `onClick={() => navigate(...)}` which breaks Cmd+click; replace with `<Link to={...}>`
- [ ] **URL reflects filter state** — `HomePage` stores filters in `useState`; sync to query params so filters survive refresh and can be shared
- [ ] **SVG `aria-hidden`** — add `aria-hidden="true"` to all decorative SVGs inside buttons that already have `aria-label`

### MEDIUM

- [ ] **`<meta name="theme-color">`** — add `content="#13161d"` to `index.html` (browser chrome colour on mobile)
- [ ] **Input `autocomplete` + `name`** — add to all form inputs in `TodoForm`
- [ ] **Font preload** — add `<link rel="preload" as="font">` for Syne (primary display font) to reduce FOUT

---

## Phase 9 — Tag Management & Import/Export UI

> Backend APIs already exist — this is purely frontend work.

- [ ] **Tag management page** (`/tags`) — list all tags with usage count badge, rename tag inline, change color via color picker, delete with confirm dialog
- [ ] **Update tag in store** — add `updateTag(id, dto)` action to `todo.store.ts`; call `PUT /api/tags/:id`
- [ ] **Add `/tags` route** in React Router and Navbar link
- [ ] **Import UI** — add file input button in HomePage or Navbar; reads JSON file (same shape as export); calls `POST /api/import`
- [ ] **Backend import endpoint** — `POST /api/import` parses full JSON backup and upserts todos, tags, subtasks, todo_tags in a transaction; validate with Zod

---

## Phase 10 — Theme & Polish

- [ ] **Light theme toggle** — Tailwind `darkMode: 'class'`; add `ThemeProvider` context; toggle button in Navbar; persist choice in `localStorage`
- [ ] **Switch `dark:` variants** — audit `index.css` and all components; add `dark:` prefix to dark-only colours; define light palette tokens
- [ ] **Transition polish** — replace all `transition-all` with specific property lists in `index.css`
- [ ] **Meta tags** — add `<meta name="color-scheme" content="dark light">` and `<meta name="theme-color">` to `index.html`
- [ ] **Font preload** — add `<link rel="preload" as="font">` for Syne in `index.html`

---

## Phase 11 — Recurring Tasks

> One of the most-requested features in Todoist, TickTick, and Microsoft To Do.

### Backend

- [ ] **Migration v2** — `ALTER TABLE todos ADD COLUMN recurrence TEXT` (JSON string or NULL)
- [ ] **Recurrence types** — support `daily`, `weekly` (specific days), `monthly` (day of month), `custom` (interval in days)
- [ ] **Zod schema** — add optional `recurrence` field to `CreateTodoDto` and `UpdateTodoDto`
- [ ] **Recurrence expand service** — when a recurring todo is marked `done`, auto-create the next occurrence with reset status and new `due_date`
- [ ] **GET /api/todos** — optionally expand upcoming recurring instances into response

### Frontend

- [ ] **RecurrenceSelector component** — dropdown with None / Daily / Weekly / Monthly / Custom; weekly shows day-of-week checkboxes
- [ ] **Wire to TodoForm** — add RecurrenceSelector below due date field
- [ ] **TodoCard badge** — show repeat icon (SVG) when task has recurrence
- [ ] **Update types** — add `recurrence` field to `Todo` interface in both backend and frontend `types/index.ts`

---

## Phase 12 — Focus Mode & Pomodoro Timer

> TickTick's built-in Pomodoro is a major differentiator. Focus To-Do has 4.8★ on the App Store.

### Backend

- [ ] **Migration v4** — create `focus_sessions` table (id, todo_id, duration, completed, started_at, ended_at)
- [ ] **Focus routes** — `POST /api/focus/sessions` (start), `PATCH /api/focus/sessions/:id` (end/cancel), `GET /api/focus/stats` (today's total focus minutes)

### Frontend

- [ ] **FocusPage** (`/focus`) — full-screen timer with circular progress ring; task picker dropdown; session history list
- [ ] **PomodoroTimer component** — countdown display (MM:SS), start/pause/reset controls, configurable duration (25/15/5 min presets + custom)
- [ ] **usePomodoro hook** — manages `setInterval`, pause/resume, completion callback (fires `POST /api/focus/sessions`)
- [ ] **Focus stats card** — add "Focus Today" card to HomePage stats row (total minutes focused)
- [ ] **Navbar link** — add Focus icon link to `/focus`

---

## Phase 13 — Enhanced Dashboard & Statistics

> Todoist's productivity stats and Any.do's weekly overview are frequently praised in reviews.

- [ ] **Completion trend chart** — bar chart of todos completed per day (last 7 days) using a lightweight charting lib (recharts or Chart.js)
- [ ] **Priority breakdown** — donut chart: low / medium / high task counts
- [ ] **Overdue aging** — list of todos that are overdue with how many days overdue
- [ ] **Streak counter** — calculate current consecutive days with at least 1 todo completed; display in HomePage header
- [ ] **Export stats** — include stats snapshot in the JSON export payload

---

## Phase 14 — Habit Tracker

> TickTick habit tracking and Habitica gamification are the top differentiators in the todo app market.

### Backend

- [ ] **Migration v3** — create `habits` and `habit_logs` tables (see architecture.md for DDL)
- [ ] **Habit routes** — `GET /api/habits`, `POST /api/habits`, `PUT /api/habits/:id`, `DELETE /api/habits/:id`, `POST /api/habits/:id/log` (check-in today), `DELETE /api/habits/:id/log/:date` (undo)
- [ ] **Streak calculation** — `HabitService.getStreak(id)` counts consecutive days with a log entry going backwards from today

### Frontend

- [ ] **HabitsPage** (`/habits`) — list all habits; each row shows today's check-in button, current streak, and last 7-day completion dots
- [ ] **HabitCard component** — title, color dot, streak badge (🔥 N days), 7-day mini calendar row, check-in toggle button
- [ ] **AddHabitModal** — inline modal with title, color picker, frequency (daily/weekly), target days selector
- [ ] **habit.store.ts** — Zustand store for habits + actions (fetchHabits, createHabit, logHabit, deleteHabit)
- [ ] **Navbar link** — add Habits icon link to `/habits`

---

## Phase 15 — Calendar View

> TickTick's calendar integration is its most-praised feature over Todoist.

### Frontend only (todos already have due_date)

- [ ] **CalendarPage** (`/calendar`) — monthly grid view; each day cell shows dot indicators for todos due that day; clicking a day opens a side panel with that day's todos
- [ ] **CalendarGrid component** — generates 5–6 week rows for a month; highlights today; prev/next month navigation
- [ ] **CalendarDayPanel component** — slides in from right; lists todos for selected date with inline status toggle
- [ ] **Week view toggle** — button to switch between Month and Week (7-column agenda) layouts
- [ ] **Navbar link** — add Calendar icon link to `/calendar`

---

## Phase 16 — Filter URL Sync & Keyboard Shortcuts

> Linear's URL-based filter state is widely praised for shareability.

- [ ] **URL query params** — sync HomePage filters (status, priority, sort, search) to `?status=&priority=&sort=&q=` using `useSearchParams`; filters survive refresh and can be bookmarked
- [ ] **Keyboard shortcuts** — `N` → new todo, `/` → focus search, `Escape` → clear search / close modal, `?` → show shortcuts cheat sheet overlay
- [ ] **ShortcutsDialog component** — modal listing all keyboard shortcuts, triggered by `?` key

---

## Phase 17 — DevOps & CI/CD

- [ ] **`docker-compose.override.yml`** — bind-mount `src/` in both services for hot reload without rebuild
- [ ] **GitHub Actions CI** — `npm ci && npm run build && npm run lint` on every PR; fail fast
- [ ] **GitHub Actions CD** — on push to `main`: build Docker images, push to GHCR, SSH deploy (or Docker Swarm update)
- [ ] **Production nginx with SSL** — Let's Encrypt / Certbot auto-renewal; redirect HTTP → HTTPS
- [ ] **Health check endpoints** — backend `/health` already exists; add frontend nginx healthcheck in docker-compose

---

## Phase 18 — Testing

> No tests currently exist. Recommended stack: vitest (frontend) + jest + supertest (backend).

- [ ] **Backend integration tests** — `jest` + `supertest` hitting a real in-memory SQLite; test routes for Todo CRUD, Tag CRUD, reorder, export
- [ ] **Frontend unit tests** — `vitest` + React Testing Library; test Zustand store actions, TodoCard rendering, FilterBar state
- [ ] **E2E tests** — Playwright: create todo → edit → reorder → delete happy path; filter by status happy path
