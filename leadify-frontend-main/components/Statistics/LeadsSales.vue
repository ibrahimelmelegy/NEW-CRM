<template lang="pug">
.leads-sales.chromatic-dashboard
  .header.mb-8
    h2(class="text-2xl font-bold text-primary mb-2") Leads & Sales Overview
    p.text-muted Analyze your sales pipeline and lead conversion performance.

  //- First Row: Core Acquisition Metrics
  .cards.grid.grid-cols-3.gap-6.mb-8
    StatisticsCard(
      name="Total Leads Assigned" 
      :data="leadStats.firstCards[0].value" 
      icon="ph:user-list-bold" 
      colorType="indigo"
    )
    StatisticsCard(
      name="Lead Conversion Rate" 
      :data="leadStats.firstCards[1].value" 
      icon="ph:chart-pie-slice-bold" 
      colorType="cyan"
    )
    StatisticsCard(
      name="Total Opportunities" 
      :data="leadStats.firstCards[2].value" 
      icon="ph:sparkle-bold" 
      colorType="amber"
    )

  //- Second Row: Pipeline & Revenue
  .bar-chart-cards.grid.grid-cols-12.gap-6.mb-8
    el-card.col-span-8(v-loading="statsLoading" class="glass-container h-[420px]")
      template(#header)
        .flex.items-center.gap-2
          .w-2.h-6.bg-accent-indigo.rounded-full
          h3(class="text-lg font-semibold text-primary") Deals Pipeline Overview
      
      div(class="h-[320px]")
        v-chart.bar-chart(:option="barChartOptions" autoresize)

    .col-span-4.flex.flex-col.gap-6
      StatisticsCard(
        name="Total Deals Closed" 
        :data="leadStats.secondCards[0].value" 
        icon="ph:handshake-bold" 
        colorType="emerald"
      )
      StatisticsCard(
        name="Revenue Won" 
        :data="leadStats.secondCards[1].value" 
        icon="ph:coins-bold" 
        colorType="rose"
      )

  //- Third Row: Deep Analytics
  .pie-chart-line-increase.grid.grid-cols-12.gap-6
    el-card.col-span-5(v-loading="statsLoading" class="glass-container h-[600px]")
      template(#header)
        .flex.items-center.gap-2
          .w-2.h-6.bg-accent-cyan.rounded-full
          h3(class="text-lg font-semibold text-primary") Opportunities by Stage
      
      div(class="h-[500px]")
        v-chart.pie-chart(:option="pieChartOptions" autoresize)

    el-card.col-span-7(v-loading="statsLoading" class="glass-container h-[600px]")
      template(#header)
        .flex.items-center.gap-2
          .w-2.h-6.bg-accent-rose.rounded-full
          h3(class="text-lg font-semibold text-primary") Sales Performance Over Time
      
      div(class="h-[500px]")
        v-chart.line-chart(:option="lineChartOptions" autoresize)
</template>

<script lang="ts" setup>
  import VChart from "vue-echarts";

  const vibrantPalette = ["#F59E0B", "#10B981", "#F97316", "#0EA5E9", "#6366F1", "#F43F5E"];

  const leadStats = ref(await getLeadsStatics());

  const barChartOptions = getBarChartData(leadStats.value?.dealsPipeline, vibrantPalette);
  const pieChartOptions = getPieChartsData(leadStats.value?.opportunityStages, vibrantPalette);
  const lineChartOptions = getIncreaseLineChart(leadStats.value?.salesPerformance, vibrantPalette);
</script>

<style lang="scss" scoped>
.chromatic-dashboard { padding: 10px; }
.glass-container {
  background: var(--bg-card) !important;
  background-image: var(--gradient-glass) !important;
  border: 1px solid var(--border-glass) !important;
  border-radius: var(--radius-card) !important;
  backdrop-filter: blur(10px);
  overflow: visible;

  :deep(.el-card__header) {
    border-bottom: 1px solid var(--border-stroke);
    padding: 20px 24px;
  }
}
</style>
