// src/types/index.ts

export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "in_progress" | "done";

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
}

export interface UpdateTodoDto {
  title?: string;
  description?: string | null;
  priority?: Priority;
  tagIds?: string[];
  dueDate?: string | null;
  subtasks?: SubTask[];
  order?: number;
}

export interface CreateTagDto {
  name: string;
  color: string;
}

export interface TodoQueryParams {
  status?: Status;
  priority?: Priority;
  tagId?: string;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "dueDate" | "priority" | "order";
  sortDir?: "asc" | "desc";
}

// ─── API Response ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { total?: number };
}