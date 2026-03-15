/**
 * useWebhooks - Unit Tests
 * ==========================
 * Tests for composables/useWebhooks.ts
 *
 * The module provides:
 * - WEBHOOK_EVENTS constant
 * - fetchWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  fetchWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  WEBHOOK_EVENTS,
  type WebhookConfig
} from '@/composables/useWebhooks';

// ============================================
// Mock useApiFetch
// ============================================
const mockUseApiFetch = vi.fn();

(globalThis as Record<string, unknown>).useApiFetch = mockUseApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

describe('useWebhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // WEBHOOK_EVENTS constant
  // ============================================
  describe('WEBHOOK_EVENTS', () => {
    it('should contain lead events', () => {
      expect(WEBHOOK_EVENTS).toContain('lead:created');
      expect(WEBHOOK_EVENTS).toContain('lead:updated');
      expect(WEBHOOK_EVENTS).toContain('lead:deleted');
    });

    it('should contain deal events', () => {
      expect(WEBHOOK_EVENTS).toContain('deal:created');
      expect(WEBHOOK_EVENTS).toContain('deal:updated');
      expect(WEBHOOK_EVENTS).toContain('deal:stageChanged');
    });

    it('should contain opportunity events', () => {
      expect(WEBHOOK_EVENTS).toContain('opportunity:created');
      expect(WEBHOOK_EVENTS).toContain('opportunity:updated');
      expect(WEBHOOK_EVENTS).toContain('opportunity:stageChanged');
    });

    it('should contain client events', () => {
      expect(WEBHOOK_EVENTS).toContain('client:created');
      expect(WEBHOOK_EVENTS).toContain('client:updated');
    });

    it('should have 11 events total', () => {
      expect(WEBHOOK_EVENTS).toHaveLength(11);
    });
  });

  // ============================================
  // fetchWebhooks
  // ============================================
  describe('fetchWebhooks', () => {
    it('should fetch webhooks from correct endpoint', async () => {
      const mockWebhooks: WebhookConfig[] = [
        {
          id: 'wh-1',
          name: 'Slack Webhook',
          url: 'https://hooks.slack.com/test',
          events: ['lead:created'],
          secret: 'secret123',
          isActive: true,
          failureCount: 0
        }
      ];

      mockUseApiFetch.mockResolvedValue({ body: mockWebhooks, success: true });

      const result = await fetchWebhooks();

      expect(mockUseApiFetch).toHaveBeenCalledWith('webhooks');
      expect(result).toEqual(mockWebhooks);
    });

    it('should return empty array when body is not an array', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [] }, success: true });

      const result = await fetchWebhooks();

      expect(result).toEqual([]);
    });

    it('should return empty array when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchWebhooks();

      expect(result).toEqual([]);
    });

    it('should return the array directly when body is an array', async () => {
      const webhooks = [{ id: 'wh-2', name: 'Test', url: 'https://example.com', events: [], secret: '', isActive: true, failureCount: 0 }];
      mockUseApiFetch.mockResolvedValue({ body: webhooks, success: true });

      const result = await fetchWebhooks();

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('wh-2');
    });
  });

  // ============================================
  // createWebhook
  // ============================================
  describe('createWebhook', () => {
    it('should create webhook with POST method', async () => {
      const newWebhook: Partial<WebhookConfig> = {
        name: 'New Webhook',
        url: 'https://example.com/webhook',
        events: ['lead:created', 'deal:created'],
        isActive: true
      };

      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 'wh-3', ...newWebhook } });

      await createWebhook(newWebhook);

      expect(mockUseApiFetch).toHaveBeenCalledWith('webhooks', 'POST', newWebhook);
    });

    it('should return API response', async () => {
      const response = { success: true, body: { id: 'wh-4' } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await createWebhook({ name: 'Test', url: 'https://test.com', events: [] });

      expect(result).toEqual(response);
    });

    it('should handle creation failure', async () => {
      mockUseApiFetch.mockResolvedValue({ success: false, message: 'Invalid URL' });

      const result = await createWebhook({ url: 'not-a-url' });

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // updateWebhook
  // ============================================
  describe('updateWebhook', () => {
    it('should update webhook with PUT method and ID', async () => {
      const updateData: Partial<WebhookConfig> = { isActive: false };

      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await updateWebhook('wh-1', updateData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('webhooks/wh-1', 'PUT', updateData);
    });

    it('should return the API response', async () => {
      const response = { success: true, body: { id: 'wh-1', isActive: false } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await updateWebhook('wh-1', { isActive: false });

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // deleteWebhook
  // ============================================
  describe('deleteWebhook', () => {
    it('should delete webhook with DELETE method and correct ID', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await deleteWebhook('wh-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('webhooks/wh-1', 'DELETE');
    });

    it('should return the API response', async () => {
      const response = { success: true, body: null };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await deleteWebhook('wh-2');

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // testWebhook
  // ============================================
  describe('testWebhook', () => {
    it('should test webhook with POST method', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { delivered: true } });

      await testWebhook('wh-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('webhooks/wh-1/test', 'POST');
    });

    it('should return the test result', async () => {
      const response = { success: true, body: { delivered: true, responseCode: 200 } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await testWebhook('wh-1');

      expect(result).toEqual(response);
    });

    it('should handle test failure', async () => {
      mockUseApiFetch.mockResolvedValue({ success: false, body: { delivered: false, error: 'Connection timeout' } });

      const result = await testWebhook('wh-3');

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // WebhookConfig interface
  // ============================================
  describe('WebhookConfig interface', () => {
    it('should create valid WebhookConfig object', () => {
      const webhook: WebhookConfig = {
        id: 'wh-test',
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['lead:created', 'deal:updated'],
        secret: 'my-secret-key',
        isActive: true,
        failureCount: 0,
        lastTriggered: '2024-01-15T10:30:00Z'
      };

      expect(webhook.id).toBe('wh-test');
      expect(webhook.events).toHaveLength(2);
      expect(webhook.isActive).toBe(true);
      expect(webhook.failureCount).toBe(0);
    });

    it('should allow optional lastTriggered field', () => {
      const webhook: WebhookConfig = {
        id: 'wh-new',
        name: 'New Hook',
        url: 'https://example.com',
        events: [],
        secret: '',
        isActive: false,
        failureCount: 0
      };

      expect(webhook.lastTriggered).toBeUndefined();
    });
  });
});
