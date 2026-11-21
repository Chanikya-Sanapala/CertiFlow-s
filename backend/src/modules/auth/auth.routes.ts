import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

// Public Authentication Endpoints
router.post("/login", AuthController.login);
router.post("/google", AuthController.googleLogin);
router.post("/demo-login", AuthController.demoLogin);
router.get("/demo-accounts", AuthController.getDemoAccounts);

// Protected Session Verification
router.get("/me", authenticateToken, AuthController.me);

export default router;
