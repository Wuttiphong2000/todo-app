// ─── Enums / Literals ────────────────────────────────────────────────────────
 
export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "in_progress" | "done";
 
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