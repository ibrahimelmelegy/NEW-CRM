<template lang="pug">
.activity-heatmap
  .heatmap-months.flex.text-xs.text-secondary.mb-1.ml-8
    span(v-for="m in months" :key="m" :style="{ width: `${100/12}%` }") {{ m }}
  .heatmap-container.flex
    .heatmap-days.flex.flex-col.text-xs.text-secondary.mr-2.justify-between(style="height: 104px")
      span Mon
      span Wed
      span Fri
    .heatmap-grid
      .heatmap-cell(
        v-for="(day, i) in data"
        :key="i"
        :class="`level-${day.level}`"
        :title="day.date ? `${day.date}: ${day.count} activities` : ''"
      )
  .heatmap-legend.flex.items-center.gap-2.mt-3.justify-end
    span.text-xs.text-secondary Less
    .legend-cell.level-0
    .legend-cell.level-1
    .legend-cell.level-2
    .legend-cell.level-3
    .legend-cell.level-4
    span.text-xs.text-secondary More
</template>

<script setup lang="ts">
import type { HeatmapDay } from '~/composables/useHeatmap';

defineProps<{
  data: HeatmapDay[];
}>();

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
</script>

<style lang="scss" scoped>
.text-secondary {
  color: var(--text-secondary);
}

.heatmap-grid {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  grid-auto-flow: column;
  grid-auto-columns: 14px;
  gap: 3px;
  overflow-x: auto;
}

.heatmap-cell {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  transition: all 0.15s ease;

  &.level-0 { background: var(--glass-bg-primary, rgba(255,255,255,0.05)); }
  &.level-1 { background: color-mix(in srgb, var(--accent-color, #7849ff) 25%, transparent); }
  &.level-2 { background: color-mix(in srgb, var(--accent-color, #7849ff) 50%, transparent); }
  &.level-3 { background: color-mix(in srgb, var(--accent-color, #7849ff) 75%, transparent); }
  &.level-4 { background: var(--accent-color, #7849ff); }

  &:hover {
    outline: 2px solid var(--accent-color, #7849ff);
    outline-offset: 1px;
    transform: scale(1.3);
  }
}

.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 3px;

  &.level-0 { background: var(--glass-bg-primary, rgba(255,255,255,0.05)); }
  &.level-1 { background: color-mix(in srgb, var(--accent-color, #7849ff) 25%, transparent); }
  &.level-2 { background: color-mix(in srgb, var(--accent-color, #7849ff) 50%, transparent); }
  &.level-3 { background: color-mix(in srgb, var(--accent-color, #7849ff) 75%, transparent); }
  &.level-4 { background: var(--accent-color, #7849ff); }
}
</style>
