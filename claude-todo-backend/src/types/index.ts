// ─── Enums / Literals ────────────────────────────────────────────────────────

export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "in_progress" | "done";
export type RecurrenceType = "daily" | "weekly" | "monthly" | "custom";

export interface Recurrence {
  type: RecurrenceType;
  days?: number[];    // weekly: day indices 0=Sun … 6=Sat
  interval?: number;  // custom: days between occurrences
}

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  color: string; // hex e.g. "#FF5733"
  createdAt: string; // ISO 8601
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string; // ISO 8601
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  tagIds: string[]; // FK → Tag.id
  subtasks: SubTask[];
  dueDate: string | null; // ISO 8601 date (YYYY-MM-DD)
  recurrence: Recurrence | null;
  order: number; // สำหรับ drag-and-drop sort
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  completedAt: string | null; // ISO 8601 — set when status → "done"
}

// ─── Storage Schema (db.json) ─────────────────────────────────────────────────

export interface DbSchema {
  todos: Todo[];
  tags: Tag[];
  version: number; // schema version สำหรับ future migration
}

// ─── DTO (Data Transfer Objects) ─────────────────────────────────────────────

export interface CreateTodoDto {
  title: string;
  description?: string;
  priority?: Priority;
  tagIds?: string[];
  dueDate?: string | null;
  subtasks?: Array<{ title: string }>;
  recurrence?: Recurrence | null;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string | null;
  priority?: Priority;
  tagIds?: string[];
  dueDate?: string | null;
  subtasks?: SubTask[];
  order?: number;
  recurrence?: Recurrence | null;
}

export interface PatchStatusDto {
  status: Status;
}

export interface ReorderDto {
  // array ของ { id, order } ที่ต้องการ update
  items: Array<{ id: string; order: number }>;
}

export interface CreateTagDto {
  name: string;
  color: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface TodoQueryParams {
  status?: Status;
  priority?: Priority;
  tagId?: string;
  search?: string; // search ใน title + description
  sortBy?: "createdAt" | "updatedAt" | "dueDate" | "priority" | "order";
  sortDir?: "asc" | "desc";
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface TrendPoint {
  date: string;  // YYYY-MM-DD
  count: number;
}

export interface DashboardStats {
  streak: number;
  totalCompleted: number;
  totalActive: number;
  completionTrend: TrendPoint[];
  priorityBreakdown: { low: number; medium: number; high: number };
  overdueList: Array<{ id: string; title: string; dueDate: string; daysOverdue: number }>;
}

// ─── Focus / Pomodoro ─────────────────────────────────────────────────────────

export interface FocusSession {
  id: string;
  todoId: string | null;
  duration: number;  // seconds planned
  completed: boolean;
  startedAt: string; // ISO 8601
  endedAt: string | null; // ISO 8601
}

export interface StartFocusDto {
  todoId?: string | null;
  duration: number; // seconds (60–7200)
}

export interface EndFocusDto {
  completed: boolean;
}

export interface FocusStats {
  todayMinutes: number;
  todaySessions: number;
  weekMinutes: number;
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export type HabitFrequency = "daily" | "weekly";

export interface Habit {
  id: string;
  title: string;
  color: string;
  frequency: HabitFrequency;
  targetDays: number[];    // 0=Sun … 6=Sat; empty = every day when daily
  streak: number;
  completedToday: boolean;
  last7Days: boolean[];    // index 0 = 6 days ago, index 6 = today
  createdAt: string;
}

export interface CreateHabitDto {
  title: string;
  color?: string;
  frequency?: HabitFrequency;
  targetDays?: number[];
}

export interface UpdateHabitDto {
  title?: string;
  color?: string;
  frequency?: HabitFrequency;
  targetDays?: number[];
}

// ─── API Response Envelope ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
