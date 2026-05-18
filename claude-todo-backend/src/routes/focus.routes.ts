import { Router } from "express";
import { focusController } from "../controllers/focus.controller.js";
import { validateBody, startFocusSchema, endFocusSchema } from "../middlewares/validate.middleware.js";

const router = Router();

router.post("/sessions", validateBody(startFocusSchema), focusController.start);
router.patch("/sessions/:id", validateBody(endFocusSchema), focusController.end);
router.get("/stats", focusController.getStats);
router.get("/sessions", focusController.getHistory);

export default router;
