import { Request, Response, NextFunction } from "express";
import { focusService } from "../services/focus.service.js";
import { AppError } from "../middlewares/error.middleware.js";

export const focusController = {
  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await focusService.start(req.user!.id, req.body);
      res.status(201).json({ success: true, data: session });
    } catch (e) { next(e); }
  },

  async end(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await focusService.end(req.user!.id, req.params.id, req.body);
      if (!session) return next(new AppError(404, "SESSION_NOT_FOUND", "Focus session not found"));
      res.json({ success: true, data: session });
    } catch (e) { next(e); }
  },

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await focusService.getStats(req.user!.id);
      res.json({ success: true, data: stats });
    } catch (e) { next(e); }
  },

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await focusService.getHistory(req.user!.id);
      res.json({ success: true, data: sessions });
    } catch (e) { next(e); }
  },
};
