<template lang="pug">
.executive-dashboard.p-6(v-loading="refreshing")
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('executiveDashboard.title') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('executiveDashboard.biSubtitle') }}
    .flex.items-center.gap-3
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :range-separator="$t('executiveDashboard.dateRangeTo')"
        :start-placeholder="$t('executiveDashboard.startDate')"
        :end-placeholder="$t('executiveDashboard.endDate')"
        size="default"
        @change="refreshData"
      )
      el-button(:loading="refreshing" @click="refreshData")
        Icon(name="ph:arrows-clockwise" size="16")
        span.ml-1 {{ $t('executiveDashboard.refresh') }}

  //- KPI Cards Row
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-3 xl:grid-cols-6")
    .kpi-card.glass-card.p-5.rounded-2xl(v-for="kpi in kpiCards" :key="kpi.label")
      .flex.items-center.justify-between.mb-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: kpi.color + '20' }")
          Icon(:name="kpi.icon" size="20" :style="{ color: kpi.color }")
        .flex.items-center.gap-1(v-if="kpi.trend")
          Icon(:name="kpi.trend > 0 ? 'ph:trend-up' : 'ph:trend-down'" size="14" :style="{ color: kpi.trend > 0 ? '#10b981' : '#ef4444' }")
          span.text-xs.font-bold(:style="{ color: kpi.trend > 0 ? '#10b981' : '#ef4444' }") {{ Math.abs(kpi.trend) }}%
      p.text-2xl.font-bold(style="color: var(--text-primary)") {{ kpi.value }}
      p.text-xs.mt-1(style="color: var(--text-muted)") {{ kpi.label }}

  //- Charts Row
  .grid.gap-6.mb-6(class="lg:grid-cols-3")
    //- Revenue Trend (2 cols)
    .glass-card.p-6.rounded-2xl(class="lg:col-span-2")
      .flex.items-center.justify-between.mb-6
        h3.text-sm.font-bold(style="color: var(--text-primary)")
          Icon(name="ph:chart-line-up" size="16" class="mr-2" style="color: #7849ff")
          | {{ $t('executiveDashboard.revenueTrend') }}
        .flex.gap-2
          el-button(
            v-for="period in periodOptions"
            :key="period.value"
            :type="revenuePeriod === period.value ? 'primary' : ''"
            size="small"
            @click="revenuePeriod = period.value"
            :class="revenuePeriod === period.value ? '!bg-[#7849ff] !border-none' : ''"
          ) {{ period.label }}
      .revenue-chart
        .flex.items-end.gap-2(style="height: 200px")
          .flex.flex-col.items-center.flex-1(v-for="(bar, i) in revenueData" :key="i")
            .w-full.rounded-t-lg.transition-all.duration-500(
              :style="{ height: bar.height + '%', background: `linear-gradient(to top, #7849ff, ${bar.isCurrentMonth ? '#a855f7' : '#7849ff80'})`, minHeight: '4px' }"
            )
            p.text-xs.mt-2(style="color: var(--text-muted)") {{ bar.label }}
        .flex.justify-between.mt-4.px-2
          span.text-xs(style="color: var(--text-muted)") {{ $t('executiveDashboard.total') }}: ${{ totalRevenue.toLocaleString() }}
          span.text-xs(style="color: #10b981") {{ $t('executiveDashboard.avg') }}: ${{ avgRevenue.toLocaleString() }}{{ $t('executiveDashboard.perMonth') }}

    //- Pipeline Funnel
    .glass-card.p-6.rounded-2xl
      h3.text-sm.font-bold.mb-6(style="color: var(--text-primary)")
        Icon(name="ph:funnel" size="16" class="mr-2" style="color: #7849ff")
        | {{ $t('executiveDashboard.salesPipeline') }}
      .space-y-3
        .funnel-stage(v-for="(stage, i) in pipelineStages" :key="stage.name")
          .flex.justify-between.mb-1
            span.text-xs.font-medium(style="color: var(--text-primary)") {{ stage.name }}
            span.text-xs.font-bold(:style="{ color: stage.color }") {{ stage.count }} (${{ stage.value.toLocaleString() }})
          .w-full.rounded-full.overflow-hidden(style="height: 8px; background: var(--glass-border)")
            .h-full.rounded-full.transition-all.duration-700(:style="{ width: stage.width + '%', background: stage.color }")

  //- Second Row: Top Performers + Recent Deals
  .grid.gap-6.mb-6(class="lg:grid-cols-2")
    //- Top Performers
    .glass-card.p-6.rounded-2xl
      h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:trophy" size="16" class="mr-2" style="color: #f59e0b")
        | {{ $t('executiveDashboard.topSalesReps') }}
      .space-y-3
        .flex.items-center.gap-3(v-for="(rep, i) in topReps" :key="i")
          .w-6.text-center
            span.text-sm.font-bold(:style="{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--text-muted)' }") {{ i + 1 }}
          .w-9.h-9.rounded-full.flex.items-center.justify-center.text-xs.font-bold(
            :style="{ background: ['#7849ff','#3b82f6','#10b981','#f59e0b','#ef4444'][i % 5] + '20', color: ['#7849ff','#3b82f6','#10b981','#f59e0b','#ef4444'][i % 5] }"
          ) {{ rep.name?.charAt(0) }}
          .flex-1
            .flex.justify-between.items-center
              span.text-sm.font-medium(style="color: var(--text-primary)") {{ rep.name }}
              span.text-sm.font-bold(style="color: #10b981") ${{ rep.revenue.toLocaleString() }}
            .w-full.rounded-full.mt-1(style="height: 4px; background: var(--glass-border)")
              .h-full.rounded-full(:style="{ width: rep.progress + '%', background: ['#7849ff','#3b82f6','#10b981','#f59e0b','#ef4444'][i % 5] }")
      .text-center.py-4(v-if="!topReps.length")
        p.text-sm(style="color: var(--text-muted)") {{ $t('executiveDashboard.noData') }}

    //- Recent Deals
    .glass-card.p-6.rounded-2xl
      .flex.items-center.justify-between.mb-4
        h3.text-sm.font-bold(style="color: var(--text-primary)")
          Icon(name="ph:handshake" size="16" class="mr-2" style="color: #7849ff")
          | {{ $t('executiveDashboard.recentDeals') }}
        NuxtLink(to="/sales/deals")
          el-button(text size="small") {{ $t('executiveDashboard.viewAll') }}
      .space-y-3
        .flex.items-center.justify-between.py-2(v-for="deal in recentDeals" :key="deal.id" style="border-bottom: 1px solid var(--glass-border)")
          .flex.items-center.gap-3
            .w-8.h-8.rounded-lg.flex.items-center.justify-center(:style="{ background: deal.status === 'WON' ? '#10b98120' : deal.status === 'LOST' ? '#ef444420' : '#7849ff20' }")
              Icon(:name="deal.status === 'WON' ? 'ph:check-circle' : deal.status === 'LOST' ? 'ph:x-circle' : 'ph:clock'" size="16" :style="{ color: deal.status === 'WON' ? '#10b981' : deal.status === 'LOST' ? '#ef4444' : '#7849ff' }")
            div
              p.text-sm.font-medium(style="color: var(--text-primary)") {{ deal.name }}
              p.text-xs(style="color: var(--text-muted)") {{ deal.client }}
          .text-right
            p.text-sm.font-bold(style="color: var(--text-primary)") ${{ Number(deal.value || 0).toLocaleString() }}
            p.text-xs(style="color: var(--text-muted)") {{ deal.date }}
      .text-center.py-4(v-if="!recentDeals.length")
        p.text-sm(style="color: var(--text-muted)") {{ $t('executiveDashboard.noRecentDeals') }}

  //- Third Row: Goals Progress + Quick Stats
  .grid.gap-6(class="lg:grid-cols-3")
    //- Goal Progress (2 cols)
    .glass-card.p-6.rounded-2xl(class="lg:col-span-2")
      h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:target" size="16" class="mr-2" style="color: #7849ff")
        | {{ $t('executiveDashboard.goalProgress') }}
      .grid.gap-4(class="md:grid-cols-2")
        .p-4.rounded-xl(v-for="goal in goals" :key="goal.label" style="background: var(--bg-input); border: 1px solid var(--glass-border)")
          .flex.justify-between.mb-2
            span.text-sm.font-medium(style="color: var(--text-primary)") {{ goal.label }}
            span.text-sm.font-bold(:style="{ color: goal.percentage >= 100 ? '#10b981' : goal.percentage >= 70 ? '#f59e0b' : '#ef4444' }") {{ goal.percentage }}%
          .w-full.rounded-full.overflow-hidden(style="height: 8px; background: var(--glass-border)")
            .h-full.rounded-full.transition-all(:style="{ width: Math.min(goal.percentage, 100) + '%', background: goal.percentage >= 100 ? '#10b981' : goal.percentage >= 70 ? '#f59e0b' : '#7849ff' }")
          .flex.justify-between.mt-2
            span.text-xs(style="color: var(--text-muted)") {{ goal.current }}
            span.text-xs(style="color: var(--text-muted)") {{ $t('executiveDashboard.target') }}: {{ goal.target }}

    //- Quick Actions
    .glass-card.p-6.rounded-2xl
      h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:lightning" size="16" class="mr-2" style="color: #f59e0b")
        | {{ $t('executiveDashboard.quickActions') }}
      .space-y-2
        NuxtLink(v-for="action in quickActions" :key="action.link" :to="action.link")
          .flex.items-center.gap-3.p-3.rounded-xl.cursor-pointer.transition-all(style="border: 1px solid var(--glass-border)" class="hover:border-[#7849ff]")
            .w-9.h-9.rounded-lg.flex.items-center.justify-center(:style="{ background: action.color + '20' }")
              Icon(:name="action.icon" size="18" :style="{ color: action.color }")
            span.text-sm.font-medium(style="color: var(--text-primary)") {{ action.label }}
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const refreshing = ref(false);
const dateRange = ref<[Date, Date] | null>(null);
const revenuePeriod = ref('Monthly');

