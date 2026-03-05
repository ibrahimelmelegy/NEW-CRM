<template lang="pug">
.deal-alert-feed
  .feed-header.flex.items-center.gap-2.mb-4
    .pulse-dot
    span.text-sm.font-bold.text-primary LIVE DEAL ALERTS
  .feed-list
    TransitionGroup(name="alert")
      .alert-item(v-for="alert in alerts" :key="alert.id || alert.createdAt" :class="getAlertClass(alert)")
        .alert-icon
          Icon(:name="getAlertIcon(alert)" size="18")
        .alert-content
          .alert-text {{ alert.description || alert.descripion || 'Activity' }}
          .alert-time {{ formatTime(alert.createdAt) }}
</template>

<script setup lang="ts">
defineProps<{
  alerts: Record<string, unknown>[];
}>();

function getAlertClass(alert: unknown): string {
  const desc = (alert.description || alert.descripion || '').toLowerCase();
  if (desc.includes('won') || desc.includes('closed')) return 'alert-won';
  if (desc.includes('lost') || desc.includes('cancelled')) return 'alert-lost';
  return 'alert-update';
}

function getAlertIcon(alert: unknown): string {
  const desc = (alert.description || alert.descripion || '').toLowerCase();
  if (desc.includes('won') || desc.includes('closed')) return 'ph:trophy-bold';
  if (desc.includes('lost') || desc.includes('cancelled')) return 'ph:x-circle-bold';
  if (desc.includes('created')) return 'ph:plus-circle-bold';
  return 'ph:arrow-right-bold';
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
</script>

<style lang="scss" scoped>
.text-primary {
  color: var(--text-primary);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.feed-list {
  max-height: 400px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 6px;
  border-left: 3px solid transparent;
  transition: all 0.3s ease;

  &.alert-won {
    border-left-color: #22c55e;
    background: rgba(34, 197, 94, 0.06);
    .alert-icon {
      color: #22c55e;
    }
  }
  &.alert-lost {
    border-left-color: #ef4444;
    background: rgba(239, 68, 68, 0.06);
    .alert-icon {
      color: #ef4444;
    }
  }
  &.alert-update {
    border-left-color: var(--accent-color, #7849ff);
    background: rgba(120, 73, 255, 0.04);
    .alert-icon {
      color: var(--accent-color, #7849ff);
    }
  }
}

.alert-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.alert-text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
}

.alert-time {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.alert-enter-active {
  animation: slideIn 0.3s ease;
}
.alert-leave-active {
  animation: slideIn 0.3s ease reverse;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
