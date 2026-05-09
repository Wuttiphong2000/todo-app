import { nanoid } from "nanoid";
import { storageService } from "./storage.service.js";
import type {
  Todo,
  CreateTodoDto,
  UpdateTodoDto,
  PatchStatusDto,
  ReorderDto,
  TodoQueryParams,
  SubTask,
} from "../types/index.js";
 
const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
 
class TodoService {
  // ── Helpers ───────────────────────────────────────────────────────────────
 
  private now(): string {
    return new Date().toISOString();
  }
 
  private getNextOrder(todos: Todo[]): number {
    if (todos.length === 0) return 0;
    return Math.max(...todos.map((t) => t.order)) + 1;
  }
 
  // ── CRUD ──────────────────────────────────────────────────────────────────
 
  findAll(query: TodoQueryParams = {}): Todo[] {
    const db = storageService.getDb();
    let todos = db.todos;
 
    // ── Filter ──
    if (query.status) {
      todos = todos.filter((t) => t.status === query.status);
    }
    if (query.priority) {
      todos = todos.filter((t) => t.priority === query.priority);
    }
    if (query.tagId) {
      todos = todos.filter((t) => t.tagIds.includes(query.tagId!));
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      todos = todos.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false)
      );
    }
 
    // ── Sort ──
    const sortBy = query.sortBy ?? "order";
    const sortDir = query.sortDir ?? "asc";
 
    todos.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "priority") {
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      } else if (sortBy === "dueDate") {
        const da = a.dueDate ?? "9999-12-31";
        const db = b.dueDate ?? "9999-12-31";
        cmp = da.localeCompare(db);
      } else {
        const va = String(a[sortBy as keyof Todo] ?? "");
        const vb = String(b[sortBy as keyof Todo] ?? "");
        cmp = va.localeCompare(vb);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
 
    return todos;
  }
 
  findById(id: string): Todo | undefined {
    const db = storageService.getDb();
    return db.todos.find((t) => t.id === id);
  }
 
  create(dto: CreateTodoDto): Todo {
    const db = storageService.getDb();
 
    const now = this.now();
    const subtasks: SubTask[] = (dto.subtasks ?? []).map((s) => ({
      id: nanoid(),
      title: s.title,
      completed: false,
      createdAt: now,
    }));
 
    const todo: Todo = {
      id: nanoid(),
      title: dto.title,
      description: dto.description ?? null,
      status: "pending",
      priority: dto.priority ?? "medium",
      tagIds: dto.tagIds ?? [],
      subtasks,
      dueDate: dto.dueDate ?? null,
      order: this.getNextOrder(db.todos),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
 
    db.todos.push(todo);
    storageService.save(db);
    return todo;
  }
 
  update(id: string, dto: UpdateTodoDto): Todo | undefined {
    const db = storageService.getDb();
    const index = db.todos.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
 
    const existing = db.todos[index];
    const now = this.now();
 
    const updated: Todo = {
      ...existing,
      ...dto,
      id: existing.id,       // ป้องกัน id ถูกเปลี่ยน
      createdAt: existing.createdAt,
      updatedAt: now,
      // completedAt ไม่ถูก update ที่นี่ — ใช้ patchStatus แทน
      completedAt: existing.completedAt,
    };
 
    db.todos[index] = updated;
    storageService.save(db);
    return updated;
  }
 
  patchStatus(id: string, dto: PatchStatusDto): Todo | undefined {
    const db = storageService.getDb();
    const index = db.todos.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
 
    const now = this.now();
    const existing = db.todos[index];
 
    db.todos[index] = {
      ...existing,
      status: dto.status,
      updatedAt: now,
      completedAt:
        dto.status === "done"
          ? now
          : dto.status === "pending" || dto.status === "in_progress"
          ? null
          : existing.completedAt,
    };
 
    storageService.save(db);
    return db.todos[index];
  }
 
  reorder(dto: ReorderDto): void {
    const db = storageService.getDb();
    const orderMap = new Map(dto.items.map((i) => [i.id, i.order]));
 
    db.todos = db.todos.map((t) => {
      const newOrder = orderMap.get(t.id);
      if (newOrder === undefined) return t;
      return { ...t, order: newOrder, updatedAt: this.now() };
    });
 
    storageService.save(db);
  }
 
  delete(id: string): boolean {
    const db = storageService.getDb();
    const before = db.todos.length;
    db.todos = db.todos.filter((t) => t.id !== id);
    if (db.todos.length === before) return false;
    storageService.save(db);
    return true;
  }
}
 
export const todoService = new TodoService();
 