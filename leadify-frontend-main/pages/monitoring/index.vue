<template lang="pug">
div
  //- Header
  ModuleHeader(
    :title="$t('monitoring.title')"
    :subtitle="$t('monitoring.subtitle')"
  )
    template(#actions)
      el-select.w-32(v-model="period" size="large" class="!rounded-2xl" @change="loadRequestMetrics")
        el-option(value="1h" :label="$t('monitoring.period1h')")
        el-option(value="6h" :label="$t('monitoring.period6h')")
        el-option(value="24h" :label="$t('monitoring.period24h')")
      el-button(size="large" type="primary" @click="refreshAll" :loading="refreshing" class="!rounded-2xl")
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-1 {{ $t('monitoring.refresh') }}

  //- Loading State
  .flex.justify-center.py-12(v-if="initialLoading")
    el-skeleton(:rows="8" animated)

  template(v-else)
    //- Health Status Indicators
    .grid.grid-cols-1.gap-4.mb-8(class="md:grid-cols-3")
      .glass-card.p-5.animate-entrance
        .flex.items-center.justify-between
          .flex.items-center.gap-3
            .w-3.h-3.rounded-full(:style="{ background: getHealthColor(healthStatus.api) }")
            div
              p.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('monitoring.apiServer') }}
              p.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('monitoring.status.' + healthStatus.api) }}
          Icon(name="ph:globe-bold" size="24" style="color: var(--accent-color, #7849ff)")
      .glass-card.p-5.animate-entrance(style="animation-delay: 0.05s")
        .flex.items-center.justify-between
          .flex.items-center.gap-3
            .w-3.h-3.rounded-full(:style="{ background: getHealthColor(healthStatus.database) }")
            div
              p.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('monitoring.database') }}
              p.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('monitoring.status.' + healthStatus.database) }}
          Icon(name="ph:database-bold" size="24" style="color: #3b82f6")
      .glass-card.p-5.animate-entrance(style="animation-delay: 0.1s")
        .flex.items-center.justify-between
          .flex.items-center.gap-3
            .w-3.h-3.rounded-full(:style="{ background: getHealthColor(healthStatus.redis) }")
            div
              p.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('monitoring.redis') }}
              p.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('monitoring.status.' + healthStatus.redis) }}
          Icon(name="ph:lightning-bold" size="24" style="color: #ef4444")

    //- KPI Stat Cards
    StatCards(:stats="kpiCards" :columns="4")

    //- Charts Grid
    .grid.grid-cols-1.gap-6.mb-8(class="lg:grid-cols-2")
      //- Request Traffic Chart
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.15s")
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:chart-line-up-bold" size="20" class="mr-2")
            | {{ $t('monitoring.requestTraffic') }}
        .chart-container(v-loading="loadingRequests")
          ClientOnly
            VChart(v-if="requestChartOption" :option="requestChartOption" autoresize style="height: 300px")
          .text-center.py-12(v-if="!requestChartOption && !loadingRequests")
            Icon(name="ph:chart-line-up" size="48" style="color: var(--text-muted)")
            p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.noTrafficData') }}

      //- Response Time Chart
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.2s")
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:timer-bold" size="20" class="mr-2")
            | {{ $t('monitoring.responseTime') }}
        .chart-container(v-loading="loadingRequests")
          ClientOnly
            VChart(v-if="responseTimeChartOption" :option="responseTimeChartOption" autoresize style="height: 300px")
          .text-center.py-12(v-if="!responseTimeChartOption && !loadingRequests")
            Icon(name="ph:timer" size="48" style="color: var(--text-muted)")
            p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.noResponseData') }}

      //- Error Rate Chart
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.25s")
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:warning-bold" size="20" class="mr-2")
            | {{ $t('monitoring.errorRate') }}
        .chart-container(v-loading="loadingRequests")
          ClientOnly
            VChart(v-if="errorChartOption" :option="errorChartOption" autoresize style="height: 300px")
          .text-center.py-12(v-if="!errorChartOption && !loadingRequests")
            Icon(name="ph:warning" size="48" style="color: var(--text-muted)")
            p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.noErrorData') }}

      //- Status Distribution Pie Chart
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.3s")
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:chart-pie-slice-bold" size="20" class="mr-2")
            | {{ $t('monitoring.statusDistribution') }}
        .chart-container(v-loading="loadingRequests")
          ClientOnly
            VChart(v-if="statusPieOption" :option="statusPieOption" autoresize style="height: 300px")
          .text-center.py-12(v-if="!statusPieOption && !loadingRequests")
            Icon(name="ph:chart-pie-slice" size="48" style="color: var(--text-muted)")
            p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.noStatusData') }}

    //- System Metrics Cards
    .grid.grid-cols-1.gap-6.mb-8(class="lg:grid-cols-3")
      //- CPU & Memory
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.35s")
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:cpu-bold" size="20" class="mr-2")
          | {{ $t('monitoring.systemResources') }}
        .space-y-4
          div
            .flex.items-center.justify-between.mb-1
              span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.cpuUsage') }}
              span.text-sm.font-bold(style="color: var(--text-primary)") {{ systemData?.cpu?.usage ?? 0 }}%
            el-progress(:percentage="systemData?.cpu?.usage ?? 0" :color="getProgressColor(systemData?.cpu?.usage ?? 0)" :show-text="false" :stroke-width="8")
          div
            .flex.items-center.justify-between.mb-1
              span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.memoryUsage') }}
              span.text-sm.font-bold(style="color: var(--text-primary)") {{ systemData?.memory?.usagePercent ?? 0 }}%
            el-progress(:percentage="systemData?.memory?.usagePercent ?? 0" :color="getProgressColor(systemData?.memory?.usagePercent ?? 0)" :show-text="false" :stroke-width="8")
          div
            .flex.items-center.justify-between.mb-1
              span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.processMemory') }}
              span.text-sm.font-bold(style="color: var(--text-primary)") {{ formatBytes(systemData?.memory?.process?.rss ?? 0) }}
            el-progress(:percentage="processMemPercent" :color="getProgressColor(processMemPercent)" :show-text="false" :stroke-width="8")

      //- Database Info
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.4s")
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:database-bold" size="20" class="mr-2")
          | {{ $t('monitoring.databaseInfo') }}
        .space-y-3
          .flex.items-center.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.dbStatus') }}
            el-tag(:type="overview?.database?.status === 'ok' ? 'success' : 'danger'" size="small") {{ overview?.database?.status ?? 'unknown' }}
          .flex.items-center.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.dbResponseTime') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ overview?.database?.responseTime ?? 0 }}ms
          .flex.items-center.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.poolSize') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ overview?.database?.pool?.size ?? 0 }}
          .flex.items-center.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.poolAvailable') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ overview?.database?.pool?.available ?? 0 }}
          .flex.items-center.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.poolUsing') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ overview?.database?.pool?.using ?? 0 }}

      //- Redis Info
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.45s")
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:lightning-bold" size="20" class="mr-2")
          | {{ $t('monitoring.redisInfo') }}
        .space-y-3
          .flex.items-center.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.redisStatus') }}
            el-tag(:type="overview?.redis?.status === 'ok' ? 'success' : 'danger'" size="small") {{ overview?.redis?.status ?? 'unknown' }}
          .flex.items-center.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.redisMemory') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ overview?.redis?.usedMemory ?? 'N/A' }}
          .flex.items-center.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.redisClients') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ overview?.redis?.connectedClients ?? 0 }}
          .flex.items-center.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.redisKeys') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ overview?.redis?.keyCount ?? 0 }}
          .flex.items-center.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.redisOps') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ overview?.redis?.opsPerSec ?? 0 }}/s

    //- Top Endpoints Table
    .glass-card.p-6.mb-8.animate-entrance(style="animation-delay: 0.5s")
      .flex.items-center.justify-between.mb-4
        h3.text-lg.font-bold(style="color: var(--text-primary)")
          Icon(name="ph:list-dashes-bold" size="20" class="mr-2")
          | {{ $t('monitoring.topEndpoints') }}
        el-button(size="small" text @click="loadEndpoints" :loading="loadingEndpoints")
          Icon(name="ph:arrows-clockwise" size="14")
      el-table(:data="endpoints.slice(0, 15)" v-loading="loadingEndpoints" stripe style="width: 100%")
        el-table-column(:label="$t('monitoring.method')" width="100")
          template(#default="{ row }")
            el-tag(:type="getMethodType(row.method)" size="small" effect="plain") {{ row.method }}
        el-table-column(:label="$t('monitoring.endpoint')" prop="endpoint" min-width="300")
        el-table-column(:label="$t('monitoring.requests')" prop="count" width="120" sortable)
        el-table-column(:label="$t('monitoring.avgTime')" width="140" sortable)
          template(#default="{ row }")
            span(:style="{ color: row.avgResponseTime > 1000 ? '#f56c6c' : row.avgResponseTime > 500 ? '#e6a23c' : '#67c23a' }") {{ row.avgResponseTime }}ms
        el-table-column(:label="$t('monitoring.maxTime')" width="140" sortable)
          template(#default="{ row }")
            span(:style="{ color: row.maxResponseTime > 2000 ? '#f56c6c' : row.maxResponseTime > 1000 ? '#e6a23c' : '#67c23a' }") {{ row.maxResponseTime }}ms

    //- Recent Errors
    .glass-card.p-6.animate-entrance(style="animation-delay: 0.55s")
      .flex.items-center.justify-between.mb-4
        h3.text-lg.font-bold(style="color: var(--text-primary)")
          Icon(name="ph:bug-bold" size="20" class="mr-2")
          | {{ $t('monitoring.recentErrors') }}
        .flex.items-center.gap-2
          el-button(size="small" text @click="loadErrors" :loading="loadingErrors")
            Icon(name="ph:arrows-clockwise" size="14")
      .space-y-3(v-if="errors.length" v-loading="loadingErrors")
        .border.rounded-lg.p-4(v-for="error in errors" :key="error.id" style="border-color: var(--border-color)")
          .flex.items-start.justify-between
            .flex.items-center.gap-2
              el-tag(type="danger" size="small") {{ error.statusCode }}
              span.text-sm.font-mono(style="color: var(--text-muted)") {{ error.method }}
              span.text-sm(style="color: var(--text-primary)") {{ error.url }}
            span.text-xs(style="color: var(--text-muted)") {{ formatTimestamp(error.timestamp) }}
          p.text-sm.mt-2(style="color: var(--text-primary)") {{ error.message }}
          el-collapse.mt-2(v-if="error.stack" accordion)
            el-collapse-item(:title="$t('monitoring.stackTrace')")
              pre.text-xs.overflow-auto.p-2.rounded(style="color: var(--text-muted); background: var(--bg-secondary); max-height: 200px") {{ error.stack }}
      .text-center.py-8(v-else-if="!loadingErrors")
        Icon(name="ph:check-circle" size="48" style="color: #67c23a")
        p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('monitoring.noErrors') }}
      //- Pagination for errors
      .flex.justify-center.mt-4(v-if="errorTotal > errorPageSize")
        el-pagination(
          v-model:current-page="errorPage"
          :page-size="errorPageSize"
          :total="errorTotal"
          layout="prev, pager, next"
          @current-change="loadErrors"
        )
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import {
  fetchMonitoringOverview,
  fetchRequestMetrics,
  fetchEndpointMetrics,
  fetchErrorLog,
  formatBytes,
  formatUptime,
  getHealthColor,
  type OverviewMetrics,
  type RequestMetrics,
  type EndpointMetric,
  type TrackedError
} from '~/composables/useMonitoring';

// Lazy-load heavy chart dependencies
const VChart = defineAsyncComponent(() =>
  Promise.all([
    import('echarts/core'),
    import('echarts/renderers'),
    import('echarts/charts'),
    import('echarts/components'),
    import('vue-echarts')
  ]).then(
    ([
      echartsCore,
      { CanvasRenderer },
      { BarChart, LineChart, PieChart, GaugeChart },
      { TitleComponent, TooltipComponent, LegendComponent, GridComponent },
      VChartModule
    ]) => {
      echartsCore.use([CanvasRenderer, BarChart, LineChart, PieChart, GaugeChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);
      return VChartModule;
    }
  )
);

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();

// State
const initialLoading = ref(true);
const refreshing = ref(false);
const loadingRequests = ref(false);
const loadingEndpoints = ref(false);
const loadingErrors = ref(false);
const period = ref('1h');

const overview = ref<OverviewMetrics | null>(null);
const requestMetrics = ref<RequestMetrics | null>(null);
const endpoints = ref<EndpointMetric[]>([]);
const errors = ref<TrackedError[]>([]);
const errorTotal = ref(0);
const errorPage = ref(1);
const errorPageSize = 10;

// Auto-refresh timer
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// Computed
const systemData = computed(() => overview.value?.system);

const healthStatus = computed(() => ({
  api: 'ok',
  database: overview.value?.database?.status ?? 'unknown',
  redis: overview.value?.redis?.status ?? 'unknown'
}));

const processMemPercent = computed(() => {
  const proc = systemData.value?.memory?.process;
  if (!proc) return 0;
  return Math.round((proc.heapUsed / proc.heapTotal) * 100);
});

const kpiCards = computed(() => [
  {
    label: t('monitoring.uptime'),
    value: formatUptime(systemData.value?.uptime?.process ?? 0),
    icon: 'ph:clock-bold',
    color: '#67c23a'
  },
  {
    label: t('monitoring.requestsPerMin'),
    value: overview.value?.requests?.requestsPerMinute?.toFixed(1) ?? '0',
    icon: 'ph:activity-bold',
    color: '#409eff'
  },
  {
    label: t('monitoring.avgResponseTimeLabel'),
    value: (overview.value?.requests?.avgResponseTime?.toFixed(0) ?? '0') + 'ms',
    icon: 'ph:timer-bold',
    color: '#e6a23c'
  },
  {
    label: t('monitoring.activeUsersLabel'),
    value: overview.value?.activeUsers ?? 0,
    icon: 'ph:users-bold',
    color: '#7849ff'
  }
]);

// Chart options
const requestChartOption = computed(() => {
  const data = requestMetrics.value?.timeline;
  if (!data || data.length === 0) return null;

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ axisValueLabel: string; marker: string; seriesName: string; value: number }>) => {
        const point = params[0];
        return `${point.axisValueLabel}<br/>${point.marker} ${point.seriesName}: <b>${point.value}</b>`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(p => formatChartTime(p.timestamp)),
      axisLabel: { fontSize: 10 }
    },
    yAxis: { type: 'value', name: t('monitoring.requests'), axisLabel: { fontSize: 10 } },
    series: [
      {
        name: t('monitoring.requests'),
        type: 'line',
        data: data.map(p => p.requests),
        smooth: true,
        areaStyle: { opacity: 0.15 },
        lineStyle: { width: 2 },
        itemStyle: { color: '#409eff' }
      }
    ]
  };
});

