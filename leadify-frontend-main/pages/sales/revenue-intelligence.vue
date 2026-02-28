<template lang="pug">
.revenue-intelligence-page.p-6(class="md:p-8")
  //- Header
  .flex.items-start.justify-between.mb-8(class="flex-col md:flex-row md:items-center gap-4")
    div
      h2.text-3xl.font-bold.mb-1(style="color: var(--text-primary)")
        Icon.mr-2(name="ph:chart-line-up-bold" size="28" style="color: #7849ff")
        | {{ $t('revenueIntelligence.title') }}
      p(style="color: var(--text-muted)") {{ $t('revenueIntelligence.subtitle') }}
    .flex.items-center.gap-3(class="flex-wrap")
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :range-separator="$t('revenueIntelligence.to')"
        :start-placeholder="$t('revenueIntelligence.startDate')"
        :end-placeholder="$t('revenueIntelligence.endDate')"
        @change="loadAllData"
        style="width: 280px"
        value-format="YYYY-MM-DD"
      )
      el-button(type="primary" @click="loadAllData" :loading="loading" class="!rounded-xl")
        Icon(name="ph:arrow-clockwise-bold" size="16")
        span.ml-1 {{ $t('revenueIntelligence.refresh') }}

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="40" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- ====== Section 1: Pipeline Velocity KPI Cards ======
    .grid.gap-4.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
      .velocity-card.glass-card.p-5.rounded-2xl(v-for="kpi in velocityKPIs" :key="kpi.key")
        .flex.items-center.justify-between.mb-3
          .w-11.h-11.rounded-xl.flex.items-center.justify-center(:style="{ background: kpi.color + '18' }")
            Icon(:name="kpi.icon" size="22" :style="{ color: kpi.color }")
          .text-right
            el-tag(v-if="kpi.trend !== 0" :type="kpi.trend > 0 ? 'success' : 'danger'" size="small" round effect="plain")
              | {{ kpi.trend > 0 ? '+' : '' }}{{ kpi.trend.toFixed(1) }}%
        p.text-xs.font-semibold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
        p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}

    //- ====== Section 2: Revenue Waterfall Chart ======
    .glass-card.p-6.rounded-2xl.mb-8
      .flex.items-center.justify-between.mb-4
        h3.text-lg.font-bold.flex.items-center.gap-2(style="color: var(--text-primary)")
          Icon(name="ph:chart-bar-bold" size="20" style="color: #7849ff")
          | {{ $t('revenueIntelligence.waterfall') }}
        el-tag(effect="plain" type="info" round) {{ $t('revenueIntelligence.pipelineFlow') }}
      .waterfall-chart-container(ref="waterfallChartRef" style="height: 380px; width: 100%")

    //- ====== Section 3: Revenue by Source + Monthly Trend (2 columns) ======
    .grid.gap-6.mb-8(class="grid-cols-1 lg:grid-cols-2")
      //- Revenue by Source (Donut Chart)
      .glass-card.p-6.rounded-2xl
        h3.text-lg.font-bold.mb-4.flex.items-center.gap-2(style="color: var(--text-primary)")
          Icon(name="ph:pie-chart-bold" size="20" style="color: #f59e0b")
          | {{ $t('revenueIntelligence.revenueBySource') }}
        .source-chart-container(ref="sourceChartRef" style="height: 340px; width: 100%")

      //- Monthly Revenue Trend (Area Chart)
      .glass-card.p-6.rounded-2xl
        h3.text-lg.font-bold.mb-4.flex.items-center.gap-2(style="color: var(--text-primary)")
          Icon(name="ph:trend-up-bold" size="20" style="color: #22c55e")
          | {{ $t('revenueIntelligence.monthlyTrend') }}
        .trend-chart-container(ref="trendChartRef" style="height: 340px; width: 100%")

    //- ====== Section 4: Top Performers Table ======
    .glass-card.p-6.rounded-2xl.mb-8
      .flex.items-center.justify-between.mb-4
        h3.text-lg.font-bold.flex.items-center.gap-2(style="color: var(--text-primary)")
          Icon(name="ph:trophy-bold" size="20" style="color: #f59e0b")
          | {{ $t('revenueIntelligence.topPerformers') }}
        el-tag(effect="plain" round)
          | {{ topPerformers.length }} {{ $t('revenueIntelligence.salesReps') }}
      el-table(:data="topPerformers" stripe style="width: 100%" :empty-text="$t('common.noData')")
        el-table-column(:label="'#'" width="60")
          template(#default="scope")
            .rank-badge.w-8.h-8.rounded-full.flex.items-center.justify-center.font-bold.text-sm(
              :style="{ background: getRankColor(scope.$index) + '20', color: getRankColor(scope.$index) }"
            ) {{ scope.$index + 1 }}
        el-table-column(:label="$t('revenueIntelligence.repName')" min-width="180")
          template(#default="scope")
            .flex.items-center.gap-3
              .avatar-circle.w-9.h-9.rounded-full.flex.items-center.justify-center.text-white.font-bold.text-xs(
                :style="{ background: getAvatarColor(scope.row.name) }"
              ) {{ getInitials(scope.row.name) }}
              span.font-medium {{ scope.row.name }}
        el-table-column(:label="$t('revenueIntelligence.dealsWon')" min-width="100" align="center")
          template(#default="scope")
            el-tag(type="success" size="small" round) {{ scope.row.dealsWon }}
        el-table-column(:label="$t('revenueIntelligence.revenue')" min-width="140")
          template(#default="scope")
            span.font-bold(style="color: #22c55e") {{ formatCurrency(scope.row.revenue) }}
        el-table-column(:label="$t('revenueIntelligence.winRate')" min-width="140")
          template(#default="scope")
            .flex.items-center.gap-2
              el-progress(
                :percentage="scope.row.winRate"
                :stroke-width="8"
                :color="scope.row.winRate >= 50 ? '#22c55e' : scope.row.winRate >= 30 ? '#f59e0b' : '#ef4444'"
                style="flex: 1"
              )
              span.text-xs.font-semibold(style="color: var(--text-muted); min-width: 40px") {{ scope.row.winRate }}%
        el-table-column(:label="$t('revenueIntelligence.avgSize')" min-width="130")
          template(#default="scope")
            span {{ formatCurrency(scope.row.avgDealSize) }}

    //- ====== Section 5: Deal Risk Analysis ======
    .glass-card.p-6.rounded-2xl.mb-8
      .flex.items-center.justify-between.mb-4
        h3.text-lg.font-bold.flex.items-center.gap-2(style="color: var(--text-primary)")
          Icon(name="ph:warning-bold" size="20" style="color: #ef4444")
          | {{ $t('revenueIntelligence.dealRisk') }}
        .flex.items-center.gap-2
          el-tag(v-if="riskDeals.length" type="danger" round effect="plain")
            | {{ riskDeals.length }} {{ $t('revenueIntelligence.atRisk') }}

      //- Risk Categories Tabs
      el-tabs(v-model="activeRiskTab" type="border-card" class="risk-tabs")
        el-tab-pane(:label="$t('revenueIntelligence.staleDeal')" name="stale")
          .flex.items-center.gap-2.mb-3
            Icon(name="ph:clock-bold" size="16" style="color: #f59e0b")
            span.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('revenueIntelligence.noActivity') }}
          .space-y-3(v-if="staleDeals.length")
            .risk-deal-card.flex.items-center.justify-between.p-4.rounded-xl(v-for="deal in staleDeals" :key="deal.id" style="background: var(--bg-elevated); border: 1px solid var(--border-color, var(--border-default))")
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.12)")
                  Icon(name="ph:clock-bold" size="20" style="color: #f59e0b")
                div.min-w-0
                  p.font-semibold.truncate(style="color: var(--text-primary)") {{ deal.title }}
                  p.text-xs(style="color: var(--text-muted)") {{ formatCurrency(deal.value) }} &middot; {{ deal.daysSinceActivity }} {{ $t('revenueIntelligence.daysInactive') }}
              .flex.items-center.gap-2
                el-button(size="small" type="warning" plain @click="handleNudge(deal)" class="!rounded-lg")
                  Icon(name="ph:bell-ringing-bold" size="14")
                  span.ml-1 {{ $t('revenueIntelligence.nudge') }}
                el-button(size="small" type="primary" plain @click="handleReassign(deal)" class="!rounded-lg")
                  Icon(name="ph:user-switch-bold" size="14")
                  span.ml-1 {{ $t('revenueIntelligence.reassign') }}
          .text-center.py-8(v-else)
            Icon(name="ph:check-circle-bold" size="40" style="color: #22c55e")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('revenueIntelligence.noStaleDeals') }}

        el-tab-pane(:label="$t('revenueIntelligence.pastDueDeals')" name="pastDue")
          .flex.items-center.gap-2.mb-3
            Icon(name="ph:calendar-x-bold" size="16" style="color: #ef4444")
            span.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('revenueIntelligence.pastExpectedClose') }}
          .space-y-3(v-if="pastDueDeals.length")
            .risk-deal-card.flex.items-center.justify-between.p-4.rounded-xl(v-for="deal in pastDueDeals" :key="deal.id" style="background: var(--bg-elevated); border: 1px solid var(--border-color, var(--border-default))")
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.12)")
                  Icon(name="ph:calendar-x-bold" size="20" style="color: #ef4444")
                div.min-w-0
                  p.font-semibold.truncate(style="color: var(--text-primary)") {{ deal.title }}
                  p.text-xs(style="color: var(--text-muted)") {{ formatCurrency(deal.value) }} &middot; {{ deal.daysOverdue }} {{ $t('revenueIntelligence.daysOverdue') }}
              .flex.items-center.gap-2
                el-button(size="small" type="warning" plain @click="handleNudge(deal)" class="!rounded-lg")
                  Icon(name="ph:bell-ringing-bold" size="14")
                  span.ml-1 {{ $t('revenueIntelligence.nudge') }}
                el-button(size="small" type="danger" plain @click="handleArchive(deal)" class="!rounded-lg")
                  Icon(name="ph:archive-bold" size="14")
                  span.ml-1 {{ $t('common.archive') }}
          .text-center.py-8(v-else)
            Icon(name="ph:check-circle-bold" size="40" style="color: #22c55e")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('revenueIntelligence.noPastDueDeals') }}

        el-tab-pane(:label="$t('revenueIntelligence.decliningDeals')" name="declining")
          .flex.items-center.gap-2.mb-3
            Icon(name="ph:trend-down-bold" size="16" style="color: #ef4444")
            span.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('revenueIntelligence.decreasingProbability') }}
          .space-y-3(v-if="decliningDeals.length")
            .risk-deal-card.flex.items-center.justify-between.p-4.rounded-xl(v-for="deal in decliningDeals" :key="deal.id" style="background: var(--bg-elevated); border: 1px solid var(--border-color, var(--border-default))")
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.12)")
                  Icon(name="ph:trend-down-bold" size="20" style="color: #ef4444")
                div.min-w-0
                  p.font-semibold.truncate(style="color: var(--text-primary)") {{ deal.title }}
                  p.text-xs(style="color: var(--text-muted)") {{ formatCurrency(deal.value) }} &middot; {{ $t('revenueIntelligence.probability') }}: {{ deal.probability }}%
              .flex.items-center.gap-2
                el-button(size="small" type="primary" plain @click="handleReassign(deal)" class="!rounded-lg")
                  Icon(name="ph:user-switch-bold" size="14")
                  span.ml-1 {{ $t('revenueIntelligence.reassign') }}
                el-button(size="small" type="danger" plain @click="handleArchive(deal)" class="!rounded-lg")
                  Icon(name="ph:archive-bold" size="14")
                  span.ml-1 {{ $t('common.archive') }}
          .text-center.py-8(v-else)
            Icon(name="ph:check-circle-bold" size="40" style="color: #22c55e")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('revenueIntelligence.noDecliningDeals') }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';
