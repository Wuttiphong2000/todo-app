import { Request, Response, NextFunction } from "express";
import { todoService } from "../services/todo.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import type { TodoQueryParams } from "../types/index.js";

export const todoController = {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = res.locals.query as TodoQueryParams;
      const todos = await todoService.findAll(req.user!.id, query);
      res.json({ success: true, data: todos, meta: { total: todos.length } });
    } catch (e) { next(e); }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const todo = await todoService.findById(req.user!.id, req.params.id);
      if (!todo) return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
      res.json({ success: true, data: todo });
    } catch (e) { next(e); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const todo = await todoService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: todo });
    } catch (e) { next(e); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const todo = await todoService.update(req.user!.id, req.params.id, req.body);
      if (!todo) return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
      res.json({ success: true, data: todo });
    } catch (e) { next(e); }
  },

  async patchStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await todoService.patchStatus(req.user!.id, req.params.id, req.body);
      if (!result) return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
      const meta = result.nextOccurrence ? { nextOccurrence: result.nextOccurrence } : undefined;
      res.json({ success: true, data: result.todo, ...(meta && { meta }) });
    } catch (e) { next(e); }
  },

  async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await todoService.reorder(req.user!.id, req.body);
      res.json({ success: true, data: null });
    } catch (e) { next(e); }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await todoService.delete(req.user!.id, req.params.id);
      if (!deleted) return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
      res.status(204).send();
    } catch (e) { next(e); }
  },
};
