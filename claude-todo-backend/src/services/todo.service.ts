import { nanoid } from "nanoid";
import { db } from "../db/database.js";
import type {
  Todo,
  SubTask,
  Recurrence,
  CreateTodoDto,
  UpdateTodoDto,
  PatchStatusDto,
  ReorderDto,
  TodoQueryParams,
} from "../types/index.js";

interface TodoRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  recurrence: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface SubtaskRow {
  id: string;
  todo_id: string;
  title: string;
  completed: number;
  created_at: string;
}

interface TagLinkRow {
  todo_id: string;
  tag_id: string;
}

function toSubTask(r: SubtaskRow): SubTask {
  return { id: r.id, title: r.title, completed: r.completed === 1, createdAt: r.created_at };
}

function parseRecurrence(raw: string | null): Recurrence | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as Recurrence; } catch { return null; }
}

function toTodo(row: TodoRow, tagIds: string[], subtasks: SubTask[]): Todo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as Todo["status"],
    priority: row.priority as Todo["priority"],
    tagIds,
    subtasks,
    dueDate: row.due_date,
    recurrence: parseRecurrence(row.recurrence),
    order: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function hydrate(rows: TodoRow[]): Todo[] {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const ph = ids.map(() => "?").join(",");

  const tagLinks = db
    .prepare(`SELECT todo_id, tag_id FROM todo_tags WHERE todo_id IN (${ph})`)
    .all(...ids) as TagLinkRow[];

  const subtaskRows = db
    .prepare(`SELECT * FROM subtasks WHERE todo_id IN (${ph}) ORDER BY created_at ASC`)
    .all(...ids) as SubtaskRow[];

  const tagMap = new Map<string, string[]>();
  for (const r of tagLinks) {
    if (!tagMap.has(r.todo_id)) tagMap.set(r.todo_id, []);
    tagMap.get(r.todo_id)!.push(r.tag_id);
  }

  const subMap = new Map<string, SubTask[]>();
  for (const r of subtaskRows) {
    if (!subMap.has(r.todo_id)) subMap.set(r.todo_id, []);
    subMap.get(r.todo_id)!.push(toSubTask(r));
  }

  return rows.map((r) => toTodo(r, tagMap.get(r.id) ?? [], subMap.get(r.id) ?? []));
}

function nextDueDate(recurrence: Recurrence, fromDate: string | null): string {
  const base = fromDate ? new Date(fromDate) : new Date();
  // Advance past "today" to avoid same-day duplication
  const pivot = new Date(base);
  pivot.setDate(pivot.getDate() + 1);

  switch (recurrence.type) {
    case "daily":
      return pivot.toISOString().slice(0, 10);

    case "weekly": {
      const days = recurrence.days ?? [];
      if (days.length === 0) {
        pivot.setDate(pivot.getDate() + 7);
        return pivot.toISOString().slice(0, 10);
      }
      const sorted = [...days].sort((a, b) => a - b);
      // Find next matching weekday at or after pivot
      for (let i = 0; i < 14; i++) {
        const candidate = new Date(pivot);
        candidate.setDate(pivot.getDate() + i);
        if (sorted.includes(candidate.getDay())) {
          return candidate.toISOString().slice(0, 10);
        }
      }
      // Fallback: 7 days
      pivot.setDate(pivot.getDate() + 7);
      return pivot.toISOString().slice(0, 10);
    }

    case "monthly": {
      const d = new Date(pivot);
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().slice(0, 10);
    }

    case "custom": {
      const interval = recurrence.interval ?? 1;
      const d = new Date(base);
      d.setDate(d.getDate() + interval);
      return d.toISOString().slice(0, 10);
    }
  }
}

class TodoService {
  private nextOrder(userId: string): number {
    const row = db
      .prepare("SELECT COALESCE(MAX(order_index), -1) + 1 AS n FROM todos WHERE user_id = ?")
      .get(userId) as { n: number };
    return row.n;
  }

  findAll(userId: string, query: TodoQueryParams = {}): Todo[] {
    const conds: string[] = ["t.user_id = ?"];
    const params: unknown[] = [userId];

    if (query.status)   { conds.push("status = ?");    params.push(query.status); }
    if (query.priority) { conds.push("priority = ?");  params.push(query.priority); }
    if (query.tagId) {
      conds.push("EXISTS (SELECT 1 FROM todo_tags tt WHERE tt.todo_id = t.id AND tt.tag_id = ?)");
      params.push(query.tagId);
    }
    if (query.search) {
      conds.push("(t.title LIKE ? OR t.description LIKE ?)");
      params.push(`%${query.search}%`, `%${query.search}%`);
    }

    const where = `WHERE ${conds.join(" AND ")}`;
    const sortCol: Record<string, string> = {
      createdAt: "t.created_at",
      updatedAt: "t.updated_at",
      dueDate:   "t.due_date",
      priority:  "CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END",
      order:     "t.order_index",
    };
    const col = sortCol[query.sortBy ?? "order"] ?? "t.order_index";
    const dir = query.sortDir === "desc" ? "DESC" : "ASC";

    const rows = db
      .prepare(`SELECT t.* FROM todos t ${where} ORDER BY ${col} ${dir}`)
      .all(...params) as TodoRow[];

    return hydrate(rows);
  }

