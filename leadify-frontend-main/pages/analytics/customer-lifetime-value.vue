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
import { ref, computed } from 'vue';

definePageMeta({ title: 'Customer Lifetime Value & Churn Analytics' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const dateRange = ref<[Date, Date] | null>(null);
const activeTab = ref('overview');
const riskFilter = ref('all');
const showCustomerDialog = ref(false);
const selectedCustomer = ref<any>(null);

// ─── Helpers ────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
const kpiCards = computed(() => [
  {
    label: t('clvAnalytics.avgClv'),
    value: '$12,480',
    change: '+8.3%',
    changeColor: '#22c55e',
    icon: 'ph:user-circle-bold',
    iconBg: 'rgba(120, 73, 255, 0.12)',
    iconColor: '#7849ff',
    valueColor: '#7849ff',
  },
  {
    label: t('clvAnalytics.churnRate'),
    value: '4.2%',
    change: '-0.8%',
    changeColor: '#22c55e',
    icon: 'ph:user-minus-bold',
    iconBg: 'rgba(239, 68, 68, 0.12)',
    iconColor: '#ef4444',
    valueColor: '#ef4444',
  },
  {
    label: t('clvAnalytics.retentionRate'),
    value: '95.8%',
    change: '+1.2%',
    changeColor: '#22c55e',
    icon: 'ph:user-check-bold',
    iconBg: 'rgba(34, 197, 94, 0.12)',
    iconColor: '#22c55e',
    valueColor: '#22c55e',
  },
  {
    label: t('clvAnalytics.netRevenueRetention'),
    value: '112%',
    change: '+3.5%',
    changeColor: '#22c55e',
    icon: 'ph:currency-circle-dollar-bold',
    iconBg: 'rgba(59, 130, 246, 0.12)',
    iconColor: '#3b82f6',
    valueColor: '#3b82f6',
  },
  {
    label: t('clvAnalytics.customerCount'),
    value: '1,247',
    change: '+42',
    changeColor: '#22c55e',
    icon: 'ph:users-three-bold',
    iconBg: 'rgba(6, 182, 212, 0.12)',
    iconColor: '#06b6d4',
  },
]);

// ─── CLV Segments ───────────────────────────────────────────
const clvSegments = ref([
  { segment: t('clvAnalytics.enterprise'), customerCount: 87, avgClv: 48500, totalRevenue: 4219500, growth: 12.4, ltvCac: 5.2, color: '#7849ff' },
  { segment: t('clvAnalytics.midMarket'), customerCount: 234, avgClv: 18200, totalRevenue: 4258800, growth: 8.7, ltvCac: 3.8, color: '#3b82f6' },
  { segment: t('clvAnalytics.smb'), customerCount: 512, avgClv: 6800, totalRevenue: 3481600, growth: 5.2, ltvCac: 2.9, color: '#22c55e' },
  { segment: t('clvAnalytics.startup'), customerCount: 414, avgClv: 2400, totalRevenue: 993600, growth: -2.1, ltvCac: 1.6, color: '#f59e0b' },
]);

// ─── Cohort Data ────────────────────────────────────────────
const cohortData = ref([
  {
    label: 'Sep 2025',
    initialCount: 185,
    cells: [
      { value: 100, retained: 185 },
      { value: 92, retained: 170 },
      { value: 85, retained: 157 },
      { value: 78, retained: 144 },
      { value: 72, retained: 133 },
      { value: 68, retained: 126 },
    ],
  },
  {
    label: 'Oct 2025',
    initialCount: 210,
    cells: [
      { value: 100, retained: 210 },
      { value: 94, retained: 197 },
      { value: 87, retained: 183 },
      { value: 81, retained: 170 },
      { value: 74, retained: 155 },
      { value: 70, retained: 147 },
    ],
  },
  {
    label: 'Nov 2025',
    initialCount: 198,
    cells: [
      { value: 100, retained: 198 },
      { value: 91, retained: 180 },
      { value: 83, retained: 164 },
      { value: 76, retained: 151 },
      { value: 71, retained: 141 },
      { value: 66, retained: 131 },
    ],
  },
  {
    label: 'Dec 2025',
    initialCount: 175,
    cells: [
      { value: 100, retained: 175 },
      { value: 93, retained: 163 },
      { value: 86, retained: 151 },
      { value: 79, retained: 138 },
      { value: 73, retained: 128 },
      { value: 69, retained: 121 },
    ],
  },
  {
    label: 'Jan 2026',
    initialCount: 225,
    cells: [
      { value: 100, retained: 225 },
      { value: 95, retained: 214 },
      { value: 89, retained: 200 },
      { value: 82, retained: 185 },
      { value: 76, retained: 171 },
      { value: 72, retained: 162 },
    ],
  },
  {
    label: 'Feb 2026',
    initialCount: 240,
    cells: [
      { value: 100, retained: 240 },
      { value: 96, retained: 230 },
      { value: 90, retained: 216 },
      { value: 84, retained: 202 },
      { value: 78, retained: 187 },
      { value: 74, retained: 178 },
    ],
  },
]);

// ─── Churn Prediction Data ──────────────────────────────────
const churnCustomers = ref([
  {
    id: 1, name: 'Sarah Mitchell', email: 's.mitchell@techcorp.com', company: 'TechCorp Industries',
    riskScore: 89, riskLevel: 'high', lastActivity: 45, recommendedAction: t('clvAnalytics.scheduleCall'),
    segment: 'Enterprise', historicalRevenue: 125000, predictedRevenue: 48000, avgOrderValue: 8500,
    purchaseFrequency: 14, customerSince: 'Mar 2022',
    engagement: { emailOpenRate: 12, supportTickets: 8, npsScore: 4, loginFrequency: 6 },
    purchases: [
      { date: '2026-01-15', amount: 12500, product: 'Enterprise Suite - Annual', status: 'Completed' },
      { date: '2025-09-08', amount: 8500, product: 'Advanced Analytics Add-on', status: 'Completed' },
      { date: '2025-06-22', amount: 15000, product: 'Enterprise Suite - Renewal', status: 'Completed' },
      { date: '2025-03-10', amount: 3200, product: 'API Integration Package', status: 'Completed' },
    ],
  },
  {
    id: 2, name: 'James Rodriguez', email: 'j.rodriguez@innovate.io', company: 'Innovate Solutions',
    riskScore: 82, riskLevel: 'high', lastActivity: 38, recommendedAction: t('clvAnalytics.sendOffer'),
    segment: 'Mid-Market', historicalRevenue: 67000, predictedRevenue: 22000, avgOrderValue: 5500,
    purchaseFrequency: 12, customerSince: 'Jul 2022',
    engagement: { emailOpenRate: 18, supportTickets: 5, npsScore: 5, loginFrequency: 10 },
    purchases: [
      { date: '2026-02-01', amount: 5500, product: 'Professional Plan - Monthly', status: 'Completed' },
      { date: '2025-11-15', amount: 5500, product: 'Professional Plan - Monthly', status: 'Completed' },
      { date: '2025-08-20', amount: 7800, product: 'Data Export Module', status: 'Completed' },
    ],
  },
  {
    id: 3, name: 'Emily Chen', email: 'e.chen@globalfin.com', company: 'Global Finance Corp',
    riskScore: 76, riskLevel: 'high', lastActivity: 32, recommendedAction: t('clvAnalytics.accountReview'),
    segment: 'Enterprise', historicalRevenue: 198000, predictedRevenue: 85000, avgOrderValue: 12000,
    purchaseFrequency: 16, customerSince: 'Jan 2021',
    engagement: { emailOpenRate: 22, supportTickets: 12, npsScore: 5, loginFrequency: 15 },
    purchases: [
      { date: '2026-01-28', amount: 18000, product: 'Enterprise Suite - Quarterly', status: 'Completed' },
      { date: '2025-10-15', amount: 18000, product: 'Enterprise Suite - Quarterly', status: 'Completed' },
      { date: '2025-07-12', amount: 4500, product: 'Custom Reports Module', status: 'Completed' },
      { date: '2025-04-03', amount: 18000, product: 'Enterprise Suite - Quarterly', status: 'Completed' },
    ],
  },
  {
    id: 4, name: 'Michael Thompson', email: 'm.thompson@retailpro.com', company: 'RetailPro Inc',
    riskScore: 64, riskLevel: 'medium', lastActivity: 21, recommendedAction: t('clvAnalytics.sendSurvey'),
    segment: 'Mid-Market', historicalRevenue: 42000, predictedRevenue: 28000, avgOrderValue: 3800,
    purchaseFrequency: 11, customerSince: 'Sep 2023',
    engagement: { emailOpenRate: 35, supportTickets: 3, npsScore: 6, loginFrequency: 22 },
    purchases: [
      { date: '2026-02-10', amount: 3800, product: 'Business Plan - Monthly', status: 'Completed' },
      { date: '2025-12-18', amount: 3800, product: 'Business Plan - Monthly', status: 'Completed' },
      { date: '2025-10-05', amount: 2200, product: 'Workflow Automation Add-on', status: 'Completed' },
    ],
  },
  {
    id: 5, name: 'Aisha Patel', email: 'a.patel@cloudserv.net', company: 'CloudServ Networks',
    riskScore: 58, riskLevel: 'medium', lastActivity: 18, recommendedAction: t('clvAnalytics.personalDemo'),
    segment: 'SMB', historicalRevenue: 28000, predictedRevenue: 18500, avgOrderValue: 2400,
    purchaseFrequency: 10, customerSince: 'Feb 2023',
    engagement: { emailOpenRate: 42, supportTickets: 2, npsScore: 7, loginFrequency: 28 },
    purchases: [
      { date: '2026-02-14', amount: 2400, product: 'Growth Plan - Monthly', status: 'Completed' },
      { date: '2025-12-20', amount: 2400, product: 'Growth Plan - Monthly', status: 'Completed' },
    ],
  },
  {
    id: 6, name: 'David Kim', email: 'd.kim@nexgen.co', company: 'NexGen Dynamics',
    riskScore: 55, riskLevel: 'medium', lastActivity: 15, recommendedAction: t('clvAnalytics.reengageEmail'),
    segment: 'SMB', historicalRevenue: 19500, predictedRevenue: 14000, avgOrderValue: 1800,
    purchaseFrequency: 9, customerSince: 'May 2023',
    engagement: { emailOpenRate: 38, supportTickets: 1, npsScore: 7, loginFrequency: 25 },
    purchases: [
      { date: '2026-01-22', amount: 1800, product: 'Starter Plan - Monthly', status: 'Completed' },
      { date: '2025-11-10', amount: 3500, product: 'CRM Integration Pack', status: 'Completed' },
    ],
  },
  {
    id: 7, name: 'Lisa Andersson', email: 'l.andersson@nordictech.se', company: 'Nordic Tech AB',
    riskScore: 51, riskLevel: 'medium', lastActivity: 12, recommendedAction: t('clvAnalytics.upgradeOffer'),
    segment: 'Mid-Market', historicalRevenue: 56000, predictedRevenue: 38000, avgOrderValue: 4200,
    purchaseFrequency: 13, customerSince: 'Aug 2022',
    engagement: { emailOpenRate: 45, supportTickets: 4, npsScore: 6, loginFrequency: 30 },
    purchases: [
      { date: '2026-02-05', amount: 4200, product: 'Professional Plan - Monthly', status: 'Completed' },
      { date: '2025-12-12', amount: 4200, product: 'Professional Plan - Monthly', status: 'Completed' },
      { date: '2025-09-28', amount: 6000, product: 'Team Collaboration Suite', status: 'Completed' },
    ],
  },
  {
    id: 8, name: 'Omar Hassan', email: 'o.hassan@mediagrowth.ae', company: 'Media Growth LLC',
    riskScore: 45, riskLevel: 'medium', lastActivity: 10, recommendedAction: t('clvAnalytics.featureTraining'),
    segment: 'SMB', historicalRevenue: 22000, predictedRevenue: 16000, avgOrderValue: 2000,
    purchaseFrequency: 11, customerSince: 'Nov 2023',
    engagement: { emailOpenRate: 50, supportTickets: 6, npsScore: 7, loginFrequency: 32 },
    purchases: [
      { date: '2026-02-18', amount: 2000, product: 'Growth Plan - Monthly', status: 'Completed' },
      { date: '2025-12-30', amount: 2000, product: 'Growth Plan - Monthly', status: 'Completed' },
      { date: '2025-10-15', amount: 1500, product: 'Email Marketing Add-on', status: 'Completed' },
    ],
  },
  {
    id: 9, name: 'Rachel Foster', email: 'r.foster@buildright.com', company: 'BuildRight Construction',
    riskScore: 35, riskLevel: 'low', lastActivity: 5, recommendedAction: t('clvAnalytics.executiveOutreach'),
    segment: 'Enterprise', historicalRevenue: 165000, predictedRevenue: 120000, avgOrderValue: 15000,
    purchaseFrequency: 11, customerSince: 'Apr 2021',
    engagement: { emailOpenRate: 68, supportTickets: 2, npsScore: 8, loginFrequency: 45 },
    purchases: [
      { date: '2026-02-25', amount: 15000, product: 'Enterprise Suite - Monthly', status: 'Completed' },
      { date: '2026-01-25', amount: 15000, product: 'Enterprise Suite - Monthly', status: 'Completed' },
      { date: '2025-12-25', amount: 15000, product: 'Enterprise Suite - Monthly', status: 'Completed' },
      { date: '2025-11-10', amount: 8000, product: 'Project Management Module', status: 'Completed' },
    ],
  },
  {
    id: 10, name: 'Thomas Weber', email: 't.weber@logistikhaus.de', company: 'LogistikHaus GmbH',
    riskScore: 28, riskLevel: 'low', lastActivity: 3, recommendedAction: t('clvAnalytics.loyaltyReward'),
    segment: 'Mid-Market', historicalRevenue: 78000, predictedRevenue: 55000, avgOrderValue: 6500,
    purchaseFrequency: 12, customerSince: 'Jun 2022',
    engagement: { emailOpenRate: 72, supportTickets: 1, npsScore: 9, loginFrequency: 50 },
    purchases: [
      { date: '2026-02-20', amount: 6500, product: 'Professional Plan - Monthly', status: 'Completed' },
      { date: '2026-01-20', amount: 6500, product: 'Professional Plan - Monthly', status: 'Completed' },
      { date: '2025-12-20', amount: 6500, product: 'Professional Plan - Monthly', status: 'Completed' },
    ],
  },
  {
    id: 11, name: 'Priya Sharma', email: 'p.sharma@digimart.in', company: 'DigiMart India',
    riskScore: 22, riskLevel: 'low', lastActivity: 2, recommendedAction: t('clvAnalytics.usageCheckin'),
    segment: 'SMB', historicalRevenue: 32000, predictedRevenue: 24000, avgOrderValue: 2800,
    purchaseFrequency: 11, customerSince: 'Jan 2023',
    engagement: { emailOpenRate: 78, supportTickets: 0, npsScore: 9, loginFrequency: 55 },
    purchases: [
      { date: '2026-02-22', amount: 2800, product: 'Growth Plan - Monthly', status: 'Completed' },
      { date: '2026-01-22', amount: 2800, product: 'Growth Plan - Monthly', status: 'Completed' },
    ],
  },
  {
    id: 12, name: 'Alex Novak', email: 'a.novak@startupforge.io', company: 'StartupForge',
    riskScore: 71, riskLevel: 'high', lastActivity: 28, recommendedAction: t('clvAnalytics.onboardingHelp'),
    segment: 'Startup', historicalRevenue: 4800, predictedRevenue: 1200, avgOrderValue: 800,
    purchaseFrequency: 6, customerSince: 'Oct 2024',
    engagement: { emailOpenRate: 15, supportTickets: 7, npsScore: 4, loginFrequency: 8 },
    purchases: [
      { date: '2025-12-01', amount: 800, product: 'Starter Plan - Monthly', status: 'Completed' },
      { date: '2025-10-01', amount: 800, product: 'Starter Plan - Monthly', status: 'Completed' },
    ],
  },
  {
    id: 13, name: 'Maria Gonzalez', email: 'm.gonzalez@latamretail.mx', company: 'LatAm Retail Group',
    riskScore: 18, riskLevel: 'low', lastActivity: 1, recommendedAction: t('clvAnalytics.winbackCampaign'),
    segment: 'Enterprise', historicalRevenue: 210000, predictedRevenue: 150000, avgOrderValue: 18000,
    purchaseFrequency: 12, customerSince: 'Nov 2020',
    engagement: { emailOpenRate: 82, supportTickets: 1, npsScore: 10, loginFrequency: 60 },
    purchases: [
      { date: '2026-02-28', amount: 18000, product: 'Enterprise Suite - Monthly', status: 'Completed' },
      { date: '2026-01-28', amount: 18000, product: 'Enterprise Suite - Monthly', status: 'Completed' },
      { date: '2025-12-28', amount: 18000, product: 'Enterprise Suite - Monthly', status: 'Completed' },
      { date: '2025-11-15', amount: 12000, product: 'Advanced Security Package', status: 'Completed' },
    ],
  },
  {
    id: 14, name: 'Kevin O\'Brien', email: 'k.obrien@fastlaunch.co', company: 'FastLaunch Inc',
    riskScore: 68, riskLevel: 'medium', lastActivity: 22, recommendedAction: t('clvAnalytics.customPricing'),
    segment: 'Startup', historicalRevenue: 7200, predictedRevenue: 3600, avgOrderValue: 1200,
    purchaseFrequency: 6, customerSince: 'Jun 2024',
    engagement: { emailOpenRate: 25, supportTickets: 4, npsScore: 5, loginFrequency: 12 },
    purchases: [
      { date: '2026-01-05', amount: 1200, product: 'Starter Plan - Monthly', status: 'Completed' },
      { date: '2025-11-05', amount: 1200, product: 'Starter Plan - Monthly', status: 'Completed' },
    ],
  },
  {
    id: 15, name: 'Sophie Laurent', email: 's.laurent@euromedical.fr', company: 'EuroMedical SA',
    riskScore: 15, riskLevel: 'low', lastActivity: 1, recommendedAction: t('clvAnalytics.successPlan'),
    segment: 'Enterprise', historicalRevenue: 280000, predictedRevenue: 200000, avgOrderValue: 22000,
    purchaseFrequency: 12, customerSince: 'Mar 2020',
    engagement: { emailOpenRate: 85, supportTickets: 0, npsScore: 10, loginFrequency: 65 },
    purchases: [
      { date: '2026-02-27', amount: 22000, product: 'Enterprise Suite - Monthly', status: 'Completed' },
      { date: '2026-01-27', amount: 22000, product: 'Enterprise Suite - Monthly', status: 'Completed' },
      { date: '2025-12-27', amount: 22000, product: 'Enterprise Suite - Monthly', status: 'Completed' },
      { date: '2025-11-20', amount: 15000, product: 'Compliance & Audit Module', status: 'Completed' },
      { date: '2025-09-14', amount: 8000, product: 'Multi-Region Deployment', status: 'Completed' },
    ],
  },
]);

const filteredChurnCustomers = computed(() => {
  if (riskFilter.value === 'all') return churnCustomers.value;
  return churnCustomers.value.filter(c => c.riskLevel === riskFilter.value);
});

// ─── Revenue Impact Data ────────────────────────────────────
const revenueBySegment = ref([
  { segment: t('clvAnalytics.enterprise'), currentRevenue: 4219500, projectedRevenue: 5150000, share: 42, color: '#7849ff' },
  { segment: t('clvAnalytics.midMarket'), currentRevenue: 4258800, projectedRevenue: 4980000, share: 31, color: '#3b82f6' },
  { segment: t('clvAnalytics.smb'), currentRevenue: 3481600, projectedRevenue: 3920000, share: 20, color: '#22c55e' },
  { segment: t('clvAnalytics.startup'), currentRevenue: 993600, projectedRevenue: 1150000, share: 7, color: '#f59e0b' },
]);

const projectedVsActual = ref([
  { period: 'Sep 2025', actual: 980000, projected: 950000, variance: 3.2 },
  { period: 'Oct 2025', actual: 1050000, projected: 1020000, variance: 2.9 },
  { period: 'Nov 2025', actual: 1120000, projected: 1150000, variance: -2.6 },
  { period: 'Dec 2025', actual: 1280000, projected: 1200000, variance: 6.7 },
  { period: 'Jan 2026', actual: 1150000, projected: 1180000, variance: -2.5 },
  { period: 'Feb 2026', actual: 1320000, projected: 1250000, variance: 5.6 },
]);

// ─── Customer Detail Dialog ─────────────────────────────────
function openCustomerDetail(row: any) {
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
  transition: transform 0.15s ease, box-shadow 0.15s ease;

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
