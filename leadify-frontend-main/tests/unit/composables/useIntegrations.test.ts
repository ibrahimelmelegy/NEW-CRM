/**
 * useIntegrations - Unit Tests
 * ==============================
 * Tests for composables/useIntegrations.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

const mockNotification = vi.fn();
const mockNotificationSuccess = vi.fn();
const mockNotificationError = vi.fn();
const mockNotificationWarning = vi.fn();
(globalThis as any).ElNotification = Object.assign(mockNotification, {
  success: mockNotificationSuccess,
  error: mockNotificationError,
  warning: mockNotificationWarning
});

vi.mock('element-plus', () => ({
  ElNotification: Object.assign((...args: any[]) => mockNotification(...args), {
    success: (...args: any[]) => mockNotificationSuccess(...args),
    error: (...args: any[]) => mockNotificationError(...args),
    warning: (...args: any[]) => mockNotificationWarning(...args)
  })
}));

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: any[]) => mockApiFetch(...args)
}));

import { useIntegrations } from '~/composables/useIntegrations';

describe('useIntegrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchCatalog
  // ============================================
  describe('fetchCatalog', () => {
    it('should fetch integration catalog and set loading states', async () => {
      const catalogData = [{ type: 'SLACK', name: 'Slack', description: 'Messaging', icon: 'logos:slack', category: 'Communication', configFields: [] }];
      mockApiFetch.mockResolvedValue({ body: catalogData, success: true });

      const { fetchCatalog, catalog, loading } = useIntegrations();
      await fetchCatalog();

      expect(mockApiFetch).toHaveBeenCalledWith('integrations/hub/catalog');
      expect(catalog.value).toEqual(catalogData);
      expect(loading.value).toBe(false);
    });

    it('should handle fetch failure gracefully', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { fetchCatalog, loading } = useIntegrations();
      await fetchCatalog();

      expect(loading.value).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // fetchConfigured
  // ============================================
  describe('fetchConfigured', () => {
    it('should fetch configured integrations', async () => {
      const configured = [{ id: '1', type: 'WHATSAPP', name: 'WhatsApp', status: 'ACTIVE' }];
      mockApiFetch.mockResolvedValue({ body: configured, success: true });

      const int = useIntegrations();
      await int.fetchConfigured();

      expect(mockApiFetch).toHaveBeenCalledWith('integrations/hub/configured');
      expect(int.configured.value).toEqual(configured);
    });
  });

  // ============================================
  // configure
  // ============================================
  describe('configure', () => {
    it('should configure integration and return true on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: [] });

      const int = useIntegrations();
      const result = await int.configure('WHATSAPP', { apiKey: '123' });

      expect(mockApiFetch).toHaveBeenCalledWith('integrations/hub/configure', 'POST', { type: 'WHATSAPP', config: { apiKey: '123' } });
      expect(result).toBe(true);
      expect(mockNotificationSuccess).toHaveBeenCalled();
    });

    it('should return false on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Invalid config' });

      const int = useIntegrations();
      const result = await int.configure('WHATSAPP', {});

      expect(result).toBe(false);
      expect(mockNotificationError).toHaveBeenCalled();
    });

    it('should return false on thrown error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Server down'));

      const int = useIntegrations();
      const result = await int.configure('WHATSAPP', {});

      expect(result).toBe(false);
    });
  });

  // ============================================
  // testConnection
  // ============================================
  describe('testConnection', () => {
    it('should return true on successful test', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { message: 'OK' } });

      const int = useIntegrations();
      const result = await int.testConnection('WHATSAPP', { apiKey: '123' });

      expect(mockApiFetch).toHaveBeenCalledWith('integrations/hub/WHATSAPP/test', 'POST', { apiKey: '123' });
      expect(result).toBe(true);
    });

    it('should return false on failed test', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Invalid key' });

      const int = useIntegrations();
      const result = await int.testConnection('WHATSAPP', {});

      expect(result).toBe(false);
      expect(mockNotificationWarning).toHaveBeenCalled();
    });
  });

  // ============================================
  // removeIntegration
  // ============================================
  describe('removeIntegration', () => {
    it('should remove integration and return true', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: [] });

      const int = useIntegrations();
      const result = await int.removeIntegration('1');

      expect(mockApiFetch).toHaveBeenCalledWith('integrations/hub/1', 'DELETE');
      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Not found' });

      const int = useIntegrations();
      const result = await int.removeIntegration('999');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // allIntegrations computed
  // ============================================
  describe('allIntegrations', () => {
    it('should include legacy integrations when catalog is empty', () => {
      const int = useIntegrations();
      int.catalog.value = [];
      int.configured.value = [];

      // Legacy integrations include GOOGLE_CALENDAR, OUTLOOK, WHATSAPP, OPENAI, ERPNEXT, BREVO
      expect(int.allIntegrations.value.length).toBeGreaterThanOrEqual(6);
      expect(int.allIntegrations.value.every(i => i.status === 'disconnected')).toBe(true);
    });

    it('should mark configured integrations as connected', () => {
      const int = useIntegrations();
      int.catalog.value = [
        { type: 'SLACK', name: 'Slack', description: 'Test', icon: 'slack', category: 'Communication', configFields: [] }
      ];
      int.configured.value = [
        { id: '1', type: 'SLACK', name: 'Slack', status: 'ACTIVE' } as any
      ];

      const slack = int.allIntegrations.value.find(i => i.type === 'SLACK');
      expect(slack?.status).toBe('connected');
      expect(slack?.isConfigured).toBe(true);
    });
  });

  // ============================================
  // Webhooks
  // ============================================
  describe('fetchWebhooks', () => {
    it('should fetch webhooks', async () => {
      const webhooks = [{ id: '1', name: 'WH1', url: 'https://example.com' }];
      mockApiFetch.mockResolvedValue({ body: webhooks, success: true });

      const int = useIntegrations();
      await int.fetchWebhooks();

      expect(mockApiFetch).toHaveBeenCalledWith('integrations/hub/webhooks');
      expect(int.webhooks.value).toEqual(webhooks);
    });
  });

  describe('createWebhook', () => {
    it('should create webhook and return true', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: [] });

      const int = useIntegrations();
      const result = await int.createWebhook({ name: 'Test WH', url: 'https://example.com', events: ['LEAD_CREATED'] });

      expect(result).toBe(true);
      expect(mockNotificationSuccess).toHaveBeenCalled();
    });

    it('should return false on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Invalid URL' });

      const int = useIntegrations();
      const result = await int.createWebhook({ name: 'Bad', url: '' });

      expect(result).toBe(false);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook and return true', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: [] });

      const int = useIntegrations();
      const result = await int.deleteWebhook('1');

      expect(mockApiFetch).toHaveBeenCalledWith('integrations/hub/webhooks/1', 'DELETE');
      expect(result).toBe(true);
    });
  });

  describe('testWebhook', () => {
    it('should test webhook and return true on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { message: 'OK' } });

      const int = useIntegrations();
      const result = await int.testWebhook('1');

      expect(mockApiFetch).toHaveBeenCalledWith('integrations/hub/webhooks/1/test', 'POST');
      expect(result).toBe(true);
    });
  });
});
