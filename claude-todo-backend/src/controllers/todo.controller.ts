import { Request, Response, NextFunction } from "express";
import { todoService } from "../services/todo.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import type { TodoQueryParams } from "../types/index.js";

export const todoController = {
  findAll(req: Request, res: Response): void {
    const query = res.locals.query as TodoQueryParams;
    const todos = todoService.findAll(req.user!.id, query);
    res.json({ success: true, data: todos, meta: { total: todos.length } });
  },

  findById(req: Request, res: Response, next: NextFunction): void {
    const todo = todoService.findById(req.user!.id, req.params.id);
    if (!todo) return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
    res.json({ success: true, data: todo });
  },

  create(req: Request, res: Response): void {
    const todo = todoService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: todo });
  },

  update(req: Request, res: Response, next: NextFunction): void {
    const todo = todoService.update(req.user!.id, req.params.id, req.body);
    if (!todo) return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
    res.json({ success: true, data: todo });
  },

  patchStatus(req: Request, res: Response, next: NextFunction): void {
    const result = todoService.patchStatus(req.user!.id, req.params.id, req.body);
    if (!result) return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
    const meta = result.nextOccurrence ? { nextOccurrence: result.nextOccurrence } : undefined;
    res.json({ success: true, data: result.todo, ...(meta && { meta }) });
  },

  reorder(req: Request, res: Response): void {
    todoService.reorder(req.user!.id, req.body);
    res.json({ success: true, data: null });
  },

  delete(req: Request, res: Response, next: NextFunction): void {
    const deleted = todoService.delete(req.user!.id, req.params.id);
    if (!deleted) return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
    res.status(204).send();
  },
};
