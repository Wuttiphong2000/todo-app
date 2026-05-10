import { nanoid } from "nanoid";
import { db } from "../db/database.js";
import { AppError } from "../middlewares/error.middleware.js";
import type { Tag, CreateTagDto, UpdateTagDto } from "../types/index.js";

// ── Row Type ──────────────────────────────────────────────────────────────────

interface TagRow {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

class TagService {
  findAll(): Tag[] {
    return (
      db
        .prepare("SELECT * FROM tags ORDER BY created_at ASC")
        .all() as TagRow[]
    ).map(toTag);
  }

  findById(id: string): Tag | undefined {
    const row = db
      .prepare("SELECT * FROM tags WHERE id = ?")
      .get(id) as TagRow | undefined;
    return row ? toTag(row) : undefined;
  }

  create(dto: CreateTagDto): Tag {
    const id = nanoid();
    const createdAt = new Date().toISOString();
    try {
      db.prepare(
        "INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)"
      ).run(id, dto.name, dto.color, createdAt);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new AppError(409, "TAG_ALREADY_EXISTS", `Tag name "${dto.name}" already exists`);
      }
      throw err;
    }
    return { id, name: dto.name, color: dto.color, createdAt };
  }

  update(id: string, dto: UpdateTagDto): Tag | undefined {
    const exists = db.prepare("SELECT id FROM tags WHERE id = ?").get(id);
    if (!exists) return undefined;

    const sets: string[] = [];
    const vals: unknown[] = [];

    if (dto.name !== undefined)  { sets.push("name = ?");  vals.push(dto.name); }
    if (dto.color !== undefined) { sets.push("color = ?"); vals.push(dto.color); }

    if (sets.length > 0) {
      db.prepare(`UPDATE tags SET ${sets.join(", ")} WHERE id = ?`).run(
        ...[...vals, id]
      );
    }

    return this.findById(id);
  }

  delete(id: string): boolean {
    // ON DELETE CASCADE ใน todo_tags จัดการ cleanup อัตโนมัติ
    const result = db.prepare("DELETE FROM tags WHERE id = ?").run(id);
    return result.changes > 0;
  }
}

export const tagService = new TagService();
