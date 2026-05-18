# Tasks

> Phases 1–14 are complete and running. Phase 15+ is the remaining roadmap, ordered by value vs complexity.
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

## Phase 8 — Auth & Responsive ✅

> JWT authentication with 2 hardcoded users (no registration). Todos are shared between both users.
> See `architecture.md → Authentication` for full detail.

### Authentication (Backend)

- [x] Install `bcryptjs` + `jsonwebtoken` (+ `@types/` for both)
- [x] `src/config/users.ts` — 2 hardcoded users with bcrypt-hashed passwords (rounds=12); `JWT_SECRET` constant
- [x] `POST /api/auth/login` — verify username + bcrypt.compareSync → return JWT (30-day expiry)
- [x] `GET /api/auth/me` — verify Bearer token → return current user object
- [x] `src/middlewares/auth.middleware.ts` — `requireAuth` middleware, attaches `req.user` on valid JWT
- [x] Apply `requireAuth` to all protected routes: `/api/todos`, `/api/tags`, `/api/export`
- [x] `/api/auth/*` and `/health` remain public (no token required)

### Authentication (Frontend)

- [x] `src/store/auth.store.ts` — Zustand store: `login()`, `logout()`, `hydrate()` (reads token from localStorage on boot)
- [x] `src/pages/LoginPage.tsx` — login form with show/hide password toggle; redirects to `/` on success
- [x] `src/components/ProtectedRoute.tsx` — redirects to `/login` if no token in store
- [x] `src/api/client.ts` — request interceptor auto-attaches `Authorization: Bearer <token>`; 401 response clears auth and redirects to `/login`
- [x] `src/App.tsx` — `/login` route is public; all other routes wrapped in `<ProtectedRoute>`
- [x] Navbar — user badge (shows current username) + logout button (clears token + cache)

### Responsive

- [x] Added `xs: 420px` custom Tailwind breakpoint in `tailwind.config.js`
- [x] TodoCard action buttons — always visible on mobile (`opacity-100`), hover-only on desktop (`sm:opacity-0 sm:group-hover:opacity-100`); button size `w-9 h-9` on mobile, `sm:w-7 sm:h-7` on desktop
- [x] TodoCard Edit button changed from `onClick → navigate()` to `<Link to={...}>` (fixes Cmd+click)
- [x] FilterBar — restructured with `flex-wrap`; search full-width on its own row; status + selects on second row
- [x] TodoForm — priority + due date grid changed to `grid-cols-1 sm:grid-cols-2` (stacks on mobile)
- [x] AddTodoPage / EditTodoPage — card padding `p-4 sm:p-6`
- [x] Navbar — icon-only on mobile (`sm:hidden` / `hidden sm:inline`), username badge hidden on mobile, compact height `h-14 sm:h-16`

---

## Phase 8a — Auth Security & Code Quality ✅

> Findings from code review of Phase 8 (commit `26207ed`). Fix security issues before adding new features.
> Severity ratings: CRITICAL = must fix before any deployment · HIGH = fix before next merge · MEDIUM = fix this phase · LOW = cleanup

### CRITICAL

- [x] **JWT_SECRET ต้อง required** — แก้ `claude-todo-backend/src/config/users.ts:21` จาก `?? "fallback-string"` เป็น throw Error ตอน module load ถ้าไม่ set env var; อัปเดต `docker-compose.yml` ให้ inject `JWT_SECRET=<random-256-bit>` ด้วย

### HIGH

- [x] **`hydrate()` ตรวจ token expiry** — ใน `auth.store.ts:25-36` decode JWT payload (parse base64 middle segment) แล้วเทียบ `exp * 1000` กับ `Date.now()`; ถ้า expired ให้ clear localStorage แทนที่จะ `set({ token, user })`
- [x] **Refactor `/api/auth/me` ให้ใช้ `requireAuth` middleware** — `auth.routes.ts:41-58` copy-paste logic ซ้ำกับ `auth.middleware.ts`; แทนที่ด้วย `router.get("/me", requireAuth, (req, res) => { ... })` แล้วอ่าน user จาก `req.user`
- [x] **ลบ `console.log` จาก `app.ts`** — `app.ts:63-66` มี 4 console.log ใน `app.listen`; แทนที่ด้วย structured logger (`pino`) หรือลบออก ตาม project coding rules

### MEDIUM

