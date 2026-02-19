/**
 * Notification Center composable
 * Manages the slide-out notification panel state, data fetching,
 * filtering, grouping, and read/dismiss actions.
 *
 * Uses module-level refs so all callers share the same state (singleton).
 */

interface NotificationData {
  id: string;
  type: string;
  body_en?: string;
  body_ar?: string;
  target?: string;
  read: 'READ' | 'UN_READ' | 'CLICKED';
  createdAt: string;
  updatedAt?: string;
}

type TabFilter = 'all' | 'unread' | 'important';

interface NotificationGroup {
  label: string;
  items: NotificationData[];
}

// Important notification types that warrant the "important" tab
const IMPORTANT_TYPES = [
  'DEAL_WON',
  'SLA_BREACH',
  'SLA_WARNING',
  'INVOICE_OVERDUE',
  'CONTRACT_EXPIRING',
  'SYSTEM_ALERT',
  'APPROVAL_REQUESTED'
];

// Shared state across all component instances
const visible = ref(false);
const notifications = ref<NotificationData[]>([]);
const unreadCount = ref(0);
const activeTab = ref<TabFilter>('all');
const loading = ref(false);

export function useNotificationCenter() {
  const { locale } = useI18n();

  const open = () => {
    visible.value = true;
    fetchNotifications();
  };
  const close = () => {
    visible.value = false;
  };
  const toggle = () => {
    if (visible.value) {
      close();
    } else {
      open();
    }
  };

  // Fetch notifications from API
  async function fetchNotifications() {
    loading.value = true;
    try {
      const res = await useApiFetch('notification?limit=50', 'GET', {}, true);
      if (res?.success && res?.body) {
        notifications.value = res.body.docs || [];
        unreadCount.value = res.body.unreadNotificationsCount || 0;
      }
    } catch (e) {
      console.error('[NotificationCenter] Failed to fetch:', e);
    } finally {
      loading.value = false;
    }
  }

  // Fetch just the unread count (lightweight, for polling)
  async function fetchUnreadCount() {
    try {
      const res = await useApiFetch('notification/unread-count', 'GET', {}, true);
      if (res?.success && res?.body) {
        unreadCount.value = res.body.count || 0;
      }
    } catch (e) {
      // Silently fail - this is a background poll
    }
  }

  // Filter notifications by active tab
  const filteredNotifications = computed(() => {
    const items = notifications.value;
    switch (activeTab.value) {
      case 'unread':
        return items.filter((n) => n.read === 'UN_READ');
      case 'important':
        return items.filter((n) => IMPORTANT_TYPES.includes(n.type));
      default:
        return items;
    }
  });

  // Group filtered notifications by date: Today, Yesterday, This Week, Older
  const groupedNotifications = computed((): NotificationGroup[] => {
    const items = filteredNotifications.value;
    if (!items.length) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: Record<string, NotificationData[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    for (const notif of items) {
      const date = new Date(notif.createdAt);
      if (date >= today) {
        groups.today.push(notif);
      } else if (date >= yesterday) {
        groups.yesterday.push(notif);
      } else if (date >= weekAgo) {
        groups.thisWeek.push(notif);
      } else {
        groups.older.push(notif);
      }
    }

    const { t } = useI18n();
    const result: NotificationGroup[] = [];

    if (groups.today.length) {
      result.push({ label: t('common.today'), items: groups.today });
    }
    if (groups.yesterday.length) {
      result.push({ label: t('common.yesterday'), items: groups.yesterday });
    }
    if (groups.thisWeek.length) {
      result.push({ label: t('notifications.thisWeek'), items: groups.thisWeek });
    }
    if (groups.older.length) {
      result.push({ label: t('notifications.older'), items: groups.older });
    }

    return result;
  });

  // Mark all notifications as read
  async function markAllRead() {
    try {
      const res = await useApiFetch('notification/', 'PUT');
      if (res?.success) {
        notifications.value = notifications.value.map((n) => ({
          ...n,
          read: 'READ' as const
        }));
        unreadCount.value = 0;
      }
    } catch (e) {
      console.error('[NotificationCenter] Failed to mark all read:', e);
    }
  }

  // Mark a single notification as read
  async function markRead(id: string) {
    try {
      const res = await useApiFetch(`notification/read/${id}` as any, 'PUT');
      if (res?.success) {
        const idx = notifications.value.findIndex((n) => n.id === id);
        if (idx !== -1) {
          notifications.value[idx] = { ...notifications.value[idx], read: 'READ' };
          // Trigger reactivity
          notifications.value = [...notifications.value];
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
      }
    } catch (e) {
      console.error('[NotificationCenter] Failed to mark read:', e);
    }
  }

  // Click a notification (marks as clicked) and navigate
  async function clickNotification(notif: NotificationData) {
    try {
      await useApiFetch(`notification/click/${notif.id}` as any, 'PUT', {}, true);
      // Update local state
      const idx = notifications.value.findIndex((n) => n.id === notif.id);
      if (idx !== -1 && notifications.value[idx].read === 'UN_READ') {
        notifications.value[idx] = { ...notifications.value[idx], read: 'CLICKED' };
        notifications.value = [...notifications.value];
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (e) {
      // Silently handle - navigation still works
    }
  }

  // Get the navigation path for a notification
  function getNotificationPath(notif: NotificationData): string | null {
    if (!notif.target) return null;

    // Derive entity type from notification type
    let typeAssign = notif.type.split('_')[0]?.toLowerCase();
    if (!typeAssign) return null;

    // Pluralize and map to routes
    if (typeAssign === 'opportunity') {
      // Keep as-is for opportunity
    } else if (typeAssign === 'project') {
      return `/operations/projects/${notif.target}`;
    } else if (typeAssign === 'task') {
      return `/operations/daily-tasks`;
    } else if (typeAssign === 'workflow') {
      return `/settings/workflows`;
    } else if (typeAssign === 'sla') {
      return `/settings/sla-management`;
    } else if (typeAssign === 'invoice') {
      return `/finance/invoices`;
    } else if (typeAssign === 'contract') {
      return `/sales/contracts`;
    } else if (typeAssign === 'system') {
      return null; // System alerts don't navigate
    } else if (typeAssign === 'comment') {
      return null; // Would need more context
    } else if (typeAssign === 'approval') {
      return `/settings/approval-center`;
    } else {
      typeAssign = `${typeAssign}s`;
    }

    return `/sales/${typeAssign}/${notif.target}`;
  }

  // Get the display text for a notification based on locale
  function getNotificationText(notif: NotificationData): string {
    if (locale.value === 'ar' && notif.body_ar) {
      return notif.body_ar;
    }
    return notif.body_en || notif.body_ar || '';
  }

  return {
    visible,
    notifications,
    unreadCount,
    activeTab,
    loading,
    open,
    close,
    toggle,
    fetchNotifications,
    fetchUnreadCount,
    filteredNotifications,
    groupedNotifications,
    markAllRead,
    markRead,
    clickNotification,
    getNotificationPath,
    getNotificationText
  };
}
