<template lang="pug">
.p-6.animate-entrance
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
        el-button(size='large' :loading="loading" v-if="hasPermission('CREATE_PROJECTS')" native-type="submit" type="primary" :icon="Plus" class="premium-btn !rounded-2xl px-8 glow-purple glass-button-press") {{ $t('operations.projects.newProject') }}

  //- KPI Metrics
  PremiumKPICards(:metrics="kpiMetrics" v-if="!loadingAction")

  BulkActions(:count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="handleBulkDelete" @bulk-export="handleBulkExport" @clear-selection="selectedRows = []")
  SavedViews(:entityType="'project'" :currentFilters="{}" @apply-view="handleApplyView")
  AdvancedSearch(:entityType="'project'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")
  .glass-card.p-4(class="!rounded-3xl")
    AppTable(v-slot="{data}" :filterOptions="filterOptions" :columns="table.columns" position="project" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('operations.projects.title')" class="premium-table")
      .flex.items-center.py-2(@click.stop)
          //- NuxtLink.toggle-icon(:to="`/leads/1`")
          //-     Icon.text-md(name="IconEye" )

          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md.hover-scale
                    Icon(name="ph:dots-three-outline-vertical-fill" size="20" class="text-purple-400")
              template(#dropdown='')
                  el-dropdown-menu(class="glass-dropdown")
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/projects/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item(v-if="hasPermission('EDIT_PROJECTS')")
                        NuxtLink.flex.items-center(:to="`/operations/projects/edit/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}
                      //- el-dropdown-item(@click="[deleteLeadPopup=true, userActionId = data?.id]" )
                      //-     .flex.items-center
                      //-       Icon.text-md.mr-2(name="IconDelete" )
                      //-       p.text-sm Delete
  ActionModel(v-model="deleteLeadPopup" :loading="loadingAction" :btn-text="$t('common.moveToArchive')" :description-one="$t('common.archiveConfirmation')" icon="/images/delete-image.png" :description-two="$t('common.archiveDescription')" )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { computed, reactive, ref } from 'vue';
import PremiumPageHeader from '~/components/UI/PremiumPageHeader.vue';
import PremiumKPICards from '~/components/UI/PremiumKPICards.vue';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';

const router = useRouter();
const { t } = useI18n();
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const deleteLeadPopup = ref(false);

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
const selectedRows = ref<any[]>([]);
function handleBulkDelete() {
  selectedRows.value = [];
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
  const active = data.filter((p: any) => p.status === 'PROJECT_ACTIVE').length;
  const completed = data.filter((p: any) => p.status === 'PROJECT_COMPLETE').length;

  return [
    { label: 'Total Projects', value: total, icon: 'ph:kanban-bold', color: '#8b5cf6', trend: '+2%', trendType: 'up' },
    { label: 'Active Projects', value: active, icon: 'ph:spinner-gap-bold', color: '#10b981' },
    { label: 'Completed', value: completed, icon: 'ph:check-square-offset-bold', color: '#3b82f6' },
    { label: 'Avg Duration', value: '45 Days', icon: 'ph:clock-bold', color: '#f59e0b' }
  ];
});

// mock data for integrate till api is ready
// const project = await getProjectDraft();
// table.data = [project].map(({ project, step }) => ({
//   ...project,
//   projectStartDate: getYear(project.startDate),
//   projectEndDate: getYear(project.endDate),
//   projectAssignedUsers: project.assignedUsers.length ? project.assignedUsers.map((user: any) => user.name).join(', ') : '-',
//   projectClient: project.client?.clientName || '-',
// }));

function handleRowClick(val: any) {
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

async function handleApplyView(view: any) {
  if (view?.filters) {
    const res = await useTableFilter('project', view.filters);
    table.data = res.formattedData;
  }
}

async function handleAdvancedFilter(filterPayload: any) {
  try {
    const res = await useApiFetch('search/advanced/project', 'POST', filterPayload);
    if (res?.success && res?.body) {
      const data = res.body as any;
      table.data = data.docs || data || [];
    }
  } catch {}
}

async function handleClearAdvancedFilter() {
  const res = await useTableFilter('project');
  table.data = res.formattedData;
}
</script>
