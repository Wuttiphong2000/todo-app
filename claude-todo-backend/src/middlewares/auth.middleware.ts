import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/users.js";

export interface AuthPayload {
  id: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Token invalid or expired" });
  }
}
