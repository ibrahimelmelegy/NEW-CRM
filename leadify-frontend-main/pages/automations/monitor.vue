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
              el-option(label="All Statuses" value="")
              el-option(label="Success" value="success")
              el-option(label="Failed" value="failed")
              el-option(label="Running" value="running")
              el-option(label="Cancelled" value="cancelled")
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
import { graphic } from 'echarts';
import VChart from 'vue-echarts';
import { ElMessage } from 'element-plus';

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
const selectedRun = ref<any>(null);

// ─── Chart Tooltip Style ────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.9)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 12 },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

// ─── Mock Data: Live Executions ─────────────────────────────
const liveExecutions = ref([
  { id: 'ex-001', workflowName: 'Lead Qualification Pipeline', triggerType: 'Event', status: 'running', entityType: 'Lead', entityName: 'John Smith', completedSteps: 3, totalSteps: 5, duration: '2m 34s', timestamp: '2026-02-28 14:32:01' },
  { id: 'ex-002', workflowName: 'Deal Stage Progression', triggerType: 'Webhook', status: 'running', entityType: 'Deal', entityName: 'Enterprise SaaS License', completedSteps: 2, totalSteps: 7, duration: '1m 12s', timestamp: '2026-02-28 14:33:45' },
  { id: 'ex-003', workflowName: 'Welcome Email Sequence', triggerType: 'Event', status: 'success', entityType: 'Contact', entityName: 'Sarah Johnson', completedSteps: 4, totalSteps: 4, duration: '45s', timestamp: '2026-02-28 14:28:10' },
  { id: 'ex-004', workflowName: 'Invoice Generation', triggerType: 'Scheduled', status: 'success', entityType: 'Deal', entityName: 'Cloud Migration Project', completedSteps: 6, totalSteps: 6, duration: '1m 58s', timestamp: '2026-02-28 14:25:00' },
  { id: 'ex-005', workflowName: 'Lead Score Update', triggerType: 'Event', status: 'failed', entityType: 'Lead', entityName: 'Michael Brown', completedSteps: 2, totalSteps: 4, duration: '32s', timestamp: '2026-02-28 14:20:15' },
  { id: 'ex-006', workflowName: 'Slack Notification', triggerType: 'Webhook', status: 'success', entityType: 'Task', entityName: 'Follow-up Call', completedSteps: 3, totalSteps: 3, duration: '8s', timestamp: '2026-02-28 14:18:33' },
  { id: 'ex-007', workflowName: 'Contract Approval Flow', triggerType: 'Manual', status: 'running', entityType: 'Deal', entityName: 'Annual Support Package', completedSteps: 4, totalSteps: 8, duration: '5m 02s', timestamp: '2026-02-28 14:15:00' },
  { id: 'ex-008', workflowName: 'Data Enrichment', triggerType: 'Scheduled', status: 'success', entityType: 'Lead', entityName: 'Emily Davis', completedSteps: 5, totalSteps: 5, duration: '2m 11s', timestamp: '2026-02-28 14:10:22' },
  { id: 'ex-009', workflowName: 'Task Assignment Rule', triggerType: 'Event', status: 'failed', entityType: 'Task', entityName: 'Quarterly Review Prep', completedSteps: 1, totalSteps: 3, duration: '15s', timestamp: '2026-02-28 14:08:45' },
  { id: 'ex-010', workflowName: 'Customer Onboarding', triggerType: 'Manual', status: 'success', entityType: 'Contact', entityName: 'Robert Wilson', completedSteps: 7, totalSteps: 7, duration: '4m 30s', timestamp: '2026-02-28 14:00:00' },
]);

const runningCount = computed(() => liveExecutions.value.filter(e => e.status === 'running').length);