  findById(userId: string, id: string): Todo | undefined {
    const row = db
      .prepare("SELECT * FROM todos WHERE id = ? AND user_id = ?")
      .get(id, userId) as TodoRow | undefined;
    if (!row) return undefined;
    return hydrate([row])[0];
  }

  create(userId: string, dto: CreateTodoDto): Todo {
    const id = nanoid();
    const now = new Date().toISOString();
    const order = this.nextOrder(userId);
    const subtasks: SubTask[] = [];
    const recurrenceJson = dto.recurrence ? JSON.stringify(dto.recurrence) : null;

    db.transaction(() => {
      db.prepare(
        "INSERT INTO todos (id, user_id, title, description, status, priority, due_date, recurrence, order_index, created_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(id, userId, dto.title, dto.description ?? null, "pending", dto.priority ?? "medium", dto.dueDate ?? null, recurrenceJson, order, now, now, null);

      for (const s of dto.subtasks ?? []) {
        const sid = nanoid();
        db.prepare("INSERT INTO subtasks (id, todo_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)").run(sid, id, s.title, 0, now);
        subtasks.push({ id: sid, title: s.title, completed: false, createdAt: now });
      }

      for (const tagId of dto.tagIds ?? []) {
        db.prepare("INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)").run(id, tagId);
      }
    })();

    return {
      id, title: dto.title, description: dto.description ?? null,
      status: "pending", priority: dto.priority ?? "medium",
      tagIds: dto.tagIds ?? [], subtasks,
      dueDate: dto.dueDate ?? null,
      recurrence: dto.recurrence ?? null,
      order, createdAt: now, updatedAt: now, completedAt: null,
    };
  }

  update(userId: string, id: string, dto: UpdateTodoDto): Todo | undefined {
    const exists = db.prepare("SELECT id FROM todos WHERE id = ? AND user_id = ?").get(id, userId);
    if (!exists) return undefined;

    const now = new Date().toISOString();

    db.transaction(() => {
      const sets = ["updated_at = ?"];
      const vals: unknown[] = [now];

      if (dto.title !== undefined)       { sets.push("title = ?");       vals.push(dto.title); }
      if (dto.description !== undefined) { sets.push("description = ?"); vals.push(dto.description); }
      if (dto.priority !== undefined)    { sets.push("priority = ?");    vals.push(dto.priority); }
      if (dto.dueDate !== undefined)     { sets.push("due_date = ?");    vals.push(dto.dueDate); }
      if (dto.order !== undefined)       { sets.push("order_index = ?"); vals.push(dto.order); }
      if (dto.recurrence !== undefined)  {
        sets.push("recurrence = ?");
        vals.push(dto.recurrence ? JSON.stringify(dto.recurrence) : null);
      }

      db.prepare(`UPDATE todos SET ${sets.join(", ")} WHERE id = ?`).run(...vals, id);

      if (dto.tagIds !== undefined) {
        db.prepare("DELETE FROM todo_tags WHERE todo_id = ?").run(id);
        for (const tagId of dto.tagIds) {
          db.prepare("INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)").run(id, tagId);
        }
      }

      if (dto.subtasks !== undefined) {
        db.prepare("DELETE FROM subtasks WHERE todo_id = ?").run(id);
        for (const s of dto.subtasks) {
          db.prepare("INSERT INTO subtasks (id, todo_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)").run(s.id, id, s.title, s.completed ? 1 : 0, s.createdAt);
        }
      }
    })();

    return this.findById(userId, id);
  }

  patchStatus(userId: string, id: string, dto: PatchStatusDto): { todo: Todo; nextOccurrence?: Todo } | undefined {
    const row = db.prepare("SELECT * FROM todos WHERE id = ? AND user_id = ?").get(id, userId) as TodoRow | undefined;
    if (!row) return undefined;

    const now = new Date().toISOString();
    const completedAt = dto.status === "done" ? now : null;
    db.prepare("UPDATE todos SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?").run(dto.status, completedAt, now, id);

    const todo = this.findById(userId, id)!;

    // When marking done with recurrence → spawn next occurrence
    if (dto.status === "done" && todo.recurrence) {
      const nextDue = nextDueDate(todo.recurrence, todo.dueDate);
      const nextTodo = this.create(userId, {
        title: todo.title,
        description: todo.description ?? undefined,
        priority: todo.priority,
        tagIds: todo.tagIds,
        dueDate: nextDue,
        recurrence: todo.recurrence,
        subtasks: todo.subtasks.map((s) => ({ title: s.title })),
      });
      return { todo, nextOccurrence: nextTodo };
    }

    return { todo };
  }

  reorder(userId: string, dto: ReorderDto): void {
    const now = new Date().toISOString();
    const stmt = db.prepare("UPDATE todos SET order_index = ?, updated_at = ? WHERE id = ? AND user_id = ?");
    db.transaction(() => {
      for (const item of dto.items) {
        stmt.run(item.order, now, item.id, userId);
      }
    })();
  }

  delete(userId: string, id: string): boolean {
    const result = db.prepare("DELETE FROM todos WHERE id = ? AND user_id = ?").run(id, userId);
    return result.changes > 0;
  }
}

export const todoService = new TodoService();
