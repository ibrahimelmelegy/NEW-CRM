<template lang="pug">
.grid.gap-4(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
  .metric-card(v-for="(kpi, i) in kpis" :key="i")
    .flex.items-center.justify-between.mb-1
      span(class="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]") {{ $t(kpi.label) }}
      span(class="metric-change" :class="kpi.change >= 0 ? 'metric-change--up' : 'metric-change--down'")
        Icon(:name="kpi.change >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="12")
        span {{ kpi.change >= 0 ? '+' : '' }}{{ kpi.change }}%
    p(class="text-xl font-bold text-[var(--text-primary)] mb-2") {{ kpi.value }}
    ClientOnly
      VChart(:option="getSparklineOption(kpi)" autoresize style="height: 60px; width: 100%")
</template>

<script setup lang="ts">
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import type { KPI } from '~/composables/useDailyBriefing';

use([LineChart, GridComponent, CanvasRenderer]);

defineProps<{
  kpis: KPI[];
}>();

function getSparklineOption(kpi: KPI) {
  return {
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: {
      type: 'category' as const,
      show: false,
      data: kpi.sparkline.map((_: number, i: number) => i)
    },
    yAxis: {
      type: 'value' as const,
      show: false
    },
    series: [
      {
        type: 'line' as const,
        data: kpi.sparkline,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2.5, color: kpi.color },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${kpi.color}40` },
              { offset: 1, color: `${kpi.color}05` }
            ]
          }
        }
      }
    ]
  };
}
</script>

<style lang="scss" scoped>
.metric-card {
  background: var(--bg-card, rgba(30, 30, 45, 0.6));
  backdrop-filter: var(--glass-blur, blur(12px));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
  padding: 18px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 700;

  &--up {
    color: #22c55e;
  }

  &--down {
    color: #ef4444;
  }
}
</style>
