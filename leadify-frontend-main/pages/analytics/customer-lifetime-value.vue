<template lang="pug">
.clv-analytics-page.p-6(class="md:p-8")
  //- Page Header
  .header.mb-8
    .flex.items-center.justify-between.flex-wrap.gap-4
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)")
          Icon.mr-2.align-middle(name="ph:chart-line-up-bold" size="32" style="color: var(--accent-color, #7849ff)")
          | {{ $t('clvAnalytics.title') }}
        p(style="color: var(--text-muted)") {{ $t('clvAnalytics.subtitle') }}
      .flex.items-center.gap-3.flex-wrap
        el-date-picker(
          v-model="dateRange"
          type="daterange"
          range-separator="to"
          :start-placeholder="$t('common.startDate')"
          :end-placeholder="$t('common.endDate')"
          style="width: 300px"
        )
        el-button(type="primary" @click="handleExport")
          Icon(name="ph:download-simple-bold" size="16")
          span.ml-2 {{ $t('clvAnalytics.export') }}

  //- KPI Cards Row
  .grid.gap-4.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-5")
    .kpi-card(v-for="(kpi, i) in kpiCards" :key="i")
      .flex.items-start.gap-3
        .kpi-icon-wrapper(:style="{ background: kpi.iconBg }")
          Icon(:name="kpi.icon" size="24" :style="{ color: kpi.iconColor }")
        div
          p.text-sm.font-medium(style="color: var(--text-muted)") {{ kpi.label }}
          p.text-2xl.font-bold.mt-1(:style="{ color: kpi.valueColor || 'var(--text-primary)' }") {{ kpi.value }}
          p.text-xs.mt-1(style="color: var(--text-secondary)")
            span(:style="{ color: kpi.changeColor }") {{ kpi.change }}
            |  {{ $t('clvAnalytics.vsLastPeriod') }}

  //- Tabs
  el-tabs(v-model="activeTab" type="border-card")
    //- Tab 1: CLV Overview
    el-tab-pane(:label="$t('clvAnalytics.clvOverview')" name="overview")
      .mb-6
        .glass-card.p-6.mb-6
          h3.section-title.mb-4
            Icon.mr-2(name="ph:chart-bar-bold" size="22" style="color: #7849ff")
            | {{ $t('clvAnalytics.clvOverview') }}
          .chart-placeholder
            Icon(name="ph:chart-line-bold" size="48" style="color: var(--text-muted)")
            p.mt-2(style="color: var(--text-muted)") {{ $t('clvAnalytics.chartPlaceholder') }}

        .glass-card.p-6
          h3.section-title.mb-4
            Icon.mr-2(name="ph:squares-four-bold" size="22" style="color: #3b82f6")
            | {{ $t('clvAnalytics.clvDistribution') }}
          el-table(:data="clvSegments" stripe style="width: 100%")
            el-table-column(prop="segment" :label="$t('clvAnalytics.segment')" min-width="140")
              template(#default="scope")
                .flex.items-center.gap-2
                  .segment-dot(:style="{ background: scope.row.color }")
                  span.font-medium {{ scope.row.segment }}
            el-table-column(:label="$t('clvAnalytics.customers')" prop="customerCount" min-width="110" align="center")
            el-table-column(:label="$t('clvAnalytics.avgClvValue')" min-width="130")
              template(#default="scope")
                span.font-bold(style="color: #22c55e") {{ formatCurrency(scope.row.avgClv) }}
            el-table-column(:label="$t('clvAnalytics.totalRevenue')" min-width="140")
              template(#default="scope")
                span.font-semibold {{ formatCurrency(scope.row.totalRevenue) }}
            el-table-column(:label="$t('clvAnalytics.growthRate')" min-width="110" align="center")
              template(#default="scope")
                .flex.items-center.justify-center.gap-1
                  Icon(:name="scope.row.growth >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: scope.row.growth >= 0 ? '#22c55e' : '#ef4444' }")
                  span(:style="{ color: scope.row.growth >= 0 ? '#22c55e' : '#ef4444' }") {{ scope.row.growth >= 0 ? '+' : '' }}{{ scope.row.growth }}%
            el-table-column(:label="$t('clvAnalytics.ltv')" min-width="110" align="center")
              template(#default="scope")
                el-tag(:type="scope.row.ltvCac >= 3 ? 'success' : scope.row.ltvCac >= 2 ? 'warning' : 'danger'" size="small" effect="plain") {{ scope.row.ltvCac }}x

    //- Tab 2: Cohort Analysis
    el-tab-pane(:label="$t('clvAnalytics.cohortAnalysis')" name="cohort")
      .glass-card.p-6
        h3.section-title.mb-4
          Icon.mr-2(name="ph:grid-four-bold" size="22" style="color: #7849ff")
          | {{ $t('clvAnalytics.cohortAnalysis') }}
        .cohort-table-wrapper
          .cohort-table
            //- Header row
            .cohort-row.cohort-header
              .cohort-cell.cohort-label-cell {{ $t('clvAnalytics.cohortMonth') }}
              .cohort-cell.cohort-label-cell {{ $t('clvAnalytics.initialCustomers') }}
              .cohort-cell(v-for="m in 6" :key="m") {{ $t('clvAnalytics.month') }}{{ m - 1 }}
            //- Data rows
            .cohort-row(v-for="(row, rIdx) in cohortData" :key="rIdx")
              .cohort-cell.cohort-label-cell.font-medium {{ row.label }}
              .cohort-cell.cohort-label-cell {{ row.initialCount }}
              el-tooltip(
                v-for="(cell, cIdx) in row.cells"
                :key="cIdx"
                :content="`${cell.retained} ${$t('clvAnalytics.customers')} (${cell.value}%)`"
                placement="top"
              )
                .cohort-cell.cohort-data-cell(
                  :style="{ background: getCohortColor(cell.value), color: cell.value > 50 ? '#fff' : 'var(--text-primary)' }"
                ) {{ cell.value }}%

    //- Tab 3: Churn Prediction
    el-tab-pane(:label="$t('clvAnalytics.churnPrediction')" name="churn")
      .glass-card.p-6
        .flex.items-center.justify-between.flex-wrap.gap-4.mb-4
          h3.section-title
            Icon.mr-2(name="ph:warning-bold" size="22" style="color: #f59e0b")
            | {{ $t('clvAnalytics.atRiskCustomers') }}
          el-select(v-model="riskFilter" size="small" style="width: 150px")
            el-option(:label="$t('common.all')" value="all")
            el-option(:label="$t('clvAnalytics.high')" value="high")
            el-option(:label="$t('clvAnalytics.medium')" value="medium")
            el-option(:label="$t('clvAnalytics.low')" value="low")
        el-table(:data="filteredChurnCustomers" stripe style="width: 100%" @row-click="openCustomerDetail")
          el-table-column(prop="name" :label="$t('clvAnalytics.customer')" min-width="160")
            template(#default="scope")
              .flex.items-center.gap-3
                .customer-avatar(:style="{ background: getAvatarColor(scope.$index) }") {{ getInitials(scope.row.name) }}
                div
                  span.font-medium {{ scope.row.name }}
                  p.text-xs(style="color: var(--text-muted)") {{ scope.row.email }}
          el-table-column(prop="company" :label="$t('clvAnalytics.company')" min-width="140")
          el-table-column(:label="$t('clvAnalytics.riskScore')" min-width="130" align="center")
            template(#default="scope")
              .flex.items-center.justify-center.gap-2
                el-progress(
                  type="circle"
                  :percentage="scope.row.riskScore"
                  :width="40"
                  :stroke-width="4"
                  :color="getRiskColor(scope.row.riskLevel)"
                )
          el-table-column(:label="$t('clvAnalytics.lastActivity')" min-width="130")
            template(#default="scope")
              span {{ scope.row.lastActivity }} {{ $t('clvAnalytics.daysAgo') }}
          el-table-column(prop="recommendedAction" :label="$t('clvAnalytics.recommendedAction')" min-width="180")
          el-table-column(:label="$t('clvAnalytics.status')" min-width="110" align="center")
            template(#default="scope")
              el-tag(
                :type="scope.row.riskLevel === 'high' ? 'danger' : scope.row.riskLevel === 'medium' ? 'warning' : 'success'"
                size="small"
                effect="plain"
              ) {{ $t('clvAnalytics.' + scope.row.riskLevel) }}

    //- Tab 4: Revenue Impact
    el-tab-pane(:label="$t('clvAnalytics.revenueImpact')" name="revenue")
      .space-y-6
        .glass-card.p-6
          h3.section-title.mb-4
            Icon.mr-2(name="ph:currency-circle-dollar-bold" size="22" style="color: #22c55e")
            | {{ $t('clvAnalytics.revenueBySegment') }}
          el-table(:data="revenueBySegment" stripe style="width: 100%")
            el-table-column(prop="segment" :label="$t('clvAnalytics.segmentName')" min-width="140")
              template(#default="scope")
                .flex.items-center.gap-2
                  .segment-dot(:style="{ background: scope.row.color }")
                  span.font-medium {{ scope.row.segment }}
            el-table-column(:label="$t('clvAnalytics.currentRevenue')" min-width="150")
              template(#default="scope")
                span.font-bold(style="color: #22c55e") {{ formatCurrency(scope.row.currentRevenue) }}
            el-table-column(:label="$t('clvAnalytics.projectedRevenue')" min-width="160")
              template(#default="scope")
                span.font-semibold(style="color: #3b82f6") {{ formatCurrency(scope.row.projectedRevenue) }}
            el-table-column(:label="$t('clvAnalytics.revenueShare')" min-width="180")
              template(#default="scope")
                .flex.items-center.gap-3
                  el-progress(
                    :percentage="scope.row.share"
                    :stroke-width="10"
                    :color="scope.row.color"
                  )

        .glass-card.p-6
          h3.section-title.mb-4
            Icon.mr-2(name="ph:chart-bar-horizontal-bold" size="22" style="color: #7849ff")
            | {{ $t('clvAnalytics.projectedVsActual') }}
          el-table(:data="projectedVsActual" stripe style="width: 100%")
            el-table-column(prop="period" :label="$t('clvAnalytics.period')" min-width="120")
            el-table-column(:label="$t('clvAnalytics.actualRevenue')" min-width="150")
              template(#default="scope")
                span.font-bold {{ formatCurrency(scope.row.actual) }}
            el-table-column(:label="$t('clvAnalytics.projectedRevenue')" min-width="160")
              template(#default="scope")
                span.font-semibold(style="color: #3b82f6") {{ formatCurrency(scope.row.projected) }}
            el-table-column(:label="$t('clvAnalytics.variance')" min-width="130" align="center")
              template(#default="scope")
                .flex.items-center.justify-center.gap-1
                  Icon(:name="scope.row.variance >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: scope.row.variance >= 0 ? '#22c55e' : '#ef4444' }")
                  span(:style="{ color: scope.row.variance >= 0 ? '#22c55e' : '#ef4444' }") {{ scope.row.variance >= 0 ? '+' : '' }}{{ scope.row.variance }}%

  //- Customer Detail Dialog
  el-dialog(v-model="showCustomerDialog" :title="$t('clvAnalytics.customerDetail')" width="70%" top="5vh")
    template(v-if="selectedCustomer")
      .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
        //- CLV Breakdown
        .glass-card.p-5
          h4.section-title.mb-4
            Icon.mr-2(name="ph:chart-pie-slice-bold" size="18" style="color: #7849ff")
            | {{ $t('clvAnalytics.clvBreakdown') }}
          .space-y-4
            .detail-row
              span.detail-label {{ $t('clvAnalytics.historicalRevenue') }}
              span.detail-value.font-bold(style="color: #22c55e") {{ formatCurrency(selectedCustomer.historicalRevenue) }}
            .detail-row
              span.detail-label {{ $t('clvAnalytics.predictedRevenue') }}
              span.detail-value.font-bold(style="color: #3b82f6") {{ formatCurrency(selectedCustomer.predictedRevenue) }}
            .detail-row
              span.detail-label {{ $t('clvAnalytics.avgOrderValue') }}
              span.detail-value {{ formatCurrency(selectedCustomer.avgOrderValue) }}
            .detail-row
              span.detail-label {{ $t('clvAnalytics.purchaseFrequency') }}
              span.detail-value {{ selectedCustomer.purchaseFrequency }} {{ $t('clvAnalytics.perYear') }}
            .detail-row
              span.detail-label {{ $t('clvAnalytics.customerSince') }}
              span.detail-value {{ selectedCustomer.customerSince }}

        //- Engagement Metrics
        .glass-card.p-5
          h4.section-title.mb-4
            Icon.mr-2(name="ph:pulse-bold" size="18" style="color: #06b6d4")
            | {{ $t('clvAnalytics.engagementMetrics') }}
          .space-y-4
            .detail-metric
              .flex.items-center.justify-between.mb-1
                span.text-sm(style="color: var(--text-muted)") {{ $t('clvAnalytics.emailOpenRate') }}
                span.text-sm.font-bold {{ selectedCustomer.engagement.emailOpenRate }}%
              el-progress(:percentage="selectedCustomer.engagement.emailOpenRate" :stroke-width="8" :color="'#7849ff'" :show-text="false")
            .detail-metric
              .flex.items-center.justify-between.mb-1
                span.text-sm(style="color: var(--text-muted)") {{ $t('clvAnalytics.supportTickets') }}
                span.text-sm.font-bold {{ selectedCustomer.engagement.supportTickets }}
            .detail-metric
              .flex.items-center.justify-between.mb-1
                span.text-sm(style="color: var(--text-muted)") {{ $t('clvAnalytics.npsScore') }}
                span.text-sm.font-bold(:style="{ color: selectedCustomer.engagement.npsScore >= 8 ? '#22c55e' : selectedCustomer.engagement.npsScore >= 6 ? '#f59e0b' : '#ef4444' }") {{ selectedCustomer.engagement.npsScore }}/10
            .detail-metric
              .flex.items-center.justify-between.mb-1
                span.text-sm(style="color: var(--text-muted)") {{ $t('clvAnalytics.loginFrequency') }}
                span.text-sm.font-bold {{ selectedCustomer.engagement.loginFrequency }} {{ $t('clvAnalytics.perYear') }}

      //- Purchase History
      .glass-card.p-5.mt-6
        h4.section-title.mb-4
          Icon.mr-2(name="ph:receipt-bold" size="18" style="color: #f59e0b")
          | {{ $t('clvAnalytics.purchaseHistory') }}
        el-table(:data="selectedCustomer.purchases" stripe max-height="280")
          el-table-column(prop="date" :label="$t('clvAnalytics.date')" min-width="120")
          el-table-column(:label="$t('clvAnalytics.amount')" min-width="120")
            template(#default="scope")
              span.font-bold(style="color: #22c55e") {{ formatCurrency(scope.row.amount) }}
          el-table-column(prop="product" :label="$t('clvAnalytics.product')" min-width="200")
          el-table-column(:label="$t('clvAnalytics.status')" min-width="100" align="center")
            template(#default="scope")
              el-tag(type="success" size="small" effect="plain") {{ scope.row.status }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Customer Lifetime Value & Churn Analytics' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const dateRange = ref<[Date, Date] | null>(null);
const activeTab = ref('overview');
const riskFilter = ref('all');
const showCustomerDialog = ref(false);
const selectedCustomer = ref<Record<string, unknown> | null>(null);
const loading = ref(false);

// ─── Helpers ────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function getCohortColor(value: number): string {
  if (value === null || value === undefined) return 'transparent';
  const g = Math.round((value / 100) * 180);
  const r = Math.round(((100 - value) / 100) * 200);
  return `rgba(${r}, ${g + 50}, 80, ${0.15 + (value / 100) * 0.7})`;
}

function getAvatarColor(index: number): string {
  const colors = ['#7849ff', '#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#f97316', '#ef4444', '#ec4899'];
  return colors[index % colors.length] || '#7849ff';
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getRiskColor(level: string): string {
  if (level === 'high') return '#ef4444';
  if (level === 'medium') return '#f59e0b';
  return '#22c55e';
}

function handleExport() {
  // Export placeholder
}

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => {
  const segments = clvSegments.value;
  const totalCustomers = segments.reduce((sum, s) => sum + (s.customerCount || 0), 0);
  const totalRevenue = segments.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
  const avgClv = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
  const churnCount = churnCustomers.value.filter(c => c.riskLevel === 'high').length;
  const churnRate = totalCustomers > 0 ? ((churnCount / totalCustomers) * 100).toFixed(1) : '0';
  const retentionRate = totalCustomers > 0 ? (100 - parseFloat(churnRate as string)).toFixed(1) : '0';

  return [
    {
      label: t('clvAnalytics.avgClv'),
      value: formatCurrency(avgClv),
      change: '\u2014',
      changeColor: 'var(--text-muted)',
      icon: 'ph:user-circle-bold',
      iconBg: 'rgba(120, 73, 255, 0.12)',
      iconColor: '#7849ff',
      valueColor: '#7849ff'
    },
    {
      label: t('clvAnalytics.churnRate'),
      value: churnRate + '%',
      change: '\u2014',
      changeColor: 'var(--text-muted)',
      icon: 'ph:user-minus-bold',
      iconBg: 'rgba(239, 68, 68, 0.12)',
      iconColor: '#ef4444',
      valueColor: '#ef4444'
    },
    {
      label: t('clvAnalytics.retentionRate'),
      value: retentionRate + '%',
      change: '\u2014',
      changeColor: 'var(--text-muted)',
      icon: 'ph:user-check-bold',
      iconBg: 'rgba(34, 197, 94, 0.12)',
      iconColor: '#22c55e',
      valueColor: '#22c55e'
    },
    {
      label: t('clvAnalytics.netRevenueRetention'),
      value: '0%',
      change: '\u2014',
      changeColor: 'var(--text-muted)',
      icon: 'ph:currency-circle-dollar-bold',
      iconBg: 'rgba(59, 130, 246, 0.12)',
      iconColor: '#3b82f6',
      valueColor: '#3b82f6'
    },
    {
      label: t('clvAnalytics.customerCount'),
      value: totalCustomers > 0 ? totalCustomers.toLocaleString() : '0',
      change: '\u2014',
      changeColor: 'var(--text-muted)',
      icon: 'ph:users-three-bold',
      iconBg: 'rgba(6, 182, 212, 0.12)',
      iconColor: '#06b6d4'
    }
  ];
});

// ─── CLV Segments ───────────────────────────────────────────
const clvSegments = ref<Record<string, unknown>[]>([]);

// ─── Cohort Data ────────────────────────────────────────────
const cohortData = ref<Record<string, unknown>[]>([]);

// ─── Churn Prediction Data ──────────────────────────────────
const churnCustomers = ref<Record<string, unknown>[]>([]);

const filteredChurnCustomers = computed(() => {
  if (riskFilter.value === 'all') return churnCustomers.value;
  return churnCustomers.value.filter(c => c.riskLevel === riskFilter.value);
});

// ─── Revenue Impact Data ────────────────────────────────────
const revenueBySegment = ref<Record<string, unknown>[]>([]);
const projectedVsActual = ref<Record<string, unknown>[]>([]);

// ─── Segment Color Map ──────────────────────────────────────
const segmentColors: Record<string, string> = {
  Enterprise: '#7849ff',
  'Mid-Market': '#3b82f6',
  SMB: '#22c55e',
  Startup: '#f59e0b'
};

// ─── Data Loading ───────────────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    // Fetch all three endpoints in parallel
    const [clvRes, cohortRes, churnRes] = await Promise.all([
      useApiFetch('clv' as unknown).catch(() => null),
      useApiFetch('clv/cohorts' as unknown).catch(() => null),
      useApiFetch('clv/churn-predictions' as unknown).catch(() => null)
    ]);

    // ── CLV segments: derive from GET /clv response ──
    if (clvRes?.success && clvRes.body) {
      const docs = Array.isArray(clvRes.body) ? clvRes.body : Array.isArray((clvRes.body as unknown)?.docs) ? (clvRes.body as unknown).docs : null;

      if (docs && docs.length > 0) {
        // Group CLV records by segment
        const segmentMap = new Map<string, { count: number; totalClv: number; totalRevenue: number; growthSum: number }>();
        docs.forEach(record => {
          const seg = record.segment || 'Other';
          if (!segmentMap.has(seg)) {
            segmentMap.set(seg, { count: 0, totalClv: 0, totalRevenue: 0, growthSum: 0 });
          }
          const entry = segmentMap.get(seg)!;
          entry.count++;
          entry.totalClv += parseFloat(record.clv || record.lifetimeValue || 0);
          entry.totalRevenue += parseFloat(record.totalRevenue || record.revenue || 0);
          entry.growthSum += parseFloat(record.growth || record.growthRate || 0);
        });

        const segments: Record<string, unknown>[] = [];
        segmentMap.forEach((val, key) => {
          segments.push({
            segment: key,
            customerCount: val.count,
            avgClv: val.count > 0 ? Math.round(val.totalClv / val.count) : 0,
            totalRevenue: Math.round(val.totalRevenue),
            growth: val.count > 0 ? Math.round((val.growthSum / val.count) * 10) / 10 : 0,
            ltvCac: Math.round((val.totalClv / val.count / 5000) * 10) / 10, // Estimate LTV/CAC
            color: segmentColors[key] || '#7849ff'
          });
        });

        clvSegments.value = segments;

        // ── Derive revenue by segment from CLV data ──
        const totalRev = segments.reduce((sum, s) => sum + s.totalRevenue, 0);
        revenueBySegment.value = segments.map(s => ({
          segment: s.segment,
          currentRevenue: s.totalRevenue,
          projectedRevenue: Math.round(s.totalRevenue * 1.15), // 15% growth projection
          share: totalRev > 0 ? Math.round((s.totalRevenue / totalRev) * 100) : 0,
          color: s.color
        }));

        // ── Derive projected vs actual from CLV data ──
        // projectedVsActual is left empty unless backend provides real monthly data
        projectedVsActual.value = [];
      } else {
        clvSegments.value = [];
        revenueBySegment.value = [];
        projectedVsActual.value = [];
      }
    } else {
      clvSegments.value = [];
      revenueBySegment.value = [];
      projectedVsActual.value = [];
    }

    // ── Cohort data from GET /clv/cohorts ──
    if (cohortRes?.success && cohortRes.body) {
      const cohorts = (cohortRes.body as unknown)?.cohorts || cohortRes.body;
      if (Array.isArray(cohorts) && cohorts.length > 0) {
        cohortData.value = cohorts;
      } else {
        cohortData.value = [];
      }
    } else {
      cohortData.value = [];
    }

    // ── Churn predictions from GET /clv/churn-predictions ──
    if (churnRes?.success && churnRes.body) {
      const atRisk = (churnRes.body as unknown)?.atRiskCustomers || churnRes.body;
      if (Array.isArray(atRisk) && atRisk.length > 0) {
        churnCustomers.value = atRisk;
      } else {
        churnCustomers.value = [];
      }
    } else {
      churnCustomers.value = [];
    }
  } catch (e) {
    console.error('Failed to load CLV analytics data', e);
    clvSegments.value = [];
    cohortData.value = [];
    churnCustomers.value = [];
    revenueBySegment.value = [];
    projectedVsActual.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

// ─── Customer Detail Dialog ─────────────────────────────────
function openCustomerDetail(row: unknown) {
  selectedCustomer.value = row;
  showCustomerDialog.value = true;
}
</script>

<style lang="scss" scoped>
.clv-analytics-page {
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
  border-radius: 14px;
  padding: 1.25rem;
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.12);
    border-color: rgba(120, 73, 255, 0.3);
  }
}

.kpi-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Chart Placeholder ─────────────────────────────────────
.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 320px;
  border: 2px dashed var(--border-default);
  border-radius: 12px;
  background: rgba(120, 73, 255, 0.03);
}

// ─── Segment Dot ────────────────────────────────────────────
.segment-dot {
  width: 10px;
  height: 10px;
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
  min-width: 700px;
}

.cohort-row {
  display: grid;
  grid-template-columns: 120px 100px repeat(6, 1fr);
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
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 2;
    position: relative;
  }
}

// ─── Customer Avatar ────────────────────────────────────────
.customer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
}

// ─── Detail Dialog ──────────────────────────────────────────
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-default);

  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.detail-value {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.detail-metric {
  padding: 8px 0;
}

// ─── Tabs Override ──────────────────────────────────────────
:deep(.el-tabs--border-card) {
  background: var(--bg-elevated);
  border-color: var(--border-default);
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-tabs__header) {
  background: rgba(120, 73, 255, 0.04);
  border-bottom-color: var(--border-default);
}

:deep(.el-tabs__item.is-active) {
  background: var(--bg-elevated);
}

// ─── Responsive ─────────────────────────────────────────────
@media (max-width: 768px) {
  .cohort-row {
    grid-template-columns: 90px 70px repeat(6, 56px);
  }
}
</style>
