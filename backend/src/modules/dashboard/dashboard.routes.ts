import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

router.use(authenticateToken);
router.get("/stats", DashboardController.getStats);

export default router;

