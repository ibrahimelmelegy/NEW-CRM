<template lang="pug">
div
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold {{ $t('accounting.trialBalance.title') }}
      p.text-gray-500.mt-1 {{ $t('accounting.trialBalance.subtitle') }}
    .flex.gap-3
      el-date-picker(
        v-model="asOfDate"
        type="date"
        :placeholder="$t('accounting.trialBalance.asOfDate')"
        value-format="YYYY-MM-DD"
        @change="loadReport"
      )
      el-button(type="primary" @click="exportCSV")
        span {{ $t('accounting.trialBalance.export') }}

  el-card(shadow="never")
    el-table(
      :data="trialBalance.accounts"
      v-loading="loading"
      border
      show-summary
      :summary-method="summaryMethod"
      class="w-full"
    )
      el-table-column(prop="code" :label="$t('accounting.trialBalance.accountCode')" width="140")
      el-table-column(prop="name" :label="$t('accounting.trialBalance.accountName')" min-width="250")
      el-table-column(prop="debit" :label="$t('accounting.trialBalance.debit')" width="160" align="right")
        template(#default="{ row }")
          span(v-if="row.debit > 0") {{ formatCurrency(row.debit) }}
          span(v-else) -
      el-table-column(prop="credit" :label="$t('accounting.trialBalance.credit')" width="160" align="right")
        template(#default="{ row }")
          span(v-if="row.credit > 0") {{ formatCurrency(row.credit) }}
          span(v-else) -

    //- Balance indicator
    .flex.justify-end.mt-4
      el-tag(
        :type="trialBalance.isBalanced ? 'success' : 'danger'"
        size="large"
        effect="dark"
      )
        span(v-if="trialBalance.isBalanced") {{ $t('accounting.trialBalance.isBalanced') }}
        span(v-else) {{ $t('accounting.trialBalance.notBalanced', { diff: formatCurrency(Math.abs(trialBalance.totalDebits - trialBalance.totalCredits)) }) }}
</template>

<script setup lang="ts">
import { fetchTrialBalance } from '~/composables/useAccounting';
import type { TrialBalanceResult } from '~/composables/useAccounting';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const loading = ref(false);
const asOfDate = ref(new Date().toISOString().substring(0, 10));
const trialBalance = ref<TrialBalanceResult>({
  accounts: [],
  totalDebits: 0,
  totalCredits: 0,
  isBalanced: true
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
}

function summaryMethod({ columns, data }: any) {
  const sums: string[] = [];
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = t('accounting.trialBalance.totals');
      return;
    }
    if (index === 1) {
      sums[index] = '';
      return;
    }
    if (column.property === 'debit') {
      sums[index] = formatCurrency(trialBalance.value.totalDebits);
    } else if (column.property === 'credit') {
      sums[index] = formatCurrency(trialBalance.value.totalCredits);
    } else {
      sums[index] = '';
    }
  });
  return sums;
}

async function loadReport() {
  loading.value = true;
  try {
    trialBalance.value = await fetchTrialBalance(asOfDate.value);
  } finally {
    loading.value = false;
  }
}

function exportCSV() {
  const headers = [
    t('accounting.trialBalance.accountCode'),
    t('accounting.trialBalance.accountName'),
    t('accounting.trialBalance.debit'),
    t('accounting.trialBalance.credit')
  ];
  const rows = trialBalance.value.accounts.map(a => [a.code, a.name, a.debit > 0 ? a.debit.toFixed(2) : '', a.credit > 0 ? a.credit.toFixed(2) : '']);
  rows.push(['', t('accounting.trialBalance.totals'), trialBalance.value.totalDebits.toFixed(2), trialBalance.value.totalCredits.toFixed(2)]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trial-balance-${asOfDate.value}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

await loadReport();
</script>
