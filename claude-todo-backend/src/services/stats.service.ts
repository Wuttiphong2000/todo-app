import { db } from "../db/database.js";
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
  getStats(userId: string): DashboardStats {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 6 * 864e5).toISOString().slice(0, 10);

    // Completion trend — last 7 days
    const trendRows = db.prepare(`
      SELECT DATE(completed_at) AS day, COUNT(*) AS count
      FROM todos
      WHERE user_id = ? AND completed_at IS NOT NULL AND DATE(completed_at) >= ?
      GROUP BY DATE(completed_at)
    `).all(userId, sevenDaysAgo) as { day: string; count: number }[];

    const trendMap = new Map(trendRows.map((r) => [r.day, r.count]));
    const completionTrend: TrendPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 864e5).toISOString().slice(0, 10);
      completionTrend.push({ date: d, count: trendMap.get(d) ?? 0 });
    }

    // Priority breakdown — active todos only
    const priorityRows = db.prepare(`
      SELECT priority, COUNT(*) AS count
      FROM todos WHERE user_id = ? AND status != 'done'
      GROUP BY priority
    `).all(userId) as { priority: string; count: number }[];

    const pm = new Map(priorityRows.map((r) => [r.priority, r.count]));
    const priorityBreakdown = {
      low: pm.get("low") ?? 0,
      medium: pm.get("medium") ?? 0,
      high: pm.get("high") ?? 0,
    };

    // Overdue list
    const overdueRows = db.prepare(`
      SELECT id, title, due_date
      FROM todos
      WHERE user_id = ? AND status != 'done' AND due_date IS NOT NULL AND due_date < ?
      ORDER BY due_date ASC LIMIT 20
    `).all(userId, today) as { id: string; title: string; due_date: string }[];

    const overdueList = overdueRows.map((r) => ({
      id: r.id,
      title: r.title,
      dueDate: r.due_date,
      daysOverdue: Math.max(1, Math.floor((now.getTime() - new Date(r.due_date + "T12:00:00Z").getTime()) / 864e5)),
    }));

    // Streak
    const dayRows = db.prepare(`
      SELECT DISTINCT DATE(completed_at) AS day
      FROM todos WHERE user_id = ? AND completed_at IS NOT NULL
    `).all(userId) as { day: string }[];
    const completionDays = new Set(dayRows.map((r) => r.day));

    // Totals
    const { total_completed } = db.prepare(
      "SELECT COUNT(*) AS total_completed FROM todos WHERE user_id = ? AND status = 'done'"
    ).get(userId) as { total_completed: number };

    const { total_active } = db.prepare(
      "SELECT COUNT(*) AS total_active FROM todos WHERE user_id = ? AND status != 'done'"
    ).get(userId) as { total_active: number };

    return {
      streak: calculateStreak(completionDays),
      totalCompleted: total_completed,
      totalActive: total_active,
      completionTrend,
      priorityBreakdown,
      overdueList,
    };
  }
}

export const statsService = new StatsService();
