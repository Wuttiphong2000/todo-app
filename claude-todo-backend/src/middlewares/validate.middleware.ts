import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
 
// ── Zod Schemas ───────────────────────────────────────────────────────────────
 
const prioritySchema = z.enum(["low", "medium", "high"]);
const statusSchema = z.enum(["pending", "in_progress", "done"]);
 
export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(2000).optional(),
  priority: prioritySchema.optional(),
  tagIds: z.array(z.string()).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD")
    .nullable()
    .optional(),
  subtasks: z
    .array(z.object({ title: z.string().min(1).max(255) }))
    .optional(),
});
 
export const updateTodoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: prioritySchema.optional(),
  tagIds: z.array(z.string()).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  subtasks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255),
        completed: z.boolean(),
        createdAt: z.string(),
      })
    )
    .optional(),
  order: z.number().int().min(0).optional(),
});
 
export const patchStatusSchema = z.object({
  status: statusSchema,
});
 
export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    })
  ),
});
 
export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "color must be a valid hex color e.g. #FF5733"),
});
 
export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});
 
export const todoQuerySchema = z.object({
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  tagId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "dueDate", "priority", "order"])
    .optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});
 
// ── Middleware Factory ─────────────────────────────────────────────────────────
 
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: result.error.flatten(),
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
 
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: result.error.flatten(),
        },
      });
      return;
    }
    // attach parsed query to res.locals เพื่อให้ controller ใช้งานต่อ
    res.locals.query = result.data;
    next();
  };
}