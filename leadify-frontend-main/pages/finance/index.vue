<template lang="pug">
div
  ModuleHeader(
    :title="$t('finance.dashboard.title')"
    :subtitle="$t('finance.dashboard.subtitle')"
  )
    template(#actions)
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :start-placeholder="$t('finance.dashboard.startDate')"
        :end-placeholder="$t('finance.dashboard.endDate')"
        size="large"
        class="!rounded-2xl mr-3"
        @change="handleDateRangeChange"
        clearable
      )
      el-select(
        v-model="categoryFilter"
        :placeholder="$t('finance.dashboard.filterByCategory')"
        size="large"
        clearable
        class="!rounded-2xl mr-3"
        style="width: 200px"
        @change="applyFilters"
      )
        el-option(
          v-for="cat in categories"
          :key="cat.id"
          :label="cat.name"
          :value="cat.id"
        )
      el-button(size="large" type="primary" @click="refreshAll" :loading="refreshing" class="!rounded-2xl")
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-1 {{ $t('common.refresh') }}

  //- KPI Stat Cards with Drill-down
  .grid.gap-4.mb-6(class="grid-cols-1 md:grid-cols-5")
    .glass-card.p-5.rounded-2xl.cursor-pointer.transition-all.hover_scale-105(
      v-for="stat in kpiCards"
      :key="stat.label"
      @click="handleKPIDrilldown(stat.label)"
    )
      .flex.items-center.justify-between
        div
          p.text-xs.font-medium.uppercase.tracking-wide(style="color: var(--text-muted)") {{ stat.label }}
          p.text-2xl.font-bold.mt-1(:style="{ color: stat.color }") {{ stat.value }}
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: stat.color + '20' }")
          Icon(:name="stat.icon" size="20" :style="{ color: stat.color }")

  //- Charts Row
  .grid.grid-cols-1.gap-6.mt-2(class="lg:grid-cols-2")
    //- Expense Distribution Pie Chart
    .glass-card.p-6.animate-entrance
      .flex.items-center.justify-between.mb-4
        div
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('finance.dashboard.expenseDistribution') }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('finance.dashboard.breakdownByCategory') }}
        .w-10.h-10.rounded-2xl.flex.items-center.justify-center(style="background: #7849ff15")
          Icon(name="ph:chart-pie-slice-bold" size="22" style="color: #7849ff")
      .chart-container(v-loading="loadingExpenses")
        ClientOnly
          VChart(v-if="expenseDistributionOption" :option="expenseDistributionOption" autoresize style="height: 300px")
        .text-center.py-12(v-if="!expenseDistributionOption && !loadingExpenses")
          Icon(name="ph:chart-pie-slice" size="48" style="color: var(--text-muted)")
          p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('finance.dashboard.noExpenseData') }}

    //- Monthly Cash Flow Bar Chart
    .glass-card.p-6.animate-entrance(style="animation-delay: 0.05s")
      .flex.items-center.justify-between.mb-4
        div
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('finance.dashboard.monthlyCashFlow') }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('finance.dashboard.revenueVsExpenses') }}
        .w-10.h-10.rounded-2xl.flex.items-center.justify-center(style="background: #10b98115")
          Icon(name="ph:chart-bar-bold" size="22" style="color: #10b981")
      .chart-container(v-loading="loadingCashFlow")
        ClientOnly
          VChart(v-if="cashFlowOption" :option="cashFlowOption" autoresize style="height: 300px")
        .text-center.py-12(v-if="!cashFlowOption && !loadingCashFlow")
          Icon(name="ph:chart-bar" size="48" style="color: var(--text-muted)")
          p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('finance.dashboard.noCashFlowData') }}

  //- Recent Expenses Table
  .glass-card.mt-6.animate-entrance(style="animation-delay: 0.1s")
    .p-5.border-b(style="border-color: var(--border-color)")
      .flex.items-center.justify-between
        div
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('finance.dashboard.recentExpenses') }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('finance.dashboard.last10Expenses') }}
        NuxtLink(to="/finance/expenses")
          el-button(text)
            span {{ $t('common.viewAll') }}
            Icon(name="ph:arrow-right-bold" size="16" class="ml-1")
    el-table(:data="recentExpenses" v-loading="loadingExpenses" style="width: 100%")
      el-table-column(prop="description" :label="$t('common.description')" min-width="200")
        template(#default="{ row }")
          span.font-semibold {{ row.description || '--' }}
      el-table-column(prop="amount" :label="$t('common.amount')" width="150")
        template(#default="{ row }")
          span.font-bold(style="color: #ef4444") SAR {{ formatLargeNumber(row.amount || 0) }}
      el-table-column(prop="category" :label="$t('common.category')" width="160")
        template(#default="{ row }")
          el-tag(size="small" effect="plain" round) {{ row.category?.name || '--' }}
      el-table-column(prop="status" :label="$t('common.status')" width="130")
        template(#default="{ row }")
          el-tag(size="small" :type="getExpenseTagType(row.status)" effect="dark" round) {{ row.status }}
      el-table-column(prop="date" :label="$t('common.date')" width="140")
        template(#default="{ row }")
          span {{ formatDateDisplay(row.date) }}

  //- Budget Overview
  .glass-card.mt-6.animate-entrance(style="animation-delay: 0.15s")
    .p-5.border-b(style="border-color: var(--border-color)")
      .flex.items-center.justify-between
        div
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('finance.dashboard.budgetOverview') }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('finance.dashboard.allocatedBudgets') }}
        NuxtLink(to="/finance/budgets")
          el-button(text)
            span {{ $t('common.viewAll') }}
            Icon(name="ph:arrow-right-bold" size="16" class="ml-1")
    .p-5(v-loading="loadingBudgets")
      .space-y-5(v-if="budgets.length")
        .flex.items-center.gap-4(v-for="budget in budgets" :key="budget.id")
          .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0(
            :style="{ background: getBudgetColor(budget) + '20', color: getBudgetColor(budget) }"
          )
            Icon(name="ph:wallet-bold" size="18")
          .flex-1.min-w-0
            .flex.items-center.justify-between.mb-1
              p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ budget.name }}
              .flex.items-center.gap-3
                span.text-xs.font-medium(style="color: var(--text-muted)") SAR {{ formatLargeNumber(budget.spent) }} / SAR {{ formatLargeNumber(budget.amount) }}
                span.text-xs.font-bold.px-2.rounded-full(class="py-0.5"
                  :style="{ background: getBudgetColor(budget) + '20', color: getBudgetColor(budget) }"
                ) {{ getBudgetPercentage(budget) }}%
            el-progress(
              :percentage="Math.min(Number(getBudgetPercentage(budget)), 100)"
              :color="getBudgetColor(budget)"
              :stroke-width="8"
              :show-text="false"
            )
            .flex.items-center.justify-between.mt-1
              span.text-xs(style="color: var(--text-muted)") {{ budget.category?.name || 'Uncategorized' }}
              span.text-xs(style="color: var(--text-muted)") {{ budget.startDate }} - {{ budget.endDate }}
      .text-center.py-12(v-if="!budgets.length && !loadingBudgets")
        Icon(name="ph:wallet" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('finance.dashboard.noBudgets') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { getPieChartsData } from '~/composables/charts';
import {
  fetchExpenses,
  fetchExpenseSummary,
  fetchExpenseCategories,
  fetchBudgets,
  type ExpenseItem,
  type BudgetItem,
  type ExpenseCategory
} from '~/composables/useFinance';
import { getCollectionDashboard, type CollectionDashboard } from '~/composables/usePayments';
import logger from '~/utils/logger'

// Lazy-load heavy chart dependencies for faster initial page load
let graphic: unknown;
const VChart = defineAsyncComponent(() =>
  Promise.all([
    import('echarts/core'),
    import('echarts/renderers'),
    import('echarts/charts'),
    import('echarts/components'),
    import('vue-echarts')
  ]).then(
    ([
      echartsCore,
      { CanvasRenderer },
      { BarChart, PieChart },
      { TitleComponent, TooltipComponent, LegendComponent, GridComponent },
      VChartModule
    ]) => {
      echartsCore.use([CanvasRenderer, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);
      graphic = echartsCore.graphic;
      return VChartModule;
    }
  )
);

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();

// Filters
const dateRange = ref<[Date, Date] | null>(null);
const categoryFilter = ref<string | null>(null);

// Loading states
const refreshing = ref(false);
const loadingExpenses = ref(true);
const loadingBudgets = ref(true);
const loadingCashFlow = ref(true);
const loadingCollection = ref(true);

// Data
const expenseSummary = ref({ total: 0, approved: 0, pending: 0 });
const recentExpenses = ref<ExpenseItem[]>([]);
const categories = ref<ExpenseCategory[]>([]);
const budgets = ref<BudgetItem[]>([]);
const collectionData = ref<CollectionDashboard>({
  totalReceivable: 0,
  overdue: 0,
  collectedMTD: 0,
  collectionRate: 0,
  topDebtors: []
});

// KPI Cards
const kpiCards = computed(() => [
  {
    label: t('finance.dashboard.totalRevenue'),
    value: `SAR ${formatLargeNumber(collectionData.value.collectedMTD)}`,
    icon: 'ph:currency-circle-dollar-bold',
    color: '#10B981'
  },
  {
    label: t('finance.dashboard.totalExpenses'),
    value: `SAR ${formatLargeNumber(expenseSummary.value.total)}`,
    icon: 'ph:money-bold',
    color: '#EF4444'
  },
  {
    label: t('finance.dashboard.pendingExpenses'),
    value: `SAR ${formatLargeNumber(expenseSummary.value.pending)}`,
    icon: 'ph:clock-bold',
    color: '#F59E0B'
  },
  {
    label: t('finance.dashboard.activeBudgets'),
    value: budgets.value.length,
    icon: 'ph:wallet-bold',
    color: '#7849FF'
  },
  {
    label: t('finance.dashboard.collectionRate'),
    value: `${(collectionData.value.collectionRate || 0).toFixed(1)}%`,
    icon: 'ph:chart-line-up-bold',
    color: '#3B82F6'
  }
]);

// Expense Distribution Pie Chart
const expenseDistributionOption = computed(() => {
  if (!recentExpenses.value.length || !categories.value.length) return null;

  // Aggregate expenses by category
  const categoryMap = new Map<string, number>();
  recentExpenses.value.forEach(exp => {
    const catName = exp.category?.name || 'Uncategorized';
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + Number(exp.amount));
  });

  const data = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  if (!data.length) return null;

  const colors = ['#7849FF', '#3B82F6', '#10B981', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
  return getPieChartsData(data, colors);
});

// Monthly Cash Flow Bar Chart
const cashFlowOption = computed(() => {
  if (!recentExpenses.value.length) return null;

  // Group expenses by month
  const monthlyExpenses = new Map<string, number>();
  recentExpenses.value.forEach(exp => {
    if (!exp.date) return;
    const d = new Date(exp.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyExpenses.set(key, (monthlyExpenses.get(key) || 0) + Number(exp.amount));
  });

  // Sort months chronologically
  const sortedMonths = Array.from(monthlyExpenses.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  if (!sortedMonths.length) return null;

  const monthLabels = sortedMonths.map(([key]) => {
    const [year, month] = key.split('-');
    const d = new Date(Number(year), Number(month) - 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });

  const expenseValues = sortedMonths.map(([, val]) => val);

  // Simulate revenue as receivable distributed evenly (fallback data)
  const monthCount = sortedMonths.length || 1;
  const revenuePerMonth = collectionData.value.totalReceivable ? Math.round(collectionData.value.collectedMTD / monthCount) : 0;

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(30, 30, 45, 0.85)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-radius: 16px;'
    },
    legend: {
      data: ['Revenue', 'Expenses'],
      textStyle: { color: '#94A3B8' },
      bottom: 0
    },
    grid: { top: 20, right: 20, bottom: 40, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: monthLabels,
      axisLabel: { color: '#94A3B8', fontWeight: 500 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed' as const, color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B' }
    },
    series: [
      {
        name: 'Revenue',
        type: 'bar',
        barWidth: '25%',
        barGap: '30%',
        data: sortedMonths.map(() => revenuePerMonth),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: graphic
            ? new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#10B981' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.3)' }
              ])
            : '#10B981'
        }
      },
      {
        name: 'Expenses',
        type: 'bar',
        barWidth: '25%',
        data: expenseValues,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: graphic
            ? new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#EF4444' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.3)' }
              ])
            : '#EF4444'
        }
      }
    ]
  };
});

