import prisma from "../config/db";

export interface LogAuditParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  batchId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
}

export class AuditService {
  static async log(params: LogAuditParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          batchId: params.batchId || null,
          details: params.details ? JSON.stringify(params.details) : null,
          ipAddress: params.ipAddress || null,
        },
      });
    } catch (error) {
      console.error("Failed to record audit log:", error);
      // We don't throw so the main transaction isn't broken unless strict, but log error
    }
  }

  static async getLogsForEntity(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
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
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getLogsForBatch(batchId: string) {
    return prisma.auditLog.findMany({
      where: { batchId },
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
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

