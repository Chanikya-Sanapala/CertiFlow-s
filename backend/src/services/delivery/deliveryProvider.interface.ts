export interface DeliveryPayload {
  deliveryId: string;
  certificateId: string;
  certificateNumber: string;
  candidateName: string;
  recipientPhone: string;
  verificationUrl: string;
  courseName?: string;
  trainingCentreName?: string;
}

export interface DeliveryResult {
  success: boolean;
  messageId: string;
  channel: string;
  provider: string;
  deliveredAt: Date;
  status: "SIMULATED_SENT" | "DELIVERED";
  error?: string;
  notice?: string;
}

export interface IDeliveryProvider {
  readonly name: string;
  readonly isSimulation: boolean;
  sendCertificateNotification(payload: DeliveryPayload, attemptNumber: number): Promise<DeliveryResult>;
}

