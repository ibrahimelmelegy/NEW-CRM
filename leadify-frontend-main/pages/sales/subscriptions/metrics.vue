<template lang="pug">
div
  .flex.items-center.justify-between.mb-5.mt-5
    .flex.items-center.gap-3
      el-button(circle size="small" @click="$router.back()")
        Icon(name="ph:arrow-left-bold" size="18")
      .title.font-bold.text-2xl.mb-1.capitalize Subscription Metrics
    el-button(
      size="large"
      class="!rounded-2xl"
      @click="loadMetrics"
      :loading="loading"
    )
      Icon.mr-1(name="ph:arrows-clockwise-bold" size="18")
      | Refresh

  div(v-loading="loading")
    //- KPI Cards
    .grid.gap-6.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5")
      .glass-card.p-6.text-center.animate-entrance
        .text-sm.mb-2(style="color: var(--text-muted)") Monthly Recurring Revenue
        .text-2xl.font-bold(style="color: #7849ff") {{ formatSubscriptionCurrency(metrics?.mrr || 0) }}
        .flex.items-center.justify-center.mt-2
          Icon(name="ph:trend-up-bold" size="16" style="color: #67c23a")
          span.text-sm.ml-1(style="color: #67c23a") MRR

      .glass-card.p-6.text-center.animate-entrance(style="animation-delay: 0.05s")
        .text-sm.mb-2(style="color: var(--text-muted)") Annual Recurring Revenue
        .text-2xl.font-bold(style="color: #409eff") {{ formatSubscriptionCurrency(metrics?.arr || 0) }}
        .flex.items-center.justify-center.mt-2
          Icon(name="ph:calendar-bold" size="16" style="color: #409eff")
          span.text-sm.ml-1(style="color: #409eff") ARR

      .glass-card.p-6.text-center.animate-entrance(style="animation-delay: 0.1s")
        .text-sm.mb-2(style="color: var(--text-muted)") Churn Rate
        .text-2xl.font-bold(:style="{ color: (metrics?.churnRate || 0) > 5 ? '#f56c6c' : '#67c23a' }") {{ metrics?.churnRate || 0 }}%
        .flex.items-center.justify-center.mt-2
          Icon(
            :name="(metrics?.churnRate || 0) > 5 ? 'ph:trend-down-bold' : 'ph:trend-up-bold'"
            size="16"
            :style="{ color: (metrics?.churnRate || 0) > 5 ? '#f56c6c' : '#67c23a' }"
          )
          span.text-sm.ml-1(style="color: var(--text-muted)") This month

      .glass-card.p-6.text-center.animate-entrance(style="animation-delay: 0.15s")
        .text-sm.mb-2(style="color: var(--text-muted)") Active Subscriptions
        .text-2xl.font-bold(style="color: #67c23a") {{ metrics?.activeCount || 0 }}
        .flex.items-center.justify-center.mt-2
          Icon(name="ph:check-circle-bold" size="16" style="color: #67c23a")
          span.text-sm.ml-1(style="color: var(--text-muted)") Active

      .glass-card.p-6.text-center.animate-entrance(style="animation-delay: 0.2s")
        .text-sm.mb-2(style="color: var(--text-muted)") Trial Subscriptions
        .text-2xl.font-bold(style="color: #e6a23c") {{ metrics?.trialCount || 0 }}
        .flex.items-center.justify-center.mt-2
          Icon(name="ph:hourglass-bold" size="16" style="color: #e6a23c")
          span.text-sm.ml-1(style="color: var(--text-muted)") In trial

    //- Charts Row
    .grid.gap-6.mb-8(class="grid-cols-1 lg:grid-cols-2")
      //- MRR Trend Chart
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.25s")
        h3.text-lg.font-semibold.mb-6(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:chart-bar-bold" size="20" style="color: #7849ff")
          | MRR Trend (Last 6 Months)
        MRRChart(:data="metrics?.mrrTrend || []")

      //- Churn Rate Display
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.3s")
        h3.text-lg.font-semibold.mb-6(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:chart-line-down-bold" size="20" style="color: #7849ff")
          | Churn Analysis
        ChurnChart(:data="{ rate: metrics?.churnRate || 0, trend: churnTrend }")

    //- Revenue Summary Row
    .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
      //- Total Revenue
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.35s")
        h3.text-lg.font-semibold.mb-4(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:money-bold" size="20" style="color: #7849ff")
          | Revenue Summary
        .grid.gap-4(class="grid-cols-2")
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Total Active Revenue
            p.text-xl.font-bold(style="color: var(--text-primary)") {{ formatSubscriptionCurrency(metrics?.totalRevenue || 0) }}
          div
            p.text-sm.mb-1(style="color: var(--text-muted)") Net Revenue Retention
            .flex.items-center
              p.text-xl.font-bold(:style="{ color: (metrics?.netRevenueGrowth || 0) >= 100 ? '#67c23a' : '#f56c6c' }") {{ metrics?.netRevenueGrowth || 0 }}%
              Icon.ml-2(
                :name="(metrics?.netRevenueGrowth || 0) >= 100 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'"
                size="20"
                :style="{ color: (metrics?.netRevenueGrowth || 0) >= 100 ? '#67c23a' : '#f56c6c' }"
              )

      //- Quick Actions
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.4s")
        h3.text-lg.font-semibold.mb-4(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:lightning-bold" size="20" style="color: #7849ff")
          | Quick Actions
        .flex.flex-col.gap-3
          el-button(
            size="large"
            class="!rounded-xl !w-full !justify-start"
            @click="$router.push('/sales/subscriptions')"
          )
            Icon.mr-2(name="ph:list-bold" size="18")
            | View All Subscriptions
          el-button(
            size="large"
            class="!rounded-xl !w-full !justify-start"
            @click="$router.push('/sales/subscriptions/plans')"
          )
            Icon.mr-2(name="ph:package-bold" size="18")
            | Manage Plans
          el-button(
            size="large"
            type="warning"
            class="!rounded-xl !w-full !justify-start"
            @click="handleProcessRenewals"
            :loading="processingRenewals"
          )
            Icon.mr-2(name="ph:arrows-clockwise-bold" size="18")
            | Process Auto-Renewals
</template>

<script setup lang="ts">
import {
  fetchSubscriptionMetrics,
  processAutoRenewals,
  formatSubscriptionCurrency,
  type SubscriptionMetrics
} from '~/composables/useSubscriptions';

const loading = ref(false);
const processingRenewals = ref(false);
const metrics = ref<SubscriptionMetrics | null>(null);

const churnTrend = computed(() => {
  if (!metrics.value) return 'stable';
  return metrics.value.churnRate > 5 ? 'up' : 'down';
});

async function loadMetrics() {
  loading.value = true;
  try {
    metrics.value = await fetchSubscriptionMetrics();
  } finally {
    loading.value = false;
  }
}

async function handleProcessRenewals() {
  processingRenewals.value = true;
  try {
    await processAutoRenewals();
    // Refresh metrics after processing
    await loadMetrics();
  } finally {
    processingRenewals.value = false;
  }
}

onMounted(() => {
  loadMetrics();
});
</script>

<style scoped>
.glass-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e4e7ed);
  border-radius: 1rem;
}

.animate-entrance {
  animation: fadeInUp 0.3s ease-out both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
