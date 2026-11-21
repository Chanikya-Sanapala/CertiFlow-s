import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis";
import { DELIVERY_QUEUE_NAME, DeliveryJobData } from "../queues/deliveryQueue";
import prisma from "../config/db";
import { DeliveryStatus } from "@prisma/client";
import { DeliveryProviderFactory } from "../services/delivery/deliveryProvider.factory";

export const deliveryWorker = new Worker<DeliveryJobData>(
  DELIVERY_QUEUE_NAME,
  async (job: Job<DeliveryJobData>) => {
    const { deliveryId, certificateId, candidateName, recipientPhone, certificateNumber, verificationUrl } = job.data;
    const currentAttempt = job.attemptsMade + 1;
    const provider = DeliveryProviderFactory.getProvider();

    console.log(
      `[Worker:WhatsApp] Processing delivery for ${candidateName} (${certificateNumber}) - Attempt ${currentAttempt}/${job.opts.attempts || 3} using ${provider.name}`
    );

    // 1. Database Idempotency Guard
    const existing = await prisma.certificateDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!existing) {
      console.warn(`[Worker:WhatsApp] Delivery record ${deliveryId} not found, skipping.`);
      return;
    }

    // Skip if already successfully sent or delivered (Idempotency)
    if (
      existing.status === DeliveryStatus.SIMULATED_SENT ||
      existing.status === DeliveryStatus.DELIVERED
    ) {
      console.log(
        `[Worker:WhatsApp] Certificate ${certificateNumber} already marked as ${existing.status}. Skipping duplicate delivery.`
      );
      return;
    }

    // Parse existing delivery history logs
    let history: any[] = [];
    try {
      if (existing.logs) {
        history = JSON.parse(existing.logs);
      }
    } catch {
      history = [];
    }

    // 2. Set status to PROCESSING
    await prisma.certificateDelivery.update({
      where: { id: deliveryId },
      data: {
        status: DeliveryStatus.PROCESSING,
        attempts: currentAttempt,
        dispatchedAt: existing.dispatchedAt || new Date(),
      },
    });

    try {
      // 3. Delegate to Delivery Provider (Simulated or Meta Cloud)
      const result = await provider.sendCertificateNotification(
        {
          deliveryId,
          certificateId,
          certificateNumber,
          candidateName,
          recipientPhone,
          verificationUrl,
        },
        currentAttempt
      );

      // Record successful delivery in history logs
      history.push({
        attempt: currentAttempt,
        timestamp: new Date().toISOString(),
        status: result.status,
        messageId: result.messageId,
        provider: provider.name,
        isSimulation: provider.isSimulation,
        notice: result.notice,
      });

      // 4. Update database to SIMULATED_SENT (or DELIVERED)
      await prisma.certificateDelivery.update({
        where: { id: deliveryId },
        data: {
          status: result.status as DeliveryStatus,
          deliveredAt: result.deliveredAt,
          simulatedMessageId: result.messageId,
          lastError: null,
          logs: JSON.stringify(history),
        },
      });

      console.log(
        `[Worker:WhatsApp] ✅ [${result.status}] Delivered certificate ${certificateNumber} to ${recipientPhone} (ID: ${result.messageId})`
      );
    } catch (error: any) {
      const maxAttempts = job.opts.attempts || 3;
      const isLastAttempt = currentAttempt >= maxAttempts;
      const newStatus = isLastAttempt ? DeliveryStatus.FAILED : DeliveryStatus.RETRYING;

      console.error(
        `[Worker:WhatsApp] ⚠️ Delivery attempt ${currentAttempt}/${maxAttempts} failed for ${certificateNumber}: ${error.message}`
      );

      // Record failure in history logs
      history.push({
        attempt: currentAttempt,
        timestamp: new Date().toISOString(),
        status: newStatus,
        error: error.message,
        provider: provider.name,
        isSimulation: provider.isSimulation,
      });

      await prisma.certificateDelivery.update({
        where: { id: deliveryId },
        data: {
          status: newStatus,
          attempts: currentAttempt,
          lastError: error.message,
          logs: JSON.stringify(history),
        },
      });

      // Re-throw so BullMQ triggers exponential backoff retry
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

deliveryWorker.on("completed", (job) => {
  console.log(`[Worker:WhatsApp] Job ${job.id} completed successfully.`);
});

deliveryWorker.on("failed", (job, err) => {
  console.log(`[Worker:WhatsApp] Job ${job?.id} failed with error: ${err.message}`);
});
