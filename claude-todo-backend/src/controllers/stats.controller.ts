import { Request, Response, NextFunction } from "express";
import { statsService } from "../services/stats.service.js";

export const statsController = {
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await statsService.getStats(req.user!.id);
      res.json({ success: true, data: stats });
    } catch (e) { next(e); }
  },
};
