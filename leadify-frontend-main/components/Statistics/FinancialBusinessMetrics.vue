<template lang="pug">
.financial-metrics.chromatic-dashboard
  .header.mb-8
    h2(class="text-2xl font-bold text-primary mb-2") {{ $t('dashboard.financialBusinessMetrics') }}
    p.text-muted {{ $t('dashboard.financialHint') }}

  //- Core Financial Row
  .cards.grid.grid-cols-3.gap-6.mb-8
    StatisticsCard(
      :name="$t('dashboard.widgets.totalDealsRevenue')" 
      :data="bussinesStats?.firstCards?.[0]?.value || 0" 
      icon="ph:currency-circle-dollar-bold" 
      colorType="rose"
    )
    StatisticsCard(
      :name="$t('dashboard.widgets.outstandingInvoices')" 
      :data="bussinesStats?.firstCards?.[1]?.value || 0" 
      icon="ph:receipt-bold" 
      colorType="amber"
    )
    StatisticsCard(
      :name="$t('dashboard.widgets.collectedPayments')" 
      :data="bussinesStats?.firstCards?.[2]?.value || 0" 
      icon="ph:check-circle-bold" 
      colorType="emerald"
    )
</template>

<script lang="ts" setup>
const bussinesStats = ref(await getBussinesStatics());
</script>

<style lang="scss" scoped>
.chromatic-dashboard {
  padding: 10px;
}
</style>
