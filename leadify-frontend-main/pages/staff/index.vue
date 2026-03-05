<template lang="pug">
  div
    //- Header
    .flex.items-center.justify-between.mb-8
      .title.font-bold.text-2xl.mb-1.capitalize {{ $t('staff.title') }}
      .flex.items-center.gap-x-3
        ExportButton(:data="exportData" :columns="exportColumns" :filename="'staff-export'" :title="$t('staff.title')")
        NuxtLink(to="/staff/add-staff")
          el-button(size='large' :loading="loading" v-if="hasPermission('CREATE_STAFF')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl") {{ $t('staff.newStaff') }}

    //- KPI Analytics Section
    .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
      .glass-card.p-5.rounded-2xl
        .flex.items-center.justify-between
          div
            p.text-xs.font-medium.uppercase.tracking-wide(style="color: var(--text-muted)") {{ $t('staff.analytics.totalActive') }}
            p.text-2xl.font-bold.mt-1(style="color: #7849ff") {{ staffAnalytics.totalActive }}
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: #7849ff20")
            Icon(name="ph:users-bold" size="20" style="color: #7849ff")
      .glass-card.p-5.rounded-2xl
        .flex.items-center.justify-between
          div
            p.text-xs.font-medium.uppercase.tracking-wide(style="color: var(--text-muted)") {{ $t('staff.analytics.departments') }}
            p.text-2xl.font-bold.mt-1(style="color: #10b981") {{ staffAnalytics.departmentCount }}
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: #10b98120")
            Icon(name="ph:building-office-bold" size="20" style="color: #10b981")
      .glass-card.p-5.rounded-2xl
        .flex.items-center.justify-between
          div
            p.text-xs.font-medium.uppercase.tracking-wide(style="color: var(--text-muted)") {{ $t('staff.analytics.recentHires') }}
            p.text-2xl.font-bold.mt-1(style="color: #3b82f6") {{ staffAnalytics.recentHires }}
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: #3b82f620")
            Icon(name="ph:user-plus-bold" size="20" style="color: #3b82f6")
      .glass-card.p-5.rounded-2xl
        .flex.items-center.justify-between
          div
            p.text-xs.font-medium.uppercase.tracking-wide(style="color: var(--text-muted)") {{ $t('staff.analytics.avgTenure') }}
            p.text-2xl.font-bold.mt-1(style="color: #f59e0b") {{ staffAnalytics.avgTenure }}
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: #f59e0b20")
            Icon(name="ph:calendar-blank-bold" size="20" style="color: #f59e0b")

    //- Charts Row
    .grid.gap-6.mb-6(class="grid-cols-1 md:grid-cols-2" v-if="!loadingAction")
      .glass-card.p-6.rounded-2xl
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('staff.analytics.departmentDistribution') }}
        ClientOnly
          VChart(v-if="departmentChartOption" :option="departmentChartOption" autoresize style="height: 300px")
        .text-center.py-12(v-if="!departmentChartOption")
          Icon(name="ph:chart-pie" size="48" style="color: var(--text-muted)")
          p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .glass-card.p-6.rounded-2xl
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('staff.analytics.roleDistribution') }}
        ClientOnly
          VChart(v-if="roleChartOption" :option="roleChartOption" autoresize style="height: 300px")
        .text-center.py-12(v-if="!roleChartOption")
          Icon(name="ph:chart-bar" size="48" style="color: var(--text-muted)")
          p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('common.noData') }}

    SavedViews(:entityType="'staff'" :currentFilters="{}" @apply-view="handleApplyView")
    AdvancedSearch(:entityType="'staff'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")

    //- Desktop Table
    .staff-desktop-view
      AppTable(v-slot="{data}" :filterOptions="filterOptions" :columns="table.columns" position="users" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" searchPlaceholder="staff" :loading="loadingAction" emptyIcon="ph:users-bold" :emptyMessage="$t('staff.emptyMessage')" :emptyDescription="$t('staff.emptyDescription')" emptyActionHref="/staff/add-staff" :emptyActionLabel="$t('staff.emptyActionLabel')" )
        .flex.items-center.py-2(@click.stop)
            el-dropdown(class="outline-0" trigger="click")
                span(class="el-dropdown-link")
                  .toggle-icon.text-md
                      Icon(name="IconToggle"  size="22")
                template(#dropdown='')
                    el-dropdown-menu
                        el-dropdown-item
                          NuxtLink.flex.items-center(:to="`/staff/${data?.id}`")
                            Icon.text-md.mr-2(name="IconEye" )
                            p.text-sm {{ $t('common.view') }}
                        el-dropdown-item(v-if="hasPermission('EDIT_STAFF') && data?.id !== 1" )
                          NuxtLink.flex.items-center(:to="`/staff/edit/${data?.id}`")
                            Icon.text-md.mr-2(name="IconEdit" )
                            p.text-sm {{ $t('common.edit') }}

    //- Mobile Card View
    .staff-mobile-view(v-if="!loadingAction")
      PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
        .mb-3
          el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('staff.title')}`" clearable class="!rounded-xl")
            template(#prefix)
              Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

        .status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
          button.status-pill(
            v-for="filter in mobileFilters"
            :key="filter.value"
            :class="{ 'status-pill--active': mobileStatusFilter === filter.value }"
            :style="mobileStatusFilter === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
            @click="mobileStatusFilter = filter.value; vibrate()"
          )
            span {{ filter.label }}
            span.status-pill__count(v-if="filter.count > 0") {{ filter.count }}

        .space-y-3(v-if="mobileFilteredData.length")
          SwipeCard(
            v-for="staff in mobileFilteredData"
            :key="staff.id"
            :rightActions="getSwipeRightActions(staff)"
            :leftActions="getSwipeLeftActions(staff)"
            @action="(name) => handleSwipeAction(name, staff)"
          )
            .entity-card.p-4(@click="handleRowClick(staff)")
              .flex.items-start.justify-between.mb-3
                .flex.items-center.gap-3.min-w-0.flex-1
                  .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                    :style="{ background: '#7849ff20', color: '#7849ff' }"
                  ) {{ (staff.staffDetails?.title || staff.name || '?').charAt(0).toUpperCase() }}
                  .min-w-0.flex-1
                    p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ staff.staffDetails?.title || staff.name || '--' }}
                    p.text-xs.truncate(style="color: var(--text-muted)") {{ staff.roleDetails || '' }}
                el-tag.shrink-0(:type="staff.status === 'ACTIVE' ? 'success' : 'info'" size="small" effect="dark" round) {{ staff.status }}

              .grid.grid-cols-2.gap-2
                .flex.items-center.gap-2(v-if="staff.email")
                  Icon(name="ph:envelope" size="14" style="color: var(--text-muted)")
                  a.text-xs.truncate(:href="`mailto:${staff.email}`" style="color: var(--text-secondary)" @click.stop) {{ staff.email }}
                .flex.items-center.gap-2(v-if="staff.phone")
                  Icon(name="ph:phone" size="14" style="color: var(--text-muted)")
                  a.text-xs.truncate(:href="`tel:${staff.phone}`" style="color: var(--text-secondary)" @click.stop) {{ staff.phone }}

        .text-center.py-12(v-if="!mobileFilteredData.length")
          Icon(name="ph:users" size="48" style="color: var(--text-muted)")
          p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

        .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
          span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('staff.title').toLowerCase() }}

      .mobile-fab(v-if="hasPermission('CREATE_STAFF')" @click="navigateTo('/staff/add-staff')")
        Icon(name="ph:plus-bold" size="24")

    ActionModel(v-model="deleteStaffPopup" :loading="loadingAction" @confirm="deleteStaffAction()" :btn-text="$t('staff.actions.moveToArchive')" :description-one="$t('staff.actions.deleteConfirm')" icon="/images/delete-image.png" :description-two="$t('staff.actions.deleteDescription')" )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { getPieChartsData } from '~/composables/charts';

use([CanvasRenderer, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const { hasPermission } = await usePermissions();
const { t } = useI18n();
const router = useRouter();
const loadingAction = ref(false);
const loading = ref(false);
const deleteStaffPopup = ref(false);
const staffActionId = ref();

// Export columns & data
const exportColumns = [
  { prop: 'staffDetails', label: t('staff.table.staffName') },
  { prop: 'email', label: t('staff.table.email') },
  { prop: 'phone', label: t('staff.table.phone') },
  { prop: 'roleDetails', label: t('staff.table.role') },
  { prop: 'status', label: t('staff.table.status') },
  { prop: 'updatedAt', label: t('staff.table.lastActivity') }
];
const exportData = computed(() => table.data);

const table = reactive({
  columns: [
    {
      prop: 'staffDetails',
      label: t('staff.table.staffName'),
      component: 'AvatarText',
      sortable: true,
      type: 'font-bold',
      width: 170
    },
    {
      prop: 'email',
      label: t('staff.table.email'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 220
    },
    {
      prop: 'phone',
      label: t('staff.table.phone'),
      component: 'Text',
      sortable: false,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'roleDetails',
      label: t('staff.table.role'),
      component: 'Text',
      sortable: false,
      type: 'font-default',
      width: 200
    },
    {
      prop: 'status',
      label: t('staff.table.status'),
      component: 'Label',
      sortable: true,
      type: 'outline',
      filters: [
        { text: t('common.active'), value: 'ACTIVE' },
        { text: t('common.inactive'), value: 'INACTIVE' }
      ],
      width: 150
    },
    {
      prop: 'updatedAt',
      label: t('staff.table.lastActivity'),
      component: 'Text',
      sortable: false,
      type: 'font-default',
      width: 200
    }
  ],
  data: [] as Staff[]
});

// Call API to Get the staff
const response = await useTableFilter('users');
table.data = response.formattedData;

// Staff Analytics
const staffAnalytics = computed(() => {
  const data = table.data || [];
  const activeStaff = data.filter((s) => s.status === 'ACTIVE');

  // Department count (extracted from role or department field)
  const departments = new Set<string>();
  data.forEach((s) => {
    const dept = s.department || s.roleDetails?.split('-')[0]?.trim() || 'Unknown';
    departments.add(dept);
  });

  // Recent hires (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentHires = data.filter((s) => {
    if (!s.createdAt) return false;
    return new Date(s.createdAt) > thirtyDaysAgo;
  }).length;

  // Average tenure (in months)
  const staffWithDates = data.filter((s) => s.createdAt);
  const avgTenureMonths =
    staffWithDates.length > 0
      ? Math.round(
          staffWithDates.reduce((sum, s) => {
            const months = Math.max(0, Math.floor((new Date().getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));
            return sum + months;
          }, 0) / staffWithDates.length
        )
      : 0;

  return {
    totalActive: activeStaff.length,
    departmentCount: departments.size,
    recentHires,
    avgTenure: avgTenureMonths > 0 ? `${avgTenureMonths} ${t('staff.analytics.months')}` : '--'
  };
});

// Department Distribution Chart
const departmentChartOption = computed(() => {
  const data = table.data || [];
  if (!data.length) return null;

  const deptMap = new Map<string, number>();
  data.forEach((s) => {
    const dept = s.department || s.roleDetails?.split('-')[0]?.trim() || 'Unknown';
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
  });

  const chartData = Array.from(deptMap.entries()).map(([name, value]) => ({ name, value }));
  if (!chartData.length) return null;

  const colors = ['#7849FF', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
  return getPieChartsData(chartData, colors);
});

// Role Distribution Chart
const roleChartOption = computed(() => {
  const data = table.data || [];
  if (!data.length) return null;

  const roleMap = new Map<string, number>();
  data.forEach((s) => {
    const role = s.roleDetails || 'Unknown';
    roleMap.set(role, (roleMap.get(role) || 0) + 1);
  });

  const roles = Array.from(roleMap.keys()).slice(0, 10); // Top 10 roles
  const counts = roles.map(r => roleMap.get(r) || 0);

  if (!roles.length) return null;

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(30, 30, 45, 0.85)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#fff' }
    },
    grid: { top: 20, right: 20, bottom: 60, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: roles,
      axisLabel: { color: '#94A3B8', rotate: 45, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed' as const, color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B' }
    },
    series: [
      {
        type: 'bar',
        data: counts,
        barWidth: '40%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: '#7849ff'
        }
      }
    ]
  };
});

function handleRowClick(val: unknown) {
  router.push(`/staff/${val.id}`);
}

// Call API to delete the staff
async function deleteStaffAction() {
  loadingAction.value = true;

  await deleteStaff(staffActionId.value);
  deleteStaffPopup.value = false;

  // Call API to Get the staff
  const response = await useTableFilter('users');
  table.data = response.formattedData;

  loadingAction.value = false;
}

const mappedRoles = ref<{ label: string; value: unknown }[]>();
//  Get roles
const repsonse = await useApiFetch('role');
// Map clients to Select Options
mappedRoles.value = repsonse.body?.docs?.map((e) => ({
  label: e.name,
  value: e.id
}));

const filterOptions = [
  {
    title: t('staff.table.status'),
    value: 'status',
    options: [...staffStatuses]
  },
  {
    title: t('staff.table.role'),
    value: 'roleId',
    options: mappedRoles.value
  }
];

// SavedViews & AdvancedSearch
const advancedSearchFields = [
  { key: 'name', label: t('staff.table.staffName'), type: 'string' },
  { key: 'email', label: t('staff.table.email'), type: 'string' },
  { key: 'phone', label: t('staff.table.phone'), type: 'string' },
  { key: 'status', label: t('staff.table.status'), type: 'select', options: staffStatuses.map((s) => ({ value: s.value, label: s.label })) },
  { key: 'roleId', label: t('staff.table.role'), type: 'select', options: mappedRoles.value || [] },
  { key: 'createdAt', label: t('common.created'), type: 'date' }
];

async function handleApplyView(view: unknown) {
  if (view?.filters) {
    const res = await useTableFilter('users', view.filters);
    table.data = res.formattedData;
  }
}

async function handleAdvancedFilter(filterPayload: unknown) {
  try {
    const res = await useApiFetch('search/advanced/staff', 'POST', filterPayload);
    if (res?.success && res?.body) {
      const data = res.body as unknown;
      table.data = data.docs || data || [];
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}

async function handleClearAdvancedFilter() {
  const res = await useTableFilter('users');
  table.data = res.formattedData;
}

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileStatusFilter = ref('ALL');
const mobileRefreshing = ref(false);

const mobileFilters = computed(() => {
  const data = table.data || [];
  return [
    { value: 'ALL', label: t('common.all'), color: '#7849ff', count: data.length },
    { value: 'ACTIVE', label: t('common.active'), color: '#10b981', count: data.filter((s) => s.status === 'ACTIVE').length },
    { value: 'INACTIVE', label: t('common.inactive'), color: '#94a3b8', count: data.filter((s) => s.status === 'INACTIVE').length }
  ];
});

const mobileFilteredData = computed(() => {
  let data = table.data || [];
  if (mobileStatusFilter.value !== 'ALL') {
    data = data.filter((s) => s.status === mobileStatusFilter.value);
  }
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((s) => {
    const name = (s.staffDetails?.title || s.name || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const phone = (s.phone || '').toLowerCase();
    const role = (s.roleDetails || '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || role.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    const res = await useTableFilter('users');
    table.data = res.formattedData;
    vibrate([10, 30, 10]);
  } finally {
    mobileRefreshing.value = false;
  }
}

function getSwipeRightActions(staff: unknown) {
  const actions: Record<string, unknown>[] = [];
  if (staff.phone) actions.push({ name: 'call', label: t('common.call'), icon: 'ph:phone-bold', color: '#10B981' });
  if (staff.email) actions.push({ name: 'email', label: t('common.email'), icon: 'ph:envelope-bold', color: '#3B82F6' });
  return actions;
}

function getSwipeLeftActions(staff: unknown) {
  const actions = [{ name: 'view', label: t('common.view'), icon: 'ph:eye-bold', color: '#7849ff' }];
  if (hasPermission('EDIT_STAFF') && staff.id !== 1)
    actions.push({ name: 'edit', label: t('common.edit'), icon: 'ph:pencil-simple-bold', color: '#F59E0B' });
  return actions;
}

function handleSwipeAction(name: string, staff: unknown) {
  vibrate();
  switch (name) {
    case 'call':
      window.location.href = `tel:${staff.phone}`;
      break;
    case 'email':
      window.location.href = `mailto:${staff.email}`;
      break;
    case 'view':
      navigateTo(`/staff/${staff.id}`);
      break;
    case 'edit':
      navigateTo(`/staff/edit/${staff.id}`);
      break;
  }
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('staff', #7849ff);
</style>
