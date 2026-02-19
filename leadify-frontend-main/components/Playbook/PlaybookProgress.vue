<template lang="pug">
div(class="glass-card p-6 animate-entrance")
  .flex.items-center.justify-between.mb-3
    .flex.items-center.gap-2
      Icon(name="ph:chart-line-up-bold" size="20" class="text-[var(--brand-primary)]")
      span(class="text-sm font-semibold text-[var(--text-primary)]") {{ $t('playbook.overallProgress') }}
    span(class="text-2xl font-bold text-[var(--brand-primary)]") {{ percentage }}%

  .progress-track(class="w-full h-3 rounded-full overflow-hidden" style="background: var(--glass-bg)")
    .progress-fill(
      class="h-full rounded-full transition-all duration-700 ease-out"
      :style="{ width: percentage + '%' }"
    )

  .flex.items-center.justify-between.mt-3
    span(class="text-xs text-[var(--text-secondary)]") {{ completedSteps }} {{ $t('playbook.steps') }} {{ $t('playbook.completed').toLowerCase() }}
    span(class="text-xs text-[var(--text-secondary)]") {{ totalSteps }} {{ $t('playbook.steps') }}
</template>

<script lang="ts" setup>
const props = defineProps<{
  percentage: number;
  completedSteps?: number;
  totalSteps?: number;
}>();
</script>

<style lang="scss" scoped>
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}

.progress-track {
  background: rgba(128, 128, 128, 0.15);
}

.progress-fill {
  background: linear-gradient(90deg, var(--brand-primary), var(--brand-accent, #a78bfa));
  box-shadow: 0 0 12px rgba(120, 73, 255, 0.3);
}

.animate-entrance {
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