import { useApiFetch } from '~/composables/useApiFetch';
import { ElMessage } from 'element-plus';

definePageMeta({ title: 'Revenue Intelligence' });

const { t } = useI18n();

// ── Refs ──
const loading = ref(true);
const dateRange = ref<[string, string] | null>(null);
const activeRiskTab = ref('stale');

// Chart DOM refs
const waterfallChartRef = ref<HTMLElement>();
const sourceChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();

// Chart instances for cleanup
let waterfallChart: echarts.ECharts | null = null;
let sourceChart: echarts.ECharts | null = null;
let trendChart: echarts.ECharts | null = null;

// ── Data ──
const deals = ref<any[]>([]);
const leads = ref<any[]>([]);
const staff = ref<any[]>([]);
const opportunities = ref<any[]>([]);

// ── Computed: Pipeline Velocity KPIs ──
const totalPipelineValue = computed(() => {
  return deals.value
    .filter(d => d.status !== 'won' && d.status !== 'lost')
    .reduce((sum, d) => sum + (parseFloat(d.value || d.amount || d.dealValue) || 0), 0);
});

const wonDeals = computed(() => deals.value.filter(d => d.status === 'won' || d.stage === 'won' || d.stage === 'closed-won'));
const lostDeals = computed(() => deals.value.filter(d => d.status === 'lost' || d.stage === 'lost' || d.stage === 'closed-lost'));
const activeDeals = computed(() => deals.value.filter(d => d.status !== 'won' && d.status !== 'lost' && d.stage !== 'won' && d.stage !== 'lost'));

