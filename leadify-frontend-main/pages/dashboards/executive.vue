<template lang="pug">
.executive-dashboard.p-6
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") Executive Dashboard
      p.text-sm(style="color: var(--text-muted)") Real-time business intelligence & KPIs
    .flex.items-center.gap-3
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        range-separator="to"
        start-placeholder="Start"
        end-placeholder="End"
        size="default"
        @change="refreshData"
      )
      el-button(:loading="refreshing" @click="refreshData")
        Icon(name="ph:arrows-clockwise" size="16")
        span.ml-1 Refresh

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
          | Revenue Trend
        .flex.gap-2
          el-button(
            v-for="period in ['Weekly', 'Monthly', 'Quarterly']"
            :key="period"
            :type="revenuePeriod === period ? 'primary' : ''"
            size="small"
            @click="revenuePeriod = period"
            :class="revenuePeriod === period ? '!bg-[#7849ff] !border-none' : ''"
          ) {{ period }}
      .revenue-chart
        .flex.items-end.gap-2(style="height: 200px")
          .flex.flex-col.items-center.flex-1(v-for="(bar, i) in revenueData" :key="i")
            .w-full.rounded-t-lg.transition-all.duration-500(
              :style="{ height: bar.height + '%', background: `linear-gradient(to top, #7849ff, ${bar.isCurrentMonth ? '#a855f7' : '#7849ff80'})`, minHeight: '4px' }"
            )
            p.text-xs.mt-2(style="color: var(--text-muted)") {{ bar.label }}
        .flex.justify-between.mt-4.px-2
          span.text-xs(style="color: var(--text-muted)") Total: ${{ totalRevenue.toLocaleString() }}
          span.text-xs(style="color: #10b981") Avg: ${{ avgRevenue.toLocaleString() }}/mo

    //- Pipeline Funnel
    .glass-card.p-6.rounded-2xl
      h3.text-sm.font-bold.mb-6(style="color: var(--text-primary)")
        Icon(name="ph:funnel" size="16" class="mr-2" style="color: #7849ff")
        | Sales Pipeline
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
        | Top Sales Reps
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
        p.text-sm(style="color: var(--text-muted)") No data available

    //- Recent Deals
    .glass-card.p-6.rounded-2xl
      .flex.items-center.justify-between.mb-4
        h3.text-sm.font-bold(style="color: var(--text-primary)")
          Icon(name="ph:handshake" size="16" class="mr-2" style="color: #7849ff")
          | Recent Deals
        NuxtLink(to="/sales/deals")
          el-button(text size="small") View All
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
        p.text-sm(style="color: var(--text-muted)") No recent deals

  //- Third Row: Goals Progress + Quick Stats
  .grid.gap-6(class="lg:grid-cols-3")
    //- Goal Progress (2 cols)
    .glass-card.p-6.rounded-2xl(class="lg:col-span-2")
      h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:target" size="16" class="mr-2" style="color: #7849ff")
        | Goal Progress
      .grid.gap-4(class="md:grid-cols-2")
        .p-4.rounded-xl(v-for="goal in goals" :key="goal.label" style="background: var(--bg-input); border: 1px solid var(--glass-border)")
          .flex.justify-between.mb-2
            span.text-sm.font-medium(style="color: var(--text-primary)") {{ goal.label }}
            span.text-sm.font-bold(:style="{ color: goal.percentage >= 100 ? '#10b981' : goal.percentage >= 70 ? '#f59e0b' : '#ef4444' }") {{ goal.percentage }}%
          .w-full.rounded-full.overflow-hidden(style="height: 8px; background: var(--glass-border)")
            .h-full.rounded-full.transition-all(:style="{ width: Math.min(goal.percentage, 100) + '%', background: goal.percentage >= 100 ? '#10b981' : goal.percentage >= 70 ? '#f59e0b' : '#7849ff' }")
          .flex.justify-between.mt-2
            span.text-xs(style="color: var(--text-muted)") {{ goal.current }}
            span.text-xs(style="color: var(--text-muted)") Target: {{ goal.target }}

    //- Quick Actions
    .glass-card.p-6.rounded-2xl
      h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:lightning" size="16" class="mr-2" style="color: #f59e0b")
        | Quick Actions
      .space-y-2
        NuxtLink(v-for="action in quickActions" :key="action.label" :to="action.link")
          .flex.items-center.gap-3.p-3.rounded-xl.cursor-pointer.transition-all(style="border: 1px solid var(--glass-border)" class="hover:border-[#7849ff]")
            .w-9.h-9.rounded-lg.flex.items-center.justify-center(:style="{ background: action.color + '20' }")
              Icon(:name="action.icon" size="18" :style="{ color: action.color }")
            span.text-sm.font-medium(style="color: var(--text-primary)") {{ action.label }}
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });

