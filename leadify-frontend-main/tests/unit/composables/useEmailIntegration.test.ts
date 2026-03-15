/**
 * useEmailIntegration - Unit Tests
 * ==================================
 * Tests for composables/useEmailIntegration.ts
 *
 * The module provides:
 * - fetchEmailAccounts(): get connected email accounts
 * - connectEmailAccount(data): connect a new email account
 * - disconnectEmailAccount(id): disconnect an email account
 * - fetchEmailMessages(query): fetch email messages with optional filters
 * - sendEmail(accountId, data): send an email via connected account
 * - fetchEmailTracking(messageId): get tracking events for a message
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  fetchEmailAccounts,
  connectEmailAccount,
  disconnectEmailAccount,
  fetchEmailMessages,
  sendEmail,
  fetchEmailTracking
} from '@/composables/useEmailIntegration';

const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);

describe('useEmailIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchEmailAccounts
  // ============================================
  describe('fetchEmailAccounts', () => {
    it('should fetch connected email accounts', async () => {
      const mockAccounts = [
        { id: 'acc-1', userId: 'user-1', provider: 'gmail', email: 'user@gmail.com', isActive: true },
        { id: 'acc-2', userId: 'user-1', provider: 'outlook', email: 'user@outlook.com', isActive: true }
      ];
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockAccounts }, success: true });

      const result = await fetchEmailAccounts();

      expect(mockUseApiFetch).toHaveBeenCalledWith('email/accounts', 'GET', {}, true);
      expect(result).toHaveLength(2);
      expect(result[0]?.provider).toBe('gmail');
    });

    it('should handle body as direct array', async () => {
      const mockAccounts = [{ id: 'acc-1', userId: 'user-1', provider: 'gmail', email: 'user@gmail.com', isActive: true }];
      mockUseApiFetch.mockResolvedValue({ body: mockAccounts, success: true });

      const result = await fetchEmailAccounts();

      expect(result).toHaveLength(1);
    });

    it('should return empty array when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchEmailAccounts();

      expect(result).toEqual([]);
    });

    it('should return empty array when body is null', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: true });

      const result = await fetchEmailAccounts();

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // connectEmailAccount
  // ============================================
  describe('connectEmailAccount', () => {
    it('should call POST with connection data', async () => {
      const data = { provider: 'gmail', code: 'oauth-code-123', redirectUri: 'http://localhost:3000/callback' };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 'acc-3', ...data } });

      const result = await connectEmailAccount(data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('email/accounts', 'POST', data);
      expect(result).toBeDefined();
    });

    it('should return the API response on success', async () => {
      const response = { success: true, body: { id: 'acc-3', provider: 'gmail', email: 'new@gmail.com', isActive: true } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await connectEmailAccount({ provider: 'gmail', code: 'auth-code' });

      expect(result).toEqual(response);
    });

    it('should handle connection failure', async () => {
      const response = { success: false, message: 'OAuth authentication failed' };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await connectEmailAccount({ provider: 'gmail', code: 'invalid-code' });

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // disconnectEmailAccount
  // ============================================
  describe('disconnectEmailAccount', () => {
    it('should call DELETE with account ID', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await disconnectEmailAccount('acc-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('email/accounts/acc-1', 'DELETE');
    });

    it('should return the API response', async () => {
      const response = { success: true, body: null };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await disconnectEmailAccount('acc-1');

      expect(result).toEqual(response);
    });

    it('should handle disconnection failure', async () => {
      const response = { success: false, message: 'Account not found' };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await disconnectEmailAccount('nonexistent');

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // fetchEmailMessages
  // ============================================
  describe('fetchEmailMessages', () => {
    it('should fetch messages without query params', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          accountId: 'acc-1',
          subject: 'Hello',
          from: 'sender@example.com',
          to: ['user@gmail.com'],
          body: 'Hi',
          isRead: false,
          folder: 'INBOX',
          sentAt: '2024-01-01',
          createdAt: '2024-01-01'
        }
      ];
      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockMessages, pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 } },
        success: true
      });

      const result = await fetchEmailMessages();

      expect(mockUseApiFetch).toHaveBeenCalledWith('email/messages', 'GET', {}, true);
      expect(result.docs).toHaveLength(1);
    });

    it('should include query params in URL', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchEmailMessages({ folder: 'SENT', isRead: 'false' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('folder=SENT');
      expect(calledUrl).toContain('isRead=false');
    });

    it('should return default empty result on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchEmailMessages();

      expect(result.docs).toEqual([]);
      expect(result.pagination).toBeDefined();
    });

    it('should filter by accountId when provided', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchEmailMessages({ accountId: 'acc-1' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('accountId=acc-1');
    });
  });

  // ============================================
  // sendEmail
  // ============================================
  describe('sendEmail', () => {
    it('should call the send endpoint with account ID and email data', async () => {
      const emailData = { to: 'recipient@example.com', subject: 'Test Email', body: 'Hello!' };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 'msg-2', ...emailData, sentAt: '2024-01-01' } });

      await sendEmail('acc-1', emailData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('email/messages/send', 'POST', { accountId: 'acc-1', ...emailData });
    });

    it('should include CC and BCC when provided', async () => {
      const emailData = { to: 'main@example.com', subject: 'Test', body: 'Hi', cc: 'cc@example.com', bcc: 'bcc@example.com' };
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await sendEmail('acc-1', emailData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('email/messages/send', 'POST', { accountId: 'acc-1', ...emailData });
    });

    it('should return the API response', async () => {
      const response = { success: true, body: { id: 'msg-2', sentAt: '2024-01-01' } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await sendEmail('acc-1', { to: 'r@example.com', subject: 'Hi', body: 'Hello' });

      expect(result).toEqual(response);
    });

    it('should handle send failure', async () => {
      const response = { success: false, message: 'SMTP error' };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await sendEmail('acc-1', { to: 'r@example.com', subject: 'Hi', body: 'Hello' });

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // fetchEmailTracking
  // ============================================
  describe('fetchEmailTracking', () => {
    it('should fetch tracking events for a message', async () => {
      const mockTracking = [
        { id: 'track-1', messageId: 'msg-1', event: 'OPENED', timestamp: '2024-01-01T10:00:00Z' },
        { id: 'track-2', messageId: 'msg-1', event: 'CLICKED', timestamp: '2024-01-01T10:05:00Z' }
      ];
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockTracking }, success: true });

      const result = await fetchEmailTracking('msg-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('email/tracking/msg-1');
      expect(result).toHaveLength(2);
    });

    it('should handle body as direct array', async () => {
      const mockTracking = [{ id: 'track-1', event: 'OPENED' }];
      mockUseApiFetch.mockResolvedValue({ body: mockTracking, success: true });

      const result = await fetchEmailTracking('msg-1');

      expect(result).toHaveLength(1);
    });

    it('should return empty array when message not found', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchEmailTracking('nonexistent');

      expect(result).toEqual([]);
    });

    it('should return empty array when no tracking data', async () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      const result = await fetchEmailTracking('msg-1');

      expect(result).toEqual([]);
    });
  });
});
