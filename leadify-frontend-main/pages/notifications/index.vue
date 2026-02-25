<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 🔔 Notifications
      p.text-sm.mt-1(style="color: var(--text-muted);") All your CRM notifications in one place.
    .flex.items-center.gap-3
      el-button(size="default" @click="markAllAsRead" :disabled="unreadCount === 0" style="border-radius: 12px;")
        Icon(name="ph:checks" size="16" style="margin-right: 4px;")
        | Mark All Read
      el-button(size="default" type="danger" plain @click="clearAll" :disabled="crmNotifications.length === 0" style="border-radius: 12px;")
        Icon(name="ph:trash" size="16" style="margin-right: 4px;")
        | Clear All

  //- Stats
  .grid.grid-cols-3.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ crmNotifications.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Unread
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ unreadCount }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Today
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ todayCount }}

  //- Filter tabs
  .flex.items-center.gap-2.mb-6
    el-button(
      v-for="cat in categories"
      :key="cat.value"
      :type="activeCategory === cat.value ? 'primary' : 'default'"
      size="default"
      round
      @click="activeCategory = cat.value"
    ) {{ cat.label }} ({{ getCategoryCount(cat.value) }})

  //- Notification List
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    .divide-y(style="border-color: var(--border-default);")
      .flex.items-start.gap-4.px-6.py-5.cursor-pointer.transition-colors(
        v-for="notif in filteredNotifications"
        :key="notif.id"
        :class="{ 'bg-violet-50/30': !notif.read }"
        class="hover:bg-gray-50/50"
      )
        .w-10.h-10.rounded-xl.flex.items-center.justify-center.flex-shrink-0(:style="{ backgroundColor: typeColor(notif.type) + '15' }")
          Icon(:name="notif.icon" size="20" :style="{ color: typeColor(notif.type) }")
        .flex-1.min-w-0
          .flex.items-center.gap-2
            p.text-sm.font-bold(:style="{ color: notif.read ? 'var(--text-muted)' : 'var(--text-primary)' }") {{ notif.title }}
            el-tag(size="small" round effect="plain" :type="notif.type === 'danger' ? 'danger' : notif.type === 'warning' ? 'warning' : notif.type === 'success' ? 'success' : 'info'") {{ notif.category }}
          p.text-sm.mt-1(style="color: var(--text-muted);") {{ notif.message }}
          p.text-xs.mt-1.font-mono(style="color: var(--text-muted); opacity: 0.6;") {{ formatDate(notif.createdAt) }}
        .flex.items-center.gap-2.flex-shrink-0
          .w-2.h-2.rounded-full(v-if="!notif.read" style="background: #7c3aed;")
          el-button(text circle size="small" @click.stop="markAsRead(notif.id)" v-if="!notif.read")
            Icon(name="ph:check" size="14")
          el-button(text circle size="small" @click.stop="remove(notif.id)" type="danger")
            Icon(name="ph:x" size="14")

    //- Empty
    .text-center.py-16(v-if="filteredNotifications.length === 0")
      Icon(name="ph:bell-slash" size="48" style="color: var(--text-muted);")
      p.text-sm.mt-3(style="color: var(--text-muted);") No notifications in this category
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNotifications } from '~/composables/useNotifications';

definePageMeta({});

const { notifications: crmNotifications, unreadCount, markAsRead, markAllAsRead, clearAll, remove } = useNotifications();
const activeCategory = ref('all');

const categories = [
  { label: 'All', value: 'all' },
  { label: 'Documents', value: 'document' },
  { label: 'Invoices', value: 'invoice' },
  { label: 'Reminders', value: 'reminder' },
  { label: 'System', value: 'system' },
  { label: 'Clients', value: 'client' }
];

const filteredNotifications = computed(() => {
  if (activeCategory.value === 'all') return crmNotifications.value;
  return crmNotifications.value.filter(n => n.category === activeCategory.value);
});

const todayCount = computed(() => {
  const todayStr = new Date().toISOString().slice(0, 10);
  return crmNotifications.value.filter(n => n.createdAt.startsWith(todayStr)).length;
});

function getCategoryCount(cat: string): number {
  if (cat === 'all') return crmNotifications.value.length;
  return crmNotifications.value.filter(n => n.category === cat).length;
}

function typeColor(type: string): string {
  const map: Record<string, string> = { info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };
  return map[type] || '#6b7280';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>