const refreshing = ref(false);
const dateRange = ref<[Date, Date] | null>(null);
const revenuePeriod = ref('Monthly');

// KPI Cards
const kpiCards = ref([
  { label: 'Total Revenue', value: '$0', icon: 'ph:currency-dollar-bold', color: '#10b981', trend: 0 },
  { label: 'Pipeline Value', value: '$0', icon: 'ph:funnel-bold', color: '#7849ff', trend: 0 },
  { label: 'Deals Won', value: '0', icon: 'ph:trophy-bold', color: '#f59e0b', trend: 0 },
  { label: 'Win Rate', value: '0%', icon: 'ph:target-bold', color: '#3b82f6', trend: 0 },
  { label: 'Avg Deal Size', value: '$0', icon: 'ph:chart-bar-bold', color: '#a855f7', trend: 0 },
  { label: 'Active Clients', value: '0', icon: 'ph:users-bold', color: '#06b6d4', trend: 0 }
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
  { label: 'Monthly Revenue', current: '$0', target: '$100,000', percentage: 0 },
  { label: 'New Clients', current: '0', target: '20', percentage: 0 },
  { label: 'Deals Closed', current: '0', target: '15', percentage: 0 },
  { label: 'Avg Response Time', current: '0h', target: '< 4h', percentage: 0 }
]);

// Quick Actions
const quickActions = [
  { label: 'Create New Deal', icon: 'ph:plus-circle', color: '#7849ff', link: '/sales/deals/create' },
  { label: 'View Pipeline', icon: 'ph:kanban', color: '#3b82f6', link: '/sales/deals' },
  { label: 'Create Invoice', icon: 'ph:receipt', color: '#10b981', link: '/documents/editor' },
  { label: 'View Reports', icon: 'ph:chart-bar', color: '#f59e0b', link: '/reports' },
  { label: 'Customer 360', icon: 'ph:address-book', color: '#a855f7', link: '/crm/customer-360' }
];

async function refreshData() {
  refreshing.value = true;
  try {
    await Promise.all([loadKPIs(), loadRevenue(), loadPipeline(), loadTopReps(), loadRecentDeals()]);
  } finally {
    refreshing.value = false;
  }
}

