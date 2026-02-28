<template lang="pug">
.customer-health-page.p-6
  //- Page Header
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    div
      h1.text-3xl.font-black.tracking-tight.flex.items-center.gap-3(style="color: var(--text-primary)")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #10b981, #059669)")
          Icon(name="ph:heartbeat-bold" size="22" style="color: white")
        | {{ $t('customerHealth.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('customerHealth.subtitle') }}

    .flex.items-center.gap-3
      el-input(
        v-model="searchQuery"
        :placeholder="$t('customerHealth.searchCustomers')"
        prefix-icon="Search"
        clearable
        style="width: 260px"
        size="large"
      )
      el-select(v-model="riskFilter" clearable :placeholder="$t('customerHealth.filterByRisk')" size="large" style="width: 180px")
        el-option(:label="$t('customerHealth.allCustomers')" value="")
        el-option(:label="$t('customerHealth.healthy')" value="healthy")
        el-option(:label="$t('customerHealth.atRisk')" value="at-risk")
        el-option(:label="$t('customerHealth.critical')" value="critical")
      el-button(size="large" type="primary" class="!bg-[#7849ff] !border-none !rounded-xl" @click="refreshData" :loading="loading")
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-2 {{ $t('customerHealth.refresh') }}

  //- KPI Cards
  .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" v-loading="loading")
    //- Healthy Customers
    .kpi-card.healthy-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('customerHealth.healthyCustomers') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ healthyCount }}
              span.kpi-pct {{ healthyPct }}%
          .kpi-icon-wrap.healthy-icon
            Icon(name="ph:shield-check-bold" size="24")

    //- At Risk
    .kpi-card.risk-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('customerHealth.atRisk') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ atRiskCount }}
              span.kpi-pct.text-amber-400 {{ atRiskPct }}%
          .kpi-icon-wrap.risk-icon
            Icon(name="ph:warning-bold" size="24")

    //- Critical
    .kpi-card.critical-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('customerHealth.critical') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ criticalCount }}
              span.kpi-pct.text-red-400 {{ criticalPct }}%
          .kpi-icon-wrap.critical-icon
            Icon(name="ph:fire-bold" size="24")

    //- Average Health Score
    .kpi-card.avg-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('customerHealth.avgScore') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ avgHealthScore }}
              span.kpi-pct /100
          .kpi-icon-wrap.avg-icon
            Icon(name="ph:chart-line-up-bold" size="24")

  //- Distribution Chart + Alerts Row
  .grid.gap-6.mb-8(class="grid-cols-1 lg:grid-cols-3")
    //- Health Score Distribution Chart
    .glass-card.p-6.rounded-2xl.col-span-2
      .flex.items-center.justify-between.mb-4
        h2.text-lg.font-bold(style="color: var(--text-primary)")
          Icon(name="ph:chart-bar-bold" size="20" class="mr-2" style="color: #7849ff")
          | {{ $t('customerHealth.healthDistribution') }}
        .flex.items-center.gap-2
          .flex.items-center.gap-1(v-for="range in distributionLegend" :key="range.label")
            .w-3.h-3.rounded-sm(:style="{ background: range.color }")
            span.text-xs(style="color: var(--text-muted)") {{ range.label }}
      .chart-container(v-loading="loading")
        VChart(v-if="distributionChartOption" :option="distributionChartOption" autoresize style="height: 320px")

    //- Alerts & Recommendations
    .glass-card.p-6.rounded-2xl
      .flex.items-center.justify-between.mb-4
        h2.text-lg.font-bold(style="color: var(--text-primary)")
          Icon(name="ph:bell-ringing-bold" size="20" class="mr-2" style="color: #f59e0b")
          | {{ $t('customerHealth.alerts') }}
      .space-y-4
        .alert-card(v-for="(alert, i) in alertItems" :key="i" :class="alert.severity")
          .flex.items-start.gap-3
            .alert-icon-wrap(:class="alert.severity")
              Icon(:name="alert.icon" size="18")
            .flex-1
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ alert.title }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ alert.description }}
            el-button(size="small" type="primary" plain round @click="handleAlertAction(alert)")
              | {{ alert.action }}

  //- Customer Health Table
  .glass-card.rounded-2xl.overflow-hidden.mb-8
    .p-6.flex.items-center.justify-between(style="border-bottom: 1px solid var(--glass-border)")
      h2.text-lg.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:users-bold" size="20" class="mr-2" style="color: #7849ff")
        | {{ $t('customerHealth.customerList') }}
      .flex.items-center.gap-2
        el-tag(effect="dark" round size="small") {{ filteredCustomers.length }} {{ $t('customerHealth.customers') }}
    el-table(
      :data="paginatedCustomers"
      v-loading="loading"
      stripe
      :default-sort="{ prop: 'healthScore', order: 'ascending' }"
      @sort-change="handleSortChange"
      style="width: 100%"
    )
      //- Customer Name
      el-table-column(:label="$t('customerHealth.customerName')" min-width="220" sortable="custom" prop="name")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .avatar-circle(:style="{ background: getAvatarGradient(row.name) }")
              | {{ getInitial(row.name) }}
            div
              p.font-semibold.text-sm(style="color: var(--text-primary)") {{ row.name }}
              p.text-xs(style="color: var(--text-muted)") {{ row.email || row.company }}

      //- Health Score
      el-table-column(:label="$t('customerHealth.healthScore')" width="200" sortable="custom" prop="healthScore")
        template(#default="{ row }")
          .flex.items-center.gap-3
            el-progress(
              :percentage="row.healthScore"
              :stroke-width="8"
              :color="getScoreColor(row.healthScore)"
              style="flex: 1"
            )
            span.text-sm.font-bold(:style="{ color: getScoreColor(row.healthScore) }") {{ row.healthScore }}

      //- Trend
      el-table-column(:label="$t('customerHealth.trend')" width="100" align="center")
        template(#default="{ row }")
          .trend-badge(:class="row.trend")
            Icon(:name="getTrendIcon(row.trend)" size="16")

      //- Last Activity
      el-table-column(:label="$t('customerHealth.lastActivity')" width="150" sortable="custom" prop="lastActivity")
        template(#default="{ row }")
          .flex.items-center.gap-2
            Icon(name="ph:clock" size="14" style="color: var(--text-muted)")
            span.text-sm(style="color: var(--text-secondary)") {{ formatRelativeTime(row.lastActivity) }}

      //- Open Deals Value
      el-table-column(:label="$t('customerHealth.openDeals')" width="150" sortable="custom" prop="openDealsValue" align="right")
        template(#default="{ row }")
          span.text-sm.font-semibold(style="color: var(--text-primary)") ${{ Number(row.openDealsValue || 0).toLocaleString() }}

      //- Support Tickets
      el-table-column(:label="$t('customerHealth.supportTickets')" width="130" sortable="custom" prop="openTickets" align="center")
        template(#default="{ row }")
          el-tag(v-if="row.openTickets > 0" :type="row.openTickets > 3 ? 'danger' : row.openTickets > 1 ? 'warning' : 'info'" size="small" round effect="dark") {{ row.openTickets }}
          span.text-sm(v-else style="color: var(--text-muted)") 0

      //- NPS Score
      el-table-column(:label="$t('customerHealth.npsScore')" width="110" sortable="custom" prop="npsScore" align="center")
        template(#default="{ row }")
          span.text-sm.font-bold(:style="{ color: getNpsColor(row.npsScore) }") {{ row.npsScore !== null ? row.npsScore : '--' }}

      //- Risk Level
      el-table-column(:label="$t('customerHealth.riskLevel')" width="130" align="center")
        template(#default="{ row }")
          el-tag(:type="getRiskTagType(row.riskLevel)" size="small" round effect="dark") {{ getRiskLabel(row.riskLevel) }}

      //- Actions
      el-table-column(:label="$t('customerHealth.actions')" width="160" align="center" fixed="right")
        template(#default="{ row }")
          .flex.items-center.gap-2.justify-center
            el-tooltip(:content="$t('customerHealth.view360')")
              el-button(link type="primary" @click="navigateTo360(row)")
                Icon(name="ph:user-circle-bold" size="18")
            el-tooltip(:content="$t('customerHealth.createTask')")
              el-button(link type="warning" @click="createTaskForCustomer(row)")
                Icon(name="ph:note-pencil-bold" size="18")

    //- Pagination
    .p-4.flex.justify-center(style="border-top: 1px solid var(--glass-border)")
      el-pagination(
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="filteredCustomers.length"
        layout="total, sizes, prev, pager, next"
        background
      )

  //- Health Score Calculation Panel
  el-collapse.glass-card.rounded-2xl.overflow-hidden(v-model="calcPanelOpen")
    el-collapse-item(name="calculation")
      template(#title)
        .flex.items-center.gap-3.px-2
          Icon(name="ph:gear-six-bold" size="20" style="color: #7849ff")
          span.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('customerHealth.howCalculated') }}
      .p-6.pt-0
        .grid.gap-6(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
          //- Engagement Score
          .calc-factor-card
            .calc-header
              .calc-icon(style="background: rgba(120, 73, 255, 0.15)")
                Icon(name="ph:cursor-click-bold" size="20" style="color: #7849ff")
              .calc-weight 30%
            h3.text-sm.font-bold.mt-3(style="color: var(--text-primary)") {{ $t('customerHealth.engagementScore') }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('customerHealth.engagementDesc') }}
            .mt-3
              .flex.justify-between.text-xs.mb-1
                span(style="color: var(--text-muted)") {{ $t('customerHealth.loginFrequency') }}
                span(style="color: var(--text-secondary)") {{ $t('customerHealth.featureUsage') }}

          //- Support Score
          .calc-factor-card
            .calc-header
              .calc-icon(style="background: rgba(59, 130, 246, 0.15)")
                Icon(name="ph:lifebuoy-bold" size="20" style="color: #3b82f6")
              .calc-weight 25%
            h3.text-sm.font-bold.mt-3(style="color: var(--text-primary)") {{ $t('customerHealth.supportScore') }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('customerHealth.supportDesc') }}
            .mt-3
              .flex.justify-between.text-xs.mb-1
                span(style="color: var(--text-muted)") {{ $t('customerHealth.ticketVolume') }}
                span(style="color: var(--text-secondary)") {{ $t('customerHealth.resolutionTime') }}

          //- Financial Score
          .calc-factor-card
            .calc-header
              .calc-icon(style="background: rgba(16, 185, 129, 0.15)")
                Icon(name="ph:currency-dollar-bold" size="20" style="color: #10b981")
              .calc-weight 25%
            h3.text-sm.font-bold.mt-3(style="color: var(--text-primary)") {{ $t('customerHealth.financialScore') }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('customerHealth.financialDesc') }}
            .mt-3
              .flex.justify-between.text-xs.mb-1
                span(style="color: var(--text-muted)") {{ $t('customerHealth.paymentHistory') }}
                span(style="color: var(--text-secondary)") {{ $t('customerHealth.revenueGrowth') }}

          //- Relationship Score
          .calc-factor-card
            .calc-header
              .calc-icon(style="background: rgba(245, 158, 11, 0.15)")
                Icon(name="ph:handshake-bold" size="20" style="color: #f59e0b")
              .calc-weight 20%
            h3.text-sm.font-bold.mt-3(style="color: var(--text-primary)") {{ $t('customerHealth.relationshipScore') }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('customerHealth.relationshipDesc') }}
            .mt-3
              .flex.justify-between.text-xs.mb-1
                span(style="color: var(--text-muted)") {{ $t('customerHealth.meetingFrequency') }}
                span(style="color: var(--text-secondary)") {{ $t('customerHealth.responseTime') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { graphic } from 'echarts';

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const router = useRouter();

// ── State ──
const loading = ref(false);
const searchQuery = ref('');
const riskFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const calcPanelOpen = ref<string[]>([]);
const sortProp = ref('healthScore');
const sortOrder = ref<'ascending' | 'descending'>('ascending');

// Raw data
const allClients = ref<any[]>([]);
const allDeals = ref<any[]>([]);
const allInvoices = ref<any[]>([]);
const allTickets = ref<any[]>([]);

// ── Computed: Health-scored customers ──
const customers = computed(() => {
  return allClients.value.map(client => {
    const clientDeals = allDeals.value.filter(d =>
      d.clientId === client.id || d.client === client.id
    );
    const clientInvoices = allInvoices.value.filter(inv =>
      inv.clientId === client.id || inv.client === client.id
    );
    const clientTickets = allTickets.value.filter(tk =>
      tk.clientId === client.id || tk.client === client.id
    );

    const openDeals = clientDeals.filter(d => d.status !== 'WON' && d.status !== 'LOST');
    const wonDeals = clientDeals.filter(d => d.status === 'WON');
    const openTickets = clientTickets.filter(tk => tk.status !== 'CLOSED' && tk.status !== 'RESOLVED');
    const paidInvoices = clientInvoices.filter(inv => inv.status === 'PAID');
    const overdueInvoices = clientInvoices.filter(inv => inv.status === 'OVERDUE');

    // ── Health Score Calculation ──
    // Engagement (30%): based on deal activity and recency
    let engagementRaw = 0;
    engagementRaw += Math.min(clientDeals.length * 12, 40);
    engagementRaw += Math.min(wonDeals.length * 15, 30);
    const lastDealDate = clientDeals.length
      ? Math.max(...clientDeals.map(d => new Date(d.updatedAt || d.createdAt).getTime()))
      : 0;
    const daysSinceLastDeal = lastDealDate ? Math.floor((Date.now() - lastDealDate) / 86400000) : 999;
    if (daysSinceLastDeal < 7) engagementRaw += 30;
    else if (daysSinceLastDeal < 30) engagementRaw += 20;
    else if (daysSinceLastDeal < 90) engagementRaw += 10;
    const engagementScore = Math.min(engagementRaw, 100);

    // Support (25%): fewer open tickets = healthier, quick resolution
    let supportRaw = 80; // Start high
    supportRaw -= openTickets.length * 15;
    const urgentTickets = openTickets.filter(tk => tk.priority === 'URGENT' || tk.priority === 'HIGH');
    supportRaw -= urgentTickets.length * 10;
    const supportScore = Math.max(Math.min(supportRaw, 100), 0);

    // Financial (25%): payment history, deal value, overdue invoices
    let financialRaw = 0;
    financialRaw += Math.min(paidInvoices.length * 15, 50);
    financialRaw += Math.min(wonDeals.reduce((s, d) => s + Number(d.value || 0), 0) / 1000, 30);
    financialRaw -= overdueInvoices.length * 20;
    if (clientInvoices.length > 0 && overdueInvoices.length === 0) financialRaw += 20;
    const financialScore = Math.max(Math.min(financialRaw, 100), 0);

    // Relationship (20%): based on deal count, recent interaction
    let relationshipRaw = 0;
    relationshipRaw += Math.min(clientDeals.length * 10, 40);
    relationshipRaw += Math.min(clientInvoices.length * 8, 30);
    if (daysSinceLastDeal < 14) relationshipRaw += 30;
    else if (daysSinceLastDeal < 60) relationshipRaw += 15;
    const relationshipScore = Math.min(relationshipRaw, 100);

    // Weighted final score
    const healthScore = Math.round(
      engagementScore * 0.3 +
      supportScore * 0.25 +
      financialScore * 0.25 +
      relationshipScore * 0.2
    );

    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (daysSinceLastDeal < 14 && openTickets.length <= 1) trend = 'up';
    else if (daysSinceLastDeal > 60 || urgentTickets.length > 0 || overdueInvoices.length > 1) trend = 'down';

    // NPS mock (derived from overall health pattern)
    const npsScore = healthScore >= 70 ? Math.floor(healthScore * 0.9 + Math.random() * 10) :
      healthScore >= 40 ? Math.floor(healthScore * 0.6 + Math.random() * 20) :
      Math.floor(healthScore * 0.3 + Math.random() * 15);

    // Risk level
    let riskLevel: 'healthy' | 'at-risk' | 'critical' = 'healthy';
    if (healthScore < 35) riskLevel = 'critical';
    else if (healthScore < 60) riskLevel = 'at-risk';

    return {
      id: client.id,
      name: client.clientName || client.name || 'Unknown',
      email: client.email || '',
      company: client.company || '',
      healthScore,
      trend,
      lastActivity: clientDeals[0]?.updatedAt || clientInvoices[0]?.createdAt || client.updatedAt || client.createdAt,
      openDealsValue: openDeals.reduce((s, d) => s + Number(d.value || 0), 0),
      openTickets: openTickets.length,
      npsScore: Math.min(npsScore, 100),
      riskLevel,
      engagementScore,
      supportScore,
      financialScore,
      relationshipScore
    };
  });
});

// ── Filtered and Sorted ──
const filteredCustomers = computed(() => {
  let result = customers.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  }
  if (riskFilter.value) {
    result = result.filter(c => c.riskLevel === riskFilter.value);
  }

  // Sort
  const prop = sortProp.value as keyof typeof result[0];
  const order = sortOrder.value === 'ascending' ? 1 : -1;
  result = [...result].sort((a, b) => {
    const aVal = a[prop] ?? '';
    const bVal = b[prop] ?? '';
    if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * order;
    return String(aVal).localeCompare(String(bVal)) * order;
  });

  return result;
});

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredCustomers.value.slice(start, start + pageSize.value);
});

// ── KPI Stats ──
const healthyCount = computed(() => customers.value.filter(c => c.riskLevel === 'healthy').length);
const atRiskCount = computed(() => customers.value.filter(c => c.riskLevel === 'at-risk').length);
const criticalCount = computed(() => customers.value.filter(c => c.riskLevel === 'critical').length);
const total = computed(() => customers.value.length || 1);
const healthyPct = computed(() => Math.round((healthyCount.value / total.value) * 100));
const atRiskPct = computed(() => Math.round((atRiskCount.value / total.value) * 100));
const criticalPct = computed(() => Math.round((criticalCount.value / total.value) * 100));
const avgHealthScore = computed(() => {
  if (!customers.value.length) return 0;
  return Math.round(customers.value.reduce((s, c) => s + c.healthScore, 0) / customers.value.length);
});

// ── Distribution Chart ──
const distributionLegend = [
  { label: '0-20', color: '#ef4444' },
  { label: '21-40', color: '#f97316' },
  { label: '41-60', color: '#eab308' },
  { label: '61-80', color: '#84cc16' },
  { label: '81-100', color: '#10b981' }
];

const distributionChartOption = computed(() => {
  const ranges = [
    { name: '0-20', min: 0, max: 20, color: '#ef4444' },
    { name: '21-40', min: 21, max: 40, color: '#f97316' },
    { name: '41-60', min: 41, max: 60, color: '#eab308' },
    { name: '61-80', min: 61, max: 80, color: '#84cc16' },
    { name: '81-100', min: 81, max: 100, color: '#10b981' }
  ];

  const data = ranges.map(r => ({
    name: r.name,
    value: customers.value.filter(c => c.healthScore >= r.min && c.healthScore <= r.max).length,
    itemStyle: {
      color: new graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: r.color },
        { offset: 1, color: r.color + 'aa' }
      ]),
      borderRadius: [0, 6, 6, 0],
      shadowBlur: 8,
      shadowColor: r.color + '40'
    }
  }));

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(30, 30, 45, 0.85)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-radius: 16px;',
      formatter: (params: any) => {
        const p = params[0];
        return `<strong>${t('customerHealth.scoreRange')}: ${p.name}</strong><br/>${t('customerHealth.customers')}: <strong>${p.value}</strong>`;
      }
    },
    grid: { top: 20, right: 40, bottom: 30, left: 60, containLabel: false },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#94A3B8' }
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.name),
      inverse: true,
      axisLabel: { color: '#94A3B8', fontSize: 13, fontWeight: 600 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: data,
        barWidth: 28,
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(255,255,255,0.03)',
          borderRadius: 6
        },
        label: {
          show: true,
          position: 'right',
          color: '#94A3B8',
          fontWeight: 'bold',
          formatter: '{c}'
        },
        animationDelay: (idx: number) => idx * 120,
        animationEasing: 'elasticOut'
      }
    ],
    animationDuration: 1200
  };
});

