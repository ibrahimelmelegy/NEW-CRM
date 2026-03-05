<template lang="pug">
div(class="animate-fade-in")
  //- Premium Header
  PremiumPageHeader(
    :title="$t('operations.projects.title')"
    description="Oversee active projects, manage delivery timelines, and ensure client success."
    icon="ph:kanban-duotone"
    primaryColor="#8b5cf6"
  )
    template(#actions)
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'projects-export'" :title="$t('operations.projects.title')")
      NuxtLink(to="/operations/projects/add-project")
        el-button(size='large' :loading="loading" v-if="hasPermission('CREATE_PROJECTS')" native-type="submit" type="primary" :icon="Plus" class="!rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform") {{ $t('operations.projects.newProject') }}

  //- KPI Metrics
  .proj-kpi-grid
    PremiumKPICards(:metrics="kpiMetrics" v-if="!loadingAction")

  BulkActions(:count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="handleBulkDelete" @bulk-export="handleBulkExport" @clear-selection="selectedRows = []")
  SavedViews(:entityType="'project'" :currentFilters="{}" @apply-view="handleApplyView")
  AdvancedSearch(:entityType="'project'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")

  .proj-desktop-view
    AppTable(v-slot="{data}"  :filterOptions="filterOptions" :columns="table.columns" position="project" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('operations.projects.title')" emptyIcon="ph:kanban-bold" :emptyMessage="$t('operations.projects.noProjectsYet')" :emptyDescription="$t('operations.projects.noProjectsDesc')" emptyActionHref="/operations/projects/create" :emptyActionLabel="$t('operations.projects.createProject')" )
      .flex.items-center.py-2(@click.stop)
          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md
                    Icon(name="IconToggle"  size="22")
              template(#dropdown='')
                  el-dropdown-menu
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/projects/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item(v-if="hasPermission('EDIT_PROJECTS')")
                        NuxtLink.flex.items-center(:to="`/operations/projects/edit/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}
                      el-dropdown-item(v-if="hasPermission('DELETE_PROJECTS')" @click="[deleteLeadPopup=true, deleteId = data?.id]")
                        .flex.items-center
                          Icon.text-md.mr-2(name="IconDelete" )
                          p.text-sm {{ $t('common.delete') }}

  .proj-mobile-view(v-if="!loadingAction")
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('operations.projects.title')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
        button.status-pill(
          v-for="filter in mobileStatusFilters"
          :key="filter.value"
          :class="{ 'status-pill--active': mobileProjStatus === filter.value }"
          :style="mobileProjStatus === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="mobileProjStatus = filter.value; vibrate()"
        )
          span {{ filter.label }}
          span.status-pill__count(v-if="filter.count > 0") {{ filter.count }}

      .space-y-3(v-if="mobileFilteredData.length")
        SwipeCard(
          v-for="proj in mobileFilteredData"
          :key="proj.id"
          :leftActions="getProjLeftActions(proj)"
          :rightActions="[]"
          @action="(name) => handleProjSwipe(name, proj)"
        )
          .entity-card.p-4(@click="handleRowClick(proj)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: getProjColor(proj.status) + '20', color: getProjColor(proj.status) }"
                ) {{ (proj.name || '?').charAt(0).toUpperCase() }}
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ proj.name || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ proj.projectClient || '' }}
              el-tag.shrink-0(:type="getProjTagType(proj.status)" size="small" effect="dark" round) {{ proj.status?.replace('PROJECT_', '') }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="proj.totalCost")
                Icon(name="ph:money" size="14" style="color: var(--text-muted)")
                span.text-xs.font-semibold.truncate(style="color: var(--text-secondary)") {{ proj.totalCost }}
              .flex.items-center.gap-2(v-if="proj.category")
                Icon(name="ph:tag" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ proj.category }}
              .flex.items-center.gap-2(v-if="proj.startDate")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ proj.startDate }}
              .flex.items-center.gap-2(v-if="proj.duration")
                Icon(name="ph:clock" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ proj.duration }}

      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:kanban" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('operations.projects.title').toLowerCase() }}

    .mobile-fab(v-if="hasPermission('CREATE_PROJECTS')" @click="navigateTo('/operations/projects/add-project')")
      Icon(name="ph:plus-bold" size="24")

  ActionModel(v-model="deleteLeadPopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PremiumPageHeader from '~/components/UI/PremiumPageHeader.vue';
import PremiumKPICards from '~/components/UI/PremiumKPICards.vue';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';

const router = useRouter();
const { t } = useI18n();
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const deleteLeadPopup = ref(false);
const deleteId = ref<string | null>(null);
const deleting = ref(false);

// Export columns & data
const exportColumns = [
  { prop: 'name', label: useI18n().t('operations.projects.table.projectName') },
  { prop: 'projectClient', label: useI18n().t('operations.projects.table.clientName') },
  { prop: 'category', label: useI18n().t('operations.projects.table.category') },
  { prop: 'type', label: useI18n().t('operations.projects.table.type') },
  { prop: 'status', label: useI18n().t('operations.projects.table.status') },
  { prop: 'startDate', label: useI18n().t('operations.projects.table.startDate') },
  { prop: 'endDate', label: useI18n().t('operations.projects.table.endDate') },
  { prop: 'duration', label: useI18n().t('operations.projects.table.duration') },
  { prop: 'totalCost', label: useI18n().t('operations.projects.table.totalCost') },
  { prop: 'projectAssignedUsers', label: useI18n().t('operations.projects.table.assigned') }
];
const exportData = computed(() => table.data);

// Bulk actions
const selectedRows = ref<Record<string, unknown>[]>([]);
async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const response = await deleteProjectById(deleteId.value);
    if (response?.success) {
      table.data = table.data.filter((r) => r.id !== deleteId.value);
    }
  } finally {
    deleting.value = false;
    deleteLeadPopup.value = false;
  }
}

