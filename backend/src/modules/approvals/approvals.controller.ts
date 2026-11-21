import { Response } from "express";
import { z } from "zod";
import prisma from "../../config/db";
import { AuthenticatedRequest } from "../../middleware/auth";
import { ApprovalAction, BatchStatus, Role } from "@prisma/client";
import { AuditService } from "../../services/auditService";
import { CertificateService } from "../certificates/certificates.service";
import { REQUIRED_DISTRICT_APPROVALS } from "../../config/constants";

const actionSchema = z.object({
  action: z.nativeEnum(ApprovalAction),
  comments: z.string().optional(),
});

export class ApprovalsController {
  static async handleDistrictApproval(req: AuthenticatedRequest, res: Response) {
    const user = req.user!;
    const batchId = String(req.params.batchId);
    const { action, comments } = actionSchema.parse(req.body);

    if (action !== ApprovalAction.APPROVE && !comments) {
      return res.status(400).json({
        success: false,
        message: "Comments are required when rejecting or returning a batch for correction",
      });
    }

    try {
      const result = await prisma.$transaction(async (tx: any) => {
        const batch = await tx.batch.findUnique({
          where: { id: batchId },
          include: {
            approvals: {
              where: { stage: Role.DISTRICT_OFFICER, isValid: true },
            },
          },
        });

        if (!batch) {
          throw new Error("Batch not found");
        }

        if (user.role === Role.DISTRICT_OFFICER && user.district && batch.district !== user.district) {
          throw new Error(
            `Unauthorized: You can only act on batches from your assigned district (${user.district})`
          );
        }

        if (
          batch.status !== BatchStatus.UNDER_DISTRICT_REVIEW &&
          batch.status !== BatchStatus.SUBMITTED
        ) {
          throw new Error(`Batch is not currently under district review (Status: ${batch.status})`);
        }

        const alreadyApproved = (batch.approvals || []).some(
          (a: any) => a.officerId === user.id && a.action === ApprovalAction.APPROVE
        );
        if (alreadyApproved && action === ApprovalAction.APPROVE) {
          throw new Error("You have already submitted an approval for this batch.");
        }

        await tx.approval.create({
          data: {
            batchId: batch.id,
            officerId: user.id,
            stage: Role.DISTRICT_OFFICER,
            action,
            comments: comments || "Approved by District Officer",
            batchVersion: batch.version,
            isValid: true,
          },
        });

        let newStatus: BatchStatus = batch.status;

        if (action === ApprovalAction.REJECT) {
          newStatus = BatchStatus.REJECTED;
          await tx.batch.update({
            where: { id: batch.id },
            data: {
              status: newStatus,
              rejectionReason: comments,
              version: { increment: 1 },
              lastActionAt: new Date(),
            },
          });
        } else if (action === ApprovalAction.RETURN_FOR_CORRECTION) {
          newStatus = BatchStatus.RETURNED_TO_CENTRE;
          await tx.approval.updateMany({
            where: { batchId: batch.id, isValid: true },
            data: { isValid: false },
          });

          await tx.batch.update({
            where: { id: batch.id },
            data: {
              status: newStatus,
              returnComments: comments,
              version: { increment: 1 },
              lastActionAt: new Date(),
            },
          });
        } else if (action === ApprovalAction.APPROVE) {
          const totalDistrictApprovals = (batch.approvals || []).length + 1;

          if (totalDistrictApprovals >= REQUIRED_DISTRICT_APPROVALS) {
            newStatus = batch.isFlaggedForQuality
              ? BatchStatus.UNDER_QUALITY_REVIEW
              : BatchStatus.UNDER_STATE_REVIEW;

            const updatedRows = await tx.batch.updateMany({
              where: {
                id: batch.id,
                version: batch.version,
              },
              data: {
                status: newStatus,
                version: batch.version + 1,
                lastActionAt: new Date(),
              },
            });

            if (updatedRows.count === 0) {
              throw new Error("Concurrent modification detected. The batch status was updated by another officer. Please refresh.");
            }
          } else {
            await tx.batch.update({
              where: { id: batch.id },
              data: {
                status: BatchStatus.UNDER_DISTRICT_REVIEW,
                version: { increment: 1 },
                lastActionAt: new Date(),
              },
            });
          }
        }

        return {
          batch,
          action,
          newStatus,
          currentApprovals: (batch.approvals || []).length + (action === ApprovalAction.APPROVE ? 1 : 0),
        };
      });

      await AuditService.log({
        userId: user.id,
        action: `DISTRICT_${action}`,
        entityType: "Batch",
        entityId: batchId,
        batchId: batchId,
        details: {
          officerName: user.fullName,
          district: user.district,
          action,
          comments,
          resultingStatus: result.newStatus,
          approvalsCount: result.currentApprovals,
        },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message:
          action === ApprovalAction.APPROVE
            ? result.currentApprovals >= REQUIRED_DISTRICT_APPROVALS
              ? `District quorum reached (${result.currentApprovals}/${REQUIRED_DISTRICT_APPROVALS} officers approved). Batch advanced to ${result.newStatus}.`
              : `Endorsement recorded (${result.currentApprovals}/${REQUIRED_DISTRICT_APPROVALS}). Awaiting second officer endorsement.`
            : `Batch ${action.toLowerCase()}ed successfully.`,
        status: result.newStatus,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  static async handleQualityReview(req: AuthenticatedRequest, res: Response) {
    const user = req.user!;
    const batchId = String(req.params.batchId);
    const { action, comments } = actionSchema.parse(req.body);

    try {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        return res.status(404).json({ success: false, message: "Batch not found" });
      }

      if (batch.status !== BatchStatus.UNDER_QUALITY_REVIEW) {
        return res.status(400).json({
          success: false,
          message: `Batch is not under quality review (Status: ${batch.status})`,
        });
      }

      let newStatus: BatchStatus = BatchStatus.UNDER_STATE_REVIEW;
      if (action === ApprovalAction.REJECT) {
        newStatus = BatchStatus.REJECTED;
      } else if (action === ApprovalAction.RETURN_FOR_CORRECTION) {
        newStatus = BatchStatus.RETURNED_TO_CENTRE;
        await prisma.approval.updateMany({
          where: { batchId, isValid: true },
          data: { isValid: false },
        });
      }

      await prisma.$transaction([
        prisma.qualityReview.create({
          data: {
            batchId,
            reviewerId: user.id,
            action,
            remarks: comments || "Quality standards verified",
            scoreAudited: true,
            attendanceAudit: true,
          },
        }),
        prisma.batch.update({
          where: { id: batchId },
          data: {
            status: newStatus,
            version: { increment: 1 },
            lastActionAt: new Date(),
            ...(action === ApprovalAction.RETURN_FOR_CORRECTION && { returnComments: comments }),
            ...(action === ApprovalAction.REJECT && { rejectionReason: comments }),
          },
        }),
      ]);

      await AuditService.log({
        userId: user.id,
        action: `QUALITY_${action}`,
        entityType: "Batch",
        entityId: batchId,
        batchId,
        details: { reviewer: user.fullName, action, comments, resultingStatus: newStatus },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: `Quality review completed (${action}). Batch status is now ${newStatus}.`,
        status: newStatus,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async handleStateApproval(req: AuthenticatedRequest, res: Response) {
    const user = req.user!;
    const batchId = String(req.params.batchId);
    const { action, comments } = actionSchema.parse(req.body);

    try {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        include: { candidates: true },
      });

      if (!batch) {
        return res.status(404).json({ success: false, message: "Batch not found" });
      }

      if (batch.status !== BatchStatus.UNDER_STATE_REVIEW) {
        return res.status(400).json({
          success: false,
          message: `Batch is not awaiting State Office review (Status: ${batch.status})`,
        });
      }

      if (action === ApprovalAction.APPROVE) {
        await prisma.batch.update({
          where: { id: batchId },
          data: {
            status: BatchStatus.APPROVED,
            version: { increment: 1 },
            lastActionAt: new Date(),
          },
        });

        await prisma.approval.create({
          data: {
            batchId,
            officerId: user.id,
            stage: Role.STATE_OFFICE,
            action: ApprovalAction.APPROVE,
            comments: comments || "Final state authorization granted.",
            batchVersion: batch.version,
          },
        });

        const issuanceResult = await CertificateService.issueBatchCertificates(batchId, user.fullName);

        await AuditService.log({
          userId: user.id,
          action: "STATE_FINAL_APPROVAL",
          entityType: "Batch",
          entityId: batchId,
          batchId,
          details: {
            officer: user.fullName,
            certificatesIssued: issuanceResult.issuedCount,
          },
          ipAddress: req.ip,
        });

        return res.json({
          success: true,
          message: `Batch ${batch.batchNumber} has received final state approval! ${issuanceResult.issuedCount} certificates generated and queued for WhatsApp delivery.`,
          status: BatchStatus.APPROVED,
          issuanceResult,
        });
      } else {
        const newStatus =
          action === ApprovalAction.RETURN_FOR_CORRECTION
            ? BatchStatus.RETURNED_TO_CENTRE
            : BatchStatus.REJECTED;

        if (action === ApprovalAction.RETURN_FOR_CORRECTION) {
          await prisma.approval.updateMany({
            where: { batchId, isValid: true },
            data: { isValid: false },
          });
        }

        await prisma.batch.update({
          where: { id: batchId },
          data: {
            status: newStatus,
            version: { increment: 1 },
            lastActionAt: new Date(),
            ...(action === ApprovalAction.RETURN_FOR_CORRECTION && { returnComments: comments }),
            ...(action === ApprovalAction.REJECT && { rejectionReason: comments }),
          },
        });

        await prisma.approval.create({
          data: {
            batchId,
            officerId: user.id,
            stage: Role.STATE_OFFICE,
            action,
            comments: comments || `State decision: ${action}`,
            batchVersion: batch.version,
          },
        });

        await AuditService.log({
          userId: user.id,
          action: `STATE_${action}`,
          entityType: "Batch",
          entityId: batchId,
          batchId,
          details: { officer: user.fullName, action, comments },
          ipAddress: req.ip,
        });

        return res.json({
          success: true,
          message: `Batch ${action.toLowerCase()}ed by State Office.`,
          status: newStatus,
        });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