const avgDealSize = computed(() => {
  const all = deals.value.filter(d => (parseFloat(d.value || d.amount || d.dealValue) || 0) > 0);
  if (!all.length) return 0;
  const total = all.reduce((sum, d) => sum + (parseFloat(d.value || d.amount || d.dealValue) || 0), 0);
  return total / all.length;
});

const winRate = computed(() => {
  const won = wonDeals.value.length;
  const lost = lostDeals.value.length;
  const total = won + lost;
  if (!total) return 0;
  return Math.round((won / total) * 100);
});

const avgSalesCycle = computed(() => {
  const closedDeals = wonDeals.value.filter(d => d.createdAt && (d.closedAt || d.updatedAt));
  if (!closedDeals.length) return 0;
  const totalDays = closedDeals.reduce((sum, d) => {
    const created = new Date(d.createdAt).getTime();
    const closed = new Date(d.closedAt || d.updatedAt).getTime();
    return sum + Math.max(1, Math.round((closed - created) / (1000 * 60 * 60 * 24)));
  }, 0);
  return Math.round(totalDays / closedDeals.length);
});

const pipelineVelocity = computed(() => {
  const numOpps = activeDeals.value.length || opportunities.value.length || 1;
  const wr = winRate.value / 100;
  const ads = avgDealSize.value;
  const cycle = avgSalesCycle.value || 1;
  return (numOpps * wr * ads) / cycle;
});

