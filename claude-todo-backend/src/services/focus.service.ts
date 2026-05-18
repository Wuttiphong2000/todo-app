import { nanoid } from "nanoid";
import { db } from "../db/database.js";
import type { FocusSession, FocusStats, StartFocusDto, EndFocusDto } from "../types/index.js";

interface FocusRow {
  id: string;
  user_id: string;
  todo_id: string | null;
  duration: number;
  completed: number;
  started_at: string;
  ended_at: string | null;
}

function toSession(row: FocusRow): FocusSession {
  return {
    id: row.id,
    todoId: row.todo_id,
    duration: row.duration,
    completed: row.completed === 1,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

class FocusService {
  start(userId: string, dto: StartFocusDto): FocusSession {
    const id = nanoid();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO focus_sessions (id, user_id, todo_id, duration, completed, started_at) VALUES (?, ?, ?, ?, 0, ?)"
    ).run(id, userId, dto.todoId ?? null, dto.duration, now);
    return { id, todoId: dto.todoId ?? null, duration: dto.duration, completed: false, startedAt: now, endedAt: null };
  }

  end(userId: string, id: string, dto: EndFocusDto): FocusSession | undefined {
    const row = db
      .prepare("SELECT * FROM focus_sessions WHERE id = ? AND user_id = ?")
      .get(id, userId) as FocusRow | undefined;
    if (!row) return undefined;
    const now = new Date().toISOString();
    db.prepare("UPDATE focus_sessions SET completed = ?, ended_at = ? WHERE id = ?")
      .run(dto.completed ? 1 : 0, now, id);
    return { ...toSession(row), completed: dto.completed, endedAt: now };
  }

  getStats(userId: string): FocusStats {
    const today = new Date().toISOString().slice(0, 10) + "T00:00:00";
    const weekAgo = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10) + "T00:00:00";

    const todayRow = db.prepare(`
      SELECT COALESCE(SUM(duration), 0) AS secs, COUNT(*) AS cnt
      FROM focus_sessions
      WHERE user_id = ? AND completed = 1 AND started_at >= ?
    `).get(userId, today) as { secs: number; cnt: number };

    const weekRow = db.prepare(`
      SELECT COALESCE(SUM(duration), 0) AS secs
      FROM focus_sessions
      WHERE user_id = ? AND completed = 1 AND started_at >= ?
    `).get(userId, weekAgo) as { secs: number };

    return {
      todayMinutes: Math.floor(todayRow.secs / 60),
      todaySessions: todayRow.cnt,
      weekMinutes: Math.floor(weekRow.secs / 60),
    };
  }

  getHistory(userId: string): FocusSession[] {
    const rows = db
      .prepare("SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 20")
      .all(userId) as FocusRow[];
    return rows.map(toSession);
  }
}

export const focusService = new FocusService();
