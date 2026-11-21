import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./modules/auth/auth.routes";
import batchesRoutes from "./modules/batches/batches.routes";
import approvalsRoutes from "./modules/approvals/approvals.routes";
import certificatesRoutes from "./modules/certificates/certificates.routes";
import verificationRoutes from "./modules/verification/verification.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import auditRoutes from "./modules/audit/audit.routes";
import { errorHandler } from "./middleware/errorHandler";

// Start background worker for simulated WhatsApp certificate delivery
import "./workers/deliveryWorker";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health and Welcome Endpoints
app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to CertiFlow API – Smart Certificate Issuance & Verification Platform",
    status: "running",
    version: "1.0.0",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "CertiFlow Backend",
    database: "PostgreSQL",
    cache: "Redis",
    queue: "BullMQ Active",
  });
});

// Module API Routes
app.use("/api/auth", authRoutes);
app.use("/api/batches", batchesRoutes);
app.use("/api/approvals", approvalsRoutes);
app.use("/api/certificates", certificatesRoutes);
app.use("/api/verify", verificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit", auditRoutes);

// Centralized Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`CertiFlow API running on http://localhost:${PORT}`);
});

export default app;