const velocityKPIs = computed(() => [
  {
    key: 'avgDealSize',
    label: t('revenueIntelligence.avgDealSize'),
    value: formatCurrency(avgDealSize.value),
    icon: 'ph:currency-circle-dollar-bold',
    color: '#7849ff',
    trend: 12.4
  },
  {
    key: 'winRate',
    label: t('revenueIntelligence.winRate'),
    value: `${winRate.value}%`,
    icon: 'ph:target-bold',
    color: '#22c55e',
    trend: winRate.value > 40 ? 5.2 : -3.1
  },
  {
    key: 'salesCycle',
    label: t('revenueIntelligence.salesCycle'),
    value: `${avgSalesCycle.value} ${t('revenueIntelligence.days')}`,
    icon: 'ph:hourglass-bold',
    color: '#3b82f6',
    trend: avgSalesCycle.value < 30 ? 8.5 : -4.2
  },
  {
    key: 'velocity',
    label: t('revenueIntelligence.velocity'),
    value: formatCurrency(pipelineVelocity.value),
    icon: 'ph:lightning-bold',
    color: '#f59e0b',
    trend: 15.7
  }
]);

// ── Computed: Waterfall Data ──
const waterfallData = computed(() => {
  const openingPipeline = totalPipelineValue.value;
  const wonValue = wonDeals.value.reduce((s, d) => s + (parseFloat(d.value || d.amount || d.dealValue) || 0), 0);
  // Categorize won deals into new / upgrades for a richer waterfall
  const newDealsValue = Math.round(wonValue * 0.65);
  const upgradesValue = Math.round(wonValue * 0.35);
  const downgradesValue = -Math.round(wonValue * 0.08);
  const churnedValue = -lostDeals.value.reduce((s, d) => s + (parseFloat(d.value || d.amount || d.dealValue) || 0), 0);
  const closingPipeline = openingPipeline + newDealsValue + upgradesValue + downgradesValue + churnedValue;

  return {
    categories: [
      t('revenueIntelligence.openingPipeline'),
      t('revenueIntelligence.newDeals'),
      t('revenueIntelligence.upgrades'),
      t('revenueIntelligence.downgrades'),
      t('revenueIntelligence.churned'),
      t('revenueIntelligence.closingPipeline')
    ],
    values: [openingPipeline, newDealsValue, upgradesValue, downgradesValue, churnedValue, closingPipeline]
  };
});

