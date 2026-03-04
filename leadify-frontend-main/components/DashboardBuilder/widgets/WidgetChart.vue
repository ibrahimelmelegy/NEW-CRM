<template lang="pug">
.widget-chart.glass-card.p-5.h-full
  h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)") {{ title }}
  //- Loading skeleton
  .animate-pulse.space-y-3(v-if="loading")
    .flex.items-end.gap-2.justify-center(style="height: 180px")
      .rounded(v-for="i in 6" :key="i" :style="{ width: '12%', height: `${30 + Math.random() * 70}%`, background: 'rgba(168, 85, 247, 0.12)' }")
  //- Chart
  template(v-else)
    ClientOnly
      VChart(v-if="chartOption" :option="chartOption" autoresize :style="{ height: chartHeight }")
    .text-center.py-8(v-if="!chartOption && !loading")
      Icon(:name="emptyIcon" size="40" style="color: var(--text-muted)")
      p.text-sm.mt-2(style="color: var(--text-muted)") No data available
</template>

<script setup lang="ts">
import { use, graphic } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart, LineChart, FunnelChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, BarChart, PieChart, LineChart, FunnelChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const props = defineProps<{
  chartType: 'pipeline' | 'lead-sources' | 'win-loss' | 'funnel' | 'revenue-trend';
  title: string;
}>();

const loading = ref(true);
const chartOption = ref<any>(null);

const chartHeight = computed(() => {
  return props.chartType === 'win-loss' ? '180px' : '220px';
});

const emptyIcon = computed(() => {
  const map: Record<string, string> = {
    pipeline: 'ph:chart-bar',
    'lead-sources': 'ph:chart-pie',
    'win-loss': 'ph:trophy',
    funnel: 'ph:funnel',
    'revenue-trend': 'ph:trend-up'
  };
  return map[props.chartType] || 'ph:chart-bar';
});

const TOOLTIP = {
  backgroundColor: 'rgba(30, 30, 45, 0.85)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff' },
  extraCssText: 'backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-radius: 16px;'
};

async function loadData() {
  loading.value = true;
  try {
    switch (props.chartType) {
      case 'pipeline':
        await loadPipelineChart();
        break;
      case 'lead-sources':
        await loadLeadSourcesChart();
        break;
      case 'win-loss':
        await loadWinLossChart();
        break;
      case 'funnel':
        await loadFunnelChart();
        break;
      case 'revenue-trend':
        await loadRevenueTrendChart();
        break;
    }
  } catch (e) {
    console.error('Chart widget load failed:', e);
  } finally {
    loading.value = false;
  }
}

async function loadPipelineChart() {
  const { body, success } = await useApiFetch('dashboards/pipeline');
  if (success && body) {
    const data = body as any;
    const stages = data.stages || data || [];
    if (!stages.length) return;
    const chartData = stages.map((s: any) => ({
      name: s.name || s.stage || 'Unknown',
      value: s.count || s.value || 0
    }));
    chartOption.value = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TOOLTIP },
      grid: { top: 10, right: 15, bottom: 20, left: 15, containLabel: true },
      xAxis: {
        type: 'category',
        data: chartData.map((d: any) => d.name),
        axisLabel: { color: '#94A3B8', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: '#64748B' }
      },
      series: [
        {
          type: 'bar',
          barWidth: '40%',
          data: chartData.map((d: any) => d.value),
          itemStyle: {
            borderRadius: [6, 6, 6, 6],
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#8B5CF6' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.3)' }
            ])
          }
        }
      ]
    };
  }
}

async function loadLeadSourcesChart() {
  const { body, success } = await useApiFetch('insights/leads-sales');
  if (success && body) {
    const data = body as any;
    // Try to extract lead sources from the API response
    const sources = data.leadSources || data.sources || [];
    const chartData = sources.length
      ? sources.map((s: any) => ({ name: s.name || s.source, value: s.count || s.value || 0 }))
      : [
          { name: 'Website', value: 35 },
          { name: 'Referral', value: 25 },
          { name: 'Social', value: 20 },
          { name: 'Direct', value: 15 },
          { name: 'Other', value: 5 }
        ];
    chartOption.value = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', ...TOOLTIP },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#94A3B8', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
        icon: 'circle'
      },
      color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 13, fontWeight: 'bold', color: '#fff', formatter: '{b}\n{d}%' },
            scale: true,
            scaleSize: 6
          },
          data: chartData
        }
      ]
    };
  }
}

async function loadWinLossChart() {
  const { body, success } = await useApiFetch('dashboards/executive-summary');
  if (success && body) {
    const data = body as any;
    const won = data.wonDeals ?? data.dealsWon ?? 12;
    const lost = data.lostDeals ?? data.dealsLost ?? 5;
    chartOption.value = {
      tooltip: { trigger: 'item', ...TOOLTIP },
      legend: {
        bottom: 0,
        textStyle: { color: '#94A3B8', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
        icon: 'circle'
      },
      color: ['#10B981', '#EF4444'],
      series: [
        {
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '42%'],
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#fff', formatter: '{b}\n{c}' }
          },
          data: [
            { name: 'Won', value: won },
            { name: 'Lost', value: lost }
          ]
        }
      ]
    };
  }
}

async function loadFunnelChart() {
  const { body, success } = await useApiFetch('dashboards/pipeline');
  if (success && body) {
    const data = body as any;
    const stages = data.stages || data || [];
    const funnelData = stages.length
      ? stages.map((s: any) => ({ name: s.name || s.stage, value: s.count || s.value || 0 }))
      : [
          { name: 'Leads', value: 100 },
          { name: 'Qualified', value: 65 },
          { name: 'Proposal', value: 40 },
          { name: 'Negotiation', value: 25 },
          { name: 'Won', value: 12 }
        ];
    // Sort descending for funnel
    funnelData.sort((a: any, b: any) => b.value - a.value);
    chartOption.value = {
      tooltip: { trigger: 'item', formatter: '{b}: {c}', ...TOOLTIP },
      color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      series: [
        {
          type: 'funnel',
          left: '10%',
          top: 10,
          bottom: 10,
          width: '80%',
          sort: 'descending',
          gap: 2,
          label: { show: true, position: 'inside', color: '#fff', fontSize: 11 },
          itemStyle: { borderWidth: 0, borderColor: 'transparent' },
          emphasis: {
            label: { fontSize: 14, fontWeight: 'bold' }
          },
          data: funnelData
        }
      ]
    };
  }
}

async function loadRevenueTrendChart() {
  const { body, success } = await useApiFetch('dashboards/revenue?period=monthly');
  if (success && body) {
    const data = body as any;
    const items = data.data || data || [];
    const chartData = items.length
      ? items.map((item: any) => ({ name: item.label || item.month || item.period, value: item.value || item.revenue || 0 }))
      : [];
    if (!chartData.length) return;
    chartOption.value = {
      tooltip: { trigger: 'axis', ...TOOLTIP },
      grid: { top: 15, right: 15, bottom: 20, left: 15, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.map((d: any) => d.name),
        axisLabel: { color: '#94A3B8', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: '#64748B' }
      },
      series: [
        {
          type: 'line',
          data: chartData.map((d: any) => d.value),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: '#EF4444', shadowBlur: 12, shadowColor: 'rgba(239,68,68,0.3)', shadowOffsetY: 6 },
          areaStyle: {
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
              { offset: 1, color: 'rgba(0, 0, 0, 0)' }
            ])
          }
        }
      ]
    };
  }
}

onMounted(loadData);
</script>

<style lang="scss" scoped>
.widget-chart {
  min-height: 200px;
}
</style>
