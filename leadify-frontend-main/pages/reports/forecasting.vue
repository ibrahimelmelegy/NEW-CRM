<template lang="pug">
.forecasting-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('forecasting.title') }}
    p(style="color: var(--text-muted)") {{ $t('forecasting.subtitle') }}

  //- Controls
  .flex.items-center.gap-4.mb-8(class="flex-col md:flex-row flex-wrap")
    el-select(v-model="selectedPeriod" @change="loadData" style="width: 160px")
      el-option(:label="$t('forecasting.monthly')" value="monthly")
      el-option(:label="$t('forecasting.quarterly')" value="quarterly")
      el-option(:label="$t('forecasting.yearly')" value="yearly")
    el-date-picker(
      v-model="dateRange"
      type="daterange"
      range-separator="to"
      :start-placeholder="$t('forecasting.startDate')"
      :end-placeholder="$t('forecasting.endDate')"
      @change="loadData"
      style="width: 300px"
    )
    el-button(type="primary" @click="showHistorical = !showHistorical" plain)
      Icon(name="ph:chart-line-bold" size="18")
      span.ml-2 {{ showHistorical ? $t('forecasting.hideComparison') : $t('forecasting.viewComparison') }}
    el-button(type="success" @click="showScenario = !showScenario" plain)
      Icon(name="ph:lightbulb-bold" size="18")
      span.ml-2 {{ $t('forecasting.scenarioModeling') }}
    el-button(type="info" @click="showTeamBreakdown = !showTeamBreakdown" plain)
      Icon(name="ph:users-bold" size="18")
      span.ml-2 {{ showTeamBreakdown ? $t('forecasting.hideTeamBreakdown') : $t('forecasting.viewTeamBreakdown') }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- Summary Cards
    .grid.gap-4.mb-8(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
      .glass-card.p-5.text-center
        p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('forecasting.totalTarget') }}
        p.text-3xl.font-bold(style="color: #7849ff") {{ formatCurrency(totals.target) }}

      .glass-card.p-5.text-center
        p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('forecasting.actualRevenue') }}
        p.text-3xl.font-bold(style="color: #22c55e") {{ formatCurrency(totals.actual) }}

      .glass-card.p-5.text-center
        p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('forecasting.pipelineValue') }}
        p.text-3xl.font-bold(style="color: #3b82f6") {{ formatCurrency(totals.pipeline) }}

      .glass-card.p-5.text-center
        p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('forecasting.attainment') }}
        p.text-3xl.font-bold(:style="{ color: attainmentColor }") {{ totals.target > 0 ? Math.round((totals.actual / totals.target) * 100) : 0 }}%

    //- Historical Comparison (Collapsible)
    el-collapse-transition
      .glass-card.p-6.mb-8(v-if="showHistorical")
        h3.text-lg.font-bold.mb-4.flex.items-center.gap-2(style="color: var(--text-primary)")
          Icon(name="ph:chart-line-bold" size="20" style="color: #f59e0b")
          | {{ $t('forecasting.historicalComparison') }}
        .grid.gap-6(class="grid-cols-1 md:grid-cols-2" v-if="historicalData")
          div
            p.text-sm.font-semibold.mb-3.uppercase(style="color: var(--text-muted)") {{ $t('forecasting.currentPeriod') }}
            .space-y-2
              .flex.justify-between
                span {{ $t('forecasting.target') }}:
                span.font-bold(style="color: #7849ff") {{ formatCurrency(historicalData.current.totals.target) }}
              .flex.justify-between
                span {{ $t('forecasting.actual') }}:
                span.font-bold(style="color: #22c55e") {{ formatCurrency(historicalData.current.totals.actual) }}
              .flex.justify-between
                span {{ $t('forecasting.pipeline') }}:
                span.font-bold(style="color: #3b82f6") {{ formatCurrency(historicalData.current.totals.pipeline) }}
          div
            p.text-sm.font-semibold.mb-3.uppercase(style="color: var(--text-muted)") {{ $t('forecasting.previousPeriod') }}
            .space-y-2
              .flex.justify-between
                span {{ $t('forecasting.target') }}:
                span.font-bold {{ formatCurrency(historicalData.previous.totals.target) }}
              .flex.justify-between
                span {{ $t('forecasting.actual') }}:
                span.font-bold {{ formatCurrency(historicalData.previous.totals.actual) }}
              .flex.justify-between
                span {{ $t('forecasting.pipeline') }}:
                span.font-bold {{ formatCurrency(historicalData.previous.totals.pipeline) }}
          .col-span-full
            p.text-sm.font-semibold.mb-3.uppercase(style="color: var(--text-muted)") {{ $t('forecasting.growth') }}
            .grid.gap-3(class="grid-cols-3")
              .p-3.rounded-lg.text-center(style="background: rgba(120, 73, 255, 0.1);")
                p.text-xs(style="color: var(--text-muted)") {{ $t('forecasting.target') }}
                p.text-xl.font-bold(:style="{ color: historicalData.growth.target >= 0 ? '#22c55e' : '#ef4444' }") {{ historicalData.growth.target.toFixed(1) }}%
              .p-3.rounded-lg.text-center(style="background: rgba(34, 197, 94, 0.1);")
                p.text-xs(style="color: var(--text-muted)") {{ $t('forecasting.actual') }}
                p.text-xl.font-bold(:style="{ color: historicalData.growth.actual >= 0 ? '#22c55e' : '#ef4444' }") {{ historicalData.growth.actual.toFixed(1) }}%
              .p-3.rounded-lg.text-center(style="background: rgba(59, 130, 246, 0.1);")
                p.text-xs(style="color: var(--text-muted)") {{ $t('forecasting.pipeline') }}
                p.text-xl.font-bold(:style="{ color: historicalData.growth.pipeline >= 0 ? '#22c55e' : '#ef4444' }") {{ historicalData.growth.pipeline.toFixed(1) }}%
        .text-center.py-6(v-else)
          el-button(type="primary" @click="loadHistorical" :loading="loadingHistorical")
            | {{ $t('forecasting.viewComparison') }}

    //- Scenario Modeling (Collapsible)
    el-collapse-transition
      .glass-card.p-6.mb-8(v-if="showScenario")
        h3.text-lg.font-bold.mb-4.flex.items-center.gap-2(style="color: var(--text-primary)")
          Icon(name="ph:lightbulb-bold" size="20" style="color: #f59e0b")
          | {{ $t('forecasting.scenarioModeling') }}
        .grid.gap-6(class="grid-cols-1 md:grid-cols-2")
          div
            p.text-sm.font-semibold.mb-3 {{ $t('forecasting.adjustWinRate') }}
            el-slider(
              v-model="winRateAdjustment"
              :min="-50"
              :max="50"
              :step="5"
              :marks="{ '-50': '-50%', 0: '0%', 50: '+50%' }"
              show-input
            )
          div
            p.text-sm.font-semibold.mb-3 {{ $t('forecasting.adjustDealValue') }}
            el-slider(
              v-model="dealValueAdjustment"
              :min="-50"
              :max="50"
              :step="5"
              :marks="{ '-50': '-50%', 0: '0%', 50: '+50%' }"
              show-input
            )
        el-button.mt-4(type="primary" @click="runScenario" :loading="loadingScenario")
          | {{ $t('forecasting.runScenario') }}
        .mt-6(v-if="scenarioResults")
          p.text-sm.font-semibold.mb-3.uppercase(style="color: var(--text-muted)") {{ $t('forecasting.scenarioResults') }}
          .grid.gap-4(class="grid-cols-2 md:grid-cols-4")
            .p-3.rounded-lg.border(style="border-color: var(--border-default);")
              p.text-xs(style="color: var(--text-muted)") {{ $t('forecasting.baseWinRate') }}
              p.text-lg.font-bold {{ scenarioResults.baseWinRate.toFixed(1) }}%
            .p-3.rounded-lg.border(style="border-color: var(--border-default);")
              p.text-xs(style="color: var(--text-muted)") {{ $t('forecasting.adjustedWinRate') }}
              p.text-lg.font-bold(style="color: #7849ff") {{ scenarioResults.adjustedWinRate.toFixed(1) }}%
            .p-3.rounded-lg.border(style="border-color: var(--border-default);")
              p.text-xs(style="color: var(--text-muted)") {{ $t('forecasting.projectedRevenue') }}
              p.text-lg.font-bold(style="color: #22c55e") {{ formatCurrency(scenarioResults.projectedRevenue) }}
            .p-3.rounded-lg.border(style="border-color: var(--border-default);")
              p.text-xs(style="color: var(--text-muted)") {{ $t('forecasting.dealsInPipeline') }}
              p.text-lg.font-bold {{ scenarioResults.dealsInPipeline }}

    //- Team Breakdown (Collapsible)
    el-collapse-transition
      .glass-card.p-6.mb-8(v-if="showTeamBreakdown && teamData.length")
        h3.text-lg.font-bold.mb-4.flex.items-center.gap-2(style="color: var(--text-primary)")
          Icon(name="ph:users-bold" size="20" style="color: #3b82f6")
          | {{ $t('forecasting.teamBreakdown') }}
        el-table(:data="teamData" stripe style="width: 100%")
          el-table-column(prop="userId" :label="$t('forecasting.rep')" min-width="100")
          el-table-column(:label="$t('forecasting.target')" min-width="120")
            template(#default="scope")
              span {{ formatCurrency(scope.row.target) }}
          el-table-column(:label="$t('forecasting.actual')" min-width="120")
            template(#default="scope")
              span(style="color: #22c55e") {{ formatCurrency(scope.row.actual) }}
          el-table-column(:label="$t('forecasting.pipeline')" min-width="120")
            template(#default="scope")
              span(style="color: #3b82f6") {{ formatCurrency(scope.row.pipeline) }}
          el-table-column(:label="$t('forecasting.attainment')" min-width="120")
            template(#default="scope")
              el-progress(
                :percentage="scope.row.target > 0 ? Math.min(Math.round((scope.row.actual / scope.row.target) * 100), 100) : 0"
                :color="scope.row.actual >= scope.row.target ? '#22c55e' : '#f59e0b'"
              )

    //- ECharts Grouped Bar Chart
    .glass-card.p-6.mb-8
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('forecasting.revenueVsTarget') }}
      VChart.w-full(v-if="forecasts.length" :option="chartOption" :style="{ height: '350px' }" autoresize)
      .text-center.py-12(v-else)
        p.text-sm(style="color: var(--text-muted)") {{ $t('forecasting.noForecastData') }}

    //- Rep Table
    .glass-card.p-6
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('forecasting.byRepresentative') }}
      el-table(:data="forecasts" stripe style="width: 100%")
        el-table-column(prop="user.name" :label="$t('forecasting.rep')" min-width="150")
          template(#default="scope")
            span {{ scope.row.user?.name || 'Unknown' }}
        el-table-column(:label="$t('forecasting.target')" min-width="120")
          template(#default="scope")
            span {{ formatCurrency(scope.row.target) }}
        el-table-column(:label="$t('forecasting.actual')" min-width="120")
          template(#default="scope")
            span(style="color: #22c55e") {{ formatCurrency(scope.row.actual) }}
        el-table-column(:label="$t('forecasting.pipeline')" min-width="120")
          template(#default="scope")
            span(style="color: #3b82f6") {{ formatCurrency(scope.row.pipeline) }}
        el-table-column(:label="$t('forecasting.won')" min-width="100")
          template(#default="scope")
            span {{ formatCurrency(scope.row.closedWon) }}
        el-table-column(:label="$t('forecasting.lost')" min-width="100")
          template(#default="scope")
            span(style="color: #ef4444") {{ formatCurrency(scope.row.closedLost) }}
        el-table-column(:label="$t('forecasting.attainment')" min-width="120")
          template(#default="scope")
            el-progress(
              :percentage="scope.row.target > 0 ? Math.min(Math.round((scope.row.actual / scope.row.target) * 100), 100) : 0"
              :color="scope.row.actual >= scope.row.target ? '#22c55e' : '#f59e0b'"
            )
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { graphic } from 'echarts';
import VChart from 'vue-echarts';
import { fetchForecasts, fetchForecastByPeriod } from '~/composables/useForecasting';
import { useApiFetch } from '~/composables/useApiFetch';
import type { ForecastPeriod } from '~/composables/useForecasting';
import { ElMessage } from 'element-plus';

definePageMeta({ title: 'Sales Forecasting' });

const loading = ref(true);
const selectedPeriod = ref('monthly');
const dateRange = ref<[Date, Date] | null>(null);
const forecasts = ref<ForecastPeriod[]>([]);

const showHistorical = ref(false);
const loadingHistorical = ref(false);
const historicalData = ref<any>(null);

const showScenario = ref(false);
const loadingScenario = ref(false);
const winRateAdjustment = ref(0);
const dealValueAdjustment = ref(0);
const scenarioResults = ref<any>(null);

const showTeamBreakdown = ref(false);
const teamData = ref<any[]>([]);

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

    // Auto-load team breakdown if showing
    if (showTeamBreakdown.value && dateRange.value) {
      await loadTeamBreakdown();
    }
  } catch (e) {
    console.error('Failed to load forecasts', e);
    ElMessage.error('Failed to load forecasts');
  } finally {
    loading.value = false;
  }
}

async function loadHistorical() {
  if (!dateRange.value) {
    ElMessage.warning('Please select a date range first');
    return;
  }

  loadingHistorical.value = true;
  try {
    const [start, end] = dateRange.value;
    const qs = `?period=${selectedPeriod.value}&startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`;
    const { body, success } = await useApiFetch(`forecasting/historical-comparison${qs}`);
    if (success && body) {
      historicalData.value = body;
    }
  } catch (e) {
    console.error('Failed to load historical comparison', e);
    ElMessage.error('Failed to load historical comparison');
  } finally {
    loadingHistorical.value = false;
  }
}

async function runScenario() {
  loadingScenario.value = true;
  try {
    const { body, success } = await useApiFetch('forecasting/scenario', 'POST', {
      winRateAdjustment: winRateAdjustment.value,
      dealValueAdjustment: dealValueAdjustment.value
    });
    if (success && body) {
      scenarioResults.value = body;
    }
  } catch (e) {
    console.error('Failed to run scenario', e);
    ElMessage.error('Failed to run scenario');
  } finally {
    loadingScenario.value = false;
  }
}

async function loadTeamBreakdown() {
  if (!dateRange.value) return;

  try {
    const [start, end] = dateRange.value;
    const qs = `?period=${selectedPeriod.value}&startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`;
    const { body, success } = await useApiFetch(`forecasting/team-breakdown${qs}`);
    if (success && body) {
      teamData.value = body as any[];
    }
  } catch (e) {
    console.error('Failed to load team breakdown', e);
  }
}

await loadData().catch(() => {
  loading.value = false;
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
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

.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
}
</style>
