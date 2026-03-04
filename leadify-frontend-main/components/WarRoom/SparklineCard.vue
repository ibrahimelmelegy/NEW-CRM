<template>
  <div class="sparkline-card">
    <div class="card-top">
      <span class="card-label">{{ label }}</span>
      <span class="card-trend" :class="trend >= 0 ? 'positive' : 'negative'">
        <Icon :name="trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" />
        {{ trend >= 0 ? '+' : '' }}{{ trend }}%
      </span>
    </div>
    <div class="card-value">{{ formattedValue }}</div>
    <VChart :option="chartOptions" autoresize style="height: 50px" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';

use([LineChart, GridComponent, CanvasRenderer]);

const props = defineProps<{
  label: string;
  value: number;
  data: number[];
  color: string;
  prefix?: string;
}>();

const formattedValue = computed(() => {
  const p = props.prefix || '';
  if (props.value >= 1_000_000) return `${p}${(props.value / 1_000_000).toFixed(1)}M`;
  if (props.value >= 1_000) return `${p}${(props.value / 1_000).toFixed(1)}K`;
  return `${p}${props.value.toLocaleString()}`;
});

const trend = computed(() => {
  if (props.data.length < 2) return 0;
  const last = props.data[props.data.length - 1];
  const prev = props.data[props.data.length - 2];
  if (prev === 0) return 0;
  return Math.round(((last! - prev!) / prev!) * 100);
});

const chartOptions = computed(() => ({
  grid: { left: 0, right: 0, top: 0, bottom: 0 },
  xAxis: { type: 'category', show: false, data: props.data.map((_, i) => i) },
  yAxis: { type: 'value', show: false },
  series: [
    {
      type: 'line',
      data: props.data,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2, color: props.color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${props.color}40` },
            { offset: 1, color: `${props.color}05` }
          ]
        }
      }
    }
  ]
}));
</script>

<style lang="scss" scoped>
.sparkline-card {
  padding: 16px;
  background: var(--glass-bg-primary);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border-color, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.card-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.card-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;

  &.positive {
    color: #22c55e;
  }
  &.negative {
    color: #ef4444;
  }
}

.card-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 8px;
}
</style>
