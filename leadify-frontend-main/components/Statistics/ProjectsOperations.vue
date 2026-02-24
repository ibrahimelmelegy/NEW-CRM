<template lang="pug">
.projects-operations.chromatic-dashboard
  .header.mb-8
    h2(class="text-2xl font-bold text-primary mb-2") {{ $t('dashboard.projectsOperations') }}
    p.text-muted {{ $t('dashboard.projectsOverviewHint') }}

  //- First Row: Essential Project Metrics
  .cards.grid.grid-cols-1.md_grid-cols-2.gap-6.mb-8
    StatisticsCard(
      :name="$t('dashboard.widgets.totalProjects')" 
      :data="projectStats?.firstCards?.[0]?.value || 0" 
      icon="ph:projector-screen-chart-bold" 
      colorType="indigo"
    )
    StatisticsCard(
      :name="$t('dashboard.widgets.eitmadProjects')" 
      :data="projectStats?.firstCards?.[1]?.value || 0" 
      icon="ph:certificate-bold" 
      colorType="cyan"
    )

  //- Second Row: Horizontal Status Overview
  .bar-horizontal-chart.mb-8
    el-card.glass-container(v-loading="statsLoading" class="h-[420px]")
      template(#header)
        .flex.items-center.gap-2
          .w-2.h-6.bg-accent-indigo.rounded-full
          h3(class="text-lg font-semibold text-primary") {{ $t('dashboard.widgets.projectsByStatus') }}
      
      div(class="h-[320px]")
        v-chart.bar-chart(:option="barChartOptions" autoresize)

  //- Third Row: Resource Allocations (Pie Charts)
  .pie-chart.grid.grid-cols-1.lg_grid-cols-2.gap-6
    el-card.glass-container(v-loading="statsLoading" class="h-[550px]")
      template(#header)
        .flex.items-center.gap-2
          .w-2.h-6.bg-accent-emerald.rounded-full
          h3(class="text-lg font-semibold text-primary") {{ projectStats?.pieChart_one?.title }}
      
      div(class="h-[430px]")
        v-chart.pie-chart(:option="getPieChartsData(projectStats?.pieChart_one?.options, vibrantPalette)" autoresize)

    el-card.glass-container(v-loading="statsLoading" class="h-[550px]")
      template(#header)
        .flex.items-center.gap-2
          .w-2.h-6.bg-accent-amber.rounded-full
          h3(class="text-lg font-semibold text-primary") {{ projectStats?.pieChart_two?.title }}
      
      div(class="h-[430px]")
        v-chart.pie-chart(:option="getPieChartsData(projectStats?.pieChart_two?.options, vibrantPalette)" autoresize)
</template>

<script lang="ts" setup>
import VChart from 'vue-echarts';
import { getProjectOperationsStatics, getBarHorizontalChartData, getPieChartsData, statsLoading } from '@/composables/charts';

const vibrantPalette = ['#F59E0B', '#10B981', '#F97316', '#0EA5E9', '#6366F1', '#F43F5E'];

const projectStats = ref(await getProjectOperationsStatics());
const barChartOptions = computed(() => getBarHorizontalChartData(projectStats.value?.projectsByStatus, vibrantPalette));
</script>

<style lang="scss" scoped>
.chromatic-dashboard {
  padding: 10px;
}
.glass-container {
  background: var(--bg-card) !important;
  background-image: var(--gradient-glass) !important;
  border: 1px solid var(--border-glass) !important;
  border-radius: var(--radius-card) !important;
  backdrop-filter: blur(10px);
  :deep(.el-card__header) {
    border-bottom: 1px solid var(--border-stroke);
    padding: 20px 24px;
  }
}
</style>
