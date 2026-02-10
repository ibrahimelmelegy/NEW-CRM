<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-10
    .header-content
      .title.font-bold.text-3xl.mb-2.text-gradient {{ $t('clients.title') }}
      .subtitle.text-muted.text-sm.tracking-wide Manage your client relationships
    .flex.items-center.gap-x-3
      NuxtLink(to="/sales/clients/add-client")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_CLIENTS')" native-type="submit" type="primary" :icon="Plus" class="premium-btn !rounded-2xl px-8 glow-purple glass-button-press")  {{ $t('clients.newClient') }}
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
  .glass-card.p-4(class="!rounded-3xl")
    AppTable(v-slot="{data}" :filterOptions="filterOptions" :columns="table.columns" position="client" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" searchPlaceholder="clients" class="premium-table")
      .flex.items-center.py-2(@click.stop)
          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md.hover-scale
                    Icon(name="ph:dots-three-outline-vertical-fill" size="20" class="text-purple-400")
              template(#dropdown='')
                  el-dropdown-menu(class="glass-dropdown")
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

// Call API to Get the client
// const response = await getClients();

const response = await useTableFilter('client');
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/sales/clients/${val.id}`);
}

const users = await useApiFetch('users');
const mappedUsers = users?.body?.docs?.map((e: any) => ({
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
</script>
