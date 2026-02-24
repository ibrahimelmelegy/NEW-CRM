<template lang="pug">
.deal-health-score
  VChart.health-gauge(:option="gaugeOption" autoresize style="height: 200px")
  .health-label(:class="statusClass") {{ statusLabel }}
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';

use([GaugeChart, CanvasRenderer]);

const props = defineProps<{
  score: number;
  status: string;
}>();

const statusClass = computed(() => `status-${props.status}`);
const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    'healthy': 'Healthy',
    'at-risk': 'At Risk',
    'stalling': 'Stalling',
    'trending-up': 'Trending Up'
  };
  return labels[props.status] || props.status;
});

const gaugeColor = computed(() => {
  if (props.score >= 70) return '#22c55e';
  if (props.score >= 40) return '#f59e0b';
  return '#ef4444';
});

const gaugeOption = computed(() => ({
  series: [{
    type: 'gauge',
    startAngle: 200,
    endAngle: -20,
    min: 0,
    max: 100,
    splitNumber: 10,
    itemStyle: { color: gaugeColor.value },
    progress: {
      show: true,
      width: 16,
      roundCap: true
    },
    pointer: { show: false },
    axisLine: {
      lineStyle: { width: 16, color: [[1, 'rgba(255,255,255,0.08)']] }
    },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    title: { show: false },
    detail: {
      valueAnimation: true,
      fontSize: 32,
      fontWeight: 'bold',
      color: 'var(--text-primary)',
      offsetCenter: [0, '10%'],
      formatter: '{value}%'
    },
    data: [{ value: props.score }]
  }]
}));
</script>

<style lang="scss" scoped>
.deal-health-score {
  text-align: center;
}

.health-label {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: -10px;

  &.status-healthy { color: #22c55e; }
  &.status-at-risk { color: #ef4444; }
  &.status-stalling { color: #f59e0b; }
  &.status-trending-up { color: #3b82f6; }
}
</style>
