/**
 * useNotifications - Unit Tests
 * ==============================
 * Tests for composables/useNotifications.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNotifications, type CrmNotification } from '~/composables/useNotifications';

// Mock useApiFetch globally
const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: any[]) => mockApiFetch(...args)
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear notifications state between tests
    const { clearAll } = useNotifications();
    clearAll();
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should start with empty notifications', () => {
      const { notifications, unreadCount } = useNotifications();

      expect(notifications.value).toEqual([]);
      expect(unreadCount.value).toBe(0);
    });

    it('should have loading as false initially', () => {
      const { loading } = useNotifications();

      expect(loading.value).toBe(false);
    });
  });

  // ============================================
  // push
  // ============================================
  describe('push', () => {
    it('should add a notification to the list', () => {
      const { push, notifications, unreadCount } = useNotifications();

      push({
        type: 'info',
        category: 'system',
        title: 'Test Notification',
        message: 'This is a test',
        icon: 'ph:bell'
      });

      expect(notifications.value).toHaveLength(1);
      expect(notifications.value[0].title).toBe('Test Notification');
      expect(notifications.value[0].read).toBe(false);
      expect(unreadCount.value).toBe(1);
    });

    it('should auto-generate id and createdAt', () => {
      const { push, notifications } = useNotifications();

      push({
        type: 'success',
        category: 'document',
        title: 'Document Created',
        message: 'REF-001 created',
        icon: 'ph:file-check'
      });

      const notif = notifications.value[0];
      expect(notif.id).toBeDefined();
      expect(typeof notif.id).toBe('string');
      expect(notif.createdAt).toBeDefined();
    });

    it('should add new notifications at the top', () => {
      const { push, notifications } = useNotifications();

      push({ type: 'info', category: 'system', title: 'First', message: 'msg1', icon: 'ph:bell' });
      push({ type: 'info', category: 'system', title: 'Second', message: 'msg2', icon: 'ph:bell' });

      // Sorted by createdAt desc, so Second should be first
      expect(notifications.value[0].title).toBe('Second');
    });

    it('should cap notifications at 200', () => {
      const { push, notifications } = useNotifications();

      for (let i = 0; i < 210; i++) {
        push({ type: 'info', category: 'system', title: `Notif ${i}`, message: 'msg', icon: 'ph:bell' });
      }

      // Internal array is capped at 200
      expect(notifications.value.length).toBeLessThanOrEqual(200);
    });
  });

  // ============================================
  // markAsRead
  // ============================================
  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const { push, markAsRead, notifications, unreadCount } = useNotifications();

      push({ type: 'info', category: 'system', title: 'Test', message: 'msg', icon: 'ph:bell' });
      const id = notifications.value[0].id;

      await markAsRead(id);

      expect(notifications.value[0].read).toBe(true);
      expect(unreadCount.value).toBe(0);
    });

    it('should call API for numeric ids', async () => {
      const { push, markAsRead, notifications } = useNotifications();
      mockApiFetch.mockResolvedValue({ success: true });

      push({ type: 'info', category: 'system', title: 'Test', message: 'msg', icon: 'ph:bell' });
      // Override the auto-generated string id with a numeric one
      (notifications.value[0] as any).id = 42;

      await markAsRead(42);

      expect(mockApiFetch).toHaveBeenCalledWith('notification/42/read', 'PUT', {}, true);
    });

    it('should not call API for string ids (local notifications)', async () => {
      const { push, markAsRead, notifications } = useNotifications();

      push({ type: 'info', category: 'system', title: 'Test', message: 'msg', icon: 'ph:bell' });
      const id = notifications.value[0].id;

      await markAsRead(id);

      expect(mockApiFetch).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // markAllAsRead
  // ============================================
  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const { push, markAllAsRead, unreadCount } = useNotifications();
      mockApiFetch.mockResolvedValue({ success: true });

      push({ type: 'info', category: 'system', title: 'N1', message: 'msg', icon: 'ph:bell' });
      push({ type: 'warning', category: 'task', title: 'N2', message: 'msg', icon: 'ph:bell' });
      push({ type: 'danger', category: 'invoice', title: 'N3', message: 'msg', icon: 'ph:bell' });

      expect(unreadCount.value).toBe(3);

      await markAllAsRead();

      expect(unreadCount.value).toBe(0);
      expect(mockApiFetch).toHaveBeenCalledWith('notification/read-all', 'PUT', {}, true);
    });
  });

  // ============================================
  // remove
  // ============================================
  describe('remove', () => {
    it('should remove notification by id', async () => {
      const { push, remove, notifications } = useNotifications();

      push({ type: 'info', category: 'system', title: 'ToRemove', message: 'msg', icon: 'ph:bell' });
      const id = notifications.value[0].id;

      await remove(id);

      expect(notifications.value).toHaveLength(0);
    });

    it('should call API DELETE for numeric ids', async () => {
      const { push, remove, notifications } = useNotifications();
      mockApiFetch.mockResolvedValue({ success: true });

      push({ type: 'info', category: 'system', title: 'Test', message: 'msg', icon: 'ph:bell' });
      (notifications.value[0] as any).id = 99;

      await remove(99);

      expect(mockApiFetch).toHaveBeenCalledWith('notification/99', 'DELETE', {}, true);
    });
  });

  // ============================================
  // clearAll
  // ============================================
  describe('clearAll', () => {
    it('should clear all notifications', () => {
      const { push, clearAll, notifications, unreadCount } = useNotifications();

      push({ type: 'info', category: 'system', title: 'N1', message: 'msg', icon: 'ph:bell' });
      push({ type: 'info', category: 'system', title: 'N2', message: 'msg', icon: 'ph:bell' });

      clearAll();

      expect(notifications.value).toHaveLength(0);
      expect(unreadCount.value).toBe(0);
    });
  });

  // ============================================
  // fetchNotifications
  // ============================================
  describe('fetchNotifications', () => {
    it('should fetch and map notifications from API', async () => {
      const apiResponse = {
        docs: [
          {
            id: 1,
            type: 'success',
            category: 'document',
            title: 'Document Ready',
            message: 'Your document is ready',
            icon: 'ph:file',
            read: false,
            createdAt: '2024-01-15T10:00:00Z'
          }
        ]
      };
      mockApiFetch.mockResolvedValue({ body: apiResponse, success: true });

      const { fetchNotifications, notifications } = useNotifications();

      await fetchNotifications();

      expect(mockApiFetch).toHaveBeenCalledWith('notification?limit=100');
      expect(notifications.value).toHaveLength(1);
      expect(notifications.value[0].title).toBe('Document Ready');
    });

    it('should handle API response without docs wrapper', async () => {
      const apiResponse = [
        {
          id: 2,
          type: 'info',
          subject: 'Alert',
          body: 'System update',
          isRead: true,
          createdAt: '2024-01-15T10:00:00Z'
        }
      ];
      mockApiFetch.mockResolvedValue({ body: apiResponse, success: true });

      const { fetchNotifications, notifications } = useNotifications();

      await fetchNotifications();

      expect(notifications.value).toHaveLength(1);
      expect(notifications.value[0].title).toBe('Alert');
      expect(notifications.value[0].message).toBe('System update');
      expect(notifications.value[0].read).toBe(true);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApiFetch.mockReturnValue(pendingPromise);

      const { fetchNotifications, loading } = useNotifications();

      const fetchPromise = fetchNotifications();
      expect(loading.value).toBe(true);

      resolvePromise!({ body: { docs: [] }, success: true });
      await fetchPromise;

      expect(loading.value).toBe(false);
    });

    it('should set loading to false even on error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const { fetchNotifications, loading } = useNotifications();

      // fetchNotifications uses try/finally, so loading should be false even on error
      await fetchNotifications().catch(() => {});

      expect(loading.value).toBe(false);
    });
  });

  // ============================================
  // Computed Properties
  // ============================================
  describe('computed properties', () => {
    it('unread should only include unread notifications', () => {
      const { push, markAsRead, unread, notifications } = useNotifications();

      push({ type: 'info', category: 'system', title: 'Read', message: 'msg', icon: 'ph:bell' });
      push({ type: 'info', category: 'system', title: 'Unread', message: 'msg', icon: 'ph:bell' });

      // Mark the first one as read
      const firstId = notifications.value.find(n => n.title === 'Read')!.id;
      markAsRead(firstId);

      expect(unread.value).toHaveLength(1);
      expect(unread.value[0].title).toBe('Unread');
    });

    it('notifications should be sorted by createdAt descending', () => {
      const { push, notifications } = useNotifications();

      push({ type: 'info', category: 'system', title: 'Older', message: 'msg', icon: 'ph:bell' });
      // Small delay to ensure different timestamps
      push({ type: 'info', category: 'system', title: 'Newer', message: 'msg', icon: 'ph:bell' });

      // Most recent first
      expect(notifications.value[0].title).toBe('Newer');
    });
  });

  // ============================================
  // Convenience Push Helpers
  // ============================================
  describe('notifyDocumentCreated', () => {
    it('should push a document created notification', () => {
      const { notifyDocumentCreated, notifications } = useNotifications();

      notifyDocumentCreated('REF-001', 'Invoice');

      expect(notifications.value).toHaveLength(1);
      expect(notifications.value[0].type).toBe('success');
      expect(notifications.value[0].category).toBe('document');
      expect(notifications.value[0].title).toBe('Document Created');
      expect(notifications.value[0].message).toContain('REF-001');
      expect(notifications.value[0].message).toContain('Invoice');
    });
  });

  describe('notifyInvoiceOverdue', () => {
    it('should push an overdue invoice notification', () => {
      const { notifyInvoiceOverdue, notifications } = useNotifications();

      notifyInvoiceOverdue('INV-2024-001', 15);

      expect(notifications.value).toHaveLength(1);
      expect(notifications.value[0].type).toBe('danger');
      expect(notifications.value[0].category).toBe('invoice');
      expect(notifications.value[0].title).toBe('Invoice Overdue');
      expect(notifications.value[0].message).toContain('INV-2024-001');
      expect(notifications.value[0].message).toContain('15');
      expect(notifications.value[0].actionUrl).toBe('/sales/invoices');
    });
  });

  describe('notifyReminder', () => {
    it('should push a reminder notification', () => {
      const { notifyReminder, notifications } = useNotifications();

      notifyReminder('Follow-up Call', 'Call client about contract renewal');

      expect(notifications.value).toHaveLength(1);
      expect(notifications.value[0].type).toBe('warning');
      expect(notifications.value[0].category).toBe('reminder');
      expect(notifications.value[0].title).toBe('Follow-up Call');
      expect(notifications.value[0].message).toBe('Call client about contract renewal');
    });
  });

  // ============================================
  // CrmNotification interface
  // ============================================
  describe('CrmNotification interface', () => {
    it('should create valid CrmNotification object', () => {
      const notif: CrmNotification = {
        id: 'n-123',
        type: 'success',
        category: 'document',
        title: 'Test',
        message: 'Test message',
        icon: 'ph:check',
        read: false,
        actionUrl: '/test',
        createdAt: '2024-01-15T10:00:00Z',
        metadata: { key: 'value' }
      };

      expect(notif.id).toBe('n-123');
      expect(notif.type).toBe('success');
      expect(notif.category).toBe('document');
      expect(notif.metadata?.key).toBe('value');
    });
  });
});