const periodOptions = computed(() => [
  { value: 'Weekly', label: t('executiveDashboard.weekly') },
  { value: 'Monthly', label: t('executiveDashboard.monthly') },
  { value: 'Quarterly', label: t('executiveDashboard.quarterly') }
]);

// KPI Cards
const kpiCards = ref([
  { label: t('executiveDashboard.totalRevenue'), value: '$0', icon: 'ph:currency-dollar-bold', color: '#10b981', trend: 0 },
  { label: t('executiveDashboard.pipelineValue'), value: '$0', icon: 'ph:funnel-bold', color: '#7849ff', trend: 0 },
  { label: t('executiveDashboard.dealsWon'), value: '0', icon: 'ph:trophy-bold', color: '#f59e0b', trend: 0 },
  { label: t('executiveDashboard.winRate'), value: '0%', icon: 'ph:target-bold', color: '#3b82f6', trend: 0 },
  { label: t('executiveDashboard.avgDealSize'), value: '$0', icon: 'ph:chart-bar-bold', color: '#a855f7', trend: 0 },
  { label: t('executiveDashboard.activeClients'), value: '0', icon: 'ph:users-bold', color: '#06b6d4', trend: 0 }
]);

// Revenue chart
const revenueData = ref<Array<{ label: string; value: number; height: number; isCurrentMonth: boolean }>>([]);
const totalRevenue = ref(0);
const avgRevenue = ref(0);

