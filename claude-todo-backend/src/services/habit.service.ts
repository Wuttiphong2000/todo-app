import { nanoid } from "nanoid";
import { pool } from "../db/database.js";
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

async function getLogDates(habitId: string): Promise<Set<string>> {
  const { rows } = await pool.query<{ date: string }>(
    "SELECT date FROM habit_logs WHERE habit_id = $1",
    [habitId]
  );
  return new Set(rows.map((r) => r.date));
}

class HabitService {
  async findAll(userId: string): Promise<Habit[]> {
    const { rows } = await pool.query<HabitRow>(
      "SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );
    return Promise.all(rows.map(async (row) => toHabit(row, await getLogDates(row.id))));
  }

  async findById(userId: string, id: string): Promise<Habit | undefined> {
    const { rows } = await pool.query<HabitRow>(
      "SELECT * FROM habits WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (rows.length === 0) return undefined;
    return toHabit(rows[0], await getLogDates(id));
  }

  async create(userId: string, dto: CreateHabitDto): Promise<Habit> {
    const id = nanoid();
    const now = new Date().toISOString();
    const color = dto.color ?? "#6366f1";
    const frequency = dto.frequency ?? "daily";
    const targetDays = dto.targetDays ?? [];
    const targetDaysJson = targetDays.length ? JSON.stringify(targetDays) : null;

    await pool.query(
      "INSERT INTO habits (id, user_id, title, color, frequency, target_days, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, userId, dto.title, color, frequency, targetDaysJson, now]
    );

    return toHabit(
      { id, user_id: userId, title: dto.title, color, frequency, target_days: targetDaysJson, created_at: now },
      new Set()
    );
  }

  async update(userId: string, id: string, dto: UpdateHabitDto): Promise<Habit | undefined> {
    const { rows } = await pool.query<HabitRow>(
      "SELECT * FROM habits WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (rows.length === 0) return undefined;
    const row = rows[0];

    const title = dto.title ?? row.title;
    const color = dto.color ?? row.color;
    const frequency = dto.frequency ?? row.frequency;
    const targetDays =
      dto.targetDays !== undefined
        ? dto.targetDays
        : row.target_days
        ? (JSON.parse(row.target_days) as number[])
        : [];
    const target_days = targetDays.length ? JSON.stringify(targetDays) : null;

    await pool.query(
      "UPDATE habits SET title = $1, color = $2, frequency = $3, target_days = $4 WHERE id = $5",
      [title, color, frequency, target_days, id]
    );

    return toHabit({ ...row, title, color, frequency, target_days }, await getLogDates(id));
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      "DELETE FROM habits WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  }

  async log(userId: string, habitId: string, date?: string): Promise<Habit | undefined> {
    const { rows } = await pool.query<HabitRow>(
      "SELECT * FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId]
    );
    if (rows.length === 0) return undefined;

    const logDate = date ?? getDateString(0);
    await pool.query(
      "INSERT INTO habit_logs (id, habit_id, user_id, date, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (habit_id, date) DO NOTHING",
      [nanoid(), habitId, userId, logDate, new Date().toISOString()]
    );

    return toHabit(rows[0], await getLogDates(habitId));
  }

  async unlog(userId: string, habitId: string, date: string): Promise<Habit | undefined> {
    const { rows } = await pool.query<HabitRow>(
      "SELECT * FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId]
    );
    if (rows.length === 0) return undefined;

    await pool.query(
      "DELETE FROM habit_logs WHERE habit_id = $1 AND user_id = $2 AND date = $3",
      [habitId, userId, date]
    );

    return toHabit(rows[0], await getLogDates(habitId));
  }
}

export const habitService = new HabitService();