- [x] **แก้ double navigation ใน `LoginPage`** — `LoginPage.tsx` navigate ซ้ำกัน 2 ที่ (`handleSubmit:20` และ `useEffect:15`); เลือกทางเดียว — ให้ `useEffect` เป็น primary (handles page-refresh case) แล้วลบ navigate ใน `handleSubmit`
- [x] **เพิ่ม missing `useEffect` deps** — `LoginPage.tsx:15` ขาด `navigate`; `App.tsx:33` ขาด `hydrate`; เพิ่มให้ครบเพื่อผ่าน `exhaustive-deps` ESLint rule
- [x] **แก้ unsafe type cast ใน `auth.store.ts`** — ใช้ `ApiResponse<{ token; user }>` + `res.data.data!` แทน `as unknown as`; แก้ bug จริงที่ login เคย set `token = undefined`
- [x] **Rate limit `/api/auth/login`** — ติดตั้ง `express-rate-limit`; เพิ่ม limiter (max 10 req / 15 min per IP) บน `POST /api/auth/login` ก่อน Zod validate middleware

### LOW

- [x] **แยก user `id` ออกจาก `username`** — `config/users.ts` ทั้ง 2 users มี `id === username`; เปลี่ยน `id` เป็น opaque nanoid string เพื่อรองรับกรณีที่ username เปลี่ยนในอนาคต

---

## Phase 8b — Per-User Data Isolation ✅

> Each logged-in user now sees only their own todos and tags. Migration v2 adds `user_id` columns and recreates the tags table with a per-user UNIQUE constraint.

- [x] **Migration v2** — recreate `tags` table with `UNIQUE(user_id, name)` (was global `UNIQUE(name)`); `ALTER TABLE todos ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`; add indexes `idx_tags_user`, `idx_todos_user`
- [x] **`TodoService`** — all methods (`findAll`, `findById`, `create`, `update`, `patchStatus`, `reorder`, `delete`) accept `userId` as first param; all SQL queries filter or insert with `user_id`
- [x] **`TagService`** — same pattern; `create` inserts with `user_id`; UNIQUE conflict is per-user
- [x] **Controllers** — `todo.controller.ts` and `tag.controller.ts` pass `req.user!.id` to all service calls
- [x] **Export/Import** — `GET /api/export` scoped to current user; `POST /api/import` assigns `user_id` to all imported todos and tags
- [x] **Dev script fix** — install `dotenv`, `import "dotenv/config"` in `app.ts`, script changed to `tsx watch src/app.ts` (Windows-compatible)

> **Gotcha:** Migration v2 makes existing rows invisible (user_id = ''). Delete `todo.db` and start fresh after upgrading.

---

## Phase 9 — Accessibility & UX Fixes ✅

> Findings from UI/UX guideline audit. Some items already fixed in Phase 8.

### CRITICAL

