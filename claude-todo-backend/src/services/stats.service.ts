import { pool } from "../db/database.js";
import type { DashboardStats, TrendPoint } from "../types/index.js";

function calculateStreak(completionDays: Set<string>): number {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

  let start: string;
  if (completionDays.has(today)) start = today;
  else if (completionDays.has(yesterday)) start = yesterday;
  else return 0;

  let streak = 0;
  let d = new Date(start + "T12:00:00Z");
  while (completionDays.has(d.toISOString().slice(0, 10))) {
    streak++;
    d = new Date(d.getTime() - 864e5);
  }
  return streak;
}

class StatsService {
  async getStats(userId: string): Promise<DashboardStats> {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 6 * 864e5).toISOString().slice(0, 10);

    const [trendResult, priorityResult, overdueResult, dayResult, completedResult, activeResult] =
      await Promise.all([
        pool.query<{ day: string; count: string }>(
          `SELECT SUBSTRING(completed_at, 1, 10) AS day, COUNT(*) AS count
           FROM todos
           WHERE user_id = $1 AND completed_at IS NOT NULL
             AND SUBSTRING(completed_at, 1, 10) >= $2
           GROUP BY SUBSTRING(completed_at, 1, 10)`,
          [userId, sevenDaysAgo]
        ),
        pool.query<{ priority: string; count: string }>(
          `SELECT priority, COUNT(*) AS count
           FROM todos WHERE user_id = $1 AND status != 'done'
           GROUP BY priority`,
          [userId]
        ),
        pool.query<{ id: string; title: string; due_date: string }>(
          `SELECT id, title, due_date
           FROM todos
           WHERE user_id = $1 AND status != 'done' AND due_date IS NOT NULL AND due_date < $2
           ORDER BY due_date ASC LIMIT 20`,
          [userId, today]
        ),
        pool.query<{ day: string }>(
          `SELECT DISTINCT SUBSTRING(completed_at, 1, 10) AS day
           FROM todos WHERE user_id = $1 AND completed_at IS NOT NULL`,
          [userId]
        ),
        pool.query<{ total_completed: string }>(
          `SELECT COUNT(*) AS total_completed FROM todos WHERE user_id = $1 AND status = 'done'`,
          [userId]
        ),
        pool.query<{ total_active: string }>(
          `SELECT COUNT(*) AS total_active FROM todos WHERE user_id = $1 AND status != 'done'`,
          [userId]
        ),
      ]);

    const trendMap = new Map(trendResult.rows.map((r) => [r.day, Number(r.count)]));
    const completionTrend: TrendPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 864e5).toISOString().slice(0, 10);
      completionTrend.push({ date: d, count: trendMap.get(d) ?? 0 });
    }

    const pm = new Map(priorityResult.rows.map((r) => [r.priority, Number(r.count)]));
    const priorityBreakdown = {
      low: pm.get("low") ?? 0,
      medium: pm.get("medium") ?? 0,
      high: pm.get("high") ?? 0,
    };

    const overdueList = overdueResult.rows.map((r) => ({
      id: r.id,
      title: r.title,
      dueDate: r.due_date,
      daysOverdue: Math.max(1, Math.floor((now.getTime() - new Date(r.due_date + "T12:00:00Z").getTime()) / 864e5)),
    }));

    const completionDays = new Set(dayResult.rows.map((r) => r.day));

    return {
      streak: calculateStreak(completionDays),
      totalCompleted: Number(completedResult.rows[0].total_completed),
      totalActive: Number(activeResult.rows[0].total_active),
      completionTrend,
      priorityBreakdown,
      overdueList,
    };
  }
}

export const statsService = new StatsService();
