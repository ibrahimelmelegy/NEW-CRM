<template lang="pug">
div
  //- Header
  ModuleHeader(
    :title="$t('support.dashboard')"
    :subtitle="$t('support.dashboardSubtitle')"
  )
    template(#actions)
      el-button(size="large" @click="exportTicketsCSV" class="!rounded-2xl")
        Icon(name="ph:download-bold" size="16")
        span.ml-1 {{ $t('common.export') }}
      el-button(size="large" @click="showFilters = !showFilters" class="!rounded-2xl")
        Icon(name="ph:funnel-bold" size="16")
        span.ml-1 {{ $t('support.advancedFilters') }}
      NuxtLink(to="/support/tickets/create")
        el-button(size="large" type="primary" class="!rounded-2xl")
          Icon(name="ph:plus-bold" size="16")
          span.ml-1 {{ $t('support.newTicket') }}
      NuxtLink(to="/support/tickets/kanban")
        el-button(size="large" class="!rounded-2xl")
          Icon(name="ph:columns-bold" size="16")
          span.ml-1 {{ $t('support.kanban') }}

  //- Advanced Filters Panel
  .glass-card.p-6.mb-6.animate-entrance(v-if="showFilters")
    h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
      Icon(name="ph:funnel-bold" size="20" class="mr-2" style="color: #7849ff")
      | {{ $t('support.advancedFilters') }}
    .grid.gap-4(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
      div
        label.block.text-sm.mb-2(style="color: var(--text-muted)") {{ $t('support.filterByStatus') }}
        el-select(v-model="filters.status" multiple clearable :placeholder="statusPlaceholder" class="w-full")
          el-option(v-for="opt in ticketStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value")
      div
        label.block.text-sm.mb-2(style="color: var(--text-muted)") {{ $t('support.filterByPriority') }}
        el-select(v-model="filters.priority" multiple clearable :placeholder="priorityPlaceholder" class="w-full")
          el-option(v-for="opt in ticketPriorityOptions" :key="opt.value" :label="opt.label" :value="opt.value")
      div
        label.block.text-sm.mb-2(style="color: var(--text-muted)") {{ $t('support.dateRange') }}
        el-date-picker(v-model="filters.dateRange" type="daterange" range-separator="-" :start-placeholder="startDatePlaceholder" :end-placeholder="endDatePlaceholder" class="w-full")
      div
        label.block.text-sm.mb-2(style="color: var(--text-muted)") {{ $t('support.slaStatus') }}
        el-select(v-model="filters.slaStatus" clearable :placeholder="slaStatusPlaceholder" class="w-full")
          el-option(:label="withinSLALabel" value="within")
          el-option(:label="atRiskLabel" value="atRisk")
          el-option(:label="breachedLabel" value="breached")
    .flex.gap-2.mt-4
      el-button(type="primary" @click="applyFilters") {{ $t('support.applyFilters') }}
      el-button(@click="clearFilters") {{ $t('support.clearFilters') }}

  //- KPI Cards
  .grid.gap-4.mt-6(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
    .glass-card.p-6.animate-entrance
      .flex.items-center.justify-between
        div
          p.text-sm(style="color: var(--text-muted)") {{ $t('support.openTickets') }}
          p.text-3xl.font-bold.mt-2(style="color: var(--text-primary)") {{ metrics?.openCount || 0 }}
        Icon(name="ph:ticket-bold" size="40" style="color: #7849ff; opacity: 0.2")
    .glass-card.p-6.animate-entrance
      .flex.items-center.justify-between
        div
          p.text-sm(style="color: var(--text-muted)") {{ $t('support.avgResolution') }}
          p.text-3xl.font-bold.mt-2(style="color: var(--text-primary)") {{ metrics?.avgResolutionTime || 0 }}
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('support.hours') }}
        Icon(name="ph:clock-bold" size="40" style="color: #3b82f6; opacity: 0.2")
    .glass-card.p-6.animate-entrance
      .flex.items-center.justify-between
        div
          p.text-sm(style="color: var(--text-muted)") {{ $t('support.slaCompliance') }}
          p.text-3xl.font-bold.mt-2(style="color: var(--text-primary)") {{ metrics?.slaComplianceRate || 0 }}%
        Icon(name="ph:check-circle-bold" size="40" style="color: #22c55e; opacity: 0.2")
    .glass-card.p-6.animate-entrance
      .flex.items-center.justify-between
        div
          p.text-sm(style="color: var(--text-muted)") {{ $t('support.avgCSAT') }}
          p.text-3xl.font-bold.mt-2(style="color: var(--text-primary)") {{ metrics?.avgCSAT || 0 }}
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('support.outOfFive') }}
        Icon(name="ph:star-bold" size="40" style="color: #f59e0b; opacity: 0.2")

  //- SLA Tracking Row
  .grid.gap-4.mt-6(class="grid-cols-1 md:grid-cols-2")
    .glass-card.p-6.animate-entrance
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:warning-bold" size="20" class="mr-2" style="color: #f56c6c")
        | {{ $t('support.slaTracking') }}
      .grid.gap-4(class="grid-cols-2")
        .text-center.p-4.rounded-xl(style="background: rgba(245, 108, 108, 0.1)")
          p.text-2xl.font-bold(style="color: #f56c6c") {{ metrics?.breachedCount || 0 }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('support.breachedTickets') }}
        .text-center.p-4.rounded-xl(style="background: rgba(245, 158, 11, 0.1)")
          p.text-2xl.font-bold(style="color: #f59e0b") {{ metrics?.atRiskCount || 0 }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('support.atRiskTickets') }}

    //- CSAT Metrics
    .glass-card.p-6.animate-entrance
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:smiley-bold" size="20" class="mr-2" style="color: #22c55e")
        | {{ $t('support.csatMetrics') }}
      .flex.items-center.justify-center.h-32
        ClientOnly
          VChart(v-if="csatChartOption" :option="csatChartOption" autoresize style="height: 120px; width: 100%")
        .text-center(v-if="!csatChartOption")
          Icon(name="ph:chart-bar" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('support.noTicketData') }}

  //- Agent Workload
  .glass-card.p-6.mt-6.animate-entrance(v-if="agentWorkload.length > 0")
    .flex.items-center.justify-between.mb-4
      h3.text-lg.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:users-three-bold" size="20" class="mr-2" style="color: #7849ff")
        | {{ $t('support.agentWorkload') }}
      el-tag(type="info") {{ agentWorkload.length }} {{ $t('support.activeAgents') }}
    .grid.gap-4(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
      .glass-card.p-4(v-for="item in agentWorkload.slice(0, 6)" :key="item.agent.id")
        .flex.items-center.gap-3
          el-avatar(:src="item.agent.profilePicture" :size="48")
            Icon(name="ph:user-bold" size="24")
          div.flex-1
            p.font-semibold.text-sm(style="color: var(--text-primary)") {{ item.agent.name }}
            p.text-xs(style="color: var(--text-muted)") {{ item.agent.email }}
        .grid.grid-cols-3.gap-2.mt-3.text-center
          div
            p.text-lg.font-bold(style="color: #7849ff") {{ item.openTickets }}
            p.text-xs(style="color: var(--text-muted)") {{ $t('support.openTickets') }}
          div
            p.text-lg.font-bold(style="color: #22c55e") {{ item.resolvedToday }}
            p.text-xs(style="color: var(--text-muted)") {{ $t('support.resolvedToday') }}
          div
            p.text-lg.font-bold(style="color: #f59e0b") {{ item.avgCSAT }}
            p.text-xs(style="color: var(--text-muted)") {{ $t('support.csatAbbrev') }}

  //- Charts Row
  .grid.gap-6.mt-6(class="grid-cols-1 lg:grid-cols-2")
    //- Tickets by Status (ECharts Donut)
    .glass-card.p-6.animate-entrance
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:chart-pie-slice-bold" size="20" class="mr-2" style="color: #7849ff")
        | {{ $t('support.ticketsByStatus') }}
      .flex.justify-center(v-if="!loading")
        ClientOnly
          VChart(v-if="statusChartOption" :option="statusChartOption" autoresize style="height: 300px; width: 100%")
        .text-center.py-12(v-if="!statusChartOption")
          Icon(name="ph:chart-pie-slice" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('support.noTicketData') }}
      el-skeleton(v-else :rows="6" animated)

    //- Tickets by Priority (ECharts Donut)
    .glass-card.p-6.animate-entrance
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:flag-bold" size="20" class="mr-2" style="color: #f59e0b")
        | {{ $t('support.ticketsByPriority') }}
      .flex.justify-center(v-if="!loading")
        ClientOnly
          VChart(v-if="priorityChartOption" :option="priorityChartOption" autoresize style="height: 300px; width: 100%")
        .text-center.py-12(v-if="!priorityChartOption")
          Icon(name="ph:flag" size="40" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('support.noTicketData') }}
      el-skeleton(v-else :rows="6" animated)

  //- Quick Links
  .grid.gap-4.mt-6(class="grid-cols-2 md:grid-cols-4")
    NuxtLink(to="/support/tickets")
      .glass-card.p-4.text-center.rounded-2xl.transition-all(class="hover:border-[#7849ff]/30")
        Icon(name="ph:ticket-bold" size="28" style="color: #7849ff")
        p.text-sm.font-semibold.mt-2(style="color: var(--text-primary)") {{ $t('support.allTickets') }}
    NuxtLink(to="/support/tickets/kanban")
      .glass-card.p-4.text-center.rounded-2xl.transition-all(class="hover:border-[#3b82f6]/30")
        Icon(name="ph:columns-bold" size="28" style="color: #3b82f6")
        p.text-sm.font-semibold.mt-2(style="color: var(--text-primary)") {{ $t('support.kanbanBoard') }}
    NuxtLink(to="/support/knowledge-base")
      .glass-card.p-4.text-center.rounded-2xl.transition-all(class="hover:border-[#22c55e]/30")
        Icon(name="ph:book-open-bold" size="28" style="color: #22c55e")
        p.text-sm.font-semibold.mt-2(style="color: var(--text-primary)") {{ $t('support.knowledgeBase') }}
    NuxtLink(to="/support/live-chat")
      .glass-card.p-4.text-center.rounded-2xl.transition-all(class="hover:border-[#f59e0b]/30")
        Icon(name="ph:chat-circle-dots-bold" size="28" style="color: #f59e0b")
        p.text-sm.font-semibold.mt-2(style="color: var(--text-primary)") {{ $t('support.liveChat') }}

  //- Recent Tickets
  .glass-card.p-6.mt-6.animate-entrance
    .flex.items-center.justify-between.mb-4
      h3.text-lg.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:clock-counter-clockwise-bold" size="20" class="mr-2" style="color: #7849ff")
        | {{ $t('support.recentTickets') }}
      NuxtLink(to="/support/tickets")
        el-button(text type="primary") {{ $t('common.viewAll') }}

    //- Bulk Actions Bar
    .flex.items-center.gap-2.mb-3(v-if="selectedRows.length")
      span.text-sm.font-medium(style="color: var(--text-primary)") {{ selectedRows.length }} {{ $t('common.selected') }}
      el-button(size="small" type="success" @click="bulkResolveTickets" class="!rounded-xl")
        Icon(name="ph:check-circle-bold" size="14")
        span.ml-1 {{ $t('support.resolve') }}
      el-button(size="small" @click="bulkAutoAssignTickets" class="!rounded-xl")
        Icon(name="ph:user-plus-bold" size="14")
        span.ml-1 {{ $t('support.autoAssign') }}
      el-button(size="small" @click="exportTicketsCSV" class="!rounded-xl")
        Icon(name="ph:download-bold" size="14")
        span.ml-1 {{ $t('common.export') }}

    el-table(:data="recentTickets" v-loading="loadingRecent" style="width: 100%" @row-click="handleRowClick" row-class-name="cursor-pointer" stripe @selection-change="handleSelectionChange")
      el-table-column(type="selection" width="40")
      el-table-column(label="#" width="120")
        template(#default="{ row }")
          span.font-mono.font-bold(style="color: #7849ff") {{ row.ticketNumber }}
      el-table-column(:label="subjectLabel" min-width="280" prop="subject")
      el-table-column(:label="statusLabel" width="150" align="center")
        template(#default="{ row }")
          el-tag(:color="getStatusColor(row.status)" effect="dark" round size="small") {{ getStatusLabel(row.status) }}
      el-table-column(:label="priorityLabel" width="120" align="center")
        template(#default="{ row }")
          el-tag(:color="getPriorityColor(row.priority)" effect="dark" round size="small") {{ row.priority }}
      el-table-column(:label="slaLabel" width="140" align="center")
        template(#default="{ row }")
          .text-xs(v-if="row.slaDeadline")
            span(:style="getSLAStyle(row)") {{ getSLAStatus(row) }}
          span.text-gray-400(v-else) -
      el-table-column(:label="assigneeLabel" width="150")
        template(#default="{ row }")
          span(v-if="row.assignee") {{ row.assignee.name }}
          span.text-gray-400(v-else) {{ $t('support.unassigned') }}
      el-table-column(:label="createdLabel" width="140")
        template(#default="{ row }")
          span.text-sm {{ formatDate(row.createdAt) }}

  //- Ticket Detail Drawer
  el-drawer(v-model="drawerVisible" :title="drawerTitle" size="50%" direction="rtl")
    div(v-if="selectedTicket" class="px-4")
      //- Ticket Header
      .mb-6
        .flex.items-center.justify-between.mb-4
          h2.text-xl.font-bold(style="color: var(--text-primary)") {{ selectedTicket.subject }}
          .flex.gap-2
            el-button(size="small" @click="handleAutoAssign" :loading="assigning") {{ $t('support.autoAssign') }}
            el-button(size="small" type="success" @click="handleResolve") {{ $t('support.resolve') }}
        .flex.gap-2.flex-wrap
          el-tag(:color="getStatusColor(selectedTicket.status)" effect="dark") {{ getStatusLabel(selectedTicket.status) }}
          el-tag(:color="getPriorityColor(selectedTicket.priority)" effect="dark") {{ selectedTicket.priority }}
          el-tag(v-if="selectedTicket.slaDeadline" :type="getSLATagType(selectedTicket)") {{ getSLAStatus(selectedTicket) }}

      //- Ticket Info
      .glass-card.p-4.mb-4
        .grid.gap-3(class="grid-cols-2")
          div
            p.text-xs(style="color: var(--text-muted)") {{ $t('support.ticketNumber') }}
            p.font-mono.font-semibold(style="color: var(--text-primary)") {{ selectedTicket.ticketNumber }}
          div
            p.text-xs(style="color: var(--text-muted)") {{ $t('support.assignedTo') }}
            p.font-semibold(style="color: var(--text-primary)") {{ selectedTicket.assignee?.name || $t('support.unassigned') }}
          div
            p.text-xs(style="color: var(--text-muted)") {{ $t('support.source') }}
            p.font-semibold(style="color: var(--text-primary)") {{ selectedTicket.source }}
          div
            p.text-xs(style="color: var(--text-muted)") {{ $t('support.category') }}
            p.font-semibold(style="color: var(--text-primary)") {{ selectedTicket.category?.name || '-' }}

      //- Description
      .glass-card.p-4.mb-4(v-if="selectedTicket.description")
        p.text-sm.font-semibold.mb-2(style="color: var(--text-primary)") {{ $t('common.description') }}
        p.text-sm(style="color: var(--text-muted)") {{ selectedTicket.description }}

      //- Messages/Timeline
      .glass-card.p-4.mb-4
        h4.text-sm.font-semibold.mb-3(style="color: var(--text-primary)") {{ $t('support.timeline') }}
        .space-y-3(v-if="selectedTicket.messages && selectedTicket.messages.length > 0")
          .border-l-2.border-gray-300.pl-4.pb-2(v-for="msg in selectedTicket.messages" :key="msg.id")
            .flex.items-center.gap-2.mb-1
              el-tag(size="small" :type="msg.senderType === 'AGENT' ? 'primary' : 'info'") {{ msg.senderType }}
              span.text-xs(style="color: var(--text-muted)") {{ formatDate(msg.createdAt) }}
            p.text-sm(style="color: var(--text-primary)") {{ msg.body }}
        p.text-sm.text-center(v-else style="color: var(--text-muted)") {{ $t('support.noTicketData') }}

      //- CSAT
      .glass-card.p-4(v-if="selectedTicket.csatRating")
        h4.text-sm.font-semibold.mb-2(style="color: var(--text-primary)") {{ $t('support.csatRating') }}
        .flex.items-center.gap-2
          el-rate(v-model="selectedTicket.csatRating" disabled show-score)
          p.text-xs(v-if="selectedTicket.csatComment" style="color: var(--text-muted)") {{ selectedTicket.csatComment }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchSupportDashboard,
  fetchTickets,
  fetchAgentWorkload,
  fetchTicketById,
  autoAssignTicket,
  resolveTicket,
  getStatusOption,
  getPriorityOption,
  ticketStatusOptions,
  ticketPriorityOptions
} from '@/composables/useSupport';
import type { TicketMetrics, AgentWorkload } from '@/composables/useSupport';

const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const loadingRecent = ref(false);
const metrics = ref<TicketMetrics | null>(null);
const recentTickets = ref<Record<string, unknown>[]>([]);
const agentWorkload = ref<AgentWorkload[]>([]);
const showFilters = ref(false);
const drawerVisible = ref(false);
const selectedTicket = ref<Record<string, unknown> | null>(null);
const assigning = ref(false);

// Bulk Selection
const selectedRows = ref<Record<string, unknown>[]>([]);
const handleSelectionChange = (rows: Record<string, unknown>[]) => {
  selectedRows.value = rows;
};

const filters = ref({
  status: [] as string[],
  priority: [] as string[],
  dateRange: null as unknown,
  slaStatus: ''
});

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#409eff',
  IN_PROGRESS: '#e6a23c',
  WAITING_CUSTOMER: '#909399',
  RESOLVED: '#67c23a',
  CLOSED: '#303133'
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#909399',
  MEDIUM: '#409eff',
  HIGH: '#e6a23c',
  URGENT: '#f56c6c'
};

const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.85)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  borderWidth: 1,
  textStyle: { color: '#fff' },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

function buildDonutOption(data: Record<string, number>, colorMap: Record<string, string>, title: string) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return null;

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', ...tooltipStyle },
    legend: {
      bottom: 0,
      left: 'center',
      textStyle: { color: '#94A3B8', fontSize: 11 }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: 'rgba(0,0,0,0.2)', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
          itemStyle: { shadowBlur: 15, shadowColor: 'rgba(120, 73, 255, 0.4)' }
        },
        data: entries.map(([key, value]) => ({
          name: key.replace(/_/g, ' '),
          value,
          itemStyle: { color: colorMap[key] || '#6b7280' }
        }))
      }
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: { text: String(total), fontSize: 28, fontWeight: 'bold', fill: '#fff', textAlign: 'center' }
      },
      { type: 'text', left: 'center', top: '48%', style: { text: title, fontSize: 12, fill: '#94A3B8', textAlign: 'center' } }
    ]
  };
}

