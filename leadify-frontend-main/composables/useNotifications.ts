/**
 * Universal Notification Center — API-backed with local cache
 * Centralized notification management for the entire CRM.
 */

import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface CrmNotification {
  id: string | number;
  type: 'info' | 'success' | 'warning' | 'danger';
  category: 'document' | 'invoice' | 'reminder' | 'system' | 'client' | 'task';
  title: string;
  message: string;
  icon: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const notifications = ref<CrmNotification[]>([]);
const loading = ref(false);

export function useNotifications() {
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

  const sorted = computed(() => [...notifications.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

  const unread = computed(() => sorted.value.filter(n => !n.read));

  async function fetchNotifications() {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('notification?limit=100');
      if (success && body) {
        const data = body as any;
        const docs = data.docs || data || [];
        notifications.value = docs.map((n: any) => ({
          id: n.id,
          type: n.type || 'info',
          category: n.category || 'system',
          title: n.title || n.subject || '',
          message: n.message || n.body || '',
          icon: n.icon || 'ph:bell',
          read: n.read || n.isRead || false,
          actionUrl: n.actionUrl || n.link,
          createdAt: n.createdAt,
          metadata: n.metadata
        }));
      }
    } finally {
      loading.value = false;
    }
  }

  function push(notif: Omit<CrmNotification, 'id' | 'read' | 'createdAt'>) {
    notifications.value.unshift({
      ...notif,
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString()
    });
    if (notifications.value.length > 200) {
      notifications.value = notifications.value.slice(0, 200);
    }
  }

  async function markAsRead(id: string | number) {
    const n = notifications.value.find(x => x.id === id);
    if (n) {
      n.read = true;
      if (typeof id === 'number') {
        await useApiFetch(`notification/${id}/read`, 'PUT', {}, true);
      }
    }
  }

  async function markAllAsRead() {
    notifications.value.forEach(n => (n.read = true));
    await useApiFetch('notification/read-all', 'PUT', {}, true);
  }

  async function remove(id: string | number) {
    notifications.value = notifications.value.filter(n => n.id !== id);
    if (typeof id === 'number') {
      await useApiFetch(`notification/${id}`, 'DELETE', {}, true);
    }
  }

  function clearAll() {
    notifications.value = [];
  }

  // ── Convenience push helpers ──
  function notifyDocumentCreated(refNumber: string, docType: string) {
    push({
      type: 'success',
      category: 'document',
      title: 'Document Created',
      message: `${refNumber} (${docType}) created successfully.`,
      icon: 'ph:file-check'
    });
  }

  function notifyInvoiceOverdue(refNumber: string, daysOverdue: number) {
    push({
      type: 'danger',
      category: 'invoice',
      title: 'Invoice Overdue',
      message: `${refNumber} is ${daysOverdue} days overdue.`,
      icon: 'ph:warning-circle',
      actionUrl: '/sales/invoices'
    });
  }

  function notifyReminder(title: string, message: string) {
    push({
      type: 'warning',
      category: 'reminder',
      title,
      message,
      icon: 'ph:bell-ringing'
    });
  }

  return {
    notifications: sorted,
    unread,
    unreadCount,
    push,
    markAsRead,
    markAllAsRead,
    remove,
    clearAll,
    fetchNotifications,
    notifyDocumentCreated,
    notifyInvoiceOverdue,
    notifyReminder,
    loading
  };
}
