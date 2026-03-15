// ─── Mailchimp Email Marketing Provider ──────────────────────────────────────
import logger from '../config/logger';
// Uses Mailchimp Marketing API when MAILCHIMP_API_KEY is set, otherwise returns mock data.

export interface MailchimpListInput {
  name: string;
  permissionReminder: string;
  emailTypeOption: boolean;
  campaignDefaults: {
    fromName: string;
    fromEmail: string;
    subject: string;
    language: string;
  };
}

export interface MailchimpCampaignInput {
  listId: string;
  subject: string;
  fromName: string;
  replyTo: string;
  templateId?: number;
  htmlContent?: string;
}

export interface MailchimpContactInput {
  listId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  mergeFields?: Record<string, string>;
}

export interface MailchimpResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  mock: boolean;
}

export class MailchimpProvider {
  private baseUrl: string | null = null;
  private apiKey: string | null = null;

  static isConfigured(): boolean {
    return !!process.env.MAILCHIMP_API_KEY;
  }

  private getAuth(): { baseUrl: string; headers: Record<string, string> } | null {
    if (!this.apiKey && MailchimpProvider.isConfigured()) {
      this.apiKey = process.env.MAILCHIMP_API_KEY!;
      const server = process.env.MAILCHIMP_SERVER_PREFIX || (this.apiKey || '').split('-').pop() || 'us1';
      this.baseUrl = `https://${server}.api.mailchimp.com/3.0`;
    }
    if (!this.apiKey || !this.baseUrl) return null;
    return {
      baseUrl: this.baseUrl,
      headers: {
        Authorization: `apikey ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    };
  }

  async getLists(): Promise<MailchimpResult<Array<{ id: string; name: string; memberCount: number }>>> {
    try {
      const auth = this.getAuth();
      if (auth) {
        const response = await fetch(`${auth.baseUrl}/lists?count=50`, {
          headers: auth.headers,
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
          return { success: false, data: null, error: `Mailchimp error: ${response.status}`, mock: false };
        }
        const body = (await response.json()) as { lists: Array<{ id: string; name: string; stats: { member_count: number } }> };
        const lists = body.lists.map(l => ({
          id: l.id,
          name: l.name,
          memberCount: l.stats.member_count
        }));
        return { success: true, data: lists, mock: false };
      }
      return {
        success: true,
        data: [
          { id: 'mock_list_1', name: 'Main Newsletter', memberCount: 2500 },
          { id: 'mock_list_2', name: 'Product Updates', memberCount: 850 }
        ],
        mock: true
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to get lists';
      logger.error('[MailchimpProvider] getLists error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !MailchimpProvider.isConfigured() };
    }
  }

  async addContact(input: MailchimpContactInput): Promise<MailchimpResult<{ id: string; email: string; status: string }>> {
    try {
      const auth = this.getAuth();
      if (auth) {
        const response = await fetch(`${auth.baseUrl}/lists/${input.listId}/members`, {
          method: 'POST',
          headers: auth.headers,
          body: JSON.stringify({
            email_address: input.email,
            status: 'subscribed',
            merge_fields: {
              FNAME: input.firstName || '',
              LNAME: input.lastName || '',
              ...input.mergeFields
            },
            tags: input.tags || []
          }),
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
          const errorBody = (await response.json()) as { detail?: string };
          return { success: false, data: null, error: errorBody.detail || `HTTP ${response.status}`, mock: false };
        }
        const result = (await response.json()) as { id: string; email_address: string; status: string };
        return { success: true, data: { id: result.id, email: result.email_address, status: result.status }, mock: false };
      }
      return { success: true, data: { id: `mock_member_${Date.now()}`, email: input.email, status: 'subscribed' }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to add contact';
      logger.error('[MailchimpProvider] addContact error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !MailchimpProvider.isConfigured() };
    }
  }

  async syncContacts(
    listId: string,
    contacts: Array<{ email: string; firstName?: string; lastName?: string }>
  ): Promise<MailchimpResult<{ added: number; updated: number; errors: number }>> {
    try {
      const auth = this.getAuth();
      if (auth) {
        const operations = contacts.map(c => ({
          method: 'PUT',
          path: `/lists/${listId}/members/${this.emailHash(c.email)}`,
          body: JSON.stringify({
            email_address: c.email,
            status_if_new: 'subscribed',
            merge_fields: { FNAME: c.firstName || '', LNAME: c.lastName || '' }
          })
        }));

        const response = await fetch(`${auth.baseUrl}/batches`, {
          method: 'POST',
          headers: auth.headers,
          body: JSON.stringify({ operations }),
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          return { success: false, data: null, error: `Mailchimp batch error: ${response.status}`, mock: false };
        }
        return { success: true, data: { added: contacts.length, updated: 0, errors: 0 }, mock: false };
      }
      return { success: true, data: { added: contacts.length, updated: 0, errors: 0 }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to sync contacts';
      logger.error('[MailchimpProvider] syncContacts error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !MailchimpProvider.isConfigured() };
    }
  }

  async createCampaign(input: MailchimpCampaignInput): Promise<MailchimpResult<{ id: string; webId: number; status: string }>> {
    try {
      const auth = this.getAuth();
      if (auth) {
        // Create campaign
        const campaignResponse = await fetch(`${auth.baseUrl}/campaigns`, {
          method: 'POST',
          headers: auth.headers,
          body: JSON.stringify({
            type: 'regular',
            recipients: { list_id: input.listId },
            settings: {
              subject_line: input.subject,
              from_name: input.fromName,
              reply_to: input.replyTo
            }
          }),
          signal: AbortSignal.timeout(10000)
        });
        if (!campaignResponse.ok) {
          return { success: false, data: null, error: `Campaign creation failed: ${campaignResponse.status}`, mock: false };
        }
        const campaign = (await campaignResponse.json()) as { id: string; web_id: number; status: string };

        // Set campaign content if provided
        if (input.htmlContent) {
          await fetch(`${auth.baseUrl}/campaigns/${campaign.id}/content`, {
            method: 'PUT',
            headers: auth.headers,
            body: JSON.stringify({ html: input.htmlContent }),
            signal: AbortSignal.timeout(10000)
          });
        }

        return { success: true, data: { id: campaign.id, webId: campaign.web_id, status: campaign.status }, mock: false };
      }
      return { success: true, data: { id: `mock_campaign_${Date.now()}`, webId: 12345, status: 'save' }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create campaign';
      logger.error('[MailchimpProvider] createCampaign error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !MailchimpProvider.isConfigured() };
    }
  }

  async getCampaignStats(
    campaignId: string
  ): Promise<MailchimpResult<{ sent: number; opens: number; clicks: number; bounces: number; unsubscribes: number }>> {
    try {
      const auth = this.getAuth();
      if (auth) {
        const response = await fetch(`${auth.baseUrl}/reports/${campaignId}`, {
          headers: auth.headers,
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
          return { success: false, data: null, error: `Report fetch failed: ${response.status}`, mock: false };
        }
        const report = (await response.json()) as {
          emails_sent: number;
          opens: { unique_opens: number };
          clicks: { unique_clicks: number };
          bounces: { hard_bounces: number; soft_bounces: number };
          unsubscribed: number;
        };
        return {
          success: true,
          data: {
            sent: report.emails_sent,
            opens: report.opens.unique_opens,
            clicks: report.clicks.unique_clicks,
            bounces: report.bounces.hard_bounces + report.bounces.soft_bounces,
            unsubscribes: report.unsubscribed
          },
          mock: false
        };
      }
      return { success: true, data: { sent: 2500, opens: 890, clicks: 156, bounces: 23, unsubscribes: 5 }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to get campaign stats';
      logger.error('[MailchimpProvider] getCampaignStats error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !MailchimpProvider.isConfigured() };
    }
  }

  private emailHash(email: string): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  }
}

export default new MailchimpProvider();
