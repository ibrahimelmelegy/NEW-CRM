<template lang="pug">
el-tooltip(:content="tooltipText" placement="top" :show-after="300")
  .momentum-badge(:class="{ 'momentum-badge--pulse': score > 75 }" :style="badgeStyle")
    span(class="badge-score") {{ score }}
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  score: number;
  label?: string;
}>(), {
  label: ''
});

const badgeColor = computed(() => {
  if (props.score >= 76) return '#00ff88';
  if (props.score >= 51) return '#ffaa00';
  if (props.score >= 26) return '#ff8800';
  return '#ff4444';
});

const labelText = computed(() => {
  if (props.label) return props.label;
  if (props.score >= 76) return 'Hot';
  if (props.score >= 51) return 'Warm';
  if (props.score >= 26) return 'Cooling';
  return 'Cold';
});

const tooltipText = computed(() => `Momentum: ${labelText.value} (${props.score}/100)`);

const badgeStyle = computed(() => ({
  '--badge-color': badgeColor.value,
  backgroundColor: `${badgeColor.value}20`,
  borderColor: `${badgeColor.value}40`,
  color: badgeColor.value
}));
</script>

<style lang="scss" scoped>
.momentum-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid;
  cursor: default;
  transition: all 0.3s ease;
  font-variant-numeric: tabular-nums;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 12px var(--badge-color, rgba(255, 255, 255, 0.2));
  }

  &--pulse {
    animation: momentum-pulse 2s ease-in-out infinite;
  }
}

.badge-score {
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}

@keyframes momentum-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--badge-color, rgba(0, 255, 136, 0.4));
  }
  50% {
    box-shadow: 0 0 0 6px transparent;
  }
}
</style>
