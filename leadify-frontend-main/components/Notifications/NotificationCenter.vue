<template lang="pug">
Teleport(to="body")
  Transition(name="notification-overlay")
    .notification-overlay(v-if="visible" @click="$emit('close')")
  Transition(name="notification-slide")
    .notification-center(v-if="visible")
      .notification-header
        .flex.items-center.gap-3
          Icon.text-xl(name="ph:bell-ringing-bold" style="color: var(--accent-color)")
          h3.notification-title {{ $t('notifications.center') }}
          .header-badge(v-if="unreadCount") {{ unreadCount > 99 ? '99+' : unreadCount }}
        .flex.items-center.gap-2
          button.btn-ghost(@click="handleMarkAllRead" :title="$t('notifications.markAllRead')" :disabled="unreadCount === 0")
            Icon(name="ph:checks-bold")
          button.btn-ghost(@click="$emit('close')")
            Icon(name="ph:x-bold")

      //- Filter tabs
      .notification-tabs
        button.tab(:class="{ active: activeTab === 'all' }" @click="activeTab = 'all'")
          | {{ $t('notifications.allTab') }}
        button.tab(:class="{ active: activeTab === 'unread' }" @click="activeTab = 'unread'")
          | {{ $t('notifications.unread') }}
          span.tab-count(v-if="unreadCount") {{ unreadCount }}
        button.tab(:class="{ active: activeTab === 'important' }" @click="activeTab = 'important'")
          | {{ $t('notifications.important') }}

      //- Loading state
      .notification-loading(v-if="loading")
        .loading-skeleton(v-for="i in 4" :key="i")
          .skeleton-icon
          .skeleton-content
            .skeleton-line.w-3-4
            .skeleton-line.w-1-2

      //- Notification list
      .notification-list(v-else ref="listRef")
        template(v-if="filteredNotifications.length")
          .notification-group(v-for="group in groupedNotifications" :key="group.label")
            .group-label {{ group.label }}
            NotificationsNotificationItem(
              v-for="notif in group.items"
              :key="notif.id"
              :notification="notif"
              @click="handleClick(notif)"
              @dismiss="handleDismiss(notif)"
            )
        .empty-notifications(v-else)
          .empty-icon-wrapper
            Icon.text-4xl(name="ph:bell-slash" style="color: var(--text-muted)")
          p {{ $t('notifications.noData') }}

      //- Footer
      .notification-footer
        NuxtLink.view-all(:to="'/notification'" @click="$emit('close')")
          Icon(name="ph:list-bold" size="16")
          span {{ $t('notifications.viewAll') }}
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const { t } = useI18n();

const {
  notifications,
  unreadCount,
  activeTab,
  loading,
  filteredNotifications,
  groupedNotifications,
  markAllRead,
  markRead,
  clickNotification,
  getNotificationPath,
  fetchNotifications
} = useNotificationCenter();

const listRef = ref<HTMLElement | null>(null);

// Fetch when panel becomes visible
watch(() => props.visible, (val) => {
  if (val) {
    fetchNotifications();
  }
});

// Close on Escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    emit('close');
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

// Lock body scroll when panel is open
watch(() => props.visible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

async function handleMarkAllRead() {
  await markAllRead();
}

async function handleClick(notif: any) {
  await clickNotification(notif);
  const path = getNotificationPath(notif);
  if (path) {
    emit('close');
    router.push(path);
  }
}

async function handleDismiss(notif: any) {
  await markRead(notif.id);
}
</script>

<style lang="scss" scoped>
// Overlay
.notification-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9998;
}

// Slide-out panel
.notification-center {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 420px;
  max-width: 100vw;
  z-index: 9999;
  display: flex;
  flex-direction: column;

  background: var(--glass-bg-primary);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-left: 1px solid var(--glass-border-color);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);

  @media (max-width: 480px) {
    width: 100vw;
    border-left: none;
  }
}

html[dir="rtl"] .notification-center,
:global([dir="rtl"]) .notification-center {
  right: auto;
  left: 0;
  border-left: none;
  border-right: 1px solid var(--glass-border-color);
  box-shadow: 8px 0 32px rgba(0, 0, 0, 0.3);
}

// Header
.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border-default);
}

.notification-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-badge {
  background: var(--accent-color, #7c3aed);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 100px;
  line-height: 1.4;
  min-width: 20px;
  text-align: center;
}

.btn-ghost {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--glass-bg-hover);
    color: var(--text-primary);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

// Filter tabs
.notification-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-default);
}

.tab {
  padding: 6px 14px;
  border-radius: 100px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: var(--glass-bg-hover);
    color: var(--text-primary);
  }

  &.active {
    background: rgba(120, 73, 255, 0.15);
    color: var(--accent-color, #a78bfa);
    font-weight: 600;
  }
}

.tab-count {
  background: var(--accent-color, #7c3aed);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 100px;
  line-height: 1.5;
}

// Loading skeleton
.notification-loading {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-skeleton {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.skeleton-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--glass-bg-hover);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: var(--glass-bg-hover);
  animation: skeleton-pulse 1.5s ease-in-out infinite;

  &.w-3-4 { width: 75%; }
  &.w-1-2 { width: 50%; }
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

// Notification list
.notification-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 12px;
  scroll-behavior: smooth;

  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: 4px;
  }
}

// Group labels
.notification-group {
  &:not(:first-child) {
    margin-top: 8px;
  }
}

.group-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  padding: 8px 16px 4px;
}

// Empty state
.empty-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}

.empty-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--glass-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.empty-notifications p {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

// Footer
.notification-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-default);
  display: flex;
  justify-content: center;
}

.view-all {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-color, #a78bfa);
  text-decoration: none;
  padding: 8px 20px;
  border-radius: 100px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(120, 73, 255, 0.1);
  }
}

// Transitions
.notification-overlay-enter-active,
.notification-overlay-leave-active {
  transition: opacity 0.3s ease;
}
.notification-overlay-enter-from,
.notification-overlay-leave-to {
  opacity: 0;
}

.notification-slide-enter-active {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.notification-slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1);
}
.notification-slide-enter-from,
.notification-slide-leave-to {
  transform: translateX(100%);
}

html[dir="rtl"] .notification-slide-enter-from,
html[dir="rtl"] .notification-slide-leave-to,
:global([dir="rtl"]) .notification-slide-enter-from,
:global([dir="rtl"]) .notification-slide-leave-to {
  transform: translateX(-100%);
}

// Light mode adjustments
:global(html.light-mode) {
  .notification-center {
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
  }

  .notification-overlay {
    background: rgba(0, 0, 0, 0.3);
  }
}
</style>
