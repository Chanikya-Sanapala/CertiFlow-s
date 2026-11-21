import prisma from "../../config/db";
import { CertificateStatus, DeliveryStatus } from "@prisma/client";
import { PdfService } from "../../services/pdfService";
import { addDeliveryJob } from "../../queues/deliveryQueue";
import { DeliveryProviderFactory } from "../../services/delivery/deliveryProvider.factory";

function generateCertNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CRT-2026-${randomPart}`;
}

export class CertificateService {
  /**
   * Issues official certificates for all passed candidates in a batch.
   * Guarantees idempotency: candidates who already have a certificate are skipped.
   * Dispatches one delivery job per eligible candidate via BullMQ.
   */
  static async issueBatchCertificates(batchId: string, issuedBy: string) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        trainingCentre: true,
        candidates: {
          where: { hasPassed: true },
          include: { candidate: true, certificate: true },
        },
      },
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    const issuedCertificates = [];
    const provider = DeliveryProviderFactory.getProvider();

    for (const bc of batch.candidates) {
      // Idempotency: skip if candidate already received certificate for this batch
      if (bc.certificate) {
        continue;
      }

      // Generate unique certificate ID
      let certNumber = generateCertNumber();
      let exists = await prisma.certificate.findUnique({ where: { certificateNumber: certNumber } });
      while (exists) {
        certNumber = generateCertNumber();
        exists = await prisma.certificate.findUnique({ where: { certificateNumber: certNumber } });
      }

      const verificationUrl = `http://localhost:3000/verify/${certNumber}`;
      const qrCodeDataUrl = await PdfService.generateQrCodeDataUrl(verificationUrl);

      const certificate = await prisma.certificate.create({
        data: {
          certificateNumber: certNumber,
          batchId: batch.id,
          candidateId: bc.candidateId,
          batchCandidateId: bc.id,
          courseName: batch.courseName,
          trainingCentreName: batch.trainingCentre.name,
          district: batch.district,
          grade: bc.grade,
          marksObtained: bc.marksObtained,
          qrCodeData: verificationUrl,
          qrCodeImage: qrCodeDataUrl,
          status: CertificateStatus.ISSUED,
        },
      });

      // Create delivery record with unique idempotency key
      const idempotencyKey = `${certNumber}_WA`;
      const delivery = await prisma.certificateDelivery.create({
        data: {
          certificateId: certificate.id,
          channel: provider.isSimulation ? "WHATSAPP_SIMULATED" : "WHATSAPP_META_CLOUD",
          recipientPhone: bc.candidate.phone,
          idempotencyKey,
          status: DeliveryStatus.QUEUED,
          logs: JSON.stringify([
            {
              attempt: 0,
              timestamp: new Date().toISOString(),
              status: "QUEUED",
              provider: provider.name,
              isSimulation: provider.isSimulation,
            },
          ]),
        },
      });

      // Dispatch to BullMQ background queue (one job per candidate)
      try {
        await addDeliveryJob({
          deliveryId: delivery.id,
          certificateId: certificate.id,
          candidateName: bc.candidate.fullName,
          recipientPhone: bc.candidate.phone,
          certificateNumber: certNumber,
          verificationUrl,
        });
      } catch (queueErr) {
        console.warn("Could not queue to Redis, executing inline delivery fallback:", queueErr);
        try {
          const result = await provider.sendCertificateNotification(
            {
              deliveryId: delivery.id,
              certificateId: certificate.id,
              certificateNumber: certNumber,
              candidateName: bc.candidate.fullName,
              recipientPhone: bc.candidate.phone,
              verificationUrl,
            },
            1
          );

          await prisma.certificateDelivery.update({
            where: { id: delivery.id },
            data: {
              status: result.status as DeliveryStatus,
              deliveredAt: result.deliveredAt,
              simulatedMessageId: result.messageId,
              logs: JSON.stringify([
                {
                  attempt: 1,
                  timestamp: new Date().toISOString(),
                  status: result.status,
                  messageId: result.messageId,
                  mode: "INLINE_FALLBACK",
                },
              ]),
            },
          });
        } catch (simErr: any) {
          await prisma.certificateDelivery.update({
            where: { id: delivery.id },
            data: {
              status: DeliveryStatus.FAILED,
              lastError: simErr.message,
            },
          });
        }
      }

      issuedCertificates.push(certificate);
    }

    return {
      batchId,
      totalPassed: batch.candidates.length,
      issuedCount: issuedCertificates.length,
      issuedCertificates,
    };
  }
}
