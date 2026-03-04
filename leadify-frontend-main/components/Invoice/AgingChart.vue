<template lang="pug">
.aging-chart
  .chart-label.mb-2.text-sm.font-medium(style="color: var(--text-secondary)") Outstanding by Age
  .chart-bar-container
    .chart-bar(v-if="total > 0")
      .bar-segment.current(
        :style="{ width: pct(data.current) + '%' }"
        v-if="data.current > 0"
      )
        span.bar-label(v-if="pct(data.current) > 10") {{ pct(data.current).toFixed(0) }}%
      .bar-segment.thirty(
        :style="{ width: pct(data.thirtyDays) + '%' }"
        v-if="data.thirtyDays > 0"
      )
        span.bar-label(v-if="pct(data.thirtyDays) > 10") {{ pct(data.thirtyDays).toFixed(0) }}%
      .bar-segment.sixty(
        :style="{ width: pct(data.sixtyDays) + '%' }"
        v-if="data.sixtyDays > 0"
      )
        span.bar-label(v-if="pct(data.sixtyDays) > 10") {{ pct(data.sixtyDays).toFixed(0) }}%
      .bar-segment.ninety-plus(
        :style="{ width: pct(data.ninetyPlus) + '%' }"
        v-if="data.ninetyPlus > 0"
      )
        span.bar-label(v-if="pct(data.ninetyPlus) > 10") {{ pct(data.ninetyPlus).toFixed(0) }}%
    .chart-bar.empty(v-else)
      .bar-segment.no-data(style="width: 100%")
        span.bar-label No outstanding invoices
  .chart-legend.mt-3.flex.flex-wrap.gap-4
    .legend-item.flex.items-center.gap-2
      .legend-dot.current
      span.text-xs(style="color: var(--text-secondary)") Current (0-30)
    .legend-item.flex.items-center.gap-2
      .legend-dot.thirty
      span.text-xs(style="color: var(--text-secondary)") 30-60 Days
    .legend-item.flex.items-center.gap-2
      .legend-dot.sixty
      span.text-xs(style="color: var(--text-secondary)") 60-90 Days
    .legend-item.flex.items-center.gap-2
      .legend-dot.ninety-plus
      span.text-xs(style="color: var(--text-secondary)") 90+ Days
</template>

<script setup lang="ts">
const props = defineProps<{
  data: {
    current: number;
    thirtyDays: number;
    sixtyDays: number;
    ninetyPlus: number;
  };
}>();

const total = computed(() => props.data.current + props.data.thirtyDays + props.data.sixtyDays + props.data.ninetyPlus);

function pct(value: number): number {
  if (total.value === 0) return 0;
  return (value / total.value) * 100;
}
</script>

<style scoped>
.chart-bar-container {
  width: 100%;
}
.chart-bar {
  display: flex;
  height: 36px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--glass-bg, rgba(255, 255, 255, 0.05));
}
.chart-bar.empty {
  background: var(--glass-bg, rgba(255, 255, 255, 0.05));
}
.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2px;
  transition: width 0.4s ease;
}
.bar-segment.current {
  background: #22c55e;
}
.bar-segment.thirty {
  background: #f59e0b;
}
.bar-segment.sixty {
  background: #f97316;
}
.bar-segment.ninety-plus {
  background: #ef4444;
}
.bar-segment.no-data {
  background: var(--glass-bg, rgba(255, 255, 255, 0.08));
}
.bar-label {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.legend-dot.current {
  background: #22c55e;
}
.legend-dot.thirty {
  background: #f59e0b;
}
.legend-dot.sixty {
  background: #f97316;
}
.legend-dot.ninety-plus {
  background: #ef4444;
}
</style>
