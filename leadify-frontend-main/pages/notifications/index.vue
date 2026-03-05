<template lang="pug">
.notifications-page.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      h1.text-2xl.font-bold.tracking-tight(style="color: var(--text-primary);") {{ $t('notifications.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('notifications.pageDescription') }}
    .flex.items-center.gap-3
      el-button(size="default" @click="handleMarkAllRead" :disabled="unreadCount === 0" round)
        Icon(name="ph:checks" size="16" style="margin-inline-end: 4px;")
        | {{ $t('notifications.markAllRead') }}

  //- Stats
  .grid.gap-4.mb-8(:class="mobile ? 'grid-cols-1' : 'grid-cols-3'")
    .stat-card.p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('notifications.totalLabel') }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ totalItems }}
    .stat-card.p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('notifications.unread') }}
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ unreadCount }}
    .stat-card.p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('notifications.todayLabel') }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ todayCount }}

  //- Filter tabs
  .flex.flex-wrap.items-center.gap-2.mb-6
    el-button(
      v-for="tab in filterTabs"
      :key="tab.value"
      :type="activeFilter === tab.value ? 'primary' : 'default'"
      size="default"
      round
      @click="activeFilter = tab.value"
    ) {{ tab.label }}

  //- Type filter
  .flex.flex-wrap.items-center.gap-2.mb-6(v-if="activeFilter === 'all' || activeFilter === 'unread'")
    el-select.w-60(
      v-model="typeFilter"
      :placeholder="$t('notifications.filterByType')"
      clearable
      size="default"
      style="border-radius: 12px;"
    )
      el-option(
        v-for="nType in notificationTypes"
        :key="nType.value"
        :label="nType.label"
        :value="nType.value"
      )

  //- Loading skeleton
  template(v-if="loading && displayNotifications.length === 0")
    .space-y-3
      .loading-skeleton.flex.items-center.gap-4.px-6.py-5(v-for="i in 6" :key="i")
        .w-10.h-10.rounded-xl.bg-gray-200.animate-pulse
        .flex-1.space-y-2
          .h-4.rounded.bg-gray-200.animate-pulse(class="w-3/4")
          .h-3.rounded.bg-gray-200.animate-pulse(class="w-1/2")

  //- Notification List
  template(v-else)
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      .divide-y(style="border-color: var(--border-default);")
        .notification-row.flex.items-start.gap-4.px-6.py-5.cursor-pointer.transition-colors(
          v-for="notif in displayNotifications"
          :key="notif.id"
          :class="{ 'is-unread': notif.read === 'UN_READ' }"
          @click="handleNotifClick(notif)"
        )
          .notification-type-icon.w-10.h-10.rounded-xl.flex.items-center.justify-center.flex-shrink-0(:class="getIconClass(notif.type)")
            Icon(:name="getIconName(notif.type)" size="20")
          .flex-1.min-w-0
            .flex.items-center.gap-2
              p.text-sm.font-bold(:style="{ color: notif.read !== 'UN_READ' ? 'var(--text-muted)' : 'var(--text-primary)' }") {{ getNotifTitle(notif) }}
              el-tag(size="small" round effect="plain" :type="getTagType(notif.type)") {{ formatType(notif.type) }}
              el-tag(v-if="notif.priority === 'CRITICAL'" size="small" round type="danger" effect="dark") {{ $t('notifications.critical') }}
              el-tag(v-else-if="notif.priority === 'HIGH'" size="small" round type="warning" effect="plain") {{ $t('notifications.high') }}
            p.text-sm.mt-1(style="color: var(--text-muted);") {{ getNotifText(notif) }}
            p.text-xs.mt-1.font-mono(style="color: var(--text-muted); opacity: 0.6;") {{ formatDate(notif.createdAt) }}
          .flex.items-center.gap-2.flex-shrink-0
            .w-2.h-2.rounded-full(v-if="notif.read === 'UN_READ'" style="background: #7c3aed;")
            el-button(text circle size="small" @click.stop="handleMarkRead(notif.id)" v-if="notif.read === 'UN_READ'" :title="$t('notifications.markAsRead')")
              Icon(name="ph:check" size="14")
            el-button(text circle size="small" @click.stop="handleDelete(notif.id)" type="danger" :title="$t('notifications.deleteNotification')")
              Icon(name="ph:trash" size="14")

      //- Empty state
      .text-center.py-16(v-if="displayNotifications.length === 0 && !loading")
        .empty-icon-wrapper.mx-auto.mb-4
          Icon(name="ph:bell-slash" size="48" style="color: var(--text-muted);")
        p.text-sm(style="color: var(--text-muted);") {{ $t('notifications.noData') }}

    //- Load more
    .flex.justify-center.mt-6(v-if="hasMore")
      el-button(@click="handleLoadMore" :loading="loading" round size="default")
        | {{ $t('notifications.loadMore') }}
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMain } from '~/stores/common';