async function loadKPIs() {
  try {
    // Load deals for KPI calculations
    const { body, success } = await useApiFetch('deal?limit=500');
    if (!success || !body) return;
    const data = body as any;
    const deals = data.docs || data || [];

    const wonDeals = deals.filter((d: any) => d.status === 'WON');
    const lostDeals = deals.filter((d: any) => d.status === 'LOST');
    const totalValue = wonDeals.reduce((s: number, d: any) => s + Number(d.value || 0), 0);
    const pipelineVal = deals
      .filter((d: any) => d.status !== 'WON' && d.status !== 'LOST')
      .reduce((s: number, d: any) => s + Number(d.value || 0), 0);
    const winRate = wonDeals.length + lostDeals.length > 0 ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100) : 0;
    const avgDeal = wonDeals.length > 0 ? Math.round(totalValue / wonDeals.length) : 0;

    // Load clients count
    const clientRes = await useApiFetch('client?limit=1');
    const clientData = clientRes.body as any;
    const clientCount = clientData?.pagination?.totalItems || clientData?.total || 0;

    kpiCards.value = [
      { label: 'Total Revenue', value: '$' + totalValue.toLocaleString(), icon: 'ph:currency-dollar-bold', color: '#10b981', trend: 12 },
      { label: 'Pipeline Value', value: '$' + pipelineVal.toLocaleString(), icon: 'ph:funnel-bold', color: '#7849ff', trend: 8 },
      { label: 'Deals Won', value: String(wonDeals.length), icon: 'ph:trophy-bold', color: '#f59e0b', trend: 5 },
      { label: 'Win Rate', value: winRate + '%', icon: 'ph:target-bold', color: '#3b82f6', trend: 3 },
      { label: 'Avg Deal Size', value: '$' + avgDeal.toLocaleString(), icon: 'ph:chart-bar-bold', color: '#a855f7', trend: -2 },
      { label: 'Active Clients', value: String(clientCount), icon: 'ph:users-bold', color: '#06b6d4', trend: 15 }
    ];
  } catch {
    /* silent */
  }
}

async function loadRevenue() {
  try {
    const { body, success } = await useApiFetch('deal?status=WON&limit=500');
    if (!success || !body) return;
    const data = body as any;
    const deals = data.docs || data || [];

    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      months[key] = 0;
    }

    deals.forEach((deal: any) => {
      const d = new Date(deal.closeDate || deal.updatedAt || deal.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      if (key in months) months[key] += Number(deal.value || 0);
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
  } catch {
    /* silent */
  }
}

async function loadPipeline() {
  try {
    const { body, success } = await useApiFetch('deal?limit=500');
    if (!success || !body) return;
    const data = body as any;
    const deals = data.docs || data || [];

    const stageMap: Record<string, { count: number; value: number }> = {};
    const stageOrder = ['QUALIFIED', 'CONTACT_MADE', 'DEMO_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION'];
    const colors = ['#7849ff', '#3b82f6', '#06b6d4', '#f59e0b', '#10b981'];

    stageOrder.forEach(s => {
      stageMap[s] = { count: 0, value: 0 };
    });

    deals.forEach((d: any) => {
      const stage = d.stage || 'QUALIFIED';
      if (!stageMap[stage]) stageMap[stage] = { count: 0, value: 0 };
      stageMap[stage].count++;
      stageMap[stage].value += Number(d.value || 0);
    });

    const maxCount = Math.max(...Object.values(stageMap).map(s => s.count), 1);

    pipelineStages.value = stageOrder.map((name, i) => ({
      name: name.replace(/_/g, ' '),
      count: stageMap[name]?.count || 0,
      value: stageMap[name]?.value || 0,
      width: ((stageMap[name]?.count || 0) / maxCount) * 100,
      color: colors[i]
    }));
  } catch {
    /* silent */
  }
}

async function loadTopReps() {
  try {
    const { body, success } = await useApiFetch('deal?status=WON&limit=500');
    if (!success || !body) return;
    const data = body as any;
    const deals = data.docs || data || [];

    const repMap: Record<string, { name: string; revenue: number }> = {};
    deals.forEach((d: any) => {
      const owner = d.owner || d.assignee;
      if (!owner) return;
      const key = owner.id || owner.name;
      if (!repMap[key]) repMap[key] = { name: owner.name || 'Unknown', revenue: 0 };
      repMap[key].revenue += Number(d.value || 0);
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
  } catch {
    /* silent */
  }
}

async function loadRecentDeals() {
  try {
    const { body, success } = await useApiFetch('deal?limit=8&sort=-updatedAt');
    if (!success || !body) return;
    const data = body as any;
    const deals = data.docs || data || [];

    recentDeals.value = deals.map((d: any) => ({
      id: d.id,
      name: d.name,
      client: d.client?.clientName || d.client?.name || '--',
      value: d.value || 0,
      status: d.status,
      date: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : '--'
    }));
  } catch {
    /* silent */
  }
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
