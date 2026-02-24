<template lang="pug">
.next-best-actions
  h3.section-title
    Icon.mr-2(name="ph:lightning-bold" size="18")
    | Next Best Actions
  .actions-list
    .action-card(v-for="(action, i) in actions" :key="i" :class="`priority-${action.priority}`")
      .action-icon
        Icon(:name="action.icon" size="18")
      .action-content
        .action-text {{ action.action }}
        .action-priority {{ action.priority }} priority
</template>

<script setup lang="ts">
defineProps<{
  actions: { action: string; priority: string; icon: string }[];
}>();
</script>

<style lang="scss" scoped>
.section-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.action-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 8px;
  border-left: 3px solid;
  background: var(--glass-bg-primary);
  transition: transform 0.2s;

  &:hover { transform: translateX(4px); }

  &.priority-high {
    border-left-color: #ef4444;
    .action-icon { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    .action-priority { color: #ef4444; }
  }
  &.priority-medium {
    border-left-color: #f59e0b;
    .action-icon { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
    .action-priority { color: #f59e0b; }
  }
  &.priority-low {
    border-left-color: #22c55e;
    .action-icon { color: #22c55e; background: rgba(34, 197, 94, 0.1); }
    .action-priority { color: #22c55e; }
  }
}

.action-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
}

.action-priority {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}
</style>