// ── Alerts ──
const alertItems = computed(() => {
  const alerts: any[] = [];

  const inactiveCount = customers.value.filter(c => {
    if (!c.lastActivity) return true;
    const days = Math.floor((Date.now() - new Date(c.lastActivity).getTime()) / 86400000);
    return days > 30;
  }).length;

  if (inactiveCount > 0) {
    alerts.push({
      severity: 'warning',
      icon: 'ph:clock-countdown-bold',
      title: t('customerHealth.noActivity30Days', { count: inactiveCount }),
      description: t('customerHealth.noActivity30DaysDesc'),
      action: t('customerHealth.viewList'),
      type: 'inactive'
    });
  }

  const decliningNpsCount = customers.value.filter(c => c.trend === 'down' && c.npsScore < 50).length;
  if (decliningNpsCount > 0) {
    alerts.push({
      severity: 'danger',
      icon: 'ph:trend-down-bold',
      title: t('customerHealth.decliningNPS', { count: decliningNpsCount }),
      description: t('customerHealth.decliningNPSDesc'),
      action: t('customerHealth.investigate'),
      type: 'nps'
    });
  }

  const overdueCount = customers.value.filter(c => c.riskLevel === 'critical').length;
  if (overdueCount > 0) {
    alerts.push({
      severity: 'critical',
      icon: 'ph:warning-circle-bold',
      title: t('customerHealth.criticalCustomers', { count: overdueCount }),
      description: t('customerHealth.criticalCustomersDesc'),
      action: t('customerHealth.takeAction'),
      type: 'critical'
    });
  }

  const expansionCount = customers.value.filter(c => c.healthScore > 80 && c.trend === 'up').length;
  if (expansionCount > 0) {
    alerts.push({
      severity: 'success',
      icon: 'ph:rocket-launch-bold',
      title: t('customerHealth.expansionOpportunity', { count: expansionCount }),
      description: t('customerHealth.expansionOpportunityDesc'),
      action: t('customerHealth.viewOpportunities'),
      type: 'expansion'
    });
  }

  // Always show at least one insight
  if (alerts.length === 0) {
    alerts.push({
      severity: 'success',
      icon: 'ph:check-circle-bold',
      title: t('customerHealth.allHealthy'),
      description: t('customerHealth.allHealthyDesc'),
      action: t('customerHealth.viewDashboard'),
      type: 'healthy'
    });
  }

  return alerts;
});

