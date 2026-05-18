import { Request, Response, NextFunction } from "express";
import { habitService } from "../services/habit.service.js";
import { AppError } from "../middlewares/error.middleware.js";

export const habitController = {
  findAll(req: Request, res: Response): void {
    const habits = habitService.findAll(req.user!.id);
    res.json({ success: true, data: habits });
  },

  findById(req: Request, res: Response, next: NextFunction): void {
    const habit = habitService.findById(req.user!.id, req.params.id);
    if (!habit) return next(new AppError(404, "HABIT_NOT_FOUND", "Habit not found"));
    res.json({ success: true, data: habit });
  },

  create(req: Request, res: Response): void {
    const habit = habitService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: habit });
  },

  update(req: Request, res: Response, next: NextFunction): void {
    const habit = habitService.update(req.user!.id, req.params.id, req.body);
    if (!habit) return next(new AppError(404, "HABIT_NOT_FOUND", "Habit not found"));
    res.json({ success: true, data: habit });
  },

  delete(req: Request, res: Response, next: NextFunction): void {
    const deleted = habitService.delete(req.user!.id, req.params.id);
    if (!deleted) return next(new AppError(404, "HABIT_NOT_FOUND", "Habit not found"));
    res.json({ success: true, data: null });
  },

  log(req: Request, res: Response, next: NextFunction): void {
    const habit = habitService.log(req.user!.id, req.params.id, req.body.date);
    if (!habit) return next(new AppError(404, "HABIT_NOT_FOUND", "Habit not found"));
    res.json({ success: true, data: habit });
  },

  unlog(req: Request, res: Response, next: NextFunction): void {
    const habit = habitService.unlog(req.user!.id, req.params.id, req.params.date);
    if (!habit) return next(new AppError(404, "HABIT_NOT_FOUND", "Habit not found"));
    res.json({ success: true, data: habit });
  },
};