definePageMeta({});

const { t, locale } = useI18n();
const router = useRouter();
const mainData = useMain();
const { mobile } = storeToRefs(mainData);

const {
  notifications,
  unreadCount,
  loading,
  fetchNotifications,
  markAllRead,
  markRead,
  deleteNotification,
  clickNotification,
  getNotificationPath,
  getNotificationText
} = useNotificationCenter();

const activeFilter = ref<'all' | 'unread' | 'important'>('all');
const typeFilter = ref<string>('');

// Fetch on mount
onMounted(() => {
  fetchNotifications();
});

// Total items from notifications list
const totalItems = computed(() => notifications.value.length);

// Today count
const todayCount = computed(() => {
  const todayStr = new Date().toISOString().slice(0, 10);
  return notifications.value.filter(n => n.createdAt && n.createdAt.startsWith(todayStr)).length;
});

// Has more (based on if we fetched the max limit)
const hasMore = computed(() => notifications.value.length >= 50);

// Icon mapping
const iconMap: Record<string, { name: string; class: string }> = {
  DEAL: { name: 'ph:handshake-bold', class: 'icon-deal' },
  LEAD: { name: 'ph:user-plus-bold', class: 'icon-lead' },
  TASK: { name: 'ph:check-circle-bold', class: 'icon-task' },
  PROJECT: { name: 'ph:briefcase-bold', class: 'icon-project' },
  PROPOSAL: { name: 'ph:file-text-bold', class: 'icon-proposal' },
  CLIENT: { name: 'ph:users-bold', class: 'icon-client' },
  OPPORTUNITY: { name: 'ph:lightning-bold', class: 'icon-opportunity' },
  APPROVAL: { name: 'ph:stamp-bold', class: 'icon-approval' },
  COMMENT: { name: 'ph:chat-circle-bold', class: 'icon-comment' },
  WORKFLOW: { name: 'ph:flow-arrow-bold', class: 'icon-workflow' },
  SLA: { name: 'ph:warning-bold', class: 'icon-sla' },
  INVOICE: { name: 'ph:receipt-bold', class: 'icon-invoice' },
  CONTRACT: { name: 'ph:file-doc-bold', class: 'icon-contract' },
  SYSTEM: { name: 'ph:gear-bold', class: 'icon-system' },
  DOCUMENT: { name: 'ph:file-bold', class: 'icon-system' }
};

function getTypePrefix(type: string): string {
  return type.split('_')[0] || 'SYSTEM';
}

function getIconName(type: string): string {
  return iconMap[getTypePrefix(type)]?.name || 'ph:bell-bold';
}

function getIconClass(type: string): string {
  return iconMap[getTypePrefix(type)]?.class || 'icon-system';
}

function getTagType(type: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const prefix = getTypePrefix(type);
  if (['SLA', 'INVOICE'].includes(prefix)) return 'danger';
  if (['DEAL', 'PROPOSAL'].includes(prefix)) return 'success';
  if (['TASK', 'APPROVAL', 'CONTRACT'].includes(prefix)) return 'warning';
  return 'info';
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase());
}

