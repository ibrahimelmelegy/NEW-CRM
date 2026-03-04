/* eslint-disable require-await */
/**
 * useNotificationCenter - Unit Tests
 * ====================================
 * Tests for composables/useNotificationCenter.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

import { useNotificationCenter } from '~/composables/useNotificationCenter';

const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;
(globalThis as any).useI18n = () => ({
  t: (key: string) => key,
  locale: ref('en')
});

describe('useNotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset shared state
    const nc = useNotificationCenter();
    nc.visible.value = false;
    nc.notifications.value = [];
    nc.unreadCount.value = 0;
    nc.activeTab.value = 'all';
  });

  // ============================================
  // open / close / toggle
  // ============================================
  describe('open / close / toggle', () => {
    it('should open the panel and fetch notifications', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: [], unreadNotificationsCount: 0 } });
      const nc = useNotificationCenter();

      nc.open();

      expect(nc.visible.value).toBe(true);
    });

    it('should close the panel', () => {
      const nc = useNotificationCenter();
      nc.visible.value = true;

      nc.close();

      expect(nc.visible.value).toBe(false);
    });

    it('should toggle from closed to open', () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: [], unreadNotificationsCount: 0 } });
      const nc = useNotificationCenter();
      nc.visible.value = false;

      nc.toggle();

      expect(nc.visible.value).toBe(true);
    });

    it('should toggle from open to closed', () => {
      const nc = useNotificationCenter();
      nc.visible.value = true;

      nc.toggle();

      expect(nc.visible.value).toBe(false);
    });
  });

  // ============================================
  // fetchNotifications
  // ============================================
  describe('fetchNotifications', () => {
    it('should populate notifications on success', async () => {
      const docs = [{ id: '1', type: 'LEAD_CREATED', body_en: 'New lead', read: 'UN_READ', createdAt: new Date().toISOString() }];
      mockApiFetch.mockResolvedValue({ success: true, body: { docs, unreadNotificationsCount: 1 } });

      const nc = useNotificationCenter();
      await nc.fetchNotifications();

      expect(nc.notifications.value).toEqual(docs);
      expect(nc.unreadCount.value).toBe(1);
    });

    it('should handle fetch failure gracefully', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const nc = useNotificationCenter();
      await nc.fetchNotifications();

      expect(nc.loading.value).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // fetchUnreadCount
  // ============================================
  describe('fetchUnreadCount', () => {
    it('should update unread count', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { count: 5 } });

      const nc = useNotificationCenter();
      await nc.fetchUnreadCount();

      expect(nc.unreadCount.value).toBe(5);
    });

    it('should silently fail on error', async () => {
      mockApiFetch.mockRejectedValue(new Error('fail'));

      const nc = useNotificationCenter();
      await nc.fetchUnreadCount(); // should not throw
    });
  });

  // ============================================
  // filteredNotifications
  // ============================================
  describe('filteredNotifications', () => {
    it('should return all notifications when tab is "all"', () => {
      const nc = useNotificationCenter();
      nc.notifications.value = [
        { id: '1', type: 'LEAD_CREATED', read: 'UN_READ', createdAt: new Date().toISOString() },
        { id: '2', type: 'DEAL_WON', read: 'READ', createdAt: new Date().toISOString() }
      ] as any;
      nc.activeTab.value = 'all';

      expect(nc.filteredNotifications.value).toHaveLength(2);
    });

    it('should return only unread when tab is "unread"', () => {
      const nc = useNotificationCenter();
      nc.notifications.value = [
        { id: '1', type: 'LEAD_CREATED', read: 'UN_READ', createdAt: new Date().toISOString() },
        { id: '2', type: 'DEAL_WON', read: 'READ', createdAt: new Date().toISOString() }
      ] as any;
      nc.activeTab.value = 'unread';

      expect(nc.filteredNotifications.value).toHaveLength(1);
      expect(nc.filteredNotifications.value[0]!.id).toBe('1');
    });

    it('should return only important types when tab is "important"', () => {
      const nc = useNotificationCenter();
      nc.notifications.value = [
        { id: '1', type: 'LEAD_CREATED', read: 'UN_READ', createdAt: new Date().toISOString() },
        { id: '2', type: 'DEAL_WON', read: 'READ', createdAt: new Date().toISOString() },
        { id: '3', type: 'SLA_BREACH', read: 'UN_READ', createdAt: new Date().toISOString() }
      ] as any;
      nc.activeTab.value = 'important';

      expect(nc.filteredNotifications.value).toHaveLength(2);
    });
  });

  // ============================================
  // markAllRead
  // ============================================
  describe('markAllRead', () => {
    it('should mark all notifications as read on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const nc = useNotificationCenter();
      nc.notifications.value = [{ id: '1', type: 'LEAD_CREATED', read: 'UN_READ', createdAt: new Date().toISOString() }] as any;
      nc.unreadCount.value = 1;

      await nc.markAllRead();

      expect(nc.notifications.value[0]!.read).toBe('READ');
      expect(nc.unreadCount.value).toBe(0);
    });
  });

  // ============================================
  // markRead
  // ============================================
  describe('markRead', () => {
    it('should mark a single notification as read', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const nc = useNotificationCenter();
      nc.notifications.value = [{ id: '1', type: 'LEAD_CREATED', read: 'UN_READ', createdAt: new Date().toISOString() }] as any;
      nc.unreadCount.value = 1;

      await nc.markRead('1');

      expect(nc.notifications.value[0]!.read).toBe('READ');
      expect(nc.unreadCount.value).toBe(0);
    });
  });

  // ============================================
  // clickNotification
  // ============================================
  describe('clickNotification', () => {
    it('should mark unread notification as clicked', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const nc = useNotificationCenter();
      const notif = { id: '1', type: 'LEAD_CREATED', read: 'UN_READ', createdAt: new Date().toISOString() } as any;
      nc.notifications.value = [notif];
      nc.unreadCount.value = 1;

      await nc.clickNotification(notif);

      expect(nc.notifications.value[0]!.read).toBe('CLICKED');
      expect(nc.unreadCount.value).toBe(0);
    });
  });

  // ============================================
  // getNotificationPath
  // ============================================
  describe('getNotificationPath', () => {
    it('should return null when no target', () => {
      const nc = useNotificationCenter();
      const result = nc.getNotificationPath({ id: '1', type: 'LEAD_CREATED', read: 'UN_READ', createdAt: '' } as any);
      expect(result).toBeNull();
    });

    it('should return correct path for lead type', () => {
      const nc = useNotificationCenter();
      const result = nc.getNotificationPath({ id: '1', type: 'LEAD_CREATED', target: '123', read: 'UN_READ', createdAt: '' } as any);
      expect(result).toBe('/sales/leads/123');
    });

    it('should return project path for project type', () => {
      const nc = useNotificationCenter();
      const result = nc.getNotificationPath({ id: '1', type: 'PROJECT_UPDATED', target: '5', read: 'UN_READ', createdAt: '' } as any);
      expect(result).toBe('/operations/projects/5');
    });

    it('should return null for system alert type', () => {
      const nc = useNotificationCenter();
      const result = nc.getNotificationPath({ id: '1', type: 'SYSTEM_ALERT', target: '1', read: 'UN_READ', createdAt: '' } as any);
      expect(result).toBeNull();
    });

    it('should return task path for task type', () => {
      const nc = useNotificationCenter();
      const result = nc.getNotificationPath({ id: '1', type: 'TASK_ASSIGNED', target: '1', read: 'UN_READ', createdAt: '' } as any);
      expect(result).toBe('/operations/daily-tasks');
    });
  });

  // ============================================
  // getNotificationText
  // ============================================
  describe('getNotificationText', () => {
    it('should return English text for en locale', () => {
      const nc = useNotificationCenter();
      const result = nc.getNotificationText({ body_en: 'Hello', body_ar: 'Marhaba' } as any);
      expect(result).toBe('Hello');
    });

    it('should return empty string when no text available', () => {
      const nc = useNotificationCenter();
      const result = nc.getNotificationText({} as any);
      expect(result).toBe('');
    });
  });
});
