<template lang="pug">
div
  ModuleHeader(
    :title="$t('finance.budgets.title')"
    :subtitle="$t('finance.budgets.subtitle')"
    :actions="headerActions"
  )
    template(#actions)
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'budgets-export'" :title="$t('finance.budgets.title')")

  StatCards(:stats="summaryStats")

  //- Desktop Table
  .budget-desktop-view
    AppTable(
      v-slot="{data}"
      :externalLoading="loading"
      :filterOptions="filterOptions"
      :columns="table.columns"
      position="finance/budgets"
      :pageInfo="pagination"
      :data="table.data"
      @handleRowClick="handleRowClick"
      :searchPlaceholder="$t('finance.budgets.title')"
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
                NuxtLink.flex.items-center(:to="`/finance/budgets/${data?.id}`")
                  Icon.text-md.mr-2(name="IconEye")
                  p.text-sm {{ $t('common.view') }}
              el-dropdown-item
                NuxtLink.flex.items-center(:to="`/finance/budgets/create?edit=${data?.id}`")
                  Icon.text-md.mr-2(name="IconEdit")
                  p.text-sm {{ $t('common.edit') }}
              el-dropdown-item(@click="[deleteId = data?.id, deletePopup = true]")
                .flex.items-center
                  Icon.text-md.mr-2(name="IconDelete")
                  p.text-sm {{ $t('common.delete') }}

  //- Mobile Card View
  .budget-mobile-view
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('finance.budgets.title')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .space-y-3(v-if="mobileFilteredBudgets.length")
        SwipeCard(
          v-for="budget in mobileFilteredBudgets"
          :key="budget.id"
          :leftActions="[{ name: 'view', label: $t('common.view'), icon: 'ph:eye-bold', color: '#7849FF' }, { name: 'edit', label: $t('common.edit'), icon: 'ph:pencil-bold', color: '#3b82f6' }, { name: 'delete', label: $t('common.delete'), icon: 'ph:trash-bold', color: '#ef4444' }]"
          @action="(name) => handleBudgetSwipe(name, budget)"
        )
          .entity-card.p-4(@click="handleRowClick(budget)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: getUsageColor(budget) + '20', color: getUsageColor(budget) }"
                )
                  Icon(name="ph:wallet" size="18")
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ budget.budgetDetails?.title || budget.name || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ budget.categoryName || '' }}
              .shrink-0.text-right
                span.text-xs.font-bold.px-2.py-1.rounded-full(:style="{ background: getUsageColor(budget) + '20', color: getUsageColor(budget) }") {{ budget.usagePercent }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2
                Icon(name="ph:money" size="14" style="color: var(--text-muted)")
                span.text-xs.font-semibold.truncate(style="color: var(--text-secondary)") {{ budget.budgetAmount }}
              .flex.items-center.gap-2
                Icon(name="ph:chart-pie" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ $t('finance.budgets.totalSpent') || 'Spent' }}: {{ budget.spentAmount }}
              .flex.items-center.gap-2(v-if="budget.period")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ budget.period }}

      .text-center.py-12(v-if="!mobileFilteredBudgets.length")
        Icon(name="ph:wallet" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredBudgets.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredBudgets.length }} {{ $t('finance.budgets.title').toLowerCase() }}

    .mobile-fab(@click="navigateTo('/finance/budgets/create')")
      Icon(name="ph:plus-bold" size="24")

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { fetchBudgets, deleteBudget } from '~/composables/useFinance';
import useTableFilter from '@/composables/useTableFilter';

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;
const router = useRouter();

// Export columns
const exportColumns = [
  { prop: 'budgetDetails', label: t('finance.budgets.name') },
  { prop: 'budgetAmount', label: t('finance.budgets.amount') },
  { prop: 'spentAmount', label: t('finance.budgets.totalSpent') || 'Spent' },
  { prop: 'usagePercent', label: t('finance.budgets.usage') || 'Usage' },
  { prop: 'categoryName', label: t('finance.budgets.category') },
  { prop: 'period', label: t('finance.budgets.period') || 'Period' }
];

const loading = ref(false);
const deleting = ref(false);
const deletePopup = ref(false);
const deleteId = ref<number | null>(null);

