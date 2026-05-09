import { Request, Response, NextFunction } from "express";
import { todoService } from "../services/todo.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import type { TodoQueryParams } from "../types/index.js";
 
export const todoController = {
  // GET /api/todos
  findAll(req: Request, res: Response): void {
    const query = res.locals.query as TodoQueryParams;
    const todos = todoService.findAll(query);
    res.json({
      success: true,
      data: todos,
      meta: { total: todos.length },
    });
  },
 
  // GET /api/todos/:id
  findById(req: Request, res: Response, next: NextFunction): void {
    const todo = todoService.findById(req.params.id);
    if (!todo) {
      return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
    }
    res.json({ success: true, data: todo });
  },
 
  // POST /api/todos
  create(req: Request, res: Response): void {
    const todo = todoService.create(req.body);
    res.status(201).json({ success: true, data: todo });
  },
 
  // PUT /api/todos/:id
  update(req: Request, res: Response, next: NextFunction): void {
    const todo = todoService.update(req.params.id, req.body);
    if (!todo) {
      return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
    }
    res.json({ success: true, data: todo });
  },
 
  // PATCH /api/todos/:id/status
  patchStatus(req: Request, res: Response, next: NextFunction): void {
    const todo = todoService.patchStatus(req.params.id, req.body);
    if (!todo) {
      return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
    }
    res.json({ success: true, data: todo });
  },
 
  // PATCH /api/todos/reorder
  reorder(req: Request, res: Response): void {
    todoService.reorder(req.body);
    res.json({ success: true, data: null });
  },
 
  // DELETE /api/todos/:id
  delete(req: Request, res: Response, next: NextFunction): void {
    const deleted = todoService.delete(req.params.id);
    if (!deleted) {
      return next(new AppError(404, "TODO_NOT_FOUND", "Todo not found"));
    }
    res.status(204).send();
  },
};
 