// ─── Mock Data: Run History ─────────────────────────────────
function generateSteps(status: string) {
  const stepTemplates = [
    { name: 'Trigger Evaluation', input: 'event payload', output: 'conditions met' },
    { name: 'Data Fetch', input: 'entity_id=1042', output: '12 fields loaded' },
    { name: 'Condition Check', input: 'score > 80', output: 'true' },
    { name: 'Field Update', input: 'status=qualified', output: 'updated' },
    { name: 'Email Send', input: 'template=welcome_v2', output: 'delivered' },
    { name: 'Webhook Call', input: 'POST /api/notify', output: '200 OK' },
    { name: 'Delay Wait', input: '30 minutes', output: 'completed' },
    { name: 'Record Create', input: 'type=activity', output: 'id=act_291' },
  ];
  const count = 3 + Math.floor(Math.random() * 5);
  const steps = [];
  for (let i = 0; i < count; i++) {
    const tpl = stepTemplates[i % stepTemplates.length];
    const isFailed = status === 'failed' && i === count - 1;
    const isRunning = status === 'running' && i === count - 1;
    steps.push({
      ...tpl,
      status: isFailed ? 'failed' : isRunning ? 'running' : 'success',
      duration: `${Math.floor(Math.random() * 30)}s`,
      output: isFailed ? 'Error: timeout exceeded' : tpl.output,
    });
  }
  return steps;
}

