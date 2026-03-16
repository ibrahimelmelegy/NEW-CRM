// ─── WhatsApp Business API Provider ──────────────────────────────────────────
import logger from '../../config/logger';
// Uses Meta's WhatsApp Business Cloud API when configured, otherwise returns mock data.
// Env vars: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_WEBHOOK_VERIFY_TOKEN

const WHATSAPP_API_VERSION = 'v17.0';
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

export interface WhatsAppMessageInput {
  to: string;
  body: string;
}

export interface WhatsAppTemplateInput {
  to: string;
  templateName: string;
  languageCode: string;
  components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: Array<{ type: 'text' | 'image' | 'document'; text?: string; image?: { link: string } }>;
}

export interface WhatsAppMediaInput {
  to: string;
  type: 'image' | 'document' | 'audio' | 'video';
  mediaUrl: string;
  caption?: string;
  filename?: string;
}

export interface WhatsAppResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  mock: boolean;
}

export class WhatsAppProvider {
  static isConfigured(): boolean {
    return !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
  }

  private getConfig(): { phoneNumberId: string; accessToken: string } | null {
    if (!WhatsAppProvider.isConfigured()) return null;
    return {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!
    };
  }

  private getHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  async sendTextMessage(input: WhatsAppMessageInput): Promise<WhatsAppResult<{ messageId: string; status: string }>> {
    try {
      const config = this.getConfig();
      if (config) {
        const response = await fetch(`${WHATSAPP_API_BASE}/${config.phoneNumberId}/messages`, {
          method: 'POST',
          headers: this.getHeaders(config.accessToken),
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: input.to,
            type: 'text',
            text: { body: input.body }
          }),
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
          const errorBody = (await response.json()) as { error?: { message?: string } };
          return { success: false, data: null, error: errorBody.error?.message || `HTTP ${response.status}`, mock: false };
        }
        const result = (await response.json()) as { messages: Array<{ id: string }> };
        return { success: true, data: { messageId: result.messages[0]?.id || '', status: 'sent' }, mock: false };
      }
      return { success: true, data: { messageId: `mock_wa_${Date.now()}`, status: 'sent' }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send WhatsApp message';
      logger.error('[WhatsAppProvider] sendTextMessage error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !WhatsAppProvider.isConfigured() };
    }
  }

  async sendTemplateMessage(input: WhatsAppTemplateInput): Promise<WhatsAppResult<{ messageId: string; status: string }>> {
    try {
      const config = this.getConfig();
      if (config) {
        const templatePayload: Record<string, unknown> = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: input.to,
          type: 'template',
          template: {
            name: input.templateName,
            language: { code: input.languageCode },
            components: input.components || []
          }
        };

        const response = await fetch(`${WHATSAPP_API_BASE}/${config.phoneNumberId}/messages`, {
          method: 'POST',
          headers: this.getHeaders(config.accessToken),
          body: JSON.stringify(templatePayload),
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
          const errorBody = (await response.json()) as { error?: { message?: string } };
          return { success: false, data: null, error: errorBody.error?.message || `HTTP ${response.status}`, mock: false };
        }
        const result = (await response.json()) as { messages: Array<{ id: string }> };
        return { success: true, data: { messageId: result.messages[0]?.id || '', status: 'sent' }, mock: false };
      }
      return { success: true, data: { messageId: `mock_wa_tpl_${Date.now()}`, status: 'sent' }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send template message';
      logger.error('[WhatsAppProvider] sendTemplateMessage error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !WhatsAppProvider.isConfigured() };
    }
  }

  async sendMediaMessage(input: WhatsAppMediaInput): Promise<WhatsAppResult<{ messageId: string; status: string }>> {
    try {
      const config = this.getConfig();
      if (config) {
        const mediaPayload: Record<string, unknown> = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: input.to,
          type: input.type
        };

        // Build the media object based on type
        const mediaObj: Record<string, unknown> = { link: input.mediaUrl };
        if (input.caption) mediaObj.caption = input.caption;
        if (input.filename && input.type === 'document') mediaObj.filename = input.filename;
        mediaPayload[input.type] = mediaObj;

        const response = await fetch(`${WHATSAPP_API_BASE}/${config.phoneNumberId}/messages`, {
          method: 'POST',
          headers: this.getHeaders(config.accessToken),
          body: JSON.stringify(mediaPayload),
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
          const errorBody = (await response.json()) as { error?: { message?: string } };
          return { success: false, data: null, error: errorBody.error?.message || `HTTP ${response.status}`, mock: false };
        }
        const result = (await response.json()) as { messages: Array<{ id: string }> };
        return { success: true, data: { messageId: result.messages[0]?.id || '', status: 'sent' }, mock: false };
      }
      return { success: true, data: { messageId: `mock_wa_media_${Date.now()}`, status: 'sent' }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send media message';
      logger.error('[WhatsAppProvider] sendMediaMessage error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !WhatsAppProvider.isConfigured() };
    }
  }

  async getMessageTemplates(): Promise<WhatsAppResult<Array<{ name: string; status: string; language: string; category: string }>>> {
    try {
      const config = this.getConfig();
      if (config) {
        const businessId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
        if (!businessId) {
          return { success: false, data: null, error: 'WHATSAPP_BUSINESS_ACCOUNT_ID not set', mock: false };
        }
        const response = await fetch(`${WHATSAPP_API_BASE}/${businessId}/message_templates`, {
          headers: this.getHeaders(config.accessToken),
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
          return { success: false, data: null, error: `HTTP ${response.status}`, mock: false };
        }
        const body = (await response.json()) as { data: Array<{ name: string; status: string; language: string; category: string }> };
        return { success: true, data: body.data, mock: false };
      }
      return {
        success: true,
        data: [
          { name: 'welcome_message', status: 'APPROVED', language: 'en_US', category: 'MARKETING' },
          { name: 'order_confirmation', status: 'APPROVED', language: 'en_US', category: 'UTILITY' },
          { name: 'appointment_reminder', status: 'APPROVED', language: 'en_US', category: 'UTILITY' }
        ],
        mock: true
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to get templates';
      logger.error('[WhatsAppProvider] getMessageTemplates error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !WhatsAppProvider.isConfigured() };
    }
  }

  /**
   * Verify incoming webhook from Meta (used during webhook setup).
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'leadify_wa_verify';
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Parse incoming webhook payload from Meta WhatsApp Business API.
   */
  parseWebhookPayload(body: Record<string, unknown>): WhatsAppWebhookEvent[] {
    const events: WhatsAppWebhookEvent[] = [];
    try {
      const entry = body.entry as Array<{ changes: Array<{ value: Record<string, unknown> }> }>;
      if (!entry) return events;

      for (const e of entry) {
        for (const change of e.changes || []) {
          const value = change.value;
          // Incoming messages
          const messages = value.messages as
            | Array<{ id: string; from: string; timestamp: string; type: string; text?: { body: string } }>
            | undefined;
          if (messages) {
            for (const msg of messages) {
              events.push({
                type: 'message',
                messageId: msg.id,
                from: msg.from,
                timestamp: msg.timestamp,
                messageType: msg.type,
                text: msg.text?.body
              });
            }
          }
          // Status updates
          const statuses = value.statuses as Array<{ id: string; status: string; timestamp: string; recipient_id: string }> | undefined;
          if (statuses) {
            for (const status of statuses) {
              events.push({
                type: 'status',
                messageId: status.id,
                from: status.recipient_id,
                timestamp: status.timestamp,
                messageType: 'status',
                text: status.status
              });
            }
          }
        }
      }
    } catch (err) {
      logger.error('[WhatsAppProvider] parseWebhookPayload error:', err);
    }
    return events;
  }
}

export interface WhatsAppWebhookEvent {
  type: 'message' | 'status';
  messageId: string;
  from: string;
  timestamp: string;
  messageType: string;
  text?: string;
}

export default new WhatsAppProvider();
