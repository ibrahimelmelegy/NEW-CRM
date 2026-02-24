<template lang="pug">
.notification-item(:class="{ 'is-unread': notification.read === 'UN_READ' }" @click="$emit('click')")
  .notification-item-icon(:class="iconClass")
    Icon(:name="iconName")
  .notification-item-content
    .notification-item-text {{ displayText }}
    .notification-item-time {{ timeAgo }}
  .notification-item-actions
    .unread-dot(v-if="notification.read === 'UN_READ'")
    button.dismiss-btn(@click.stop="$emit('dismiss')" :title="$t('notifications.dismiss')")
      Icon(name="ph:x" size="14")
</template>

<script setup lang="ts">
interface NotificationData {
  id: string;
  type: string;
  body_en?: string;
  body_ar?: string;
  target?: string;
  read: 'READ' | 'UN_READ' | 'CLICKED';
  createdAt: string;
}

const props = defineProps<{
  notification: NotificationData;
}>();

defineEmits<{
  click: [];
  dismiss: [];
}>();

const { locale, t } = useI18n();

// Icon mapping based on notification type prefix
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
  SYSTEM: { name: 'ph:gear-bold', class: 'icon-system' }
};

const typePrefix = computed(() => {
  return props.notification.type.split('_')[0] || 'SYSTEM';
});

const iconName = computed(() => {
  return iconMap[typePrefix.value]?.name || 'ph:bell-bold';
});

const iconClass = computed(() => {
  return iconMap[typePrefix.value]?.class || 'icon-system';
});

const displayText = computed(() => {
  if (locale.value === 'ar' && props.notification.body_ar) {
    return props.notification.body_ar;
  }
  return props.notification.body_en || props.notification.body_ar || '';
});

const timeAgo = computed(() => {
  const date = new Date(props.notification.createdAt);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return t('notifications.justNow');
  if (minutes < 60) return t('notifications.minutesAgo', { count: minutes });
  if (hours < 24) return t('notifications.hoursAgo', { count: hours });
  if (days < 7) return t('notifications.daysAgo', { count: days });

  return date.toLocaleDateString(locale.value === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric'
  });
});
</script>

<style lang="scss" scoped>
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: var(--glass-bg-hover);

    .dismiss-btn {
      opacity: 1;
      transform: scale(1);
    }
  }

  &.is-unread {
    background: rgba(120, 73, 255, 0.06);

    &:hover {
      background: rgba(120, 73, 255, 0.1);
    }
  }
}

.notification-item-icon {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;

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

.notification-item-content {
  flex: 1;
  min-width: 0;
}

.notification-item-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-item-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

.notification-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: fit-content;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-color, #7c3aed);
  box-shadow: 0 0 8px rgba(120, 73, 255, 0.4);
  flex-shrink: 0;
}

.dismiss-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }
}

:global(html.light-mode) {
  .notification-item {
    &.is-unread {
      background: rgba(120, 73, 255, 0.04);

      &:hover {
        background: rgba(120, 73, 255, 0.08);
      }
    }

    &:hover {
      background: rgba(0, 0, 0, 0.03);
    }
  }

  .dismiss-btn:hover {
    background: rgba(0, 0, 0, 0.06);
  }
}
</style>
