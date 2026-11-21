import { IDeliveryProvider, DeliveryPayload, DeliveryResult } from "./deliveryProvider.interface";
import { SIMULATED_DELIVERY_FAILURE_RATE, DEMO_MODE_NOTICE } from "../../config/constants";

export class SimulatedDeliveryProvider implements IDeliveryProvider {
  readonly name = "SIMULATED_WHATSAPP_GATEWAY";
  readonly isSimulation = true;

  async sendCertificateNotification(payload: DeliveryPayload, attemptNumber: number): Promise<DeliveryResult> {
    // Realistic gateway processing latency: 250ms - 400ms
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Configurable simulated failure rules for deterministic reviewer demonstrations:
    // 1. If recipient phone ends with '0000' or contains 'FAIL': deliberately fail attempt 1 to showcase retry handling
    // 2. If recipient phone ends with '9999' or contains 'PERM': deliberately fail all attempts to demonstrate permanent failure
    // 3. Otherwise, apply probabilistic transient failure rate (default 15% on attempt 1 only)
    const phone = payload.recipientPhone || "";
    const isExplicitRetryTrigger = phone.endsWith("0000") || phone.includes("FAIL");
    const isExplicitPermanentFail = phone.endsWith("9999") || phone.includes("PERM");

    if (isExplicitPermanentFail) {
      throw new Error(
        "Simulated WhatsApp Gateway: 404 Recipient Phone Invalid — Not registered on WhatsApp network"
      );
    }

    if (
      (attemptNumber === 1 && isExplicitRetryTrigger) ||
      (attemptNumber === 1 && Math.random() < SIMULATED_DELIVERY_FAILURE_RATE)
    ) {
      throw new Error(
        "Simulated WhatsApp Gateway: 504 Gateway Timeout from Telco Aggregator (BullMQ automatic retry scheduled)"
      );
    }

    // Generate realistic simulated WhatsApp message ID
    const randomSuffix = Math.random().toString(36).substring(2, 9).toUpperCase();
    const simulatedMessageId = `wamid.SIM_${Date.now()}_${randomSuffix}`;

    return {
      success: true,
      messageId: simulatedMessageId,
      channel: "WHATSAPP_SIMULATED",
      provider: this.name,
      deliveredAt: new Date(),
      status: "SIMULATED_SENT",
      notice: DEMO_MODE_NOTICE,
    };
  }
}

