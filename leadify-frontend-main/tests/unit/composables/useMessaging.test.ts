/**
 * useMessaging - Unit Tests
 * ===========================
 * Tests for composables/useMessaging.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { fetchConversations, fetchMessages, sendMessage, markConversationRead } from '~/composables/useMessaging';

const mockApiFetch = vi.fn();
(globalThis as Record<string, unknown>).useApiFetch = mockApiFetch;

describe('useMessaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchConversations
  // ============================================
  describe('fetchConversations', () => {
    it('should fetch and return conversations array', async () => {
      const conversations = [{ contactPhone: '+1234', contactName: 'John', lastMessage: 'Hi', lastMessageTime: '2024-01-01', unreadCount: 2 }];
      mockApiFetch.mockResolvedValue({ body: conversations, success: true });

      const result = await fetchConversations();

      expect(mockApiFetch).toHaveBeenCalledWith('messaging/conversations');
      expect(result).toEqual(conversations);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchConversations();

      expect(result).toEqual([]);
    });

    it('should return empty array when body is not an array', async () => {
      mockApiFetch.mockResolvedValue({ body: { invalid: true }, success: true });

      const result = await fetchConversations();

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // fetchMessages
  // ============================================
  describe('fetchMessages', () => {
    it('should fetch messages for a contact', async () => {
      const response = { messages: [{ id: '1', content: 'Hello' }], total: 1, page: 1, limit: 50 };
      mockApiFetch.mockResolvedValue({ body: response, success: true });

      const result = await fetchMessages('+1234567890');

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('messaging/messages/%2B1234567890'));
      expect(result).toEqual(response);
    });

    it('should support pagination parameter', async () => {
      mockApiFetch.mockResolvedValue({ body: { messages: [], total: 0, page: 2, limit: 50 }, success: true });

      await fetchMessages('+1234', 2);

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    });

    it('should return default empty response on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchMessages('+1234');

      expect(result).toEqual({ messages: [], total: 0, page: 1, limit: 50 });
    });
  });

  // ============================================
  // sendMessage
  // ============================================
  describe('sendMessage', () => {
    it('should send message via POST', async () => {
      mockApiFetch.mockResolvedValue({ body: { id: '1' }, success: true, message: 'Sent' });

      const result = await sendMessage('+1234', 'Hello');

      expect(mockApiFetch).toHaveBeenCalledWith('messaging/send', 'POST', {
        contactPhone: '+1234',
        contactName: undefined,
        content: 'Hello',
        provider: 'WHATSAPP'
      });
      expect(result.success).toBe(true);
    });

    it('should include contact name when provided', async () => {
      mockApiFetch.mockResolvedValue({ body: {}, success: true, message: '' });

      await sendMessage('+1234', 'Hi', 'John');

      expect(mockApiFetch).toHaveBeenCalledWith(
        'messaging/send',
        'POST',
        expect.objectContaining({
          contactName: 'John'
        })
      );
    });

    it('should use custom provider when specified', async () => {
      mockApiFetch.mockResolvedValue({ body: {}, success: true, message: '' });

      await sendMessage('+1234', 'Hi', undefined, 'SMS');

      expect(mockApiFetch).toHaveBeenCalledWith(
        'messaging/send',
        'POST',
        expect.objectContaining({
          provider: 'SMS'
        })
      );
    });

    it('should return failure info on error', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false, message: 'Rate limited' });

      const result = await sendMessage('+1234', 'Hi');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Rate limited');
    });
  });

  // ============================================
  // markConversationRead
  // ============================================
  describe('markConversationRead', () => {
    it('should call PUT to mark conversation as read', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await markConversationRead('+1234567890');

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('messaging/read/%2B1234567890'), 'PUT');
    });
  });
});