- [x] **Form labels** — added `htmlFor` + `id` on all inputs in `TodoForm`; subtask and tag name inputs use `sr-only` labels
- [x] **Touch targets** — checkbox uses `-m-[10px] p-[10px]` trick (40px touch area); color picker buttons expanded to 32px visual via fixed `width/height`
- [x] **Mobile action buttons** — fixed in Phase 8 (always visible on mobile)
- [x] **ConfirmDialog ARIA** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby` all present
- [x] **Emoji → SVG icons** — `✓` tag selected → SVG check; `✕` delete subtask → SVG ×; `⚠` overdue was already SVG; `🔍`/`✅` in EmptyState → SVGs; emoji removed from priority `<select>` options

### HIGH

- [x] **`transition-all` → specific properties** — `.btn-primary` → `background-color, transform`; `.btn-ghost` → `background-color, color, transform`; `.btn-danger` → `background-color, border-color, transform`; `.input-base` → `border-color, box-shadow`; inline buttons in `TodoForm` use explicit `transitionProperty` style
- [x] **`color-scheme: dark`** — added to `html` in `index.css`; `<meta name="color-scheme" content="dark">` added to `index.html`
- [x] **Edit button → `<Link>`** — fixed in Phase 8 (`TodoCard` now uses `<Link to={...}>`)
- [x] **URL reflects filter state** — `HomePage` now uses `useSearchParams`; status/priority/sort/q sync to URL; filters survive refresh and are bookmarkable
- [x] **SVG `aria-hidden`** — added to all decorative SVGs (delete button, search icon, overdue warning, EmptyState icons)

### MEDIUM

- [x] **`<meta name="theme-color">`** — added `content="#13161d"` to `index.html`
- [x] **Input `autocomplete` + `name`** — added to all form inputs in `TodoForm` (title, description, due-date, subtask, tag-name)
- [x] **Font preload** — added `<link rel="preload" as="font">` for Syne in `index.html`

---

## Phase 10 — Tag Management & Import/Export UI ✅

- [x] **Tag management page** (`/tags`) — lists all tags with usage count, inline rename + color picker, delete with ConfirmDialog
- [x] **Update tag in store** — `updateTag(id, dto)` action added to `todo.store.ts`; calls `tagApi.update()` → `PUT /api/tags/:id`
- [x] **Add `/tags` route** — wired in `App.tsx` (ProtectedRoute) + Tags nav link in `Navbar` (icon on mobile, text on desktop)
- [x] **Import UI** — upload icon button in `Navbar`; reads JSON backup file, validates shape, calls `POST /api/import`; shows alert on success/error; navigates to `/` after import
- [x] **Backend import endpoint** — `POST /api/import` with Zod `importSchema`; upserts tags, todos, subtasks, todo_tags in a single `db.transaction()`; protected by `requireAuth`

---

## Phase 11 — Theme & Polish ✅

- [x] **Light theme toggle** — `darkMode: 'class'` in tailwind.config.js; `ThemeProvider` context in `src/context/theme.tsx`; sun/moon toggle button in Navbar; persists in localStorage as `doable-theme`
- [x] **Switch `dark:` variants** — surface palette 900–500 converted to CSS variables (`rgb(var(--X) / <alpha>)` format for opacity support); `index.css` defines `:root` (light) and `html.dark` (dark) values; badge, button, input classes updated with `dark:` variants in `@apply`; global `html:not(.dark)` overrides remap `text-slate-100/200/300` and accent colors without touching components
- [x] **Transition polish** — specific `transition-property` lists on `.btn-*` and `.input-base` (done in Phase 9, maintained)
- [x] **Anti-FOUC** — inline script in `index.html` reads localStorage and adds `dark` class before React hydrates; default is dark
- [x] **Meta tags** — `<meta name="color-scheme" content="dark light">` updated; `theme-color` updated dynamically by `ThemeProvider`
- [x] **Font preload** — done in Phase 9, maintained

---

## Phase 12 — Recurring Tasks ✅

> One of the most-requested features in Todoist, TickTick, and Microsoft To Do.

### Backend

- [x] **Migration v3** — `ALTER TABLE todos ADD COLUMN recurrence TEXT` (JSON string or NULL)
- [x] **Recurrence types** — support `daily`, `weekly` (specific days), `monthly` (day of month), `custom` (interval in days)
- [x] **Zod schema** — `recurrenceSchema` discriminated union; added optional `recurrence` field to `createTodoSchema`, `updateTodoSchema`, and `importSchema`
- [x] **Recurrence expand service** — when a recurring todo is marked `done`, auto-create the next occurrence with reset status and new `due_date`; returned in `meta.nextOccurrence`

### Frontend

- [x] **RecurrenceSelector component** — None / Daily / Weekly / Monthly / Custom buttons; weekly shows day-of-week toggles; custom shows interval number input
- [x] **Wire to TodoForm** — RecurrenceSelector added below due date field; `recurrence` included in submit payload
- [x] **TodoCard badge** — violet repeat icon badge when task has recurrence
- [x] **Update types** — `Recurrence`, `RecurrenceType` added to both backend and frontend `types/index.ts`; `recurrence` field added to `Todo`, `CreateTodoDto`, `UpdateTodoDto`; `meta.nextOccurrence` added to `ApiResponse`
- [x] **Store** — `patchStatus` appends `meta.nextOccurrence` to todos list when present

---

## Phase 13 — Focus Mode & Pomodoro Timer ✅

> TickTick's built-in Pomodoro is a major differentiator. Focus To-Do has 4.8★ on the App Store.

### Backend

- [x] **Migration v4** — `focus_sessions` table (id, user_id, todo_id, duration, completed, started_at, ended_at); indexes on user_id and started_at
- [x] **Focus routes** — `POST /api/focus/sessions` (start), `PATCH /api/focus/sessions/:id` (end/cancel), `GET /api/focus/stats`, `GET /api/focus/sessions` (history); all protected by `requireAuth`
- [x] **FocusService** — `start`, `end`, `getStats` (today + week minutes/sessions), `getHistory` (last 20)

### Frontend

- [x] **FocusPage** (`/focus`) — circular SVG progress ring with smooth CSS transition; 5/15/25 min presets + custom input; optional task picker; pause/resume/stop controls; session history sidebar
- [x] **usePomodoro hook** — `setInterval` countdown, pause/resume/done states, auto-completes session on timer reaching 0, guards against double-end with `endingRef`
- [x] **Document title** — shows `🍅 MM:SS` while running, `⏸ MM:SS` while paused
- [x] **Focus stats card** — "Focus วันนี้" card added to HomePage stats row (violet, shows minutes)
- [x] **Navbar link** — stopwatch SVG icon on mobile, "Focus" text on desktop

---

## Phase 14 — Enhanced Dashboard & Statistics ✅

> Todoist's productivity stats and Any.do's weekly overview are frequently praised in reviews.

- [x] **Completion trend chart** — pure SVG bar chart (no external lib); last 7 days; today highlighted in amber, past days in violet; count label above each bar
- [x] **Priority breakdown** — pure SVG donut chart; three segments (high/medium/low) with stroke-dasharray positioning; legend with counts below
- [x] **Overdue aging** — list of overdue active todos with `Nd overdue` badge; each row links to edit page
- [x] **Streak counter** — consecutive days with ≥1 completion (grace period: yesterday counts if today is empty); flame icon badge in HomePage header; prominent card on StatsPage
- [x] **Export stats** — `GET /api/export` now includes `stats` snapshot alongside todos and tags
- [x] **StatsPage** (`/stats`) — summary cards (streak, completed, active) + charts + overdue list; Stats nav link (bar-chart icon) added to Navbar

---

## Phase 15 — Habit Tracker ✅

> TickTick habit tracking and Habitica gamification are the top differentiators in the todo app market.

### Backend

- [x] **Migration v5** — `habits` and `habit_logs` tables with user-scoped UNIQUE constraint on `(habit_id, date)`
- [x] **Habit routes** — `GET /api/habits`, `POST /api/habits`, `PUT /api/habits/:id`, `DELETE /api/habits/:id`, `POST /api/habits/:id/log` (check-in today), `DELETE /api/habits/:id/log/:date` (undo); all protected by `requireAuth`
- [x] **Streak calculation** — `HabitService.calcStreak()` counts consecutive days with a log entry; grace period handles today/yesterday

### Frontend

- [x] **HabitsPage** (`/habits`) — list all habits; each row shows today's check-in button, current streak, and last 7-day completion dots
- [x] **HabitCard component** — title, color dot, streak badge (N days), 7-day mini calendar row, check-in toggle button
- [x] **AddHabitModal** — inline modal with title, color picker, frequency (daily/weekly), target days selector
- [x] **habit.store.ts** — Zustand store for habits + actions (fetchHabits, createHabit, updateHabit, logHabit, unlogHabit, deleteHabit)
- [x] **Navbar link** — Habits icon link to `/habits`

---

## Phase 16 — Calendar View ✅

> TickTick's calendar integration is its most-praised feature over Todoist.

### Frontend only (todos already have due_date)

- [x] **CalendarPage** (`/calendar`) — monthly grid view; each day cell shows dot indicators for todos due that day; clicking a day opens a side panel with that day's todos
- [x] **CalendarGrid component** — generates 5–6 week rows for a month; highlights today; prev/next month navigation; week view shows todo title pills in each cell
- [x] **CalendarDayPanel component** — slides in from right on desktop, stacks below on mobile; lists todos for selected date with inline status toggle and edit link
- [x] **Week view toggle** — segmented control to switch between Month and Week (7-column agenda) layouts
- [x] **Navbar link** — Calendar icon link to `/calendar` added after Habits

---

## Phase 17 — Filter URL Sync & Keyboard Shortcuts ✅

> Linear's URL-based filter state is widely praised for shareability.

- [x] **URL query params** — done in Phase 9; `useSearchParams` in HomePage syncs status/priority/sort/q to URL
- [x] **Keyboard shortcuts** — `N` → new task, `/` → focus search, `Escape` → clear search & blur, `?` → show shortcuts dialog; handled in `useKeyboardShortcuts` hook mounted globally in AppShell
- [x] **ShortcutsDialog component** — portal modal listing all shortcuts; triggered by `?`, closed by Escape or backdrop click

---

## Phase 18 — DevOps & CI/CD ✅

- [x] **`docker-compose.override.yml`** — bind-mount `claude-todo-backend/src/` + tsx watch for hot reload; dev DB isolated to `todo-dev.db`
- [x] **GitHub Actions CI** — `.github/workflows/ci.yml`; backend + frontend jobs run lint + build in parallel on every PR/push
- [x] **GitHub Actions CD** — `.github/workflows/cd.yml`; builds & pushes to GHCR on `main`, then SSH deploys via `appleboy/ssh-action`; requires `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH` secrets
- [x] **Production nginx with SSL** — deferred; use Caddy or Traefik in front of the compose stack for auto-TLS (out of scope for this repo)
- [x] **Health check endpoints** — backend `/health` already existed; frontend nginx healthcheck added to `docker-compose.yml`
- [x] **`JWT_SECRET` env var** — already enforced via `${JWT_SECRET}` in `docker-compose.yml`; throws at startup if unset

---

## Phase 19 — Testing ✅

- [x] **Backend integration tests** — Jest + supertest + ts-jest; in-memory SQLite (`:memory:`); 21 tests across auth (400/401/200), Todo CRUD chain, Tag CRUD + duplicate-name 409
- [x] **Frontend unit tests** — Vitest + React Testing Library + jsdom; 10 tests: auth store (logout, hydrate expired/valid), ProtectedRoute (redirect/render), TodoCard (title, priority badge, subtask progress)
- [ ] **E2E tests** — deferred; requires running servers (Playwright setup out of scope for this repo)

---

## Phase 19b — Railway Deployment ✅

> Deploy ขึ้น Railway แบบ monorepo — 2 services แยกกัน (backend + frontend)

- [x] `claude-todo-backend/railway.toml` — Builder: DOCKERFILE, healthcheck `/health`, restart ON_FAILURE
- [x] `claude-todo-frontend-ts/railway.toml` — Builder: DOCKERFILE, healthcheck `/`, restart ON_FAILURE
- [x] `claude-todo-frontend-ts/nginx.conf.template` — ใช้ envsubst แทน static nginx.conf; `${PORT}` สำหรับ listen, `${BACKEND_URL}` สำหรับ proxy_pass; `proxy_ssl_server_name on` สำหรับ HTTPS backend; SPA fallback
- [x] Frontend `Dockerfile` — เปลี่ยนจาก `COPY nginx.conf` เป็น `COPY nginx.conf.template /etc/nginx/templates/default.conf.template`
- [x] Backend `Dockerfile` — ลบ `VOLUME ["/data"]` (Railway ไม่รองรับ VOLUME directive)
- [x] `docker-compose.yml` — เพิ่ม `PORT: "80"` และ `BACKEND_URL: "http://backend:3000"` ใน frontend environment
- [x] `app.ts` — เพิ่ม `app.set("trust proxy", 1)` สำหรับ Railway reverse proxy (express-rate-limit X-Forwarded-For)
- [x] Favicon — `to-do-list.png` เพิ่มใน `public/` และ link ใน `index.html`

> **Railway settings ที่ต้อง set ด้วยมือ:** Builder=Dockerfile, Root Directory ต่อ service, env vars (JWT_SECRET, CLIENT_URL, BACKEND_URL)
> **Volume:** สร้างผ่าน Railway dashboard → mount ที่ `/data` ใน backend service

---

## Phase 20 — Guest Mode (localStorage-only) ✅

> ให้ผู้เยี่ยมชมทดลองใช้แอปได้โดยไม่ต้อง login — ข้อมูลทั้งหมดเก็บใน localStorage เครื่องตัวเองเท่านั้น ไม่มีการส่งข้อมูลขึ้น server

### Auth Store ✅

- [x] เพิ่ม `isGuest: boolean` flag ใน `auth.store.ts`
- [x] เพิ่ม `loginAsGuest()` action — set `isGuest = true`, set fake user `{ id: "guest", username: "Guest" }`, persist ใน localStorage key `auth_guest`
- [x] `hydrate()` — restore guest session จาก `auth_guest` key (ถ้ามี)
- [x] `logout()` — clear guest session และ `guest_todos` / `guest_tags` / `guest_habits` localStorage keys ด้วย

### Todo & Tag Store (Guest branching) ✅

- [x] `todo.store.ts` — ทุก action ตรวจ `useAuthStore.getState().isGuest` ก่อน
  - ถ้า guest: อ่าน/เขียน `guest_todos` / `guest_tags` ใน localStorage โดยตรง (ไม่เรียก API)
  - ถ้า logged in: ทำงานเหมือนเดิม (เรียก API)
- [x] Guest CRUD ใช้ `nanoid()` จาก frontend สร้าง id, timestamps จาก `new Date().toISOString()`

### Habit Store (Guest branching) ✅

- [x] `habit.store.ts` — same pattern: ถ้า guest เขียน/อ่านจาก `guest_habits` ใน localStorage

### LoginPage ✅

- [x] เพิ่มปุ่ม "ใช้งานในฐานะ Guest" ใต้ login form
- [x] คลิก → เรียก `loginAsGuest()` → navigate ไป `/`

### GuestBanner Component ✅

- [x] `src/components/GuestBanner.tsx` — sticky banner แสดงเมื่อ `isGuest`
- [x] ข้อความ: "Guest Mode — ข้อมูลเก็บในเครื่องนี้เท่านั้น ล้าง browser data = ข้อมูลหาย"
- [x] ปุ่ม "Export" (download localStorage data เป็น JSON) และ "Login" (redirect ไป `/login`)
- [x] เพิ่มใน `App.tsx` ด้านบน router outlet

### Pages — Guest Restrictions ✅

- [x] `FocusPage` — แสดง "Login เพื่อใช้ Focus Timer" เมื่อ guest (Focus ต้องบันทึก session บน server)
- [x] `StatsPage` — แสดง "Login เพื่อดู Statistics" เมื่อ guest
- [x] หน้าอื่น (Home, Add, Edit, Tags, Habits, Calendar) — ทำงานได้ปกติในฐานะ guest

### Guest Analytics Tracking ✅

- [x] **Migration v6** — `guest_sessions (id, started_at)` table + index
- [x] **`analyticsService`** — `recordGuestVisit()` (INSERT), `getDashboardStats()` (total + last 30 days count)
- [x] **`POST /api/analytics/guest-visit`** — public endpoint, fire-and-forget จาก frontend
- [x] **`GET /api/analytics/dashboard`** — protected endpoint, จำกัดเฉพาะ `username === "wskt"`; returns `{ registeredUsers, guestVisitsTotal, guestVisitsLast30Days }`
- [x] **`analyticsApi.ts`** — frontend API module สำหรับ `recordGuestVisit()`
- [x] `loginAsGuest()` — เรียก `analyticsApi.recordGuestVisit()` แบบ fire-and-forget ตอน guest login

### Bug Fixes ✅

- [x] `ProtectedRoute` — แก้ให้ผ่าน route ได้ถ้า `isGuest === true` (ก่อนหน้า block เพราะไม่มี token)
- [x] `App.tsx` — เพิ่ม module-level `useAuthStore.getState().hydrate()` แก้ race condition (useLocalSync fetchTodos ทำงานก่อน hydrate ตั้ง isGuest)
- [x] `client.ts` — Axios 401 interceptor ข้ามการ redirect ไป `/login` ถ้า `auth_guest === "true"` ใน localStorage

### Known Bug 🐛 (ต้องแก้รอบหน้า)

- [ ] **Guest mode ยัง auto-redirect / refresh วนลูปไปหน้า login** — fixes ที่ทำไปยังไม่หายขาด; ต้องสืบต่อว่า trigger มาจากไหน
  - สิ่งที่น่าสงสัย: `useLocalSync` hook อาจเรียก API ในบาง code path ก่อน `isGuest` พร้อม; double `hydrate()` call (module-level + `useEffect`); หรือมี navigate/redirect อื่นที่ยังไม่ได้แก้
  - วิธีสืบ: เปิด browser DevTools → Network tab ดู request ที่ return 401; Console tab ดู error; React DevTools ดู re-render ของ `ProtectedRoute`
  - ไฟล์ที่ต้องดู: `src/hooks/useLocalSync.ts`, `src/store/auth.store.ts` (hydrate), `src/components/ProtectedRoute.tsx`, `src/App.tsx`

---

## Phase 21 — Analytics Dashboard 🔜

> Dashboard สำหรับ wskt user เท่านั้น — แสดงข้อมูล usage ของแอป

### Backend (พร้อมแล้ว)

- [x] `GET /api/analytics/dashboard` — endpoint พร้อม, คืน `{ registeredUsers, guestVisitsTotal, guestVisitsLast30Days }`

### Frontend (ยังไม่ได้ทำ)

- [ ] **`/dashboard` route** — เพิ่มใน `App.tsx`; ProtectedRoute + ตรวจ `user.username === "wskt"` ถ้าไม่ใช่ redirect ไป `/`
- [ ] **`DashboardPage`** — เรียก `GET /api/analytics/dashboard`; แสดง stats cards (registered users, guest visits total, guest visits last 30 days)
- [ ] **Navbar link** — แสดงลิงก์ Dashboard เฉพาะเมื่อ `user.username === "wskt"`
