<template lang="pug">
el-drawer(
  :model-value="visible"
  :title="$t('momentum.title')"
  direction="rtl"
  size="420px"
  :before-close="handleClose"
  class="momentum-drawer"
)
  .momentum-panel(v-loading="loading")
    template(v-if="momentum")
      //- Gauge Section
      .panel-section
        MomentumGauge(:score="momentum.score" size="md")

      //- Label Badge
      .panel-section.label-section
        .momentum-label-badge(:style="{ backgroundColor: momentum.color + '20', color: momentum.color, borderColor: momentum.color + '40' }")
          span(class="label-text") {{ $t(`momentum.${momentum.label.toLowerCase()}`) }}
        .score-text {{ $t('momentum.score') }}: {{ momentum.score }}/100

      //- Score Breakdown
      .panel-section
        h4(class="section-title") {{ $t('momentum.breakdown') }}
        .breakdown-list
          .breakdown-item
            .breakdown-header
              span(class="breakdown-label") {{ $t('momentum.velocity') }}
              span(class="breakdown-value") {{ momentum.velocity }}/30
            .breakdown-bar
              .breakdown-fill(:style="velocityBarStyle")

          .breakdown-item
            .breakdown-header
              span(class="breakdown-label") {{ $t('momentum.engagement') }}
              span(class="breakdown-value") {{ momentum.engagement }}/30
            .breakdown-bar
              .breakdown-fill(:style="engagementBarStyle")

          .breakdown-item
            .breakdown-header
              span(class="breakdown-label") {{ $t('momentum.progression') }}
              span(class="breakdown-value") {{ momentum.progression }}/20
            .breakdown-bar
              .breakdown-fill(:style="progressionBarStyle")

          .breakdown-item
            .breakdown-header
              span(class="breakdown-label") {{ $t('momentum.responsiveness') }}
              span(class="breakdown-value") {{ momentum.responsiveness }}/20
            .breakdown-bar
              .breakdown-fill(:style="responsivenessBarStyle")

      //- Trend Sparkline
      .panel-section
        h4(class="section-title") {{ $t('momentum.trend') }}
        ClientOnly
          VChart.trend-chart(:option="trendOption" autoresize)

    //- Empty State
    .panel-empty(v-else-if="!loading")
      p {{ $t('momentum.title') }}
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { useDealMomentum } from '../../composables/useDealMomentum';

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps<{
  dealId: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { momentum, loading, fetchMomentum, scoreColor } = useDealMomentum();

watch(() => props.visible, (val) => {
  if (val && props.dealId) {
    fetchMomentum(props.dealId);
  }
});

function handleClose() {
  emit('close');
}

function barColor(ratio: number): string {
  if (ratio >= 0.75) return '#00ff88';
  if (ratio >= 0.5) return '#ffaa00';
  if (ratio >= 0.25) return '#ff8800';
  return '#ff4444';
}

const velocityBarStyle = computed(() => {
  if (!momentum.value) return {};
  const ratio = momentum.value.velocity / 30;
  return {
    width: `${ratio * 100}%`,
    backgroundColor: barColor(ratio)
  };
});

const engagementBarStyle = computed(() => {
  if (!momentum.value) return {};
  const ratio = momentum.value.engagement / 30;
  return {
    width: `${ratio * 100}%`,
    backgroundColor: barColor(ratio)
  };
});

const progressionBarStyle = computed(() => {
  if (!momentum.value) return {};
  const ratio = momentum.value.progression / 20;
  return {
    width: `${ratio * 100}%`,
    backgroundColor: barColor(ratio)
  };
});

const responsivenessBarStyle = computed(() => {
  if (!momentum.value) return {};
  const ratio = momentum.value.responsiveness / 20;
  return {
    width: `${ratio * 100}%`,
    backgroundColor: barColor(ratio)
  };
});

const trendOption = computed(() => {
  if (!momentum.value) return {};
  const data = momentum.value.trend;
  return {
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => `Score: ${params[0]?.value ?? '-'}`
    },
    xAxis: {
      type: 'category',
      show: false,
      data: data.map((_: number, i: number) => `Day ${i + 1}`)
    },
    yAxis: {
      type: 'value',
      show: false,
      min: Math.max(0, Math.min(...data) - 10),
      max: Math.min(100, Math.max(...data) + 10)
    },
    series: [{
      type: 'line',
      data,
      smooth: true,
      showSymbol: true,
      symbolSize: 6,
      lineStyle: { width: 2.5, color: scoreColor.value },
      itemStyle: { color: scoreColor.value },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${scoreColor.value}40` },
            { offset: 1, color: `${scoreColor.value}05` }
          ]
        }
      }
    }]
  };
});
</script>

<style lang="scss" scoped>
.momentum-panel {
  padding: 8px 0;
}

.panel-section {
  margin-bottom: 24px;
}

.label-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.momentum-label-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 20px;
  border: 1.5px solid;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.score-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
  letter-spacing: 0.3px;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.breakdown-item {
  .breakdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .breakdown-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .breakdown-value {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
}

.breakdown-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.breakdown-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.trend-chart {
  height: 100px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>

<style lang="scss">
.momentum-drawer {
  .el-drawer__header {
    margin-bottom: 0;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--glass-border);
  }

  .el-drawer__body {
    background: var(--bg-card);
  }
}
</style>
