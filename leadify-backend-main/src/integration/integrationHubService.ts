import crypto from 'crypto';
import IntegrationConfig, { IntegrationType, IntegrationStatus } from './models/integrationConfigModel';
import OutgoingWebhook, { OutgoingWebhookStatus } from './models/outgoingWebhookModel';
import { encrypt, decrypt } from '../utils/encryption';
import { slackConnector } from './connectors/slackConnector';
import { googleDriveConnector } from './connectors/googleDriveConnector';

// ─── Sensitive keys that should be encrypted at rest ─────────────────────────
const SENSITIVE_KEYS = ['apiKey', 'secretKey', 'webhookSecret', 'clientSecret', 'accessToken', 'secret'];

function encryptConfig(config: Record<string, any>): Record<string, any> {
  if (!config || typeof config !== 'object') return config;
  const encrypted = { ...config };
  for (const key of SENSITIVE_KEYS) {
    if (encrypted[key] && typeof encrypted[key] === 'string') {
      try {
        encrypted[key] = encrypt(encrypted[key]);
      } catch {
        // Keep original if encryption fails
      }
    }
  }
  return encrypted;
}

function decryptConfig(config: Record<string, any>): Record<string, any> {
  if (!config || typeof config !== 'object') return config;
  const decrypted = { ...config };
  for (const key of SENSITIVE_KEYS) {
    if (decrypted[key] && typeof decrypted[key] === 'string') {
      try {
        decrypted[key] = decrypt(decrypted[key]);
      } catch {
        // Value may not be encrypted (legacy)
      }
    }
  }
  return decrypted;
}

// ─── Integration Catalog ─────────────────────────────────────────────────────
export interface CatalogEntry {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  configFields: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required: boolean;
}

const INTEGRATION_CATALOG: CatalogEntry[] = [
  {
    type: IntegrationType.SLACK,
    name: 'Slack',
    description: 'Send notifications and alerts to Slack channels',
    icon: 'logos:slack-icon',
    category: 'Communication',
    configFields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/services/...', required: true },
      { key: 'channel', label: 'Default Channel', type: 'text', placeholder: '#general', required: false }
    ]
  },
  {
    type: IntegrationType.GOOGLE_DRIVE,
    name: 'Google Drive',
    description: 'Upload and manage documents in Google Drive',
    icon: 'logos:google-drive',
    category: 'Storage',
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Google Client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true },
      { key: 'folderId', label: 'Folder ID', type: 'text', placeholder: 'Root folder ID (optional)', required: false }
    ]
  },
  {
    type: IntegrationType.STRIPE,
    name: 'Stripe',
    description: 'Accept payments and manage subscriptions via Stripe',
    icon: 'logos:stripe',
    category: 'Payment',
    configFields: [
      { key: 'apiKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...', required: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', required: false }
    ]
  },
  {
    type: IntegrationType.MOYASAR,
    name: 'Moyasar',
    description: 'Saudi Arabia payment gateway for local transactions',
    icon: 'ph:credit-card-bold',
    category: 'Payment',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter Moyasar API Key', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'Enter Moyasar Secret Key', required: true }
    ]
  },
  {
    type: IntegrationType.ZAPIER,
    name: 'Zapier',
    description: 'Connect to 5000+ apps with automated workflows',
    icon: 'logos:zapier-icon',
    category: 'Developer',
    configFields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.zapier.com/...', required: true }
    ]
  },
  {
    type: IntegrationType.MAILCHIMP,
    name: 'Mailchimp',
    description: 'Sync contacts and manage email marketing campaigns',
    icon: 'logos:mailchimp',
    category: 'Marketing',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter Mailchimp API Key', required: true },
      { key: 'server', label: 'Server Prefix', type: 'text', placeholder: 'us1', required: true }
    ]
  },
  {
    type: IntegrationType.HUBSPOT,
    name: 'HubSpot',
    description: 'Bi-directional CRM sync with HubSpot contacts and deals',
    icon: 'logos:hubspot',
    category: 'Marketing',
    configFields: [
      { key: 'apiKey', label: 'Private App Token', type: 'password', placeholder: 'pat-na1-...', required: true }
    ]
  },
  {
    type: IntegrationType.JIRA,
    name: 'Jira',
    description: 'Create and track issues from CRM deals and projects',
    icon: 'logos:jira',
    category: 'Productivity',
    configFields: [
      { key: 'baseUrl', label: 'Jira URL', type: 'url', placeholder: 'https://your-domain.atlassian.net', required: true },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'user@example.com', required: true },
      { key: 'apiKey', label: 'API Token', type: 'password', placeholder: 'Enter Jira API Token', required: true }
    ]
  },
  {
    type: IntegrationType.TRELLO,
    name: 'Trello',
    description: 'Sync boards and cards with CRM projects',
    icon: 'logos:trello',
    category: 'Productivity',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Enter Trello API Key', required: true },
      { key: 'accessToken', label: 'Token', type: 'password', placeholder: 'Enter Trello Token', required: true }
    ]
  }
];

