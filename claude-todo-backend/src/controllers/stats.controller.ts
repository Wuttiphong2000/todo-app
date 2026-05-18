import { Request, Response } from "express";
import { statsService } from "../services/stats.service.js";

export const statsController = {
  getStats(req: Request, res: Response): void {
    const stats = statsService.getStats(req.user!.id);
    res.json({ success: true, data: stats });
  },
};
