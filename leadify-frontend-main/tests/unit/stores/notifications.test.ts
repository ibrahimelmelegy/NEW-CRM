/**
 * useNotificationStore - Unit Tests
 * ====================================
 * Tests for stores/notifications.ts Pinia store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNotificationStore } from '@/stores/notifications';

// Mock useApiFetch globally
globalThis.useApiFetch = vi.fn();

// Mock useI18n
globalThis.useI18n = () => ({ t: (key: string) => key, locale: ref('en') });

const mockNotification = (overrides: Record<string, unknown> = {}) => ({
  id: 'notif-1',
  title: 'Test Notification',
  message: 'You have a new lead',
  type: 'info',
  read: false,
  status: 'UN_READ',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides
});

describe('useNotificationStore', () => {
  let store: ReturnType<typeof useNotificationStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useNotificationStore();
    vi.clearAllMocks();
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.notifications).toEqual([]);
      expect(store.unreadCount).toBe(0);
      expect(store.loading).toBe(false);
    });
  });

  // ============================================
  // Getters
  // ============================================
  describe('getters', () => {
    it('unreadNotifications should filter out read notifications', () => {
      store.notifications = [
        mockNotification({ id: 'notif-1', read: false }),
        mockNotification({ id: 'notif-2', read: true }),
        mockNotification({ id: 'notif-3', read: false })
      ] as any;

      expect(store.unreadNotifications).toHaveLength(2);
      expect(store.unreadNotifications.every((n: any) => !n.read)).toBe(true);
    });

    it('unreadNotifications should return empty array when all are read', () => {
      store.notifications = [mockNotification({ id: 'notif-1', read: true }), mockNotification({ id: 'notif-2', read: true })] as any;

      expect(store.unreadNotifications).toHaveLength(0);
    });
  });

  // ============================================
  // Actions
  // ============================================
  describe('fetchNotifications', () => {
    it('should fetch notifications and set them', async () => {
      const notifications = [
        mockNotification({ id: 'notif-1', status: 'UN_READ' }),
        mockNotification({ id: 'notif-2', status: 'READ' }),
        mockNotification({ id: 'notif-3', status: 'UN_READ' })
      ];

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: { docs: notifications, totalPages: 1, total: 3 }
      });

      await store.fetchNotifications();

      expect(globalThis.useApiFetch).toHaveBeenCalledWith(expect.stringContaining('notification?page='));
      expect(store.notifications).toHaveLength(3);
      expect(store.loading).toBe(false);
    });

    it('should handle fetch failure gracefully', async () => {
      (globalThis.useApiFetch as any).mockRejectedValue(new Error('Server error'));

      await store.fetchNotifications();

      expect(store.notifications).toEqual([]);
      expect(store.loading).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should mark a specific notification as read and decrement unread count', async () => {
      store.notifications = [mockNotification({ id: 'notif-1', read: false }), mockNotification({ id: 'notif-2', read: false })] as any;
      store.unreadCount = 2;

      (globalThis.useApiFetch as any).mockResolvedValue({ success: true });

      await store.markAsRead('notif-1');

      expect(globalThis.useApiFetch).toHaveBeenCalledWith('notification/read/notif-1', 'PUT');
      expect(store.notifications[0]!.read).toBe(true);
      expect(store.notifications[1]!.read).toBe(false);
      expect(store.unreadCount).toBe(1);
    });

    it('should not decrement below 0', async () => {
      store.notifications = [mockNotification({ id: 'notif-1', read: false })] as any;
      store.unreadCount = 0;

      (globalThis.useApiFetch as any).mockResolvedValue({ success: true });

      await store.markAsRead('notif-1');

      expect(store.unreadCount).toBe(0);
    });

    it('should not change state if API call fails', async () => {
      store.notifications = [mockNotification({ id: 'notif-1', read: false })] as any;
      store.unreadCount = 1;

      (globalThis.useApiFetch as any).mockResolvedValue({ success: false });

      await store.markAsRead('notif-1');

      expect(store.notifications[0]!.read).toBe(false);
      expect(store.unreadCount).toBe(1);
    });
  });

  describe('markAllRead', () => {
    it('should mark all notifications as read and reset unread count', async () => {
      store.notifications = [
        mockNotification({ id: 'notif-1', read: false }),
        mockNotification({ id: 'notif-2', read: false }),
        mockNotification({ id: 'notif-3', read: true })
      ] as any;
      store.unreadCount = 2;

      (globalThis.useApiFetch as any).mockResolvedValue({ success: true });

      await store.markAllRead();

      expect(globalThis.useApiFetch).toHaveBeenCalledWith('notification/read-all', 'PUT');
      expect(store.notifications.every((n: any) => n.read)).toBe(true);
      expect(store.unreadCount).toBe(0);
    });

    it('should not change state if API call fails', async () => {
      store.notifications = [mockNotification({ id: 'notif-1', read: false })] as any;
      store.unreadCount = 1;

      (globalThis.useApiFetch as any).mockRejectedValue(new Error('Network error'));

      await store.markAllRead();

      expect(store.notifications[0]!.read).toBe(false);
      expect(store.unreadCount).toBe(1);
    });
  });

  describe('fetchUnreadCount', () => {
    it('should fetch and set the unread count', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: { count: 7 }
      });

      await store.fetchUnreadCount();

      expect(globalThis.useApiFetch).toHaveBeenCalledWith('notification/unread-count');
      expect(store.unreadCount).toBe(7);
    });

    it('should not update count on failure', async () => {
      store.unreadCount = 3;

      (globalThis.useApiFetch as any).mockRejectedValue(new Error('Error'));

      await store.fetchUnreadCount();

      expect(store.unreadCount).toBe(3);
    });
  });
});