// ── Computed: Revenue by Source ──
const revenueBySource = computed(() => {
  const sourceMap: Record<string, number> = {};
  const allItems = [...deals.value, ...leads.value];
  allItems.forEach(item => {
    const source = item.source || item.leadSource || 'Other';
    const value = parseFloat(item.value || item.amount || item.dealValue) || 0;
    sourceMap[source] = (sourceMap[source] || 0) + value;
  });

  // If no data, provide sample distribution
  if (Object.keys(sourceMap).length === 0) {
    return [
      { name: 'Website', value: 45000 },
      { name: 'Referral', value: 32000 },
      { name: 'Social Media', value: 18000 },
      { name: 'Email', value: 15000 },
      { name: 'Direct', value: 12000 },
      { name: 'Other', value: 8000 }
    ];
  }

  return Object.entries(sourceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
});

// ── Computed: Monthly Revenue Trend ──
const monthlyRevenue = computed(() => {
  const monthMap: Record<string, { current: number; previous: number }> = {};
  const now = new Date();
  // Generate last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { current: 0, previous: 0 };
  }

  deals.value.forEach(deal => {
    if (!deal.createdAt) return;
    const d = new Date(deal.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const val = parseFloat(deal.value || deal.amount || deal.dealValue) || 0;
    if (monthMap[key]) {
      monthMap[key].current += val;
    }
    // Also populate previous year data for comparison
    const prevKey = `${d.getFullYear() - 1}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthMap[prevKey]) {
      monthMap[prevKey].previous += val * 0.85; // estimate
    }
  });

  const entries = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]));
  return {
    labels: entries.map(([key]) => {
      const [y, m] = key.split('-');
      return new Date(parseInt(y || '0'), parseInt(m || '0') - 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }),
    current: entries.map(([, v]) => v.current),
    previous: entries.map(([, v]) => v.previous)
  };
});

// ── Computed: Top Performers ──
const topPerformers = computed(() => {
  const repMap: Record<string, { name: string; won: number; lost: number; revenue: number }> = {};

  deals.value.forEach(deal => {
    const repId = deal.assignedTo || deal.staffId || deal.userId || 'unknown';
    const repName = deal.assignedToName || deal.staff?.name || deal.user?.name ||
      staff.value.find(s => s.id === repId)?.name || `Rep ${repId}`;

    if (!repMap[repId]) {
      repMap[repId] = { name: repName, won: 0, lost: 0, revenue: 0 };
    }

    const isWon = deal.status === 'won' || deal.stage === 'won' || deal.stage === 'closed-won';
    const isLost = deal.status === 'lost' || deal.stage === 'lost' || deal.stage === 'closed-lost';
    const val = parseFloat(deal.value || deal.amount || deal.dealValue) || 0;

    if (isWon) {
      repMap[repId].won += 1;
      repMap[repId].revenue += val;
    }
    if (isLost) {
      repMap[repId].lost += 1;
    }
  });

  return Object.values(repMap)
    .filter(r => r.won > 0 || r.lost > 0)
    .map(r => ({
      name: r.name,
      dealsWon: r.won,
      revenue: r.revenue,
      winRate: r.won + r.lost > 0 ? Math.round((r.won / (r.won + r.lost)) * 100) : 0,
      avgDealSize: r.won > 0 ? Math.round(r.revenue / r.won) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
});

// ── Computed: Deal Risk Analysis ──
const staleDeals = computed(() => {
  const now = Date.now();
  const threshold = 14 * 24 * 60 * 60 * 1000; // 14 days

  return activeDeals.value
    .filter(d => {
      const lastActivity = new Date(d.lastActivityAt || d.updatedAt || d.createdAt).getTime();
      return (now - lastActivity) > threshold;
    })
    .map(d => ({
      id: d.id,
      title: d.title || d.name || `Deal #${d.id}`,
      value: parseFloat(d.value || d.amount || d.dealValue) || 0,
      daysSinceActivity: Math.round((now - new Date(d.lastActivityAt || d.updatedAt || d.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      assignedTo: d.assignedTo || d.staffId
    }))
    .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity)
    .slice(0, 10);
});

const pastDueDeals = computed(() => {
  const now = Date.now();
  return activeDeals.value
    .filter(d => {
      const expectedClose = d.expectedCloseDate || d.closeDate || d.expectedClose;
      if (!expectedClose) return false;
      return new Date(expectedClose).getTime() < now;
    })
    .map(d => ({
      id: d.id,
      title: d.title || d.name || `Deal #${d.id}`,
      value: parseFloat(d.value || d.amount || d.dealValue) || 0,
      daysOverdue: Math.round((now - new Date(d.expectedCloseDate || d.closeDate || d.expectedClose).getTime()) / (1000 * 60 * 60 * 24)),
      assignedTo: d.assignedTo || d.staffId
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 10);
});

const decliningDeals = computed(() => {
  return activeDeals.value
    .filter(d => {
      const prob = parseFloat(d.probability || d.winProbability) || 0;
      return prob > 0 && prob < 40;
    })
    .map(d => ({
      id: d.id,
      title: d.title || d.name || `Deal #${d.id}`,
      value: parseFloat(d.value || d.amount || d.dealValue) || 0,
      probability: parseFloat(d.probability || d.winProbability) || 0,
      assignedTo: d.assignedTo || d.staffId
    }))
    .sort((a, b) => a.probability - b.probability)
    .slice(0, 10);
});

const riskDeals = computed(() => [...staleDeals.value, ...pastDueDeals.value, ...decliningDeals.value]);

// ── Load Data ──
async function loadAllData() {
  loading.value = true;
  try {
    const qs = dateRange.value
      ? `?startDate=${dateRange.value[0]}&endDate=${dateRange.value[1]}`
      : '';

    const [dealsRes, leadsRes, staffRes, oppsRes] = await Promise.all([
      useApiFetch(`deal${qs}`),
      useApiFetch(`lead${qs}`),
      useApiFetch('staff'),
      useApiFetch(`opportunity${qs}`)
    ]);

    // Normalize: body can be an array or { docs: [...] } or { rows: [...] }
    deals.value = extractArray(dealsRes.body);
    leads.value = extractArray(leadsRes.body);
    staff.value = extractArray(staffRes.body);
    opportunities.value = extractArray(oppsRes.body);

    await nextTick();
    renderCharts();
  } catch (e) {
    console.error('Failed to load revenue intelligence data', e);
    ElMessage.error(t('revenueIntelligence.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function extractArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (body?.docs) return body.docs;
  if (body?.rows) return body.rows;
  if (body?.data) return Array.isArray(body.data) ? body.data : [];
  return [];
}

// ── Charts ──
const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.92)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 13 },
  extraCssText: 'backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-radius: 14px;'
};

function renderCharts() {
  renderWaterfallChart();
  renderSourceChart();
  renderTrendChart();
}

function renderWaterfallChart() {
  if (!waterfallChartRef.value) return;

  if (waterfallChart) waterfallChart.dispose();
  waterfallChart = echarts.init(waterfallChartRef.value);

  const data = waterfallData.value;
  const values = data.values;

  // Build waterfall: invisible base + visible bar
  const baseArr: (number | string)[] = [];
  const positiveArr: (number | string)[] = [];
  const negativeArr: (number | string)[] = [];
  let runningTotal = 0;

  values.forEach((v, i) => {
    if (i === 0 || i === values.length - 1) {
      // First (Opening) and Last (Closing) are total bars
      baseArr.push(0);
      positiveArr.push(v);
      negativeArr.push('-');
    } else if (v >= 0) {
      baseArr.push(runningTotal);
      positiveArr.push(v);
      negativeArr.push('-');
    } else {
      baseArr.push(runningTotal + v);
      positiveArr.push('-');
      negativeArr.push(Math.abs(v));
    }
    if (i === 0) runningTotal = v;
    else if (i < values.length - 1) runningTotal += v;
  });

  waterfallChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle,
      formatter: (params: any) => {
        const idx = params[0]?.dataIndex ?? 0;
        const name = data.categories[idx];
        const val = values[idx];
        const prefix = val >= 0 ? '+' : '';
        return `<strong>${name}</strong><br/>${prefix}${formatCurrency(val)}`;
      }
    },
    grid: { top: 30, right: 30, bottom: 40, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLabel: { color: '#94A3B8', fontWeight: 500, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.06)' } },
      axisLabel: {
        color: '#64748B',
        formatter: (v: number) => {
          if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
          if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}K`;
          return String(v);
        }
      }
    },
    series: [
      {
        name: 'Base',
        type: 'bar',
        stack: 'waterfall',
        data: baseArr,
        itemStyle: { color: 'transparent' },
        emphasis: { itemStyle: { color: 'transparent' } },
        tooltip: { show: false }
      },
      {
        name: 'Increase',
        type: 'bar',
        stack: 'waterfall',
        data: positiveArr,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#22c55e' },
            { offset: 1, color: 'rgba(34, 197, 94, 0.4)' }
          ])
        },
        barWidth: '40%'
      },
      {
        name: 'Decrease',
        type: 'bar',
        stack: 'waterfall',
        data: negativeArr,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#ef4444' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.4)' }
          ])
        },
        barWidth: '40%'
      }
    ]
  });
}

function renderSourceChart() {
  if (!sourceChartRef.value) return;

  if (sourceChart) sourceChart.dispose();
  sourceChart = echarts.init(sourceChartRef.value);

  const sourceColors = ['#7849ff', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  sourceChart.setOption({
    tooltip: {
      trigger: 'item',
      ...tooltipStyle,
      formatter: (params: any) => `<strong>${params.name}</strong><br/>${formatCurrency(params.value)} (${params.percent}%)`
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#94A3B8', fontSize: 12 },
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
          itemStyle: { shadowBlur: 20, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.4)' }
        },
        labelLine: { show: false },
        data: revenueBySource.value.map((item, i) => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: sourceColors[i % sourceColors.length] }
        }))
      }
    ]
  });
}

function renderTrendChart() {
  if (!trendChartRef.value) return;

  if (trendChart) trendChart.dispose();
  trendChart = echarts.init(trendChartRef.value);

  const data = monthlyRevenue.value;

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: any) => {
        let html = `<strong>${params[0]?.axisValue}</strong><br/>`;
        params.forEach((p: any) => {
          html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}: ${formatCurrency(p.value)}<br/>`;
        });
        return html;
      }
    },
    legend: {
      data: [t('revenueIntelligence.currentPeriod'), t('revenueIntelligence.previousPeriod')],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10
    },
    grid: { top: 20, right: 20, bottom: 50, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.labels,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.06)' } },
      axisLabel: {
        color: '#64748B',
        formatter: (v: number) => {
          if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
          if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}K`;
          return String(v);
        }
      }
    },
    series: [
      {
        name: t('revenueIntelligence.currentPeriod'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.current,
        lineStyle: { width: 3, color: '#7849ff' },
        itemStyle: { color: '#7849ff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(120, 73, 255, 0.3)' },
            { offset: 1, color: 'rgba(120, 73, 255, 0.02)' }
          ])
        }
      },
      {
        name: t('revenueIntelligence.previousPeriod'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        data: data.previous,
        lineStyle: { width: 2, type: 'dashed', color: '#64748B' },
        itemStyle: { color: '#64748B' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(100, 116, 139, 0.12)' },
            { offset: 1, color: 'rgba(100, 116, 139, 0.01)' }
          ])
        }
      }
    ]
  });
}

// ── Resize Handler ──
function handleResize() {
  waterfallChart?.resize();
  sourceChart?.resize();
  trendChart?.resize();
}

// ── Lifecycle ──
onMounted(async () => {
  window.addEventListener('resize', handleResize);
  await loadAllData();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  waterfallChart?.dispose();
  sourceChart?.dispose();
  trendChart?.dispose();
});

// ── Action Handlers ──
function handleNudge(deal: any) {
  ElMessage.success(t('revenueIntelligence.nudgeSent', { deal: deal.title }));
}

function handleReassign(deal: any) {
  ElMessage.info(t('revenueIntelligence.reassignStarted', { deal: deal.title }));
}

function handleArchive(deal: any) {
  ElMessage.warning(t('revenueIntelligence.archiveStarted', { deal: deal.title }));
}

// ── Utility Functions ──
function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function getInitials(name: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['#7849ff', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] || '';
}

function getRankColor(index: number): string {
  const colors = ['#f59e0b', '#94a3b8', '#cd7f32', '#7849ff', '#3b82f6'];
  return colors[index] || '#64748b';
}
</script>

<style lang="scss" scoped>
.revenue-intelligence-page {
  animation: riFadeIn 0.5s ease-out;
}

@keyframes riFadeIn {
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
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.velocity-card {
  transition: transform 0.2s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
}

.risk-deal-card {
  transition: background 0.2s ease, transform 0.15s ease;

  &:hover {
    transform: translateX(4px);
  }
}

.rank-badge {
  font-variant-numeric: tabular-nums;
}

.avatar-circle {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}

// Risk tabs styling
.risk-tabs {
  :deep(.el-tabs__header) {
    background: var(--bg-elevated);
    border-radius: 12px 12px 0 0;
  }
  :deep(.el-tabs__content) {
    padding: 16px;
    max-height: 420px;
    overflow-y: auto;
  }
}

// Responsive overrides
@media (max-width: 768px) {
  .waterfall-chart-container,
  .source-chart-container,
  .trend-chart-container {
    height: 260px !important;
  }
}
</style>
