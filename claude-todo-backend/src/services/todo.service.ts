import { nanoid } from "nanoid";
import { db } from "../db/database.js";
import type {
  Todo,
  SubTask,
  CreateTodoDto,
  UpdateTodoDto,
  PatchStatusDto,
  ReorderDto,
  TodoQueryParams,
} from "../types/index.js";

// ── Row Types ─────────────────────────────────────────────────────────────────

interface TodoRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
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

// ── Mappers ───────────────────────────────────────────────────────────────────

function toSubTask(r: SubtaskRow): SubTask {
  return {
    id: r.id,
    title: r.title,
    completed: r.completed === 1,
    createdAt: r.created_at,
  };
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
    order: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

// Batch-fetch tags and subtasks for a list of todo rows in 2 queries
function hydrate(rows: TodoRow[]): Todo[] {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const ph = ids.map(() => "?").join(",");

  const tagLinks = db
    .prepare(`SELECT todo_id, tag_id FROM todo_tags WHERE todo_id IN (${ph})`)
    .all(...ids) as TagLinkRow[];

  const subtaskRows = db
    .prepare(
      `SELECT * FROM subtasks WHERE todo_id IN (${ph}) ORDER BY created_at ASC`
    )
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

  return rows.map((r) =>
    toTodo(r, tagMap.get(r.id) ?? [], subMap.get(r.id) ?? [])
  );
}

// ── Service ───────────────────────────────────────────────────────────────────

class TodoService {
  private nextOrder(): number {
    const row = db
      .prepare("SELECT COALESCE(MAX(order_index), -1) + 1 AS n FROM todos")
      .get() as { n: number };
    return row.n;
  }

  findAll(query: TodoQueryParams = {}): Todo[] {
    const conds: string[] = [];
    const params: unknown[] = [];

    if (query.status) {
      conds.push("status = ?");
      params.push(query.status);
    }
    if (query.priority) {
      conds.push("priority = ?");
      params.push(query.priority);
    }
    if (query.tagId) {
      conds.push(
        "EXISTS (SELECT 1 FROM todo_tags tt WHERE tt.todo_id = t.id AND tt.tag_id = ?)"
      );
      params.push(query.tagId);
    }
    if (query.search) {
      conds.push("(t.title LIKE ? OR t.description LIKE ?)");
      params.push(`%${query.search}%`, `%${query.search}%`);
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const sortCol: Record<string, string> = {
      createdAt: "t.created_at",
      updatedAt: "t.updated_at",
      dueDate: "t.due_date",
      priority:
        "CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END",
      order: "t.order_index",
    };
    const col = sortCol[query.sortBy ?? "order"] ?? "t.order_index";
    const dir = query.sortDir === "desc" ? "DESC" : "ASC";

    const rows = db
      .prepare(`SELECT t.* FROM todos t ${where} ORDER BY ${col} ${dir}`)
      .all(...params) as TodoRow[];

    return hydrate(rows);
  }

  findById(id: string): Todo | undefined {
    const row = db
      .prepare("SELECT * FROM todos WHERE id = ?")
      .get(id) as TodoRow | undefined;
    if (!row) return undefined;
    return hydrate([row])[0];
  }

  create(dto: CreateTodoDto): Todo {
    const id = nanoid();
    const now = new Date().toISOString();
    const order = this.nextOrder();
    const subtasks: SubTask[] = [];

    db.transaction(() => {
      db.prepare(
        "INSERT INTO todos (id, title, description, status, priority, due_date, order_index, created_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(
        id,
        dto.title,
        dto.description ?? null,
        "pending",
        dto.priority ?? "medium",
        dto.dueDate ?? null,
        order,
        now,
        now,
        null
      );

      for (const s of dto.subtasks ?? []) {
        const sid = nanoid();
        db.prepare(
          "INSERT INTO subtasks (id, todo_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)"
        ).run(sid, id, s.title, 0, now);
        subtasks.push({ id: sid, title: s.title, completed: false, createdAt: now });
      }

      for (const tagId of dto.tagIds ?? []) {
        db.prepare(
          "INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)"
        ).run(id, tagId);
      }
    })();

    return {
      id,
      title: dto.title,
      description: dto.description ?? null,
      status: "pending",
      priority: dto.priority ?? "medium",
      tagIds: dto.tagIds ?? [],
      subtasks,
      dueDate: dto.dueDate ?? null,
      order,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
  }

  update(id: string, dto: UpdateTodoDto): Todo | undefined {
    const exists = db
      .prepare("SELECT id FROM todos WHERE id = ?")
      .get(id);
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

      db.prepare(`UPDATE todos SET ${sets.join(", ")} WHERE id = ?`).run(
        ...[...vals, id]
      );

      if (dto.tagIds !== undefined) {
        db.prepare("DELETE FROM todo_tags WHERE todo_id = ?").run(id);
        for (const tagId of dto.tagIds) {
          db.prepare(
            "INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)"
          ).run(id, tagId);
        }
      }

      if (dto.subtasks !== undefined) {
        db.prepare("DELETE FROM subtasks WHERE todo_id = ?").run(id);
        for (const s of dto.subtasks) {
          db.prepare(
            "INSERT INTO subtasks (id, todo_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)"
          ).run(s.id, id, s.title, s.completed ? 1 : 0, s.createdAt);
        }
      }
    })();

    return this.findById(id);
  }

  patchStatus(id: string, dto: PatchStatusDto): Todo | undefined {
    const exists = db
      .prepare("SELECT id FROM todos WHERE id = ?")
      .get(id);
    if (!exists) return undefined;

    const now = new Date().toISOString();
    const completedAt = dto.status === "done" ? now : null;

    db.prepare(
      "UPDATE todos SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?"
    ).run(dto.status, completedAt, now, id);

    return this.findById(id);
  }

  reorder(dto: ReorderDto): void {
    const now = new Date().toISOString();
    const stmt = db.prepare(
      "UPDATE todos SET order_index = ?, updated_at = ? WHERE id = ?"
    );
    db.transaction(() => {
      for (const item of dto.items) {
        stmt.run(item.order, now, item.id);
      }
    })();
  }

  delete(id: string): boolean {
    const result = db.prepare("DELETE FROM todos WHERE id = ?").run(id);
    return result.changes > 0;
  }
}

export const todoService = new TodoService();
