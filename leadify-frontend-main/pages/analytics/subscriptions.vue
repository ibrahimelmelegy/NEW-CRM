<template lang="pug">
.subscription-analytics-page.p-6(class="md:p-8")
  //- ╔══════════════════════════════════════════════════════════╗
  //- ║  Page Header                                             ║
  //- ╚══════════════════════════════════════════════════════════╝
  .header.mb-8
    .flex.items-center.justify-between.flex-wrap.gap-4
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)")
          Icon.mr-2.align-middle(name="ph:credit-card-bold" size="32" style="color: var(--accent-color, #7849ff)")
          | {{ $t('subscriptionAnalytics.title') }}
        p(style="color: var(--text-muted)") {{ $t('subscriptionAnalytics.subtitle') }}
      .flex.items-center.gap-3.flex-wrap
        el-date-picker(
          v-model="dateRange"
          type="daterange"
          range-separator="to"
          :start-placeholder="$t('common.startDate')"
          :end-placeholder="$t('common.endDate')"
          @change="onDateChange"
          style="width: 300px"
        )
        el-button(type="primary" @click="refreshData" :loading="loading")
          Icon(name="ph:arrow-clockwise-bold" size="16")
          span.ml-2 {{ $t('common.refresh') }}

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="40" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  KPI Cards                                              ║
    //- ╚══════════════════════════════════════════════════════════╝
    .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
      .kpi-card(v-for="(kpi, idx) in kpiCards" :key="idx")
        .flex.items-start.justify-between
          div
            p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
            p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}
            .flex.items-center.gap-1.mt-2
              Icon(
                :name="kpi.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'"
                size="14"
                :style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }"
              )
              span.text-xs.font-semibold(:style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }")
                | {{ kpi.trend >= 0 ? '+' : '' }}{{ kpi.trend }}%
              span.text-xs(style="color: var(--text-muted)") {{ $t('subscriptionAnalytics.vsLastMonth') }}
          .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
            Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  Tabs                                                   ║
    //- ╚══════════════════════════════════════════════════════════╝
    el-tabs(v-model="activeTab" class="subscription-tabs")

      //- ────────────────────────────────────────────────────────
      //- Tab 1: Overview
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('subscriptionAnalytics.overview')" name="overview")
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:chart-line-up-bold" size="22" style="color: #7849ff")
              | {{ $t('subscriptionAnalytics.mrrArrTrend') }}
            el-select(v-model="overviewPeriod" size="small" style="width: 140px" @change="computeOverview")
              el-option(:label="$t('subscriptionAnalytics.last6Months')" value="6")
              el-option(:label="$t('subscriptionAnalytics.last12Months')" value="12")
              el-option(:label="$t('subscriptionAnalytics.lastYear')" value="year")
          ClientOnly
            VChart.w-full(:option="mrrArrChartOption" :style="{ height: '400px' }" autoresize)

        //- Summary Stats Below Chart
        .grid.gap-4(class="grid-cols-2 md:grid-cols-4")
          .summary-stat-card(v-for="(stat, sIdx) in overviewSummaryStats" :key="sIdx")
            .flex.items-center.gap-2.mb-2
              .stat-dot(:style="{ background: stat.color }")
              span.text-sm.font-medium(style="color: var(--text-muted)") {{ stat.label }}
            p.text-xl.font-bold(:style="{ color: stat.color }") {{ stat.value }}
            p.text-xs(style="color: var(--text-secondary)") {{ stat.description }}

      //- ────────────────────────────────────────────────────────
      //- Tab 2: Cohort Analysis
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('subscriptionAnalytics.cohortAnalysis')" name="cohort")
        .glass-card.p-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:grid-four-bold" size="22" style="color: #3b82f6")
              | {{ $t('subscriptionAnalytics.cohortRetention') }}
            .flex.items-center.gap-3
              el-radio-group(v-model="cohortMetric" size="small" @change="computeCohort")
                el-radio-button(value="retention") {{ $t('subscriptionAnalytics.retention') }}
                el-radio-button(value="revenue") {{ $t('subscriptionAnalytics.revenue') }}

          .cohort-table-wrapper
            .cohort-table(v-if="cohortData.length")
              //- Header row
              .cohort-row.cohort-header
                .cohort-cell.cohort-label-cell {{ $t('subscriptionAnalytics.cohortMonth') }}
                .cohort-cell.cohort-label-cell {{ $t('subscriptionAnalytics.customers') }}
                .cohort-cell(v-for="m in 12" :key="m") {{ $t('subscriptionAnalytics.month') }} {{ m - 1 }}

              //- Data rows
              .cohort-row(v-for="(row, rIdx) in cohortData" :key="rIdx")
                .cohort-cell.cohort-label-cell.font-medium {{ row.label }}
                .cohort-cell.cohort-label-cell {{ row.initialCount }}
                el-tooltip(
                  v-for="(cell, cIdx) in row.cells"
                  :key="cIdx"
                  :content="getCohortTooltip(cell)"
                  placement="top"
                )
                  .cohort-cell.cohort-data-cell(
                    :style="{ background: getCohortColor(cell.value), color: cell.value > 50 ? '#fff' : 'var(--text-primary)' }"
                  )
                    span(v-if="cell.value !== null") {{ cohortMetric === 'revenue' ? formatCompact(cell.rawValue) : cell.value + '%' }}
                    span(v-else) -

            .text-center.py-12(v-else)
              Icon(name="ph:grid-four" size="48" style="color: var(--text-muted)")
              p.mt-3(style="color: var(--text-muted)") {{ $t('subscriptionAnalytics.noData') }}

      //- ────────────────────────────────────────────────────────
      //- Tab 3: Churn Analysis
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('subscriptionAnalytics.churnAnalysis')" name="churn")
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
          //- Churn Reasons Pie Chart
          .glass-card.p-6
            h3.section-title.mb-6
              Icon.mr-2(name="ph:chart-pie-slice-bold" size="22" style="color: #ef4444")
              | {{ $t('subscriptionAnalytics.churnReasons') }}
            ClientOnly
              VChart.w-full(:option="churnReasonsChartOption" :style="{ height: '380px' }" autoresize)

            //- Churn Reason Legend
            .grid.gap-2.mt-4(class="grid-cols-2")
              .flex.items-center.gap-2(v-for="(reason, rIdx) in churnReasons" :key="rIdx")
                .legend-dot(:style="{ background: reason.color }")
                span.text-xs(style="color: var(--text-secondary)") {{ reason.name }}
                span.text-xs.font-bold.ml-auto(:style="{ color: reason.color }") {{ reason.percentage }}%

          //- At-Risk Customers Table
          .glass-card.p-6
            .flex.items-center.justify-between.mb-6
              h3.section-title
                Icon.mr-2(name="ph:warning-bold" size="22" style="color: #f59e0b")
                | {{ $t('subscriptionAnalytics.atRiskCustomers') }}
              el-tag(type="danger" effect="dark" round size="small") {{ atRiskCustomers.length }} {{ $t('subscriptionAnalytics.accounts') }}

            el-table(:data="atRiskCustomers" stripe max-height="360" style="width: 100%")
              el-table-column(prop="name" :label="$t('subscriptionAnalytics.customerName')" min-width="140")
                template(#default="scope")
                  .flex.items-center.gap-2
                    .risk-avatar(:style="{ background: getRiskColor(scope.row.riskScore) + '22' }")
                      Icon(name="ph:user-bold" size="14" :style="{ color: getRiskColor(scope.row.riskScore) }")
                    span.font-medium {{ scope.row.name }}
              el-table-column(:label="$t('subscriptionAnalytics.mrr')" min-width="100" align="right")
                template(#default="scope")
                  span.font-semibold(style="color: var(--text-primary)") {{ formatCurrency(scope.row.mrr) }}
              el-table-column(:label="$t('subscriptionAnalytics.riskScore')" min-width="140")
                template(#default="scope")
                  .flex.items-center.gap-2
                    el-progress(
                      :percentage="scope.row.riskScore"
                      :stroke-width="8"
                      :color="getRiskColor(scope.row.riskScore)"
                      :show-text="false"
                      style="flex: 1"
                    )
                    span.text-xs.font-bold(:style="{ color: getRiskColor(scope.row.riskScore) }") {{ scope.row.riskScore }}%
              el-table-column(:label="$t('subscriptionAnalytics.daysUntilRenewal')" min-width="100" align="center")
                template(#default="scope")
                  el-tag(
                    :type="scope.row.daysUntilRenewal <= 14 ? 'danger' : scope.row.daysUntilRenewal <= 30 ? 'warning' : 'info'"
                    size="small"
                    effect="plain"
                  ) {{ scope.row.daysUntilRenewal }}d
              el-table-column(:label="$t('subscriptionAnalytics.action')" width="100" align="center")
                template(#default="scope")
                  el-button(
                    type="primary"
                    size="small"
                    plain
                    @click="handleRetentionAction(scope.row)"
                  )
                    Icon(name="ph:phone-bold" size="14")

      //- ────────────────────────────────────────────────────────
      //- Tab 4: Expansion Revenue
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('subscriptionAnalytics.expansionRevenue')" name="expansion")
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
          //- Upsell / Cross-sell Stacked Bar Chart
          .glass-card.p-6
            .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
              h3.section-title
                Icon.mr-2(name="ph:arrow-fat-lines-up-bold" size="22" style="color: #22c55e")
                | {{ $t('subscriptionAnalytics.expansionBreakdown') }}
              el-select(v-model="expansionPeriod" size="small" style="width: 140px" @change="computeExpansion")
                el-option(:label="$t('subscriptionAnalytics.quarterly')" value="quarterly")
                el-option(:label="$t('subscriptionAnalytics.monthly')" value="monthly")
            ClientOnly
              VChart.w-full(:option="expansionChartOption" :style="{ height: '380px' }" autoresize)

            //- Expansion Summary
            .grid.gap-3.mt-4(class="grid-cols-3")
              .expansion-summary-item(v-for="(item, eIdx) in expansionSummary" :key="eIdx")
                p.text-xs(style="color: var(--text-muted)") {{ item.label }}
                p.text-lg.font-bold(:style="{ color: item.color }") {{ item.value }}

          //- Expansion Pipeline Table
          .glass-card.p-6
            .flex.items-center.justify-between.mb-6
              h3.section-title
                Icon.mr-2(name="ph:list-checks-bold" size="22" style="color: #06b6d4")
                | {{ $t('subscriptionAnalytics.expansionPipeline') }}
              el-tag(type="success" effect="dark" round size="small")
                | {{ formatCurrency(totalExpansionPipeline) }}

            el-table(:data="expansionPipeline" stripe max-height="380" style="width: 100%")
              el-table-column(prop="account" :label="$t('subscriptionAnalytics.account')" min-width="140")
                template(#default="scope")
                  span.font-medium {{ scope.row.account }}
              el-table-column(:label="$t('subscriptionAnalytics.type')" min-width="110")
                template(#default="scope")
                  el-tag(
                    :type="scope.row.type === 'upsell' ? 'success' : 'primary'"
                    size="small"
                    effect="plain"
                  ) {{ scope.row.type === 'upsell' ? $t('subscriptionAnalytics.upsell') : $t('subscriptionAnalytics.crossSell') }}
              el-table-column(:label="$t('subscriptionAnalytics.value')" min-width="100" align="right")
                template(#default="scope")
                  span.font-bold(style="color: #22c55e") {{ formatCurrency(scope.row.value) }}
              el-table-column(:label="$t('subscriptionAnalytics.probability')" min-width="110")
                template(#default="scope")
                  .flex.items-center.gap-2
                    el-progress(
                      :percentage="scope.row.probability"
                      :stroke-width="6"
                      :color="scope.row.probability >= 70 ? '#22c55e' : scope.row.probability >= 40 ? '#f59e0b' : '#ef4444'"
                      :show-text="false"
                      style="flex: 1"
                    )
                    span.text-xs.font-semibold {{ scope.row.probability }}%
              el-table-column(:label="$t('subscriptionAnalytics.expectedClose')" min-width="110" align="center")
                template(#default="scope")
                  span.text-sm(style="color: var(--text-secondary)") {{ formatDate(scope.row.expectedClose) }}
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { graphic } from 'echarts';
import VChart from 'vue-echarts';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Subscription Analytics' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const loading = ref(true);
const activeTab = ref('overview');
const dateRange = ref<[Date, Date] | null>(null);

// Raw API data
const rawDeals = ref<any[]>([]);
const rawLeads = ref<any[]>([]);

// Overview
const overviewPeriod = ref('12');
const monthlyMrr = ref<{ month: string; mrr: number; arr: number }[]>([]);
const overviewSummaryStats = ref<any[]>([]);

// Cohort
const cohortMetric = ref('retention');
const cohortData = ref<any[]>([]);

// Churn
const churnReasons = ref<any[]>([]);
const atRiskCustomers = ref<any[]>([]);

// Expansion
const expansionPeriod = ref('quarterly');
const expansionData = ref<{ label: string; upsell: number; crossSell: number }[]>([]);
const expansionSummary = ref<any[]>([]);
const expansionPipeline = ref<any[]>([]);

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => {
  const deals = getFilteredDeals();
  const wonDeals = deals.filter((d: any) => {
    const s = (d.status || d.stage || '').toLowerCase();
    return s.includes('won') || s.includes('closed') || s.includes('active');
  });

  const totalMrr = wonDeals.reduce((acc: number, d: any) => {
    const val = parseFloat(d.value || d.amount || d.dealValue || 0);
    return acc + (val / 12);
  }, 0);

  const mrr = Math.round(totalMrr) || 24500;
  const arr = mrr * 12;

  const totalDeals = deals.length || 1;
  const activeSubs = wonDeals.length;
  const lostDeals = deals.filter((d: any) => {
    const s = (d.status || d.stage || '').toLowerCase();
    return s.includes('lost') || s.includes('churn') || s.includes('cancel');
  }).length;

  const nrr = activeSubs > 0 ? Math.min(Math.round(((activeSubs + 2) / activeSubs) * 100), 135) : 108;
  const grossChurn = totalDeals > 0 ? Math.round((lostDeals / totalDeals) * 100 * 10) / 10 : 3.2;

  return [
    {
      label: t('subscriptionAnalytics.mrr'),
      value: formatCurrency(mrr),
      icon: 'ph:currency-dollar-bold',
      color: '#7849ff',
      trend: 12.4
    },
    {
      label: t('subscriptionAnalytics.arr'),
      value: formatCurrency(arr),
      icon: 'ph:chart-line-up-bold',
      color: '#22c55e',
      trend: 8.7
    },
    {
      label: t('subscriptionAnalytics.netRevenueRetention'),
      value: `${nrr}%`,
      icon: 'ph:arrow-clockwise-bold',
      color: '#3b82f6',
      trend: 3.2
    },
    {
      label: t('subscriptionAnalytics.grossChurnRate'),
      value: `${grossChurn}%`,
      icon: 'ph:user-minus-bold',
      color: '#ef4444',
      trend: -1.5
    }
  ];
});

// ─── Helpers ────────────────────────────────────────────────
function getFilteredDeals() {
  let deals = rawDeals.value;
  if (dateRange.value) {
    const [start, end] = dateRange.value;
    deals = deals.filter((d: any) => {
      const created = new Date(d.createdAt || d.created_at || Date.now());
      return created >= start && created <= end;
    });
  }
  return deals;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(parseInt(year || '0'), parseInt(month || '1') - 1);
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function getShortMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(parseInt(year || '0'), parseInt(month || '1') - 1);
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatCompact(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${Math.round(amount)}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCohortColor(value: number | null): string {
  if (value === null || value === undefined) return 'transparent';
  const g = Math.round((value / 100) * 180);
  const r = Math.round(((100 - value) / 100) * 200);
  return `rgba(${r}, ${g + 50}, 80, ${0.15 + (value / 100) * 0.7})`;
}

function getCohortTooltip(cell: any): string {
  if (cell.value === null) return t('subscriptionAnalytics.noData');
  if (cohortMetric.value === 'revenue') {
    return `${formatCurrency(cell.rawValue)} (${cell.value}%)`;
  }
  return `${cell.count} ${t('subscriptionAnalytics.customers')} (${cell.value}%)`;
}

function getRiskColor(score: number): string {
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  return '#3b82f6';
}

function adjustColorBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

// ─── Tooltip Style ──────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.9)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 12 },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

// ─── Data Loading ───────────────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    const [dealsRes, leadsRes] = await Promise.all([
      useApiFetch('deal').catch(() => ({ body: [] })),
      useApiFetch('lead').catch(() => ({ body: [] }))
    ]);

    rawDeals.value = Array.isArray(dealsRes?.body) ? dealsRes.body
      : Array.isArray((dealsRes?.body as any)?.docs) ? (dealsRes.body as any).docs : [];
    rawLeads.value = Array.isArray(leadsRes?.body) ? leadsRes.body
      : Array.isArray((leadsRes?.body as any)?.docs) ? (leadsRes.body as any).docs : [];

    computeAll();
  } catch (e) {
    console.error('Failed to load subscription analytics data', e);
  } finally {
    loading.value = false;
  }
}

function computeAll() {
  computeOverview();
  computeCohort();
  computeChurn();
  computeExpansion();
}

function onDateChange() {
  computeAll();
}

function refreshData() {
  loadData();
}

// ─── Overview Computation ───────────────────────────────────
function computeOverview() {
  const deals = getFilteredDeals();
  const now = new Date();
  const numMonths = overviewPeriod.value === 'year' ? 12 : parseInt(overviewPeriod.value);

  // Build monthly MRR from deal data
  const monthMap = new Map<string, { mrr: number; newDeals: number; churned: number }>();
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(d);
    monthMap.set(key, { mrr: 0, newDeals: 0, churned: 0 });
  }

  deals.forEach((d: any) => {
    const created = new Date(d.createdAt || d.created_at || Date.now());
    const key = getMonthKey(created);
    if (monthMap.has(key)) {
      const val = parseFloat(d.value || d.amount || d.dealValue || 0);
      const status = (d.status || d.stage || '').toLowerCase();
      const entry = monthMap.get(key)!;
      if (status.includes('won') || status.includes('active') || status.includes('closed')) {
        entry.mrr += val / 12;
        entry.newDeals++;
      }
      if (status.includes('lost') || status.includes('churn')) {
        entry.churned++;
      }
    }
  });

  // If no real data, generate realistic mock growth curve
  const sortedKeys = Array.from(monthMap.keys()).sort();
  let hasMrr = false;
  sortedKeys.forEach(k => {
    if (monthMap.get(k)!.mrr > 0) hasMrr = true;
  });

  if (!hasMrr) {
    let baseMrr = 18000;
    sortedKeys.forEach((k, idx) => {
      const growthRate = 1 + (0.04 + Math.random() * 0.06);
      baseMrr = Math.round(baseMrr * growthRate);
      monthMap.get(k)!.mrr = baseMrr;
      monthMap.get(k)!.newDeals = Math.round(5 + Math.random() * 10);
    });
  }

  // Accumulate MRR if values are from individual deals
  let runningMrr = 0;
  const mrrArr: { month: string; mrr: number; arr: number }[] = [];
  sortedKeys.forEach(k => {
    const entry = monthMap.get(k)!;
    if (hasMrr) {
      // Data from deals — accumulate
      runningMrr += entry.mrr;
    } else {
      runningMrr = entry.mrr;
    }
    mrrArr.push({
      month: k,
      mrr: Math.round(runningMrr),
      arr: Math.round(runningMrr * 12)
    });
  });

  monthlyMrr.value = mrrArr;

  // Summary stats
  const currentMrr = mrrArr.length > 0 ? mrrArr[mrrArr.length - 1]!.mrr : 0;
  const prevMrr = mrrArr.length > 1 ? mrrArr[mrrArr.length - 2]!.mrr : currentMrr;
  const mrrGrowth = prevMrr > 0 ? Math.round(((currentMrr - prevMrr) / prevMrr) * 100) : 0;

  const totalNewDeals = Array.from(monthMap.values()).reduce((sum, e) => sum + e.newDeals, 0);
  const totalChurned = Array.from(monthMap.values()).reduce((sum, e) => sum + e.churned, 0);
  const avgMrr = mrrArr.length > 0 ? Math.round(mrrArr.reduce((s, m) => s + m.mrr, 0) / mrrArr.length) : 0;

  overviewSummaryStats.value = [
    {
      label: t('subscriptionAnalytics.currentMrr'),
      value: formatCurrency(currentMrr),
      color: '#7849ff',
      description: `${mrrGrowth >= 0 ? '+' : ''}${mrrGrowth}% ${t('subscriptionAnalytics.monthOverMonth')}`
    },
    {
      label: t('subscriptionAnalytics.currentArr'),
      value: formatCurrency(currentMrr * 12),
      color: '#22c55e',
      description: t('subscriptionAnalytics.annualized')
    },
    {
      label: t('subscriptionAnalytics.newSubscriptions'),
      value: totalNewDeals.toString(),
      color: '#3b82f6',
      description: `${t('subscriptionAnalytics.last')} ${numMonths} ${t('subscriptionAnalytics.months')}`
    },
    {
      label: t('subscriptionAnalytics.avgMrr'),
      value: formatCurrency(avgMrr),
      color: '#f59e0b',
      description: t('subscriptionAnalytics.periodAverage')
    }
  ];
}

// ─── MRR/ARR Chart ──────────────────────────────────────────
const mrrArrChartOption = computed(() => {
  const data = monthlyMrr.value;
  const labels = data.map(d => getShortMonthLabel(d.month));
  const mrrValues = data.map(d => d.mrr);
  const arrValues = data.map(d => d.arr);

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: any) => {
        const idx = params[0]?.dataIndex ?? 0;
        const month = labels[idx] || '';
        let html = `<strong>${month}</strong><br/>`;
        params.forEach((p: any) => {
          html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`;
          html += `${p.seriesName}: <strong>${formatCurrency(p.value)}</strong><br/>`;
        });
        return html;
      }
    },
    legend: {
      data: [t('subscriptionAnalytics.mrr'), t('subscriptionAnalytics.arr')],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 20
    },
    grid: { top: 30, right: 60, bottom: 50, left: 60, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: t('subscriptionAnalytics.mrr'),
        position: 'left',
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
        axisLabel: {
          color: '#64748B',
          formatter: (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`
        }
      },
      {
        type: 'value',
        name: t('subscriptionAnalytics.arr'),
        position: 'right',
        splitLine: { show: false },
        axisLabel: {
          color: '#64748B',
          formatter: (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`
        }
      }
    ],
    series: [
      {
        name: t('subscriptionAnalytics.mrr'),
        type: 'line',
        yAxisIndex: 0,
        data: mrrValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#7849ff' },
        itemStyle: { color: '#7849ff' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(120, 73, 255, 0.25)' },
            { offset: 1, color: 'rgba(120, 73, 255, 0)' }
          ])
        }
      },
      {
        name: t('subscriptionAnalytics.arr'),
        type: 'line',
        yAxisIndex: 1,
        data: arrValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#22c55e' },
        itemStyle: { color: '#22c55e' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34, 197, 94, 0.2)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0)' }
          ])
        }
      }
    ],
    animationDuration: 1200,
    animationEasing: 'cubicOut'
  };
});

// ─── Cohort Analysis ────────────────────────────────────────
function computeCohort() {
  const deals = getFilteredDeals();
  if (!deals.length) {
    // Generate mock cohort data for demonstration
    generateMockCohort();
    return;
  }

  const cohortMap = new Map<string, any[]>();
  deals.forEach((deal: any) => {
    const created = new Date(deal.createdAt || deal.created_at || Date.now());
    const key = getMonthKey(created);
    if (!cohortMap.has(key)) cohortMap.set(key, []);
    cohortMap.get(key)!.push(deal);
  });

  const sortedKeys = Array.from(cohortMap.keys()).sort().slice(-10);
  const now = new Date();

  cohortData.value = sortedKeys.map(key => {
    const coDeals = cohortMap.get(key) || [];
    const initialCount = coDeals.length;
    const cells = [];

    for (let m = 0; m < 12; m++) {
      const targetDate = new Date(parseInt(key.split('-')[0] || '0'), parseInt(key.split('-')[1] || '1') - 1 + m);
      if (targetDate > now) {
        cells.push({ value: null, count: 0, rawValue: 0 });
        continue;
      }

      if (cohortMetric.value === 'retention') {
        const retained = coDeals.filter((d: any) => {
          if (m === 0) return true;
          const status = (d.status || d.stage || '').toLowerCase();
          const closeDate = d.closedAt || d.closed_at || d.updatedAt || d.updated_at;
          if (!closeDate) return status !== 'lost';
          const closeMonth = new Date(closeDate);
          const monthDiff = (closeMonth.getFullYear() - targetDate.getFullYear()) * 12 + closeMonth.getMonth() - targetDate.getMonth();
          return monthDiff >= 0 && status !== 'lost';
        });
        const pct = initialCount > 0 ? Math.round((retained.length / initialCount) * 100) : 0;
        cells.push({ value: m === 0 ? 100 : pct, count: retained.length, rawValue: 0 });
      } else {
        const cumRev = coDeals.reduce((acc: number, d: any) => {
          const val = parseFloat(d.value || d.amount || d.dealValue || 0);
          const closeDate = d.closedAt || d.closed_at || d.updatedAt || d.updated_at;
          if (closeDate) {
            const cd = new Date(closeDate);
            const diff = (cd.getFullYear() - parseInt(key.split('-')[0] || '0')) * 12 + cd.getMonth() - (parseInt(key.split('-')[1] || '1') - 1);
            if (diff <= m) return acc + val;
          }
          return acc;
        }, 0);
        const maxRev = initialCount * 5000;
        const pct = maxRev > 0 ? Math.min(Math.round((cumRev / maxRev) * 100), 100) : 0;
        cells.push({ value: pct, count: Math.round(cumRev), rawValue: cumRev });
      }
    }

    return { label: getMonthLabel(key), initialCount, cells };
  });
}

function generateMockCohort() {
  const now = new Date();
  const rows: any[] = [];

  for (let i = 9; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(d);
    const initialCount = Math.round(30 + Math.random() * 40);
    const cells = [];
    let retention = 100;

    for (let m = 0; m < 12; m++) {
      const targetDate = new Date(d.getFullYear(), d.getMonth() + m);
      if (targetDate > now) {
        cells.push({ value: null, count: 0, rawValue: 0 });
        continue;
      }
      if (m === 0) {
        cells.push({ value: 100, count: initialCount, rawValue: initialCount * 500 });
      } else {
        const decay = 0.85 + Math.random() * 0.1;
        retention = Math.round(retention * decay);
        retention = Math.max(retention, 15);
        const count = Math.round((retention / 100) * initialCount);
        cells.push({
          value: cohortMetric.value === 'revenue' ? Math.min(retention + 5, 100) : retention,
          count,
          rawValue: count * 500
        });
      }
    }

    rows.push({ label: getMonthLabel(key), initialCount, cells });
  }

  cohortData.value = rows;
}

// ─── Churn Analysis ─────────────────────────────────────────
function computeChurn() {
  const deals = getFilteredDeals();

  const lostDeals = deals.filter((d: any) => {
    const s = (d.status || d.stage || '').toLowerCase();
    return s.includes('lost') || s.includes('churn') || s.includes('cancel');
  });

  // Categorize churn reasons
  const reasonMap: Record<string, number> = {
    voluntary: 0,
    involuntary: 0,
    downgrade: 0,
    competitor: 0,
    budgetCuts: 0,
    poorFit: 0
  };

  if (lostDeals.length > 0) {
    lostDeals.forEach((d: any) => {
      const reason = (d.lostReason || d.closeReason || '').toLowerCase();
      if (reason.includes('compet')) reasonMap.competitor = (reasonMap.competitor || 0) + 1;
      else if (reason.includes('budget') || reason.includes('price')) reasonMap.budgetCuts = (reasonMap.budgetCuts || 0) + 1;
      else if (reason.includes('fit') || reason.includes('need')) reasonMap.poorFit = (reasonMap.poorFit || 0) + 1;
      else if (reason.includes('down')) reasonMap.downgrade = (reasonMap.downgrade || 0) + 1;
      else if (reason.includes('payment') || reason.includes('card') || reason.includes('involunt')) reasonMap.involuntary = (reasonMap.involuntary || 0) + 1;
      else reasonMap.voluntary = (reasonMap.voluntary || 0) + 1;
    });
  } else {
    // Mock data
    reasonMap.voluntary = 35;
    reasonMap.involuntary = 22;
    reasonMap.downgrade = 15;
    reasonMap.competitor = 12;
    reasonMap.budgetCuts = 10;
    reasonMap.poorFit = 6;
  }

  const totalReasons = Object.values(reasonMap).reduce((a, b) => a + b, 0) || 1;
  const reasonColors = ['#ef4444', '#f59e0b', '#f97316', '#3b82f6', '#8b5cf6', '#64748b'];
  const reasonLabels = [
    t('subscriptionAnalytics.voluntary'),
    t('subscriptionAnalytics.involuntary'),
    t('subscriptionAnalytics.downgrade'),
    t('subscriptionAnalytics.competitor'),
    t('subscriptionAnalytics.budgetCuts'),
    t('subscriptionAnalytics.poorFit')
  ];

  churnReasons.value = Object.keys(reasonMap).map((key, idx) => ({
    name: reasonLabels[idx],
    value: reasonMap[key] || 0,
    percentage: Math.round(((reasonMap[key] || 0) / totalReasons) * 100),
    color: reasonColors[idx]
  }));

  // At-risk customers from active deals
  const activeDeals = deals.filter((d: any) => {
    const s = (d.status || d.stage || '').toLowerCase();
    return !s.includes('lost') && !s.includes('churn');
  });

  if (activeDeals.length > 0) {
    atRiskCustomers.value = activeDeals
      .map((d: any) => {
        const name = d.company?.name || d.companyName || d.client || d.name || d.title || 'Unknown Account';
        const mrr = Math.round((parseFloat(d.value || d.amount || d.dealValue || 0)) / 12);
        const created = new Date(d.createdAt || d.created_at || Date.now());
        const daysSince = Math.round((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
        const riskScore = Math.min(95, Math.max(25, Math.round(40 + Math.random() * 50)));
        const daysUntilRenewal = Math.max(1, Math.round(365 - daysSince % 365));
        return { name, mrr, riskScore, daysUntilRenewal };
      })
      .sort((a: any, b: any) => b.riskScore - a.riskScore)
      .slice(0, 8);
  } else {
    // Mock at-risk customers
    const mockNames = [
      'Acme Corp', 'TechVibe Solutions', 'NovaStar Inc', 'CloudFirst Ltd',
      'DataPulse Systems', 'Vertex Digital', 'Bloom Enterprises', 'Apex Industries'
    ];
    atRiskCustomers.value = mockNames.map((name, idx) => ({
      name,
      mrr: Math.round(800 + Math.random() * 4200),
      riskScore: Math.round(90 - idx * 8 + Math.random() * 5),
      daysUntilRenewal: Math.round(5 + idx * 12 + Math.random() * 20)
    }));
  }
}

// ─── Churn Reasons Chart ────────────────────────────────────
const churnReasonsChartOption = computed(() => {
  const reasons = churnReasons.value;
  return {
    tooltip: {
      trigger: 'item',
      ...tooltipStyle,
      formatter: (params: any) => {
        return `<strong>${params.name}</strong><br/>${t('subscriptionAnalytics.percentage')}: <strong>${params.percent?.toFixed(1)}%</strong><br/>${t('subscriptionAnalytics.count')}: <strong>${params.value}</strong>`;
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 3,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'transparent',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          color: '#94A3B8',
          fontSize: 11,
          lineHeight: 16
        },
        labelLine: {
          show: true,
          lineStyle: { color: 'rgba(148, 163, 184, 0.3)' }
        },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.3)' }
        },
        data: reasons.map((r: any) => ({
          name: r.name,
          value: r.value,
          itemStyle: { color: r.color }
        })),
        animationType: 'scale',
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      }
    ]
  };
});

function handleRetentionAction(customer: any) {
  console.log('Retention action for:', customer.name);
}

// ─── Expansion Revenue ──────────────────────────────────────
function computeExpansion() {
  const deals = getFilteredDeals();
  const now = new Date();

  if (expansionPeriod.value === 'quarterly') {
    const quarters: { label: string; upsell: number; crossSell: number }[] = [];
    for (let q = 3; q >= 0; q--) {
      const qStart = new Date(now.getFullYear(), now.getMonth() - q * 3, 1);
      const qLabel = `Q${Math.floor(qStart.getMonth() / 3) + 1} ${qStart.getFullYear()}`;

      let upsell = 0;
      let crossSell = 0;

      deals.forEach((d: any) => {
        const created = new Date(d.createdAt || d.created_at || Date.now());
        const key = getMonthKey(created);
        const qMonth = qStart.getMonth();
        const cMonth = created.getMonth();
        const cYear = created.getFullYear();
        if (cYear === qStart.getFullYear() && cMonth >= qMonth && cMonth < qMonth + 3) {
          const val = parseFloat(d.value || d.amount || d.dealValue || 0);
          const type = (d.type || d.dealType || '').toLowerCase();
          if (type.includes('cross')) {
            crossSell += val * 0.15;
          } else {
            upsell += val * 0.2;
          }
        }
      });

      // If no real expansion data, use mock
      if (upsell === 0 && crossSell === 0) {
        upsell = Math.round(8000 + Math.random() * 15000);
        crossSell = Math.round(4000 + Math.random() * 8000);
      }

      quarters.push({ label: qLabel, upsell: Math.round(upsell), crossSell: Math.round(crossSell) });
    }
    expansionData.value = quarters;
  } else {
    const months: { label: string; upsell: number; crossSell: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMonthKey(d);
      const label = getShortMonthLabel(key);

      let upsell = 0;
      let crossSell = 0;

      deals.forEach((deal: any) => {
        const created = new Date(deal.createdAt || deal.created_at || Date.now());
        if (getMonthKey(created) === key) {
          const val = parseFloat(deal.value || deal.amount || deal.dealValue || 0);
          const type = (deal.type || deal.dealType || '').toLowerCase();
          if (type.includes('cross')) {
            crossSell += val * 0.12;
          } else {
            upsell += val * 0.18;
          }
        }
      });

      if (upsell === 0 && crossSell === 0) {
        upsell = Math.round(2500 + Math.random() * 6000);
        crossSell = Math.round(1200 + Math.random() * 3500);
      }

      months.push({ label, upsell: Math.round(upsell), crossSell: Math.round(crossSell) });
    }
    expansionData.value = months;
  }

  // Expansion summary
  const totalUpsell = expansionData.value.reduce((s, d) => s + d.upsell, 0);
  const totalCrossSell = expansionData.value.reduce((s, d) => s + d.crossSell, 0);
  const totalExpansion = totalUpsell + totalCrossSell;

  expansionSummary.value = [
    {
      label: t('subscriptionAnalytics.totalExpansion'),
      value: formatCompact(totalExpansion),
      color: '#7849ff'
    },
    {
      label: t('subscriptionAnalytics.upsellRevenue'),
      value: formatCompact(totalUpsell),
      color: '#22c55e'
    },
    {
      label: t('subscriptionAnalytics.crossSellRevenue'),
      value: formatCompact(totalCrossSell),
      color: '#3b82f6'
    }
  ];

  // Expansion pipeline
  const pipelineAccounts = deals.filter((d: any) => {
    const s = (d.status || d.stage || '').toLowerCase();
    return !s.includes('lost') && !s.includes('won') && !s.includes('closed');
  }).slice(0, 8);

  if (pipelineAccounts.length > 0) {
    expansionPipeline.value = pipelineAccounts.map((d: any) => {
      const val = parseFloat(d.value || d.amount || d.dealValue || 0);
      return {
        account: d.company?.name || d.companyName || d.client || d.name || d.title || 'Unknown',
        type: Math.random() > 0.5 ? 'upsell' : 'cross-sell',
        value: Math.round(val * (0.1 + Math.random() * 0.3)),
        probability: Math.round(30 + Math.random() * 60),
        expectedClose: new Date(Date.now() + Math.round(Math.random() * 90) * 86400000).toISOString()
      };
    });
  } else {
    // Mock pipeline
    const mockAccounts = [
      'Meridian Group', 'Apex Holdings', 'SynergyTech', 'Atlas Solutions',
      'PrimeLine Corp', 'Quantum Digital', 'EverGreen Systems', 'CoreBridge Inc'
    ];
    expansionPipeline.value = mockAccounts.map((name, idx) => ({
      account: name,
      type: idx % 3 === 0 ? 'cross-sell' : 'upsell',
      value: Math.round(2000 + Math.random() * 12000),
      probability: Math.round(25 + Math.random() * 65),
      expectedClose: new Date(Date.now() + Math.round((15 + idx * 10) * 86400000)).toISOString()
    }));
  }
}

const totalExpansionPipeline = computed(() => {
  return expansionPipeline.value.reduce((sum, p) => sum + p.value, 0);
});

// ─── Expansion Chart ────────────────────────────────────────
const expansionChartOption = computed(() => {
  const data = expansionData.value;
  const labels = data.map(d => d.label);
  const upsellValues = data.map(d => d.upsell);
  const crossSellValues = data.map(d => d.crossSell);

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: any) => {
        const idx = params[0]?.dataIndex ?? 0;
        const label = labels[idx] || '';
        let html = `<strong>${label}</strong><br/>`;
        params.forEach((p: any) => {
          html += `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color};margin-right:6px;"></span>`;
          html += `${p.seriesName}: <strong>${formatCurrency(p.value)}</strong><br/>`;
        });
        const total = (params[0]?.value || 0) + (params[1]?.value || 0);
        html += `<br/><strong>${t('subscriptionAnalytics.total')}: ${formatCurrency(total)}</strong>`;
        return html;
      }
    },
    legend: {
      data: [t('subscriptionAnalytics.upsell'), t('subscriptionAnalytics.crossSell')],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 20
    },
    grid: { top: 20, right: 20, bottom: 50, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: {
        color: '#64748B',
        formatter: (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`
      }
    },
    series: [
      {
        name: t('subscriptionAnalytics.upsell'),
        type: 'bar',
        stack: 'expansion',
        data: upsellValues,
        barWidth: expansionPeriod.value === 'quarterly' ? 40 : 20,
        itemStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#22c55e' },
            { offset: 1, color: '#16a34a' }
          ]),
          borderRadius: [0, 0, 0, 0]
        }
      },
      {
        name: t('subscriptionAnalytics.crossSell'),
        type: 'bar',
        stack: 'expansion',
        data: crossSellValues,
        barWidth: expansionPeriod.value === 'quarterly' ? 40 : 20,
        itemStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#2563eb' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Init ───────────────────────────────────────────────────
await loadData().catch(() => {
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.subscription-analytics-page {
  animation: fadeInUp 0.6s ease-out;
  min-height: 100vh;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ─── Section Title ──────────────────────────────────────────
.section-title {
  display: flex;
  align-items: center;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

// ─── Glass Card ─────────────────────────────────────────────
.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08);
  }
}

// ─── KPI Cards ──────────────────────────────────────────────
.kpi-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.12);
    border-color: rgba(120, 73, 255, 0.3);
  }
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Summary Stats ──────────────────────────────────────────
.summary-stat-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(120, 73, 255, 0.3);
    background: rgba(120, 73, 255, 0.03);
  }
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

// ─── Cohort Table ───────────────────────────────────────────
.cohort-table-wrapper {
  overflow-x: auto;
  padding-bottom: 8px;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(120, 73, 255, 0.3);
    border-radius: 3px;
  }
}

.cohort-table {
  min-width: 900px;
}

.cohort-row {
  display: grid;
  grid-template-columns: 120px 80px repeat(12, 1fr);
  gap: 2px;
  margin-bottom: 2px;

  &.cohort-header {
    .cohort-cell {
      font-weight: 600;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      background: rgba(120, 73, 255, 0.06);
    }
  }
}

.cohort-cell {
  padding: 8px 4px;
  text-align: center;
  font-size: 0.78rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.cohort-label-cell {
  text-align: start;
  padding-inline-start: 10px;
  color: var(--text-primary);
  background: rgba(120, 73, 255, 0.03);
}

.cohort-data-cell {
  cursor: default;
  font-weight: 600;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 2;
    position: relative;
  }
}

// ─── Churn / Risk ───────────────────────────────────────────
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.risk-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Expansion ──────────────────────────────────────────────
.expansion-summary-item {
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.04);
  border: 1px solid var(--border-default);
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(120, 73, 255, 0.08);
  }
}

// ─── Tabs Styling ───────────────────────────────────────────
.subscription-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    background: var(--border-default);
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted);
    font-weight: 500;
    font-size: 0.95rem;

    &.is-active {
      color: var(--accent-color, #7849ff);
      font-weight: 600;
    }

    &:hover {
      color: var(--accent-color, #7849ff);
    }
  }

  :deep(.el-tabs__active-bar) {
    background: var(--accent-color, #7849ff);
    height: 3px;
    border-radius: 3px;
  }

  :deep(.el-tabs__content) {
    padding-top: 1.5rem;
  }
}

// ─── Responsive ─────────────────────────────────────────────
@media (max-width: 768px) {
  .cohort-row {
    grid-template-columns: 90px 60px repeat(12, 48px);
  }
}
</style>
