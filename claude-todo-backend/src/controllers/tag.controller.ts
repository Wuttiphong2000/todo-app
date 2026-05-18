import { Request, Response, NextFunction } from "express";
import { tagService } from "../services/tag.service.js";
import { AppError } from "../middlewares/error.middleware.js";

export const tagController = {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await tagService.findAll(req.user!.id);
      res.json({ success: true, data: tags, meta: { total: tags.length } });
    } catch (e) { next(e); }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tag = await tagService.findById(req.user!.id, req.params.id);
      if (!tag) return next(new AppError(404, "TAG_NOT_FOUND", "Tag not found"));
      res.json({ success: true, data: tag });
    } catch (e) { next(e); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tag = await tagService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: tag });
    } catch (e) { next(e); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tag = await tagService.update(req.user!.id, req.params.id, req.body);
      if (!tag) return next(new AppError(404, "TAG_NOT_FOUND", "Tag not found"));
      res.json({ success: true, data: tag });
    } catch (e) { next(e); }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await tagService.delete(req.user!.id, req.params.id);
      if (!deleted) return next(new AppError(404, "TAG_NOT_FOUND", "Tag not found"));
      res.status(204).send();
    } catch (e) { next(e); }
  },
};
