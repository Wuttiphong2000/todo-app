import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { USERS, JWT_SECRET, JWT_EXPIRES_IN } from "../config/users.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts, please try again later" },
});

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /api/auth/login
router.post("/login", loginLimiter, (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: "username and password required" });
    return;
  }

  const { username, password } = parsed.data;
  const user = USERS.find((u) => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ success: false, error: "username หรือ password ไม่ถูกต้อง" });
    return;
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.json({
    success: true,
    data: { token, user: { id: user.id, username: user.username } },
  });
});

// GET /api/auth/me  — verify token and return current user
router.get("/me", requireAuth, (req: Request, res: Response) => {
  const user = USERS.find((u) => u.id === req.user!.id);
  if (!user) {
    res.status(401).json({ success: false, error: "User not found" });
    return;
  }
  res.json({ success: true, data: { id: user.id, username: user.username } });
});

export default router;
