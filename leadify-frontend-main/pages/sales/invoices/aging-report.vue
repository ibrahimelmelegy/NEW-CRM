<template lang="pug">
div
  //- Header
  .flex.items-center.gap-3.mb-5.mt-5
    el-button(circle plain @click="goBack")
      Icon(name="ph:arrow-left-bold" size="18")
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('invoices.agingReportTitle') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('invoices.agingReportSubtitle') }}

  //- Loading
  .text-center.py-20(v-if="loading")
    el-icon.is-loading(size="40")
    p.mt-2(style="color: var(--text-muted)") {{ $t('invoices.loadingAgingReport') }}

  template(v-else-if="report")
    //- Summary cards
    .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-5")
      .glass-card.p-5.rounded-2xl.text-center
        .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('invoices.totalOutstandingLabel') }}
        .text-xl.font-bold(style="color: #7849ff") {{ fmtCurrency(report.totalOutstanding) }}
      .glass-card.p-5.rounded-2xl.text-center
        .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('invoices.current030') }}
        .text-xl.font-bold(style="color: #22c55e") {{ fmtCurrency(report.buckets.current.amount) }}
        .text-xs(style="color: var(--text-muted)") {{ report.buckets.current.count }} {{ $t('invoices.invoicesLabel') }}
      .glass-card.p-5.rounded-2xl.text-center
        .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('invoices.days3060') }}
        .text-xl.font-bold(style="color: #f59e0b") {{ fmtCurrency(report.buckets.thirtyDays.amount) }}
        .text-xs(style="color: var(--text-muted)") {{ report.buckets.thirtyDays.count }} {{ $t('invoices.invoicesLabel') }}
      .glass-card.p-5.rounded-2xl.text-center
        .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('invoices.days6090') }}
        .text-xl.font-bold(style="color: #f97316") {{ fmtCurrency(report.buckets.sixtyDays.amount) }}
        .text-xs(style="color: var(--text-muted)") {{ report.buckets.sixtyDays.count }} {{ $t('invoices.invoicesLabel') }}
      .glass-card.p-5.rounded-2xl.text-center
        .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('invoices.days90plus') }}
        .text-xl.font-bold(style="color: #ef4444") {{ fmtCurrency(report.buckets.ninetyPlus.amount) }}
        .text-xs(style="color: var(--text-muted)") {{ report.buckets.ninetyPlus.count }} {{ $t('invoices.invoicesLabel') }}

    //- Chart
    .glass-card.p-8.rounded-3xl.mb-6
      InvoiceAgingChart(:data="chartData")

    //- Client breakdown table
    .glass-card.p-8.rounded-3xl
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('invoices.clientBreakdown') }}
      el-table(
        :data="report.clientBreakdown"
        border
        style="width: 100%"
        :default-sort="{ prop: 'total', order: 'descending' }"
      )
        el-table-column(prop="clientName" :label="$t('invoices.clientDeal')" min-width="200" sortable)
        el-table-column(:label="$t('invoices.current030')" width="150" align="right" sortable prop="current")
          template(#default="{ row }")
            span(style="color: #22c55e") {{ fmtCurrency(row.current) }}
        el-table-column(:label="$t('invoices.days3060')" width="150" align="right" sortable prop="thirtyDays")
          template(#default="{ row }")
            span(style="color: #f59e0b") {{ fmtCurrency(row.thirtyDays) }}
        el-table-column(:label="$t('invoices.days6090')" width="150" align="right" sortable prop="sixtyDays")
          template(#default="{ row }")
            span(style="color: #f97316") {{ fmtCurrency(row.sixtyDays) }}
        el-table-column(:label="$t('invoices.days90plus')" width="150" align="right" sortable prop="ninetyPlus")
          template(#default="{ row }")
            span(style="color: #ef4444") {{ fmtCurrency(row.ninetyPlus) }}
        el-table-column(:label="$t('invoices.totalLabel')" width="160" align="right" sortable prop="total")
          template(#default="{ row }")
            span.font-bold(style="color: var(--text-primary)") {{ fmtCurrency(row.total) }}

  //- Empty state
  .text-center.py-20(v-else)
    Icon(name="ph:chart-bar-bold" size="48" style="color: var(--text-muted)")
    p.mt-3(style="color: var(--text-muted)") {{ $t('invoices.noAgingData') }}
</template>

<script setup lang="ts">
import type { AgingReport } from '~/composables/useInvoiceBilling';
import { getAgingReport, formatCurrency } from '~/composables/useInvoiceBilling';

definePageMeta({ middleware: 'permissions' });

const router = useRouter();
const loading = ref(true);
const report = ref<AgingReport | null>(null);

const chartData = computed(() => {
  if (!report.value) {
    return { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyPlus: 0 };
  }
  return {
    current: report.value.buckets.current.amount,
    thirtyDays: report.value.buckets.thirtyDays.amount,
    sixtyDays: report.value.buckets.sixtyDays.amount,
    ninetyPlus: report.value.buckets.ninetyPlus.amount
  };
});

function goBack() {
  router.push('/sales/invoices');
}

function fmtCurrency(amount: number): string {
  return formatCurrency(amount);
}

async function loadReport() {
  loading.value = true;
  try {
    report.value = await getAgingReport();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadReport();
});
</script>

<style scoped>
.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}
</style>
