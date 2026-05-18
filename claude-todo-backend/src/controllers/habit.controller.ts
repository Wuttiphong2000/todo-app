import { Request, Response, NextFunction } from "express";
import { habitService } from "../services/habit.service.js";
import { AppError } from "../middlewares/error.middleware.js";

export const habitController = {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const habits = await habitService.findAll(req.user!.id);
      res.json({ success: true, data: habits });
    } catch (e) { next(e); }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const habit = await habitService.findById(req.user!.id, req.params.id);
      if (!habit) return next(new AppError(404, "HABIT_NOT_FOUND", "Habit not found"));
      res.json({ success: true, data: habit });
    } catch (e) { next(e); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const habit = await habitService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: habit });
    } catch (e) { next(e); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const habit = await habitService.update(req.user!.id, req.params.id, req.body);
      if (!habit) return next(new AppError(404, "HABIT_NOT_FOUND", "Habit not found"));
      res.json({ success: true, data: habit });
    } catch (e) { next(e); }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await habitService.delete(req.user!.id, req.params.id);
      if (!deleted) return next(new AppError(404, "HABIT_NOT_FOUND", "Habit not found"));
      res.json({ success: true, data: null });
    } catch (e) { next(e); }
  },

  async log(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const habit = await habitService.log(req.user!.id, req.params.id, req.body.date);
      if (!habit) return next(new AppError(404, "HABIT_NOT_FOUND", "Habit not found"));
      res.json({ success: true, data: habit });
    } catch (e) { next(e); }
  },

  async unlog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const habit = await habitService.unlog(req.user!.id, req.params.id, req.params.date);
      if (!habit) return next(new AppError(404, "HABIT_NOT_FOUND", "Habit not found"));
      res.json({ success: true, data: habit });
    } catch (e) { next(e); }
  },
};
