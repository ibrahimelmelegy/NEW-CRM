import { defineStore } from 'pinia';
import type { AppNotification } from '~/types/models';

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as AppNotification[],
    unreadCount: 0,
    loading: false
  }),

  getters: {
    unreadNotifications(): AppNotification[] {
      return this.notifications.filter((n) => !n.read);
    }
  },

  actions: {
    async fetchNotifications() {
      this.loading = true;

      try {
        const response = await useApiFetch<{ docs: AppNotification[] }>('notification');

        if (response.success && response.body) {
          this.notifications = response.body.docs || [];
          this.unreadCount = this.notifications.filter((n) => !n.read).length;
        }
      } catch (error: unknown) {
        console.error('Error fetching notifications:', error);
      } finally {
        this.loading = false;
      }
    },

    async markAsRead(id: string) {
      try {
        const response = await useApiFetch(`notification/${id}/read`, 'PUT');

        if (response.success) {
          const notification = this.notifications.find((n) => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
        }
      } catch (error: unknown) {
        console.error('Error marking notification as read:', error);
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
        console.error('Error marking all notifications as read:', error);
      }
    },

    async fetchUnreadCount() {
      try {
        const response = await useApiFetch<{ count: number }>('notification/unread-count');

        if (response.success && response.body) {
          this.unreadCount = response.body.count;
        }
      } catch (error: unknown) {
        console.error('Error fetching unread count:', error);
      }
    }
  }
});
