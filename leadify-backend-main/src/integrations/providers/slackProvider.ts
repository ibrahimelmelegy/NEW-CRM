// ─── Slack Integration Provider ──────────────────────────────────────────────
import logger from '../config/logger';
// Full-featured Slack provider that works with both Incoming Webhooks and Web API.
// Uses SLACK_BOT_TOKEN for Web API features, SLACK_WEBHOOK_URL for basic messaging.

export interface SlackMessageInput {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  threadTs?: string;
}

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: Array<{ type: string; text: string }>;
  elements?: Array<{ type: string; text: string }>;
}

export interface SlackNotificationInput {
  channel: string;
  title: string;
  details: Record<string, string>;
  color?: string;
}

export interface SlackResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  mock: boolean;
}

export class SlackProvider {
  static isConfigured(): boolean {
    return !!(process.env.SLACK_BOT_TOKEN || process.env.SLACK_WEBHOOK_URL);
  }

  private getToken(): string | null {
    return process.env.SLACK_BOT_TOKEN || null;
  }

  private getWebhookUrl(): string | null {
    return process.env.SLACK_WEBHOOK_URL || null;
  }

  private getApiHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    };
  }

  async sendMessage(input: SlackMessageInput): Promise<SlackResult<{ ts: string; channel: string }>> {
    try {
      const token = this.getToken();
      if (token) {
        const response = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: this.getApiHeaders(),
          body: JSON.stringify({
            channel: input.channel,
            text: input.text,
            blocks: input.blocks,
            thread_ts: input.threadTs
          }),
          signal: AbortSignal.timeout(10000)
        });
        const body = (await response.json()) as { ok: boolean; ts?: string; channel?: string; error?: string };
        if (body.ok) {
          return { success: true, data: { ts: body.ts || '', channel: body.channel || input.channel }, mock: false };
        }
        return { success: false, data: null, error: body.error || 'Slack API error', mock: false };
      }

      // Fall back to webhook
      const webhookUrl = this.getWebhookUrl();
      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input.text, channel: input.channel }),
          signal: AbortSignal.timeout(10000)
        });
        if (response.ok) {
          return { success: true, data: { ts: `wh_${Date.now()}`, channel: input.channel }, mock: false };
        }
        return { success: false, data: null, error: `Webhook error: ${response.status}`, mock: false };
      }

      return { success: true, data: { ts: `mock_ts_${Date.now()}`, channel: input.channel }, mock: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send Slack message';
      logger.error('[SlackProvider] sendMessage error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SlackProvider.isConfigured() };
    }
  }

  async sendCrmNotification(input: SlackNotificationInput): Promise<SlackResult<{ ts: string }>> {
    try {
      const fields = Object.entries(input.details).map(([key, value]) => ({
        type: 'mrkdwn',
        text: `*${key}:*\n${value}`
      }));

      const blocks: SlackBlock[] = [
        {
          type: 'header',
          text: { type: 'plain_text', text: input.title, emoji: true }
        },
        {
          type: 'section',
          fields
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `Sent from *CRM* at ${new Date().toISOString()}` }]
        }
      ];

      const result = await this.sendMessage({
        channel: input.channel,
        text: input.title,
        blocks
      });

      return {
        success: result.success,
        data: result.data ? { ts: result.data.ts } : null,
        error: result.error,
        mock: result.mock
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send notification';
      logger.error('[SlackProvider] sendCrmNotification error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SlackProvider.isConfigured() };
    }
  }

  async listChannels(): Promise<SlackResult<Array<{ id: string; name: string; isPrivate: boolean; memberCount: number }>>> {
    try {
      const token = this.getToken();
      if (token) {
        const response = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200', {
          headers: this.getApiHeaders(),
          signal: AbortSignal.timeout(10000)
        });
        const body = (await response.json()) as {
          ok: boolean;
          channels?: Array<{ id: string; name: string; is_private: boolean; num_members: number }>;
          error?: string;
        };
        if (body.ok && body.channels) {
          const channels = body.channels.map(c => ({
            id: c.id,
            name: c.name,
            isPrivate: c.is_private,
            memberCount: c.num_members
          }));
          return { success: true, data: channels, mock: false };
        }
        return { success: false, data: null, error: body.error || 'Failed to list channels', mock: false };
      }
      return {
        success: true,
        data: [
          { id: 'C01MOCK', name: 'general', isPrivate: false, memberCount: 50 },
          { id: 'C02MOCK', name: 'sales', isPrivate: false, memberCount: 15 },
          { id: 'C03MOCK', name: 'support', isPrivate: true, memberCount: 8 }
        ],
        mock: true
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to list channels';
      logger.error('[SlackProvider] listChannels error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SlackProvider.isConfigured() };
    }
  }

  async getChannelHistory(channelId: string, limit = 20): Promise<SlackResult<Array<{ ts: string; user: string; text: string }>>> {
    try {
      const token = this.getToken();
      if (token) {
        const response = await fetch(`https://slack.com/api/conversations.history?channel=${channelId}&limit=${limit}`, {
          headers: this.getApiHeaders(),
          signal: AbortSignal.timeout(10000)
        });
        const body = (await response.json()) as {
          ok: boolean;
          messages?: Array<{ ts: string; user: string; text: string }>;
          error?: string;
        };
        if (body.ok && body.messages) {
          return { success: true, data: body.messages.map(m => ({ ts: m.ts, user: m.user, text: m.text })), mock: false };
        }
        return { success: false, data: null, error: body.error || 'Failed to get history', mock: false };
      }
      return {
        success: true,
        data: [
          { ts: '1709000001.000001', user: 'U01MOCK', text: 'New deal created: Enterprise Plan' },
          { ts: '1709000002.000002', user: 'U02MOCK', text: 'Lead converted: John Doe' }
        ],
        mock: true
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to get channel history';
      logger.error('[SlackProvider] getChannelHistory error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SlackProvider.isConfigured() };
    }
  }
}

export default new SlackProvider();