// ─── Service ─────────────────────────────────────────────────────────────────

class IntegrationHubService {
  // ── Catalog ──────────────────────────────────────────────────────────────
  getAvailableIntegrations(): CatalogEntry[] {
    return INTEGRATION_CATALOG;
  }

  // ── Configured integrations ──────────────────────────────────────────────
  async getConfiguredIntegrations(tenantId?: string): Promise<any[]> {
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;

    const configs = await IntegrationConfig.findAll({ where, order: [['createdAt', 'DESC']] });

    return configs.map(c => {
      const plain = c.toJSON();
      if (plain.config) {
        plain.config = decryptConfig(plain.config);
      }
      return plain;
    });
  }

  // ── Configure / Update integration ───────────────────────────────────────
  async configureIntegration(
    type: IntegrationType,
    config: Record<string, any>,
    userId?: number,
    tenantId?: string
  ): Promise<IntegrationConfig> {
    const encryptedConfig = encryptConfig(config);

    // Find existing or create
    const existing = await IntegrationConfig.findOne({
      where: { type, ...(tenantId ? { tenantId } : {}) }
    });

    if (existing) {
      await existing.update({
        config: encryptedConfig,
        status: IntegrationStatus.ACTIVE,
        lastError: null,
        userId
      });
      return existing;
    }

    const catalogEntry = INTEGRATION_CATALOG.find(c => c.type === type);

    return IntegrationConfig.create({
      type,
      name: catalogEntry?.name || type,
      description: catalogEntry?.description || null,
      config: encryptedConfig,
      status: IntegrationStatus.ACTIVE,
      tenantId: tenantId || null,
      userId: userId || null
    });
  }

  // ── Test connection ──────────────────────────────────────────────────────
  async testConnection(type: IntegrationType, config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      switch (type) {
        case IntegrationType.SLACK:
          return await slackConnector.testConnection(config as any);

        case IntegrationType.GOOGLE_DRIVE:
          return await googleDriveConnector.testConnection(config as any);

        case IntegrationType.STRIPE: {
          const response = await fetch('https://api.stripe.com/v1/balance', {
            headers: { Authorization: `Bearer ${config.apiKey}` },
            signal: AbortSignal.timeout(10000)
          });
          return { success: response.ok, message: response.ok ? 'Stripe connection successful' : `Stripe error: ${response.status}` };
        }

        case IntegrationType.MOYASAR: {
          const auth = Buffer.from(`${config.apiKey}:`).toString('base64');
          const response = await fetch('https://api.moyasar.com/v1/payments?page=1&per=1', {
            headers: { Authorization: `Basic ${auth}` },
            signal: AbortSignal.timeout(10000)
          });
          return { success: response.ok, message: response.ok ? 'Moyasar connection successful' : `Moyasar error: ${response.status}` };
        }

        case IntegrationType.MAILCHIMP: {
          const server = config.server || 'us1';
          const response = await fetch(`https://${server}.api.mailchimp.com/3.0/ping`, {
            headers: { Authorization: `apikey ${config.apiKey}` },
            signal: AbortSignal.timeout(10000)
          });
          return { success: response.ok, message: response.ok ? 'Mailchimp connection successful' : `Mailchimp error: ${response.status}` };
        }

        case IntegrationType.HUBSPOT: {
          const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
            headers: { Authorization: `Bearer ${config.apiKey}` },
            signal: AbortSignal.timeout(10000)
          });
          return { success: response.ok, message: response.ok ? 'HubSpot connection successful' : `HubSpot error: ${response.status}` };
        }

        case IntegrationType.JIRA: {
          const auth = Buffer.from(`${config.email}:${config.apiKey}`).toString('base64');
          const response = await fetch(`${config.baseUrl}/rest/api/3/myself`, {
            headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
            signal: AbortSignal.timeout(10000)
          });
          return { success: response.ok, message: response.ok ? 'Jira connection successful' : `Jira error: ${response.status}` };
        }

        case IntegrationType.TRELLO: {
          const response = await fetch(`https://api.trello.com/1/members/me?key=${config.apiKey}&token=${config.accessToken}`, {
            signal: AbortSignal.timeout(10000)
          });
          return { success: response.ok, message: response.ok ? 'Trello connection successful' : `Trello error: ${response.status}` };
        }

        case IntegrationType.ZAPIER: {
          // Zapier webhooks are one-way; just validate URL format
          const urlValid = /^https:\/\/hooks\.zapier\.com\//.test(config.webhookUrl || '');
          return { success: urlValid, message: urlValid ? 'Zapier webhook URL is valid' : 'Invalid Zapier webhook URL format' };
        }

