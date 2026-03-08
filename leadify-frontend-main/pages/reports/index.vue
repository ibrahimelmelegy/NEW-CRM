<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    div
      h1.text-3xl.font-black.tracking-tight.flex.items-center.gap-3(style="color: var(--text-primary);")
        Icon(name="ph:chart-bar-bold" size="32" style="color: #7849ff")
        | {{ $t('reports.hub') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('reports.hubSubtitle') }}

    //- Date Range Filter and Export Buttons
    .flex.items-center.gap-3(class="flex-wrap")
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :range-separator="$t('reports.dateRange')"
        :start-placeholder="$t('reports.startDate')"
        :end-placeholder="$t('reports.endDate')"
        @change="loadData"
        size="default"
        style="width: 280px"
      )
      el-button(type="primary" @click="handleExport('csv')" :loading="exporting" plain)
        Icon(name="ph:file-csv-bold" size="18")
        span.ml-2 {{ $t('reports.exportAsCSV') }}
      el-button(type="success" @click="handleExport('excel')" :loading="exporting" plain)
        Icon(name="ph:file-xls-bold" size="18")
        span.ml-2 {{ $t('reports.exportAsExcel') }}

  //- Quick Stats Row
  .grid.grid-cols-6.gap-4.mb-8
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('reports.documents') }}
      p.text-2xl.font-black.mt-1(style="color: var(--text-primary);") {{ docStats.totalDocs }}
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('reports.revenue') }}
      p.text-2xl.font-black.mt-1(style="color: #22c55e;") {{ docStats.totalValue.toLocaleString() }}
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('reports.pending') }}
      p.text-2xl.font-black.mt-1(style="color: #f59e0b;") {{ docStats.pendingValue.toLocaleString() }}
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('reports.reminders') }}
      p.text-2xl.font-black.mt-1(style="color: #7c3aed;") {{ remStats.pending }}
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('reports.overdue') }}
      p.text-2xl.font-black.mt-1(style="color: #ef4444;") {{ remStats.overdue }}
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('reports.archived') }}
      p.text-2xl.font-black.mt-1(style="color: var(--text-muted);") {{ archiveStats.total }}

  //- Two Column: Document Breakdown + Status Breakdown
  .grid.grid-cols-2.gap-6.mb-8
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        span.font-bold.flex.items-center.gap-2
          Icon(name="ph:clipboard-text-bold" size="18" style="color: #7849ff")
          | {{ $t('reports.documentsByType') }}
      .space-y-3
        .flex.items-center.justify-between.p-3.rounded-xl(
          v-for="(count, type) in docStats.byType"
          :key="type"
        )
          .flex.items-center.gap-3
            .w-3.h-3.rounded-full(:style="{ backgroundColor: typeColors[String(type)] || '#6b7280' }")
            span.text-sm.font-semibold {{ typeLabels[String(type)] || type }}
          .flex.items-center.gap-3
            span.text-sm.font-mono.font-bold {{ count }}
            .h-2.w-20.rounded-full.bg-gray-100
              .h-2.rounded-full(:style="{ width: `${Math.min(100, (Number(count) / docStats.totalDocs) * 100)}%`, backgroundColor: typeColors[String(type)] || '#6b7280' }")
        .text-center.py-6.text-sm(v-if="Object.keys(docStats.byType).length === 0" style="color: var(--text-muted);") {{ $t('reports.noData') }}

    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        span.font-bold.flex.items-center.gap-2
          Icon(name="ph:trend-up-bold" size="18" style="color: #22c55e")
          | {{ $t('reports.documentsByStatus') }}
      .space-y-3
        .flex.items-center.justify-between.p-3.rounded-xl(
          v-for="(count, status) in docStats.byStatus"
          :key="status"
        )
          .flex.items-center.gap-3
            .w-3.h-3.rounded-full(:style="{ backgroundColor: statusColors[String(status)] || '#6b7280' }")
            span.text-sm.font-semibold {{ statusLabels[String(status)] || status }}
          span.text-sm.font-mono.font-bold {{ count }}
        .text-center.py-6.text-sm(v-if="Object.keys(docStats.byStatus).length === 0" style="color: var(--text-muted);") {{ $t('reports.noData') }}

  //- Monthly Revenue + Activity
  .grid.grid-cols-2.gap-6.mb-8
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        span.font-bold.flex.items-center.gap-2
          Icon(name="ph:currency-circle-dollar-bold" size="18" style="color: #10b981")
          | {{ $t('reports.monthlyRevenue') }}
      .space-y-2
        .flex.items-center.justify-between.p-3.rounded-xl(
          v-for="(revenue, month) in docStats.monthlyRevenue"
          :key="month"
        )
          span.text-sm.font-semibold.font-mono {{ month }}
          span.text-sm.font-bold(style="color: #22c55e;") {{ Number(revenue).toLocaleString() }} SAR
        .text-center.py-6.text-sm(v-if="Object.keys(docStats.monthlyRevenue).length === 0" style="color: var(--text-muted);") {{ $t('reports.noRevenueData') }}

    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        span.font-bold.flex.items-center.gap-2
          Icon(name="ph:clock-counter-clockwise-bold" size="18" style="color: #f59e0b")
          | {{ $t('reports.recentActivity') }}
      .space-y-1
        .flex.items-center.gap-3.px-3.py-2(v-for="act in recentActivities.slice(0, 10)" :key="act.id")
          .w-7.h-7.rounded-lg.flex.items-center.justify-center.flex-shrink-0(:style="{ backgroundColor: (actionColors[act.action] || '#6b7280') + '15' }")
            Icon(:name="actionIcons[act.action] || 'ph:circle'" size="14" :style="{ color: actionColors[act.action] || '#6b7280' }")
          .flex-1.min-w-0
            p.text-xs.font-semibold.truncate(style="color: var(--text-primary);") {{ act.description }}
            p.text-xs.font-mono(style="color: var(--text-muted); opacity: 0.6;") {{ timeAgo(act.timestamp) }}
        .text-center.py-6.text-sm(v-if="recentActivities.length === 0" style="color: var(--text-muted);") {{ $t('reports.noActivityLogged') }}

  //- Analytics Charts Section
  .grid.gap-6.mb-8(class="grid-cols-1 lg:grid-cols-2")
    //- Bar Chart - Document Type Distribution
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        .flex.items-center.justify-between
          span.font-bold.flex.items-center.gap-2
            Icon(name="ph:chart-bar-bold" size="18" style="color: #7849ff")
            | {{ $t('reports.documentsByType') }}
          el-button(size="small" text @click="drillDownType = 'type'")
            | {{ $t('reports.viewDetails') }}
      VChart.w-full(v-if="Object.keys(docStats.byType).length" :option="typeChartOption" style="height: 300px" autoresize)
      .text-center.py-12(v-else)
        p.text-sm(style="color: var(--text-muted);") {{ $t('reports.noDataAvailable') }}

    //- Pie Chart - Document Status Distribution
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        .flex.items-center.justify-between
          span.font-bold.flex.items-center.gap-2
            Icon(name="ph:chart-pie-bold" size="18" style="color: #22c55e")
            | {{ $t('reports.documentsByStatus') }}
          el-button(size="small" text @click="drillDownType = 'status'")
            | {{ $t('reports.viewDetails') }}
      VChart.w-full(v-if="Object.keys(docStats.byStatus).length" :option="statusChartOption" style="height: 300px" autoresize)
      .text-center.py-12(v-else)
        p.text-sm(style="color: var(--text-muted);") {{ $t('reports.noDataAvailable') }}

  //- Report Cards
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    template(#header)
      span.font-bold.flex.items-center.gap-2
          Icon(name="ph:compass-bold" size="18" style="color: #3b82f6")
          | {{ $t('reports.quickNavigation') }}
    .grid.gap-4(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
      NuxtLink(v-for="report in quickLinks" :key="report.title" :to="report.url")
        .p-5.rounded-xl.border.text-center.transition-all.cursor-pointer(
          style="border-color: var(--border-default);"
          class="hover:shadow-md hover:border-violet-300"
        )
          .flex.justify-center.mb-2
            Icon(:name="report.icon" size="28" style="color: #7849ff")
          p.text-sm.font-bold(style="color: var(--text-primary);") {{ report.title }}
          p.text-xs.mt-1(style="color: var(--text-muted);") {{ report.desc }}

  //- Drill-down Dialog
  el-dialog(
    v-model="showDrillDown"
    :title="drillDownTitle"
    width="700px"
    :destroy-on-close="true"
  )
    .space-y-4(v-if="drillDownData.length")
      .flex.items-center.justify-between.p-4.rounded-xl.border(
        v-for="item in drillDownData"
        :key="item.label"
        style="border-color: var(--border-default);"
      )
        .flex.items-center.gap-3
          .w-4.h-4.rounded-full(:style="{ backgroundColor: item.color }")
          span.font-semibold {{ item.label }}
        .flex.items-center.gap-4
          span.text-lg.font-bold {{ item.value }}
          span.text-sm(style="color: var(--text-muted);") {{ item.percentage }}%
    .text-center.py-12(v-else)
      p.text-sm(style="color: var(--text-muted);") {{ $t('reports.noDataAvailable') }}
    template(#footer)
      el-button(@click="showDrillDown = false") {{ $t('reports.closeDetails') }}
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { ref, computed, watch } from 'vue';
import VChart from 'vue-echarts';
import { graphic } from 'echarts/core';
import { ElMessage } from 'element-plus';
import { useDocumentStore } from '~/composables/useDocumentStore';
import { useReminders } from '~/composables/useReminders';
import { useDocumentArchive } from '~/composables/useDocumentArchive';
import { useActivityLog } from '~/composables/useActivityLog';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({});

const { t } = useI18n();

const { stats: docStats } = useDocumentStore();
const { stats: remStats } = useReminders();
const { stats: archiveStats } = useDocumentArchive();
const { recent: recentActivities, actionIcons, actionColors } = useActivityLog();

const dateRange = ref<[Date, Date] | null>(null);
const exporting = ref(false);
const showDrillDown = ref(false);
const drillDownType = ref<'type' | 'status' | null>(null);

watch(drillDownType, newVal => {
  if (newVal) showDrillDown.value = true;
});

const typeLabels = computed<Record<string, string>>(() => ({
  invoice: t('reports.docTypes.invoice'),
  proforma_invoice: t('reports.docTypes.proformaInvoice'),
  purchase_order: t('reports.docTypes.purchaseOrder'),
  credit_note: t('reports.docTypes.creditNote'),
  quote: t('reports.docTypes.quote'),
  rfq: t('reports.docTypes.rfq'),
  sales_order: t('reports.docTypes.salesOrder'),
  delivery_note: t('reports.docTypes.deliveryNote'),
  contract: t('reports.docTypes.contract'),
  proposal: t('reports.docTypes.proposal'),
  sla: t('reports.docTypes.sla')
}));

const statusLabels = computed<Record<string, string>>(() => ({
  Draft: t('reports.statusLabels.draft'),
  Sent: t('reports.statusLabels.sent'),
  Approved: t('reports.statusLabels.approved'),
  Rejected: t('reports.statusLabels.rejected'),
  Archived: t('reports.statusLabels.archived')
}));
const typeColors: Record<string, string> = {
  invoice: '#7c3aed',
  proforma_invoice: '#6d28d9',
  purchase_order: '#2563eb',
  credit_note: '#dc2626',
  quote: '#059669',
  rfq: '#d97706',
  sales_order: '#0891b2',
  delivery_note: '#ea580c',
  contract: '#4f46e5',
  proposal: '#7c3aed',
  sla: '#0d9488'
};
const statusColors: Record<string, string> = {
  Draft: '#6b7280',
  Sent: '#3b82f6',
  Approved: '#22c55e',
  Rejected: '#ef4444',
  Archived: '#f59e0b'
};
const quickLinks = computed(() => [
  { icon: 'ph:chart-bar-bold', title: t('reports.docCenterTitle'), desc: t('reports.docCenterDesc'), url: '/documents/dashboard' },
  { icon: 'ph:archive-bold', title: t('reports.archived'), desc: t('reports.archiveDesc'), url: '/archive' },
  { icon: 'ph:alarm-bold', title: t('reports.reminders'), desc: t('reports.remindersDesc'), url: '/reminders' },
  { icon: 'ph:bell-bold', title: t('navigation.notificationPrefs'), desc: t('reports.notificationsDesc'), url: '/notifications' }
]);

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('reports.justNow');
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

// Chart options
const typeChartOption = computed(() => {
  const data = Object.entries(docStats.value.byType).map(([type, count]) => ({
    name: typeLabels.value[type] || type,
    value: count,
    itemStyle: { color: typeColors[type] || '#6b7280' }
  }));

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(30, 30, 45, 0.85)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff' }
    },
    grid: { top: 20, right: 20, bottom: 40, left: 60, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { rotate: 45, color: '#94A3B8' },
      axisLine: { show: false },
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
        data,
        barWidth: '50%',
        itemStyle: { borderRadius: [6, 6, 0, 0] }
      }
    ]
  };
});

