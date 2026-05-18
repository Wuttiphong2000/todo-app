// src/types/index.ts

export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "in_progress" | "done";
export type RecurrenceType = "daily" | "weekly" | "monthly" | "custom";

export interface Recurrence {
  type: RecurrenceType;
  days?: number[];    // weekly: day indices 0=Sun … 6=Sat
  interval?: number;  // custom: days between occurrences
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  tagIds: string[];
  subtasks: SubTask[];
  dueDate: string | null;
  recurrence: Recurrence | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// ─── DTOs ──────────────────────────────────────────────────────────────────

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

export interface CreateTagDto {
  name: string;
  color: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

export interface TodoQueryParams {
  status?: Status;
  priority?: Priority;
  tagId?: string;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "dueDate" | "priority" | "order";
  sortDir?: "asc" | "desc";
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface TrendPoint {
  date: string;
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

// ─── Focus / Pomodoro ────────────────────────────────────────────────────────

export interface FocusSession {
  id: string;
  todoId: string | null;
  duration: number;
  completed: boolean;
  startedAt: string;
  endedAt: string | null;
}

export interface FocusStats {
  todayMinutes: number;
  todaySessions: number;
  weekMinutes: number;
}

// ─── Habits ─────────────────────────────────────────────────────────────────

export type HabitFrequency = "daily" | "weekly";

export interface Habit {
  id: string;
  title: string;
  color: string;
  frequency: HabitFrequency;
  targetDays: number[];    // 0=Sun … 6=Sat; empty = every day for daily
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

// ─── API Response ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { total?: number; nextOccurrence?: Todo };
}