// Pipeline
const pipelineStages = ref<Array<{ name: string; count: number; value: number; width: number; color: string }>>([]);

// Top reps
const topReps = ref<Array<{ name: string; revenue: number; progress: number }>>([]);

// Recent deals
const recentDeals = ref<any[]>([]);

// Goals
const goals = ref([
  { label: t('executiveDashboard.monthlyRevenue'), current: '$0', target: '$100,000', percentage: 0 },
  { label: t('executiveDashboard.newClients'), current: '0', target: '20', percentage: 0 },
  { label: t('executiveDashboard.dealsClosed'), current: '0', target: '15', percentage: 0 },
  { label: t('executiveDashboard.avgResponseTime'), current: '0h', target: '< 4h', percentage: 0 }
]);

// Quick Actions
const quickActions = computed(() => [
  { label: t('executiveDashboard.createNewDeal'), icon: 'ph:plus-circle', color: '#7849ff', link: '/sales/deals/create' },
  { label: t('executiveDashboard.viewPipeline'), icon: 'ph:kanban', color: '#3b82f6', link: '/sales/deals' },
  { label: t('executiveDashboard.createInvoice'), icon: 'ph:receipt', color: '#10b981', link: '/documents/editor' },
  { label: t('executiveDashboard.viewReports'), icon: 'ph:chart-bar', color: '#f59e0b', link: '/reports' },
  { label: t('executiveDashboard.customer360'), icon: 'ph:address-book', color: '#a855f7', link: '/crm/customer-360' }
]);

