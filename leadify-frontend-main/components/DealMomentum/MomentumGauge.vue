<template lang="pug">
.momentum-gauge(:class="`momentum-gauge--${size}`")
  ClientOnly
    VChart.gauge-chart(:option="gaugeOption" autoresize)
  .gauge-score-label {{ scoreLabel }}
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';

use([GaugeChart, CanvasRenderer]);

const props = withDefaults(
  defineProps<{
    score: number;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  {
    size: 'md'
  }
);

const sizeMap = {
  sm: { height: '120px', fontSize: 20, detailOffset: '15%' },
  md: { height: '200px', fontSize: 32, detailOffset: '12%' },
  lg: { height: '280px', fontSize: 42, detailOffset: '10%' }
};

const currentSize = computed(() => sizeMap[props.size]);

const scoreLabel = computed(() => {
  if (props.score >= 76) return 'Hot';
  if (props.score >= 51) return 'Warm';
  if (props.score >= 26) return 'Cooling';
  return 'Cold';
});

const gaugeOption = computed(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      center: ['50%', '70%'],
      radius: '90%',
      min: 0,
      max: 100,
      progress: {
        show: true,
        width: 16,
        roundCap: true,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#ff4444' },
              { offset: 0.3, color: '#ff8800' },
              { offset: 0.5, color: '#ffaa00' },
              { offset: 0.75, color: '#88cc00' },
              { offset: 1, color: '#00ff88' }
            ]
          }
        }
      },
      pointer: {
        show: true,
        length: '60%',
        width: 4,
        itemStyle: {
          color: 'var(--text-primary)',
          opacity: 0.6
        }
      },
      anchor: {
        show: true,
        size: 8,
        itemStyle: {
          color: 'var(--text-primary)',
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.15)'
        }
      },
      axisLine: {
        lineStyle: {
          width: 16,
          color: [[1, 'rgba(255,255,255,0.06)']]
        },
        roundCap: true
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        show: true,
        distance: -30,
        fontSize: 10,
        color: 'rgba(255,255,255,0.3)',
        formatter: (value: number) => {
          if (value === 0 || value === 50 || value === 100) return `${value}`;
          return '';
        }
      },
      detail: {
        valueAnimation: true,
        fontSize: currentSize.value.fontSize,
        fontWeight: 'bold',
        color: 'var(--text-primary)',
        offsetCenter: [0, currentSize.value.detailOffset],
        formatter: '{value}'
      },
      data: [{ value: props.score }],
      animationDuration: 1200,
      animationEasingUpdate: 'cubicOut'
    }
  ]
}));
</script>

<style lang="scss" scoped>
.momentum-gauge {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 16px;
  text-align: center;

  &--sm .gauge-chart {
    height: 120px;
  }

  &--md .gauge-chart {
    height: 200px;
  }

  &--lg .gauge-chart {
    height: 280px;
  }
}

.gauge-score-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-top: -4px;
}
</style>
