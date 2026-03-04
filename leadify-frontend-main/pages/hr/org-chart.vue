<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('hr.orgChart.orgChart') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('hr.orgChart.visualizeStructure') }}
    .flex.items-center.gap-3
      el-button(size="large" class="!rounded-2xl" @click="expandAll = !expandAll")
        Icon(:name="expandAll ? 'ph:arrows-in-bold' : 'ph:arrows-out-bold'" size="16" class="mr-1")
        span {{ expandAll ? $t('hr.orgChart.collapseAll') : $t('hr.orgChart.expandAll') }}
      el-button(type="primary" size="large" class="!rounded-2xl" @click="navigateTo('/hr/employees')")
        Icon(name="ph:users-bold" size="16" class="mr-1")
        span {{ $t('hr.orgChart.viewEmployees') }}

  //- Loading
  .flex.justify-center.py-16(v-if="loading")
    el-skeleton(:rows="8" animated)

  //- Empty state
  .glass-card.p-12.rounded-2xl.text-center(v-else-if="!orgData.length")
    Icon(name="ph:tree-structure-bold" size="64" style="color: var(--text-muted)")
    h3.mt-4.font-semibold(style="color: var(--text-primary)") {{ $t('hr.orgChart.noOrganizationData') }}
    p.mt-2(style="color: var(--text-muted)") {{ $t('hr.orgChart.addEmployeesHint') }}
    el-button.mt-4(type="primary" size="large" class="!rounded-2xl" @click="navigateTo('/hr/employees/create')")
      Icon(name="ph:plus-bold" size="16" class="mr-1")
      span {{ $t('hr.orgChart.addFirstEmployee') }}

  //- Org Chart
  .glass-card.p-6.rounded-2xl.overflow-auto(v-else)
    .org-chart-container
      HROrgChartTree(
        v-for="root in orgData"
        :key="root.id"
        :data="root"
        class="mb-6"
      )
</template>

<script setup lang="ts">
import { fetchOrgChart } from '~/composables/useEmployees';
import type { OrgChartNode } from '~/composables/useEmployees';

definePageMeta({ middleware: 'permissions' });

const loading = ref(true);
const expandAll = ref(false);
const orgData = ref<OrgChartNode[]>([]);

try {
  orgData.value = await fetchOrgChart();
} finally {
  loading.value = false;
}
</script>

<style scoped>
.org-chart-container {
  min-width: fit-content;
  padding: 16px;
}
</style>