const statusChartOption = computed(() => {
  if (!metrics.value?.ticketsByStatus) return null;
  return buildDonutOption(metrics.value.ticketsByStatus, STATUS_COLORS, t('support.ticketsTotal'));
});

const priorityChartOption = computed(() => {
  if (!metrics.value?.ticketsByPriority) return null;
  return buildDonutOption(metrics.value.ticketsByPriority, PRIORITY_COLORS, t('support.byPriority'));
});

const csatChartOption = computed(() => {
  if (!metrics.value?.avgCSAT) return null;
  const rating = metrics.value.avgCSAT;
  const stars = [1, 2, 3, 4, 5];
  return {
    tooltip: { trigger: 'item', ...tooltipStyle },
    xAxis: { type: 'category', data: stars, axisLabel: { color: '#94A3B8' } },
    yAxis: { type: 'value', axisLabel: { color: '#94A3B8' } },
    series: [
      {
        type: 'bar',
        data: stars.map(s => (s <= Math.round(rating) ? 1 : 0.3)),
        itemStyle: { color: '#f59e0b', borderRadius: [8, 8, 0, 0] }
      }
    ],
    grid: { left: 40, right: 20, top: 20, bottom: 30 }
  };
});

// Computed labels for table columns
const subjectLabel = computed(() => t('support.subject'));
const statusLabel = computed(() => t('common.status'));
const priorityLabel = computed(() => t('support.priority'));
const slaLabel = computed(() => t('support.sla'));
const assigneeLabel = computed(() => t('support.assignedTo'));
const createdLabel = computed(() => t('common.createdAt'));
const drawerTitle = computed(() => (selectedTicket.value ? `#${selectedTicket.value.ticketNumber}` : ''));

