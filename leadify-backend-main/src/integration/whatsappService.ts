import Integration from '../integration/integrationModel';

class WhatsAppService {
    async sendMessage(to: string, message: string) {
        const integration = await Integration.findOne({ where: { provider: 'whatsapp', isActive: true } });
        if (!integration) throw new Error('WhatsApp integration not configured');

        const { phoneNumberId, accessToken } = integration.config;
        const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
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

        return response.json();
    }
}

export default new WhatsAppService();
