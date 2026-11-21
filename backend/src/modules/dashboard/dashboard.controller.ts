import { Response } from "express";
import prisma from "../../config/db";
import { AuthenticatedRequest } from "../../middleware/auth";
import { BatchStatus, Role, CertificateStatus, DeliveryStatus } from "@prisma/client";
import { SLA_HOURS_THRESHOLD } from "../../config/constants";

export class DashboardController {
  static async getStats(req: AuthenticatedRequest, res: Response) {
    const user = req.user!;
    const now = new Date();
    const slaCutoff = new Date(now.getTime() - SLA_HOURS_THRESHOLD * 60 * 60 * 1000);

    // Common aggregates
    const [
      totalBatches,
      totalCandidates,
      totalCertificates,
      revokedCertificates,
      deliveredWhatsApp,
      failedWhatsApp,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.batch.count(),
      prisma.candidate.count(),
      prisma.certificate.count({ where: { status: CertificateStatus.ISSUED } }),
      prisma.certificate.count({ where: { status: CertificateStatus.REVOKED } }),
      prisma.certificateDelivery.count({
        where: {
          status: { in: [DeliveryStatus.SIMULATED_SENT, DeliveryStatus.DELIVERED] },
        },
      }),
      prisma.certificateDelivery.count({ where: { status: DeliveryStatus.FAILED } }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true, role: true } } },
      }),
    ]);

    // Stuck batches: In review status and last action older than SLA cutoff
    const stuckBatches = await prisma.batch.findMany({
      where: {
        status: {
          in: [
            BatchStatus.UNDER_DISTRICT_REVIEW,
            BatchStatus.UNDER_QUALITY_REVIEW,
            BatchStatus.UNDER_STATE_REVIEW,
          ],
        },
        lastActionAt: { lt: slaCutoff },
      },
      include: {
        trainingCentre: { select: { name: true, district: true } },
      },
      orderBy: { lastActionAt: "asc" },
      take: 5,
    });

    // Role-specific stats
    let roleStats: Record<string, any> = {};

    if (user.role === Role.TRAINING_CENTRE) {
      const tcId = user.trainingCentreId;
      const [myBatches, myDrafts, myInReview, myApproved, myReturned] = await Promise.all([
        prisma.batch.count({ where: { trainingCentreId: tcId || undefined } }),
        prisma.batch.count({ where: { trainingCentreId: tcId || undefined, status: BatchStatus.DRAFT } }),
        prisma.batch.count({
          where: {
            trainingCentreId: tcId || undefined,
            status: { in: [BatchStatus.UNDER_DISTRICT_REVIEW, BatchStatus.UNDER_QUALITY_REVIEW, BatchStatus.UNDER_STATE_REVIEW] },
          },
        }),
        prisma.batch.count({ where: { trainingCentreId: tcId || undefined, status: BatchStatus.APPROVED } }),
        prisma.batch.count({ where: { trainingCentreId: tcId || undefined, status: BatchStatus.RETURNED_TO_CENTRE } }),
      ]);

      roleStats = { myBatches, myDrafts, myInReview, myApproved, myReturned };
    } else if (user.role === Role.DISTRICT_OFFICER) {
      const district = user.district;
      const [pendingDistrict, alreadyEndorsedByMe, districtTotal] = await Promise.all([
        prisma.batch.count({
          where: {
            district: district || undefined,
            status: BatchStatus.UNDER_DISTRICT_REVIEW,
          },
        }),
        prisma.approval.count({
          where: {
            officerId: user.id,
            stage: Role.DISTRICT_OFFICER,
            isValid: true,
          },
        }),
        prisma.batch.count({ where: { district: district || undefined } }),
      ]);

      roleStats = { pendingDistrict, alreadyEndorsedByMe, districtTotal, districtName: district };
    } else if (user.role === Role.QUALITY_TEAM) {
      const [pendingQuality, qualityAuditedTotal] = await Promise.all([
        prisma.batch.count({ where: { status: BatchStatus.UNDER_QUALITY_REVIEW } }),
        prisma.qualityReview.count(),
      ]);

      roleStats = { pendingQuality, qualityAuditedTotal };
    } else if (user.role === Role.STATE_OFFICE) {
      const [pendingState, totalApproved, returnedTotal] = await Promise.all([
        prisma.batch.count({ where: { status: BatchStatus.UNDER_STATE_REVIEW } }),
        prisma.batch.count({ where: { status: BatchStatus.APPROVED } }),
        prisma.batch.count({ where: { status: BatchStatus.RETURNED_TO_CENTRE } }),
      ]);

      roleStats = { pendingState, totalApproved, returnedTotal, stuckBatchesCount: stuckBatches.length };
    }

    return res.json({
      success: true,
      stats: {
        totalBatches,
        totalCandidates,
        totalCertificates,
        revokedCertificates,
        deliveredWhatsApp,
        failedWhatsApp,
        roleStats,
        stuckBatches,
        recentAuditLogs,
      },
    });
  }
}

