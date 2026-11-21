import { IDeliveryProvider, DeliveryPayload, DeliveryResult } from "./deliveryProvider.interface";

/**
 * Production-ready Meta WhatsApp Cloud API Provider.
 * Allows effortless transition from demo simulation to official Meta Cloud API
 * without altering core certificate generation, batch approval, or BullMQ pipelines.
 */
export class MetaWhatsAppCloudProvider implements IDeliveryProvider {
  readonly name = "META_WHATSAPP_CLOUD_API";
  readonly isSimulation = false;

  private token = process.env.META_WHATSAPP_TOKEN || "";
  private phoneNumberId = process.env.META_PHONE_NUMBER_ID || "";

  async sendCertificateNotification(payload: DeliveryPayload, attemptNumber: number): Promise<DeliveryResult> {
    if (!this.token || !this.phoneNumberId) {
      throw new Error(
        "Meta WhatsApp Cloud API credentials not configured. Please set META_WHATSAPP_TOKEN and META_PHONE_NUMBER_ID."
      );
    }

    const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;

    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: payload.recipientPhone,
      type: "template",
      template: {
        name: "skill_certificate_issued",
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "document",
                document: {
                  link: `https://certiflow.gov/api/certificates/${payload.certificateNumber}/pdf`,
                  filename: `CertiFlow_${payload.certificateNumber}.pdf`,
                },
              },
            ],
          },
          {
            type: "body",
            parameters: [
              { type: "text", text: payload.candidateName },
              { type: "text", text: payload.courseName || "Vocational Certification" },
              { type: "text", text: payload.certificateNumber },
              { type: "text", text: payload.verificationUrl },
            ],
          },
        ],
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(
        `Meta WhatsApp Cloud API Error (${response.status}): ${JSON.stringify(data.error || data)}`
      );
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id || `wamid.META_${Date.now()}`,
      channel: "WHATSAPP_META_CLOUD",
      provider: this.name,
      deliveredAt: new Date(),
      status: "DELIVERED",
    };
  }
}