// Computed placeholders for filters
const statusPlaceholder = computed(() => t('support.filterByStatus'));
const priorityPlaceholder = computed(() => t('support.filterByPriority'));
const startDatePlaceholder = computed(() => t('common.startDate'));
const endDatePlaceholder = computed(() => t('common.endDate'));
const slaStatusPlaceholder = computed(() => t('support.slaStatus'));
const withinSLALabel = computed(() => t('support.withinSLA'));
const atRiskLabel = computed(() => t('support.atRisk'));
const breachedLabel = computed(() => t('support.breached'));

async function loadDashboard() {
  loading.value = true;
  try {
    const { body, success }: unknown = await fetchSupportDashboard();
    if (success && body) {
      metrics.value = body;
    }
  } finally {
    loading.value = false;
  }
}

async function loadRecentTickets() {
  loadingRecent.value = true;
  try {
    const query: unknown = { page: 1, limit: 10 };

    if (filters.value.status.length > 0) {
      query.status = filters.value.status.join(',');
    }
    if (filters.value.priority.length > 0) {
      query.priority = filters.value.priority.join(',');
    }
    if (filters.value.dateRange && filters.value.dateRange.length === 2) {
      query.startDate = filters.value.dateRange[0];
      query.endDate = filters.value.dateRange[1];
    }
    if (filters.value.slaStatus) {
      query.slaStatus = filters.value.slaStatus;
    }

    const { body, success }: unknown = await fetchTickets(query);
    if (success && body) {
      recentTickets.value = body.docs || [];
    }
  } finally {
    loadingRecent.value = false;
  }
}

