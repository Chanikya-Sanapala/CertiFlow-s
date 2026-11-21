import { Router } from "express";
import { ApprovalsController } from "./approvals.controller";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

// District Officer Approval (Dev, Meera, Kabir)
router.post(
  "/district/:batchId",
  requireRole(Role.DISTRICT_OFFICER, Role.STATE_OFFICE),
  ApprovalsController.handleDistrictApproval
);

// Quality Review (Neha)
router.post(
  "/quality/:batchId",
  requireRole(Role.QUALITY_TEAM, Role.STATE_OFFICE),
  ApprovalsController.handleQualityReview
);

// State Final Approval (Farah)
router.post(
  "/state/:batchId",
  requireRole(Role.STATE_OFFICE),
  ApprovalsController.handleStateApproval
);

export default router;

