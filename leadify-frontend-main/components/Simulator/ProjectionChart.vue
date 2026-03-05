<template lang="pug">
div(class="projection-chart-wrapper")
  ClientOnly
    VChart(
      :option="chartOption"
      autoresize
      :style="{ height: chartHeight }"
    )
    template(#fallback)
      .flex.items-center.justify-center(style="height: 350px")
        el-skeleton(:rows="6" animated)
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { graphic } from 'echarts/core';

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const props = withDefaults(
  defineProps<{
    currentData: number[];
    simulatedData: number[];
    months: string[];
    chartHeight?: string;
  }>(),
  {
    chartHeight: '350px'
  }
);

const { t } = useI18n();

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

const chartOption = computed(() => {
  const currentLabel = t('simulator.currentTrajectory');
  const simulatedLabel = t('simulator.simulated');

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 30, 45, 0.9)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#fff', fontSize: 13 },
      extraCssText: 'backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-radius: 12px;',
      formatter(params: unknown) {
        const month = params[0]?.axisValue || '';
        let html = `<div style="font-weight:600;margin-bottom:8px">${month}</div>`;
        for (const p of params) {
          const color = p.color;
          const val = formatCurrency(p.value);
          html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">`;
          html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>`;
          html += `<span>${p.seriesName}:</span>`;
          html += `<span style="font-weight:700;margin-left:auto">${val}</span>`;
          html += `</div>`;
        }

        // Show delta
        if (params.length === 2) {
          const delta = params[1].value - params[0].value;
          const sign = delta >= 0 ? '+' : '';
          const deltaColor = delta >= 0 ? '#34d399' : '#f87171';
          html += `<div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;padding-top:8px;color:${deltaColor};font-weight:600">`;
          html += `Delta: ${sign}${formatCurrency(delta)}`;
          html += `</div>`;
        }
        return html;
      }
    },
    legend: {
      data: [currentLabel, simulatedLabel],
      bottom: 0,
      textStyle: { color: '#94A3B8', fontSize: 12 },
      icon: 'roundRect',
      itemWidth: 16,
      itemHeight: 3
    },
    grid: {
      top: 20,
      right: 20,
      bottom: 50,
      left: 20,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.months,
      axisLabel: {
        color: '#94A3B8',
        fontSize: 11,
        rotate: 0
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748B',
        fontSize: 11,
        formatter(value: number) {
          return formatCurrency(value);
        }
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'rgba(255,255,255,0.05)'
        }
      }
    },
    animationDuration: 800,
    animationEasing: 'cubicOut',
    series: [
      {
        name: currentLabel,
        type: 'line',
        data: props.currentData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: '#64748B'
        },
        itemStyle: {
          color: '#64748B'
        },
        emphasis: {
          showSymbol: true,
          itemStyle: {
            color: '#94A3B8',
            borderColor: '#64748B',
            borderWidth: 2
          }
        }
      },
      {
        name: simulatedLabel,
        type: 'line',
        data: props.simulatedData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: '#7849FF',
          shadowBlur: 12,
          shadowColor: 'rgba(120, 73, 255, 0.4)',
          shadowOffsetY: 4
        },
        itemStyle: {
          color: '#7849FF'
        },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(120, 73, 255, 0.25)' },
            { offset: 0.5, color: 'rgba(120, 73, 255, 0.08)' },
            { offset: 1, color: 'rgba(120, 73, 255, 0)' }
          ])
        },
        emphasis: {
          showSymbol: true,
          itemStyle: {
            color: '#fff',
            borderColor: '#7849FF',
            borderWidth: 3
          }
        }
      }
    ]
  };
});
</script>

<style lang="scss" scoped>
.projection-chart-wrapper {
  width: 100%;
}
</style>
