<template lang="pug">
div
  ModuleHeader(
    :title="$t('finance.expenses.title')"
    :subtitle="$t('finance.expenses.subtitle')"
    :actions="headerActions"
  )
    template(#actions)
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'expenses-export'" :title="$t('finance.expenses.title')")
      el-button(size="large" @click="showImport = true" class="premium-btn-secondary")
        Icon(name="IconImport" size="20")
        span.mx-1 {{ $t('common.import') }}

  StatCards(:stats="summaryStats")

  BulkActions(:count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="bulkDelete" @bulk-export="bulkExport" @clear-selection="selectedRows = []")

  //- Desktop Table
  .exp-desktop-view
    AppTable(
      v-slot="{data}"
      :externalLoading="loading"
      :filterOptions="filterOptions"
      :columns="table.columns"
      position="finance/expenses"
      :pageInfo="response.pagination"
      :data="table.data"
      :sortOptions="table.sort"
      @handleRowClick="handleRowClick"
      :searchPlaceholder="$t('finance.expenses.title')"
      :key="table.data"
      emptyIcon="ph:money-bold"
      emptyMessage="No expenses yet"
      emptyDescription="Record your first expense to start tracking spending"
      emptyActionHref="/finance/expenses/create"
      :emptyActionLabel="$t('finance.expenses.addExpense')"
    )
      .flex.items-center.py-2(@click.stop)
        el-dropdown(class="outline-0" trigger="click")
          span(class="el-dropdown-link")
            .toggle-icon.text-md
              Icon(name="IconToggle" size="22")
          template(#dropdown)
            el-dropdown-menu
              el-dropdown-item
                NuxtLink.flex.items-center(:to="`/finance/expenses/${data?.id}`")
                  Icon.text-md.mr-2(name="IconEye")
                  p.text-sm {{ $t('common.view') }}
              el-dropdown-item
                NuxtLink.flex.items-center(:to="`/finance/expenses/create?edit=${data?.id}`")
                  Icon.text-md.mr-2(name="IconEdit")
                  p.text-sm {{ $t('common.edit') }}
              el-dropdown-item(v-if="data?.status === 'PENDING'" @click="handleApprove(data?.id)")
                .flex.items-center
                  Icon.text-md.mr-2(name="ph:check-circle-bold")
                  p.text-sm {{ $t('finance.expenses.approved') }}
              el-dropdown-item(v-if="data?.status === 'PENDING'" @click="handleReject(data?.id)")
                .flex.items-center
                  Icon.text-md.mr-2(name="ph:x-circle-bold")
                  p.text-sm {{ $t('finance.expenses.rejected') }}
              el-dropdown-item(@click="[deleteId = data?.id, deletePopup = true]")
                .flex.items-center
                  Icon.text-md.mr-2(name="IconDelete")
                  p.text-sm {{ $t('common.delete') }}

  //- Mobile Card View
  .exp-mobile-view
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('finance.expenses.title')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
        button.status-pill(
          v-for="filter in mobileExpFilters"
          :key="filter.value"
          :class="{ 'status-pill--active': mobileExpStatus === filter.value }"
          :style="mobileExpStatus === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="mobileExpStatus = filter.value; vibrate()"
        )
          span {{ filter.label }}
          span.status-pill__count(v-if="filter.count > 0") {{ filter.count }}

      .space-y-3(v-if="mobileFilteredExpenses.length")
        SwipeCard(
          v-for="exp in mobileFilteredExpenses"
          :key="exp.id"
          :rightActions="exp.status === 'PENDING' ? [{ name: 'approve', label: $t('finance.expenses.approved'), icon: 'ph:check-circle-bold', color: '#22c55e' }] : []"
          :leftActions="[{ name: 'view', label: $t('common.view'), icon: 'ph:eye-bold', color: '#7849FF' }]"
          @action="(name) => handleExpSwipe(name, exp)"
        )
          .entity-card.p-4(@click="handleRowClick(exp)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: getExpStatusColor(exp.status) + '20', color: getExpStatusColor(exp.status) }"
                )
                  Icon(:name="getExpStatusIcon(exp.status)" size="18")
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ exp.expenseDetails?.title || exp.description || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ exp.categoryName || '' }}
              el-tag.shrink-0(:type="getExpTagType(exp.status)" size="small" effect="dark" round) {{ exp.status }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2
                Icon(name="ph:money" size="14" style="color: var(--text-muted)")
                span.text-xs.font-semibold.truncate(style="color: var(--text-secondary)") {{ exp.amount }}
              .flex.items-center.gap-2(v-if="exp.submitterName")
                Icon(name="ph:user" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ exp.submitterName }}
              .flex.items-center.gap-2(v-if="exp.date")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ exp.date }}

      .text-center.py-12(v-if="!mobileFilteredExpenses.length")
        Icon(name="ph:receipt" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredExpenses.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredExpenses.length }} {{ $t('finance.expenses.title').toLowerCase() }}

    .mobile-fab(@click="navigateTo('/finance/expenses/create')")
      Icon(name="ph:plus-bold" size="24")

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
  ImportDialog(v-model="showImport" endpoint="finance/expenses/import" @success="refreshData")
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { expenseStatuses, fetchExpenseSummary, fetchExpenseCategories, approveExpense, rejectExpense, deleteExpense } from '~/composables/useFinance';
import useTableFilter from '@/composables/useTableFilter';

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;
const router = useRouter();

