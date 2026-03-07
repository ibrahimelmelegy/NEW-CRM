<template lang="pug">
.workflow-monitor-page.p-6(class="md:p-8")
  //- ╔══════════════════════════════════════════════════╗
  //- ║  Page Header                                     ║
  //- ╚══════════════════════════════════════════════════╝
  .glass-card.mb-8.p-6
    .flex.items-center.justify-between.flex-wrap.gap-4
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #818cf8, #a78bfa)")
          Icon(name="ph:activity-bold" size="22" style="color: white")
        div
          h1.text-2xl.font-bold.bg-clip-text.text-transparent.bg-gradient-to-r.from-indigo-400.to-purple-400 {{ $t('workflowMonitor.title', 'Workflow Execution Monitor') }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('workflowMonitor.subtitle', 'Monitor workflow executions, track errors, and analyze performance metrics in real time.') }}
      .flex.items-center.gap-3
        el-button(size="large" class="!rounded-xl" @click="refreshAllData" :loading="refreshing")
          Icon(name="ph:arrows-clockwise-bold" size="16")
          span.ml-2 {{ $t('workflowMonitor.refresh', 'Refresh') }}

  //- ╔══════════════════════════════════════════════════╗
  //- ║  KPI Cards                                       ║
  //- ╚══════════════════════════════════════════════════╝
  .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
    .kpi-card(v-for="(kpi, idx) in kpiCards" :key="idx")
      .flex.items-start.justify-between
        div
          p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
          p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}
          .flex.items-center.gap-1.mt-2
            Icon(:name="kpi.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }")
            span.text-xs.font-semibold(:style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ kpi.trend >= 0 ? '+' : '' }}{{ kpi.trend }}%
        .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
          Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

  //- ╔══════════════════════════════════════════════════╗
  //- ║  Tabs                                            ║
  //- ╚══════════════════════════════════════════════════╝
  el-tabs(v-model="activeTab" class="monitor-tabs")

    //- ── Tab 1: Live Monitor ──────────────────────────
    el-tab-pane(:label="$t('workflowMonitor.liveMonitor', 'Live Monitor')" name="live")
      .space-y-4
        //- Auto-refresh toggle
        .flex.items-center.justify-between.mb-4
          .flex.items-center.gap-2
            Icon(name="ph:broadcast-bold" size="18" style="color: #3b82f6")
            span.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('workflowMonitor.liveExecutions', 'Live Executions') }}
            el-tag(size="small" type="primary" effect="dark" round) {{ runningCount }}
          .flex.items-center.gap-3
            span.text-xs(style="color: var(--text-muted)") {{ $t('workflowMonitor.autoRefresh', 'Auto-refresh') }}
            el-switch(v-model="autoRefreshEnabled" @change="toggleAutoRefresh" active-color="#3b82f6")
            span.text-xs(v-if="autoRefreshEnabled" style="color: #3b82f6") {{ $t('workflowMonitor.every5s', 'Every 5s') }}

        //- Execution Cards List
        .execution-card(
          v-for="exec in liveExecutions"
          :key="exec.id"
          :class="{ 'execution-card--running': exec.status === 'running' }"
        )
          .flex.items-start.gap-4.flex-wrap(class="md:flex-nowrap")
            //- Status Indicator
            .flex.items-center.gap-3.min-w-0.shrink-0
              .status-dot(:class="'status-dot--' + exec.status")
              .min-w-0
                .flex.items-center.gap-2.mb-1
                  span.font-semibold.text-sm.truncate(style="color: var(--text-primary)") {{ exec.workflowName }}
                  el-tag(
                    size="small"
                    :type="getTriggerTagType(exec.triggerType)"
                    effect="plain"
                    round
                  ) {{ exec.triggerType }}
                .flex.items-center.gap-2
                  Icon(name="ph:cube-bold" size="12" style="color: var(--text-muted)")
                  span.text-xs(style="color: var(--text-muted)") {{ exec.entityType }}: {{ exec.entityName }}

            //- Step Progress
            .flex-1.min-w-0(class="w-full md:w-auto")
              .flex.items-center.justify-between.mb-1
                span.text-xs(style="color: var(--text-muted)") {{ $t('workflowMonitor.steps', 'Steps') }}
                span.text-xs.font-semibold(:style="{ color: getStatusColor(exec.status) }") {{ exec.completedSteps }}/{{ exec.totalSteps }}
              el-progress(
                :percentage="Math.round((exec.completedSteps / exec.totalSteps) * 100)"
                :stroke-width="8"
                :color="getStatusColor(exec.status)"
                :show-text="false"
              )

            //- Duration & Timestamp
            .flex.items-center.gap-6.shrink-0.flex-wrap
              .text-right
                p.text-xs.mb-1(style="color: var(--text-muted)") {{ $t('workflowMonitor.duration', 'Duration') }}
                p.text-sm.font-mono.font-semibold(:style="{ color: exec.status === 'running' ? '#3b82f6' : 'var(--text-primary)' }") {{ exec.duration }}
              .text-right
                p.text-xs.mb-1(style="color: var(--text-muted)") {{ $t('workflowMonitor.started', 'Started') }}
                p.text-xs(style="color: var(--text-secondary)") {{ exec.timestamp }}
              el-tag(
                size="small"
                :type="getStatusTagType(exec.status)"
                effect="dark"
                round
              )
                .flex.items-center.gap-1
                  .status-dot-inline(:class="'status-dot-inline--' + exec.status")
                  | {{ capitalize(exec.status) }}

    //- ── Tab 2: Run History ───────────────────────────
    el-tab-pane(:label="$t('workflowMonitor.runHistory', 'Run History')" name="history")
      .glass-card.rounded-2xl.overflow-hidden
        //- Filters
        .p-5.flex.items-center.justify-between.flex-wrap.gap-3(style="border-bottom: 1px solid var(--border-default)")
          .flex.items-center.gap-3.flex-wrap
            el-date-picker(
              v-model="historyDateRange"
              type="daterange"
              range-separator="to"
              :start-placeholder="$t('workflowMonitor.startDate', 'Start date')"
              :end-placeholder="$t('workflowMonitor.endDate', 'End date')"
              size="default"
              style="width: 280px"
              value-format="YYYY-MM-DD"
            )
            el-select(
              v-model="historyStatusFilter"
              :placeholder="$t('workflowMonitor.filterByStatus', 'Filter by status')"
              clearable
              size="default"
              style="width: 160px"
            )
              el-option(:label="$t('workflowMonitor.allStatuses')" value="")
              el-option(:label="$t('workflowMonitor.success')" value="success")
              el-option(:label="$t('workflowMonitor.failed')" value="failed")
              el-option(:label="$t('workflowMonitor.running')" value="running")
              el-option(:label="$t('workflowMonitor.cancelled')" value="cancelled")
          span.text-xs(style="color: var(--text-muted)") {{ filteredHistory.length }} {{ $t('workflowMonitor.runs', 'runs') }}

        //- Table
        el-table(
          :data="filteredHistory"
          stripe
          style="width: 100%"
          row-key="id"
          :expand-row-keys="expandedRows"
          @expand-change="onExpandChange"
        )
          el-table-column(type="expand")
            template(#default="scope")
              .px-4.py-3
                .text-xs.font-semibold.mb-3(style="color: var(--text-muted)") {{ $t('workflowMonitor.stepDetails', 'Step-by-Step Execution') }}
                .step-detail(v-for="(step, si) in scope.row.steps" :key="si")
                  .flex.items-center.gap-3
                    .step-status-icon
                      Icon(
                        :name="step.status === 'success' ? 'ph:check-circle-fill' : step.status === 'failed' ? 'ph:x-circle-fill' : step.status === 'running' ? 'ph:spinner-bold' : 'ph:clock-bold'"
                        size="16"
                        :style="{ color: getStatusColor(step.status) }"
                      )
                    .flex-1.min-w-0
                      .flex.items-center.justify-between
                        span.text-sm.font-medium(style="color: var(--text-primary)") {{ step.name }}
                        span.text-xs.font-mono(style="color: var(--text-muted)") {{ step.duration }}
                      .flex.items-center.gap-4.mt-1
                        span.text-xs(style="color: var(--text-secondary)")
                          strong Input:
                          |  {{ step.input }}
                        span.text-xs(style="color: var(--text-secondary)")
                          strong Output:
                          |  {{ step.output }}

          el-table-column(:label="$t('workflowMonitor.runId', 'Run ID')" min-width="100")
            template(#default="scope")
              span.monospace-id \#{{ scope.row.shortId }}

          el-table-column(prop="workflowName" :label="$t('workflowMonitor.workflowName', 'Workflow')" min-width="180")
            template(#default="scope")
              span.font-medium {{ scope.row.workflowName }}

          el-table-column(:label="$t('workflowMonitor.trigger', 'Trigger')" min-width="120")
            template(#default="scope")
              el-tag(
                size="small"
                :type="getTriggerTagType(scope.row.triggerType)"
                effect="plain"
                round
              ) {{ scope.row.triggerType }}

          el-table-column(:label="$t('workflowMonitor.status', 'Status')" min-width="110" align="center")
            template(#default="scope")
              el-tag(
                size="small"
                :type="getStatusTagType(scope.row.status)"
                effect="dark"
                round
              ) {{ capitalize(scope.row.status) }}

          el-table-column(prop="duration" :label="$t('workflowMonitor.duration', 'Duration')" min-width="100")
            template(#default="scope")
              span.font-mono.text-sm {{ scope.row.duration }}

          el-table-column(:label="$t('workflowMonitor.entity', 'Entity')" min-width="160")
            template(#default="scope")
              .flex.items-center.gap-2
                el-tag(size="small" type="info" effect="plain") {{ scope.row.entityType }}
                span.text-sm {{ scope.row.entityName }}

          el-table-column(prop="timestamp" :label="$t('workflowMonitor.timestamp', 'Timestamp')" min-width="160")
            template(#default="scope")
              span.text-xs(style="color: var(--text-secondary)") {{ scope.row.timestamp }}

          el-table-column(:label="$t('workflowMonitor.actions', 'Actions')" min-width="100" align="center" fixed="right")
            template(#default="scope")
              el-button(size="small" text type="primary" @click="viewRunDetails(scope.row)")
                Icon(name="ph:eye-bold" size="14")
                span.ml-1 {{ $t('workflowMonitor.viewDetails', 'Details') }}

    //- ── Tab 3: Error Log ─────────────────────────────
    el-tab-pane(:label="$t('workflowMonitor.errorLog', 'Error Log')" name="errors")
      .space-y-6
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-3")
          //- Error Table
          .col-span-1(class="lg:col-span-2")
            .glass-card.rounded-2xl.overflow-hidden
              .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--border-default)")
                .flex.items-center.gap-2
                  Icon(name="ph:warning-octagon-bold" size="18" style="color: #ef4444")
                  h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('workflowMonitor.failedExecutions', 'Failed Executions') }}
                el-tag(type="danger" size="small" effect="dark" round) {{ errorLogs.length }} {{ $t('workflowMonitor.errors', 'errors') }}

              el-table(:data="errorLogs" stripe style="width: 100%")
                el-table-column(prop="timestamp" :label="$t('workflowMonitor.timestamp', 'Timestamp')" min-width="140")
                  template(#default="scope")
                    span.text-xs(style="color: var(--text-secondary)") {{ scope.row.timestamp }}

                el-table-column(prop="workflowName" :label="$t('workflowMonitor.workflowName', 'Workflow')" min-width="160")
                  template(#default="scope")
                    span.font-medium {{ scope.row.workflowName }}

                el-table-column(prop="failedStep" :label="$t('workflowMonitor.failedStep', 'Failed Step')" min-width="140")
                  template(#default="scope")
                    .flex.items-center.gap-1
                      Icon(name="ph:x-circle-bold" size="14" style="color: #ef4444")
                      span.text-sm {{ scope.row.failedStep }}

                el-table-column(:label="$t('workflowMonitor.errorMessage', 'Error Message')" min-width="220")
                  template(#default="scope")
                    el-popover(
                      placement="top"
                      :width="360"
                      trigger="click"
                    )
                      template(#reference)
                        span.text-sm.cursor-pointer.underline.decoration-dotted(style="color: #ef4444") {{ truncateText(scope.row.errorMessage, 50) }}
                      .p-2
                        p.text-xs.font-semibold.mb-2(style="color: var(--text-muted)") {{ $t('workflowMonitor.fullErrorMessage', 'Full Error Message') }}
                        p.text-sm.font-mono(style="color: var(--text-primary); word-break: break-all") {{ scope.row.errorMessage }}

                el-table-column(:label="$t('workflowMonitor.retries', 'Retries')" min-width="80" align="center")
                  template(#default="scope")
                    el-tag(size="small" :type="scope.row.retryCount >= 3 ? 'danger' : 'warning'" effect="plain") {{ scope.row.retryCount }}/3

                el-table-column(:label="$t('workflowMonitor.actions', 'Actions')" min-width="160" align="center" fixed="right")
                  template(#default="scope")
                    .flex.items-center.gap-1.justify-center
                      el-button(
                        size="small"
                        type="warning"
                        text
                        @click="retryExecution(scope.row)"
                        :disabled="scope.row.retryCount >= 3"
                      )
                        Icon(name="ph:arrow-counter-clockwise-bold" size="14")
                        span.ml-1 {{ $t('workflowMonitor.retry', 'Retry') }}
                      el-button(size="small" type="primary" text @click="viewRunDetails(scope.row)")
                        Icon(name="ph:eye-bold" size="14")
                        span.ml-1 {{ $t('workflowMonitor.viewDetails', 'Details') }}

          //- Error Category Pie Chart
          .col-span-1
            .glass-card.p-6
              h3.text-sm.font-bold.uppercase.mb-5(style="color: var(--text-muted)")
                Icon.mr-2(name="ph:chart-pie-bold" size="16" style="color: #ef4444")
                | {{ $t('workflowMonitor.errorBreakdown', 'Error Breakdown') }}
              ClientOnly
                VChart.w-full(:option="errorCategoryChartOption" :style="{ height: '320px' }" autoresize)

    //- ── Tab 4: Performance ───────────────────────────
    el-tab-pane(:label="$t('workflowMonitor.performance', 'Performance')" name="performance")
      .space-y-6
        //- Execution Time Trend
        .glass-card.p-6
          h3.section-title.mb-5
            Icon.mr-2(name="ph:chart-line-bold" size="22" style="color: #3b82f6")
            | {{ $t('workflowMonitor.executionTimeTrend', 'Execution Time Trend (30 Days)') }}
          ClientOnly
            VChart.w-full(:option="executionTimeTrendOption" :style="{ height: '380px' }" autoresize)

        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
          //- Throughput Histogram
          .glass-card.p-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:chart-bar-bold" size="22" style="color: #7849ff")
              | {{ $t('workflowMonitor.throughput', 'Throughput (Executions / Hour, Last 24h)') }}
            ClientOnly
              VChart.w-full(:option="throughputChartOption" :style="{ height: '320px' }" autoresize)

          //- Status Distribution Pie
          .glass-card.p-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:chart-donut-bold" size="22" style="color: #22c55e")
              | {{ $t('workflowMonitor.statusDistribution', 'Status Distribution') }}
            ClientOnly
              VChart.w-full(:option="statusDistributionOption" :style="{ height: '320px' }" autoresize)

        //- Slow Workflow Highlight Cards
        .glass-card.p-6
          h3.section-title.mb-5
            Icon.mr-2(name="ph:warning-bold" size="22" style="color: #f59e0b")
            | {{ $t('workflowMonitor.slowWorkflows', 'Slowest Workflows') }}
          .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
            .slow-workflow-card(v-for="(sw, swi) in slowWorkflows" :key="swi")
              .flex.items-center.gap-3.mb-3
                .slow-rank(:style="{ background: sw.rankColor + '18', color: sw.rankColor }") \#{{ swi + 1 }}
                div
                  p.text-sm.font-semibold(style="color: var(--text-primary)") {{ sw.name }}
                  p.text-xs(style="color: var(--text-muted)") {{ sw.executionCount }} {{ $t('workflowMonitor.executions', 'executions') }}
              .flex.items-center.justify-between.mb-3
                .text-center
                  p.text-xs(style="color: var(--text-muted)") {{ $t('workflowMonitor.avgTime', 'Avg Time') }}
                  p.text-lg.font-bold.font-mono(:style="{ color: sw.rankColor }") {{ sw.avgTime }}
                .text-center
                  p.text-xs(style="color: var(--text-muted)") {{ $t('workflowMonitor.p95Time', 'P95') }}
                  p.text-sm.font-semibold.font-mono(style="color: var(--text-secondary)") {{ sw.p95Time }}
              .optimization-hint
                Icon(name="ph:lightbulb-bold" size="14" style="color: #f59e0b")
                span.text-xs.ml-1(style="color: var(--text-secondary)") {{ sw.suggestion }}

  //- ╔══════════════════════════════════════════════════╗
  //- ║  Run Detail Dialog                               ║
  //- ╚══════════════════════════════════════════════════╝
  el-dialog(v-model="showRunDialog" :title="selectedRun?.workflowName || 'Run Details'" width="680px")
    .space-y-4(v-if="selectedRun")
      .grid.gap-4(class="grid-cols-2 sm:grid-cols-4")
        .stat-box
          p.text-xs(style="color: var(--text-muted)") {{ $t('workflowMonitor.runId', 'Run ID') }}
          p.text-sm.font-bold.font-mono(style="color: #7849ff") \#{{ selectedRun.shortId || selectedRun.id?.substring(0, 6) }}
        .stat-box
          p.text-xs(style="color: var(--text-muted)") {{ $t('workflowMonitor.status', 'Status') }}
          el-tag(:type="getStatusTagType(selectedRun.status)" size="small" effect="dark") {{ capitalize(selectedRun.status) }}
        .stat-box
          p.text-xs(style="color: var(--text-muted)") {{ $t('workflowMonitor.duration', 'Duration') }}
          p.text-sm.font-bold.font-mono(style="color: var(--text-primary)") {{ selectedRun.duration }}
        .stat-box
          p.text-xs(style="color: var(--text-muted)") {{ $t('workflowMonitor.trigger', 'Trigger') }}
          el-tag(:type="getTriggerTagType(selectedRun.triggerType)" size="small" effect="plain") {{ selectedRun.triggerType }}
      .divider
      .text-sm.font-semibold.mb-3(style="color: var(--text-primary)") {{ $t('workflowMonitor.executionSteps', 'Execution Steps') }}
      .step-detail(v-for="(step, si) in selectedRun.steps" :key="si")
        .flex.items-center.gap-3
          .step-status-icon
            Icon(
              :name="step.status === 'success' ? 'ph:check-circle-fill' : step.status === 'failed' ? 'ph:x-circle-fill' : step.status === 'running' ? 'ph:spinner-bold' : 'ph:clock-bold'"
              size="16"
              :style="{ color: getStatusColor(step.status) }"
            )
          .flex-1.min-w-0
            .flex.items-center.justify-between
              span.text-sm.font-medium(style="color: var(--text-primary)") {{ step.name }}
              span.text-xs.font-mono(style="color: var(--text-muted)") {{ step.duration }}
            .flex.items-center.gap-4.mt-1(v-if="step.input || step.output")
              span.text-xs(style="color: var(--text-secondary)")
                strong Input:
                |  {{ step.input }}
              span.text-xs(style="color: var(--text-secondary)")
                strong Output:
                |  {{ step.output }}
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showRunDialog = false") {{ $t('workflowMonitor.close', 'Close') }}
        el-button(
          v-if="selectedRun?.status === 'failed'"
          type="warning"
          @click="retryExecution(selectedRun); showRunDialog = false"
        )
          Icon(name="ph:arrow-counter-clockwise-bold" size="14" class="mr-1")
          | {{ $t('workflowMonitor.retryExecution', 'Retry Execution') }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { graphic } from 'echarts/core';
import VChart from 'vue-echarts';
import { ElMessage } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Workflow Monitor' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const activeTab = ref('live');
const refreshing = ref(false);
const autoRefreshEnabled = ref(true);
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

// History filters
const historyDateRange = ref<[string, string] | null>(null);
const historyStatusFilter = ref('');
const expandedRows = ref<string[]>([]);

// Dialog
const showRunDialog = ref(false);
const selectedRun = ref<Record<string, unknown> | null>(null);

// ─── Chart Tooltip Style ────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.9)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 12 },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

// ─── Data: Live Executions ───────────────────────────────────
const liveExecutions = ref([]);

const runningCount = computed(() => liveExecutions.value.filter(e => e.status === 'running').length);

// ─── Data: Run History ───────────────────────────────────────
const historyData = ref([]);

const filteredHistory = computed(() => {
  let data = historyData.value;
  if (historyStatusFilter.value) {
    data = data.filter(r => r.status === historyStatusFilter.value);
  }
  if (historyDateRange.value && historyDateRange.value[0] && historyDateRange.value[1]) {
    const start = historyDateRange.value[0];
    const end = historyDateRange.value[1];
    data = data.filter(r => {
      const ts = r.timestamp?.substring(0, 10);
      return ts >= start && ts <= end;
    });
  }
  return data;
});

function onExpandChange(row: unknown, expandedList: Record<string, unknown>[]) {
  expandedRows.value = expandedList.map((r) => r.id);
}

// ─── Data: Error Logs ────────────────────────────────────────
const errorLogs = ref([]);

// ─── Data: Performance ───────────────────────────────────────
const slowWorkflows = ref([]);

// ─── KPI Cards ──────────────────────────────────────────────
const kpiData = ref({ activeWorkflows: 0, executions24h: 0, successRate: 0, avgExecutionTime: '\u2014' });

const kpiCards = computed(() => [
  {
    label: t('workflowMonitor.activeWorkflows', 'Active Workflows'),
    value: String(kpiData.value.activeWorkflows),
    icon: 'ph:git-merge-bold',
    color: '#7849ff',
    trend: 0
  },
  {
    label: t('workflowMonitor.executions24h', 'Executions 24h'),
    value: String(kpiData.value.executions24h),
    icon: 'ph:lightning-bold',
    color: '#3b82f6',
    trend: 0
  },
  {
    label: t('workflowMonitor.successRate', 'Success Rate'),
    value: kpiData.value.successRate ? `${kpiData.value.successRate}%` : '0%',
    icon: 'ph:check-circle-bold',
    color: '#22c55e',
    trend: 0
  },
  {
    label: t('workflowMonitor.avgExecutionTime', 'Avg Execution Time'),
    value: kpiData.value.avgExecutionTime,
    icon: 'ph:timer-bold',
    color: '#f59e0b',
    trend: 0
  }
]);

// ─── Helpers ────────────────────────────────────────────────
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateText(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
      return '#3b82f6';
    case 'success':
      return '#22c55e';
    case 'failed':
      return '#ef4444';
    case 'cancelled':
      return '#6b7280';
    default:
      return '#94a3b8';
  }
}

function getStatusTagType(status: string): string {
  switch (status) {
    case 'running':
      return '';
    case 'success':
      return 'success';
    case 'failed':
      return 'danger';
    case 'cancelled':
      return 'info';
    default:
      return 'info';
  }
}

function getTriggerTagType(trigger: string): string {
  switch (trigger) {
    case 'Manual':
      return 'warning';
    case 'Scheduled':
      return 'info';
    case 'Event':
      return '';
    case 'Webhook':
      return 'success';
    default:
      return 'info';
  }
}

// ─── Actions ────────────────────────────────────────────────
function retryExecution(row: unknown) {
  if (row.retryCount >= 3) {
    ElMessage.warning(t('workflowMonitor.maxRetriesReached', 'Maximum retry attempts reached for this execution.'));
    return;
  }
  row.retryCount = (row.retryCount || 0) + 1;
  ElMessage.success(t('workflowMonitor.retryQueued', `Retry queued for "${row.workflowName}". Attempt ${row.retryCount}/3.`));
}

function viewRunDetails(row: unknown) {
  selectedRun.value = row;
  showRunDialog.value = true;
}

function toggleAutoRefresh(enabled: boolean) {
  if (enabled) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  autoRefreshTimer = setInterval(() => {
    loadData();
  }, 5000);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

async function loadData() {
  try {
    const [execRes, historyRes, errorRes, kpiRes, perfRes] = await Promise.all([
      useApiFetch('workflow/executions/live').catch(() => null),
      useApiFetch('workflow/executions/history').catch(() => null),
      useApiFetch('workflow/executions/errors').catch(() => null),
      useApiFetch('workflow/executions/kpi').catch(() => null),
      useApiFetch('workflow/executions/performance').catch(() => null),
    ]);
    if (execRes?.success && Array.isArray(execRes.body)) liveExecutions.value = execRes.body;
    if (historyRes?.success && Array.isArray(historyRes.body)) historyData.value = historyRes.body;
    if (errorRes?.success && Array.isArray(errorRes.body)) errorLogs.value = errorRes.body;
    if (kpiRes?.success && kpiRes.body) {
      const b = kpiRes.body;
      kpiData.value = {
        activeWorkflows: b.activeWorkflows ?? 0,
        executions24h: b.executions24h ?? 0,
        successRate: b.successRate ?? 0,
        avgExecutionTime: b.avgExecutionTime ?? '\u2014',
      };
    }
    if (perfRes?.success && perfRes.body) {
      const b = perfRes.body;
      if (Array.isArray(b.slowWorkflows)) slowWorkflows.value = b.slowWorkflows;
      if (Array.isArray(b.errorCategories)) errorCategoryData.value = b.errorCategories;
      if (Array.isArray(b.statusDistribution)) statusDistributionData.value = b.statusDistribution;
      if (b.executionTimeTrend) executionTimeTrendData.value = b.executionTimeTrend;
      if (b.throughput) throughputData.value = b.throughput;
    }
  } catch {
    /* silently ignore - data stays empty until next refresh */
  }
}

async function refreshAllData() {
  refreshing.value = true;
  await loadData();
  refreshing.value = false;
  ElMessage.success(t('workflowMonitor.dataRefreshed', 'Dashboard data refreshed.'));
}

// ─── Chart: Error Category Pie ──────────────────────────────
const errorCategoryData = ref<Array<{ name: string; value: number; color: string }>>([]);

const errorCategoryChartOption = computed(() => {
  const categories = errorCategoryData.value.length > 0
    ? errorCategoryData.value
    : [
        { name: t('workflowMonitor.timeout', 'Timeout'), value: 0, color: '#ef4444' },
        { name: t('workflowMonitor.validationError', 'Validation Error'), value: 0, color: '#f59e0b' },
        { name: t('workflowMonitor.apiError', 'API Error'), value: 0, color: '#3b82f6' },
        { name: t('workflowMonitor.permissionDenied', 'Permission Denied'), value: 0, color: '#8b5cf6' },
        { name: t('workflowMonitor.other', 'Other'), value: 0, color: '#6b7280' }
      ];

  return {
    tooltip: {
      trigger: 'item',
      ...tooltipStyle,
      formatter: (params: unknown) => `${params.marker} ${params.name}: ${params.value} (${params.percent}%)`
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
        radius: ['45%', '72%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        padAngle: 3,
        itemStyle: { borderRadius: 6 },
        label: {
          show: true,
          position: 'center',
          formatter: () => `${categories.reduce((s, c) => s + c.value, 0)}`,
          fontSize: 28,
          fontWeight: 'bold',
          color: '#94A3B8'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            formatter: '{b}\n{c} errors'
          }
        },
        labelLine: { show: false },
        data: categories.map(c => ({
          name: c.name,
          value: c.value,
          itemStyle: { color: c.color }
        }))
      }
    ],
    animationDuration: 800,
    animationEasing: 'cubicOut'
  };
});

// ─── Chart: Execution Time Trend ────────────────────────────
const executionTimeTrendData = ref<{ days: string[]; avg: number[]; p95: number[]; p99: number[] }>({
  days: [],
  avg: [],
  p95: [],
  p99: []
});

const executionTimeTrendOption = computed(() => {
  const { days, avg: avgData, p95: p95Data, p99: p99Data } = executionTimeTrendData.value;

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: unknown) => {
        let result = `<strong>${params[0]?.axisValue}</strong><br/>`;
        params.forEach((p) => {
          result += `${p.marker} ${p.seriesName}: ${p.value}s<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: [t('workflowMonitor.average', 'Average'), t('workflowMonitor.p95', 'P95'), t('workflowMonitor.p99', 'P99')],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8
    },
    grid: { top: 30, right: 30, bottom: 50, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLabel: { color: '#94A3B8', fontSize: 11, interval: 4 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: 'Seconds',
      nameTextStyle: { color: '#64748B' },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B', formatter: '{value}s' }
    },
    series: [
      {
        name: t('workflowMonitor.average', 'Average'),
        type: 'line',
        data: avgData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 3, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0)' }
          ])
        }
      },
      {
        name: t('workflowMonitor.p95', 'P95'),
        type: 'line',
        data: p95Data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#f59e0b', type: 'dashed' },
        itemStyle: { color: '#f59e0b' }
      },
      {
        name: t('workflowMonitor.p99', 'P99'),
        type: 'line',
        data: p99Data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#ef4444', type: 'dotted' },
        itemStyle: { color: '#ef4444' }
      }
    ],
    animationDuration: 1200,
    animationEasing: 'cubicOut'
  };
});

// ─── Chart: Throughput Histogram ────────────────────────────
const throughputData = ref<{ hours: string[]; counts: number[] }>({ hours: [], counts: [] });

const throughputChartOption = computed(() => {
  const { hours, counts } = throughputData.value;

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: unknown) => `<strong>${params[0]?.axisValue}</strong><br/>Executions: ${params[0]?.value}`
    },
    grid: { top: 20, right: 20, bottom: 30, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: { color: '#94A3B8', fontSize: 10, interval: 3 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B' }
    },
    series: [
      {
        type: 'bar',
        data: counts.map(val => ({
          value: val,
          itemStyle: {
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#7849ff' },
              { offset: 1, color: 'rgba(120, 73, 255, 0.3)' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        })),
        barWidth: '60%',
        animationDuration: 800,
        animationEasing: 'cubicOut'
      }
    ]
  };
});

// ─── Chart: Status Distribution Pie ─────────────────────────
const statusDistributionData = ref<Array<{ name: string; value: number; color: string }>>([]);

const statusDistributionOption = computed(() => {
  const statuses = statusDistributionData.value.length > 0
    ? statusDistributionData.value
    : [
        { name: t('workflowMonitor.success', 'Success'), value: 0, color: '#22c55e' },
        { name: t('workflowMonitor.failed', 'Failed'), value: 0, color: '#ef4444' },
        { name: t('workflowMonitor.cancelled', 'Cancelled'), value: 0, color: '#6b7280' }
      ];

  return {
    tooltip: {
      trigger: 'item',
      ...tooltipStyle,
      formatter: (params: unknown) => `${params.marker} ${params.name}: ${params.value} (${params.percent}%)`
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: '#94A3B8', fontSize: 12 },
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        padAngle: 3,
        itemStyle: { borderRadius: 6 },
        label: {
          show: true,
          position: 'center',
          formatter: () => `${statuses.reduce((s, c) => s + c.value, 0)}`,
          fontSize: 28,
          fontWeight: 'bold',
          color: '#94A3B8'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            formatter: '{b}\n{c} runs'
          }
        },
        labelLine: { show: false },
        data: statuses.map(s => ({
          name: s.name,
          value: s.value,
          itemStyle: { color: s.color }
        }))
      }
    ],
    animationDuration: 800,
    animationEasing: 'cubicOut'
  };
});

// ─── Lifecycle ──────────────────────────────────────────────
onMounted(() => {
  loadData();
  if (autoRefreshEnabled.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style lang="scss" scoped>
.workflow-monitor-page {
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
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Monitor Tabs ───────────────────────────────────────────
.monitor-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
  }
  :deep(.el-tabs__item) {
    font-weight: 600;
    font-size: 0.95rem;
  }
  :deep(.el-tabs__active-bar) {
    background: linear-gradient(90deg, #818cf8, #a78bfa);
  }
}

// ─── Section Title ──────────────────────────────────────────
.section-title {
  display: flex;
  align-items: center;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

// ─── Execution Cards ────────────────────────────────────────
.execution-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(120, 73, 255, 0.25);
    box-shadow: 0 4px 20px rgba(120, 73, 255, 0.08);
  }

  &--running {
    border-left: 3px solid #3b82f6;
  }
}

// ─── Status Dots ────────────────────────────────────────────
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;

  &--running {
    background: #3b82f6;
    animation: pulse-blue 2s ease-in-out infinite;
  }

  &--success {
    background: #22c55e;
  }

  &--failed {
    background: #ef4444;
  }

  &--cancelled {
    background: #6b7280;
  }
}

.status-dot-inline {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;

  &--running {
    background: #fff;
    animation: pulse-white 2s ease-in-out infinite;
  }

  &--success {
    background: #fff;
  }

  &--failed {
    background: #fff;
  }

  &--cancelled {
    background: #fff;
  }
}

@keyframes pulse-blue {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
  }
}

@keyframes pulse-white {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

// ─── Monospace ID ───────────────────────────────────────────
.monospace-id {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: #7849ff;
  padding: 2px 6px;
  background: rgba(120, 73, 255, 0.08);
  border-radius: 4px;
  letter-spacing: 0.02em;
}

// ─── Step Detail ────────────────────────────────────────────
.step-detail {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-default);

  &:last-child {
    border-bottom: none;
  }
}

.step-status-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Slow Workflow Cards ────────────────────────────────────
.slow-workflow-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 1.25rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(120, 73, 255, 0.1);
  }
}

.slow-rank {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.optimization-hint {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 8px;
}

// ─── Stat Box ───────────────────────────────────────────────
.stat-box {
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.04);
  border: 1px solid var(--border-default);
}

.divider {
  height: 1px;
  background: var(--border-default);
  margin: 8px 0;
}

// ─── Responsive ─────────────────────────────────────────────
@media (max-width: 768px) {
  .execution-card {
    .flex {
      flex-direction: column;
      gap: 12px;
    }
  }

  .slow-workflow-card {
    .flex.items-center.justify-between {
      flex-direction: column;
      gap: 8px;
    }
  }
}
</style>