const responseTimeChartOption = computed(() => {
  const data = requestMetrics.value?.timeline;
  if (!data || data.length === 0) return null;

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ axisValueLabel: string; marker: string; seriesName: string; value: number }>) => {
        const point = params[0];
        return `${point.axisValueLabel}<br/>${point.marker} ${point.seriesName}: <b>${point.value}ms</b>`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(p => formatChartTime(p.timestamp)),
      axisLabel: { fontSize: 10 }
    },
    yAxis: { type: 'value', name: 'ms', axisLabel: { fontSize: 10 } },
    series: [
      {
        name: t('monitoring.avgResponseTimeLabel'),
        type: 'line',
        data: data.map(p => p.avgResponseTime),
        smooth: true,
        areaStyle: { opacity: 0.15 },
        lineStyle: { width: 2 },
        itemStyle: { color: '#e6a23c' }
      }
    ]
  };
});

const errorChartOption = computed(() => {
  const data = requestMetrics.value?.timeline;
  if (!data || data.length === 0) return null;

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ axisValueLabel: string; marker: string; seriesName: string; value: number }>) => {
        const point = params[0];
        return `${point.axisValueLabel}<br/>${point.marker} ${point.seriesName}: <b>${point.value}</b>`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(p => formatChartTime(p.timestamp)),
      axisLabel: { fontSize: 10 }
    },
    yAxis: { type: 'value', name: t('monitoring.errorsLabel'), axisLabel: { fontSize: 10 } },
    series: [
      {
        name: t('monitoring.errorsLabel'),
        type: 'bar',
        data: data.map(p => p.errors),
        itemStyle: {
          color: (params: { data: number }) => (params.data > 0 ? '#f56c6c' : '#e0e0e0'),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };
});

