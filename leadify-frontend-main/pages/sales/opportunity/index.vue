<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('opportunities.title') }}
    .flex.items-center.gap-x-3
      el-button-group
        el-button(type="primary" size="large" class="!rounded-l-2xl")
          Icon(name="ph:list-bold" size="18")
          span.ml-1 {{ $t('kanban.tableView') }}
        el-button(:type="'default'" size="large" @click="navigateTo('/sales/opportunity/kanban')" class="!rounded-r-2xl")
          Icon(name="ph:columns-bold" size="18")
          span.ml-1 {{ $t('kanban.kanbanView') }}
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'opportunities-export'" :title="$t('opportunities.title')")
      NuxtLink(to="/sales/opportunity/add-opportunity")
        el-button(size='large' :loading="loading" v-if="hasPermission('CREATE_OPPORTUNITIES')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl") {{ $t('opportunities.newOpp') }}
      //- el-dropdown(trigger="click")
      //-     span.el-dropdown-link
      //-         button.rounded-btn(class="!px-4"): Icon(  name="IconToggle" size="24")
      //-     template(#dropdown)
      //-         el-dropdown-menu
      //-           el-dropdown-item
      //-             NuxtLink.flex.items-center(:to="`/opportunity/1`")
      //-               Icon.text-md.mr-2(size="20" name="IconImport" )
      //-               p.text-sm Import
      //-           NuxtLink(:to="`/opportunity/1`")
      //-             el-dropdown-item
      //-               NuxtLink.flex.items-center(:to="`/opportunity/1`")
      //-                 Icon.text-md.mr-2(size="20" name="IconExport" )
      //-                 p.text-sm Export
      //-           el-dropdown-item
      //-               NuxtLink.flex.items-center(:to="`/opportunity/1`")
      //-                 Icon.text-md.mr-2(size="20" name="IconArchived" )
      //-                 p.text-sm Archived
  BulkActions(:count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="handleBulkDelete" @bulk-export="handleBulkExport" @clear-selection="selectedRows = []")
  SavedViews(:entityType="'opportunity'" :currentFilters="{}" @apply-view="handleApplyView")
  AdvancedSearch(:entityType="'opportunity'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")

  //- Desktop Table
  .opp-desktop-view
    AppTable(v-slot="{data}" v-if="!loadingAction" :filterOptions="filterOptions" :columns="table.columns" position="opportunity" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('opportunities.title')" emptyIcon="ph:target-bold" emptyMessage="No opportunities yet" emptyDescription="Create an opportunity to track your sales pipeline" emptyActionHref="/sales/opportunity/create" emptyActionLabel="Create Opportunity" )
      .flex.items-center.py-2(@click.stop)
          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md
                    Icon(name="IconToggle"  size="22")
              template(#dropdown='')
                  el-dropdown-menu
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/sales/opportunity/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item( v-if="hasPermission('EDIT_OPPORTUNITIES')")
                        NuxtLink.flex.items-center(:to="`/sales/opportunity/edit/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}

  //- Mobile Card View
  .opp-mobile-view(v-if="!loadingAction")
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('opportunities.title')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
        button.status-pill(
          v-for="filter in mobileStageFilters"
          :key="filter.value"
          :class="{ 'status-pill--active': mobileStageFilter === filter.value }"
          :style="mobileStageFilter === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="mobileStageFilter = filter.value; vibrate()"
        )
          span {{ filter.label }}
          span.status-pill__count(v-if="filter.count > 0") {{ filter.count }}

      .space-y-3(v-if="mobileFilteredData.length")
        SwipeCard(
          v-for="opp in mobileFilteredData"
          :key="opp.id"
          :rightActions="[{ name: 'kanban', label: $t('kanban.kanbanView'), icon: 'ph:columns-bold', color: '#10B981' }]"
          :leftActions="getMobileLeftActions(opp)"
          @action="(name) => handleMobileSwipe(name, opp)"
        )
          .entity-card.p-4(@click="handleRowClick(opp)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: getOppColor(opp.stage) + '20', color: getOppColor(opp.stage) }"
                ) {{ (opp.name || '?').charAt(0).toUpperCase() }}
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ opp.name || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ opp.assign || '' }}
              el-tag.shrink-0(:type="getOppTagType(opp.stage)" size="small" effect="dark" round) {{ opp.stage }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="opp.estimatedValue")
                Icon(name="ph:money" size="14" style="color: var(--text-muted)")
                span.text-xs.font-semibold.truncate(style="color: var(--text-secondary)") {{ opp.estimatedValue }}
              .flex.items-center.gap-2(v-if="opp.priority")
                Icon(name="ph:flag" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ opp.priority }}
              .flex.items-center.gap-2(v-if="opp.expectedCloseDate")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ opp.expectedCloseDate }}
              .flex.items-center.gap-2(v-if="opp.profit")
                Icon(name="ph:chart-line-up" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ opp.profit }}

      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:target" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('opportunities.title').toLowerCase() }}

    .mobile-fab(v-if="hasPermission('CREATE_OPPORTUNITIES')" @click="navigateTo('/sales/opportunity/add-opportunity')")
      Icon(name="ph:plus-bold" size="24")

  ActionModel(v-model="deleteLeadPopup" :loading="loadingAction" :btn-text="$t('opportunities.archiveTitle')" :description-one="$t('opportunities.deleteDesc1')" icon="/images/delete-image.png" :description-two="$t('opportunities.deleteDesc2')" )
  ActionModel(v-model="wonPopup" :loading="loadingAction" :btn-text="$t('common.save')" :description="$t('opportunities.wonDesc')" @confirm = " editPresent" )
   template(#input)
    InputSelect(v-if="select?.status === 'WON' " :label="$t('opportunities.present')" @change ="setPresent" :options="opportunityPresent"  )
    InputSelect( v-if="select?.status === 'LOST' " :label="$t('opportunities.reasonLoss')" @change ="setReasons" :options="reasonOptions" )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { stageOptions, priorityOptions } from '@/composables/useOpportunity';
import useTableFilter from '@/composables/useTableFilter';
const router = useRouter();

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const deleteLeadPopup = ref(false);

// Export columns & data
const exportColumns = [
  { prop: 'name', label: t('opportunities.table.name') },
  { prop: 'stage', label: t('opportunities.table.stage') },
  { prop: 'estimatedValue', label: t('opportunities.table.budget') },
  { prop: 'profit', label: t('opportunities.table.profit') },
  { prop: 'expectedCloseDate', label: t('opportunities.table.closeDate') },
  { prop: 'priority', label: t('opportunities.table.priority') },
  { prop: 'assign', label: t('opportunities.table.assigned') },
  { prop: 'createdAt', label: t('opportunities.table.created') }
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

const present = ref('');
const reasons = ref('');
const select = ref();
const wonPopup = ref(false);

// Using computed for reactivity if language changes
const opportunityPresent = computed(() => [
  {
    label: t('opportunities.convertDeal'),
    value: 'deal'
  },
  {
    label: t('opportunities.convertProject'),
    value: 'project'
  },
  {
    label: t('common.cancel'),
    value: 'now'
  }
]);

async function setPresent(pre: any) {
  present.value = pre.value;
}
async function setReasons(pre: any) {
  reasons.value = pre.value;
}

async function changeStage(id: any, newStage: any) {
  const opportunity: any = await getOpportunity(id);
  loadingAction.value = true;
  try {
    await updateOpportunity({ stage: newStage }, id);
  } catch {
  } finally {
    const response = await useTableFilter('opportunity');
    table.data = response.formattedData;
    loadingAction.value = false;
  }
}

async function editWithResone() {
  const opportunity: any = await getOpportunity(select.value?.id);
  loadingAction.value = true;
  try {
    await updateOpportunity({ stage: select.value?.status, reasonOfLose: reasons.value }, select.value?.id);
  } catch {
  } finally {
    const response = await useTableFilter('opportunity');
    table.data = response.formattedData;
    loadingAction.value = false;
  }
}

async function submitForm(values: any) {
  try {
    if (values?.status === 'WON' || values?.status === 'LOST') {
      wonPopup.value = true;
      select.value = values;
    }
    if (values?.status !== 'WON' && values?.status !== 'LOST') changeStage(values?.id, values?.status);
  } catch {}
}

async function editPresent() {
  if (select?.value?.status === 'LOST') {
    await editWithResone();
  } else {
    await changeStage(select.value?.id, select.value?.status);
    if (present.value === 'project') router.push(`/operations/projects/add-project?opportunityId=${select.value?.id}&leadId=${select.value?.leadId}`);
    if (present.value === 'deal') router.push(`/sales/deals/add-deal?opportunityId=${select.value?.id}&leadId=${select.value?.leadId}`);
  }
  wonPopup.value = false;
  present.value = '';
  reasons.value = '';
  select.value = {};
}

const table = reactive({
  columns: [
    {
      prop: 'name',
      label: t('opportunities.table.name'),
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 200
    },
    {
      prop: 'stage',
      label: t('opportunities.table.stage'),
      component: 'Label',
      sortable: true,
      type: 'select',
      filters: stageOptions.map(stage => ({ text: t(stage.label), value: stage.value, actions: submitForm })),
      width: 150
    },

    {
      prop: 'estimatedValue',
      label: t('opportunities.table.budget'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'profit',
      label: t('opportunities.table.profit'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'expectedCloseDate',
      label: t('opportunities.table.closeDate'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 200
    },
    {
      prop: 'priority',
      label: t('opportunities.table.priority'),
      component: 'Label',
      sortable: true,
      type: 'solid',
      filters: priorityOptions.map(priority => ({ text: t(priority.label), value: priority.value })),
      width: 150
    },
    {
      prop: 'assign',
      label: t('opportunities.table.assigned'),
      component: 'Text',
      type: 'font-default',
      width: 200
    },
    {
      prop: 'createdAt',
      label: t('opportunities.table.created'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    }
    // { prop: 'actions', label: 'Actions', sortable: false },
  ],
  data: [] as Opportunities[]
});

// Call API to Get the opportunity and users in parallel
const [response, usersResponse] = await Promise.all([useTableFilter('opportunity'), useApiFetch('users')]);
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/sales/opportunity/${val.id}`);
}

const mappedUsers = usersResponse?.body?.docs?.map((e: any) => ({
  label: e.name,
  value: e.id
}));

const filterOptions = [
  {
    title: t('opportunities.filter.stage'),
    value: 'stage',
    options: [...stageOptions.map(o => ({ ...o, label: t(o.label) }))]
  },
  {
    title: t('opportunities.table.assigned'),
    value: 'userId',
    options: [...mappedUsers]
  },
  {
    title: t('opportunities.table.priority'),
    value: 'priority',
    options: [...priorityOptions.map(o => ({ ...o, label: t(o.label) }))]
  },
  {
    title: t('opportunities.filter.closeDate'),
    value: ['fromExpectedCloseDate', 'toExpectedCloseDate'],
    type: 'date'
  },
  {
    title: t('opportunities.filter.budget'),
    value: ['fromEstimatedValue', 'toEstimatedValue'],
    type: 'input'
  },
  {
    title: t('opportunities.filter.profit'),
    value: ['fromProfit', 'toProfit'],
    type: 'input'
  }
];

// SavedViews & AdvancedSearch
const advancedSearchFields = [
  { key: 'name', label: t('opportunities.table.oppName'), type: 'string' },
  { key: 'stage', label: t('opportunities.table.stage'), type: 'select', options: stageOptions.map(o => ({ value: o.value, label: t(o.label) })) },
  { key: 'estimatedValue', label: t('opportunities.table.budget'), type: 'number' },
  {
    key: 'priority',
    label: t('opportunities.table.priority'),
    type: 'select',
    options: priorityOptions.map(o => ({ value: o.value, label: t(o.label) }))
  },
  { key: 'expectedCloseDate', label: t('opportunities.table.closeDate'), type: 'date' },
  { key: 'createdAt', label: t('opportunities.table.created'), type: 'date' }
];

async function handleApplyView(view: any) {
  if (view?.filters) {
    const res = await useTableFilter('opportunity', view.filters);
    table.data = res.formattedData;
  }
}

async function handleAdvancedFilter(filterPayload: any) {
  try {
    const res = await useApiFetch('search/advanced/opportunity', 'POST', filterPayload);
    if (res?.success && res?.body) {
      const data = res.body as any;
      table.data = data.docs || data || [];
    }
  } catch {}
}

async function handleClearAdvancedFilter() {
  const res = await useTableFilter('opportunity');
  table.data = res.formattedData;
}

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileStageFilter = ref('ALL');
const mobileRefreshing = ref(false);
const loading = ref(false);

const mobileStageFilters = computed(() => {
  const data = table.data || [];
  return [
    { value: 'ALL', label: t('common.all'), color: '#f59e0b', count: data.length },
    { value: 'DISCOVERY', label: 'Discovery', color: '#3b82f6', count: data.filter((o: any) => o.stage === 'DISCOVERY').length },
    { value: 'PROPOSAL', label: 'Proposal', color: '#8b5cf6', count: data.filter((o: any) => o.stage === 'PROPOSAL').length },
    { value: 'NEGOTIATION', label: 'Negotiation', color: '#f59e0b', count: data.filter((o: any) => o.stage === 'NEGOTIATION').length },
    { value: 'WON', label: 'Won', color: '#10b981', count: data.filter((o: any) => o.stage === 'WON').length },
    { value: 'LOST', label: 'Lost', color: '#ef4444', count: data.filter((o: any) => o.stage === 'LOST').length }
  ];
});

const mobileFilteredData = computed(() => {
  let data = table.data || [];
  if (mobileStageFilter.value !== 'ALL') data = data.filter((o: any) => o.stage === mobileStageFilter.value);
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((o: any) => {
    const name = (o.name || '').toLowerCase();
    const assign = (o.assign || '').toLowerCase();
    return name.includes(q) || assign.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    const res = await useTableFilter('opportunity');
    table.data = res.formattedData;
    vibrate([10, 30, 10]);
  } finally { mobileRefreshing.value = false; }
}

function getMobileLeftActions(_opp: any) {
  const actions = [{ name: 'view', label: t('common.view'), icon: 'ph:eye-bold', color: '#f59e0b' }];
  if (hasPermission('EDIT_OPPORTUNITIES')) actions.push({ name: 'edit', label: t('common.edit'), icon: 'ph:pencil-simple-bold', color: '#F59E0B' });
  return actions;
}

function handleMobileSwipe(name: string, opp: any) {
  vibrate();
  switch (name) {
    case 'kanban': navigateTo('/sales/opportunity/kanban'); break;
    case 'view': navigateTo(`/sales/opportunity/${opp.id}`); break;
    case 'edit': navigateTo(`/sales/opportunity/edit/${opp.id}`); break;
  }
}

function getOppColor(stage: string): string {
  const map: Record<string, string> = { DISCOVERY: '#3b82f6', PROPOSAL: '#8b5cf6', NEGOTIATION: '#f59e0b', WON: '#10b981', LOST: '#ef4444' };
  return map[stage] || '#94a3b8';
}

function getOppTagType(stage: string): string {
  const map: Record<string, string> = { DISCOVERY: '', PROPOSAL: 'primary', NEGOTIATION: 'warning', WON: 'success', LOST: 'danger' };
  return map[stage] || 'info';
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('opp', #f59e0b);
</style>
