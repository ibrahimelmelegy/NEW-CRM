<template lang="pug">
.grid.gap-4(class="grid-cols-1 md:grid-cols-2")
  .priority-card(
    v-for="priority in priorities"
    :key="priority.id"
    :class="`priority-card--${priority.urgency}`"
  )
    .flex.items-start.gap-4
      .priority-card__icon
        Icon(:name="iconMap[priority.type]" size="22")
      .flex-1.min-w-0
        .flex.items-center.justify-between.gap-2.mb-1
          p(class="text-sm font-semibold text-[var(--text-primary)] truncate") {{ $t(priority.title) }}
          span(class="priority-badge" :class="`priority-badge--${priority.urgency}`") {{ $t(`briefing.${priority.urgency}`) }}
        p(class="text-xs text-[var(--text-muted)] mb-3") {{ priority.description }}
        el-button(size="small" type="primary" @click="navigateTo(priority.link)")
          Icon(name="ph:arrow-right-bold" size="14" class="mr-1")
          span {{ $t('briefing.viewAll') }}
</template>

<script setup lang="ts">
import type { Priority } from '~/composables/useDailyBriefing';

defineProps<{
  priorities: Priority[];
}>();

const iconMap: Record<string, string> = {
  task: 'ph:check-square-bold',
  deal: 'ph:handshake-bold',
  followup: 'ph:phone-bold',
  meeting: 'ph:calendar-bold'
};
</script>

<style lang="scss" scoped>
.priority-card {
  background: var(--bg-card, rgba(30, 30, 45, 0.6));
  backdrop-filter: var(--glass-blur, blur(12px));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
  padding: 16px;
  border-left: 4px solid transparent;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  &--high {
    border-left-color: #ef4444;
  }

  &--medium {
    border-left-color: #f59e0b;
  }

  &--low {
    border-left-color: #22c55e;
  }
}

.priority-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--brand-primary, rgba(120, 73, 255, 0.15));
  color: var(--brand-accent, #a78bfa);
}

.priority-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;

  &--high {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  &--medium {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }

  &--low {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
}
</style>