// Data loaders
async function loadExpenses() {
  loadingExpenses.value = true;
  try {
    // Build filters
    const filters: unknown = { limit: '50', sort: 'DATE_DESC' };
    if (dateRange.value) {
      filters.startDate = dateRange.value[0].toISOString();
      filters.endDate = dateRange.value[1].toISOString();
    }
    if (categoryFilter.value) {
      filters.categoryId = categoryFilter.value;
    }

    const [summaryRes, expensesRes, cats] = await Promise.all([fetchExpenseSummary(), fetchExpenses(filters), fetchExpenseCategories()]);
    expenseSummary.value = summaryRes;
    recentExpenses.value = expensesRes.docs;
    categories.value = cats;
  } catch (e: unknown) {
    logger.error('Failed to load expenses:', e);
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.fetchError') });
  } finally {
    loadingExpenses.value = false;
  }
}

async function loadBudgets() {
  loadingBudgets.value = true;
  try {
    const result = await fetchBudgets();
    budgets.value = result.docs;
  } catch (e: unknown) {
    logger.error('Failed to load budgets:', e);
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.fetchError') });
  } finally {
    loadingBudgets.value = false;
  }
}

async function loadCollectionData() {
  loadingCollection.value = true;
  loadingCashFlow.value = true;
  try {
    collectionData.value = await getCollectionDashboard();
  } catch (e: unknown) {
    logger.error('Failed to load collection data:', e);
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.fetchError') });
  } finally {
    loadingCollection.value = false;
    loadingCashFlow.value = false;
  }
}

