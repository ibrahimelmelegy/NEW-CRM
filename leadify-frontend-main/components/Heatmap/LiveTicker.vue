<template lang="pug">
.live-ticker
  .ticker-header.flex.items-center.gap-2.mb-3
    .pulse-dot
    span.text-sm.font-semibold.text-primary Live Activity Feed
  .ticker-track
    .ticker-content(ref="tickerRef")
      .ticker-item(v-for="(item, i) in items" :key="i")
        .ticker-badge(:class="`type-${item.type}`")
          Icon(:name="getIcon(item.type)" size="14")
        span.ticker-text {{ item.description || 'Activity recorded' }}
        span.ticker-time {{ formatTime(item.createdAt) }}
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  items: any[];
}>();

const tickerRef = ref<HTMLElement | null>(null);

function getIcon(type: string): string {
  const icons: Record<string, string> = {
    lead: 'ph:user-plus-bold',
    deal: 'ph:handshake-bold',
    client: 'ph:briefcase-bold',
    opportunity: 'ph:lightbulb-bold'
  };
  return icons[type] || 'ph:activity-bold';
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

let scrollInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  scrollInterval = setInterval(() => {
    if (tickerRef.value) {
      tickerRef.value.scrollTop += 1;
      if (tickerRef.value.scrollTop >= tickerRef.value.scrollHeight - tickerRef.value.clientHeight) {
        tickerRef.value.scrollTop = 0;
      }
    }
  }, 50);
});

onUnmounted(() => {
  if (scrollInterval) clearInterval(scrollInterval);
});
</script>

<style lang="scss" scoped>
.live-ticker {
  overflow: hidden;
}

.text-primary {
  color: var(--text-primary);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.3);
  }
}

.ticker-track {
  overflow: hidden;
  height: 250px;
}

.ticker-content {
  overflow-y: hidden;
  height: 100%;
}

.ticker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 4px;
  background: var(--glass-bg-primary);
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.ticker-badge {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.type-lead {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }
  &.type-deal {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
  }
  &.type-client {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }
  &.type-opportunity {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }
}

.ticker-text {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ticker-time {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>
