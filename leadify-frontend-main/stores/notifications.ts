import { defineStore } from 'pinia';
import { useSocketStore } from '~/stores/socket';
import type { AppNotification } from '~/types/models';
import logger from '~/utils/logger'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as AppNotification[],
    unreadCount: 0,
    loading: false,
    page: 1,
    totalPages: 1,
    totalItems: 0,
    socketListenerAttached: false
  }),

  getters: {
    unreadNotifications(): AppNotification[] {
      return this.notifications.filter(n => !n.read);
    },
    hasMore(): boolean {
      return this.page < this.totalPages;
    }
  },

  actions: {
    async fetchNotifications(page = 1, limit = 20, reset = true) {
      this.loading = true;

      try {
        const response = await useApiFetch(`notification?page=${page}&limit=${limit}`);

        if (response.success && response.body) {
          const docs = (response.body.docs || []).map((n: Record<string, unknown>) => ({
            ...n,
            read: n.read === 'READ' || n.read === 'CLICKED' || n.read === true
          }));

          if (reset) {
            this.notifications = docs;
          } else {
            // Append for pagination, deduplicate by id
            const existingIds = new Set(this.notifications.map((n: AppNotification) => n.id));
            const newDocs = docs.filter((n: AppNotification) => !existingIds.has(n.id));
            this.notifications = [...this.notifications, ...newDocs];
          }

          this.unreadCount = response.body.unreadNotificationsCount ?? this.notifications.filter((n: AppNotification) => !n.read).length;
          this.page = response.body.pagination?.page ?? page;
          this.totalPages = response.body.pagination?.totalPages ?? 1;
          this.totalItems = response.body.pagination?.totalItems ?? this.notifications.length;
        }
      } catch (error: unknown) {
        logger.error('Error fetching notifications:', error);
      } finally {
        this.loading = false;
      }
    },

    async loadMore() {
      if (this.hasMore && !this.loading) {
        await this.fetchNotifications(this.page + 1, 20, false);
      }
    },

    async fetchUnreadCount() {
      try {
        const response = await useApiFetch('notification/unread-count');

        if (response.success && response.body) {
          this.unreadCount = response.body.count;
        }
      } catch (error: unknown) {
        logger.error('Error fetching unread count:', error);
      }
    },

    async markAsRead(id: string) {
      try {
        const response = await useApiFetch(`notification/read/${id}`, 'PUT');

        if (response.success) {
          const notification = this.notifications.find(n => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
        }
      } catch (error: unknown) {
        logger.error('Error marking notification as read:', error);
      }
    },

    async markAllRead() {
      try {
        const response = await useApiFetch('notification/read-all', 'PUT');

        if (response.success) {
          for (const notification of this.notifications) {
            notification.read = true;
          }
          this.unreadCount = 0;
        }
      } catch (error: unknown) {
        logger.error('Error marking all notifications as read:', error);
      }
    },

    async deleteNotification(id: string) {
      try {
        const response = await useApiFetch(`notification/${id}`, 'DELETE');

        if (response.success) {
          const idx = this.notifications.findIndex(n => n.id === id);
          if (idx !== -1) {
            const wasUnread = !this.notifications[idx]?.read;
            this.notifications.splice(idx, 1);
            if (wasUnread) {
              this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
            this.totalItems = Math.max(0, this.totalItems - 1);
          }
        }
      } catch (error: unknown) {
        logger.error('Error deleting notification:', error);
      }
    },

    /**
     * Attach Socket.io listener for real-time notifications.
     * Safe to call multiple times -- only attaches once.
     */
    initSocketListener() {
      if (this.socketListenerAttached) return;

      const socketStore = useSocketStore();

      // Ensure socket is connected
      if (!socketStore.connected) {
        socketStore.connect();
      }

      socketStore.on('notification:new', (data: Record<string, unknown>) => {
        if (!data) return;

        const notif = data.notification || data;
        const newNotification: AppNotification = {
          id: notif.id,
          title: notif.title || '',
          message: notif.message || notif.body_en || '',
          type: notif.type || 'info',
          read: false,
          body_en: notif.message || notif.body_en || '',
          body_ar: notif.body_ar || notif.message || '',
          target: notif.actionUrl || notif.entityId || '',
          entityType: notif.entityType || '',
          entityId: notif.entityId || '',
          priority: notif.priority || 'MEDIUM',
          createdAt: notif.createdAt || new Date().toISOString()
        };

        // Prepend to notifications list
        this.notifications.unshift(newNotification);
        this.unreadCount += 1;
        this.totalItems += 1;

        // Show an Element Plus notification toast
        if (typeof ElNotification !== 'undefined') {
          ElNotification({
            title: newNotification.title || 'New Notification',
            message: newNotification.message,
            type: 'info',
            duration: 5000,
            position: 'bottom-right'
          });
        }
      });

      socketStore.on('notification:read', (data: Record<string, unknown>) => {
        if (!data) return;
        if (data.readAll) {
          // All notifications marked as read by another tab/device
          for (const notification of this.notifications) {
            notification.read = true;
          }
          this.unreadCount = 0;
        }
      });

      this.socketListenerAttached = true;
    }
  }
});
