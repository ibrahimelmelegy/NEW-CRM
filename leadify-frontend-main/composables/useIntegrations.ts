import { ref, computed } from 'vue';
import { ElNotification } from 'element-plus';
import { useApiFetch } from './useApiFetch';

// ─── Types ───────────────────────────────────────────────────────────────────

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

export interface ConfiguredIntegration {
  id: string;
  type: string;
  name: string;
  description?: string;
  config?: Record<string, any>;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastSyncedAt?: string;
  lastError?: string;
  tenantId?: string;
  userId?: number;
}

export interface OutgoingWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  headers?: Record<string, string>;
  status: 'ACTIVE' | 'INACTIVE';
  lastTriggeredAt?: string;
  failureCount: number;
  createdBy?: number;
}

export interface MergedIntegration {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  configFields: ConfigField[];
  status: 'connected' | 'disconnected' | 'error';
  isConfigured: boolean;
  configId?: string;
  existingConfig?: Record<string, any>;
}

// ─── Existing / Legacy provider integrations ─────────────────────────────────
const LEGACY_INTEGRATIONS: CatalogEntry[] = [
  {
    type: 'GOOGLE_CALENDAR',
    name: 'Google Calendar',
    description: 'Direct bi-directional calendar sync',
    icon: 'logos:google-calendar',
    category: 'Productivity',
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Google Client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true }
    ]
  },
  {
    type: 'OUTLOOK',
    name: 'Microsoft Outlook',
    description: 'Microsoft Graph API calendar sync',
    icon: 'logos:microsoft-icon',
    category: 'Productivity',
    configFields: [
      { key: 'clientId', label: 'Application ID', type: 'text', placeholder: 'Enter Azure App ID', required: true },
      { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'Enter Tenant ID', required: true }
    ]
  },
  {
    type: 'WHATSAPP',
    name: 'WhatsApp Business',
    description: 'Automated messaging and notifications',
    icon: 'logos:whatsapp-icon',
    category: 'Communication',
    configFields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', placeholder: 'Enter Phone ID', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Enter Access Token', required: true }
    ]
  },
  {
    type: 'OPENAI',
    name: 'OpenAI',
    description: 'Powers lead scoring and AI summarizers',
    icon: 'logos:openai-icon',
    category: 'Developer',
    configFields: [{ key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...', required: true }]
  },
  {
    type: 'ERPNEXT',
    name: 'ERPNext',
    description: 'Bi-directional ERP synchronization',
    icon: 'ph:database-bold',
    category: 'Productivity',
    configFields: [
      { key: 'baseUrl', label: 'Base URL', type: 'url', placeholder: 'https://your-instance.erpnext.com', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter ERPNext API Key', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Enter ERPNext API Secret', required: true }
    ]
  },
  {
    type: 'BREVO',
    name: 'Brevo',
    description: 'Transactional email and campaigns',
    icon: 'ph:envelope-simple-bold',
    category: 'Marketing',
    configFields: [{ key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'xkeysib-...', required: true }]
  }
];

// ─── Composable ──────────────────────────────────────────────────────────────

export function useIntegrations() {
  const catalog = ref<CatalogEntry[]>([]);
  const configured = ref<ConfiguredIntegration[]>([]);
  const webhooks = ref<OutgoingWebhook[]>([]);
  const loading = ref(false);
  const webhooksLoading = ref(false);

  // ── Merged list combining catalog + legacy + configured status ──────────
  const allIntegrations = computed<MergedIntegration[]>(() => {
    const hubEntries: MergedIntegration[] = catalog.value.map(entry => {
      const configuredEntry = configured.value.find(c => c.type === entry.type);
      return {
        type: entry.type,
        name: entry.name,
        description: entry.description,
        icon: entry.icon,
        category: entry.category,
        configFields: entry.configFields,
        status: configuredEntry
          ? configuredEntry.status === 'ACTIVE'
            ? 'connected'
            : configuredEntry.status === 'ERROR'
              ? 'error'
              : 'disconnected'
          : 'disconnected',
        isConfigured: !!configuredEntry && configuredEntry.status === 'ACTIVE',
        configId: configuredEntry?.id,
        existingConfig: configuredEntry?.config
      };
    });

    // Add legacy integrations that are not already in hub catalog
    const hubTypes = new Set(catalog.value.map(c => c.type));
    const legacyEntries: MergedIntegration[] = LEGACY_INTEGRATIONS.filter(l => !hubTypes.has(l.type)).map(entry => ({
      type: entry.type,
      name: entry.name,
      description: entry.description,
      icon: entry.icon,
      category: entry.category,
      configFields: entry.configFields,
      status: 'disconnected' as const,
      isConfigured: false
    }));

    return [...hubEntries, ...legacyEntries];
  });

  // ── Fetch catalog ──────────────────────────────────────────────────────
  async function fetchCatalog(): Promise<void> {
    loading.value = true;
    try {
      const response = await useApiFetch('integrations/hub/catalog');
      if (response.success && Array.isArray(response.body)) {
        catalog.value = response.body;
      }
    } catch (e) {
      console.error('Failed to fetch integration catalog', e);
    } finally {
      loading.value = false;
    }
  }

  // ── Fetch configured ───────────────────────────────────────────────────
  async function fetchConfigured(): Promise<void> {
    try {
      const response = await useApiFetch('integrations/hub/configured');
      if (response.success && Array.isArray(response.body)) {
        configured.value = response.body;
      }
    } catch (e) {
      console.error('Failed to fetch configured integrations', e);
    }
  }

  // ── Configure integration ──────────────────────────────────────────────
  async function configure(type: string, config: Record<string, any>): Promise<boolean> {
    try {
      const response = await useApiFetch('integrations/hub/configure', 'POST', { type, config });
      if (response.success) {
        ElNotification.success({ title: 'Integration Saved', message: `${type} configured successfully` });
        await fetchConfigured();
        return true;
      } else {
        ElNotification.error({ title: 'Configuration Failed', message: response.message });
        return false;
      }
    } catch (e: any) {
      ElNotification.error({ title: 'Error', message: e.message || 'Failed to configure integration' });
      return false;
    }
  }

  // ── Test connection ────────────────────────────────────────────────────
  async function testConnection(type: string, config: Record<string, any>): Promise<boolean> {
    try {
      const response = await useApiFetch(`integrations/hub/${type}/test`, 'POST', config);
      if (response.success) {
        const msg = (response.body as any)?.message || 'Connection successful';
        ElNotification.success({ title: 'Test Passed', message: msg });
        return true;
      } else {
        ElNotification.warning({ title: 'Test Failed', message: response.message });
        return false;
      }
    } catch (e: any) {
      ElNotification.error({ title: 'Test Error', message: e.message || 'Connection test failed' });
      return false;
    }
  }

  // ── Remove integration ─────────────────────────────────────────────────
  async function removeIntegration(id: string): Promise<boolean> {
    try {
      const response = await useApiFetch(`integrations/hub/${id}`, 'DELETE');
      if (response.success) {
        ElNotification.success({ title: 'Disconnected', message: 'Integration removed successfully' });
        await fetchConfigured();
        return true;
      } else {
        ElNotification.error({ title: 'Error', message: response.message });
        return false;
      }
    } catch (e: any) {
      ElNotification.error({ title: 'Error', message: e.message || 'Failed to remove integration' });
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Webhooks
  // ═══════════════════════════════════════════════════════════════════════════

  async function fetchWebhooks(): Promise<void> {
    webhooksLoading.value = true;
    try {
      const response = await useApiFetch('integrations/hub/webhooks');
      if (response.success && Array.isArray(response.body)) {
        webhooks.value = response.body;
      }
    } catch (e) {
      console.error('Failed to fetch webhooks', e);
    } finally {
      webhooksLoading.value = false;
    }
  }

  async function createWebhook(data: any): Promise<boolean> {
    try {
      const response = await useApiFetch('integrations/hub/webhooks', 'POST', data);
      if (response.success) {
        ElNotification.success({ title: 'Webhook Created', message: `${data.name} created successfully` });
        await fetchWebhooks();
        return true;
      } else {
        ElNotification.error({ title: 'Error', message: response.message });
        return false;
      }
    } catch (e: any) {
      ElNotification.error({ title: 'Error', message: e.message || 'Failed to create webhook' });
      return false;
    }
  }

  async function updateWebhook(id: string, data: any): Promise<boolean> {
    try {
      const response = await useApiFetch(`integrations/hub/webhooks/${id}`, 'PUT', data);
      if (response.success) {
        ElNotification.success({ title: 'Webhook Updated', message: 'Webhook updated successfully' });
        await fetchWebhooks();
        return true;
      } else {
        ElNotification.error({ title: 'Error', message: response.message });
        return false;
      }
    } catch (e: any) {
      ElNotification.error({ title: 'Error', message: e.message || 'Failed to update webhook' });
      return false;
    }
  }

  async function deleteWebhook(id: string): Promise<boolean> {
    try {
      const response = await useApiFetch(`integrations/hub/webhooks/${id}`, 'DELETE');
      if (response.success) {
        ElNotification.success({ title: 'Webhook Deleted', message: 'Webhook deleted successfully' });
        await fetchWebhooks();
        return true;
      } else {
        ElNotification.error({ title: 'Error', message: response.message });
        return false;
      }
    } catch (e: any) {
      ElNotification.error({ title: 'Error', message: e.message || 'Failed to delete webhook' });
      return false;
    }
  }

  async function testWebhook(id: string): Promise<boolean> {
    try {
      const response = await useApiFetch(`integrations/hub/webhooks/${id}/test`, 'POST');
      if (response.success) {
        ElNotification.success({ title: 'Test Sent', message: (response.body as any)?.message || 'Webhook test successful' });
        return true;
      } else {
        ElNotification.warning({ title: 'Test Failed', message: response.message });
        return false;
      }
    } catch (e: any) {
      ElNotification.error({ title: 'Test Error', message: e.message || 'Webhook test failed' });
      return false;
    }
  }

  return {
    // State
    catalog,
    configured,
    webhooks,
    loading,
    webhooksLoading,
    allIntegrations,

    // Integration methods
    fetchCatalog,
    fetchConfigured,
    configure,
    testConnection,
    removeIntegration,

    // Webhook methods
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook
  };
}
