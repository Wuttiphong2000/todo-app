import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { USERS, JWT_SECRET, JWT_EXPIRES_IN } from "../config/users.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /api/auth/login
router.post("/login", (req: Request, res: Response) => {
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
router.get("/me", (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as {
      id: string;
      username: string;
    };
    const user = USERS.find((u) => u.id === payload.id);
    if (!user) throw new Error("user not found");
    res.json({ success: true, data: { id: user.id, username: user.username } });
  } catch {
    res.status(401).json({ success: false, error: "Token invalid or expired" });
  }
});

export default router;
