<template lang="pug">
.metric-counter
  .metric-icon(:style="{ background: `linear-gradient(135deg, ${color}33, ${color}11)`, color }")
    Icon(:name="icon" size="24")
  .metric-value {{ displayValue }}
  .metric-label {{ label }}
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  value: number;
  label: string;
  icon: string;
  color: string;
  prefix?: string;
  suffix?: string;
}>();

const displayValue = ref('0');
let animFrame: number | null = null;

function formatNumber(n: number): string {
  const prefix = props.prefix || '';
  const suffix = props.suffix || '';
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M${suffix}`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K${suffix}`;
  return `${prefix}${Math.round(n).toLocaleString()}${suffix}`;
}

function animateCount(target: number) {
  const duration = 1500;
  const start = performance.now();
  const startVal = 0;

  function step(now: number) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = startVal + (target - startVal) * eased;
    displayValue.value = formatNumber(current);
    if (progress < 1) {
      animFrame = requestAnimationFrame(step);
    }
  }
  if (animFrame) cancelAnimationFrame(animFrame);
  animFrame = requestAnimationFrame(step);
}

onMounted(() => animateCount(props.value));
watch(() => props.value, (val) => animateCount(val));
</script>

<style lang="scss" scoped>
.metric-counter {
  text-align: center;
  padding: 20px;
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.metric-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  line-height: 1;
  margin-bottom: 6px;
}

.metric-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}
</style>
