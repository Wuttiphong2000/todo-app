import { Router } from "express";
import { analyticsService } from "../services/analytics.service.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { AppError } from "../middlewares/error.middleware.js";

const router = Router();

// Public — called once when guest mode is activated
router.post("/guest-visit", (_req, res) => {
  analyticsService.recordGuestVisit();
  res.json({ success: true });
});

// Protected — wskt only
router.get("/dashboard", requireAuth, (req, res) => {
  if (req.user!.username !== "wskt") {
    throw new AppError(403, "FORBIDDEN", "Dashboard access restricted");
  }
  res.json({ success: true, data: analyticsService.getDashboardStats() });
});

export default router;
