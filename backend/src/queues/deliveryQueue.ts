import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export interface DeliveryJobData {
  deliveryId: string;
  certificateId: string;
  candidateName: string;
  recipientPhone: string;
  certificateNumber: string;
  verificationUrl: string;
  attemptNumber?: number;
}

export const DELIVERY_QUEUE_NAME = "certificate-whatsapp-delivery";

export const deliveryQueue = new Queue<DeliveryJobData>(DELIVERY_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const addDeliveryJob = async (data: DeliveryJobData) => {
  return deliveryQueue.add(`deliver-${data.certificateNumber}`, data, {
    jobId: data.deliveryId, // Ensure deduplication at queue level
  });
};

