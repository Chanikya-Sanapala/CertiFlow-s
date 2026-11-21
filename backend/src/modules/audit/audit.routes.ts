import { Router, Response } from "express";
import prisma from "../../config/db";
import { AuthenticatedRequest, authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

router.get("/", requireRole(Role.STATE_OFFICE, Role.QUALITY_TEAM, Role.DISTRICT_OFFICER), async (req: AuthenticatedRequest, res: Response) => {
  const { action, entityType, limit = "50" } = req.query;

  const where: any = {};
  if (action) where.action = String(action);
  if (entityType) where.entityType = String(entityType);

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          district: true,
        },
      },
      batch: {
        select: {
          batchNumber: true,
          courseName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Number(limit) || 50, 100),
  });

  return res.json({
    success: true,
    count: logs.length,
    logs,
  });
});

export default router;