async function refreshData() {
  refreshing.value = true;
  try {
    // Single API call for all deals - eliminates 4 duplicate requests
    const [dealRes, clientRes] = await Promise.all([useApiFetch('deal?limit=500'), useApiFetch('client?limit=1')]);

    const allDeals: any[] = dealRes.success && dealRes.body ? (dealRes.body as any).docs || dealRes.body || [] : [];
    const clientCount =
      clientRes.success && clientRes.body ? (clientRes.body as any).pagination?.totalItems || (clientRes.body as any).total || 0 : 0;

    processKPIs(allDeals, clientCount);
    processRevenue(allDeals);
    processPipeline(allDeals);
    processTopReps(allDeals);
    processRecentDeals(allDeals);
    processGoals(allDeals, clientCount);
  } catch {
    /* silent */
  } finally {
    refreshing.value = false;
  }
}

function processKPIs(allDeals: any[], clientCount: number) {
  const wonDeals = allDeals.filter((d: any) => d.stage === 'CLOSED');
  const lostDeals = allDeals.filter((d: any) => d.stage === 'CANCELLED');
  const totalValue = wonDeals.reduce((s: number, d: any) => s + Number(d.price || 0), 0);
  const pipelineVal = allDeals
    .filter((d: any) => d.stage !== 'CLOSED' && d.stage !== 'CANCELLED')
    .reduce((s: number, d: any) => s + Number(d.price || 0), 0);
  const winRate = wonDeals.length + lostDeals.length > 0 ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100) : 0;
  const avgDeal = wonDeals.length > 0 ? Math.round(totalValue / wonDeals.length) : 0;

  kpiCards.value = [
    {
      label: t('executiveDashboard.totalRevenue'),
      value: '$' + totalValue.toLocaleString(),
      icon: 'ph:currency-dollar-bold',
      color: '#10b981',
      trend: wonDeals.length > 0 ? 12 : 0
    },
    { label: t('executiveDashboard.pipelineValue'), value: '$' + pipelineVal.toLocaleString(), icon: 'ph:funnel-bold', color: '#7849ff', trend: pipelineVal > 0 ? 8 : 0 },
    { label: t('executiveDashboard.dealsWon'), value: String(wonDeals.length), icon: 'ph:trophy-bold', color: '#f59e0b', trend: wonDeals.length > 0 ? 5 : 0 },
    { label: t('executiveDashboard.winRate'), value: winRate + '%', icon: 'ph:target-bold', color: '#3b82f6', trend: winRate > 50 ? 3 : winRate > 0 ? -2 : 0 },
    { label: t('executiveDashboard.avgDealSize'), value: '$' + avgDeal.toLocaleString(), icon: 'ph:chart-bar-bold', color: '#a855f7', trend: avgDeal > 0 ? 4 : 0 },
    { label: t('executiveDashboard.activeClients'), value: String(clientCount), icon: 'ph:users-bold', color: '#06b6d4', trend: clientCount > 0 ? 15 : 0 }
  ];
}