const statusPieOption = computed(() => {
  const dist = requestMetrics.value?.statusDistribution;
  if (!dist || Object.keys(dist).length === 0) return null;

  const colorMap: Record<string, string> = {
    '2xx': '#67c23a',
    '3xx': '#409eff',
    '4xx': '#e6a23c',
    '5xx': '#f56c6c'
  };

  const pieData = Object.entries(dist).map(([name, value]) => ({
    name,
    value,
    itemStyle: { color: colorMap[name] || '#909399' }
  }));

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, left: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        padAngle: 2,
        itemStyle: { borderRadius: 6 },
        label: { show: true, formatter: '{b}\n{d}%' },
        data: pieData
      }
    ]
  };
});

// Helpers
function formatChartTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString();
}

function getProgressColor(value: number): string {
  if (value >= 90) return '#f56c6c';
  if (value >= 70) return '#e6a23c';
  return '#67c23a';
}

function getMethodType(method: string): string {
  switch (method) {
    case 'GET':
      return 'success';
    case 'POST':
      return 'primary';
    case 'PUT':
    case 'PATCH':
      return 'warning';
    case 'DELETE':
      return 'danger';
    default:
      return 'info';
  }
}

// Data loading
async function loadOverview() {
  try {
    overview.value = await fetchMonitoringOverview();
  } catch {
    // handled by composable
  }
}

