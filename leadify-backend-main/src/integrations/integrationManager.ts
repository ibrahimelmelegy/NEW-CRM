// ─── Integration Manager ─────────────────────────────────────────────────────
// Central registry that checks which third-party providers are configured and
// exposes helper methods for status checking, connection testing, and toggling.

import stripeProvider, { StripeProvider } from './providers/stripeProvider';
import sendgridProvider, { SendGridProvider } from './providers/sendgridProvider';
import twilioProvider, { TwilioProvider } from './providers/twilioProvider';
import salesforceProvider, { SalesforceProvider } from './providers/salesforceProvider';
import hubspotProvider, { HubSpotProvider } from './providers/hubspotProvider';

export type ProviderName = 'stripe' | 'sendgrid' | 'twilio' | 'salesforce' | 'hubspot';

export interface IntegrationInfo {
  provider: ProviderName;
  label: string;
  category: string;
  configured: boolean;
  enabled: boolean;
}

export interface ConnectionTestResult {
  provider: ProviderName;
  reachable: boolean;
  latencyMs: number;
  error?: string;
}

// In-memory enabled state (persisted per process; use DB for production)
const enabledState: Record<ProviderName, boolean> = {
  stripe: true,
  sendgrid: true,
  twilio: true,
  salesforce: true,
  hubspot: true,
};

const providerMeta: Record<ProviderName, { label: string; category: string; isConfigured: () => boolean }> = {
  stripe:     { label: 'Stripe',     category: 'payment',  isConfigured: () => StripeProvider.isConfigured() },
  sendgrid:   { label: 'SendGrid',   category: 'email',    isConfigured: () => SendGridProvider.isConfigured() },
  twilio:     { label: 'Twilio',     category: 'sms',      isConfigured: () => TwilioProvider.isConfigured() },
  salesforce: { label: 'Salesforce', category: 'crm-sync', isConfigured: () => SalesforceProvider.isConfigured() },
  hubspot:    { label: 'HubSpot',    category: 'crm-sync', isConfigured: () => HubSpotProvider.isConfigured() },
};

class IntegrationManager {
  getAvailableIntegrations(): IntegrationInfo[] {
    return (Object.keys(providerMeta) as ProviderName[]).map(provider => ({
      provider,
      label: providerMeta[provider].label,
      category: providerMeta[provider].category,
      configured: providerMeta[provider].isConfigured(),
      enabled: enabledState[provider] ?? true,
    }));
  }

  getIntegrationStatus(provider: ProviderName): IntegrationInfo | null {
    const meta = providerMeta[provider];
    if (!meta) return null;
    return {
      provider,
      label: meta.label,
      category: meta.category,
      configured: meta.isConfigured(),
      enabled: enabledState[provider] ?? true,
    };
  }

  async testConnection(provider: ProviderName): Promise<ConnectionTestResult> {
    console.log('[IntegrationManager] testConnection:', provider);
    const start = Date.now();
    const meta = providerMeta[provider];
    if (!meta) {
      return { provider, reachable: false, latencyMs: 0, error: `Unknown provider: ${provider}` };
    }
    if (!meta.isConfigured()) {
      return { provider, reachable: false, latencyMs: 0, error: `${meta.label} is not configured. Set the required environment variables.` };
    }
    try {
      // Lightweight check per provider
      switch (provider) {
        case 'stripe':
          await stripeProvider.listInvoices(undefined, 1);
          break;
        case 'sendgrid':
          await sendgridProvider.getEmailStats();
          break;
        case 'twilio':
          await twilioProvider.validatePhoneNumber('+15005550006');
          break;
        case 'salesforce':
          await salesforceProvider.importFromSalesforce('Lead', 1);
          break;
        case 'hubspot':
          await hubspotProvider.importFromHubspot('contacts', 1);
          break;
      }
      return { provider, reachable: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { provider, reachable: false, latencyMs: Date.now() - start, error: err.message };
    }
  }

  enableIntegration(provider: ProviderName): boolean {
    if (!providerMeta[provider]) return false;
    enabledState[provider] = true;
    console.log('[IntegrationManager] enabled:', provider);
    return true;
  }

  disableIntegration(provider: ProviderName): boolean {
    if (!providerMeta[provider]) return false;
    enabledState[provider] = false;
    console.log('[IntegrationManager] disabled:', provider);
    return true;
  }
}

export default new IntegrationManager();
