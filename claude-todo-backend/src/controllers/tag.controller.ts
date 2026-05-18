import { Request, Response, NextFunction } from "express";
import { tagService } from "../services/tag.service.js";
import { AppError } from "../middlewares/error.middleware.js";

export const tagController = {
  findAll(req: Request, res: Response): void {
    const tags = tagService.findAll(req.user!.id);
    res.json({ success: true, data: tags, meta: { total: tags.length } });
  },

  findById(req: Request, res: Response, next: NextFunction): void {
    const tag = tagService.findById(req.user!.id, req.params.id);
    if (!tag) return next(new AppError(404, "TAG_NOT_FOUND", "Tag not found"));
    res.json({ success: true, data: tag });
  },

  create(req: Request, res: Response): void {
    const tag = tagService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: tag });
  },

  update(req: Request, res: Response, next: NextFunction): void {
    const tag = tagService.update(req.user!.id, req.params.id, req.body);
    if (!tag) return next(new AppError(404, "TAG_NOT_FOUND", "Tag not found"));
    res.json({ success: true, data: tag });
  },

  delete(req: Request, res: Response, next: NextFunction): void {
    const deleted = tagService.delete(req.user!.id, req.params.id);
    if (!deleted) return next(new AppError(404, "TAG_NOT_FOUND", "Tag not found"));
    res.status(204).send();
  },
};
