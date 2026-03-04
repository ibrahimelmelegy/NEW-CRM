<template lang="pug">
.relative
  //- Bell Icon with Badge
  el-badge(:value="unreadCount" :hidden="unreadCount === 0" :max="99")
    el-button(circle size="default" @click="showPanel = !showPanel" style="border: none; background: transparent;")
      Icon(name="ph:bell-bold" size="20" :style="{ color: unreadCount > 0 ? '#7c3aed' : 'var(--text-muted)' }")

  //- Dropdown Panel
  Teleport(to="body")
    Transition(name="fade")
      .fixed.inset-0.z-40(v-if="showPanel" @click="showPanel = false")
    Transition(name="slide-down")
      div(class="fixed top-16 right-6 z-50 w-96 max-h-[520px] rounded-2xl shadow-2xl border overflow-hidden flex flex-col"
        v-if="showPanel"
        style="background: var(--bg-elevated); border-color: var(--border-default);"
      )
        //- Header
        .flex.items-center.justify-between.px-5.py-4.border-b(style="border-color: var(--border-default);")
          .flex.items-center.gap-2
            Icon(name="ph:bell-bold" size="18" style="color: #7c3aed;")
            span.font-bold(style="color: var(--text-primary);") Notifications
            el-badge.ml-1(:value="unreadCount" :hidden="unreadCount === 0" type="primary")
          .flex.items-center.gap-1
            el-button(text size="small" @click="markAllAsRead" :disabled="unreadCount === 0") Mark all read
            el-button(text size="small" @click="clearAll" type="danger") Clear

        //- List
        .flex-1.overflow-y-auto
          .divide-y(style="border-color: var(--border-default);")
            .flex.items-start.gap-3.px-5.py-4.cursor-pointer.transition-colors(
              v-for="notif in notifications.slice(0, 20)"
              :key="notif.id"
              :class="{ 'bg-violet-50/50': !notif.read }"
              @click="handleClick(notif)"
              class="hover:bg-gray-50"
            )
              .w-9.h-9.rounded-xl.flex.items-center.justify-center.flex-shrink-0(:style="{ backgroundColor: typeColor(notif.type) + '15' }")
                Icon(:name="notif.icon" size="18" :style="{ color: typeColor(notif.type) }")
              .flex-1.min-w-0
                p.text-sm.font-semibold.truncate(:style="{ color: notif.read ? 'var(--text-muted)' : 'var(--text-primary)' }") {{ notif.title }}
                p(class="text-xs mt-0.5 line-clamp-2" style="color: var(--text-muted);") {{ notif.message }}
                p.text-xs.mt-1.font-mono(style="color: var(--text-muted); opacity: 0.6;") {{ timeAgo(notif.createdAt) }}
              .w-2.h-2.rounded-full.mt-2.flex-shrink-0(v-if="!notif.read" style="background: #7c3aed;")

          //- Empty
          .text-center.py-12(v-if="notifications.length === 0")
            Icon(name="ph:bell-slash" size="40" style="color: var(--text-muted);")
            p.text-sm.mt-3(style="color: var(--text-muted);") No notifications yet

        //- Footer
        NuxtLink(to="/notifications" @click="showPanel = false")
          .text-center.py-3.border-t.text-sm.font-bold.cursor-pointer.transition-colors(
            style="border-color: var(--border-default); color: #7c3aed;"
            class="hover:bg-violet-50"
          ) View All Notifications
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useNotifications } from '~/composables/useNotifications';
import type { CrmNotification } from '~/composables/useNotifications';

const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
const showPanel = ref(false);

function handleClick(notif: CrmNotification) {
  markAsRead(notif.id);
  if (notif.actionUrl) navigateTo(notif.actionUrl);
}

function typeColor(type: string): string {
  const map: Record<string, string> = { info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };
  return map[type] || '#6b7280';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
</style>
