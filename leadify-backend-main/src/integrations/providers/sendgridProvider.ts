// ─── SendGrid Email Service Provider ─────────────────────────────────────────
import logger from '../config/logger';
// Uses real SendGrid SDK when SENDGRID_API_KEY is set, otherwise returns mock data.

export interface EmailInput {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface BulkEmailInput {
  recipients: string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface TemplateEmailInput {
  to: string;
  from?: string;
  templateId: string;
  dynamicData?: Record<string, any>;
}

export interface EmailResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  mock: boolean;
}

export class SendGridProvider {
  private sgMail: any = null;

  static isConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }

  private getClient() {
    if (!this.sgMail && SendGridProvider.isConfigured()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.sgMail = sgMail;
      } catch (err) {
        logger.error('[SendGridProvider] Failed to initialize SendGrid SDK:', err);
      }
    }
    return this.sgMail;
  }

  private getDefaultFrom(): string {
    return process.env.SENDGRID_FROM_EMAIL || 'noreply@leadify.app';
  }

  async sendEmail(input: EmailInput): Promise<EmailResult<{ messageId: string }>> {
    try {
      const client = this.getClient();
      if (client) {
        const [response] = await client.send({
          to: input.to,
          from: input.from || this.getDefaultFrom(),
          subject: input.subject,
          text: input.text,
          html: input.html
        });
        return { success: true, data: { messageId: response.headers['x-message-id'] || `sg_${Date.now()}` }, mock: false };
      }
      return { success: true, data: { messageId: `mock_msg_${Date.now()}` }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[SendGridProvider] sendEmail error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SendGridProvider.isConfigured() };
    }
  }

  async sendBulkEmail(input: BulkEmailInput): Promise<EmailResult<{ messageCount: number; messageIds: string[] }>> {
    try {
      const client = this.getClient();
      if (client) {
        const messages = input.recipients.map(to => ({
          to,
          from: input.from || this.getDefaultFrom(),
          subject: input.subject,
          text: input.text,
          html: input.html
        }));
        await client.send(messages);
        return { success: true, data: { messageCount: messages.length, messageIds: messages.map(() => `sg_${Date.now()}`) }, mock: false };
      }
      const ids = input.recipients.map((_, i) => `mock_bulk_${Date.now()}_${i}`);
      return { success: true, data: { messageCount: input.recipients.length, messageIds: ids }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[SendGridProvider] sendBulkEmail error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SendGridProvider.isConfigured() };
    }
  }

  async sendTemplateEmail(input: TemplateEmailInput): Promise<EmailResult<{ messageId: string }>> {
    try {
      const client = this.getClient();
      if (client) {
        const [response] = await client.send({
          to: input.to,
          from: input.from || this.getDefaultFrom(),
          templateId: input.templateId,
          dynamicTemplateData: input.dynamicData
        });
        return { success: true, data: { messageId: response.headers['x-message-id'] || `sg_tpl_${Date.now()}` }, mock: false };
      }
      return { success: true, data: { messageId: `mock_tpl_${Date.now()}` }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[SendGridProvider] sendTemplateEmail error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SendGridProvider.isConfigured() };
    }
  }

  async getEmailStats(
    startDate?: string,
    endDate?: string
  ): Promise<EmailResult<{ delivered: number; opens: number; clicks: number; bounces: number }>> {
    try {
      if (SendGridProvider.isConfigured()) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sgClient = require('@sendgrid/client');
        sgClient.setApiKey(process.env.SENDGRID_API_KEY);
        const queryParams: Record<string, unknown> = {};
        if (startDate) queryParams.start_date = startDate;
        if (endDate) queryParams.end_date = endDate;
        const [, body] = await sgClient.request({ method: 'GET', url: '/v3/stats', qs: queryParams });
        const totals = (body as any[]).reduce(
          (acc: any, day: any) => {
            const m = day.stats?.[0]?.metrics || {};
            acc.delivered += m.delivered || 0;
            acc.opens += m.unique_opens || 0;
            acc.clicks += m.unique_clicks || 0;
            acc.bounces += m.bounces || 0;
            return acc;
          },
          { delivered: 0, opens: 0, clicks: 0, bounces: 0 }
        );
        return { success: true, data: totals, mock: false };
      }
      return { success: true, data: { delivered: 1250, opens: 430, clicks: 85, bounces: 12 }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[SendGridProvider] getEmailStats error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SendGridProvider.isConfigured() };
    }
  }
}

export default new SendGridProvider();
