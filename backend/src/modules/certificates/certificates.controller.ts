import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../config/db";
import { AuthenticatedRequest } from "../../middleware/auth";
import { CertificateStatus, DeliveryStatus } from "@prisma/client";
import { PdfService } from "../../services/pdfService";
import { AuditService } from "../../services/auditService";
import { addDeliveryJob } from "../../queues/deliveryQueue";
import { DEMO_MODE_NOTICE } from "../../config/constants";
import { DeliveryProviderFactory } from "../../services/delivery/deliveryProvider.factory";

const revokeSchema = z.object({
  reason: z.string().min(5, "Revocation reason must be at least 5 characters"),
});

export class CertificatesController {
  static async getCertificates(req: AuthenticatedRequest, res: Response) {
    const { status, search, page = "1", limit = "50" } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as CertificateStatus;
    }

    if (search) {
      where.OR = [
        { certificateNumber: { contains: String(search), mode: "insensitive" } },
        { candidate: { fullName: { contains: String(search), mode: "insensitive" } } },
        { courseName: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const take = Math.min(Number(limit) || 50, 100);
    const skip = ((Number(page) || 1) - 1) * take;

    const [total, certificates] = await Promise.all([
      prisma.certificate.count({ where }),
      prisma.certificate.findMany({
        where,
        include: {
          candidate: true,
          batch: {
            select: { batchNumber: true, courseName: true, courseCode: true },
          },
          deliveries: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { issueDate: "desc" },
        take,
        skip,
      }),
    ]);

    return res.json({
      success: true,
      total,
      page: Number(page) || 1,
      totalPages: Math.ceil(total / take),
      certificates,
    });
  }

  static async getCertificateById(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);

    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [{ id }, { certificateNumber: id }],
      },
      include: {
        candidate: true,
        batch: {
          include: { trainingCentre: true },
        },
        batchCandidate: true,
        deliveries: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    return res.json({ success: true, certificate: cert });
  }

  static async downloadPdf(req: Request, res: Response) {
    const id = String(req.params.id);

    const cert: any = await prisma.certificate.findFirst({
      where: {
        OR: [{ id }, { certificateNumber: id }],
      },
      include: {
        candidate: true,
        batch: {
          include: { trainingCentre: true },
        },
        batchCandidate: true,
      },
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    try {
      const pdfBuffer = await PdfService.generateCertificatePdf({
        certificateNumber: cert.certificateNumber,
        candidateName: cert.candidate.fullName,
        fatherName: cert.candidate.fatherName,
        rollNumber: cert.batchCandidate.rollNumber,
        courseName: cert.courseName,
        courseCode: cert.batch.courseCode,
        trainingCentreName: cert.trainingCentreName,
        district: cert.district,
        marksObtained: cert.marksObtained,
        totalMarks: 100,
        percentage: cert.marksObtained,
        grade: cert.grade,
        issueDate: cert.issueDate,
        verificationUrl: cert.qrCodeData,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="CertiFlow_${cert.certificateNumber}.pdf"`
      );
      return res.send(pdfBuffer);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      return res.status(500).json({ success: false, message: "Failed to render PDF certificate" });
    }
  }

  static async revokeCertificate(req: AuthenticatedRequest, res: Response) {
    const user = req.user!;
    const id = String(req.params.id);
    const { reason } = revokeSchema.parse(req.body);

    const cert: any = await prisma.certificate.findFirst({
      where: {
        OR: [{ id }, { certificateNumber: id }],
      },
      include: { candidate: true },
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    if (cert.status === CertificateStatus.REVOKED) {
      return res.status(400).json({
        success: false,
        message: "Certificate is already revoked",
      });
    }

    const updated = await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        status: CertificateStatus.REVOKED,
        revocationReason: reason,
        revokedAt: new Date(),
        revokedBy: user.fullName,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "CERTIFICATE_REVOKED",
      entityType: "Certificate",
      entityId: cert.id,
      batchId: cert.batchId,
      details: {
        certificateNumber: cert.certificateNumber,
        candidateName: cert.candidate.fullName,
        reason,
        revokedBy: user.fullName,
      },
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Certificate ${cert.certificateNumber} has been revoked successfully. Immediate effect applied to public verification.`,
      certificate: updated,
    });
  }

  static async retryDelivery(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);

    const cert: any = await prisma.certificate.findUnique({
      where: { id },
      include: {
        candidate: true,
        deliveries: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    const latestDelivery = cert.deliveries[0];
    if (latestDelivery && latestDelivery.status === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Certificate is already marked as DELIVERED to recipient.",
      });
    }

    const deliveryId = latestDelivery?.id || (await prisma.certificateDelivery.create({
      data: {
        certificateId: cert.id,
        recipientPhone: cert.candidate.phone,
        idempotencyKey: `${cert.certificateNumber}_WA_RETRY_${Date.now()}`,
      },
    })).id;

    await addDeliveryJob({
      deliveryId,
      certificateId: cert.id,
      candidateName: cert.candidate.fullName,
      recipientPhone: cert.candidate.phone,
      certificateNumber: cert.certificateNumber,
      verificationUrl: cert.qrCodeData,
    });

    return res.json({
      success: true,
      message: `Delivery re-enqueued for candidate ${cert.candidate.fullName}`,
    });
  }

  /**
   * Retrieves Delivery Dashboard stats, statuses, and history logs
   */
  static async getDeliverySummary(req: AuthenticatedRequest, res: Response) {
    const provider = DeliveryProviderFactory.getProvider();

    const [total, queued, processing, simulatedSent, retrying, failed, recentDeliveries] =
      await Promise.all([
        prisma.certificateDelivery.count(),
        prisma.certificateDelivery.count({ where: { status: DeliveryStatus.QUEUED } }),
        prisma.certificateDelivery.count({
          where: { status: { in: [DeliveryStatus.PROCESSING, DeliveryStatus.SENDING] } },
        }),
        prisma.certificateDelivery.count({
          where: { status: { in: [DeliveryStatus.SIMULATED_SENT, DeliveryStatus.DELIVERED] } },
        }),
        prisma.certificateDelivery.count({ where: { status: DeliveryStatus.RETRYING } }),
        prisma.certificateDelivery.count({ where: { status: DeliveryStatus.FAILED } }),
        prisma.certificateDelivery.findMany({
          take: 30,
          orderBy: { updatedAt: "desc" },
          include: {
            certificate: {
              include: {
                candidate: true,
                batch: { select: { courseName: true, batchNumber: true } },
              },
            },
          },
        }),
      ]);

    const formattedDeliveries = recentDeliveries.map((d: any) => {
      let parsedLogs = [];
      try {
        if (d.logs) parsedLogs = JSON.parse(d.logs);
      } catch {
        parsedLogs = [];
      }

      return {
        id: d.id,
        certificateId: d.certificateId,
        certificateNumber: d.certificate?.certificateNumber,
        candidateName: d.certificate?.candidate?.fullName,
        recipientPhone: d.recipientPhone,
        courseName: d.certificate?.courseName || d.certificate?.batch?.courseName,
        status: d.status,
        attempts: d.attempts,
        maxAttempts: d.maxAttempts,
        lastError: d.lastError,
        simulatedMessageId: d.simulatedMessageId,
        channel: d.channel,
        dispatchedAt: d.dispatchedAt,
        deliveredAt: d.deliveredAt,
        updatedAt: d.updatedAt,
        logs: parsedLogs,
      };
    });

    return res.json({
      success: true,
      mode: provider.isSimulation ? "DEMO_SIMULATION" : "META_CLOUD_API",
      providerName: provider.name,
      isSimulation: provider.isSimulation,
      notice: DEMO_MODE_NOTICE,
      stats: {
        total,
        queued,
        processing,
        simulatedSent,
        retrying,
        failed,
      },
      deliveries: formattedDeliveries,
    });
  }

  /**
   * Manually retries an individual delivery by ID
   */
  static async retryDeliveryById(req: AuthenticatedRequest, res: Response) {
    const deliveryId = String(req.params.deliveryId);

    const delivery: any = await prisma.certificateDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        certificate: {
          include: { candidate: true },
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Delivery record not found" });
    }

    if (
      delivery.status === DeliveryStatus.SIMULATED_SENT ||
      delivery.status === DeliveryStatus.DELIVERED
    ) {
      return res.status(400).json({
        success: false,
        message: "Certificate is already successfully delivered to candidate.",
      });
    }

    // Reset status to QUEUED
    await prisma.certificateDelivery.update({
      where: { id: delivery.id },
      data: {
        status: DeliveryStatus.QUEUED,
        lastError: null,
      },
    });

    // Re-queue to BullMQ
    await addDeliveryJob({
      deliveryId: delivery.id,
      certificateId: delivery.certificateId,
      candidateName: delivery.certificate.candidate.fullName,
      recipientPhone: delivery.recipientPhone,
      certificateNumber: delivery.certificate.certificateNumber,
      verificationUrl: delivery.certificate.qrCodeData,
    });

    return res.json({
      success: true,
      message: `Delivery re-queued in BullMQ for ${delivery.certificate.candidate.fullName}`,
    });
  }

  /**
   * Generates a dynamic simulated test delivery to demonstrate retry handling live
   */
  static async simulateTestDelivery(req: AuthenticatedRequest, res: Response) {
    const { behavior = "retry" } = req.body; // 'retry', 'permanent_fail', 'success'

    // Pick an existing certificate or create a test one
    const cert: any = await prisma.certificate.findFirst({
      include: { candidate: true },
    });

    if (!cert) {
      return res.status(400).json({ success: false, message: "No certificates found to simulate on" });
    }

    let phone = cert.candidate.phone;
    if (behavior === "retry") {
      phone = "9876540000"; // Trigger attempt 1 fail + BullMQ auto-retry
    } else if (behavior === "permanent_fail") {
      phone = "9876549999"; // Trigger permanent fail
    } else {
      phone = "9876541234"; // Instant success
    }

    const testDeliveryId = `sim-test-${Date.now()}`;
    const delivery = await prisma.certificateDelivery.create({
      data: {
        certificateId: cert.id,
        channel: "WHATSAPP_SIMULATED",
        recipientPhone: phone,
        idempotencyKey: `TEST_SIM_${Date.now()}`,
        status: DeliveryStatus.QUEUED,
        logs: JSON.stringify([
          {
            attempt: 0,
            timestamp: new Date().toISOString(),
            status: "QUEUED",
            testMode: behavior,
          },
        ]),
      },
    });

    await addDeliveryJob({
      deliveryId: delivery.id,
      certificateId: cert.id,
      candidateName: `Test Candidate (${behavior})`,
      recipientPhone: phone,
      certificateNumber: cert.certificateNumber,
      verificationUrl: cert.qrCodeData,
    });

    return res.json({
      success: true,
      message: `Simulated ${behavior} delivery job enqueued in BullMQ. Watch the live worker dashboard update!`,
      deliveryId: delivery.id,
    });
  }
}