const historyData = ref([
  { id: 'run-a3f2b1', shortId: 'a3f2b1', workflowName: 'Lead Qualification Pipeline', triggerType: 'Event', status: 'success', duration: '1m 42s', entityType: 'Lead', entityName: 'John Smith', timestamp: '2026-02-28 14:32:01', steps: generateSteps('success') },
  { id: 'run-b7c4d2', shortId: 'b7c4d2', workflowName: 'Deal Stage Progression', triggerType: 'Webhook', status: 'success', duration: '2m 08s', entityType: 'Deal', entityName: 'Enterprise License', timestamp: '2026-02-28 14:00:12', steps: generateSteps('success') },
  { id: 'run-c9e5f3', shortId: 'c9e5f3', workflowName: 'Welcome Email Sequence', triggerType: 'Event', status: 'failed', duration: '45s', entityType: 'Contact', entityName: 'Sarah Johnson', timestamp: '2026-02-28 13:55:30', steps: generateSteps('failed') },
  { id: 'run-d1g6h4', shortId: 'd1g6h4', workflowName: 'Invoice Generation', triggerType: 'Scheduled', status: 'success', duration: '1m 58s', entityType: 'Deal', entityName: 'Cloud Migration', timestamp: '2026-02-28 13:30:00', steps: generateSteps('success') },
  { id: 'run-e2i7j5', shortId: 'e2i7j5', workflowName: 'Lead Score Update', triggerType: 'Event', status: 'failed', duration: '32s', entityType: 'Lead', entityName: 'Michael Brown', timestamp: '2026-02-28 13:20:15', steps: generateSteps('failed') },
  { id: 'run-f3k8l6', shortId: 'f3k8l6', workflowName: 'Slack Notification', triggerType: 'Webhook', status: 'success', duration: '8s', entityType: 'Task', entityName: 'Follow-up Call', timestamp: '2026-02-28 13:15:33', steps: generateSteps('success') },
  { id: 'run-g4m9n7', shortId: 'g4m9n7', workflowName: 'Contract Approval Flow', triggerType: 'Manual', status: 'running', duration: '5m 02s', entityType: 'Deal', entityName: 'Support Package', timestamp: '2026-02-28 13:10:00', steps: generateSteps('running') },
  { id: 'run-h5o0p8', shortId: 'h5o0p8', workflowName: 'Data Enrichment', triggerType: 'Scheduled', status: 'success', duration: '2m 11s', entityType: 'Lead', entityName: 'Emily Davis', timestamp: '2026-02-28 12:50:22', steps: generateSteps('success') },
  { id: 'run-i6q1r9', shortId: 'i6q1r9', workflowName: 'Task Assignment Rule', triggerType: 'Event', status: 'cancelled', duration: '15s', entityType: 'Task', entityName: 'Quarterly Review', timestamp: '2026-02-28 12:40:45', steps: generateSteps('cancelled') },
  { id: 'run-j7s2t0', shortId: 'j7s2t0', workflowName: 'Customer Onboarding', triggerType: 'Manual', status: 'success', duration: '4m 30s', entityType: 'Contact', entityName: 'Robert Wilson', timestamp: '2026-02-28 12:30:00', steps: generateSteps('success') },
  { id: 'run-k8u3v1', shortId: 'k8u3v1', workflowName: 'Lead Nurture Campaign', triggerType: 'Scheduled', status: 'success', duration: '3m 15s', entityType: 'Lead', entityName: 'Lisa Anderson', timestamp: '2026-02-28 11:45:00', steps: generateSteps('success') },
  { id: 'run-l9w4x2', shortId: 'l9w4x2', workflowName: 'Deal Won Notification', triggerType: 'Event', status: 'success', duration: '12s', entityType: 'Deal', entityName: 'Premium Tier Upgrade', timestamp: '2026-02-28 11:20:33', steps: generateSteps('success') },
  { id: 'run-m0y5z3', shortId: 'm0y5z3', workflowName: 'SLA Escalation', triggerType: 'Scheduled', status: 'failed', duration: '1m 03s', entityType: 'Ticket', entityName: 'Critical Bug #4521', timestamp: '2026-02-28 10:55:12', steps: generateSteps('failed') },
  { id: 'run-n1a6b4', shortId: 'n1a6b4', workflowName: 'Lead Qualification Pipeline', triggerType: 'Event', status: 'success', duration: '1m 28s', entityType: 'Lead', entityName: 'James Taylor', timestamp: '2026-02-28 10:30:00', steps: generateSteps('success') },
  { id: 'run-o2c7d5', shortId: 'o2c7d5', workflowName: 'Invoice Generation', triggerType: 'Scheduled', status: 'success', duration: '2m 22s', entityType: 'Deal', entityName: 'Data Analytics Suite', timestamp: '2026-02-28 10:00:00', steps: generateSteps('success') },
  { id: 'run-p3e8f6', shortId: 'p3e8f6', workflowName: 'Contract Approval Flow', triggerType: 'Manual', status: 'cancelled', duration: '8m 14s', entityType: 'Deal', entityName: 'Consulting Retainer', timestamp: '2026-02-27 16:30:00', steps: generateSteps('cancelled') },
  { id: 'run-q4g9h7', shortId: 'q4g9h7', workflowName: 'Welcome Email Sequence', triggerType: 'Event', status: 'success', duration: '38s', entityType: 'Contact', entityName: 'Maria Garcia', timestamp: '2026-02-27 15:15:00', steps: generateSteps('success') },
  { id: 'run-r5i0j8', shortId: 'r5i0j8', workflowName: 'Data Enrichment', triggerType: 'Scheduled', status: 'failed', duration: '3m 45s', entityType: 'Lead', entityName: 'Batch Import #82', timestamp: '2026-02-27 14:00:00', steps: generateSteps('failed') },
  { id: 'run-s6k1l9', shortId: 's6k1l9', workflowName: 'Deal Stage Progression', triggerType: 'Event', status: 'success', duration: '1m 55s', entityType: 'Deal', entityName: 'API Integration', timestamp: '2026-02-27 11:20:00', steps: generateSteps('success') },
  { id: 'run-t7m2n0', shortId: 't7m2n0', workflowName: 'Lead Score Update', triggerType: 'Webhook', status: 'success', duration: '22s', entityType: 'Lead', entityName: 'Daniel Lee', timestamp: '2026-02-27 09:45:00', steps: generateSteps('success') },
]);

const filteredHistory = computed(() => {
  let data = historyData.value;
  if (historyStatusFilter.value) {
    data = data.filter(r => r.status === historyStatusFilter.value);
  }
  // Date range filtering (mock - would compare actual dates in real impl)
  return data;
});

function onExpandChange(row: any, expandedList: any[]) {
  expandedRows.value = expandedList.map((r: any) => r.id);
}

