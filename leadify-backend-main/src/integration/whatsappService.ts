import Integration from '../integration/integrationModel';

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
}

class WhatsAppService {
  async sendMessage(to: string, message: string): Promise<Record<string, unknown>> {
    const integration = await Integration.findOne({ where: { provider: 'whatsapp', isActive: true } });
    if (!integration) throw new Error('WhatsApp integration not configured');

    const config = integration.config as WhatsAppConfig | undefined;
    if (!config?.phoneNumberId || !config?.accessToken) {
      throw new Error('WhatsApp config missing phoneNumberId or accessToken');
    }

    const url = `https://graph.facebook.com/v17.0/${config.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    return response.json() as Promise<Record<string, unknown>>;
  }
}

export default new WhatsAppService();