// Export columns & data
const exportColumns = [
  { prop: 'expenseDetails', label: t('finance.expenses.description') },
  { prop: 'amount', label: t('finance.expenses.amount') },
  { prop: 'categoryName', label: t('finance.expenses.category') },
  { prop: 'submitterName', label: t('hr.attendance.employee') },
  { prop: 'date', label: t('finance.expenses.date') },
  { prop: 'status', label: t('finance.expenses.status') }
];
const exportData = computed(() => table.value.data);

const loading = ref(false);
const deleting = ref(false);
const deletePopup = ref(false);
const deleteId = ref<number | null>(null);
const selectedRows = ref<any[]>([]);
const showImport = ref(false);

// Summary
const summary = ref({ total: 0, approved: 0, pending: 0 });
const summaryStats = computed(() => [
  { label: t('finance.expenses.totalExpenses'), value: formatCurrency(summary.value.total), icon: 'ph:money-bold', color: '#7849ff' },
  { label: t('finance.expenses.approved'), value: formatCurrency(summary.value.approved), icon: 'ph:check-circle-bold', color: '#22c55e' },
  { label: t('finance.expenses.pendingAmount'), value: formatCurrency(summary.value.pending), icon: 'ph:clock-bold', color: '#f59e0b' }
]);

// Header actions
const headerActions = computed(() => [{ label: t('finance.expenses.addExpense'), to: '/finance/expenses/create', type: 'primary', icon: Plus }]);

// Fetch data
let response = await useTableFilter('finance/expenses');
const categories = await fetchExpenseCategories();
summary.value = await fetchExpenseSummary();

const table = ref({
  columns: [] as any[],
  data: response.formattedData || [],
  sort: [
    { prop: 'amount', order: 'ascending', value: 'AMOUNT_ASC' },
    { prop: 'amount', order: 'descending', value: 'AMOUNT_DESC' },
    { prop: 'date', order: 'ascending', value: 'DATE_ASC' },
    { prop: 'date', order: 'descending', value: 'DATE_DESC' }
  ]
});

const updateTableColumns = () => {
  table.value.columns = [
    {
      prop: 'expenseDetails',
      label: t('finance.expenses.description'),
      component: 'AvatarText',
      sortable: true,
      type: 'font-bold',
      width: 220
    },
    {
      prop: 'amount',
      label: t('finance.expenses.amount'),
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 130
    },
    {
      prop: 'categoryName',
      label: t('finance.expenses.category'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 140
    },
    {
      prop: 'submitterName',
      label: t('hr.attendance.employee'),
      component: 'Text',
      type: 'font-default',
      width: 150
    },
    {
      prop: 'date',
      label: t('finance.expenses.date'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 120
    },
    {
      prop: 'status',
      label: t('finance.expenses.status'),
      component: 'Label',
      type: 'outline',
      filters: [
        { text: t('finance.expenses.pending'), value: 'PENDING' },
        { text: t('finance.expenses.approved'), value: 'APPROVED' },
        { text: t('finance.expenses.rejected'), value: 'REJECTED' }
      ],
      width: 140
    }
  ];
};

updateTableColumns();

// Build filter options
const categoryOptions = categories.map(c => ({ label: c.name, value: String(c.id) }));
const filterOptions = computed(() => [
  {
    title: t('finance.expenses.status'),
    value: 'status',
    options: expenseStatuses
  },
  {
    title: t('finance.expenses.category'),
    value: 'categoryId',
    options: categoryOptions
  },
  {
    title: t('finance.expenses.date'),
    value: ['startDate', 'endDate'],
    type: 'date'
  }
]);

function handleRowClick(row: any) {
  router.push(`/finance/expenses/${row.id}`);
}

async function handleApprove(id: number) {
  const res = await approveExpense(id);
  if (res.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('finance.expenses.approved') });
    await refreshData();
  }
}

