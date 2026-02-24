<template lang="pug">
.churn-chart
  //- Main churn gauge
  .gauge-container
    .gauge-ring
      svg(viewBox="0 0 120 120" width="160" height="160")
        //- Background ring
        circle(
          cx="60" cy="60" r="50"
          fill="none"
          stroke="var(--border-color, #e4e7ed)"
          stroke-width="12"
          stroke-linecap="round"
        )
        //- Value arc
        circle(
          cx="60" cy="60" r="50"
          fill="none"
          :stroke="gaugeColor"
          stroke-width="12"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          transform="rotate(-90 60 60)"
          class="gauge-arc"
        )
      .gauge-label
        .gauge-value(:style="{ color: gaugeColor }") {{ data.rate }}%
        .gauge-text Churn Rate

  //- Trend indicator
  .trend-section.mt-6
    .flex.items-center.justify-center.gap-2
      .trend-badge(:class="trendClass")
        Icon(:name="trendIcon" size="18")
        span {{ trendLabel }}

  //- Benchmarks
  .benchmarks.mt-6
    .benchmark-item
      .benchmark-bar
        .benchmark-fill(style="width: 100%; background: #67c23a;")
      .benchmark-label
        span Excellent
        span(class="text-xs") &lt; 2%
    .benchmark-item
      .benchmark-bar
        .benchmark-fill(style="width: 100%; background: #e6a23c;")
      .benchmark-label
        span Average
        span(class="text-xs") 2-5%
    .benchmark-item
      .benchmark-bar
        .benchmark-fill(style="width: 100%; background: #f56c6c;")
      .benchmark-label
        span High
        span(class="text-xs") &gt; 5%

  //- Assessment
  .assessment.mt-4.text-center
    p.text-sm(style="color: var(--text-muted)")
      | Your churn rate is
      strong.ml-1(:style="{ color: gaugeColor }") {{ assessment }}
</template>

<script setup lang="ts">
interface ChurnData {
  rate: number;
  trend: string;
}

const props = defineProps<{
  data: ChurnData;
}>();

const circumference = computed(() => 2 * Math.PI * 50);

const dashOffset = computed(() => {
  // Map 0-100% churn to the gauge (cap at 100%)
  const rate = Math.min(props.data.rate, 100);
  const progress = rate / 100;
  return circumference.value * (1 - progress);
});

const gaugeColor = computed(() => {
  const rate = props.data.rate;
  if (rate <= 2) return '#67c23a';
  if (rate <= 5) return '#e6a23c';
  return '#f56c6c';
});

const assessment = computed(() => {
  const rate = props.data.rate;
  if (rate <= 2) return 'excellent';
  if (rate <= 5) return 'average';
  return 'high - action needed';
});

const trendIcon = computed(() => {
  if (props.data.trend === 'up') return 'ph:trend-up-bold';
  if (props.data.trend === 'down') return 'ph:trend-down-bold';
  return 'ph:minus-bold';
});

const trendLabel = computed(() => {
  if (props.data.trend === 'up') return 'Increasing';
  if (props.data.trend === 'down') return 'Decreasing';
  return 'Stable';
});

const trendClass = computed(() => {
  if (props.data.trend === 'up') return 'trend-bad';
  if (props.data.trend === 'down') return 'trend-good';
  return 'trend-neutral';
});
</script>

<style scoped>
.churn-chart {
  width: 100%;
}

.gauge-container {
  display: flex;
  justify-content: center;
}

.gauge-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.gauge-arc {
  transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.gauge-label {
  position: absolute;
  text-align: center;
}

.gauge-value {
  font-size: 28px;
  font-weight: 700;
}

.gauge-text {
  font-size: 12px;
  color: var(--text-muted, #909399);
}

.trend-section {
  display: flex;
  justify-content: center;
}

.trend-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.trend-good {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.trend-bad {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.trend-neutral {
  background: rgba(144, 147, 153, 0.1);
  color: #909399;
}

.benchmarks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.benchmark-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.benchmark-bar {
  width: 40px;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: var(--border-color, #e4e7ed);
}

.benchmark-fill {
  height: 100%;
  border-radius: 3px;
}

.benchmark-label {
  flex: 1;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted, #909399);
}

.assessment {
  padding-top: 8px;
  border-top: 1px solid var(--border-color, #e4e7ed);
}
</style>
