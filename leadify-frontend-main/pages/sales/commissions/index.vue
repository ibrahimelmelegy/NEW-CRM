<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(:title="$t('commissions.title')" :subtitle="$t('commissions.subtitle')")
    template(#actions)
      .flex.gap-2
        el-button(size="large" @click="showBulkPayoutDialog = true" :disabled="selectedIds.length === 0")
          Icon(name="ph:money-bold" size="18")
          span.mx-1 {{ $t('commissions.bulkPayout') }} ({{ selectedIds.length }})
        el-button(type="primary" size="large" @click="showDialog = true" class="premium-btn")
          Icon(name="ph:currency-dollar-bold" size="20")
          span.mx-1 {{ $t('commissions.add') }}

  //- Commission KPI Dashboard Cards — wired to real API
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
    .glass-card.p-5.rounded-2xl.animate-entrance(v-for="stat in dashboardStats" :key="stat.label")
      .flex.items-center.justify-between
        div
          p.text-xs.font-medium.uppercase.tracking-wide(style="color: var(--text-muted)") {{ stat.label }}
          p.text-2xl.font-bold.mt-1(:style="{ color: stat.color }") {{ stat.value }}
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: stat.color + '20' }")
          Icon(:name="stat.icon" size="20" :style="{ color: stat.color }")

  //- Filters
  .flex.flex-wrap.gap-3.mb-4
    el-select(v-model="filters.status" :placeholder="$t('commissions.allStatuses')" clearable size="large" @change="fetchData" style="width: 160px")
      el-option(:label="$t('commissions.statusPending')" value="PENDING")
      el-option(:label="$t('commissions.statusApproved')" value="APPROVED")
      el-option(:label="$t('commissions.statusPaid')" value="PAID")
      el-option(:label="$t('commissions.statusRejected')" value="REJECTED")
    el-input(v-model="filters.search" :placeholder="$t('common.search')" clearable size="large" @clear="fetchData" @keyup.enter="fetchData" style="width: 220px")
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="16")
    el-date-picker(v-model="filters.dateRange" type="daterange" range-separator="-" :start-placeholder="$t('common.startDate')" :end-placeholder="$t('common.endDate')" size="large" value-format="YYYY-MM-DD" @change="fetchData" style="width: 260px")

  .glass-card.py-8.animate-entrance
    el-table(:data="items" v-loading="loading" style="width: 100%" @selection-change="handleSelectionChange")
      el-table-column(type="selection" width="42")
      el-table-column(type="index" width="50")
      el-table-column(:label="$t('commissions.staff')" min-width="160")
        template(#default="{ row }")
          span.font-bold {{ row.staff?.name || '\u2014' }}
      el-table-column(:label="$t('commissions.deal')" min-width="160")
        template(#default="{ row }")
          span {{ row.deal?.name || '\u2014' }}
      el-table-column(:label="$t('commissions.dealValue')" width="130" align="right")
        template(#default="{ row }")
          span {{ row.dealValue ? Number(row.dealValue).toLocaleString() + ' SAR' : '\u2014' }}
      el-table-column(:label="$t('commissions.amount')" width="130" align="right")
        template(#default="{ row }")
          span.font-bold {{ Number(row.amount || 0).toLocaleString() }} SAR
      el-table-column(:label="$t('commissions.rate')" width="90" align="center")
        template(#default="{ row }")
          span {{ row.rate ? row.rate + '%' : '\u2014' }}
      el-table-column(:label="$t('commissions.status')" width="130")
        template(#default="{ row }")
          el-dropdown(trigger="click" @command="(cmd: string) => updateStatus(row.id, cmd)")
            el-tag(:type="statusType(row.status)" size="small" round style="cursor:pointer") {{ row.status }}
            template(#dropdown)
              el-dropdown-menu
                el-dropdown-item(command="PENDING") {{ $t('commissions.statusPending') }}
                el-dropdown-item(command="APPROVED") {{ $t('commissions.statusApproved') }}
                el-dropdown-item(command="PAID") {{ $t('commissions.statusPaid') }}
                el-dropdown-item(command="REJECTED") {{ $t('commissions.statusRejected') }}
      el-table-column(:label="$t('commissions.paidAt')" width="120")
        template(#default="{ row }")
          span.text-xs.font-mono(v-if="row.paidAt") {{ new Date(row.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) }}
          span.text-xs(v-else style="color: var(--text-muted)") \u2014
      el-table-column(:label="$t('common.date')" width="120")
        template(#default="{ row }")
          span.text-xs.font-mono {{ new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) }}
      el-table-column(:label="$t('common.action')" width="80" fixed="right")
        template(#default="{ row }")
          el-button(text circle size="small" type="danger" @click="handleDelete(row.id)")
            Icon(name="ph:trash" size="14")
      template(#empty)
        el-empty(:description="$t('common.noData')")

    .flex.justify-end.mt-4
      el-pagination(
        :current-page="pagination.page"
        :page-size="pagination.limit"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="(p: number) => { pagination.page = p; fetchData() }"
      )

  //- Commission Forecast Section
  .glass-card.p-5.rounded-2xl.mt-6(v-if="forecastData")
    h3.text-sm.font-medium.mb-4(style="color: var(--text-muted)") {{ $t('commissions.forecast') }}
    .grid.gap-4(class="grid-cols-2 md:grid-cols-4")
      .text-center.p-3.rounded-lg(style="background: var(--bg-base)")
        p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('commissions.thisMonth') }}
        p.text-lg.font-bold(style="color: #7849ff") {{ Number(forecastData.thisMonth || 0).toLocaleString() }} SAR
      .text-center.p-3.rounded-lg(style="background: var(--bg-base)")
        p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('commissions.nextMonth') }}
        p.text-lg.font-bold(style="color: #3b82f6") {{ Number(forecastData.nextMonth || 0).toLocaleString() }} SAR
      .text-center.p-3.rounded-lg(style="background: var(--bg-base)")
        p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('commissions.thisQuarter') }}
        p.text-lg.font-bold(style="color: #22c55e") {{ Number(forecastData.thisQuarter || 0).toLocaleString() }} SAR
      .text-center.p-3.rounded-lg(style="background: var(--bg-base)")
        p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('commissions.projected') }}
        p.text-lg.font-bold(style="color: #f59e0b") {{ Number(forecastData.projected || 0).toLocaleString() }} SAR

  //- Analytics Section
  .grid.gap-6.mt-6(class="grid-cols-1 lg:grid-cols-2" v-if="analyticsData")
    //- Commission by Period
    .glass-card.p-5.rounded-2xl
      h3.text-sm.font-medium.mb-4(style="color: var(--text-muted)") {{ $t('commissions.byPeriod') }}
      .flex.items-end.gap-2.h-40(v-if="analyticsData.byPeriod?.length")
        .flex.flex-col.items-center.flex-1(v-for="(bar, idx) in periodChartData" :key="idx")
          .w-full.rounded-t-lg.transition-all.duration-300(
            :style="{ height: bar.height + '%', background: 'linear-gradient(180deg, #7849ff 0%, #a78bfa 100%)', minHeight: '4px' }"
          )
          p.text-xs.mt-1.text-center.font-mono(style="color: var(--text-muted)") {{ bar.label }}
          p.text-xs.text-center.font-bold(style="color: var(--text-primary)") {{ formatCompact(bar.value) }}
      .text-center.py-6(v-else)
        p.text-sm(style="color: var(--text-muted)") {{ $t('common.noData') }}

    //- Top Earners
    .glass-card.p-5.rounded-2xl
      h3.text-sm.font-medium.mb-4(style="color: var(--text-muted)") {{ $t('commissions.topEarners') }}
      .space-y-2(v-if="analyticsData.byRep?.length")
        .flex.items-center.gap-3.p-2.rounded-lg(v-for="rep in analyticsData.byRep.slice(0, 5)" :key="rep.staffId" style="background: var(--bg-base)")
          el-avatar(:size="28" style="background: var(--bg-elevated)") {{ rep.staff?.name?.charAt(0) || '?' }}
          .flex-1
            p.text-sm.font-medium(style="color: var(--text-primary)") {{ rep.staff?.name || 'Unknown' }}
            p.text-xs(style="color: var(--text-muted)") {{ rep.dataValues?.dealCount || rep.dealCount || 0 }} {{ $t('commissions.dealsCount') }}
          span.font-bold.text-sm(style="color: #7849ff") {{ Number(rep.dataValues?.totalEarned || rep.totalEarned || 0).toLocaleString() }} SAR
      .text-center.py-6(v-else)
        p.text-sm(style="color: var(--text-muted)") {{ $t('common.noData') }}

  //- Add Commission Dialog
  el-dialog(v-model="showDialog" :title="$t('commissions.add')" width="500px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('commissions.amount')")
          el-input-number(v-model="form.amount" :min="0" :precision="2" class="w-full")
        el-form-item(:label="$t('commissions.rate')")
          el-input-number(v-model="form.rate" :min="0" :max="100" :precision="2" class="w-full")
      el-form-item(:label="$t('commissions.dealValue')")
        el-input-number(v-model="form.dealValue" :min="0" :precision="2" class="w-full")
      el-form-item(:label="$t('commissions.notes')")
        el-input(v-model="form.notes" type="textarea" :rows="2")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveItem") {{ $t('common.save') }}

  //- Bulk Payout Confirmation Dialog
  el-dialog(v-model="showBulkPayoutDialog" :title="$t('commissions.bulkPayout')" width="400px")
    p(style="color: var(--text-primary)") {{ $t('commissions.bulkPayoutConfirm') }}
    template(#footer)
      el-button(@click="showBulkPayoutDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="payingOut" @click="doBulkPayout") {{ $t('commissions.confirmPayout') }}
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();

const loading = ref(false);
const saving = ref(false);
const payingOut = ref(false);
const showDialog = ref(false);
const showBulkPayoutDialog = ref(false);
const items = ref<Record<string, unknown>[]>([]);
const selectedIds = ref<number[]>([]);
const form = reactive({ amount: 0, rate: 5, dealValue: 0, notes: '' });
const pagination = reactive({ page: 1, limit: 20, total: 0 });
const kpiData = ref<Record<string, unknown> | null>(null);
const analyticsData = ref<Record<string, unknown> | null>(null);
const forecastData = ref<Record<string, unknown> | null>(null);

const filters = reactive({
  status: '',
  search: '',
  dateRange: null as [string, string] | null
});

// Real KPI stats from /dashboard-kpis endpoint
const dashboardStats = computed(() => {
  const s = kpiData.value;
  if (!s) {
    return [
      { label: t('commissions.totalEarned'), value: '0 SAR', icon: 'ph:wallet-bold', color: '#7849ff' },
      { label: t('commissions.totalPaid'), value: '0 SAR', icon: 'ph:check-circle-bold', color: '#22c55e' },
      { label: t('commissions.totalPending'), value: '0 SAR', icon: 'ph:hourglass-bold', color: '#f59e0b' },
      { label: t('commissions.avgRate'), value: '0%', icon: 'ph:percent-bold', color: '#3b82f6' }
    ];
  }
  return [
    { label: t('commissions.totalEarned'), value: Number(s.totalEarned || 0).toLocaleString() + ' SAR', icon: 'ph:wallet-bold', color: '#7849ff' },
    { label: t('commissions.totalPaid'), value: Number(s.totalPaid || 0).toLocaleString() + ' SAR', icon: 'ph:check-circle-bold', color: '#22c55e' },
    {
      label: t('commissions.totalPending'),
      value: Number(s.totalPending || 0).toLocaleString() + ' SAR',
      icon: 'ph:hourglass-bold',
      color: '#f59e0b'
    },
    { label: t('commissions.avgRate'), value: Number(s.avgRate || 0).toFixed(1) + '%', icon: 'ph:percent-bold', color: '#3b82f6' }
  ];
});

// Period chart data from analytics
const periodChartData = computed(() => {
  const periods = analyticsData.value?.byPeriod || [];
  if (!periods.length) return [];
  const maxVal = Math.max(...periods.map((p) => Number(p.earned || 0)), 1);
  return periods
    .slice(0, 12)
    .reverse()
    .map((p) => ({
      label: p.period,
      value: Number(p.earned || 0),
      height: Math.max((Number(p.earned || 0) / maxVal) * 100, 5)
    }));
});

function formatCompact(amount: number): string {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
  return String(Math.round(amount));
}

onMounted(() => {
  fetchData();
  fetchDashboardKPIs();
  fetchAnalytics();
  fetchForecast();
});

async function fetchData() {
  loading.value = true;
  try {
    let qs = `commissions?page=${pagination.page}&limit=${pagination.limit}`;
    if (filters.status) qs += `&status=${filters.status}`;
    if (filters.search) qs += `&search=${encodeURIComponent(filters.search)}`;
    const { body, success } = await useApiFetch(qs);
    if (success && body) {
      const data = body as unknown;
      items.value = data.rows || data.docs || [];
      pagination.total = data.pagination?.totalItems ?? data.count ?? items.value.length;
    }
  } finally {
    loading.value = false;
  }
}

async function fetchDashboardKPIs() {
  try {
    const { body, success } = await useApiFetch('commissions/dashboard-kpis');
    if (success && body) {
      kpiData.value = body;
    }
  } catch {
    // Non-critical
  }
}

async function fetchAnalytics() {
  try {
    const { body, success } = await useApiFetch('commissions/analytics?period=monthly');
    if (success && body) {
      analyticsData.value = body;
    }
  } catch {
    // Non-critical
  }
}

async function fetchForecast() {
  try {
    const { body, success } = await useApiFetch('commissions/forecast');
    if (success && body) {
      forecastData.value = body;
    }
  } catch {
    // Non-critical
  }
}

async function saveItem() {
  saving.value = true;
  try {
    const { success } = await useApiFetch('commissions', 'POST', { ...form, status: 'PENDING' });
    if (success) {
      showDialog.value = false;
      ElMessage.success(t('commissions.commissionAdded'));
      await fetchData();
      await fetchDashboardKPIs();
    }
  } finally {
    saving.value = false;
  }
}

async function updateStatus(id: number, status: string) {
  if (status === 'PAID') {
    await useApiFetch(`commissions/${id}/pay`, 'PUT');
  } else {
    await useApiFetch(`commissions/${id}`, 'PUT', { status });
  }
  await fetchData();
  await fetchDashboardKPIs();
}

async function handleDelete(id: number) {
  const { success } = await useApiFetch(`commissions/${id}`, 'DELETE');
  if (success) {
    ElMessage.success(t('common.deleted'));
    await fetchData();
    await fetchDashboardKPIs();
  }
}

function handleSelectionChange(selection: Record<string, unknown>[]) {
  selectedIds.value = selection.filter((r) => r.status !== 'PAID').map((r) => r.id);
}

async function doBulkPayout() {
  payingOut.value = true;
  try {
    const { body, success } = await useApiFetch('commissions/bulk-payout', 'POST', { ids: selectedIds.value });
    if (success) {
      const count = (body as unknown)?.paidCount || selectedIds.value.length;
      ElMessage.success(t('commissions.markedAsPaid', { count }));
      showBulkPayoutDialog.value = false;
      selectedIds.value = [];
      await fetchData();
      await fetchDashboardKPIs();
    }
  } finally {
    payingOut.value = false;
  }
}

function statusType(s: string) {
  return { PENDING: 'warning', APPROVED: '', PAID: 'success', REJECTED: 'danger' }[s] || '';
}
</script>

<style lang="scss" scoped>
@media (max-width: 768px) {
  .glass-card {
    padding: 1rem !important;
  }

  .grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.75rem !important;
  }

  .dashboard-stats .grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-pagination) {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