const headerActions = computed(() => [{ label: t('finance.budgets.addBudget'), to: '/finance/budgets/create', type: 'primary', icon: Plus }]);

// Fetch
const result = await fetchBudgets();
const pagination = ref(result.pagination);

const table = ref({
  columns: [] as any[],
  data: result.docs.map(formatRow) || [],
  sort: []
});

const summaryStats = computed(() => {
  const budgets = result.docs || [];
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0);
  const remaining = totalBudget - totalSpent;
  return [
    { label: t('finance.budgets.totalBudget') || 'Total Budget', value: formatCurrency(totalBudget), icon: 'ph:wallet-bold', color: '#7849ff' },
    { label: t('finance.budgets.totalSpent') || 'Total Spent', value: formatCurrency(totalSpent), icon: 'ph:money-bold', color: '#ef4444' },
    { label: t('finance.budgets.remaining') || 'Remaining', value: formatCurrency(remaining), icon: 'ph:piggy-bank-bold', color: '#22c55e' }
  ];
});

function formatRow(b: any) {
  const pct = b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0;
  return {
    ...b,
    budgetDetails: { title: b.name, text: b.category?.name || '' },
    budgetAmount: formatCurrency(b.amount),
    spentAmount: formatCurrency(b.spent),
    usagePercent: `${pct}%`,
    period: `${b.startDate} → ${b.endDate}`,
    categoryName: b.category?.name || '—'
  };
}

const updateColumns = () => {
  table.value.columns = [
    { prop: 'budgetDetails', label: t('finance.budgets.name'), component: 'AvatarText', sortable: true, type: 'font-bold', width: 200 },
    { prop: 'budgetAmount', label: t('finance.budgets.amount'), component: 'Text', sortable: true, type: 'font-bold', width: 140 },
    { prop: 'spentAmount', label: t('finance.budgets.totalSpent') || 'Spent', component: 'Text', type: 'font-default', width: 140 },
    { prop: 'usagePercent', label: t('finance.budgets.usage') || 'Usage', component: 'Text', type: 'font-default', width: 100 },
    { prop: 'categoryName', label: t('finance.budgets.category'), component: 'Text', type: 'font-default', width: 140 },
    { prop: 'period', label: t('finance.budgets.period') || 'Period', component: 'Text', type: 'font-default', width: 200 }
  ];
};
updateColumns();

const filterOptions = computed(() => [{ title: t('finance.budgets.startDate'), value: ['startDate', 'endDate'], type: 'date' }]);

function handleRowClick(row: any) {
  router.push(`/finance/budgets/${row.id}`);
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const res = await deleteBudget(deleteId.value);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      const freshData = await fetchBudgets();
      table.value.data = freshData.docs.map(formatRow);
      pagination.value = freshData.pagination;
    }
  } finally {
    deleting.value = false;
    deletePopup.value = false;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
}

async function refreshData() {
  loading.value = true;
  try {
    const freshData = await fetchBudgets();
    table.value.data = freshData.docs.map(formatRow);
    pagination.value = freshData.pagination;
  } finally {
    loading.value = false;
  }
}

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileRefreshing = ref(false);

const mobileFilteredBudgets = computed(() => {
  let data = table.value.data || [];
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((b: any) => {
    const name = (b.budgetDetails?.title || b.name || '').toLowerCase();
    const cat = (b.categoryName || '').toLowerCase();
    return name.includes(q) || cat.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    await refreshData();
    vibrate([10, 30, 10]);
  } finally { mobileRefreshing.value = false; }
}

function handleBudgetSwipe(name: string, budget: any) {
  vibrate();
  switch (name) {
    case 'view': navigateTo(`/finance/budgets/${budget.id}`); break;
    case 'edit': navigateTo(`/finance/budgets/create?edit=${budget.id}`); break;
    case 'delete': deleteId.value = budget.id; deletePopup.value = true; break;
  }
}

function getUsageColor(budget: any): string {
  const pct = parseInt(budget.usagePercent) || 0;
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f59e0b';
  return '#22c55e';
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('budget', #7849ff);
</style>
