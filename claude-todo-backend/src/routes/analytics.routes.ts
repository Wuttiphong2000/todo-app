import { Router } from "express";
import rateLimit from "express-rate-limit";
import { analyticsService } from "../services/analytics.service.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { AppError } from "../middlewares/error.middleware.js";

const router = Router();

const guestVisitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } },
});

// Public — called once when guest mode is activated
router.post("/guest-visit", guestVisitLimiter, async (_req, res, next) => {
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