async function loadAgentWorkload() {
  try {
    const { body, success }: unknown = await fetchAgentWorkload();
    if (success && body) {
      agentWorkload.value = body || [];
    }
  } catch (error) {
    console.error('Failed to load agent workload:', error);
  }
}

async function handleRowClick(row: unknown) {
  try {
    const { body, success } = await fetchTicketById(row.id);
    if (success && body) {
      selectedTicket.value = body;
      drawerVisible.value = true;
    }
  } catch (error) {
    console.error('Failed to load ticket details:', error);
  }
}

async function handleAutoAssign() {
  if (!selectedTicket.value) return;
  assigning.value = true;
  try {
    const { success } = await autoAssignTicket(selectedTicket.value.id);
    if (success) {
      ElMessage.success(t('common.success'));
      const { body } = await fetchTicketById(selectedTicket.value.id);
      if (body) selectedTicket.value = body;
      await Promise.all([loadDashboard(), loadRecentTickets(), loadAgentWorkload()]);
    }
  } catch (error) {
    ElMessage.error(t('common.error'));
  } finally {
    assigning.value = false;
  }
}

async function handleResolve() {
  if (!selectedTicket.value) return;
  try {
    const { success } = await resolveTicket(selectedTicket.value.id);
    if (success) {
      ElMessage.success(t('common.success'));
      drawerVisible.value = false;
      await Promise.all([loadDashboard(), loadRecentTickets(), loadAgentWorkload()]);
    }
  } catch (error) {
    ElMessage.error(t('common.error'));
  }
}

