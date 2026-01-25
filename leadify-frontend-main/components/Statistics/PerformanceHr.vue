<template lang="pug">
.performance-hr.chromatic-dashboard
  .header.mb-8
    h2(class="text-2xl font-bold text-primary mb-2") Performance & HR Metrics
    p.text-muted Analyze team productivity, conversion efficiency, and success rates.

  //- Team Performance Row
  .cards.grid.grid-cols-3.gap-6.mb-8
    StatisticsCard(
      name="Total Leads" 
      :data="preformanceStats.firstCards[0].value" 
      icon="ph:users-four-bold" 
      colorType="indigo"
    )
    StatisticsCard(
      name="Opp -> Deal Conv." 
      :data="preformanceStats.firstCards[1].value" 
      icon="ph:trend-up-bold" 
      colorType="cyan"
    )
    StatisticsCard(
      name="Total Deals" 
      :data="preformanceStats.firstCards[2].value" 
      icon="ph:medal-bold" 
      colorType="emerald"
    )
</template>

<script lang="ts" setup>
  const preformanceStats = ref(await getPerformanceStatics());
</script>

<style lang="scss" scoped>
.chromatic-dashboard { padding: 10px; }
</style>