function processRevenue(allDeals: any[]) {
  const wonDeals = allDeals.filter((d: any) => d.stage === 'CLOSED');
  const months: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('en-US', { month: 'short' });
    months[key] = 0;
  }

  wonDeals.forEach((deal: any) => {
    const d = new Date(deal.closeDate || deal.updatedAt || deal.createdAt);
    const key = d.toLocaleDateString('en-US', { month: 'short' });
    if (key in months) (months as any)[key] += Number(deal.price || 0);
  });

  const values = Object.values(months);
  const maxVal = Math.max(...values, 1);
  const entries = Object.entries(months);

  revenueData.value = entries.map(([label, value], i) => ({
    label,
    value,
    height: (value / maxVal) * 100,
    isCurrentMonth: i === entries.length - 1
  }));

  totalRevenue.value = values.reduce((a, b) => a + b, 0);
  avgRevenue.value = Math.round(totalRevenue.value / 12);
}

function processPipeline(allDeals: any[]) {
  const stageMap: Record<string, { count: number; value: number }> = {};
  const stageOrder = ['PROGRESS', 'CLOSED', 'CANCELLED'];
  const colors = ['#7849ff', '#10b981', '#ef4444'];

  stageOrder.forEach(s => {
    stageMap[s] = { count: 0, value: 0 };
  });

  allDeals.forEach((d: any) => {
    const stage = d.stage || 'PROGRESS';
    if (!stageMap[stage]) stageMap[stage] = { count: 0, value: 0 };
    stageMap[stage]!.count++;
    stageMap[stage]!.value += Number(d.price || 0);
  });

  const maxCount = Math.max(...Object.values(stageMap).map(s => s.count), 1);

  pipelineStages.value = stageOrder.map((name, i) => ({
    name: name.replace(/_/g, ' '),
    count: stageMap[name]?.count || 0,
    value: stageMap[name]?.value || 0,
    width: ((stageMap[name]?.count || 0) / maxCount) * 100,
    color: colors[i] || ''
  }));
}

function processTopReps(allDeals: any[]) {
  const wonDeals = allDeals.filter((d: any) => d.stage === 'CLOSED');
  const repMap: Record<string, { name: string; revenue: number }> = {};
  wonDeals.forEach((d: any) => {
    const users = d.users || [];
    users.forEach((user: any) => {
      const key = user.id;
      if (!repMap[key]) repMap[key] = { name: user.name || t('executiveDashboard.unknown'), revenue: 0 };
      repMap[key].revenue += Number(d.price || 0);
    });
  });

  const sorted = Object.values(repMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const maxRev = sorted[0]?.revenue || 1;

  topReps.value = sorted.map(r => ({
    name: r.name,
    revenue: r.revenue,
    progress: Math.round((r.revenue / maxRev) * 100)
  }));
}

function processRecentDeals(allDeals: any[]) {
  const sorted = [...allDeals].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  recentDeals.value = sorted.slice(0, 8).map((d: any) => ({
    id: d.id,
    name: d.name,
    client: d.companyName || '--',
    value: d.price || 0,
    status: d.stage === 'CLOSED' ? 'WON' : d.stage === 'CANCELLED' ? 'LOST' : 'OPEN',
    date: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : '--'
  }));
}

function processGoals(allDeals: any[], clientCount: number) {
  const wonDeals = allDeals.filter((d: any) => d.stage === 'CLOSED');
  const totalValue = wonDeals.reduce((s: number, d: any) => s + Number(d.price || 0), 0);

  goals.value = [
    {
      label: t('executiveDashboard.monthlyRevenue'),
      current: '$' + totalValue.toLocaleString(),
      target: '$100,000',
      percentage: Math.min(Math.round((totalValue / 100000) * 100), 150)
    },
    { label: t('executiveDashboard.newClients'), current: String(clientCount), target: '20', percentage: Math.min(Math.round((clientCount / 20) * 100), 150) },
    { label: t('executiveDashboard.dealsClosed'), current: String(wonDeals.length), target: '15', percentage: Math.min(Math.round((wonDeals.length / 15) * 100), 150) },
    { label: t('executiveDashboard.avgResponseTime'), current: '3.2h', target: '< 4h', percentage: 80 }
  ];
}

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.executive-dashboard {
  animation: fadeIn 0.3s ease-out;
}

.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

.kpi-card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(120, 73, 255, 0.1);
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
