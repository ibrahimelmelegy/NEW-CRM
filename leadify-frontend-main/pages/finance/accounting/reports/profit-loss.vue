<template lang="pug">
div
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold {{ $t('accounting.profitLoss.title') }}
      p.text-gray-500.mt-1 {{ $t('accounting.profitLoss.subtitle') }}
    .flex.items-end.gap-3
      div
        label.block.text-sm.font-medium.mb-1 {{ $t('accounting.profitLoss.period') }}
        el-date-picker(
          v-model="dateRange"
          type="daterange"
          :range-separator="$t('common.to')"
          :start-placeholder="$t('common.from')"
          :end-placeholder="$t('common.to')"
          value-format="YYYY-MM-DD"
        )
      el-button(type="primary" @click="loadReport") {{ $t('accounting.profitLoss.generate') }}

  //- Revenue vs Expenses Chart
  el-card(shadow="never" class="mb-4" v-if="report.totalRevenue > 0 || report.totalExpenses > 0")
    h3.text-lg.font-semibold.mb-4 {{ $t('accounting.profitLoss.revenueVsExpenses') }}
    .flex.items-end.gap-8.justify-center(style="height: 200px")
      .flex.flex-col.items-center
        .bg-green-500.rounded-t(
          :style="{ width: '80px', height: revenueBarHeight + 'px' }"
        )
        .mt-2.text-sm.font-medium {{ $t('accounting.profitLoss.revenue') }}
        .text-lg.font-bold.text-green-600 {{ formatCurrency(report.totalRevenue) }}
      .flex.flex-col.items-center
        .bg-red-400.rounded-t(
          :style="{ width: '80px', height: expenseBarHeight + 'px' }"
        )
        .mt-2.text-sm.font-medium {{ $t('accounting.profitLoss.expenses') }}
        .text-lg.font-bold.text-red-500 {{ formatCurrency(report.totalExpenses) }}

  //- Report sections
  AccountingFinancialReport(
    :title="$t('accounting.profitAndLoss')"
    :sections="reportSections"
    :total="reportTotal"
  )
</template>

<script setup lang="ts">
import { fetchProfitAndLoss } from '~/composables/useAccounting';
import type { ProfitLossResult } from '~/composables/useAccounting';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const loading = ref(false);
const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
const lastDay = now.toISOString().substring(0, 10);
const dateRange = ref<[string, string]>([firstDay, lastDay]);

const report = ref<ProfitLossResult>({
  period: { from: firstDay, to: lastDay },
  revenue: [],
  totalRevenue: 0,
  expenses: [],
  totalExpenses: 0,
  netIncome: 0
});

const maxBarHeight = 160;
const revenueBarHeight = computed(() => {
  const max = Math.max(report.value.totalRevenue, report.value.totalExpenses, 1);
  return Math.max((report.value.totalRevenue / max) * maxBarHeight, 4);
});
const expenseBarHeight = computed(() => {
  const max = Math.max(report.value.totalRevenue, report.value.totalExpenses, 1);
  return Math.max((report.value.totalExpenses / max) * maxBarHeight, 4);
});

const reportSections = computed(() => [
  {
    title: t('accounting.profitLoss.revenue'),
    items: report.value.revenue.map(r => ({ label: `${r.code} - ${r.name}`, amount: r.amount })),
    subtotal: report.value.totalRevenue,
    color: '#67C23A'
  },
  {
    title: t('accounting.profitLoss.expenses'),
    items: report.value.expenses.map(e => ({ label: `${e.code} - ${e.name}`, amount: e.amount })),
    subtotal: report.value.totalExpenses,
    color: '#E6A23C'
  }
]);

const reportTotal = computed(() => ({
  label: report.value.netIncome >= 0 ? t('accounting.profitLoss.netIncome') : t('accounting.profitLoss.netLoss'),
  amount: report.value.netIncome,
  highlight: true,
  color: report.value.netIncome >= 0 ? '#67C23A' : '#F56C6C'
}));

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
}

async function loadReport() {
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) return;
  loading.value = true;
  try {
    report.value = await fetchProfitAndLoss(dateRange.value[0], dateRange.value[1]);
  } finally {
    loading.value = false;
  }
}

await loadReport();
</script>
