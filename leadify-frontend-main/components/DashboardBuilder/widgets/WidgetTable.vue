<template lang="pug">
.widget-table.glass-card.p-5.h-full
  h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)") {{ title }}
  //- Loading skeleton
  .animate-pulse.space-y-2(v-if="loading")
    .h-8.rounded(style="background: rgba(168, 85, 247, 0.1)")
    .h-6.rounded(v-for="i in 5" :key="i" :style="{ background: 'rgba(168, 85, 247, 0.06)', width: `${85 + Math.random() * 15}%` }")
  //- Table content
  template(v-else)
    el-table(
      :data="rows"
      size="small"
      max-height="260"
      style="width: 100%"
      :header-cell-style="{ background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', borderColor: 'rgba(255,255,255,0.06)' }"
      :cell-style="{ background: 'transparent', color: 'var(--text-primary)', borderColor: 'rgba(255,255,255,0.04)' }"
    )
      el-table-column(
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :min-width="col.minWidth || '100'"
      )
        template(#default="{ row }")
          span(:style="col.prop === 'value' || col.prop === 'revenue' ? { color: '#10B981', fontWeight: 600 } : {}") {{ col.format ? col.format(row[col.prop]) : row[col.prop] }}
    .text-center.py-6(v-if="!rows.length")
      Icon(name="ph:table" size="32" style="color: var(--text-muted)")
      p.text-xs.mt-2(style="color: var(--text-muted)") No data available
</template>

<script setup lang="ts">
import { formatLargeNumber } from '@/composables/format';
import logger from '~/utils/logger';

const props = defineProps<{
  tableType: 'recent-deals' | 'team';
  title: string;
}>();

interface TableColumn {
  prop: string;
  label: string;
  minWidth?: string;
  format?: (val: unknown) => string;
}

const loading = ref(true);
const columns = ref<TableColumn[]>([]);
const rows = ref<Record<string, unknown>[]>([]);

async function loadData() {
  loading.value = true;
  try {
    if (props.tableType === 'recent-deals') {
      await loadRecentDeals();
    } else if (props.tableType === 'team') {
      await loadTeamPerformance();
    }
  } catch (e) {
    logger.error('Table widget load failed:', e);
  } finally {
    loading.value = false;
  }
}

async function loadRecentDeals() {
  columns.value = [
    { prop: 'name', label: 'Deal', minWidth: '140' },
    { prop: 'clientName', label: 'Client', minWidth: '120' },
    { prop: 'stage', label: 'Stage', minWidth: '100' },
    { prop: 'revenue', label: 'Value', minWidth: '100', format: (v: unknown) => (v ? `SAR ${formatLargeNumber(v)}` : '--') }
  ];
  const { body, success } = await useApiFetch('deal?limit=8&sort=-updatedAt');
  if (success && body) {
    const data = body as unknown;
    const deals = data.docs || data || [];
    rows.value = deals.map(d => ({
      name: d.name || d.title || '--',
      clientName: d.client?.name || d.clientName || '--',
      stage: d.stage || d.status || '--',
      revenue: d.price || d.value || d.amount || 0
    }));
  }
}

async function loadTeamPerformance() {
  columns.value = [
    { prop: 'name', label: 'Team Member', minWidth: '140' },
    { prop: 'deals', label: 'Deals', minWidth: '70' },
    { prop: 'revenue', label: 'Revenue', minWidth: '100', format: (v: unknown) => (v ? `SAR ${formatLargeNumber(v)}` : '--') },
    { prop: 'conversion', label: 'Conv.', minWidth: '70', format: (v: unknown) => (v ? `${v}%` : '--') }
  ];
  const { body, success } = await useApiFetch('dashboards/team-performance');
  if (success && body) {
    const data = body as unknown;
    const members = Array.isArray(data.members) ? data.members : Array.isArray(data) ? data : [];
    rows.value = members.map(m => ({
      name: m.name || m.userName || '--',
      deals: m.dealsCount || m.deals || 0,
      revenue: m.revenue || m.totalRevenue || 0,
      conversion: m.conversionRate ? Number(m.conversionRate).toFixed(1) : null
    }));
  }
}

onMounted(loadData);
</script>

<style lang="scss" scoped>
.widget-table {
  min-height: 200px;

  :deep(.el-table) {
    --el-table-bg-color: transparent;
    --el-table-tr-bg-color: transparent;
    --el-table-header-bg-color: transparent;
    --el-table-row-hover-bg-color: rgba(120, 73, 255, 0.06);
    --el-table-border-color: rgba(255, 255, 255, 0.04);
  }
}
</style>
