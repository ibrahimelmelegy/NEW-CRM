<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('deals.title') }}
    .flex.items-center.gap-x-3
      el-button-group
        el-button(type="primary" size="large" class="!rounded-l-2xl")
          Icon(name="ph:list-bold" size="18")
          span.ml-1 {{ $t('kanban.tableView') }}
        el-button(:type="'default'" size="large" @click="navigateTo('/sales/deals/kanban')" class="!rounded-r-2xl")
          Icon(name="ph:columns-bold" size="18")
          span.ml-1 {{ $t('kanban.kanbanView') }}
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'deals-export'" :title="$t('deals.title')")
      NuxtLink(to="/sales/deals/add-deal")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_DEALS')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl")  {{ $t('deals.newDeal') }}
      //- el-dropdown(trigger="click")
      //-     span.el-dropdown-link
      //-         button.rounded-btn(class="!px-4"): Icon(  name="IconToggle" size="24")
      //-     template(#dropdown)
      //-         el-dropdown-menu
      //-           el-dropdown-item
      //-             NuxtLink.flex.items-center(:to="`/deals/1`")
      //-               Icon.text-md.mr-2(size="20" name="IconImport" )
      //-               p.text-sm Import
      //-           NuxtLink(:to="`/deals/1`")
      //-             el-dropdown-item
      //-               NuxtLink.flex.items-center(:to="`/deals/1`")
      //-                 Icon.text-md.mr-2(size="20" name="IconExport" )
      //-                 p.text-sm Export
      //-           el-dropdown-item
      //-               NuxtLink.flex.items-center(:to="`/deals/1`")
      //-                 Icon.text-md.mr-2(size="20" name="IconArchived" )
      //-                 p.text-sm Archived
  BulkActions(:count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="handleBulkDelete" @bulk-export="handleBulkExport" @clear-selection="selectedRows = []")
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
function handleBulkDelete() { selectedRows.value = []; }
function handleBulkExport() { selectedRows.value = []; }

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
const [response, usersResponse] = await Promise.all([
  useTableFilter('deal'),
  useApiFetch('users')
]);
table.data = response.formattedData;

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
</script>
