<template lang="pug">
.deal-health-gauge
  VChart(:option="gaugeOption" autoresize style="height: 180px")
  .gauge-label {{ scoreLabel }}
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
}>();

const color = computed(() => {
  if (props.score >= 70) return '#22c55e';
  if (props.score >= 40) return '#f59e0b';
  return '#ef4444';
});

const scoreLabel = computed(() => {
  if (props.score >= 70) return 'Healthy';
  if (props.score >= 40) return 'Needs Attention';
  return 'At Risk';
});

const gaugeOption = computed(() => ({
  series: [{
    type: 'gauge',
    startAngle: 200,
    endAngle: -20,
    min: 0,
    max: 100,
    progress: { show: true, width: 14, roundCap: true },
    pointer: { show: false },
    axisLine: { lineStyle: { width: 14, color: [[1, 'rgba(255,255,255,0.06)']] } },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    detail: {
      valueAnimation: true,
      fontSize: 28,
      fontWeight: 'bold',
      color: 'var(--text-primary)',
      offsetCenter: [0, '10%'],
      formatter: '{value}'
    },
    itemStyle: { color: color.value },
    data: [{ value: props.score }]
  }]
}));
</script>

<style lang="scss" scoped>
.deal-health-gauge { text-align: center; }

.gauge-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-top: -8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
