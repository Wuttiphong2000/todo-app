import { pool } from "../db/database.js";
import { nanoid } from "nanoid";
import { USERS } from "../config/users.js";

export const analyticsService = {
  async recordGuestVisit(): Promise<void> {
    await pool.query(
      "INSERT INTO guest_sessions (id, started_at) VALUES ($1, $2)",
      [nanoid(), new Date().toISOString()]
    );
  },

  async getDashboardStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

    const [{ rows: [totalRow] }, { rows: [recentRow] }] = await Promise.all([
      pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM guest_sessions"),
      pool.query<{ count: string }>(
        "SELECT COUNT(*) AS count FROM guest_sessions WHERE started_at >= $1",
        [thirtyDaysAgo]
      ),
    ]);

    return {
      registeredUsers: USERS.length,
      guestVisitsTotal: Number(totalRow.count),
      guestVisitsLast30Days: Number(recentRow.count),
    };
  },
};
