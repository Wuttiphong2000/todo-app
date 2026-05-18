import "dotenv/config";
import express from "express";
import cors from "cors";
import todoRoutes from "./routes/todo.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import authRoutes from "./routes/auth.routes.js";
import focusRoutes from "./routes/focus.routes.js";
import habitRoutes from "./routes/habit.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import { statsService } from "./services/stats.service.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";
import { requireAuth } from "./middlewares/auth.middleware.js";
import { z } from "zod";
import { validateBody, importSchema } from "./middlewares/validate.middleware.js";
import { todoService } from "./services/todo.service.js";
import { tagService } from "./services/tag.service.js";
import { db } from "./db/database.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

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

app.get("/api/export", requireAuth, (req, res) => {
  const userId = req.user!.id;
  res
    .setHeader("Content-Type", "application/json")
    .setHeader("Content-Disposition", `attachment; filename="todo-backup-${Date.now()}.json"`)
    .json({
      success: true,
      data: {
        todos: todoService.findAll(userId),
        tags: tagService.findAll(userId),
        stats: statsService.getStats(userId),
      },
    });
});

app.post("/api/import", requireAuth, validateBody(importSchema), (req, res) => {
  const userId = req.user!.id;
  const { todos, tags } = req.body as z.infer<typeof importSchema>;

  db.transaction(() => {
    for (const tag of tags) {
      db.prepare(
        "INSERT OR REPLACE INTO tags (id, user_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)"
      ).run(tag.id, userId, tag.name, tag.color, tag.createdAt);
    }

    for (const todo of todos) {
      db.prepare(
        "INSERT OR REPLACE INTO todos (id, user_id, title, description, status, priority, due_date, order_index, created_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(
        todo.id, userId, todo.title, todo.description, todo.status, todo.priority,
        todo.dueDate, todo.order, todo.createdAt, todo.updatedAt, todo.completedAt
      );

      db.prepare("DELETE FROM subtasks WHERE todo_id = ?").run(todo.id);
      for (const s of todo.subtasks) {
        db.prepare(
          "INSERT INTO subtasks (id, todo_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)"
        ).run(s.id, todo.id, s.title, s.completed ? 1 : 0, s.createdAt);
      }

      db.prepare("DELETE FROM todo_tags WHERE todo_id = ?").run(todo.id);
      for (const tagId of todo.tagIds) {
        db.prepare(
          "INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)"
        ).run(todo.id, tagId);
      }
    }
  })();

  res.json({
    success: true,
    data: { imported: { todos: todos.length, tags: tags.length } },
  });
});

app.use("/api/todos", requireAuth, todoRoutes);
app.use("/api/tags", requireAuth, tagRoutes);
app.use("/api/focus", requireAuth, focusRoutes);
app.use("/api/habits", requireAuth, habitRoutes);
app.use("/api/stats", requireAuth, statsRoutes);

// ── Error Handlers (ต้องอยู่ท้ายสุด) ─────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    process.stdout.write(`Todo API running at http://localhost:${PORT}\n`);
  });
}

export default app;
