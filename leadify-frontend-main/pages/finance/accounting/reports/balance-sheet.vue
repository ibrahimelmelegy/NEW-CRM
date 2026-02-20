<template lang="pug">
div
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold Balance Sheet
      p.text-gray-500.mt-1 Assets, liabilities, and equity as of a specific date
    .flex.items-end.gap-3
      div
        label.block.text-sm.font-medium.mb-1 As of Date
        el-date-picker(
          v-model="asOfDate"
          type="date"
          placeholder="Select date"
          value-format="YYYY-MM-DD"
        )
      el-button(type="primary" @click="loadReport") Generate

  //- Balance validation indicator
  .mb-4(v-if="report.assets.length || report.liabilities.length || report.equity.length")
    el-alert(
      :type="report.isBalanced ? 'success' : 'error'"
      :title="report.isBalanced ? 'Balance Sheet is balanced: Total Assets = Total Liabilities + Equity' : 'Balance Sheet is NOT balanced'"
      :closable="false"
      show-icon
    )

  //- Assets Section
  el-card(shadow="never" class="mb-4")
    template(#header)
      .flex.items-center.justify-between
        h3.text-lg.font-semibold(style="color: #409EFF") Assets
        span.text-lg.font-bold {{ formatCurrency(report.totalAssets) }}
    el-table(:data="report.assets" v-loading="loading" class="w-full" :show-header="true")
      el-table-column(prop="code" label="Code" width="120")
      el-table-column(prop="name" label="Account" min-width="250")
      el-table-column(label="Amount" width="160" align="right")
        template(#default="{ row }")
          span {{ formatCurrency(row.amount) }}

  //- Liabilities Section
  el-card(shadow="never" class="mb-4")
    template(#header)
      .flex.items-center.justify-between
        h3.text-lg.font-semibold(style="color: #F56C6C") Liabilities
        span.text-lg.font-bold {{ formatCurrency(report.totalLiabilities) }}
    el-table(:data="report.liabilities" v-loading="loading" class="w-full" :show-header="true")
      el-table-column(prop="code" label="Code" width="120")
      el-table-column(prop="name" label="Account" min-width="250")
      el-table-column(label="Amount" width="160" align="right")
        template(#default="{ row }")
          span {{ formatCurrency(row.amount) }}

  //- Equity Section
  el-card(shadow="never" class="mb-4")
    template(#header)
      .flex.items-center.justify-between
        h3.text-lg.font-semibold(style="color: #9B59B6") Equity
        span.text-lg.font-bold {{ formatCurrency(report.totalEquity) }}
    el-table(:data="equityWithNetIncome" v-loading="loading" class="w-full" :show-header="true")
      el-table-column(prop="code" label="Code" width="120")
      el-table-column(prop="name" label="Account" min-width="250")
      el-table-column(label="Amount" width="160" align="right")
        template(#default="{ row }")
          span(:class="{ 'font-bold text-green-600': row.isNetIncome && row.amount >= 0, 'font-bold text-red-600': row.isNetIncome && row.amount < 0 }") {{ formatCurrency(row.amount) }}

  //- Summary
  el-card(shadow="never")
    .grid.grid-cols-3.gap-4.text-center
      div
        .text-sm.text-gray-500 Total Assets
        .text-xl.font-bold(style="color: #409EFF") {{ formatCurrency(report.totalAssets) }}
      div
        .text-sm.text-gray-500 Total Liabilities
        .text-xl.font-bold(style="color: #F56C6C") {{ formatCurrency(report.totalLiabilities) }}
      div
        .text-sm.text-gray-500 Total Equity
        .text-xl.font-bold(style="color: #9B59B6") {{ formatCurrency(report.totalEquity) }}
</template>

<script setup lang="ts">
import { fetchBalanceSheet } from '~/composables/useAccounting';
import type { BalanceSheetResult } from '~/composables/useAccounting';

definePageMeta({ middleware: 'permissions' });

const loading = ref(false);
const asOfDate = ref(new Date().toISOString().substring(0, 10));

const report = ref<BalanceSheetResult>({
  asOfDate: '',
  assets: [],
  totalAssets: 0,
  liabilities: [],
  totalLiabilities: 0,
  equity: [],
  netIncome: 0,
  totalEquity: 0,
  totalLiabilitiesAndEquity: 0,
  isBalanced: true
});

const equityWithNetIncome = computed(() => {
  const items = report.value.equity.map(e => ({ ...e, isNetIncome: false }));
  if (report.value.netIncome !== 0) {
    items.push({
      code: '-',
      name: report.value.netIncome >= 0 ? 'Net Income (Current Period)' : 'Net Loss (Current Period)',
      type: 'EQUITY',
      amount: report.value.netIncome,
      isNetIncome: true
    });
  }
  return items;
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
}

async function loadReport() {
  if (!asOfDate.value) return;
  loading.value = true;
  try {
    report.value = await fetchBalanceSheet(asOfDate.value);
  } finally {
    loading.value = false;
  }
}

await loadReport();
</script>