        default:
          return { success: false, message: `Unknown integration type: ${type}` };
      }
    } catch (error: any) {
      // Update status to ERROR if this is a saved integration
      const existing = await IntegrationConfig.findOne({ where: { type } });
      if (existing) {
        await existing.update({ status: IntegrationStatus.ERROR, lastError: error.message });
      }
      return { success: false, message: error.message || 'Connection test failed' };
    }
  }

  // ── Remove integration ───────────────────────────────────────────────────
  async removeIntegration(id: string, tenantId?: string): Promise<void> {
    const where: Record<string, any> = { id };
    if (tenantId) where.tenantId = tenantId;

    const integration = await IntegrationConfig.findOne({ where });
    if (!integration) throw new Error('Integration not found');

    await integration.update({ status: IntegrationStatus.INACTIVE, config: null });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Outgoing Webhooks
  // ═══════════════════════════════════════════════════════════════════════════

  async getWebhooks(tenantId?: string): Promise<OutgoingWebhook[]> {
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    return OutgoingWebhook.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  async createWebhook(data: any, userId?: number, tenantId?: string): Promise<OutgoingWebhook> {
    const secret = data.secret || crypto.randomBytes(32).toString('hex');
    return OutgoingWebhook.create({
      name: data.name,
      url: data.url,
      events: data.events || [],
      secret,
      headers: data.headers || null,
      status: OutgoingWebhookStatus.ACTIVE,
      tenantId: tenantId || null,
      createdBy: userId || null
    });
  }

  async updateWebhook(id: string, data: any, tenantId?: string): Promise<OutgoingWebhook> {
    const where: Record<string, any> = { id };
    if (tenantId) where.tenantId = tenantId;

    const webhook = await OutgoingWebhook.findOne({ where });
    if (!webhook) throw new Error('Webhook not found');

    const updates: Record<string, any> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.url !== undefined) updates.url = data.url;
    if (data.events !== undefined) updates.events = data.events;
    if (data.headers !== undefined) updates.headers = data.headers;
    if (data.status !== undefined) updates.status = data.status;

    await webhook.update(updates);
    return webhook;
  }

  async deleteWebhook(id: string, tenantId?: string): Promise<void> {
    const where: Record<string, any> = { id };
    if (tenantId) where.tenantId = tenantId;

    const webhook = await OutgoingWebhook.findOne({ where });
    if (!webhook) throw new Error('Webhook not found');

    await webhook.destroy();
  }

  async testWebhook(id: string): Promise<{ success: boolean; status: number; message: string }> {
    const webhook = await OutgoingWebhook.findByPk(id);
    if (!webhook) throw new Error('Webhook not found');

    const testPayload = {
      event: 'test',
      payload: { test: true, message: 'Integration Hub webhook test from High Point Technology CRM' },
      timestamp: new Date().toISOString()
    };

    const body = JSON.stringify(testPayload);
    const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': 'test'
    };

    // Merge custom headers
    if (webhook.headers) {
      Object.assign(headers, webhook.headers);
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000)
      });

      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Webhook test successful' : `Webhook returned HTTP ${response.status}`
      };
    } catch (error: any) {
      return { success: false, status: 0, message: error.message || 'Webhook test failed' };
    }
  }

  // ── Trigger webhooks for a given event ───────────────────────────────────
  async triggerWebhooks(event: string, payload: any, tenantId?: string): Promise<void> {
    const where: Record<string, any> = { status: OutgoingWebhookStatus.ACTIVE };
    if (tenantId) where.tenantId = tenantId;

    const webhooks = await OutgoingWebhook.findAll({ where });
    const matching = webhooks.filter(w => w.events.includes(event));

    for (const webhook of matching) {
      this.deliverWebhook(webhook, event, payload).catch(() => {
        // Delivery errors handled inside deliverWebhook
      });
    }
  }

  private async deliverWebhook(webhook: OutgoingWebhook, event: string, payload: any, attempt: number = 1): Promise<void> {
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': event
    };

    if (webhook.headers) {
      Object.assign(headers, webhook.headers);
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      await webhook.update({ lastTriggeredAt: new Date(), failureCount: 0 });
    } catch {
      const newCount = webhook.failureCount + 1;
      await webhook.update({ failureCount: newCount });

      // Retry up to 3 times with exponential backoff
      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => this.deliverWebhook(webhook, event, payload, attempt + 1), delay);
      } else if (newCount >= 10) {
        // Auto-disable after 10 consecutive failures
        await webhook.update({ status: OutgoingWebhookStatus.INACTIVE });
      }
    }
  }
}

export default new IntegrationHubService();
