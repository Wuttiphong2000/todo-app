import { nanoid } from "nanoid";
import { db } from "../db/database.js";
import type { Habit, CreateHabitDto, UpdateHabitDto } from "../types/index.js";

interface HabitRow {
  id: string;
  user_id: string;
  title: string;
  color: string;
  frequency: string;
  target_days: string | null;
  created_at: string;
}

function getDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function calcStreak(logDates: Set<string>): number {
  const today = getDateString(0);
  const yesterday = getDateString(1);

  let daysAgo = logDates.has(today) ? 0 : logDates.has(yesterday) ? 1 : -1;
  if (daysAgo === -1) return 0;

  let streak = 0;
  while (logDates.has(getDateString(daysAgo))) {
    streak++;
    daysAgo++;
  }
  return streak;
}

function toHabit(row: HabitRow, logDates: Set<string>): Habit {
  const today = getDateString(0);
  const last7Days = Array.from({ length: 7 }, (_, i) => logDates.has(getDateString(6 - i)));

  return {
    id: row.id,
    title: row.title,
    color: row.color,
    frequency: row.frequency as "daily" | "weekly",
    targetDays: row.target_days ? (JSON.parse(row.target_days) as number[]) : [],
    streak: calcStreak(logDates),
    completedToday: logDates.has(today),
    last7Days,
    createdAt: row.created_at,
  };
}

class HabitService {
  private getLogDates(habitId: string): Set<string> {
    const rows = db
      .prepare("SELECT date FROM habit_logs WHERE habit_id = ?")
      .all(habitId) as { date: string }[];
    return new Set(rows.map((r) => r.date));
  }

  findAll(userId: string): Habit[] {
    const rows = db
      .prepare("SELECT * FROM habits WHERE user_id = ? ORDER BY created_at ASC")
      .all(userId) as HabitRow[];
    return rows.map((row) => toHabit(row, this.getLogDates(row.id)));
  }

  findById(userId: string, id: string): Habit | undefined {
    const row = db
      .prepare("SELECT * FROM habits WHERE id = ? AND user_id = ?")
      .get(id, userId) as HabitRow | undefined;
    if (!row) return undefined;
    return toHabit(row, this.getLogDates(id));
  }

  create(userId: string, dto: CreateHabitDto): Habit {
    const id = nanoid();
    const now = new Date().toISOString();
    const color = dto.color ?? "#6366f1";
    const frequency = dto.frequency ?? "daily";
    const targetDays = dto.targetDays ?? [];

    db.prepare(
      "INSERT INTO habits (id, user_id, title, color, frequency, target_days, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, userId, dto.title, color, frequency, targetDays.length ? JSON.stringify(targetDays) : null, now);

    return toHabit(
      { id, user_id: userId, title: dto.title, color, frequency, target_days: targetDays.length ? JSON.stringify(targetDays) : null, created_at: now },
      new Set()
    );
  }

  update(userId: string, id: string, dto: UpdateHabitDto): Habit | undefined {
    const row = db
      .prepare("SELECT * FROM habits WHERE id = ? AND user_id = ?")
      .get(id, userId) as HabitRow | undefined;
    if (!row) return undefined;

    const title = dto.title ?? row.title;
    const color = dto.color ?? row.color;
    const frequency = dto.frequency ?? row.frequency;
    const targetDays = dto.targetDays !== undefined ? dto.targetDays : (row.target_days ? (JSON.parse(row.target_days) as number[]) : []);
    const target_days = targetDays.length ? JSON.stringify(targetDays) : null;

    db.prepare(
      "UPDATE habits SET title = ?, color = ?, frequency = ?, target_days = ? WHERE id = ?"
    ).run(title, color, frequency, target_days, id);

    return toHabit({ ...row, title, color, frequency, target_days }, this.getLogDates(id));
  }

  delete(userId: string, id: string): boolean {
    const result = db
      .prepare("DELETE FROM habits WHERE id = ? AND user_id = ?")
      .run(id, userId);
    return result.changes > 0;
  }

  log(userId: string, habitId: string, date?: string): Habit | undefined {
    const row = db
      .prepare("SELECT * FROM habits WHERE id = ? AND user_id = ?")
      .get(habitId, userId) as HabitRow | undefined;
    if (!row) return undefined;

    const logDate = date ?? getDateString(0);
    db.prepare(
      "INSERT OR IGNORE INTO habit_logs (id, habit_id, user_id, date, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(nanoid(), habitId, userId, logDate, new Date().toISOString());

    return toHabit(row, this.getLogDates(habitId));
  }

  unlog(userId: string, habitId: string, date: string): Habit | undefined {
    const row = db
      .prepare("SELECT * FROM habits WHERE id = ? AND user_id = ?")
      .get(habitId, userId) as HabitRow | undefined;
    if (!row) return undefined;

    db.prepare("DELETE FROM habit_logs WHERE habit_id = ? AND user_id = ? AND date = ?")
      .run(habitId, userId, date);

    return toHabit(row, this.getLogDates(habitId));
  }
}

export const habitService = new HabitService();
