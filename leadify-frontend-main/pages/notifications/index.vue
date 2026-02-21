<template lang="pug">
.notifications-page.p-6
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") Notification Center
      p.text-sm(style="color: var(--text-muted)") Stay updated with everything happening in your CRM
    .flex.items-center.gap-3
      el-button(v-if="unreadCount > 0" @click="markAllRead" :loading="markingRead")
        Icon(name="ph:checks" size="16")
        span.ml-1 Mark All Read
      el-dropdown(trigger="click")
        el-button
          Icon(name="ph:funnel" size="16")
          span.ml-1 Filter
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item(@click="filterType = 'all'") All Notifications
            el-dropdown-item(divided @click="filterType = 'deal'") Deal Updates
            el-dropdown-item(@click="filterType = 'task'") Task Assignments
            el-dropdown-item(@click="filterType = 'invoice'") Invoice Alerts
            el-dropdown-item(@click="filterType = 'ticket'") Ticket Updates
            el-dropdown-item(@click="filterType = 'system'") System Alerts

  //- Stats
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
    .glass-card.p-4.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120,73,255,0.15)")
          Icon(name="ph:bell-bold" size="20" style="color: #7849ff")
        div
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ notifications.length }}
          p.text-xs(style="color: var(--text-muted)") Total
    .glass-card.p-4.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(239,68,68,0.15)")
          Icon(name="ph:bell-ringing-bold" size="20" style="color: #ef4444")
        div
          p.text-xl.font-bold(style="color: #ef4444") {{ unreadCount }}
          p.text-xs(style="color: var(--text-muted)") Unread
    .glass-card.p-4.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(16,185,129,0.15)")
          Icon(name="ph:check-circle-bold" size="20" style="color: #10b981")
        div
          p.text-xl.font-bold(style="color: #10b981") {{ readCount }}
          p.text-xs(style="color: var(--text-muted)") Read
    .glass-card.p-4.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245,158,11,0.15)")
          Icon(name="ph:clock-bold" size="20" style="color: #f59e0b")
        div
          p.text-xl.font-bold(style="color: #f59e0b") {{ todayCount }}
          p.text-xs(style="color: var(--text-muted)") Today

  //- Tabs
  el-tabs(v-model="activeTab")
    el-tab-pane(label="All" name="all")
    el-tab-pane(name="unread")
      template(#label)
        span Unread
        el-badge(:value="unreadCount" :hidden="!unreadCount" type="danger" class="ml-2")
    el-tab-pane(label="Read" name="read")

  //- Notification Groups
  .space-y-6
    template(v-for="(group, groupDate) in groupedNotifications" :key="groupDate")
      div
        h4.text-xs.font-bold.uppercase.tracking-wide.mb-3(style="color: var(--text-muted)") {{ groupDate }}
        .space-y-2
          .notification-item.glass-card.p-4.rounded-xl.cursor-pointer.transition-all(
            v-for="notif in group"
            :key="notif.id"
            :class="{ 'border-l-4': !notif.read }"
            :style="!notif.read ? 'border-left-color: #7849ff' : ''"
            @click="handleNotificationClick(notif)"
          )
            .flex.items-start.gap-4
              .w-10.h-10.rounded-xl.flex.items-center.justify-center.flex-shrink-0(:style="{ background: getTypeColor(notif.type) + '20' }")
                Icon(:name="getTypeIcon(notif.type)" size="18" :style="{ color: getTypeColor(notif.type) }")
              .flex-1.min-w-0
                .flex.items-start.justify-between
                  div
                    p.text-sm.font-medium(:style="{ color: !notif.read ? 'var(--text-primary)' : 'var(--text-secondary)' }") {{ notif.title }}
                    p.text-xs.mt-1(style="color: var(--text-muted)") {{ notif.message }}
                  .flex.items-center.gap-2.flex-shrink-0
                    span.text-xs(style="color: var(--text-muted)") {{ formatTime(notif.createdAt) }}
                    .w-2.h-2.rounded-full(v-if="!notif.read" style="background: #7849ff")

  //- Empty State
  .text-center.py-16(v-if="filteredNotifications.length === 0")
    Icon(name="ph:bell-slash" size="48" style="color: var(--text-muted)")
    p.mt-3.text-lg.font-medium(style="color: var(--text-primary)") No notifications
    p.mt-1(style="color: var(--text-muted)") You're all caught up!

  //- Settings Dialog
  el-dialog(v-model="showSettings" title="Notification Preferences" width="500px")
    .space-y-4
      .flex.items-center.justify-between.py-3(v-for="pref in notifPreferences" :key="pref.key" style="border-bottom: 1px solid var(--glass-border)")
        div
          p.text-sm.font-medium(style="color: var(--text-primary)") {{ pref.label }}
          p.text-xs(style="color: var(--text-muted)") {{ pref.description }}
        el-switch(v-model="pref.enabled")
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });

