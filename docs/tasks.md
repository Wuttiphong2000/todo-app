# Tasks

## Phase 1 — Project Setup

- [x] Initialize Express + TypeScript backend
- [x] Initialize React + Vite + TypeScript frontend
- [x] Setup Tailwind CSS with custom dark theme
- [x] Setup project documentation (CLAUDE.md, architecture.md, tasks.md)

---

## Phase 2 — Backend API

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

## Phase 3 — Database

- [x] Migrate storage from file-based JSON (db.json) to SQLite (better-sqlite3)
- [x] Create `DatabaseService` singleton with PRAGMA foreign_keys + WAL mode
- [x] Create migration system with version tracking (`schema_migrations` table)
- [x] Schema: `todos`, `tags`, `subtasks`, `todo_tags` tables
- [x] Foreign key constraints with `ON DELETE CASCADE`
- [x] Indexes on status, priority, order_index, todo_id

---

## Phase 4 — Frontend Foundation

- [x] Axios API client with base URL and error interceptor (`api/client.ts`)
- [x] Todo and Tag API modules (`api/todo.api.ts`, `api/tag.api.ts`)
- [x] Zustand store with all todo and tag actions (`store/todo.store.ts`)
- [x] Optimistic status update with rollback on error
- [x] localStorage cache hook (`hooks/useLocalSync.ts`)
- [x] React Router v6 routing (/, /add, /edit/:id)
- [x] Utility functions: `formatDate`, `isOverdue`, `cn`, label/class maps

---

## Phase 5 — UI Components & Pages

- [x] Navbar with logo and navigation links
- [x] TodoCard — status toggle, priority/status badges, tag chips, subtask progress, overdue warning
- [x] TodoForm — title, description, priority, due date, tag multi-select, inline tag creator, subtasks
- [x] FilterBar — search, status filter, priority filter, sort selector
- [x] ConfirmDialog — portal modal with backdrop dismiss and Escape key support
- [x] HomePage — stats cards (Total / In Progress / Done / Overdue), todo list, empty states
- [x] AddTodoPage — create form with error banner and redirect on success
- [x] EditTodoPage — edit form with delete button and not-found state

---

## Phase 6 — UI Enhancements

- [x] Drag-and-drop reorder UI — `SortableTodoCard` with `@dnd-kit/core`, grip handle, optimistic reorder
- [x] Fix 400 error on PUT /api/todos/:id — `TodoForm` was stripping subtasks to `{ title }` in edit mode; now sends full `SubTask[]`
- [x] Fix GET /api/todos?status= 400 — FilterBar was sending empty string; changed to `undefined`
- [x] Add React Router v7 future flags (`v7_relativeSplatPath`, `v7_startTransition`)
- [ ] Tag management page (edit tag name/color, see usage count)
- [ ] Import UI (counterpart to existing export endpoint)
- [ ] Unit and integration tests for backend services
- [ ] Light theme toggle

---

## Phase 7 — Docker & Deployment

- [x] Backend multi-stage Dockerfile — builder (tsc + npm prune) → alpine runner with non-root user
- [x] Frontend multi-stage Dockerfile — Vite build → nginx:1.27-alpine static server
- [x] nginx.conf — reverse proxy `/api/` → backend container, SPA fallback for React Router
- [x] docker-compose.yml — backend + frontend services, named volume for SQLite persistence
- [x] `.dockerignore` for both services
- [x] Fix `.gitignore` — add `todo.db*` exclusion patterns
- [x] Fix `tag.service.ts` — use `err.code === "SQLITE_CONSTRAINT_UNIQUE"` instead of string matching
- [ ] Add `docker-compose.override.yml` for local dev bind-mounts (hot reload without rebuild)
- [ ] CI/CD pipeline (GitHub Actions — build + push image on main push)
- [ ] Production nginx with SSL (Let's Encrypt / Certbot)