async function loadRequestMetrics() {
  loadingRequests.value = true;
  try {
    requestMetrics.value = await fetchRequestMetrics(period.value);
  } catch {
    // handled by composable
  } finally {
    loadingRequests.value = false;
  }
}

async function loadEndpoints() {
  loadingEndpoints.value = true;
  try {
    endpoints.value = await fetchEndpointMetrics();
  } catch {
    // handled by composable
  } finally {
    loadingEndpoints.value = false;
  }
}

async function loadErrors() {
  loadingErrors.value = true;
  try {
    const result = await fetchErrorLog(errorPage.value, errorPageSize);
    errors.value = result.docs;
    errorTotal.value = result.total;
  } catch {
    // handled by composable
  } finally {
    loadingErrors.value = false;
  }
}

async function refreshAll() {
  refreshing.value = true;
  try {
    await Promise.all([loadOverview(), loadRequestMetrics(), loadEndpoints(), loadErrors()]);
    ElMessage.success(t('monitoring.refreshed'));
  } catch {
    ElMessage.error(t('monitoring.refreshFailed'));
  } finally {
    refreshing.value = false;
  }
}

// Initialize
onMounted(async () => {
  try {
    await Promise.all([loadOverview(), loadRequestMetrics(), loadEndpoints(), loadErrors()]);
  } catch {
    // errors handled individually
  } finally {
    initialLoading.value = false;
  }

  // Auto-refresh every 30 seconds
  refreshTimer = setInterval(() => {
    loadOverview();
    loadRequestMetrics();
  }, 30000);
});

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});
</script>
