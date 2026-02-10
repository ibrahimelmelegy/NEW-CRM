<template lang="pug">
.performance-hr.chromatic-dashboard
  .header.mb-8
    h2(class="text-2xl font-bold text-primary mb-2") {{ $t('dashboard.performanceHr') }}
    p.text-muted {{ $t('dashboard.performanceHint') }}

  //- Team Performance Row
  .cards.grid.grid-cols-1.md_grid-cols-2.lg_grid-cols-3.gap-6.mb-8
    StatisticsCard(
      :name="$t('dashboard.widgets.totalLeads')" 
      :data="preformanceStats?.firstCards?.[0]?.value || 0" 
      icon="ph:users-four-bold" 
      colorType="indigo"
    )
    StatisticsCard(
      :name="$t('dashboard.widgets.oppDealConv')" 
      :data="preformanceStats?.firstCards?.[1]?.value || 0" 
      icon="ph:trend-up-bold" 
      colorType="cyan"
    )
    StatisticsCard(
      :name="$t('dashboard.widgets.totalDeals')" 
      :data="preformanceStats?.firstCards?.[2]?.value || 0" 
      icon="ph:medal-bold" 
      colorType="emerald"
    )
</template>

<script lang="ts" setup>
const preformanceStats = ref(await getPerformanceStatics());
</script>

<style lang="scss" scoped>
.chromatic-dashboard {
  padding: 10px;
}
</style>
