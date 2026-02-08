<template lang="pug">
.flex.items-center.justify-between.mb-5.mt-5
  .title.font-bold.text-2xl.mb-1.capitalize {{ $t('reports.title') }}
el-tabs.demo-tabs(v-model="activeName")
  el-tab-pane(:label="$t('reports.tabs.sales')" name="sales")
    ReportSalesFilter(:user="user")
  el-tab-pane(:label="$t('reports.tabs.projects')" name="projects")
    ReportProjectsFilter(:user="user")
  el-tab-pane(:label="$t('reports.tabs.performance')" name="performance")
    ReportPerformanceFilter(:user="user")
</template>

<script setup lang="ts">
const activeName = ref('sales');
const user = ref();

const response = await useApiFetch('auth/me');
user.value = response?.body;
</script>
