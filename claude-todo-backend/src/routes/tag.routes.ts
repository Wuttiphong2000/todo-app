import { Router } from "express";
import { tagController } from "../controllers/tag.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createTagSchema, updateTagSchema } from "../middlewares/validate.middleware.js";
 
const router = Router();
 
router.get("/", tagController.findAll);
router.post("/", validateBody(createTagSchema), tagController.create);
 
router.get("/:id", tagController.findById);
router.put("/:id", validateBody(updateTagSchema), tagController.update);
router.delete("/:id", tagController.delete);
 
export default router;