async function handleReject(id: number) {
  const res = await rejectExpense(id);
  if (res.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('finance.expenses.rejected') });
    await refreshData();
  }
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const res = await deleteExpense(deleteId.value);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      await refreshData();
    }
  } finally {
    deleting.value = false;
    deletePopup.value = false;
  }
}

async function refreshData() {
  loading.value = true;
  response = await useTableFilter('finance/expenses');
  table.value.data = response.formattedData;
  summary.value = await fetchExpenseSummary();
  loading.value = false;
}

function handleExport() {
  const csvHeaders = ['Description', 'Amount', 'Category', 'Date', 'Status'];
  const rows = (table.value.data || []).map((r: any) => [
    r.description || r.expenseDetails?.title || '',
    r.amount || '',
    r.categoryName || '',
    r.date || '',
    r.status || ''
  ]);
  const csv = [csvHeaders, ...rows].map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'expenses.csv';
  link.click();
  URL.revokeObjectURL(url);
}

async function bulkDelete() {
  for (const row of selectedRows.value) {
    await deleteExpense(row.id);
  }
  selectedRows.value = [];
  await refreshData();
}

function bulkExport() {
  handleExport();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
}

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileExpStatus = ref('ALL');
const mobileRefreshing = ref(false);

const mobileExpFilters = computed(() => {
  const data = table.value.data || [];
  return [
    { value: 'ALL', label: t('common.all'), color: '#7849ff', count: data.length },
    { value: 'PENDING', label: t('finance.expenses.pending'), color: '#f59e0b', count: data.filter((e: any) => e.status === 'PENDING').length },
    { value: 'APPROVED', label: t('finance.expenses.approved'), color: '#22c55e', count: data.filter((e: any) => e.status === 'APPROVED').length },
    { value: 'REJECTED', label: t('finance.expenses.rejected'), color: '#ef4444', count: data.filter((e: any) => e.status === 'REJECTED').length }
  ];
});

const mobileFilteredExpenses = computed(() => {
  let data = table.value.data || [];
  if (mobileExpStatus.value !== 'ALL') data = data.filter((e: any) => e.status === mobileExpStatus.value);
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((e: any) => {
    const desc = (e.expenseDetails?.title || e.description || '').toLowerCase();
    const cat = (e.categoryName || '').toLowerCase();
    const sub = (e.submitterName || '').toLowerCase();
    return desc.includes(q) || cat.includes(q) || sub.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    await refreshData();
    vibrate([10, 30, 10]);
  } finally { mobileRefreshing.value = false; }
}

function handleExpSwipe(name: string, exp: any) {
  vibrate();
  switch (name) {
    case 'approve': handleApprove(exp.id); break;
    case 'view': navigateTo(`/finance/expenses/${exp.id}`); break;
  }
}

function getExpStatusColor(status: string): string {
  const map: Record<string, string> = { PENDING: '#f59e0b', APPROVED: '#22c55e', REJECTED: '#ef4444' };
  return map[status] || '#94a3b8';
}

function getExpStatusIcon(status: string): string {
  const map: Record<string, string> = { PENDING: 'ph:clock', APPROVED: 'ph:check-circle', REJECTED: 'ph:x-circle' };
  return map[status] || 'ph:receipt';
}

function getExpTagType(status: string): string {
  const map: Record<string, string> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' };
  return map[status] || 'info';
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('exp', #7849ff);
</style>
