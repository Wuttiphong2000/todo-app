import { db } from "../db/database.js";
import { nanoid } from "nanoid";
import { USERS } from "../config/users.js";

export const analyticsService = {
  recordGuestVisit(): void {
    db.prepare("INSERT INTO guest_sessions (id, started_at) VALUES (?, ?)").run(
      nanoid(),
      new Date().toISOString()
    );
  },

  getDashboardStats() {
    const total = (
      db.prepare("SELECT COUNT(*) as count FROM guest_sessions").get() as { count: number }
    ).count;

    const last30Days = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM guest_sessions WHERE started_at >= datetime('now', '-30 days')"
        )
        .get() as { count: number }
    ).count;

    return {
      registeredUsers: USERS.length,
      guestVisitsTotal: total,
      guestVisitsLast30Days: last30Days,
    };
  },
};
