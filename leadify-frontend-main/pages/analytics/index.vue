<template lang="pug">
div
  ModuleHeader(
    :title="$t('analyticsPage.title')"
    :subtitle="$t('analyticsPage.subtitle')"
  )
    template(#actions)
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        size="large"
        :start-placeholder="$t('analyticsPage.startDate')"
        :end-placeholder="$t('analyticsPage.endDate')"
        class="!rounded-2xl"
        @change="loadAllData"
        value-format="YYYY-MM-DD"
      )
      el-button(size="large" type="primary" @click="loadAllData" :loading="loading" class="!rounded-2xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-1 {{ $t('analyticsPage.refresh') }}

  //- KPI Stat Cards
  StatCards(:stats="kpiStats" :columns="5")

  //- Charts Grid
  .grid.grid-cols-1.gap-6.mt-2(class="lg:grid-cols-2")

    //- Pipeline by Stage
    .glass-card.p-6.animate-entrance
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('analyticsPage.pipelineByStage') }}
      .chart-container(v-loading="loadingPipeline")
        ClientOnly
          VChart(v-if="pipelineOption" :option="pipelineOption" autoresize style="height: 300px")
        .text-center.py-8(v-if="!pipelineOption && !loadingPipeline")
          Icon(name="ph:chart-bar" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

    //- Revenue Trend
    .glass-card.p-6.animate-entrance(style="animation-delay: 0.05s")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('analyticsPage.revenueTrend') }}
      .chart-container(v-loading="loadingRevenue")
        ClientOnly
          VChart(v-if="revenueOption" :option="revenueOption" autoresize style="height: 300px")
        .text-center.py-8(v-if="!revenueOption && !loadingRevenue")
          Icon(name="ph:chart-line-up" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

    //- Lead Sources
    .glass-card.p-6.animate-entrance(style="animation-delay: 0.1s")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('analyticsPage.leadSources') }}
      .chart-container(v-loading="loadingLeadSources")
        ClientOnly
          VChart(v-if="leadSourcesOption" :option="leadSourcesOption" autoresize style="height: 300px")
        .text-center.py-8(v-if="!leadSourcesOption && !loadingLeadSources")
          Icon(name="ph:chart-pie-slice" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

    //- Conversion Funnel
    .glass-card.p-6.animate-entrance(style="animation-delay: 0.15s")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('analyticsPage.conversionFunnel') }}
      .chart-container(v-loading="loadingFunnel")
        ClientOnly
          VChart(v-if="funnelOption" :option="funnelOption" autoresize style="height: 300px")
        .text-center.py-8(v-if="!funnelOption && !loadingFunnel")
          Icon(name="ph:funnel" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

    //- Win/Loss Ratio
    .glass-card.p-6.animate-entrance(style="animation-delay: 0.2s")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('analyticsPage.winLossRatio') }}
      .chart-container(v-loading="loadingWinLoss")
        ClientOnly
          VChart(v-if="winLossOption" :option="winLossOption" autoresize style="height: 300px")
        .text-center.py-8(v-if="!winLossOption && !loadingWinLoss")
          Icon(name="ph:scales" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

    //- Average Deal Size Trend
    .glass-card.p-6.animate-entrance(style="animation-delay: 0.25s")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('analyticsPage.avgDealSize') }}
      .chart-container(v-loading="loadingDealSize")
        ClientOnly
          VChart(v-if="dealSizeOption" :option="dealSizeOption" autoresize style="height: 300px")
        .text-center.py-8(v-if="!dealSizeOption && !loadingDealSize")
          Icon(name="ph:chart-line" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

  //- Team Performance Table
  .glass-card.p-6.mt-6.animate-entrance(style="animation-delay: 0.3s")
    h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('analyticsPage.teamPerformance') }}
    el-table(:data="teamData" v-loading="loadingTeam" style="width: 100%")
      el-table-column(:label="$t('analyticsPage.member')" min-width="200")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .w-9.h-9.rounded-full.flex.items-center.justify-center.text-white.text-sm.font-bold(style="background: linear-gradient(135deg, #7849ff, #a78bfa)") {{ getInitials(row.name) }}
            div
              p.font-bold(style="color: var(--text-primary)") {{ row.name }}
              p.text-xs(style="color: var(--text-muted)") {{ row.role || '' }}
      el-table-column(:label="$t('analyticsPage.leadsAssigned')" prop="leadsAssigned" width="140" sortable)
      el-table-column(:label="$t('analyticsPage.dealsWon')" prop="dealsWon" width="120" sortable)
      el-table-column(:label="$t('analyticsPage.revenue')" width="160" sortable)
        template(#default="{ row }")
          span.font-bold(style="color: #10B981") SAR {{ formatLargeNumber(row.revenue || 0) }}
      el-table-column(:label="$t('analyticsPage.convRate')" width="140" sortable)
        template(#default="{ row }")
          el-tag(size="small" :type="(row.conversionRate || 0) >= 30 ? 'success' : 'warning'" effect="plain" round) {{ (row.conversionRate || 0).toFixed(1) }}%
      el-table-column(:label="$t('analyticsPage.avgDealValue')" width="160" sortable)
        template(#default="{ row }")
          span SAR {{ formatLargeNumber(row.avgDealValue || 0) }}
      template(#empty)
        el-empty(:description="$t('common.noData')")
</template>

<script setup lang="ts">
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart, FunnelChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { graphic } from 'echarts';
import {
  getBarChartData, getPieChartsData, getIncreaseLineChart
} from '~/composables/charts';
import {
  fetchPipelineData, fetchRevenueChart, fetchTeamPerformance
} from '~/composables/useDashboard';

use([CanvasRenderer, BarChart, LineChart, PieChart, FunnelChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const dateRange = ref<string[] | null>(null);
const loadingPipeline = ref(false);
const loadingRevenue = ref(false);
const loadingLeadSources = ref(false);
const loadingFunnel = ref(false);
const loadingWinLoss = ref(false);
const loadingDealSize = ref(false);
const loadingTeam = ref(false);

const summaryData = ref<any>(null);
const pipelineOption = ref<any>(null);
const revenueOption = ref<any>(null);
const leadSourcesOption = ref<any>(null);
const funnelOption = ref<any>(null);
const winLossOption = ref<any>(null);
const dealSizeOption = ref<any>(null);
const teamData = ref<any[]>([]);

const COLORS = ['#7849FF', '#3B82F6', '#10B981', '#F97316', '#EF4444', '#A855F7', '#06B6D4', '#EC4899'];

// KPI Cards
const kpiStats = computed(() => [
  {
    label: t('analyticsPage.totalLeads'),
    value: summaryData.value?.totalLeads ?? 0,
    icon: 'ph:users-bold',
    color: '#3B82F6'
  },
  {
    label: t('analyticsPage.totalDeals'),
    value: summaryData.value?.totalDeals ?? 0,
    icon: 'ph:handshake-bold',
    color: '#7849FF'
  },
  {
    label: t('analyticsPage.totalRevenue'),
    value: summaryData.value?.totalRevenue ? `SAR ${formatLargeNumber(summaryData.value.totalRevenue)}` : 'SAR 0',
    icon: 'ph:currency-circle-dollar-bold',
    color: '#10B981'
  },
  {
    label: t('analyticsPage.winRate'),
    value: summaryData.value?.winRate ? `${summaryData.value.winRate.toFixed(1)}%` : '0%',
    icon: 'ph:trophy-bold',
    color: '#F97316'
  },
  {
    label: t('analyticsPage.avgDealCycle'),
    value: summaryData.value?.avgDealCycle ? `${summaryData.value.avgDealCycle}d` : '--',
    icon: 'ph:clock-bold',
    color: '#A855F7'
  }
]);

function getDateRangeParams() {
  if (dateRange.value && dateRange.value.length === 2) {
    return { start: dateRange.value[0], end: dateRange.value[1] };
  }
  return undefined;
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

async function loadSummary() {
  try {
    const qs = dateRange.value ? `?startDate=${dateRange.value[0]}&endDate=${dateRange.value[1]}` : '';
    const { body, success } = await useApiFetch(`dashboards/analytics-summary${qs}`);
    if (success && body) summaryData.value = body;
  } catch {}
}

async function loadPipeline() {
  loadingPipeline.value = true;
  try {
    const data = await fetchPipelineData(getDateRangeParams());
    if (data?.stages?.length) {
      const chartData = data.stages.map((s: any) => ({ name: s.name || s.stage, value: s.count || s.value || 0 }));
      pipelineOption.value = getBarChartData(chartData, COLORS);
    } else {
      pipelineOption.value = null;
    }
  } finally {
    loadingPipeline.value = false;
  }
}

async function loadRevenue() {
  loadingRevenue.value = true;
  try {
    const data = await fetchRevenueChart('monthly', getDateRangeParams());
    if (data?.data?.length) {
      const chartData = data.data.map((d: any) => ({ name: d.label || d.month, value: d.value || d.revenue || 0 }));
      revenueOption.value = getIncreaseLineChart(chartData, ['#10B981']);
    } else {
      revenueOption.value = null;
    }
  } finally {
    loadingRevenue.value = false;
  }
}

async function loadLeadSources() {
  loadingLeadSources.value = true;
  try {
    const qs = dateRange.value ? `?startDate=${dateRange.value[0]}&endDate=${dateRange.value[1]}` : '';
    const { body, success } = await useApiFetch(`dashboards/lead-sources${qs}`);
    if (success && body && Array.isArray(body) && body.length) {
      const pieData = body.map((s: any) => ({ name: s.source || s.name, value: s.count || s.value || 0 }));
      leadSourcesOption.value = getPieChartsData(pieData, COLORS, '5%');
    } else {
      leadSourcesOption.value = null;
    }
  } finally {
    loadingLeadSources.value = false;
  }
}

async function loadFunnel() {
  loadingFunnel.value = true;
  try {
    const qs = dateRange.value ? `?startDate=${dateRange.value[0]}&endDate=${dateRange.value[1]}` : '';
    const { body, success } = await useApiFetch(`dashboards/conversion-funnel${qs}`);
    if (success && body && Array.isArray(body) && body.length) {
      funnelOption.value = {
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        color: COLORS,
        series: [{
          type: 'funnel',
          left: '10%',
          top: 20,
          bottom: 20,
          width: '80%',
          min: 0,
          max: Math.max(...body.map((b: any) => b.value || 0)) || 100,
          minSize: '10%',
          maxSize: '100%',
          sort: 'descending',
          gap: 4,
          label: { show: true, position: 'inside', formatter: '{b}\n{c}', color: '#fff', fontSize: 12 },
          itemStyle: { borderColor: 'transparent', borderWidth: 1, borderRadius: 4 },
          emphasis: { label: { fontSize: 16, fontWeight: 'bold' } },
          data: body.map((b: any) => ({ name: b.name || b.stage, value: b.value || b.count || 0 }))
        }]
      };
    } else {
      funnelOption.value = null;
    }
  } finally {
    loadingFunnel.value = false;
  }
}

async function loadWinLoss() {
  loadingWinLoss.value = true;
  try {
    const qs = dateRange.value ? `?startDate=${dateRange.value[0]}&endDate=${dateRange.value[1]}` : '';
    const { body, success } = await useApiFetch(`dashboards/win-loss${qs}`);
    if (success && body) {
      const data = Array.isArray(body) ? body : [
        { name: t('analyticsPage.won'), value: body.won || 0 },
        { name: t('analyticsPage.lost'), value: body.lost || 0 }
      ];
      winLossOption.value = getPieChartsData(data, ['#10B981', '#EF4444'], '5%');
    } else {
      winLossOption.value = null;
    }
  } finally {
    loadingWinLoss.value = false;
  }
}

async function loadDealSize() {
  loadingDealSize.value = true;
  try {
    const qs = dateRange.value ? `?startDate=${dateRange.value[0]}&endDate=${dateRange.value[1]}` : '';
    const { body, success } = await useApiFetch(`dashboards/avg-deal-size${qs}`);
    if (success && body && Array.isArray(body) && body.length) {
      const chartData = body.map((d: any) => ({ name: d.month || d.label, value: d.avgValue || d.value || 0 }));
      dealSizeOption.value = getIncreaseLineChart(chartData, ['#A855F7']);
    } else {
      dealSizeOption.value = null;
    }
  } finally {
    loadingDealSize.value = false;
  }
}

async function loadTeamPerformance() {
  loadingTeam.value = true;
  try {
    const data = await fetchTeamPerformance(getDateRangeParams());
    teamData.value = data?.members || data || [];
  } finally {
    loadingTeam.value = false;
  }
}

async function loadAllData() {
  loading.value = true;
  try {
    await Promise.all([
      loadSummary(),
      loadPipeline(),
      loadRevenue(),
      loadLeadSources(),
      loadFunnel(),
      loadWinLoss(),
      loadDealSize(),
      loadTeamPerformance()
    ]);
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadAllData());
</script>

<style lang="scss" scoped>
.chart-container {
  min-height: 200px;
}
</style>
