<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize Support Dashboard

  //- KPI Cards
  SupportTicketMetrics(v-if="metrics" :metrics="metrics")

  //- Charts Row
  .grid.gap-6.mt-6(class="grid-cols-1 lg:grid-cols-2")
    //- Tickets by Status (Donut)
    .glass-card.p-6.animate-entrance
      h3.text-lg.font-bold.mb-4 Tickets by Status
      .flex.justify-center(v-if="!loading")
        .relative(style="width: 280px; height: 280px")
          canvas(ref="statusChartRef")
      el-skeleton(v-else :rows="6" animated)

    //- Tickets by Priority
    .glass-card.p-6.animate-entrance
      h3.text-lg.font-bold.mb-4 Tickets by Priority
      .flex.justify-center(v-if="!loading")
        .relative(style="width: 280px; height: 280px")
          canvas(ref="priorityChartRef")
      el-skeleton(v-else :rows="6" animated)

  //- Recent Tickets
  .glass-card.p-6.mt-6.animate-entrance
    .flex.items-center.justify-between.mb-4
      h3.text-lg.font-bold Recent Tickets
      NuxtLink(to="/support/tickets")
        el-button(text type="primary") View All

    el-table(:data="recentTickets" v-loading="loadingRecent" style="width: 100%" @row-click="handleRowClick" row-class-name="cursor-pointer" stripe)
      el-table-column(label="#" width="120")
        template(#default="{ row }")
          span.font-mono.font-bold(style="color: var(--el-color-primary)") {{ row.ticketNumber }}
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
import { ref, onMounted, nextTick } from 'vue';
import {
  fetchSupportDashboard,
  fetchTickets,
  getStatusOption,
  getPriorityOption
} from '@/composables/useSupport';
import type { TicketMetrics } from '@/composables/useSupport';

const router = useRouter();

const loading = ref(true);
const loadingRecent = ref(false);
const metrics = ref<TicketMetrics | null>(null);
const recentTickets = ref<any[]>([]);
const statusChartRef = ref<HTMLCanvasElement | null>(null);
const priorityChartRef = ref<HTMLCanvasElement | null>(null);

async function loadDashboard() {
  loading.value = true;
  try {
    const { body, success } = await fetchSupportDashboard();
    if (success && body) {
      metrics.value = body;
      await nextTick();
      renderCharts();
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

function renderCharts() {
  if (!metrics.value) return;

  // Status donut chart using Canvas 2D
  if (statusChartRef.value) {
    drawDonutChart(statusChartRef.value, metrics.value.ticketsByStatus, {
      OPEN: '#409eff',
      IN_PROGRESS: '#e6a23c',
      WAITING_CUSTOMER: '#909399',
      RESOLVED: '#67c23a',
      CLOSED: '#303133'
    });
  }

  // Priority donut chart using Canvas 2D
  if (priorityChartRef.value) {
    drawDonutChart(priorityChartRef.value, metrics.value.ticketsByPriority, {
      LOW: '#909399',
      MEDIUM: '#409eff',
      HIGH: '#e6a23c',
      URGENT: '#f56c6c'
    });
  }
}

function drawDonutChart(
  canvas: HTMLCanvasElement,
  data: Record<string, number>,
  colorMap: Record<string, string>
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const size = 280;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = 120;
  const innerR = 70;
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  if (total === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.fillStyle = '#e5e7eb';
    ctx.fill();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data', cx, cy + 5);
    return;
  }

  let startAngle = -Math.PI / 2;
  entries.forEach(([key, value]) => {
    const sliceAngle = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = colorMap[key] || '#ccc';
    ctx.fill();
    startAngle += sliceAngle;
  });

  // Center text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(total), cx, cy - 8);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('Total', cx, cy + 14);

  // Legend
  const legendY = size - 10;
  const legendStartX = 20;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  let lx = legendStartX;
  entries.forEach(([key, value]) => {
    ctx.fillStyle = colorMap[key] || '#ccc';
    ctx.fillRect(lx, legendY - 8, 10, 10);
    ctx.fillStyle = '#d1d5db';
    const label = `${key.replace(/_/g, ' ')} (${value})`;
    ctx.fillText(label, lx + 14, legendY);
    lx += ctx.measureText(label).width + 24;
  });
}

function handleRowClick(row: any) {
  router.push(`/support/tickets/${row.id}`);
}

function getStatusColor(status: string) {
  return getStatusOption(status).color;
}

function getStatusLabel(status: string) {
  return getStatusOption(status).label;
}

function getPriorityColor(priority: string) {
  return getPriorityOption(priority).color;
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
