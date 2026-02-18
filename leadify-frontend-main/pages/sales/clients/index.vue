<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('clients.title') }}
    .flex.items-center.gap-x-3
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'clients-export'" :title="$t('clients.title')")
      NuxtLink(to="/sales/clients/add-client")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_CLIENTS')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl")  {{ $t('clients.newClient') }}
      //- el-dropdown(trigger="click")
      //-     span.el-dropdown-link
      //-         button.rounded-btn(class="!px-4"): Icon(  name="IconToggle" size="24")
      //-     template(#dropdown)
      //-         el-dropdown-menu
      //-           el-dropdown-item
      //-             NuxtLink.flex.items-center(:to="`/clients/1`")
      //-               Icon.text-md.mr-2(size="20" name="IconImport" )
      //-               p.text-sm Import
      //-           NuxtLink(:to="`/clients/1`")
      //-             el-dropdown-item
      //-               NuxtLink.flex.items-center(:to="`/clients/1`")
      //-                 Icon.text-md.mr-2(size="20" name="IconExport" )
      //-                 p.text-sm Export
      //-           el-dropdown-item
      //-               NuxtLink.flex.items-center(:to="`/clients/1`")
      //-                 Icon.text-md.mr-2(size="20" name="IconArchived" )
      //-                 p.text-sm Archived
  BulkActions(:count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="handleBulkDelete" @bulk-export="handleBulkExport" @clear-selection="selectedRows = []")
  SavedViews(:entityType="'client'" :currentFilters="{}" @apply-view="handleApplyView")
  AdvancedSearch(:entityType="'client'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")
  AppTable(v-slot="{data}" :filterOptions="filterOptions" :columns="table.columns" position="client" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" searchPlaceholder="clients" )
    .flex.items-center.py-2(@click.stop)
        //- NuxtLink.toggle-icon(:to="`/clients/1`")
        //-     Icon.text-md(name="IconEye" )

        el-dropdown(class="outline-0" trigger="click")
            span(class="el-dropdown-link")
              .toggle-icon.text-md
                  Icon(name="IconToggle"  size="22")
            template(#dropdown='')
                el-dropdown-menu
                    el-dropdown-item
                      NuxtLink.flex.items-center(:to="`/sales/clients/${data?.id}`")
                        Icon.text-md.mr-2(name="IconEye" )
                        p.text-sm {{ $t('common.view') }}
                    el-dropdown-item(v-if="hasPermission('EDIT_CLIENTS')")
                      NuxtLink.flex.items-center(:to="`/sales/clients/edit/${data?.id}`")
                        Icon.text-md.mr-2(name="IconEdit" )
                        p.text-sm {{ $t('common.edit') }}
                    //- el-dropdown-item(@click="[deleteclientPopup=true, userActionId = data?.id]" )
                    //-     .flex.items-center
                    //-       Icon.text-md.mr-2(name="IconDelete" )
                    //-       p.text-sm Delete
  ActionModel(v-model="deleteClientPopup" :loading="loadingAction" btn-text="Move to Archive" description-one="Are you sure you want to delete this Client?" icon="/images/delete-image.png" description-two="It will be archived and can be restored later within 30 days." )
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Plus } from '@element-plus/icons-vue';
const router = useRouter();
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const deleteClientPopup = ref(false);
const { t } = useI18n();

// Export columns & data
const exportColumns = [
  { prop: 'ClientDetails', label: t('clients.table.clientName') },
  { prop: 'clientType', label: t('clients.table.type') },
  { prop: 'email', label: t('clients.table.email') },
  { prop: 'phoneNumber', label: t('clients.table.phone') },
  { prop: 'clientStatus', label: t('clients.table.status') },
  { prop: 'assign', label: t('clients.table.assigned') },
  { prop: 'createdAt', label: t('clients.table.created') }
];
const exportData = computed(() => table.data);

// Bulk actions
const selectedRows = ref<any[]>([]);
function handleBulkDelete() { selectedRows.value = []; }
function handleBulkExport() { selectedRows.value = []; }

const table = reactive({
  columns: [
    {
      prop: 'ClientDetails',
      label: t('clients.table.clientName'),
      component: 'AvatarText',
      sortable: true,
      type: 'font-bold',
      width: 170
    },
    {
      prop: 'clientType',
      label: t('clients.table.type'),
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 150
    },
    {
      prop: 'email',
      label: t('clients.table.email'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 200
    },
    {
      prop: 'phoneNumber',
      label: t('clients.table.phone'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 200
    },
    {
      prop: 'clientStatus',
      label: t('clients.table.status'),
      component: 'Label',
      sortable: true,
      type: 'outline',
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Inactive', value: 'INACTIVE' }
      ],
      width: 150
    },
    {
      prop: 'assign',
      label: t('clients.table.assigned'),
      component: 'Text',
      type: 'font-default',
      width: 200
    },
    {
      prop: 'createdAt',
      label: t('clients.table.created'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 200
    }
    // { prop: 'actions', label: 'Actions', sortable: false },
  ],
  data: [] as Client[],
  sort: [
    { prop: 'price', order: 'ascending', value: 'PRICE_ASC' },
    { prop: 'price', order: 'descending', value: 'PRICE_DESC' },
    { prop: 'identity', order: 'ascending', value: 'IDENTITY_ASC' },
    { prop: 'identity', order: 'descending', value: 'IDENTITY_DESC' }
  ]
});

// Call API to Get the client and users in parallel
const [response, usersResponse] = await Promise.all([
  useTableFilter('client'),
  useApiFetch('users')
]);
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/sales/clients/${val.id}`);
}

const mappedUsers = usersResponse?.body?.docs?.map((e: any) => ({
  label: e.name,
  value: e.id
}));

const filterOptions = [
  {
    title: t('clients.filter.status'),
    value: 'status',
    options: [...clientStatuses]
  },
  {
    title: t('clients.filter.type'),
    value: 'type',
    options: [...clientTypes]
  },
  {
    title: t('clients.filter.assigned'),
    value: 'userId',
    options: [...mappedUsers]
  }
];

// SavedViews & AdvancedSearch
const advancedSearchFields = [
  { key: 'name', label: t('clients.table.clientName'), type: 'string' },
  { key: 'email', label: t('clients.table.email'), type: 'string' },
  { key: 'phoneNumber', label: t('clients.table.phone'), type: 'string' },
  { key: 'clientType', label: t('clients.table.type'), type: 'select', options: clientTypes.map((s: any) => ({ value: s.value, label: s.label })) },
  { key: 'status', label: t('clients.table.status'), type: 'select', options: clientStatuses.map((s: any) => ({ value: s.value, label: s.label })) },
  { key: 'createdAt', label: t('clients.table.created'), type: 'date' }
];

async function handleApplyView(view: any) {
  if (view?.filters) {
    const res = await useTableFilter('client', view.filters);
    table.data = res.formattedData;
  }
}

async function handleAdvancedFilter(filterPayload: any) {
  try {
    const res = await useApiFetch('search/advanced/client', 'POST', filterPayload);
    if (res?.success && res?.body) {
      const data = res.body as any;
      table.data = data.docs || data || [];
    }
  } catch {}
}

async function handleClearAdvancedFilter() {
  const res = await useTableFilter('client');
  table.data = res.formattedData;
}
</script>