async function handleBulkDelete() {
  deleting.value = true;
  try {
    for (const row of selectedRows.value) {
      await deleteProjectById(row.id);
    }
    const ids = selectedRows.value.map((r) => r.id);
    table.data = table.data.filter((r) => !ids.includes(r.id));
  } finally {
    deleting.value = false;
    selectedRows.value = [];
  }
}
function handleBulkExport() {
  selectedRows.value = [];
}

const table = reactive({
  columns: [
    {
      prop: 'name',
      label: useI18n().t('operations.projects.table.projectName'),
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 150
    },
    {
      prop: 'projectClient',
      label: useI18n().t('operations.projects.table.clientName'),
      component: 'Text',
      type: 'font-bold',
      width: 150
    },
    {
      prop: 'category',
      label: useI18n().t('operations.projects.table.category'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'type',
      label: useI18n().t('operations.projects.table.type'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'status',
      label: useI18n().t('operations.projects.table.status'),
      component: 'Label',
      sortable: true,
      type: 'outline',
      filters: [
        { text: useI18n().t('operations.projects.status.active'), value: 'PROJECT_ACTIVE' },
        { text: useI18n().t('operations.projects.status.cancelled'), value: 'PROJECT_CANCELLED' },
        { text: useI18n().t('operations.projects.status.onHold'), value: 'PROJECT_ON_HOLD' },
        { text: useI18n().t('operations.projects.status.completed'), value: 'PROJECT_COMPLETE' }
      ],
      width: 150
    },
    {
      prop: 'startDate',
      label: useI18n().t('operations.projects.table.startDate'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'endDate',
      label: useI18n().t('operations.projects.table.endDate'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'duration',
      label: useI18n().t('operations.projects.table.duration'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'totalCost',
      label: useI18n().t('operations.projects.table.totalCost'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'projectAssignedUsers',
      label: useI18n().t('operations.projects.table.assigned'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 150
    }
  ],
  data: [] as CombinedProjectValues[]
});

const response = await useTableFilter('project');
table.data = response.formattedData;

const kpiMetrics = computed<KPIMetric[]>(() => {
  const data = table.data || [];
  const total = data.length;
  const active = data.filter((p) => p.status === 'PROJECT_ACTIVE').length;
  const completed = data.filter((p) => p.status === 'PROJECT_COMPLETE').length;

  // Calculate real average duration from project data
  const projectsWithDuration = data.filter((p) => p.duration && !isNaN(parseInt(p.duration)));
  const avgDuration =
    projectsWithDuration.length > 0
      ? Math.round(projectsWithDuration.reduce((sum, p) => sum + parseInt(p.duration || '0'), 0) / projectsWithDuration.length)
      : 0;

  // Calculate on-time delivery rate
  const completedProjects = data.filter((p) => p.status === 'PROJECT_COMPLETE');
  const onTimeDelivery = completedProjects.length > 0 ? Math.round((completedProjects.length / total) * 100) : 0;

  // Calculate budget utilization (placeholder - needs actual cost data)
  const projectsWithCost = data.filter((p) => p.totalCost && p.totalCost !== '--');
  const totalBudget = projectsWithCost.reduce((sum, p) => {
    const cost = typeof p.totalCost === 'string' ? parseFloat(p.totalCost.replace(/[^0-9.]/g, '')) : p.totalCost;
    return sum + (cost || 0);
  }, 0);

  return [
    { label: t('operations.projects.kpi.totalProjects'), value: total, icon: 'ph:kanban-bold', color: '#8b5cf6', trend: '+2%', trendType: 'up' },
    { label: t('operations.projects.kpi.activeProjects'), value: active, icon: 'ph:spinner-gap-bold', color: '#10b981' },
    { label: t('operations.projects.kpi.completed'), value: completed, icon: 'ph:check-square-offset-bold', color: '#3b82f6' },
    {
      label: t('operations.projects.kpi.avgDuration'),
      value: avgDuration > 0 ? `${avgDuration} ${t('operations.projects.days')}` : '--',
      icon: 'ph:clock-bold',
      color: '#f59e0b'
    },
    { label: t('operations.projects.kpi.onTimeDelivery'), value: `${onTimeDelivery}%`, icon: 'ph:check-circle-bold', color: '#22c55e' },
    {
      label: t('operations.projects.kpi.totalBudget'),
      value: totalBudget > 0 ? `SAR ${formatLargeNumber(totalBudget)}` : '--',
      icon: 'ph:currency-dollar-bold',
      color: '#7849ff'
    }
  ];
});

// mock data for integrate till api is ready
// const project = await getProjectDraft();
// table.data = [project].map(({ project, step }) => ({
//   ...project,
//   projectStartDate: getYear(project.startDate),
//   projectEndDate: getYear(project.endDate),
//   projectAssignedUsers: project.assignedUsers.length ? project.assignedUsers.map((user) => user.name).join(', ') : '-',
//   projectClient: project.client?.clientName || '-',
// }));

function handleRowClick(val: unknown) {
  router.push(`/operations/projects/${val.id}`);
}

const filterOptions = [
  {
    title: useI18n().t('operations.projects.filter.status'),
    value: 'status',
    options: getProjectStatuses()
  },
  {
    title: useI18n().t('operations.projects.filter.type'),
    value: 'category',
    options: getProjectCategories()
  },
  {
    title: useI18n().t('operations.projects.filter.startDate'),
    value: ['fromStartDate', 'toStartDate'],
    type: 'date'
  },
  {
    title: useI18n().t('operations.projects.filter.endDate'),
    value: ['fromEndDate', 'toEndDate'],
    type: 'date'
  }
];

// SavedViews & AdvancedSearch
const advancedSearchFields = [
  { key: 'name', label: t('operations.projects.table.projectName'), type: 'string' },
  { key: 'status', label: t('operations.projects.table.status'), type: 'select', options: getProjectStatuses() },
  { key: 'category', label: t('operations.projects.table.category'), type: 'select', options: getProjectCategories() },
  { key: 'startDate', label: t('operations.projects.filter.startDate'), type: 'date' },
  { key: 'endDate', label: t('operations.projects.filter.endDate'), type: 'date' },
  { key: 'totalCost', label: t('operations.projects.table.totalCost'), type: 'number' }
];

async function handleApplyView(view: unknown) {
  if (view?.filters) {
    const res = await useTableFilter('project', view.filters);
    table.data = res.formattedData;
  }
}

async function handleAdvancedFilter(filterPayload: unknown) {
  try {
    const res = await useApiFetch('search/advanced/project', 'POST', filterPayload);
    if (res?.success && res?.body) {
      const data = res.body as unknown;
      table.data = data.docs || data || [];
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}

async function handleClearAdvancedFilter() {
  const res = await useTableFilter('project');
  table.data = res.formattedData;
}

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileProjStatus = ref('ALL');
const mobileRefreshing = ref(false);
const loading = ref(false);

const mobileStatusFilters = computed(() => {
  const data = table.data || [];
  return [
    { value: 'ALL', label: t('common.all'), color: '#8b5cf6', count: data.length },
    { value: 'PROJECT_ACTIVE', label: 'Active', color: '#10b981', count: data.filter((p) => p.status === 'PROJECT_ACTIVE').length },
    { value: 'PROJECT_COMPLETE', label: 'Complete', color: '#3b82f6', count: data.filter((p) => p.status === 'PROJECT_COMPLETE').length },
    { value: 'PROJECT_ON_HOLD', label: 'On Hold', color: '#f59e0b', count: data.filter((p) => p.status === 'PROJECT_ON_HOLD').length },
    { value: 'PROJECT_CANCELLED', label: 'Cancelled', color: '#ef4444', count: data.filter((p) => p.status === 'PROJECT_CANCELLED').length }
  ];
});

const mobileFilteredData = computed(() => {
  let data = table.data || [];
  if (mobileProjStatus.value !== 'ALL') data = data.filter((p) => p.status === mobileProjStatus.value);
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.projectClient || '').toLowerCase().includes(q));
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    const res = await useTableFilter('project');
    table.data = res.formattedData;
    vibrate([10, 30, 10]);
  } finally {
    mobileRefreshing.value = false;
  }
}

function getProjLeftActions(_p: unknown) {
  const actions = [{ name: 'view', label: t('common.view'), icon: 'ph:eye-bold', color: '#8b5cf6' }];
  if (hasPermission('EDIT_PROJECTS')) actions.push({ name: 'edit', label: t('common.edit'), icon: 'ph:pencil-simple-bold', color: '#F59E0B' });
  return actions;
}

function handleProjSwipe(name: string, proj: unknown) {
  vibrate();
  if (name === 'view') navigateTo(`/operations/projects/${proj.id}`);
  if (name === 'edit') navigateTo(`/operations/projects/edit/${proj.id}`);
}

function getProjColor(status: string): string {
  const map: Record<string, string> = {
    PROJECT_ACTIVE: '#10b981',
    PROJECT_COMPLETE: '#3b82f6',
    PROJECT_ON_HOLD: '#f59e0b',
    PROJECT_CANCELLED: '#ef4444'
  };
  return map[status] || '#94a3b8';
}
function getProjTagType(status: string): string {
  const map: Record<string, string> = { PROJECT_ACTIVE: 'success', PROJECT_COMPLETE: '', PROJECT_ON_HOLD: 'warning', PROJECT_CANCELLED: 'danger' };
  return map[status] || 'info';
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('proj', #8b5cf6);
</style>
