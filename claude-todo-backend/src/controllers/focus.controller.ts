import { Request, Response, NextFunction } from "express";
import { focusService } from "../services/focus.service.js";
import { AppError } from "../middlewares/error.middleware.js";

export const focusController = {
  start(req: Request, res: Response): void {
    const session = focusService.start(req.user!.id, req.body);
    res.status(201).json({ success: true, data: session });
  },

  end(req: Request, res: Response, next: NextFunction): void {
    const session = focusService.end(req.user!.id, req.params.id, req.body);
    if (!session) return next(new AppError(404, "SESSION_NOT_FOUND", "Focus session not found"));
    res.json({ success: true, data: session });
  },

  getStats(req: Request, res: Response): void {
    const stats = focusService.getStats(req.user!.id);
    res.json({ success: true, data: stats });
  },

  getHistory(req: Request, res: Response): void {
    const sessions = focusService.getHistory(req.user!.id);
    res.json({ success: true, data: sessions });
  },
};
