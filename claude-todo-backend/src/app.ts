import "dotenv/config";
import express from "express";
import cors from "cors";
import todoRoutes from "./routes/todo.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import authRoutes from "./routes/auth.routes.js";
import focusRoutes from "./routes/focus.routes.js";
import habitRoutes from "./routes/habit.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { statsService } from "./services/stats.service.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";
import { requireAuth } from "./middlewares/auth.middleware.js";
import { z } from "zod";
import { validateBody, importSchema } from "./middlewares/validate.middleware.js";
import { todoService } from "./services/todo.service.js";
import { tagService } from "./services/tag.service.js";
import { initDb, withTransaction } from "./db/database.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Trust Railway / nginx reverse proxy so express-rate-limit reads the real client IP
app.set("trust proxy", 1);

// ── Global Middlewares ────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check (public) ─────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" },
  });
});

// ── Public Routes ─────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);

// ── Protected Routes ──────────────────────────────────────────────────────────

app.get("/api/export", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const [todos, tags, stats] = await Promise.all([
      todoService.findAll(userId),
      tagService.findAll(userId),
      statsService.getStats(userId),
    ]);
    res
      .setHeader("Content-Type", "application/json")
      .setHeader("Content-Disposition", `attachment; filename="todo-backup-${Date.now()}.json"`)
      .json({ success: true, data: { todos, tags, stats } });
  } catch (e) { next(e); }
});

app.post("/api/import", requireAuth, validateBody(importSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { todos, tags } = req.body as z.infer<typeof importSchema>;

    await withTransaction(async (client) => {
      for (const tag of tags) {
        await client.query(
          `INSERT INTO tags (id, user_id, name, color, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             user_id = EXCLUDED.user_id, name = EXCLUDED.name, color = EXCLUDED.color`,
          [tag.id, userId, tag.name, tag.color, tag.createdAt]
        );
      }

      for (const todo of todos) {
        await client.query(
          `INSERT INTO todos (id, user_id, title, description, status, priority, due_date, order_index, created_at, updated_at, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             user_id = EXCLUDED.user_id, title = EXCLUDED.title, description = EXCLUDED.description,
             status = EXCLUDED.status, priority = EXCLUDED.priority, due_date = EXCLUDED.due_date,
             order_index = EXCLUDED.order_index, updated_at = EXCLUDED.updated_at,
             completed_at = EXCLUDED.completed_at`,
          [todo.id, userId, todo.title, todo.description ?? null, todo.status, todo.priority,
           todo.dueDate ?? null, todo.order, todo.createdAt, todo.updatedAt, todo.completedAt ?? null]
        );

        await client.query("DELETE FROM subtasks WHERE todo_id = $1", [todo.id]);
        for (const s of todo.subtasks) {
          await client.query(
            "INSERT INTO subtasks (id, todo_id, title, completed, created_at) VALUES ($1, $2, $3, $4, $5)",
            [s.id, todo.id, s.title, s.completed, s.createdAt]
          );
        }

        await client.query("DELETE FROM todo_tags WHERE todo_id = $1", [todo.id]);
        for (const tagId of todo.tagIds) {
          await client.query(
            "INSERT INTO todo_tags (todo_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [todo.id, tagId]
          );
        }
      }
    });

    res.json({ success: true, data: { imported: { todos: todos.length, tags: tags.length } } });
  } catch (e) { next(e); }
});

app.use("/api/todos", requireAuth, todoRoutes);
app.use("/api/tags", requireAuth, tagRoutes);
app.use("/api/focus", requireAuth, focusRoutes);
app.use("/api/habits", requireAuth, habitRoutes);
app.use("/api/stats", requireAuth, statsRoutes);
app.use("/api/analytics", analyticsRoutes);

// ── Error Handlers (ต้องอยู่ท้ายสุด) ─────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== "test") {
  initDb()
    .then(() => {
      app.listen(PORT, () => {
        process.stdout.write(`Todo API running at http://localhost:${PORT}\n`);
      });
    })
    .catch((err: unknown) => {
      process.stderr.write(`Failed to initialize database: ${String(err)}\n`);
      process.exit(1);
    });
}

export default app;