// ─── Mock Data: Error Logs ──────────────────────────────────
const errorLogs = ref([
  { id: 'err-001', timestamp: '2026-02-28 14:20:15', workflowName: 'Lead Score Update', failedStep: 'API Call: Scoring Service', errorMessage: 'ECONNREFUSED: Connection refused to scoring-api.internal:8443. The upstream service appears to be down or unreachable from the workflow engine.', retryCount: 2 },
  { id: 'err-002', timestamp: '2026-02-28 13:55:30', workflowName: 'Welcome Email Sequence', failedStep: 'Email Send', errorMessage: 'ValidationError: Email template "welcome_v3" not found. Template may have been deleted or renamed.', retryCount: 0 },
  { id: 'err-003', timestamp: '2026-02-28 10:55:12', workflowName: 'SLA Escalation', failedStep: 'Permission Check', errorMessage: 'PermissionDenied: Service account lacks "tickets.escalate" permission on resource "ticket:4521".', retryCount: 1 },
  { id: 'err-004', timestamp: '2026-02-27 14:00:00', workflowName: 'Data Enrichment', failedStep: 'Batch Process', errorMessage: 'TimeoutError: Batch enrichment exceeded 180s timeout limit. 342 of 500 records processed before timeout.', retryCount: 3 },
  { id: 'err-005', timestamp: '2026-02-27 09:12:00', workflowName: 'Invoice Generation', failedStep: 'PDF Render', errorMessage: 'TypeError: Cannot read property "lineItems" of undefined. Deal object missing required pricing data.', retryCount: 1 },
  { id: 'err-006', timestamp: '2026-02-26 18:30:00', workflowName: 'Slack Notification', failedStep: 'Webhook Delivery', errorMessage: 'HTTPError: Slack API returned 429 Too Many Requests. Rate limit exceeded, retry after 30 seconds.', retryCount: 2 },
  { id: 'err-007', timestamp: '2026-02-26 15:22:00', workflowName: 'Contract Approval Flow', failedStep: 'Condition Evaluation', errorMessage: 'ReferenceError: Variable "deal.customField.approvalThreshold" is not defined in workflow context.', retryCount: 0 },
  { id: 'err-008', timestamp: '2026-02-26 11:05:00', workflowName: 'Lead Qualification Pipeline', failedStep: 'Data Fetch', errorMessage: 'DatabaseError: Connection pool exhausted. Max connections (20) reached. Consider increasing pool size.', retryCount: 2 },
  { id: 'err-009', timestamp: '2026-02-25 16:40:00', workflowName: 'Task Assignment Rule', failedStep: 'User Lookup', errorMessage: 'NotFoundError: Assignee user_id "usr_deleted_291" no longer exists in the system.', retryCount: 0 },
  { id: 'err-010', timestamp: '2026-02-25 10:15:00', workflowName: 'Customer Onboarding', failedStep: 'CRM Sync', errorMessage: 'ConflictError: Duplicate record detected. Contact with email "robert@example.com" already exists (id: con_1847).', retryCount: 1 },
]);

// ─── Mock Data: Performance ─────────────────────────────────
const slowWorkflows = ref([
  {
    name: 'Contract Approval Flow',
    avgTime: '6m 42s',
    p95Time: '12m 18s',
    executionCount: 234,
    suggestion: 'Consider parallelizing approval steps or adding auto-approve rules for low-value contracts.',
    rankColor: '#ef4444',
  },
  {
    name: 'Data Enrichment',
    avgTime: '3m 28s',
    p95Time: '8m 05s',
    executionCount: 512,
    suggestion: 'Batch API calls instead of sequential requests. Use caching for frequently queried domains.',
    rankColor: '#f59e0b',
  },
  {
    name: 'Customer Onboarding',
    avgTime: '2m 55s',
    p95Time: '5m 30s',
    executionCount: 178,
    suggestion: 'Pre-compute welcome templates and reduce external API dependencies in the onboarding flow.',
    rankColor: '#3b82f6',
  },
]);

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => [
  {
    label: t('workflowMonitor.activeWorkflows', 'Active Workflows'),
    value: '24',
    icon: 'ph:git-merge-bold',
    color: '#7849ff',
    trend: 12,
  },
  {
    label: t('workflowMonitor.executions24h', 'Executions 24h'),
    value: '1,847',
    icon: 'ph:lightning-bold',
    color: '#3b82f6',
    trend: 8.3,
  },
  {
    label: t('workflowMonitor.successRate', 'Success Rate'),
    value: '96.2%',
    icon: 'ph:check-circle-bold',
    color: '#22c55e',
    trend: 1.4,
  },
  {
    label: t('workflowMonitor.avgExecutionTime', 'Avg Execution Time'),
    value: '1m 24s',
    icon: 'ph:timer-bold',
    color: '#f59e0b',
    trend: -5.2,
  },
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
    case 'running': return '#3b82f6';
    case 'success': return '#22c55e';
    case 'failed': return '#ef4444';
    case 'cancelled': return '#6b7280';
    default: return '#94a3b8';
  }
}

