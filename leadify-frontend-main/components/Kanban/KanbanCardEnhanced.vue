<template lang="pug">
.kanban-card-enhanced.glass-card.rounded-xl.cursor-grab(
  :style="{ '--card-accent': cardAccentColor }"
  @mouseenter="showPreview = true"
  @mouseleave="showPreview = false"
  @click="$emit('click', card)"
)
  //- Card Header
  .card-header.flex.items-center.justify-between.mb-2
    .flex.items-center.gap-2.min-w-0
      .activity-dot(:class="activityStatus")
      span.font-semibold.text-sm.text-white.truncate {{ card.name }}
    .flex.items-center.gap-1.flex-shrink-0
      .days-badge(v-if="daysInStage > 0" :class="daysBadgeClass")
        | {{ daysInStage }}d
      .priority-indicator(v-if="card.priority" :style="{ background: getPriorityColor(card.priority) }")

  //- Company
  .text-xs.text-gray-400.mb-2.truncate(v-if="card.companyName || card.lead?.companyName")
    Icon.mr-1(name="ph:buildings" size="12")
    | {{ card.companyName || card.lead?.companyName }}

  //- Value
  .flex.items-center.justify-between.mb-2(v-if="card.price != null || card.estimatedValue != null")
    span.card-value(v-if="card.price != null") {{ formatCurrency(card.price) }}
    span.card-value(v-else-if="card.estimatedValue != null") {{ formatCurrency(card.estimatedValue) }}

  //- Footer: avatars + close date
  .card-footer.flex.items-center.justify-between
    .flex.items-center.-space-x-2(v-if="card.users?.length")
      .mini-avatar(
        v-for="u in card.users.slice(0, 3)"
        :key="u.id"
        :title="u.name"
      ) {{ u.name?.charAt(0) }}
      span.text-xs.text-gray-500.ml-2(v-if="card.users.length > 3") +{{ card.users.length - 3 }}
    .text-xs.text-gray-500(v-if="card.expectedCloseDate")
      Icon.mr-1(name="ph:calendar" size="12")
      | {{ formatDate(card.expectedCloseDate) }}

  //- Hover Preview Tooltip
  Transition(name="fade")
    .card-preview(v-if="showPreview")
      .preview-row(v-if="card.expectedCloseDate")
        span.preview-label Close Date
        span {{ formatDate(card.expectedCloseDate) }}
      .preview-row
        span.preview-label Days in Stage
        span {{ daysInStage }} days
      .preview-row(v-if="card.priority")
        span.preview-label Priority
        .flex.items-center.gap-1
          .w-2.h-2.rounded-full(:style="{ background: getPriorityColor(card.priority) }")
          span {{ card.priority }}
      .preview-row(v-if="card.createdAt")
        span.preview-label Created
        span {{ formatDate(card.createdAt) }}
</template>

<script setup lang="ts">
import { getPriorityColor } from '@/composables/useKanban';
import type { KanbanCard } from '@/composables/useKanban';
import { formatLargeNumber, formatDate } from '@/composables/format';

interface Props {
  card: KanbanCard;
  stageEnteredAt?: string;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'click', card: KanbanCard): void;
}>();

const showPreview = ref(false);

// Value-based accent color: green=high (>10k), blue=medium (1k-10k), gray=low (<1k)
const cardAccentColor = computed(() => {
  const value = props.card.price ?? props.card.estimatedValue ?? 0;
  if (value > 10000) return '#10B981';
  if (value >= 1000) return '#3B82F6';
  return '#6B7280';
});

// Days in current stage (based on stageEnteredAt or createdAt fallback)
const daysInStage = computed(() => {
  const dateStr = props.stageEnteredAt || props.card.createdAt;
  if (!dateStr) return 0;
  const entered = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - entered.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
});

// Days badge color class
const daysBadgeClass = computed(() => {
  if (daysInStage.value > 14) return 'days-badge--danger';
  if (daysInStage.value > 7) return 'days-badge--warning';
  return 'days-badge--default';
});

// Activity status based on createdAt or most recent update
const activityStatus = computed(() => {
  const dateStr = props.card.updatedAt || props.card.createdAt;
  if (!dateStr) return 'activity-dot--inactive';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return 'activity-dot--active';
  if (diffDays <= 7) return 'activity-dot--stale';
  return 'activity-dot--inactive';
});

// Format currency with SAR and K/M suffixes
function formatCurrency(value: number | string): string {
  const n = Number(value);
  return `SAR ${formatLargeNumber(n)}`;
}
</script>

<style scoped lang="scss">
.kanban-card-enhanced {
  padding: 14px;
  position: relative;
  border-left: 3px solid var(--card-accent, #6b7280);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    transform: translateY(-1px);
  }
}

// Activity dot
.activity-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;

  &--active {
    background: #10b981;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
  }
  &--stale {
    background: #f59e0b;
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
  }
  &--inactive {
    background: #ef4444;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
  }
}

// Days badge
.days-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 9999px;
  font-weight: 600;
  line-height: 1.4;

  &--default {
    background: rgba(107, 114, 128, 0.3);
    color: #9ca3af;
  }
  &--warning {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }
  &--danger {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
}

// Priority indicator
.priority-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

// Card value
.card-value {
  font-size: 13px;
  font-family: monospace;
  color: #c4b5fd;
  font-weight: 600;
}

// Mini avatar
.mini-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #a78bfa;
  background: rgba(168, 85, 247, 0.2);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

// Hover preview tooltip
.card-preview {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 50;
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 15, 25, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #d1d5db;
  padding: 3px 0;

  & + .preview-row {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
}

.preview-label {
  color: #9ca3af;
  font-weight: 500;
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
