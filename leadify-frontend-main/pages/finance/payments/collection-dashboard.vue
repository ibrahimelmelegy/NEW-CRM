<template lang="pug">
div
  ModuleHeader(
    :title="$t('payments.collectionDashboard')"
    :subtitle="$t('payments.collectionDashboardSubtitle')"
  )
    template(#actions)
      el-button(size="large" @click="$router.push('/finance/payments')")
        Icon(name="ph:arrow-left-bold" size="18")
        span.mx-1 {{ $t('payments.backToPayments') }}
      el-button(type="primary" size="large" @click="refreshDashboard")
        Icon(name="ph:arrows-clockwise-bold" size="18")
        span.mx-1 {{ $t('payments.refresh') }}

  //- KPI Cards
  PaymentCollectionCards(:data="dashboardData" :loading="loading")

  .grid.gap-6.mt-6(class="lg:grid-cols-2 grid-cols-1")
    //- Top Debtors
    .glass-card
      .p-5.border-b(style="border-color: var(--border-color)")
        .flex.items-center.justify-between
          div
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('payments.topDebtors') }}
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('payments.topDebtorsSubtitle') }}
          .w-10.h-10.rounded-2xl.flex.items-center.justify-center(style="background: #ef444415")
            Icon(name="ph:warning-circle-bold" size="22" style="color: #ef4444")
      PaymentDebtorTable(:debtors="dashboardData.topDebtors" :loading="loading")

    //- Aging Breakdown
    .glass-card
      .p-5.border-b(style="border-color: var(--border-color)")
        .flex.items-center.justify-between
          div
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('payments.agingBreakdown') }}
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('payments.agingBreakdownSubtitle') }}
          .w-10.h-10.rounded-2xl.flex.items-center.justify-center(style="background: #7849ff15")
            Icon(name="ph:chart-bar-bold" size="22" style="color: #7849ff")
      .p-5
        .space-y-4
          .flex.items-center.justify-between(v-for="bucket in agingBuckets" :key="bucket.label")
            .flex.items-center.gap-3
              .w-3.h-3.rounded-full(:style="{ background: bucket.color }")
              span.text-sm.font-medium(style="color: var(--text-primary)") {{ bucket.label }}
            .flex.items-center.gap-4
              .w-48
                el-progress(
                  :percentage="bucket.percentage"
                  :color="bucket.color"
                  :stroke-width="8"
                  :show-text="false"
                )
              span.text-sm.font-bold.w-24.text-right(style="color: var(--text-primary)") {{ formatCurrency(bucket.amount) }}
              span.text-xs.w-12.text-right(style="color: var(--text-muted)") {{ bucket.percentage }}%

  //- Recent Payments Section
  .glass-card.mt-6
    .p-5.border-b(style="border-color: var(--border-color)")
      .flex.items-center.justify-between
        div
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('payments.recentCollections') }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('payments.recentCollectionsSubtitle') }}
        el-button(text @click="$router.push('/finance/payments')")
          span {{ $t('payments.viewAll') }}
          Icon(name="ph:arrow-right-bold" size="16" class="ml-1")
    el-table(:data="recentPayments" v-loading="loadingRecent" style="width: 100%")
      el-table-column(prop="paymentNumber" :label="$t('payments.tablePaymentNumber')" width="140")
        template(#default="{ row }")
          span.font-semibold {{ row.paymentNumber }}
      el-table-column(prop="client" :label="$t('payments.tableClient')" min-width="180")
        template(#default="{ row }")
          span {{ row.client?.clientName || '-' }}
      el-table-column(prop="amount" :label="$t('payments.tableAmount')" width="140")
        template(#default="{ row }")
          span.font-bold(style="color: #22c55e") {{ formatCurrency(row.amount) }}
      el-table-column(prop="date" :label="$t('payments.tableDate')" width="130")
        template(#default="{ row }")
          span {{ formatDate(row.date) }}
      el-table-column(prop="method" :label="$t('payments.tableMethod')" width="150")
        template(#default="{ row }")
          el-tag(size="small" effect="plain") {{ methodLabel(row.method) }}
      el-table-column(prop="status" :label="$t('payments.tableStatus')" width="120")
        template(#default="{ row }")
          el-tag(size="small" :type="statusColor(row.status)" effect="light") {{ row.status }}
</template>

<script setup lang="ts">
import {
  getCollectionDashboard,
  getPayments,
  paymentMethodLabels,
  paymentStatusColors,
  type CollectionDashboard,
  type PaymentItem
} from '~/composables/usePayments';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const loading = ref(true);
const loadingRecent = ref(true);

const dashboardData = ref<CollectionDashboard>({
  totalReceivable: 0,
  overdue: 0,
  collectedMTD: 0,
  collectionRate: 0,
  topDebtors: []
});

const recentPayments = ref<PaymentItem[]>([]);

// Aging buckets (simulated from dashboard data)
const agingBuckets = computed(() => {
  const total = dashboardData.value.totalReceivable || 1;
  const overdue = dashboardData.value.overdue || 0;
  const current = total - overdue;

  // Approximate distribution of overdue across buckets
  const days30 = overdue * 0.4;
  const days60 = overdue * 0.3;
  const days90 = overdue * 0.3;

  return [
    {
      label: t('payments.agingCurrent'),
      amount: current,
      percentage: Math.round((current / total) * 100),
      color: '#22c55e'
    },
    {
      label: t('payments.aging3160'),
      amount: days30,
      percentage: Math.round((days30 / total) * 100),
      color: '#f59e0b'
    },
    {
      label: t('payments.aging6190'),
      amount: days60,
      percentage: Math.round((days60 / total) * 100),
      color: '#f97316'
    },
    {
      label: t('payments.aging90plus'),
      amount: days90,
      percentage: Math.round((days90 / total) * 100),
      color: '#ef4444'
    }
  ];
});

async function refreshDashboard() {
  loading.value = true;
  loadingRecent.value = true;
  try {
    const [dashboard, recent] = await Promise.all([getCollectionDashboard(), getPayments({ limit: 5, status: 'COMPLETED' })]);
    dashboardData.value = dashboard;
    recentPayments.value = recent.docs;
  } finally {
    loading.value = false;
    loadingRecent.value = false;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function methodLabel(method: string): string {
  return paymentMethodLabels[method] || method;
}

function statusColor(status: string): string {
  return paymentStatusColors[status] || '';
}

// Initial load
await refreshDashboard();
</script>