// ── Helpers ──
function getInitial(name: string): string {
  return (name || '?').charAt(0).toUpperCase();
}

function getAvatarGradient(name: string): string {
  const colors = [
    'linear-gradient(135deg, #7849ff, #a855f7)',
    'linear-gradient(135deg, #3b82f6, #60a5fa)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ef4444, #f87171)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    'linear-gradient(135deg, #ec4899, #f472b6)'
  ];
  const idx = (name || '').charCodeAt(0) % colors.length;
  return colors[idx];
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

function getTrendIcon(trend: string): string {
  if (trend === 'up') return 'ph:trend-up-bold';
  if (trend === 'down') return 'ph:trend-down-bold';
  return 'ph:minus-bold';
}

function getNpsColor(score: number | null): string {
  if (score === null) return 'var(--text-muted)';
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}

function getRiskTagType(level: string): string {
  if (level === 'healthy') return 'success';
  if (level === 'at-risk') return 'warning';
  return 'danger';
}

function getRiskLabel(level: string): string {
  if (level === 'healthy') return t('customerHealth.healthy');
  if (level === 'at-risk') return t('customerHealth.atRisk');
  return t('customerHealth.critical');
}

function formatRelativeTime(date: string): string {
  if (!date) return t('customerHealth.never');
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return t('customerHealth.today');
  if (days === 1) return t('customerHealth.yesterday');
  if (days < 7) return t('customerHealth.daysAgo', { count: days });
  if (days < 30) return t('customerHealth.weeksAgo', { count: Math.floor(days / 7) });
  return t('customerHealth.monthsAgo', { count: Math.floor(days / 30) });
}

function handleSortChange({ prop, order }: any) {
  sortProp.value = prop || 'healthScore';
  sortOrder.value = order || 'ascending';
}

function navigateTo360(row: any) {
  router.push({ path: '/crm/customer-360', query: { contactId: row.id } });
}

function createTaskForCustomer(row: any) {
  router.push({ path: '/tasks', query: { clientId: row.id, clientName: row.name } });
}

function handleAlertAction(alert: any) {
  if (alert.type === 'inactive') {
    riskFilter.value = '';
    searchQuery.value = '';
    // Sort by last activity ascending to show most inactive first
    sortProp.value = 'lastActivity';
    sortOrder.value = 'ascending';
  } else if (alert.type === 'nps') {
    sortProp.value = 'npsScore';
    sortOrder.value = 'ascending';
  } else if (alert.type === 'critical') {
    riskFilter.value = 'critical';
  } else if (alert.type === 'expansion') {
    riskFilter.value = 'healthy';
    sortProp.value = 'healthScore';
    sortOrder.value = 'descending';
  }
}

// ── Data Loading ──
async function loadClients() {
  try {
    const { body, success } = await useApiFetch('client?limit=500');
    if (success && body) {
      const data = body as any;
      allClients.value = data.docs || data || [];
    }
  } catch { /* silent */ }
}

async function loadDeals() {
  try {
    const { body, success } = await useApiFetch('deal?limit=500');
    if (success && body) {
      const data = body as any;
      allDeals.value = data.docs || data || [];
    }
  } catch { /* silent */ }
}

async function loadInvoices() {
  try {
    const { body, success } = await useApiFetch('invoices/billing?limit=500');
    if (success && body) {
      const data = body as any;
      allInvoices.value = data.docs || data || [];
    }
  } catch { /* silent */ }
}

async function loadTickets() {
  try {
    const { body, success } = await useApiFetch('support/tickets?limit=500');
    if (success && body) {
      const data = body as any;
      allTickets.value = data.docs || data || [];
    }
  } catch { /* silent */ }
}

async function refreshData() {
  loading.value = true;
  try {
    await Promise.all([loadClients(), loadDeals(), loadInvoices(), loadTickets()]);
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.loadFailed') });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.customer-health-page {
  animation: fadeInUp 0.4s ease-out;
}

/* ── KPI Cards ── */
.kpi-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-4px);
}

.kpi-card-inner {
  padding: 24px;
  position: relative;
  z-index: 1;
}

.healthy-card {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.06));
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.healthy-card:hover { box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15); }