function applyFilters() {
  loadRecentTickets();
}

function clearFilters() {
  filters.value = {
    status: [],
    priority: [],
    dateRange: null,
    slaStatus: ''
  };
  loadRecentTickets();
}

function getStatusColor(status: string) {
  return getStatusOption(status)!.color;
}

function getStatusLabel(status: string) {
  return getStatusOption(status)!.label;
}

function getPriorityColor(priority: string) {
  return getPriorityOption(priority)!.color;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getSLAStatus(ticket: unknown): string {
  if (!ticket.slaDeadline) return '-';
  const now = new Date().getTime();
  const deadline = new Date(ticket.slaDeadline).getTime();
  const diff = deadline - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (diff < 0) return t('support.overdue');
  if (hours <= 2) return `${hours}h ${t('support.atRisk')}`;
  return `${hours}h ${t('support.hoursRemaining')}`;
}

function getSLAStyle(ticket: unknown) {
  if (!ticket.slaDeadline) return {};
  const now = new Date().getTime();
  const deadline = new Date(ticket.slaDeadline).getTime();
  const diff = deadline - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (diff < 0) return { color: '#f56c6c', fontWeight: 'bold' };
  if (hours <= 2) return { color: '#f59e0b', fontWeight: 'bold' };
  return { color: '#22c55e' };
}

function getSLATagType(ticket: unknown): string {
  if (!ticket.slaDeadline) return 'info';
  const now = new Date().getTime();
  const deadline = new Date(ticket.slaDeadline).getTime();
  const diff = deadline - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (diff < 0) return 'danger';
  if (hours <= 2) return 'warning';
  return 'success';
}

// Bulk Actions
async function bulkResolveTickets() {
  if (!selectedRows.value.length) return;
  try {
    await ElMessageBox.confirm(t('support.confirmBulkResolve', { count: selectedRows.value.length }), t('common.warning'), { type: 'warning' });
    for (const row of selectedRows.value) {
      await resolveTicket(row.id);
    }
    selectedRows.value = [];
    await Promise.all([loadDashboard(), loadRecentTickets(), loadAgentWorkload()]);
    ElMessage.success(t('common.success'));
  } catch {
    // User cancelled
  }
}

async function bulkAutoAssignTickets() {
  if (!selectedRows.value.length) return;
  try {
    await ElMessageBox.confirm(t('support.confirmBulkAutoAssign', { count: selectedRows.value.length }), t('common.warning'), { type: 'warning' });
    for (const row of selectedRows.value) {
      await autoAssignTicket(row.id);
    }
    selectedRows.value = [];
    await Promise.all([loadDashboard(), loadRecentTickets(), loadAgentWorkload()]);
    ElMessage.success(t('common.success'));
  } catch {
    // User cancelled
  }
}

function exportTicketsCSV() {
  const data = selectedRows.value.length ? selectedRows.value : recentTickets.value;
  if (!data.length) return;
  const headers = [
    t('support.csvTicketNumber'),
    t('support.csvSubject'),
    t('support.csvStatus'),
    t('support.csvPriority'),
    t('support.csvAssignee'),
    t('support.csvCreated')
  ];
  const csv = [
    headers.join(','),
    ...data.map(row =>
      [
        `"${row.ticketNumber || ''}"`,
        `"${(row.subject || '').replace(/"/g, '""')}"`,
        `"${row.status || ''}"`,
        `"${row.priority || ''}"`,
        `"${row.assignee?.name || ''}"`,
        `"${formatDate(row.createdAt)}"`
      ].join(',')
    )
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `support-tickets-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(t('common.exported'));
}

onMounted(async () => {
  await Promise.all([loadDashboard(), loadRecentTickets(), loadAgentWorkload()]);
});
</script>
