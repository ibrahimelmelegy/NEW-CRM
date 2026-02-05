<template lang="pug">
.financial-metrics.chromatic-dashboard
  .header.mb-8
    h2(class="text-2xl font-bold text-primary mb-2") Financial & Business Metrics
    p.text-muted Tracking revenue flow, outstanding invoices, and payment collections.

  //- Core Financial Row
  .cards.grid.grid-cols-3.gap-6.mb-8
    StatisticsCard(
      name="Total Deals Revenue" 
      :data="bussinesStats?.firstCards?.[0]?.value || 0" 
      icon="ph:currency-circle-dollar-bold" 
      colorType="rose"
    )
    StatisticsCard(
      name="Outstanding Invoices" 
      :data="bussinesStats?.firstCards?.[1]?.value || 0" 
      icon="ph:receipt-bold" 
      colorType="amber"
    )
    StatisticsCard(
      name="Collected Payments" 
      :data="bussinesStats?.firstCards?.[2]?.value || 0" 
      icon="ph:check-circle-bold" 
      colorType="emerald"
    )
</template>

<script lang="ts" setup>
  const bussinesStats = ref(await getBussinesStatics());
</script>

<style lang="scss" scoped>
.chromatic-dashboard { padding: 10px; }
</style>
