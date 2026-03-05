/**
 * Slack Integration Connector
 *
 * Supports sending messages via Slack Incoming Webhooks.
 * Slack webhooks don't require OAuth — just a webhook URL from the Slack app configuration.
 */

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
}

export interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  blocks?: unknown[];
  attachments?: unknown[];
}

class SlackConnector {
  /**
   * Send a plain-text message to a Slack channel via incoming webhook.
   */
  async sendMessage(channel: string, message: string, config: SlackConfig): Promise<{ success: boolean; message: string }> {
    const payload: SlackMessage = {
      text: message,
      channel: channel || config.channel || undefined
    };

    return this.sendNotification(config.webhookUrl, payload);
  }

  /**
   * Send a rich notification payload to Slack via incoming webhook.
   */
  async sendNotification(webhookUrl: string, payload: SlackMessage): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, message: `Slack API error (${response.status}): ${text}` };
      }

      return { success: true, message: 'Message sent to Slack successfully' };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to send Slack message';
      return { success: false, message: errMsg };
    }
  }

  /**
   * Send a formatted CRM notification to Slack.
   * Used internally to push CRM events (new lead, deal won, etc.).
   */
  async sendCrmNotification(
    config: SlackConfig,
    title: string,
    details: Record<string, string>,
    color: string = '#0EA5E9'
  ): Promise<{ success: boolean; message: string }> {
    const fields = Object.entries(details).map(([key, value]) => ({
      type: 'mrkdwn',
      text: `*${key}:*\n${value}`
    }));

    const payload: SlackMessage = {
      text: title,
      channel: config.channel || undefined,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: title, emoji: true }
        },
        {
          type: 'section',
          fields
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `Sent from *High Point Technology CRM* at ${new Date().toISOString()}` }]
        }
      ],
      attachments: [{ color }]
    };

    return this.sendNotification(config.webhookUrl, payload);
  }

  /**
   * Test the Slack webhook URL by sending a test message.
   */
  async testConnection(config: SlackConfig): Promise<{ success: boolean; message: string }> {
    if (!config.webhookUrl) {
      return { success: false, message: 'Webhook URL is required' };
    }

    // Validate URL format
    if (!config.webhookUrl.startsWith('https://hooks.slack.com/')) {
      return { success: false, message: 'Invalid Slack webhook URL format. Must start with https://hooks.slack.com/' };
    }

    const testPayload: SlackMessage = {
      text: 'High Point Technology CRM connection test successful! This integration is working correctly.',
      channel: config.channel || undefined
    };

    return this.sendNotification(config.webhookUrl, testPayload);
  }
}

export const slackConnector = new SlackConnector();
export default slackConnector;
