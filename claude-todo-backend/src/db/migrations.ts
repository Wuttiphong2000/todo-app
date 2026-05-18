import { Pool } from "pg";

type Migration = {
  version: number;
  fn: (pool: Pool) => Promise<void>;
};

const migrations: Migration[] = [
  {
    version: 1,
    fn: async (pool) => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tags (
          id         TEXT PRIMARY KEY,
          name       TEXT NOT NULL UNIQUE,
          color      TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS todos (
          id           TEXT PRIMARY KEY,
          title        TEXT NOT NULL,
          description  TEXT,
          status       TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'in_progress', 'done')),
          priority     TEXT NOT NULL DEFAULT 'medium'
                         CHECK (priority IN ('low', 'medium', 'high')),
          due_date     TEXT,
          order_index  INTEGER NOT NULL DEFAULT 0,
          created_at   TEXT NOT NULL,
          updated_at   TEXT NOT NULL,
          completed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS subtasks (
          id         TEXT PRIMARY KEY,
          todo_id    TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
          title      TEXT NOT NULL,
          completed  BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS todo_tags (
          todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
          tag_id  TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
          PRIMARY KEY (todo_id, tag_id)
        );

        CREATE INDEX IF NOT EXISTS idx_todos_status   ON todos(status);
        CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
        CREATE INDEX IF NOT EXISTS idx_todos_order    ON todos(order_index);
        CREATE INDEX IF NOT EXISTS idx_subtasks_todo  ON subtasks(todo_id);
        CREATE INDEX IF NOT EXISTS idx_todo_tags_todo ON todo_tags(todo_id);
        CREATE INDEX IF NOT EXISTS idx_todo_tags_tag  ON todo_tags(tag_id);
      `);
    },
  },
  {
    // Add user_id to todos; replace UNIQUE(name) on tags with UNIQUE(user_id, name)
    version: 2,
    fn: async (pool) => {
      await pool.query(`
        ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;
        ALTER TABLE tags ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
        ALTER TABLE tags ADD CONSTRAINT tags_user_id_name_key UNIQUE (user_id, name);

        ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';

        CREATE INDEX IF NOT EXISTS idx_tags_user  ON tags(user_id);
        CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
      `);
    },
  },
  {
    version: 3,
    fn: async (pool) => {
      await pool.query(`ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurrence TEXT;`);
    },
  },
  {
    version: 4,
    fn: async (pool) => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS focus_sessions (
          id         TEXT PRIMARY KEY,
          user_id    TEXT NOT NULL,
          todo_id    TEXT,
          duration   INTEGER NOT NULL,
          completed  BOOLEAN NOT NULL DEFAULT FALSE,
          started_at TEXT NOT NULL,
          ended_at   TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_focus_user    ON focus_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_focus_started ON focus_sessions(started_at);
      `);
    },
  },
  {
    version: 5,
    fn: async (pool) => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS habits (
          id          TEXT PRIMARY KEY,
          user_id     TEXT NOT NULL,
          title       TEXT NOT NULL,
          color       TEXT NOT NULL DEFAULT '#6366f1',
          frequency   TEXT NOT NULL DEFAULT 'daily',
          target_days TEXT,
          created_at  TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS habit_logs (
          id         TEXT PRIMARY KEY,
          habit_id   TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
          user_id    TEXT NOT NULL,
          date       TEXT NOT NULL,
          created_at TEXT NOT NULL,
          UNIQUE(habit_id, date)
        );
        CREATE INDEX IF NOT EXISTS idx_habits_user      ON habits(user_id);
        CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);
        CREATE INDEX IF NOT EXISTS idx_habit_logs_user  ON habit_logs(user_id);
      `);
    },
  },
  {
    version: 6,
    fn: async (pool) => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS guest_sessions (
          id         TEXT PRIMARY KEY,
          started_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_guest_sessions_date ON guest_sessions(started_at);
      `);
    },
  },
];

export async function runMigrations(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const { rows } = await pool.query<{ version: number }>("SELECT version FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.version));

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    await migration.fn(pool);
    await pool.query(
      "INSERT INTO schema_migrations (version, applied_at) VALUES ($1, $2)",
      [migration.version, new Date().toISOString()]
    );
    process.stdout.write(`[DB] Applied migration v${migration.version}\n`);
  }
}
