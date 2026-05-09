import { Router } from "express";
import { todoController } from "../controllers/todo.controller.js";
import { validateBody, validateQuery } from "../middlewares/validate.middleware.js";
import {
  createTodoSchema,
  updateTodoSchema,
  patchStatusSchema,
  reorderSchema,
  todoQuerySchema,
} from "../middlewares/validate.middleware.js";
 
const router = Router();
 
// NOTE: /reorder ต้องมาก่อน /:id เพื่อป้องกัน express match "reorder" เป็น id
router.patch("/reorder", validateBody(reorderSchema), todoController.reorder);
 
router.get("/", validateQuery(todoQuerySchema), todoController.findAll);
router.post("/", validateBody(createTodoSchema), todoController.create);
 
router.get("/:id", todoController.findById);
router.put("/:id", validateBody(updateTodoSchema), todoController.update);
router.patch("/:id/status", validateBody(patchStatusSchema), todoController.patchStatus);
router.delete("/:id", todoController.delete);
 
export default router;
 