<template lang="pug">
div(class="animate-fade-in")
  //- Premium Header
  PremiumPageHeader(
    :title="$t('deals.title')"
    description="Track your entire sales pipeline and convert opportunities into revenue."
    icon="ph:handshake-duotone"
    primaryColor="#10b981"
  )
    template(#actions)
      el-button-group
        el-button(type="primary" size="large" class="!rounded-l-xl shadow-lg shadow-primary/30")
          Icon(name="ph:list-bold" size="18")
          span.ml-1 {{ $t('kanban.tableView') }}
        el-button(:type="'default'" size="large" @click="navigateTo('/sales/deals/kanban')" class="!rounded-r-xl")
          Icon(name="ph:columns-bold" size="18")
          span.ml-1 {{ $t('kanban.kanbanView') }}
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'deals-export'" :title="$t('deals.title')")
      NuxtLink(to="/sales/deals/add-deal")
        el-button(size='large' :loading="loading" v-if="hasPermission('CREATE_DEALS')" native-type="submit" type="primary" :icon="Plus" class="!rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform") {{ $t('deals.newDeal') }}

  //- KPI Metrics
  PremiumKPICards(:metrics="kpiMetrics" v-if="!loadingAction")
  
  BulkActions(:count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="handleBulkDelete" @bulk-export="handleBulkExport" @clear-selection="selectedRows = []")
  SavedViews(:entityType="'deal'" :currentFilters="{}" @apply-view="handleApplyView")
  AdvancedSearch(:entityType="'deal'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")
  AppTable(v-slot="{data}" :filterOptions="filterOptions" :columns="table.columns" position="deal" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('deals.title')" )
    .flex.items-center.py-2(@click.stop)
        //- NuxtLink.toggle-icon(:to="`/deals/1`")
        //-     Icon.text-md(name="IconEye" )

        el-dropdown(class="outline-0" trigger="click")
            span(class="el-dropdown-link")
              .toggle-icon.text-md
                  Icon(name="IconToggle"  size="22")
            template(#dropdown='')
                el-dropdown-menu
                    el-dropdown-item
                      NuxtLink.flex.items-center(:to="`/sales/deals/${data?.id}`")
                        Icon.text-md.mr-2(name="IconEye" )
                        p.text-sm {{ $t('common.view') }}
                    el-dropdown-item(v-if="hasPermission('EDIT_DEALS')")
                      NuxtLink.flex.items-center(:to="`/sales/deals/edit/${data?.id}`")
                        Icon.text-md.mr-2(name="IconEdit" )
                        p.text-sm {{ $t('common.edit') }}
                    //- el-dropdown-item(@click="[deleteLeadPopup=true, userActionId = data?.id]" )
                    //-     .flex.items-center
                    //-       Icon.text-md.mr-2(name="IconDelete" )
                    //-       p.text-sm {{ $t('common.delete') }}
  ActionModel(v-model="deleteLeadPopup" :loading="loadingAction" btn-text="Move to Archive" description-one="Are you sure you want to delete this Deal?" icon="/images/delete-image.png" description-two="It will be archived and can be restored later within 30 days." )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { computed, reactive, ref } from 'vue';
import PremiumPageHeader from '~/components/UI/PremiumPageHeader.vue';
import PremiumKPICards from '~/components/UI/PremiumKPICards.vue';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';

const router = useRouter();
const { hasPermission } = await usePermissions();
const { $i18n } = useNuxtApp();
const t = $i18n.t;
const loadingAction = ref(false);
const deleteLeadPopup = ref(false);

// Export columns & data
const exportColumns = [
  { prop: 'dealDetails', label: t('deals.table.name') },
  { prop: 'stage', label: t('deals.table.stage') },
  { prop: 'price', label: t('deals.table.price') },
  { prop: 'assign', label: t('deals.table.assigned') },
  { prop: 'contractType', label: t('deals.table.contractType') },
  { prop: 'signatureDate', label: t('deals.table.signatureDate') }
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
      prop: 'dealDetails',
      label: t('deals.table.name'),
      component: 'AvatarText',
      sortable: true,
      type: 'font-bold',
      width: 170
    },
    {
      prop: 'stage',
      label: t('deals.table.stage'),
      component: 'Label',
      sortable: true,
      type: 'outline',
      filters: dealStageOptions.map(stage => ({ text: stage.label, value: stage.value })),
      width: 150
    },
    {
      prop: 'price',
      label: t('deals.table.price'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'assign',
      label: t('deals.table.assigned'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 200
    },
    {
      prop: 'contractType',
      label: t('deals.table.contractType'),
      component: 'Label',
      sortable: true,
      type: 'solid',
      width: 150
    },
    {
      prop: 'signatureDate',
      label: t('deals.table.signatureDate'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    }
  ],
  data: [] as Deal[]
});

// Call API to Get the deal and users in parallel
const [response, usersResponse] = await Promise.all([useTableFilter('deal'), useApiFetch('users')]);
table.data = response.formattedData;

const kpiMetrics = computed<KPIMetric[]>(() => {
  const data = table.data || [];
  const total = data.length;
  const wonDeals = data.filter((d: any) => d.stage === 'WON').length;
  // Calculate total revenue from won deals
  const totalRevenue = data
    .filter((d: any) => d.stage === 'WON')
    .reduce((sum: number, d: any) => sum + (Number(d.price) || 0), 0)
    .toLocaleString('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });
  const pending = data.filter((d: any) => d.stage !== 'WON' && d.stage !== 'LOST').length;

  return [
    { label: 'Total Deals', value: total, icon: 'ph:handshake-bold', color: '#10b981', trend: '+8%', trendType: 'up' },
    { label: 'Deals Won', value: wonDeals, icon: 'ph:trophy-bold', color: '#f59e0b', trend: 'Trending', trendType: 'up' },
    { label: 'Total Revenue', value: totalRevenue, icon: 'ph:money-bold', color: '#3b82f6', trend: '+15%', trendType: 'up' },
    { label: 'Pending Deals', value: pending, icon: 'ph:hourglass-bold', color: '#8b5cf6' }
  ];
});

function handleRowClick(val: any) {
  router.push(`/sales/deals/${val.id}`);
}

const mappedUsers = usersResponse?.body?.docs?.map((e: any) => ({
  label: e.name,
  value: e.id
}));

const filterOptions = computed(() => [
  {
    title: t('deals.table.stage'),
    value: 'stage',
    options: [...dealStageOptions]
  },
  {
    title: t('deals.table.assigned'),
    value: 'userId',
    options: [...mappedUsers]
  },
  {
    title: t('deals.table.contractType'),
    value: 'contractType',
    options: [...contractTypeOptions]
  },
  {
    title: t('deals.info.signatureDate'),
    value: ['fromDate', 'toDate'],
    type: 'date'
  },
  {
    title: t('deals.table.price'),
    value: ['fromPrice', 'toPrice'],
    type: 'input'
  }
]);

// SavedViews & AdvancedSearch
const advancedSearchFields = [
  { key: 'name', label: t('deals.table.dealName'), type: 'string' },
  { key: 'stage', label: t('deals.table.stage'), type: 'select', options: dealStageOptions.map((o: any) => ({ value: o.value, label: o.label })) },
  { key: 'price', label: t('deals.table.price'), type: 'number' },
  {
    key: 'contractType',
    label: t('deals.table.contractType'),
    type: 'select',
    options: contractTypeOptions.map((o: any) => ({ value: o.value, label: o.label }))
  },
  { key: 'signatureDate', label: t('deals.table.signatureDate'), type: 'date' },
  { key: 'createdAt', label: t('deals.table.created'), type: 'date' }
];

async function handleApplyView(view: any) {
  if (view?.filters) {
    const res = await useTableFilter('deal', view.filters);
    table.data = res.formattedData;
  }
}

async function handleAdvancedFilter(filterPayload: any) {
  try {
    const res = await useApiFetch('search/advanced/deal', 'POST', filterPayload);
    if (res?.success && res?.body) {
      const data = res.body as any;
      table.data = data.docs || data || [];
    }
  } catch {}
}

async function handleClearAdvancedFilter() {
  const res = await useTableFilter('deal');
  table.data = res.formattedData;
}
</script>
