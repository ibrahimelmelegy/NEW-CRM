<template lang="pug">
div
  //- Header
  ModuleHeader(
    :title="$t('hr.dashboard.title')"
    :subtitle="$t('hr.dashboard.subtitle')"
  )

  //- Loading State
  .flex.justify-center.py-12(v-if="loading")
    el-skeleton(:rows="8" animated)

  template(v-else)
    //- KPI Stat Cards
    StatCards(:stats="kpiCards" :columns="5")

    //- Charts Row
    .grid.grid-cols-1.gap-6.mb-8(class="lg:grid-cols-2")
      //- Department Distribution Pie Chart
      .glass-card.p-6.animate-entrance
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:chart-pie-slice-bold" size="20" class="mr-2")
            | {{ $t('hr.dashboard.employeeDistribution') }}
        .chart-container
          ClientOnly
            VChart(v-if="departmentChartOption" :option="departmentChartOption" autoresize style="height: 300px")
          .text-center.py-12(v-if="!departmentChartOption")
            Icon(name="ph:chart-pie-slice" size="48" style="color: var(--text-muted)")
            p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('hr.dashboard.noDepartmentData') }}

      //- Status Breakdown Bar Chart
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.05s")
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:chart-bar-bold" size="20" class="mr-2")
            | {{ $t('hr.dashboard.statusBreakdown') }}
        .chart-container
          ClientOnly
            VChart(v-if="statusChartOption" :option="statusChartOption" autoresize style="height: 300px")
          .text-center.py-12(v-if="!statusChartOption")
            Icon(name="ph:chart-bar" size="48" style="color: var(--text-muted)")
            p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('hr.dashboard.noStatusData') }}

    //- Quick Navigation
    .mb-8
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:squares-four-bold" size="20" class="mr-2")
        | {{ $t('hr.dashboard.quickNavigation') }}
      .grid.grid-cols-1.gap-4(class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6")
        NuxtLink.glass-card.p-5.animate-entrance.block.transition-all(
          v-for="(nav, i) in quickNavItems"
          :key="nav.to"
          :to="nav.to"
          :style="{ animationDelay: `${i * 0.05}s` }"
          class="hover:border-[#7849ff] hover:scale-[1.02] cursor-pointer"
          style="border: 1px solid transparent; text-decoration: none"
        )
          .flex.flex-col.items-center.text-center.gap-3
            .w-12.h-12.rounded-2xl.flex.items-center.justify-center(:style="{ background: nav.color + '15' }")
              Icon(:name="nav.icon" size="24" :style="{ color: nav.color }")
            span.text-sm.font-semibold(style="color: var(--text-primary)") {{ nav.label }}

    //- Recent Employees Table
    .glass-card.rounded-2xl.overflow-hidden.animate-entrance(style="animation-delay: 0.15s")
      .flex.items-center.justify-between.p-6.pb-4
        h3.text-lg.font-bold(style="color: var(--text-primary)")
          Icon(name="ph:users-bold" size="20" class="mr-2")
          | {{ $t('hr.dashboard.recentEmployees') }}
        NuxtLink.text-sm(to="/hr/employees" style="color: var(--accent-color, #7849ff)") {{ $t('common.viewAll') }}

      el-table(:data="recentEmployees" style="width: 100%")
        el-table-column(:label="$t('hr.employees.employee')" min-width="220")
          template(#default="{ row }")
            .flex.items-center.gap-3
              .w-9.h-9.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.15)")
                span.text-sm.font-bold(style="color: #7849ff") {{ row.firstName?.charAt(0) }}{{ row.lastName?.charAt(0) }}
              div
                p.text-sm.font-semibold(style="color: var(--text-primary)") {{ getFullName(row) }}
                p.text-xs(style="color: var(--text-muted)") {{ row.employeeNumber }}

        el-table-column(:label="$t('hr.employees.department')" min-width="160")
          template(#default="{ row }")
            .flex.items-center.gap-2
              Icon(name="ph:buildings-bold" size="14" style="color: #7849ff")
              span.text-sm(style="color: var(--text-primary)") {{ row.department?.name || '---' }}

        el-table-column(prop="jobTitle" :label="$t('hr.employees.jobTitle')" min-width="160")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.jobTitle || '---' }}

        el-table-column(:label="$t('hr.employees.status')" width="130" align="center")
          template(#default="{ row }")
            el-tag(
              size="small"
              round
              :type="getEmployeeStatusType(row.status)"
              effect="light"
            ) {{ getEmployeeStatusLabel(row.status) }}

        el-table-column(:label="$t('hr.employees.hireDate')" width="140")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.hireDate) }}