interface Notification {
  id: string;
  type: 'deal' | 'task' | 'invoice' | 'ticket' | 'system' | 'lead';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

const router = useRouter();
const activeTab = ref('all');
const filterType = ref('all');
const markingRead = ref(false);
const showSettings = ref(false);

// Sample notification data (in production, this would come from API/WebSocket)
const notifications = ref<Notification[]>([]);

const notifPreferences = ref([
  { key: 'deals', label: 'Deal Updates', description: 'Get notified when deals change stage', enabled: true },
  { key: 'tasks', label: 'Task Assignments', description: 'Get notified when tasks are assigned to you', enabled: true },
  { key: 'invoices', label: 'Invoice Alerts', description: 'Payment received and overdue alerts', enabled: true },
  { key: 'tickets', label: 'Ticket Updates', description: 'New ticket assignments and replies', enabled: true },
  { key: 'system', label: 'System Alerts', description: 'System maintenance and updates', enabled: false }
]);

// Computed
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);
const readCount = computed(() => notifications.value.filter(n => n.read).length);
const todayCount = computed(() => {
  const today = new Date().toDateString();
  return notifications.value.filter(n => new Date(n.createdAt).toDateString() === today).length;
});

const filteredNotifications = computed(() => {
  let list = notifications.value;

  if (activeTab.value === 'unread') list = list.filter(n => !n.read);
  if (activeTab.value === 'read') list = list.filter(n => n.read);
  if (filterType.value !== 'all') list = list.filter(n => n.type === filterType.value);

  return list;
});

const groupedNotifications = computed(() => {
  const groups: Record<string, Notification[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  filteredNotifications.value.forEach(n => {
    const dateStr = new Date(n.createdAt).toDateString();
    let key = new Date(n.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (dateStr === today) key = 'Today';
    else if (dateStr === yesterday) key = 'Yesterday';

    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });

  return groups;
});

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    deal: 'ph:handshake',
    task: 'ph:check-square',
    invoice: 'ph:receipt',
    ticket: 'ph:ticket',
    system: 'ph:gear',
    lead: 'ph:user-plus'
  };
  return icons[type] || 'ph:bell';
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    deal: '#7849ff',
    task: '#3b82f6',
    invoice: '#10b981',
    ticket: '#f59e0b',
    system: '#64748b',
    lead: '#a855f7'
  };
  return colors[type] || '#7849ff';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function handleNotificationClick(notif: Notification) {
  notif.read = true;
  if (notif.link) {
    router.push(notif.link);
  }
}

function markAllRead() {
  markingRead.value = true;
  setTimeout(() => {
    notifications.value.forEach(n => {
      n.read = true;
    });
    markingRead.value = false;
  }, 300);
}

// Load notifications
async function loadNotifications() {
  // Build from recent CRM activity
  const notifs: Notification[] = [];
  const now = new Date();

  try {
    // Recent deals
    const { body: dealBody, success: dealSuccess } = await useApiFetch('deal?limit=5&sort=-updatedAt');
    if (dealSuccess && dealBody) {
      const deals = (dealBody as any).docs || dealBody || [];
      deals.forEach((d: any, i: number) => {
        notifs.push({
          id: `deal-${d.id}`,
          type: 'deal',
          title: `Deal "${d.name}" updated`,
          message: `Stage: ${d.stage || 'N/A'} - Value: $${Number(d.value || 0).toLocaleString()}`,
          read: i > 1,
          createdAt: d.updatedAt || new Date(now.getTime() - i * 3600000).toISOString(),
          link: `/sales/deals/${d.id}`
        });
      });
    }
  } catch {
    /* silent */
  }

  try {
    // Recent tasks
    const { body: taskBody, success: taskSuccess } = await useApiFetch('tasks?limit=5&sort=-updatedAt');
    if (taskSuccess && taskBody) {
      const tasks = (taskBody as any).docs || taskBody || [];
      tasks.forEach((t: any, i: number) => {
        notifs.push({
          id: `task-${t.id}`,
          type: 'task',
          title: `Task: ${t.title}`,
          message: `Status: ${t.status} - Priority: ${t.priority || 'Normal'}`,
          read: i > 0,
          createdAt: t.updatedAt || new Date(now.getTime() - i * 7200000).toISOString(),
          link: `/tasks/${t.id}`
        });
      });
    }
  } catch {
    /* silent */
  }

  try {
    // Recent tickets
    const { body: ticketBody, success: ticketSuccess } = await useApiFetch('support/tickets?limit=3&sort=-updatedAt');
    if (ticketSuccess && ticketBody) {
      const tickets = (ticketBody as any).docs || ticketBody || [];
      tickets.forEach((tk: any, i: number) => {
        notifs.push({
          id: `ticket-${tk.id}`,
          type: 'ticket',
          title: `Ticket: ${tk.subject}`,
          message: `Status: ${tk.status} - ${tk.ticketNumber || ''}`,
          read: i > 0,
          createdAt: tk.updatedAt || new Date(now.getTime() - i * 10800000).toISOString(),
          link: `/support/tickets/${tk.id}`
        });
      });
    }
  } catch {
    /* silent */
  }

  // Sort by date
  notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  notifications.value = notifs;
}

onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.notifications-page {
  animation: fadeIn 0.3s ease-out;
}

.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

.notification-item:hover {
  border-color: rgba(120, 73, 255, 0.3);
  background: var(--glass-bg-hover, rgba(255, 255, 255, 0.08));
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
