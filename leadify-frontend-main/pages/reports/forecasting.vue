<template lang="pug">
.forecasting-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('navigation.forecasting') || 'Sales Forecasting' }}
    p(style="color: var(--text-muted)") Track targets, pipeline and actual revenue by period

  //- Controls
  .flex.items-center.gap-4.mb-8(class="flex-col md:flex-row")
    el-select(v-model="selectedPeriod" @change="loadData" style="width: 160px")
      el-option(label="Monthly" value="monthly")
      el-option(label="Quarterly" value="quarterly")
      el-option(label="Yearly" value="yearly")
    el-date-picker(v-model="dateRange" type="daterange" range-separator="to" start-placeholder="Start" end-placeholder="End" @change="loadData" style="width: 300px")

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- Summary Cards
    .grid.gap-4.mb-8(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
      .glass-card.p-5.text-center
        p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") Total Target
        p.text-3xl.font-bold(style="color: #7849ff") {{ formatCurrency(totals.target) }}

      .glass-card.p-5.text-center
        p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") Actual Revenue
        p.text-3xl.font-bold(style="color: #22c55e") {{ formatCurrency(totals.actual) }}

      .glass-card.p-5.text-center
        p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") Pipeline Value
        p.text-3xl.font-bold(style="color: #3b82f6") {{ formatCurrency(totals.pipeline) }}

      .glass-card.p-5.text-center
        p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") Attainment
        p.text-3xl.font-bold(:style="{ color: attainmentColor }") {{ totals.target > 0 ? Math.round((totals.actual / totals.target) * 100) : 0 }}%

    //- ECharts Grouped Bar Chart
    .glass-card.p-6.mb-8
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") Revenue vs Target
      VChart.w-full(v-if="forecasts.length" :option="chartOption" :style="{ height: '350px' }" autoresize)
      .text-center.py-12(v-else)
        p.text-sm(style="color: var(--text-muted)") No forecast data available

    //- Rep Table
    .glass-card.p-6
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") By Representative
      el-table(:data="forecasts" stripe style="width: 100%")
        el-table-column(prop="user.name" label="Rep" min-width="150")
          template(#default="scope")
            span {{ scope.row.user?.name || 'Unknown' }}
        el-table-column(label="Target" min-width="120")
          template(#default="scope")
            span {{ formatCurrency(scope.row.target) }}
        el-table-column(label="Actual" min-width="120")
          template(#default="scope")
            span(style="color: #22c55e") {{ formatCurrency(scope.row.actual) }}
        el-table-column(label="Pipeline" min-width="120")
          template(#default="scope")
            span(style="color: #3b82f6") {{ formatCurrency(scope.row.pipeline) }}
        el-table-column(label="Won" min-width="100")
          template(#default="scope")
            span {{ formatCurrency(scope.row.closedWon) }}
        el-table-column(label="Lost" min-width="100")
          template(#default="scope")
            span(style="color: #ef4444") {{ formatCurrency(scope.row.closedLost) }}
        el-table-column(label="Attainment" min-width="120")
          template(#default="scope")
            el-progress(:percentage="scope.row.target > 0 ? Math.min(Math.round((scope.row.actual / scope.row.target) * 100), 100) : 0" :color="scope.row.actual >= scope.row.target ? '#22c55e' : '#f59e0b'")
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { graphic } from 'echarts';
import VChart from 'vue-echarts';
import { fetchForecasts, fetchForecastByPeriod } from '~/composables/useForecasting';
import type { ForecastPeriod } from '~/composables/useForecasting';

definePageMeta({ title: 'Sales Forecasting' });

const loading = ref(true);
const selectedPeriod = ref('monthly');
const dateRange = ref<[Date, Date] | null>(null);
const forecasts = ref<ForecastPeriod[]>([]);

const totals = computed(() => {
  return forecasts.value.reduce(
    (acc, f) => ({
      target: acc.target + (f.target || 0),
      actual: acc.actual + (f.actual || 0),
      pipeline: acc.pipeline + (f.pipeline || 0),
      closedWon: acc.closedWon + (f.closedWon || 0),
      closedLost: acc.closedLost + (f.closedLost || 0)
    }),
    { target: 0, actual: 0, pipeline: 0, closedWon: 0, closedLost: 0 }
  );
});

const maxValue = computed(() => {
  let max = 0;
  for (const f of forecasts.value) {
    max = Math.max(max, f.target || 0, f.actual || 0, f.pipeline || 0);
  }
  return max || 1;
});

const attainmentColor = computed(() => {
  const pct = totals.value.target > 0 ? (totals.value.actual / totals.value.target) * 100 : 0;
  if (pct >= 100) return '#22c55e';
  if (pct >= 70) return '#f59e0b';
  return '#ef4444';
});

const chartOption = computed(() => {
  const labels = forecasts.value.map(f => formatPeriodLabel(f));
  const tooltipStyle = {
    backgroundColor: 'rgba(30, 30, 45, 0.85)',
    borderColor: 'rgba(120, 73, 255, 0.3)',
    borderWidth: 1,
    padding: [12, 16],
    textStyle: { color: '#fff' },
    extraCssText: 'backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-radius: 16px;'
  };
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipStyle },
    legend: { data: ['Target', 'Actual', 'Pipeline'], textStyle: { color: '#94A3B8' }, bottom: 0 },
    grid: { top: 30, right: 30, bottom: 50, left: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#94A3B8', fontWeight: 500 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B', formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v }
    },
    series: [
      {
        name: 'Target',
        type: 'bar',
        barWidth: '20%',
        data: forecasts.value.map(f => f.target || 0),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#7849FF' },
            { offset: 1, color: 'rgba(120, 73, 255, 0.3)' }
          ])
        }
      },
      {
        name: 'Actual',
        type: 'bar',
        barWidth: '20%',
        data: forecasts.value.map(f => f.actual || 0),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#22c55e' },
            { offset: 1, color: 'rgba(34, 197, 94, 0.3)' }
          ])
        }
      },
      {
        name: 'Pipeline',
        type: 'bar',
        barWidth: '20%',
        data: forecasts.value.map(f => f.pipeline || 0),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.3)' }
          ])
        }
      }
    ]
  };
});

async function loadData() {
  loading.value = true;
  try {
    if (dateRange.value) {
      const [start, end] = dateRange.value;
      forecasts.value = await fetchForecastByPeriod(
        selectedPeriod.value,
        start.toISOString().split('T')[0] || '',
        end.toISOString().split('T')[0] || ''
      );
    } else {
      const response = await fetchForecasts({ period: selectedPeriod.value });
      forecasts.value = response.docs;
    }
  } catch (e) {
    console.error('Failed to load forecasts', e);
  } finally {
    loading.value = false;
  }
}

await loadData().catch(() => {
  loading.value = false;
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
}

function barHeight(value: number, max: number): number {
  return max > 0 ? Math.max((value / max) * 140, 4) : 4;
}

function formatPeriodLabel(forecast: ForecastPeriod): string {
  if (forecast.startDate) {
    return new Date(forecast.startDate!).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) || '';
  }
  return '';
}
</script>

<style lang="scss" scoped>
.forecasting-page {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