</template>

<script setup lang="ts">
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import {
  fetchEmployees,
  fetchDepartments,
  getFullName,
  getEmployeeStatusType,
  getEmployeeStatusLabel,
  EMPLOYEE_STATUSES
} from '~/composables/useEmployees';
import type { Employee, DepartmentItem } from '~/composables/useEmployees';
import { getPieChartsData, getBarChartData } from '~/composables/charts';
import { formatDate, formatLargeNumber } from '~/composables/format';

use([CanvasRenderer, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();

const loading = ref(true);
const employees = ref<Employee[]>([]);
const departments = ref<DepartmentItem[]>([]);

// KPI Stat Cards
const kpiCards = computed(() => {
  const total = employees.value.length;
  const active = employees.value.filter(e => e.status === 'ACTIVE').length;
  const onLeave = employees.value.filter(e => e.status === 'ON_LEAVE').length;
  const deptCount = departments.value.length;

  const salaries = employees.value.filter(e => e.salary && e.salary > 0).map(e => e.salary!);
  const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((sum, s) => sum + s, 0) / salaries.length) : 0;

  return [
    {
      label: t('hr.dashboard.totalEmployees'),
      value: total,
      icon: 'ph:users-bold',
      color: '#7849FF'
    },
    {
      label: t('hr.dashboard.activeEmployees'),
      value: active,
      icon: 'ph:user-check-bold',
      color: '#10B981'
    },
    {
      label: t('hr.dashboard.onLeave'),
      value: onLeave,
      icon: 'ph:airplane-tilt-bold',
      color: '#F97316'
    },
    {
      label: t('hr.dashboard.departments'),
      value: deptCount,
      icon: 'ph:buildings-bold',
      color: '#3B82F6'
    },
    {
      label: t('hr.dashboard.avgSalary'),
      value: avgSalary > 0 ? `SAR ${formatLargeNumber(avgSalary)}` : 'N/A',
      icon: 'ph:money-bold',
      color: '#8B5CF6'
    }
  ];
});

// Department Distribution Pie Chart
const departmentChartOption = computed(() => {
  const deptMap = new Map<string, number>();
  for (const emp of employees.value) {
    const deptName = emp.department?.name || t('hr.employees.unassigned');
    deptMap.set(deptName, (deptMap.get(deptName) || 0) + 1);
  }
  if (deptMap.size === 0) return null;

  const data = Array.from(deptMap.entries()).map(([name, value]) => ({ name, value }));
  const colors = ['#7849FF', '#3B82F6', '#10B981', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#6366F1'];

  return getPieChartsData(data, colors);
});

// Employee Status Bar Chart
const statusChartOption = computed(() => {
  const statusCounts = EMPLOYEE_STATUSES.map(s => ({
    name: s.label,
    value: employees.value.filter(e => e.status === s.value).length
  }));

  const hasData = statusCounts.some(s => s.value > 0);
  if (!hasData) return null;

  return getBarChartData(statusCounts, ['#7849FF']);
});

// Quick Navigation Items
const quickNavItems = computed(() => [
  { label: t('hr.employees.employees'), to: '/hr/employees', icon: 'ph:users-bold', color: '#7849FF' },
  { label: t('hr.departments.departments'), to: '/hr/departments', icon: 'ph:buildings-bold', color: '#3B82F6' },
  { label: t('hr.orgChart.orgChart'), to: '/hr/org-chart', icon: 'ph:tree-structure-bold', color: '#10B981' },
  { label: t('hr.payroll.payroll'), to: '/hr/payroll', icon: 'ph:money-bold', color: '#F97316' },
  { label: t('hr.leave.title'), to: '/hr/leave-requests', icon: 'ph:calendar-check-bold', color: '#8B5CF6' },
  { label: t('hr.attendance.title'), to: '/hr/attendance', icon: 'ph:clock-bold', color: '#EC4899' }
]);

// Recent Employees — latest 10 sorted by hire date descending
const recentEmployees = computed(() => {
  return [...employees.value].sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime()).slice(0, 10);
});

// Load Data
async function loadData() {
  loading.value = true;
  try {
    const [empResult, deptResult] = await Promise.all([fetchEmployees({ limit: '500' }), fetchDepartments()]);
    employees.value = empResult.docs;
    departments.value = deptResult;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.chart-container {
  min-height: 200px;
}
</style>
