import { nanoid } from "nanoid";
import { pool } from "../db/database.js";
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
  async findAll(userId: string): Promise<Tag[]> {
    const { rows } = await pool.query<TagRow>(
      "SELECT * FROM tags WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );
    return rows.map(toTag);
  }

  async findById(userId: string, id: string): Promise<Tag | undefined> {
    const { rows } = await pool.query<TagRow>(
      "SELECT * FROM tags WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return rows[0] ? toTag(rows[0]) : undefined;
  }

  async create(userId: string, dto: CreateTagDto): Promise<Tag> {
    const id = nanoid();
    const createdAt = new Date().toISOString();
    try {
      await pool.query(
        "INSERT INTO tags (id, user_id, name, color, created_at) VALUES ($1, $2, $3, $4, $5)",
        [id, userId, dto.name, dto.color, createdAt]
      );
    } catch (err: unknown) {
      if ((err as { code?: string }).code === "23505") {
        throw new AppError(409, "TAG_ALREADY_EXISTS", `Tag name "${dto.name}" already exists`);
      }
      throw err;
    }
    return { id, name: dto.name, color: dto.color, createdAt };
  }

  async update(userId: string, id: string, dto: UpdateTagDto): Promise<Tag | undefined> {
    const { rows } = await pool.query(
      "SELECT id FROM tags WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (rows.length === 0) return undefined;

    const sets: string[] = [];
    const vals: unknown[] = [];

    if (dto.name !== undefined)  { vals.push(dto.name);  sets.push(`name = $${vals.length}`); }
    if (dto.color !== undefined) { vals.push(dto.color); sets.push(`color = $${vals.length}`); }

    if (sets.length > 0) {
      vals.push(id);
      await pool.query(`UPDATE tags SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
    }

    return this.findById(userId, id);
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      "DELETE FROM tags WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  }
}

export const tagService = new TagService();