function getStatusTagType(status: string): string {
  switch (status) {
    case 'running': return '';
    case 'success': return 'success';
    case 'failed': return 'danger';
    case 'cancelled': return 'info';
    default: return 'info';
  }
}

function getTriggerTagType(trigger: string): string {
  switch (trigger) {
    case 'Manual': return 'warning';
    case 'Scheduled': return 'info';
    case 'Event': return '';
    case 'Webhook': return 'success';
    default: return 'info';
  }
}

// ─── Actions ────────────────────────────────────────────────
function retryExecution(row: any) {
  if (row.retryCount >= 3) {
    ElMessage.warning(t('workflowMonitor.maxRetriesReached', 'Maximum retry attempts reached for this execution.'));
    return;
  }
  row.retryCount = (row.retryCount || 0) + 1;
  ElMessage.success(t('workflowMonitor.retryQueued', `Retry queued for "${row.workflowName}". Attempt ${row.retryCount}/3.`));
}

function viewRunDetails(row: any) {
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
    // Simulate live counter updates for running executions
    liveExecutions.value.forEach(exec => {
      if (exec.status === 'running') {
        // Parse and increment duration
        const parts = exec.duration.match(/(\d+)m\s*(\d+)s/);
        if (parts) {
          let mins = parseInt(parts[1]);
          let secs = parseInt(parts[2]) + 5;
          if (secs >= 60) { mins++; secs -= 60; }
          exec.duration = `${mins}m ${secs.toString().padStart(2, '0')}s`;
        }
      }
    });
  }, 5000);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

async function refreshAllData() {
  refreshing.value = true;
  // Simulate API refresh delay
  await new Promise(resolve => setTimeout(resolve, 800));
  refreshing.value = false;
  ElMessage.success(t('workflowMonitor.dataRefreshed', 'Dashboard data refreshed.'));
}

// ─── Chart: Error Category Pie ──────────────────────────────
const errorCategoryChartOption = computed(() => {
  const categories = [
    { name: t('workflowMonitor.timeout', 'Timeout'), value: 18, color: '#ef4444' },
    { name: t('workflowMonitor.validationError', 'Validation Error'), value: 25, color: '#f59e0b' },
    { name: t('workflowMonitor.apiError', 'API Error'), value: 32, color: '#3b82f6' },
    { name: t('workflowMonitor.permissionDenied', 'Permission Denied'), value: 12, color: '#8b5cf6' },
    { name: t('workflowMonitor.other', 'Other'), value: 13, color: '#6b7280' },
  ];

  return {
    tooltip: {
      trigger: 'item',
      ...tooltipStyle,
      formatter: (params: any) => `${params.marker} ${params.name}: ${params.value} (${params.percent}%)`,
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#94A3B8', fontSize: 12 },
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
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
          color: '#94A3B8',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            formatter: '{b}\n{c} errors',
          },
        },
        labelLine: { show: false },
        data: categories.map(c => ({
          name: c.name,
          value: c.value,
          itemStyle: { color: c.color },
        })),
      },
    ],
    animationDuration: 800,
    animationEasing: 'cubicOut',
  };
});

