import { nanoid } from "nanoid";
import { db } from "../db/database.js";
import { AppError } from "../middlewares/error.middleware.js";
import type { Tag, CreateTagDto, UpdateTagDto } from "../types/index.js";

interface TagRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

function toTag(row: TagRow): Tag {
  return { id: row.id, name: row.name, color: row.color, createdAt: row.created_at };
}

class TagService {
  findAll(userId: string): Tag[] {
    return (
      db.prepare("SELECT * FROM tags WHERE user_id = ? ORDER BY created_at ASC").all(userId) as TagRow[]
    ).map(toTag);
  }

  findById(userId: string, id: string): Tag | undefined {
    const row = db.prepare("SELECT * FROM tags WHERE id = ? AND user_id = ?").get(id, userId) as TagRow | undefined;
    return row ? toTag(row) : undefined;
  }

  create(userId: string, dto: CreateTagDto): Tag {
    const id = nanoid();
    const createdAt = new Date().toISOString();
    try {
      db.prepare("INSERT INTO tags (id, user_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)").run(id, userId, dto.name, dto.color, createdAt);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new AppError(409, "TAG_ALREADY_EXISTS", `Tag name "${dto.name}" already exists`);
      }
      throw err;
    }
    return { id, name: dto.name, color: dto.color, createdAt };
  }

  update(userId: string, id: string, dto: UpdateTagDto): Tag | undefined {
    const exists = db.prepare("SELECT id FROM tags WHERE id = ? AND user_id = ?").get(id, userId);
    if (!exists) return undefined;

    const sets: string[] = [];
    const vals: unknown[] = [];
    if (dto.name !== undefined)  { sets.push("name = ?");  vals.push(dto.name); }
    if (dto.color !== undefined) { sets.push("color = ?"); vals.push(dto.color); }

    if (sets.length > 0) {
      db.prepare(`UPDATE tags SET ${sets.join(", ")} WHERE id = ?`).run(...vals, id);
    }

    return this.findById(userId, id);
  }

  delete(userId: string, id: string): boolean {
    const result = db.prepare("DELETE FROM tags WHERE id = ? AND user_id = ?").run(id, userId);
    return result.changes > 0;
  }
}

export const tagService = new TagService();
