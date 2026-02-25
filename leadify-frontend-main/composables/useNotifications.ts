/**
 * Universal Notification Center
 * Centralized notification management for the entire CRM.
 */

import { ref, computed } from 'vue';

export interface CrmNotification {
  id: string;
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

const STORAGE_KEY = 'crm_notifications';

function load(): CrmNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function save(items: CrmNotification[]) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const notifications = ref<CrmNotification[]>(load());

export function useNotifications() {
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

  const sorted = computed(() => [...notifications.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

  const unread = computed(() => sorted.value.filter(n => !n.read));

  function push(notif: Omit<CrmNotification, 'id' | 'read' | 'createdAt'>) {
    notifications.value.unshift({
      ...notif,
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString()
    });
    if (notifications.value.length > 200) notifications.value = notifications.value.slice(0, 200);
    save(notifications.value);
  }

  function markAsRead(id: string) {
    const n = notifications.value.find(x => x.id === id);
    if (n) {
      n.read = true;
      save(notifications.value);
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(n => (n.read = true));
    save(notifications.value);
  }

  function remove(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id);
    save(notifications.value);
  }

  function clearAll() {
    notifications.value = [];
    save(notifications.value);
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
    push({ type: 'warning', category: 'reminder', title, message, icon: 'ph:bell-ringing' });
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
    notifyDocumentCreated,
    notifyInvoiceOverdue,
    notifyReminder
  };
}
