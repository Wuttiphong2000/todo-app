import { Router } from "express";
import { analyticsService } from "../services/analytics.service.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { AppError } from "../middlewares/error.middleware.js";

const router = Router();

// Public — called once when guest mode is activated
router.post("/guest-visit", async (_req, res, next) => {
  try {
    await analyticsService.recordGuestVisit();
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Protected — wskt only
router.get("/dashboard", requireAuth, async (req, res, next) => {
  try {
    if (req.user!.username !== "wskt") {
      throw new AppError(403, "FORBIDDEN", "Dashboard access restricted");
    }
    const data = await analyticsService.getDashboardStats();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;