function handleDateRangeChange() {
  applyFilters();
}

async function applyFilters() {
  refreshing.value = true;
  try {
    await loadExpenses();
    await loadBudgets();
  } finally {
    refreshing.value = false;
  }
}

async function refreshAll() {
  refreshing.value = true;
  try {
    await Promise.all([loadExpenses(), loadBudgets(), loadCollectionData()]);
    ElNotification({ type: 'success', title: t('finance.dashboard.refreshed'), message: '' });
  } finally {
    refreshing.value = false;
  }
}

// Helpers
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getExpenseTagType(status: string): string {
  const map: Record<string, string> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' };
  return map[status] || 'info';
}

function getBudgetPercentage(budget: BudgetItem): string {
  if (!budget.amount || budget.amount === 0) return '0';
  return Math.round((budget.spent / budget.amount) * 100).toString();
}

function getBudgetColor(budget: BudgetItem): string {
  const pct = Number(getBudgetPercentage(budget));
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f59e0b';
  return '#22c55e';
}

function handleKPIDrilldown(label: string) {
  if (label === t('finance.dashboard.totalExpenses')) {
    navigateTo('/finance/expenses');
  } else if (label === t('finance.dashboard.activeBudgets')) {
    navigateTo('/finance/budgets');
  } else if (label === t('finance.dashboard.pendingExpenses')) {
    navigateTo('/finance/expenses?status=PENDING');
  }
}

// Init
onMounted(() => {
  loadExpenses();
  loadBudgets();
  loadCollectionData();
});
</script>

<style lang="scss" scoped>
.chart-container {
  min-height: 200px;
}
</style>