function getNotifTitle(notif: any): string {
  if (notif.title) return notif.title;
  return formatType(notif.type);
}

function getNotifText(notif: any): string {
  return getNotificationText(notif);
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const dateLocale = locale.value === 'ar' ? 'ar-SA' : 'en-GB';
  return new Date(iso).toLocaleString(dateLocale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Important notification types
const IMPORTANT_TYPES = ['DEAL_WON', 'SLA_BREACH', 'SLA_WARNING', 'INVOICE_OVERDUE', 'CONTRACT_EXPIRING', 'SYSTEM_ALERT', 'APPROVAL_REQUESTED'];

// Filtered notifications
const displayNotifications = computed(() => {
  let items = notifications.value;

  // Filter by tab
  if (activeFilter.value === 'unread') {
    items = items.filter(n => n.read === 'UN_READ');
  } else if (activeFilter.value === 'important') {
    items = items.filter(n => IMPORTANT_TYPES.includes(n.type));
  }

  // Filter by type
  if (typeFilter.value) {
    items = items.filter(n => n.type === typeFilter.value);
  }

  return items;
});

// Filter tabs
const filterTabs = computed(() => [
  { label: `${t('notifications.allTab')} (${notifications.value.length})`, value: 'all' as const },
  { label: `${t('notifications.unread')} (${unreadCount.value})`, value: 'unread' as const },
  { label: t('notifications.important'), value: 'important' as const }
]);

// Notification types for filter dropdown
const notificationTypes = computed(() => {
  const types = [...new Set(notifications.value.map(n => n.type))];
  return types.map(type => ({
    value: type,
    label: formatType(type)
  }));
});

async function handleMarkAllRead() {
  await markAllRead();
}

async function handleMarkRead(id: string) {
  await markRead(id);
}

async function handleDelete(id: string) {
  await deleteNotification(id);
}

async function handleNotifClick(notif: any) {
  await clickNotification(notif);
  const path = getNotificationPath(notif);
  if (path) {
    router.push(path);
  }
}

async function handleLoadMore() {
  // Refetch with higher limit
  await fetchNotifications();
}
</script>

<style lang="scss" scoped>
.notifications-page {
  max-width: 1000px;
  margin: 0 auto;
}

.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.notification-row {
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--glass-bg-hover, rgba(0, 0, 0, 0.02));
  }

  &.is-unread {
    background: rgba(120, 73, 255, 0.04);

    &:hover {
      background: rgba(120, 73, 255, 0.08);
    }
  }
}

.notification-type-icon {
  &.icon-deal {
    background: rgba(52, 211, 153, 0.15);
    color: #34d399;
  }
  &.icon-lead {
    background: rgba(96, 165, 250, 0.15);
    color: #60a5fa;
  }
  &.icon-task {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
  }
  &.icon-project {
    background: rgba(167, 139, 250, 0.15);
    color: #a78bfa;
  }
  &.icon-proposal {
    background: rgba(129, 140, 248, 0.15);
    color: #818cf8;
  }
  &.icon-client {
    background: rgba(34, 211, 238, 0.15);
    color: #22d3ee;
  }
  &.icon-opportunity {
    background: rgba(249, 115, 22, 0.15);
    color: #f97316;
  }
  &.icon-approval {
    background: rgba(168, 85, 247, 0.15);
    color: #a855f7;
  }
  &.icon-comment {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
  }
  &.icon-workflow {
    background: rgba(236, 72, 153, 0.15);
    color: #ec4899;
  }
  &.icon-sla {
    background: rgba(251, 113, 133, 0.15);
    color: #fb7185;
  }
  &.icon-invoice {
    background: rgba(251, 146, 60, 0.15);
    color: #fb923c;
  }
  &.icon-contract {
    background: rgba(45, 212, 191, 0.15);
    color: #2dd4bf;
  }
  &.icon-system {
    background: rgba(161, 161, 170, 0.15);
    color: #a1a1aa;
  }
}

.empty-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--glass-bg-hover, rgba(0, 0, 0, 0.04));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.loading-skeleton {
  .animate-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
</style>
