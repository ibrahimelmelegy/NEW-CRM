<template lang="pug">
    .leads-sales.glass-card.rounded-2xl.p-6(class="min-h-[70vh]")
      .header.mb-4.flex.gap-2
        Icon.text-2xl.text-main(name="bx:line-chart")
        h2(class="text-xl font-bold text-neutral-800 mb-4") Information Dashboard 
        //- StatisticsHeader
      .cards.grid.grid-cols-4.gap-4.mb-4
        OperationsDailyTasksCard(:name="i.name" :data="i.value" :icon="i.icon" v-for="i in cardData")
      .pie-chart-line-increase.grid.grid-cols-12.gap-4
        .stat-card.p-6.col-span-6(v-loading="dailyTaskStatisticsLoading" class='h-[600px]')
          .flex.items-center.justify-between.mb-4
            h3(class="text-base font-semibold text-black") Project status
          v-chart.pie-chart(:option='pieChartTaskStatusPercentageOptions' autoresize)
        .stat-card.p-6.col-span-6(v-loading="dailyTaskStatisticsLoading" class='h-[600px]')
          .flex.items-center.justify-between.mb-4
            h3(class="text-base font-semibold text-black") Monthly revenue
          v-chart.bar-chart(:option='barChartMonthlyRevenueOptions' autoresize)
        .stat-card.p-6.col-span-6(v-loading="dailyTaskStatisticsLoading" class='h-[600px]')
          .flex.items-center.justify-between.mb-4
            h3(class="text-base font-semibold text-black") Distribution of projects according to clients
          v-chart.pie-chart(:option='pieChartTaskDistributionByClientOptions' autoresize)
        .stat-card.p-6.col-span-6(v-loading="dailyTaskStatisticsLoading" class='h-[600px]')
          .flex.items-center.justify-between.mb-4
            h3(class="text-base font-semibold text-black") Sales Representative Performance
          v-chart.bar-chart(:option='barChartSalesPerformanceOptions' autoresize)
    </template>

<script lang="ts" setup>
import VChart from 'vue-echarts';

const colorpieChart = ['#3498db', '#2ecc71', '#f39c12'];
const colorbarChart = ['#3498db'];

const dailyTaskStats = ref<any>({});

onMounted(async () => {
  const dailyTaskStatsRes = await getDailyTaskStatistics();
  dailyTaskStats.value = dailyTaskStatsRes || {};
});

const cardData = computed(() => [
  {
    name: 'Active Projects',
    value: dailyTaskStats.value?.activeTasks ?? 0,
    icon: { name: 'fluent:task-list-ltr-24-filled', color: '#3498db' }
  },
  {
    name: 'Completed Projects',
    value: dailyTaskStats.value?.completedTasks ?? 0,
    icon: { name: 'ic:round-task-alt', color: '#2ecc71' }
  },
  {
    name: 'Granted Projects',
    value: dailyTaskStats.value?.grantedTasks ?? 0,
    icon: { name: 'material-symbols:award-star', color: '#f39c12' }
  },
  {
    name: 'Total Revenue Projects',
    value: dailyTaskStats.value?.totalRevenue ?? 0,
    icon: { name: 'ic:sharp-monetization-on', color: '#27ae60' }
  }
]);

const barChartSalesPerformanceOptions = computed(() => getBarChartWithLineData(
  dailyTaskStats.value?.salesPerformance, ['Tasks count', 'Total paid'],
  colorbarChart
));
const barChartMonthlyRevenueOptions = computed(() => getBarChartData(
  dailyTaskStats.value?.monthlyRevenue,
  colorbarChart
));
const pieChartTaskDistributionByClientOptions = computed(() => getCenterPieChartsData(
  dailyTaskStats.value?.taskDistributionByClient,
  colorpieChart,
  ''
));

const pieChartTaskStatusPercentageOptions = computed(() => getPieChartsData(dailyTaskStats.value?.taskStatusPercentage, colorpieChart));
</script>
