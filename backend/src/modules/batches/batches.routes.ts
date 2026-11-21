import { Router } from "express";
import { BatchesController } from "./batches.controller";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";

const router = Router();

// Public template download
router.get("/template", BatchesController.downloadTemplate);

// Authenticated endpoints
router.use(authenticateToken);

router.get("/", BatchesController.getBatches);
router.get("/:id", BatchesController.getBatchById);

// Training Centre actions
router.post(
  "/upload",
  requireRole(Role.TRAINING_CENTRE, Role.STATE_OFFICE),
  BatchesController.uploadBatch
);

router.post(
  "/:id/submit",
  requireRole(Role.TRAINING_CENTRE, Role.STATE_OFFICE),
  BatchesController.submitBatch
);

export default router;

