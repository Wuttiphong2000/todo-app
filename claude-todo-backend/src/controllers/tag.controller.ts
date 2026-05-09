import { Request, Response, NextFunction } from "express";
import { tagService } from "../services/tag.service.js";
import { AppError } from "../middlewares/error.middleware.js";
 
export const tagController = {
  // GET /api/tags
  findAll(_req: Request, res: Response): void {
    const tags = tagService.findAll();
    res.json({ success: true, data: tags, meta: { total: tags.length } });
  },
 
  // GET /api/tags/:id
  findById(req: Request, res: Response, next: NextFunction): void {
    const tag = tagService.findById(req.params.id);
    if (!tag) {
      return next(new AppError(404, "TAG_NOT_FOUND", "Tag not found"));
    }
    res.json({ success: true, data: tag });
  },
 
  // POST /api/tags
  create(req: Request, res: Response): void {
    const tag = tagService.create(req.body);
    res.status(201).json({ success: true, data: tag });
  },
 
  // PUT /api/tags/:id
  update(req: Request, res: Response, next: NextFunction): void {
    const tag = tagService.update(req.params.id, req.body);
    if (!tag) {
      return next(new AppError(404, "TAG_NOT_FOUND", "Tag not found"));
    }
    res.json({ success: true, data: tag });
  },
 
  // DELETE /api/tags/:id
  delete(req: Request, res: Response, next: NextFunction): void {
    const deleted = tagService.delete(req.params.id);
    if (!deleted) {
      return next(new AppError(404, "TAG_NOT_FOUND", "Tag not found"));
    }
    res.status(204).send();
  },
};