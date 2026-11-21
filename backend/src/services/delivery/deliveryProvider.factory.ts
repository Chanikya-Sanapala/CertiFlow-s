import { IDeliveryProvider } from "./deliveryProvider.interface";
import { SimulatedDeliveryProvider } from "./simulatedDeliveryProvider";
import { MetaWhatsAppCloudProvider } from "./metaWhatsAppProvider";
import { WHATSAPP_DELIVERY_MODE } from "../../config/constants";

export class DeliveryProviderFactory {
  private static instance: IDeliveryProvider | null = null;

  static getProvider(): IDeliveryProvider {
    if (!this.instance) {
      if (WHATSAPP_DELIVERY_MODE === "META_CLOUD_API") {
        this.instance = new MetaWhatsAppCloudProvider();
      } else {
        this.instance = new SimulatedDeliveryProvider();
      }
    }
    return this.instance;
  }

  // Allow setting or resetting provider for tests or live configuration changes
  static setProvider(provider: IDeliveryProvider | null) {
    this.instance = provider;
  }
}