.risk-card {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.06));
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.risk-card:hover { box-shadow: 0 8px 32px rgba(245, 158, 11, 0.15); }

.critical-card {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(220, 38, 38, 0.06));
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.critical-card:hover { box-shadow: 0 8px 32px rgba(239, 68, 68, 0.15); }

.avg-card {
  background: linear-gradient(135deg, rgba(120, 73, 255, 0.12), rgba(139, 92, 246, 0.06));
  border: 1px solid rgba(120, 73, 255, 0.2);
}
.avg-card:hover { box-shadow: 0 8px 32px rgba(120, 73, 255, 0.15); }

.kpi-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.kpi-value {
  font-size: 32px;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1;
}

.kpi-pct {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
}

.kpi-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.healthy-icon { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.risk-icon { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.critical-icon { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.avg-icon { background: rgba(120, 73, 255, 0.15); color: #7849ff; }

/* ── Glass Card ── */
.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

/* ── Avatar ── */
.avatar-circle {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: white;
}

/* ── Trend Badge ── */
.trend-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  transition: transform 0.2s ease;
}
.trend-badge:hover { transform: scale(1.15); }
.trend-badge.up { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.trend-badge.down { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.trend-badge.stable { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

/* ── Alert Cards ── */
.alert-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.alert-card:hover {
  transform: translateX(4px);
}
.alert-card.warning {
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.2);
}
.alert-card.danger {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.2);
}
.alert-card.critical {
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.3);
}
.alert-card.success {
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(16, 185, 129, 0.2);
}

.alert-icon-wrap {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.alert-icon-wrap.warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.alert-icon-wrap.danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.alert-icon-wrap.critical { background: rgba(220, 38, 38, 0.2); color: #dc2626; }
.alert-icon-wrap.success { background: rgba(16, 185, 129, 0.15); color: #10b981; }

/* ── Calculation Factor Cards ── */
.calc-factor-card {
  padding: 20px;
  border-radius: 16px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.calc-factor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.calc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.calc-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calc-weight {
  font-size: 20px;
  font-weight: 900;
  color: var(--text-primary);
  opacity: 0.7;
}

/* ── Chart container ── */
.chart-container {
  min-height: 320px;
}

/* ── Table Enhancements ── */
:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(120, 73, 255, 0.05);
}

:deep(.el-table .el-table__row:hover > td) {
  background: rgba(120, 73, 255, 0.04) !important;
}

:deep(.el-table th.el-table__cell) {
  background: rgba(120, 73, 255, 0.05) !important;
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Collapse Panel ── */
:deep(.el-collapse) {
  border: none;
}
:deep(.el-collapse-item__header) {
  background: transparent;
  border: none;
  padding: 16px 20px;
  height: auto;
  line-height: 1.5;
}
:deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}
:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}

/* ── Animations ── */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .kpi-value {
    font-size: 24px;
  }
  .kpi-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
  .chart-container {
    min-height: 250px;
  }
}
</style>