// ─── Chart: Execution Time Trend ────────────────────────────
const executionTimeTrendOption = computed(() => {
  const days: string[] = [];
  const avgData: number[] = [];
  const p95Data: number[] = [];
  const p99Data: number[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(`${d.getMonth() + 1}/${d.getDate()}`);

    const baseAvg = 80 + Math.sin(i * 0.3) * 15 + (Math.random() - 0.5) * 10;
    avgData.push(Math.round(baseAvg));
    p95Data.push(Math.round(baseAvg * (1.8 + Math.random() * 0.4)));
    p99Data.push(Math.round(baseAvg * (2.5 + Math.random() * 0.6)));
  }

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: any) => {
        let result = `<strong>${params[0]?.axisValue}</strong><br/>`;
        params.forEach((p: any) => {
          result += `${p.marker} ${p.seriesName}: ${p.value}s<br/>`;
        });
        return result;
      },
    },
    legend: {
      data: [
        t('workflowMonitor.average', 'Average'),
        t('workflowMonitor.p95', 'P95'),
        t('workflowMonitor.p99', 'P99'),
      ],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
    },
    grid: { top: 30, right: 30, bottom: 50, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLabel: { color: '#94A3B8', fontSize: 11, interval: 4 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Seconds',
      nameTextStyle: { color: '#64748B' },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B', formatter: '{value}s' },
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
            { offset: 1, color: 'rgba(59, 130, 246, 0)' },
          ]),
        },
      },
      {
        name: t('workflowMonitor.p95', 'P95'),
        type: 'line',
        data: p95Data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#f59e0b', type: 'dashed' },
        itemStyle: { color: '#f59e0b' },
      },
      {
        name: t('workflowMonitor.p99', 'P99'),
        type: 'line',
        data: p99Data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#ef4444', type: 'dotted' },
        itemStyle: { color: '#ef4444' },
      },
    ],
    animationDuration: 1200,
    animationEasing: 'cubicOut',
  };
});

// ─── Chart: Throughput Histogram ────────────────────────────
const throughputChartOption = computed(() => {
  const hours: string[] = [];
  const counts: number[] = [];

  for (let i = 23; i >= 0; i--) {
    const h = new Date();
    h.setHours(h.getHours() - i);
    const hour = h.getHours();
    hours.push(`${hour.toString().padStart(2, '0')}:00`);

    // Simulate realistic throughput pattern (low at night, high during business hours)
    let base = 20;
    if (hour >= 9 && hour <= 17) base = 60 + Math.floor(Math.random() * 40);
    else if (hour >= 7 && hour <= 20) base = 35 + Math.floor(Math.random() * 25);
    else base = 8 + Math.floor(Math.random() * 15);
    counts.push(base);
  }

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: any) => `<strong>${params[0]?.axisValue}</strong><br/>Executions: ${params[0]?.value}`,
    },
    grid: { top: 20, right: 20, bottom: 30, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: { color: '#94A3B8', fontSize: 10, interval: 3 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B' },
    },
    series: [
      {
        type: 'bar',
        data: counts.map(val => ({
          value: val,
          itemStyle: {
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#7849ff' },
              { offset: 1, color: 'rgba(120, 73, 255, 0.3)' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: '60%',
        animationDuration: 800,
        animationEasing: 'cubicOut',
      },
    ],
  };
});

// ─── Chart: Status Distribution Pie ─────────────────────────
const statusDistributionOption = computed(() => {
  const statuses = [
    { name: t('workflowMonitor.success', 'Success'), value: 1776, color: '#22c55e' },
    { name: t('workflowMonitor.failed', 'Failed'), value: 52, color: '#ef4444' },
    { name: t('workflowMonitor.cancelled', 'Cancelled'), value: 19, color: '#6b7280' },
  ];

  return {
    tooltip: {
      trigger: 'item',
      ...tooltipStyle,
      formatter: (params: any) => `${params.marker} ${params.name}: ${params.value} (${params.percent}%)`,
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: '#94A3B8', fontSize: 12 },
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
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
          color: '#94A3B8',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            formatter: '{b}\n{c} runs',
          },
        },
        labelLine: { show: false },
        data: statuses.map(s => ({
          name: s.name,
          value: s.value,
          itemStyle: { color: s.color },
        })),
      },
    ],
    animationDuration: 800,
    animationEasing: 'cubicOut',
  };
});

// ─── Lifecycle ──────────────────────────────────────────────
onMounted(() => {
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
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
  }
}

@keyframes pulse-white {
  0%, 100% {
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
