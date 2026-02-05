<template lang="pug">
.statistics
  el-tabs.w-full(v-model='selectedTab' @tab-change="tabChange")

    el-tab-pane(:label="$t('dashboard.leadsSales')" name='leadsSales')
      ClientOnly
        StatisticsLeadsSales(v-if="selectedTab === 'leadsSales'")

    el-tab-pane(:label="$t('dashboard.projectsOperations')" name='projectsOperations')
      ClientOnly
        StatisticsProjectsOperations(v-if="selectedTab === 'projectsOperations'")

    el-tab-pane(:label="$t('dashboard.financialBusinessMetrics')" name='financialBusinessMetrics')
      ClientOnly
        StatisticsFinancialBusinessMetrics(v-if="selectedTab === 'financialBusinessMetrics'")

    el-tab-pane(:label="$t('dashboard.performanceHr')" name='performanceHr')
      ClientOnly
        StatisticsPerformanceHr(v-if="selectedTab === 'performanceHr'")

    el-tab-pane(:label="$t('dashboard.procurement')" name='procurement')
      ClientOnly
        StatisticsProcurement(v-if="selectedTab === 'procurement'")
</template>

<script setup lang="ts">
  const route = useRoute();
  const router = useRouter();
  const selectedTab = ref("leadsSales");

  function tabChange(tab: string) {
    selectedTab.value = tab;
    router.push({
      path: "",
      query: { tab: selectedTab.value },
    });
  }

  selectedTab.value = (route.query?.tab as string) || "leadsSales";
</script>
