import { nanoid } from "nanoid";
import { pool } from "../db/database.js";
import type { FocusSession, FocusStats, StartFocusDto, EndFocusDto } from "../types/index.js";

interface FocusRow {
  id: string;
  user_id: string;
  todo_id: string | null;
  duration: number;
  completed: boolean;
  started_at: string;
  ended_at: string | null;
}

function toSession(row: FocusRow): FocusSession {
  return {
    id: row.id,
    todoId: row.todo_id,
    duration: row.duration,
    completed: row.completed,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

class FocusService {
  async start(userId: string, dto: StartFocusDto): Promise<FocusSession> {
    const id = nanoid();
    const now = new Date().toISOString();
    await pool.query(
      "INSERT INTO focus_sessions (id, user_id, todo_id, duration, completed, started_at) VALUES ($1, $2, $3, $4, FALSE, $5)",
      [id, userId, dto.todoId ?? null, dto.duration, now]
    );
    return { id, todoId: dto.todoId ?? null, duration: dto.duration, completed: false, startedAt: now, endedAt: null };
  }

  async end(userId: string, id: string, dto: EndFocusDto): Promise<FocusSession | undefined> {
    const { rows } = await pool.query<FocusRow>(
      "SELECT * FROM focus_sessions WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (rows.length === 0) return undefined;

    const now = new Date().toISOString();
    await pool.query(
      "UPDATE focus_sessions SET completed = $1, ended_at = $2 WHERE id = $3",
      [dto.completed, now, id]
    );
    return { ...toSession(rows[0]), completed: dto.completed, endedAt: now };
  }

  async getStats(userId: string): Promise<FocusStats> {
    const today = new Date().toISOString().slice(0, 10) + "T00:00:00";
    const weekAgo = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10) + "T00:00:00";

    const [{ rows: [todayRow] }, { rows: [weekRow] }] = await Promise.all([
      pool.query<{ secs: string; cnt: string }>(
        `SELECT COALESCE(SUM(duration), 0) AS secs, COUNT(*) AS cnt
         FROM focus_sessions
         WHERE user_id = $1 AND completed = TRUE AND started_at >= $2`,
        [userId, today]
      ),
      pool.query<{ secs: string }>(
        `SELECT COALESCE(SUM(duration), 0) AS secs
         FROM focus_sessions
         WHERE user_id = $1 AND completed = TRUE AND started_at >= $2`,
        [userId, weekAgo]
      ),
    ]);

    return {
      todayMinutes: Math.floor(Number(todayRow.secs) / 60),
      todaySessions: Number(todayRow.cnt),
      weekMinutes: Math.floor(Number(weekRow.secs) / 60),
    };
  }

  async getHistory(userId: string): Promise<FocusSession[]> {
    const { rows } = await pool.query<FocusRow>(
      "SELECT * FROM focus_sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 20",
      [userId]
    );
    return rows.map(toSession);
  }
}

export const focusService = new FocusService();
