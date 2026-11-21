import { Router } from "express";
import { CertificatesController } from "./certificates.controller";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";

const router = Router();

// Public / Semi-public PDF download by ID or Certificate Number
router.get("/:id/pdf", CertificatesController.downloadPdf);

// Authenticated actions
router.use(authenticateToken);

router.get("/", CertificatesController.getCertificates);
router.get("/:id", CertificatesController.getCertificateById);

// Delivery Dashboard & Simulation Management
router.get("/deliveries/summary", CertificatesController.getDeliverySummary);
router.post("/deliveries/:deliveryId/retry", CertificatesController.retryDeliveryById);
router.post("/deliveries/simulate-test", CertificatesController.simulateTestDelivery);

// State Office Revocation
router.post(
  "/:id/revoke",
  requireRole(Role.STATE_OFFICE),
  CertificatesController.revokeCertificate
);

// Retry delivery
router.post("/:id/retry-delivery", CertificatesController.retryDelivery);

export default router;

