<template lang="pug">
div(class="simulator-slider")
  .flex.items-center.justify-between.mb-2
    span(class="text-sm font-medium text-[var(--text-primary)]") {{ label }}
    .flex.items-center.gap-2
      span(class="text-xs text-[var(--text-secondary)]") {{ formatDisplay(baseline) }}
      Icon(
        v-if="modelValue !== baseline"
        :name="changeDirection > 0 ? 'ph:arrow-up-bold' : changeDirection < 0 ? 'ph:arrow-down-bold' : 'ph:minus-bold'"
        size="12"
        :class="changeColorClass"
      )
      span(
        v-if="modelValue !== baseline"
        :class="['text-xs font-semibold', changeColorClass]"
      ) {{ formatDisplay(modelValue) }}

  el-slider(
    :model-value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :format-tooltip="formatDisplay"
    @update:model-value="$emit('update:modelValue', $event)"
  )

  .flex.items-center.justify-between(class="mt-1")
    span(class="text-[10px] text-[var(--text-secondary)] opacity-60") {{ formatDisplay(min) }}
    .flex.items-center.gap-1(v-if="modelValue !== baseline")
      span(class="text-[10px] font-medium" :class="changeColorClass")
        | {{ changeDirection > 0 ? '+' : '' }}{{ changePercent }}%
      span(class="text-[10px] text-[var(--text-secondary)] opacity-60") vs baseline
    span(class="text-[10px] text-[var(--text-secondary)] opacity-60") {{ formatDisplay(max) }}
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  modelValue: number;
  min: number;
  max: number;
  step: number;
  baseline: number;
  unit: string;
  formatFn?: (v: number) => string;
}>();

defineEmits<{
  'update:modelValue': [value: number];
}>();

const changeDirection = computed(() => {
  if (props.modelValue > props.baseline) return 1;
  if (props.modelValue < props.baseline) return -1;
  return 0;
});

const changePercent = computed(() => {
  if (props.baseline === 0) return 0;
  return Math.round(((props.modelValue - props.baseline) / props.baseline) * 100);
});

const changeColorClass = computed(() => {
  // For salesCycleLength, lower is better (invert colors)
  const isInverse = props.unit === ' days';
  if (changeDirection.value > 0) {
    return isInverse ? 'text-red-400' : 'text-emerald-400';
  }
  if (changeDirection.value < 0) {
    return isInverse ? 'text-emerald-400' : 'text-red-400';
  }
  return 'text-[var(--text-secondary)]';
});

function formatDisplay(value: number): string {
  if (props.formatFn) return props.formatFn(value);

  if (props.unit === '$') {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }
  if (props.unit === '%') return `${value}%`;
  if (props.unit === ' days') return `${value} days`;
  return value.toLocaleString();
}
</script>

<style lang="scss" scoped>
.simulator-slider {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.06));
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--brand-primary, rgba(120, 73, 255, 0.3));
  }
}

:deep(.el-slider__runway) {
  background-color: rgba(255, 255, 255, 0.08);
  height: 4px;
}

:deep(.el-slider__bar) {
  background: linear-gradient(90deg, var(--brand-primary, #7849ff), var(--brand-accent, #a855f7));
  height: 4px;
}

:deep(.el-slider__button) {
  width: 16px;
  height: 16px;
  border: 2px solid var(--brand-primary, #7849ff);
  background: var(--bg-card, #1e1e2d);
  box-shadow: 0 0 10px rgba(120, 73, 255, 0.4);
}

:deep(.el-slider__button-wrapper) {
  top: -16px;
}

.text-emerald-400 { color: #34d399; }
.text-red-400 { color: #f87171; }
</style>
