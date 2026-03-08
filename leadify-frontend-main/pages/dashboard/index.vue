<template lang="pug">
div
  ModuleHeader(
    :title="$t('executiveDashboard.title')"
    :subtitle="$t('executiveDashboard.subtitle')"
  )
    template(#actions)
      NuxtLink(to="/dashboard/custom")
        el-button(size="large" class="!rounded-2xl")
          Icon(name="ph:squares-four-bold" size="16")
          span.ml-1 {{ $t('executiveDashboard.customDashboard') }}
      el-button(size="large" type="primary" @click="refresh" :loading="refreshing" class="!rounded-2xl")
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-1 {{ $t('executiveDashboard.refresh') }}

  //- Skeleton Loading State
  .dashboard-skeleton(v-if="loading")
    SkeletonStats
    .grid.grid-cols-1.gap-6.mt-6(class="lg:grid-cols-2")
      SkeletonChart
      SkeletonChart

  //- KPI Stat Cards
  StatCards(v-if="!loading" :stats="kpiCards" :columns="4")

  //- Main Grid: Left (wider) + Right sidebar
  .grid.grid-cols-1.gap-6.mt-2(v-if="!loading" class="lg:grid-cols-3")
    //- Left Column
    .space-y-6(class="lg:col-span-2")
      //- Revenue Chart
      .glass-card.p-6.animate-entrance
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('executiveDashboard.revenueOverview') }}
          el-select(v-model="revenuePeriod" size="small" class="w-32" @change="loadRevenueChart")
            el-option(value="monthly" :label="$t('executiveDashboard.monthly')")
            el-option(value="quarterly" :label="$t('executiveDashboard.quarterly')")
            el-option(value="yearly" :label="$t('executiveDashboard.yearly')")
        .chart-container(v-loading="loadingRevenue")
          ClientOnly
            VChart(v-if="revenueChartOption" :option="revenueChartOption" autoresize style="height: 320px")
          .text-center.py-12(v-if="!revenueChartOption && !loadingRevenue")
            Icon(name="ph:chart-line-up" size="48" style="color: var(--text-muted)")
            p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('executiveDashboard.noRevenueData') }}

      //- Pipeline Chart
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.1s")
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('executiveDashboard.salesPipeline') }}
        .chart-container(v-loading="loadingPipeline")
          ClientOnly
            VChart(v-if="pipelineChartOption" :option="pipelineChartOption" autoresize style="height: 300px")
          .text-center.py-12(v-if="!pipelineChartOption && !loadingPipeline")
            Icon(name="ph:funnel" size="48" style="color: var(--text-muted)")
            p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('executiveDashboard.noPipelineData') }}

    //- Right Column
    .space-y-6
      //- Recent Activities
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.15s")
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('executiveDashboard.recentActivities') }}
          NuxtLink.text-sm(to="/settings/audit-logs" style="color: var(--accent-color, #7849ff)") {{ $t('executiveDashboard.viewAll') }}
        .space-y-3(v-loading="loadingActivities")
          .flex.items-start.gap-3(v-for="activity in activities" :key="activity.id")
            .w-8.h-8.rounded-full.flex.items-center.justify-center.shrink-0(:style="{ background: getActivityColor(activity.status) + '20' }")
              Icon(:name="getActivityIcon(activity.status)" size="14" :style="{ color: getActivityColor(activity.status) }")
            div
              p.text-sm.font-medium(style="color: var(--text-primary)") {{ activity.description || activity.entityType }}
              div(class="flex items-center gap-2 mt-0.5")
                span.text-xs(style="color: var(--text-muted)") {{ activity.user?.name || 'System' }}
                span.text-xs(style="color: var(--text-muted)") {{ formatTimeAgo(activity.createdAt) }}
          .text-center.py-4(v-if="!activities.length && !loadingActivities")
            p.text-sm(style="color: var(--text-muted)") {{ $t('executiveDashboard.noActivities') }}

      //- Tasks Due Today
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.2s")
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('executiveDashboard.tasksDueToday') }}
          el-tag(size="small" type="warning" effect="dark" round) {{ pendingTasks.length }}
        .space-y-2(v-loading="loadingTasks")
          .flex.items-center.gap-3.p-3.rounded-xl(
            v-for="task in pendingTasks"
            :key="task.id"
            style="background: var(--bg-input); border: 1px solid var(--border-default)"
          )
            .w-2.h-2.rounded-full.shrink-0(:class="getPriorityColor(task.priority)")
            div.flex-1.min-w-0
              p.text-sm.font-medium.truncate(style="color: var(--text-primary)") {{ task.name || task.description }}
              p.text-xs(style="color: var(--text-muted)") {{ task.projectName || task.entityType || '' }}
            el-tag(v-if="task.priority" size="small" :type="getPriorityTagType(task.priority)" effect="plain" round) {{ task.priority }}
          .text-center.py-4(v-if="!pendingTasks.length && !loadingTasks")
            Icon(name="ph:check-circle" size="32" style="color: var(--text-muted)")
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('executiveDashboard.noTasks') }}

      //- Top Deals
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.25s")
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('executiveDashboard.topDeals') }}
          NuxtLink.text-sm(to="/sales/deals" style="color: var(--accent-color, #7849ff)") {{ $t('executiveDashboard.viewAll') }}
        .space-y-2(v-loading="loadingSummary")
          .flex.items-center.justify-between.p-3.rounded-xl(
            v-for="deal in topDeals"
            :key="deal.id"
            style="background: var(--bg-input); border: 1px solid var(--border-default)"
            class="cursor-pointer hover:border-[#7849ff] transition-colors"
            @click="navigateTo(`/sales/deals/${deal.id}`)"
          )
            div.min-w-0.flex-1
              p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ deal.name }}
              p.text-xs(style="color: var(--text-muted)") {{ deal.client?.name || deal.clientName || '' }}
            .text-right.shrink-0
              p.text-sm.font-bold(style="color: #10B981") SAR {{ formatLargeNumber(deal.price || 0) }}
              el-tag(size="small" effect="plain" round) {{ deal.stage }}
          .text-center.py-4(v-if="!topDeals.length && !loadingSummary")
            p.text-sm(style="color: var(--text-muted)") {{ $t('executiveDashboard.noDeals') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { getIncreaseLineChart, getBarChartData } from '~/composables/charts';
import { fetchExecutiveSummary, fetchPipelineData, fetchRevenueChart } from '~/composables/useDashboard';

// Lazy-load heavy chart dependencies for faster initial page load
const VChart = defineAsyncComponent(() =>
  Promise.all([
    import('echarts/core'),
    import('echarts/renderers'),
    import('echarts/charts'),
    import('echarts/components'),
    import('vue-echarts')
  ]).then(
    ([{ use }, { CanvasRenderer }, { BarChart, LineChart }, { TitleComponent, TooltipComponent, LegendComponent, GridComponent }, VChartModule]) => {
      use([CanvasRenderer, BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);
      return VChartModule;
    }
  )
);

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const refreshing = ref(false);
const loading = ref(true);
const loadingSummary = ref(false);
const loadingRevenue = ref(false);
const loadingPipeline = ref(false);
const loadingActivities = ref(false);
const loadingTasks = ref(false);

const revenuePeriod = ref('monthly');
const summary = ref<Record<string, unknown> | null>(null);
const revenueData = ref<Record<string, unknown> | null>(null);
const pipelineData = ref<Record<string, unknown> | null>(null);
const activities = ref<Record<string, unknown>[]>([]);
const pendingTasks = ref<Record<string, unknown>[]>([]);
const topDeals = ref<Record<string, unknown>[]>([]);

// KPI Cards
const kpiCards = computed(() => [
  {
    label: t('executiveDashboard.totalRevenue'),
    value: summary.value?.totalRevenue ? `SAR ${formatLargeNumber(summary.value.totalRevenue)}` : 'SAR 0',
    icon: 'ph:currency-circle-dollar-bold',
    color: '#10B981',
    trend: summary.value?.revenueTrend ?? undefined
  },
  {
    label: t('executiveDashboard.activeDeals'),
    value: summary.value?.activeDeals ?? 0,
    icon: 'ph:handshake-bold',
    color: '#7849FF',
    trend: summary.value?.dealsTrend ?? undefined
  },
  {
    label: t('executiveDashboard.conversionRate'),
    value: summary.value?.conversionRate ? `${summary.value.conversionRate.toFixed(1)}%` : '0%',
    icon: 'ph:chart-line-up-bold',
    color: '#3B82F6',
    trend: summary.value?.conversionTrend ?? undefined
  },
  {
    label: t('executiveDashboard.pendingTasks'),
    value: summary.value?.pendingTasksCount ?? pendingTasks.value.length,
    icon: 'ph:clipboard-text-bold',
    color: '#F97316',
    trend: undefined
  }
]);

// Revenue Chart
const revenueChartOption = computed(() => {
  if (!revenueData.value?.data?.length) return null;
  const chartData = revenueData.value.data.map(item => ({
    name: item.label || item.month || item.period,
    value: item.value || item.revenue || 0
  }));
  return getIncreaseLineChart(chartData, ['#10B981']);
});

// Pipeline Chart
const pipelineChartOption = computed(() => {
  if (!pipelineData.value?.stages?.length) return null;
  const chartData = pipelineData.value.stages.map(stage => ({
    name: stage.name || stage.stage,
    value: stage.count || stage.value || 0
  }));
  return getBarChartData(chartData, ['#7849FF']);
});

// Data loading
async function loadExecutiveSummary() {
  loadingSummary.value = true;
  try {
    const data = await fetchExecutiveSummary();
    if (data) {
      summary.value = data;
      topDeals.value = data.topDeals || [];
    }
  } catch (e: unknown) {
    console.error('Failed to load executive summary:', e);
  } finally {
    loadingSummary.value = false;
  }
}

async function loadRevenueChart() {
  loadingRevenue.value = true;
  try {
    revenueData.value = await fetchRevenueChart(revenuePeriod.value);
  } catch (e: unknown) {
    console.error('Failed to load revenue chart:', e);
  } finally {
    loadingRevenue.value = false;
  }
}

async function loadPipeline() {
  loadingPipeline.value = true;
  try {
    pipelineData.value = await fetchPipelineData();
  } catch (e: unknown) {
    console.error('Failed to load pipeline:', e);
  } finally {
    loadingPipeline.value = false;
  }
}

async function loadActivities() {
  loadingActivities.value = true;
  try {
    const { body, success } = await useApiFetch('activity?limit=10');
    if (success && body) {
      activities.value = body.docs || body || [];
    }
  } catch (e: unknown) {
    console.error('Failed to load activities:', e);
  } finally {
    loadingActivities.value = false;
  }
}

async function loadPendingTasks() {
  loadingTasks.value = true;
  try {
    const { body, success } = await useApiFetch('tasks/my?status=PENDING&sort=dueDate&limit=5');
    if (success && body) {
      pendingTasks.value = body.docs || body || [];
    }
  } catch (e: unknown) {
    console.error('Failed to load tasks:', e);
  } finally {
    loadingTasks.value = false;
  }
}

async function refresh() {
  refreshing.value = true;
  try {
    await Promise.all([loadExecutiveSummary(), loadRevenueChart(), loadPipeline(), loadActivities(), loadPendingTasks()]);
    ElNotification({ type: 'success', title: t('executiveDashboard.refreshed'), message: '' });
  } finally {
    refreshing.value = false;
  }
}

// Helpers
function getActivityIcon(status: string): string {
  const map: Record<string, string> = {
    create: 'ph:plus-circle-bold',
    update: 'ph:pencil-simple-bold',
    delete: 'ph:trash-bold',
    login: 'ph:sign-in-bold'
  };
  return map[status] || 'ph:activity-bold';
}

function getActivityColor(status: string): string {
  const map: Record<string, string> = {
    create: '#10B981',
    update: '#3B82F6',
    delete: '#EF4444',
    login: '#7849FF'
  };
  return map[status] || '#94A3B8';
}

function formatTimeAgo(date: string): string {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return t('executiveDashboard.justNow');
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };
  return map[priority?.toLowerCase()] || 'bg-gray-400';
}

function getPriorityTagType(priority: string): string {
  const map: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  };
  return map[priority?.toLowerCase()] || 'info';
}

// Init
onMounted(async () => {
  try {
    await Promise.all([loadExecutiveSummary(), loadRevenueChart(), loadPipeline(), loadActivities(), loadPendingTasks()]);
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.chart-container {
  min-height: 200px;
}
</style>
