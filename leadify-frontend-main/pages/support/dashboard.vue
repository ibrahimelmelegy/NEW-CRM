<template lang="pug">
div
  //- Header
  ModuleHeader(
    :title="$t('support.dashboard')"
    :subtitle="$t('support.dashboardSubtitle')"
  )
    template(#actions)
      NuxtLink(to="/support/tickets/create")
        el-button(size="large" type="primary" class="!rounded-2xl")
          Icon(name="ph:plus-bold" size="16")
          span.ml-1 {{ $t('support.newTicket') }}
      NuxtLink(to="/support/tickets/kanban")
        el-button(size="large" class="!rounded-2xl")
          Icon(name="ph:columns-bold" size="16")
          span.ml-1 Kanban

  //- KPI Cards
  SupportTicketMetrics(v-if="metrics" :metrics="metrics")

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

    el-table(:data="recentTickets" v-loading="loadingRecent" style="width: 100%" @row-click="handleRowClick" row-class-name="cursor-pointer" stripe)
      el-table-column(label="#" width="120")
        template(#default="{ row }")
          span.font-mono.font-bold(style="color: #7849ff") {{ row.ticketNumber }}
      el-table-column(label="Subject" min-width="280" prop="subject")
      el-table-column(label="Status" width="150" align="center")
        template(#default="{ row }")
          el-tag(:color="getStatusColor(row.status)" effect="dark" round size="small") {{ getStatusLabel(row.status) }}
      el-table-column(label="Priority" width="120" align="center")
        template(#default="{ row }")
          el-tag(:color="getPriorityColor(row.priority)" effect="dark" round size="small") {{ row.priority }}
      el-table-column(label="Assignee" width="150")
        template(#default="{ row }")
          span(v-if="row.assignee") {{ row.assignee.name }}
          span.text-gray-400(v-else) Unassigned
      el-table-column(label="Created" width="140")
        template(#default="{ row }")
          span.text-sm {{ formatDate(row.createdAt) }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { fetchSupportDashboard, fetchTickets, getStatusOption, getPriorityOption } from '@/composables/useSupport';
import type { TicketMetrics } from '@/composables/useSupport';

const router = useRouter();

const loading = ref(true);
const loadingRecent = ref(false);
const metrics = ref<TicketMetrics | null>(null);
const recentTickets = ref<any[]>([]);

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
      { type: 'text', left: 'center', top: '38%', style: { text: String(total), fontSize: 28, fontWeight: 'bold', fill: '#fff', textAlign: 'center' } },
      { type: 'text', left: 'center', top: '48%', style: { text: title, fontSize: 12, fill: '#94A3B8', textAlign: 'center' } }
    ]
  };
}

const statusChartOption = computed(() => {
  if (!metrics.value?.ticketsByStatus) return null;
  return buildDonutOption(metrics.value.ticketsByStatus, STATUS_COLORS, 'Tickets');
});

const priorityChartOption = computed(() => {
  if (!metrics.value?.ticketsByPriority) return null;
  return buildDonutOption(metrics.value.ticketsByPriority, PRIORITY_COLORS, 'By Priority');
});

async function loadDashboard() {
  loading.value = true;
  try {
    const { body, success } = await fetchSupportDashboard();
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
    const { body, success } = await fetchTickets({ page: 1, limit: 10 });
    if (success && body) {
      recentTickets.value = body.docs || [];
    }
  } finally {
    loadingRecent.value = false;
  }
}

function handleRowClick(row: any) {
  router.push(`/support/tickets/${row.id}`);
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

onMounted(async () => {
  await Promise.all([loadDashboard(), loadRecentTickets()]);
});
</script>
