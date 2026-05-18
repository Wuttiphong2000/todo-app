import { Router } from "express";
import { habitController } from "../controllers/habit.controller.js";
import { validateBody, createHabitSchema, updateHabitSchema, logHabitSchema } from "../middlewares/validate.middleware.js";

const router = Router();

router.get("/", habitController.findAll);
router.get("/:id", habitController.findById);
router.post("/", validateBody(createHabitSchema), habitController.create);
router.put("/:id", validateBody(updateHabitSchema), habitController.update);
router.delete("/:id", habitController.delete);
router.post("/:id/log", validateBody(logHabitSchema), habitController.log);
router.delete("/:id/log/:date", habitController.unlog);

export default router;
