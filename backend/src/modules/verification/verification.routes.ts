import { Router } from "express";
import { VerificationController } from "./verification.controller";

const router = Router();

// Completely public endpoint - no auth required
router.get("/:certificateNumber", VerificationController.verifyCertificate);

export default router;

