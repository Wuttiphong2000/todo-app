import express from "express";
import cors from "cors";
import todoRoutes from "./routes/todo.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";
import { storageService } from "./services/storage.service.js";
 
const app = express();
const PORT = process.env.PORT ?? 3000;
 
// ── Global Middlewares ────────────────────────────────────────────────────────
 
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173", // Vite default port
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// ── Health Check ──────────────────────────────────────────────────────────────
 
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  });
});
 
// ── Export / Import (full backup) ─────────────────────────────────────────────
 
app.get("/api/export", (_req, res) => {
  const db = storageService.getDb();
  res
    .setHeader("Content-Type", "application/json")
    .setHeader(
      "Content-Disposition",
      `attachment; filename="todo-backup-${Date.now()}.json"`
    )
    .json({ success: true, data: db });
});
 
// ── Routes ────────────────────────────────────────────────────────────────────
 
app.use("/api/todos", todoRoutes);
app.use("/api/tags", tagRoutes);
 
// ── Error Handlers (ต้องอยู่ท้ายสุด) ─────────────────────────────────────────
 
app.use(notFoundHandler);
app.use(errorHandler);
 
// ── Start ─────────────────────────────────────────────────────────────────────
 
app.listen(PORT, () => {
  console.log(`\n🚀 Todo API running at http://localhost:${PORT}`);
  console.log(`📦 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Todos API:    http://localhost:${PORT}/api/todos`);
  console.log(`🏷️  Tags API:     http://localhost:${PORT}/api/tags\n`);
});
 
export default app;