const statusChartOption = computed(() => {
  const data = Object.entries(docStats.value.byStatus).map(([status, count]) => ({
    name: status,
    value: count,
    itemStyle: { color: statusColors[status] || '#6b7280' }
  }));

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 30, 45, 0.85)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94A3B8' }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: true,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        data
      }
    ]
  };
});

const drillDownTitle = computed(() => {
  if (drillDownType.value === 'type') return t('reports.drillDownTypeTitle');
  if (drillDownType.value === 'status') return t('reports.drillDownStatusTitle');
  return t('reports.drillDownDefault');
});

const drillDownData = computed(() => {
  if (!drillDownType.value) return [];

  const source = drillDownType.value === 'type' ? docStats.value.byType : docStats.value.byStatus;
  const colors = drillDownType.value === 'type' ? typeColors : statusColors;
  const labels = drillDownType.value === 'type' ? typeLabels.value : statusLabels.value;

  const total = Object.values(source).reduce((sum, val) => sum + Number(val as number), 0);

  return Object.entries(source)
    .map(([key, value]) => ({
      label: labels[key] || key,
      value,
      percentage: total > 0 ? ((Number(value as number) / total) * 100).toFixed(1) : 0,
      color: colors[key] || '#6b7280'
    }))
    .sort((a, b) => Number(b.value) - Number(a.value));
});

async function loadData() {
  // This would trigger a reload of data with date range filter
  // For now, we use the existing composables
  console.warn('Loading data with date range:', dateRange.value);
}

async function handleExport(format: 'csv' | 'excel') {
  exporting.value = true;
  try {
    const config: unknown = {
      entityType: 'DEAL', // You can make this dynamic
      columns: ['id', 'title', 'price', 'stage', 'createdAt']
    };

    if (dateRange.value) {
      config.startDate = dateRange.value[0].toISOString().split('T')[0];
      config.endDate = dateRange.value[1].toISOString().split('T')[0];
    }

    const endpoint = format === 'csv' ? 'report-builder/export-csv' : 'report-builder/export-excel';

    const response = await fetch(`${useRuntimeConfig().public.API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(config)
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report.${format === 'csv' ? 'csv' : 'xlsx'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    ElMessage.success(t('reports.exportSuccess', { format: format.toUpperCase() }));
  } catch (error) {
    console.error('Export failed:', error);
    ElMessage.error(t('reports.exportFailed'));
  } finally {
    exporting.value = false;
  }
}
</script>
