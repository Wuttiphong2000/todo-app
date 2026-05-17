import express from "express";
import cors from "cors";
import todoRoutes from "./routes/todo.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";
import { requireAuth } from "./middlewares/auth.middleware.js";
import { todoService } from "./services/todo.service.js";
import { tagService } from "./services/tag.service.js";

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

app.get("/api/export", requireAuth, (_req, res) => {
  res
    .setHeader("Content-Type", "application/json")
    .setHeader("Content-Disposition", `attachment; filename="todo-backup-${Date.now()}.json"`)
    .json({
      success: true,
      data: { todos: todoService.findAll(), tags: tagService.findAll() },
    });
});

app.use("/api/todos", requireAuth, todoRoutes);
app.use("/api/tags", requireAuth, tagRoutes);

// ── Error Handlers (ต้องอยู่ท้ายสุด) ─────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Todo API running at http://localhost:${PORT}`);
  console.log(`📦 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth:   http://localhost:${PORT}/api/auth/login`);
  console.log(`📋 Todos:  http://localhost:${PORT}/api/todos\n`);
});

export default app;
