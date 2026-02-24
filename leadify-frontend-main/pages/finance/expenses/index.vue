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
        span.mx-1 {{ $t('common.import') || 'Import' }}

  StatCards(:stats="summaryStats")

  BulkActions(:count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="bulkDelete" @bulk-export="bulkExport" @clear-selection="selectedRows = []")

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
                p.text-sm {{ $t('finance.expenses.approved') || 'Approve' }}
            el-dropdown-item(v-if="data?.status === 'PENDING'" @click="handleReject(data?.id)")
              .flex.items-center
                Icon.text-md.mr-2(name="ph:x-circle-bold")
                p.text-sm {{ $t('finance.expenses.rejected') || 'Reject' }}
            el-dropdown-item(@click="[deleteId = data?.id, deletePopup = true]")
              .flex.items-center
                Icon.text-md.mr-2(name="IconDelete")
                p.text-sm {{ $t('common.delete') }}

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
  { prop: 'submitterName', label: t('hr.attendance.employee') || 'Submitted By' },
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
      label: t('hr.attendance.employee') || 'Submitted By',
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
</script>
