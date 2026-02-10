<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-10
    .header-content
      .title.font-bold.text-3xl.mb-2.text-gradient {{ $t('deals.title') }}
      .subtitle.text-muted.text-sm.tracking-wide Track and manage your deals pipeline
    .flex.items-center.gap-x-3
      NuxtLink(to="/sales/deals/add-deal")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_DEALS')" native-type="submit" type="primary" :icon="Plus" class="premium-btn !rounded-2xl px-8 glow-purple glass-button-press")  {{ $t('deals.newDeal') }}
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
  .glass-card.p-4(class="!rounded-3xl")
    AppTable(v-slot="{data}" :filterOptions="filterOptions" :columns="table.columns" position="deal" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('deals.title')" class="premium-table")
      .flex.items-center.py-2(@click.stop)
          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md.hover-scale
                    Icon(name="ph:dots-three-outline-vertical-fill" size="20" class="text-purple-400")
              template(#dropdown='')
                  el-dropdown-menu(class="glass-dropdown")
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

// Call API to Get the deal
// const response = await getLeads();

const response = await useTableFilter('deal');
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/sales/deals/${val.id}`);
}

const users = await useApiFetch('users');
const mappedUsers = users?.body?.docs?.map((e: any) => ({
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
