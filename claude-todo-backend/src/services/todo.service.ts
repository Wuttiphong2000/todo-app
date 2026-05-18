import { nanoid } from "nanoid";
import { pool, withTransaction } from "../db/database.js";
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
  completed: boolean;
  created_at: string;
}

interface TagLinkRow {
  todo_id: string;
  tag_id: string;
}

function toSubTask(r: SubtaskRow): SubTask {
  return { id: r.id, title: r.title, completed: r.completed, createdAt: r.created_at };
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

async function hydrate(rows: TodoRow[]): Promise<Todo[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const ph = ids.map((_, i) => `$${i + 1}`).join(", ");

  const [{ rows: tagLinks }, { rows: subtaskRows }] = await Promise.all([
    pool.query<TagLinkRow>(`SELECT todo_id, tag_id FROM todo_tags WHERE todo_id IN (${ph})`, ids),
    pool.query<SubtaskRow>(
      `SELECT * FROM subtasks WHERE todo_id IN (${ph}) ORDER BY created_at ASC`,
      ids
    ),
  ]);

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
      for (let i = 0; i < 14; i++) {
        const candidate = new Date(pivot);
        candidate.setDate(pivot.getDate() + i);
        if (sorted.includes(candidate.getDay())) return candidate.toISOString().slice(0, 10);
      }
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
  async findAll(userId: string, query: TodoQueryParams = {}): Promise<Todo[]> {
    const params: unknown[] = [userId];
    const conds = ["t.user_id = $1"];

    if (query.status)   { params.push(query.status);   conds.push(`status = $${params.length}`); }
    if (query.priority) { params.push(query.priority); conds.push(`priority = $${params.length}`); }
    if (query.tagId) {
      params.push(query.tagId);
      conds.push(`EXISTS (SELECT 1 FROM todo_tags tt WHERE tt.todo_id = t.id AND tt.tag_id = $${params.length})`);
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      const p1 = params.length;
      params.push(`%${query.search}%`);
      conds.push(`(t.title ILIKE $${p1} OR t.description ILIKE $${params.length})`);
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

    const { rows } = await pool.query<TodoRow>(
      `SELECT t.* FROM todos t ${where} ORDER BY ${col} ${dir}`,
      params
    );
    return hydrate(rows);
  }

  async findById(userId: string, id: string): Promise<Todo | undefined> {
    const { rows } = await pool.query<TodoRow>(
      "SELECT * FROM todos WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (rows.length === 0) return undefined;
    return (await hydrate(rows))[0];
  }

  async create(userId: string, dto: CreateTodoDto): Promise<Todo> {
    const id = nanoid();
    const now = new Date().toISOString();
    const recurrenceJson = dto.recurrence ? JSON.stringify(dto.recurrence) : null;

    return withTransaction(async (client) => {
      const { rows: [orderRow] } = await client.query<{ n: string }>(
        "SELECT COALESCE(MAX(order_index), -1) + 1 AS n FROM todos WHERE user_id = $1",
        [userId]
      );
      const order = Number(orderRow.n);

      await client.query(
        `INSERT INTO todos (id, user_id, title, description, status, priority, due_date, recurrence, order_index, created_at, updated_at, completed_at)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $9, NULL)`,
        [id, userId, dto.title, dto.description ?? null, dto.priority ?? "medium",
         dto.dueDate ?? null, recurrenceJson, order, now]
      );

      const subtasks: SubTask[] = [];
      for (const s of dto.subtasks ?? []) {
        const sid = nanoid();
        await client.query(
          "INSERT INTO subtasks (id, todo_id, title, completed, created_at) VALUES ($1, $2, $3, FALSE, $4)",
          [sid, id, s.title, now]
        );
        subtasks.push({ id: sid, title: s.title, completed: false, createdAt: now });
      }

      for (const tagId of dto.tagIds ?? []) {
        await client.query(
          "INSERT INTO todo_tags (todo_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [id, tagId]
        );
      }

      return {
        id, title: dto.title, description: dto.description ?? null,
        status: "pending", priority: dto.priority ?? "medium",
        tagIds: dto.tagIds ?? [], subtasks,
        dueDate: dto.dueDate ?? null, recurrence: dto.recurrence ?? null,
        order, createdAt: now, updatedAt: now, completedAt: null,
      };
    });
  }

  async update(userId: string, id: string, dto: UpdateTodoDto): Promise<Todo | undefined> {
    const { rows } = await pool.query(
      "SELECT id FROM todos WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (rows.length === 0) return undefined;

    const now = new Date().toISOString();

    await withTransaction(async (client) => {
      const vals: unknown[] = [now];
      const sets = ["updated_at = $1"];

      if (dto.title !== undefined)       { vals.push(dto.title);       sets.push(`title = $${vals.length}`); }
      if (dto.description !== undefined) { vals.push(dto.description); sets.push(`description = $${vals.length}`); }
      if (dto.priority !== undefined)    { vals.push(dto.priority);    sets.push(`priority = $${vals.length}`); }
      if (dto.dueDate !== undefined)     { vals.push(dto.dueDate);     sets.push(`due_date = $${vals.length}`); }
      if (dto.order !== undefined)       { vals.push(dto.order);       sets.push(`order_index = $${vals.length}`); }
      if (dto.recurrence !== undefined) {
        vals.push(dto.recurrence ? JSON.stringify(dto.recurrence) : null);
        sets.push(`recurrence = $${vals.length}`);
      }

      vals.push(id);
      await client.query(`UPDATE todos SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);

      if (dto.tagIds !== undefined) {
        await client.query("DELETE FROM todo_tags WHERE todo_id = $1", [id]);
        for (const tagId of dto.tagIds) {
          await client.query(
            "INSERT INTO todo_tags (todo_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [id, tagId]
          );
        }
      }

      if (dto.subtasks !== undefined) {
        await client.query("DELETE FROM subtasks WHERE todo_id = $1", [id]);
        for (const s of dto.subtasks) {
          await client.query(
            "INSERT INTO subtasks (id, todo_id, title, completed, created_at) VALUES ($1, $2, $3, $4, $5)",
            [s.id, id, s.title, s.completed, s.createdAt]
          );
        }
      }
    });

    return this.findById(userId, id);
  }

  async patchStatus(
    userId: string,
    id: string,
    dto: PatchStatusDto
  ): Promise<{ todo: Todo; nextOccurrence?: Todo } | undefined> {
    const { rows } = await pool.query<TodoRow>(
      "SELECT * FROM todos WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (rows.length === 0) return undefined;

    const now = new Date().toISOString();
    const completedAt = dto.status === "done" ? now : null;
    await pool.query(
      "UPDATE todos SET status = $1, completed_at = $2, updated_at = $3 WHERE id = $4",
      [dto.status, completedAt, now, id]
    );

    const todo = (await this.findById(userId, id))!;

    if (dto.status === "done" && todo.recurrence) {
      const nextDue = nextDueDate(todo.recurrence, todo.dueDate);
      const nextTodo = await this.create(userId, {
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

  async reorder(userId: string, dto: ReorderDto): Promise<void> {
    const now = new Date().toISOString();
    await withTransaction(async (client) => {
      for (const item of dto.items) {
        await client.query(
          "UPDATE todos SET order_index = $1, updated_at = $2 WHERE id = $3 AND user_id = $4",
          [item.order, now, item.id, userId]
        );
      }
    });
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      "DELETE FROM todos WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  }
}

export const todoService = new TodoService();
