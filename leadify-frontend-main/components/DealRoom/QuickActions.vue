<template lang="pug">
.quick-actions
  h3.section-title
    Icon.mr-2(name="ph:lightning-bold" size="18")
    | Quick Actions
  .actions-grid
    .action-btn(v-for="action in actions" :key="action.label" @click="action.handler")
      .action-icon(:style="{ background: action.bg, color: action.color }")
        Icon(:name="action.icon" size="18")
      span.action-label {{ action.label }}
</template>

<script setup lang="ts">
const props = defineProps<{
  dealId: string;
}>();

const router = useRouter();

const actions = [
  {
    label: 'Log Activity',
    icon: 'ph:pencil-bold',
    bg: 'rgba(120, 73, 255, 0.15)',
    color: '#7849ff',
    handler: () => router.push(`/sales/deals/${props.dealId}`)
  },
  {
    label: 'Add Task',
    icon: 'ph:check-square-bold',
    bg: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e',
    handler: () => router.push('/tasks')
  },
  {
    label: 'Schedule Call',
    icon: 'ph:phone-bold',
    bg: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
    handler: () => router.push('/calendar')
  },
  {
    label: 'Send Email',
    icon: 'ph:envelope-bold',
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
    handler: () => router.push('/messaging')
  }
];
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

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  background: var(--glass-bg-primary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.action-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
