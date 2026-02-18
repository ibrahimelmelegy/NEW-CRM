<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('navigation.vehicle') }}
    .flex.items-center.gap-x-3
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'vehicles-export'" :title="$t('navigation.vehicle')")
      NuxtLink(to="/operations/vehicle/add-vehicle")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_VEHICLES')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl")  {{ $t('operations.vehicles.new') }}
      //- el-dropdown(trigger="click")
      //-     span.el-dropdown-link
      //-         button.rounded-btn(class="!px-4"): Icon(  name="IconToggle" size="24")
      //-     template(#dropdown)
      //-         el-dropdown-menu
      //-           el-dropdown-item
      //-             NuxtLink.flex.items-center(:to="`/leads/1`")
      //-               Icon.text-md.mr-2(size="20" name="IconImport" )
      //-               p.text-sm Import
      //-           NuxtLink(:to="`/leads/1`")
      //-             el-dropdown-item
      //-               NuxtLink.flex.items-center(:to="`/leads/1`")
      //-                 Icon.text-md.mr-2(size="20" name="IconExport" )
      //-                 p.text-sm Export
      //-           el-dropdown-item
      //-               NuxtLink.flex.items-center(:to="`/leads/1`")
      //-                 Icon.text-md.mr-2(size="20" name="IconArchived" )
      //-                 p.text-sm Archived
  AppTable(v-slot="{data}" :columns="table.columns" :filterOptions="filterOptions" position="vehicle" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('navigation.vehicle')" )
    .flex.items-center.py-2(@click.stop)
        //- NuxtLink.toggle-icon(:to="`/leads/1`")
        //-     Icon.text-md(name="IconEye" )

        el-dropdown(class="outline-0" trigger="click")
            span(class="el-dropdown-link")
              .toggle-icon.text-md
                  Icon(name="IconToggle"  size="22")
            template(#dropdown='')
                el-dropdown-menu
                    el-dropdown-item
                      NuxtLink.flex.items-center(:to="`/operations/vehicle/${data?.id}`")
                        Icon.text-md.mr-2(name="IconEye" )
                        p.text-sm {{ $t('common.view') }}
                    el-dropdown-item(v-if="hasPermission('EDIT_VEHICLES')")
                      NuxtLink.flex.items-center(:to="`/operations/vehicle/edit/${data?.id}`")
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
const router = useRouter();
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const deleteLeadPopup = ref(false);

// Export columns
const exportColumns = [
  { prop: 'plate', label: useI18n().t('operations.vehicles.table.plate') },
  { prop: 'manufacturer', label: useI18n().t('operations.vehicles.table.manufacturer') },
  { prop: 'rentCost', label: useI18n().t('operations.vehicles.table.rentCost') },
  { prop: 'gasCost', label: useI18n().t('operations.vehicles.table.gasCost') },
  { prop: 'oilCost', label: useI18n().t('operations.vehicles.table.oilCost') },
  { prop: 'regularMaintenanceCost', label: useI18n().t('operations.vehicles.table.maintenanceCost') }
];

const table = reactive({
  columns: [
    {
      prop: 'plate',
      label: useI18n().t('operations.vehicles.table.plate'),
      component: 'Text',
      // sortable: true,
      type: 'font-bold',
      width: 150
    },
    {
      prop: 'manufacturer',
      label: useI18n().t('operations.vehicles.table.manufacturer'),
      component: 'Text',
      // sortable: true,
      type: 'font-bold',
      width: 200
    },
    {
      prop: 'rentCost',
      label: useI18n().t('operations.vehicles.table.rentCost'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'gasCost',
      label: useI18n().t('operations.vehicles.table.gasCost'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'oilCost',
      label: useI18n().t('operations.vehicles.table.oilCost'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'regularMaintenanceCost',
      label: useI18n().t('operations.vehicles.table.maintenanceCost'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 250
    },
    {
      prop: 'action',
      label: useI18n().t('common.action'),
      component: 'Action'
    }
  ],
  data: [] as Vehicle[]
});

const response = await useTableFilter('vehicle');
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/operations/vehicle/${val.id}`);
}

const filterOptions = [
  {
    title: useI18n().t('operations.vehicles.filter.manufacturer'),
    value: 'manufacturer',
    options: [...manufacturers]
  },
  {
    title: useI18n().t('operations.vehicles.filter.rentCost'),
    value: ['fromRentCost', 'toRentCost'],
    type: 'input'
  },
  {
    title: useI18n().t('operations.vehicles.filter.gasCost'),
    value: ['fromGasCost', 'toGasCost'],
    type: 'input'
  },
  {
    title: useI18n().t('operations.vehicles.filter.oilCost'),
    value: ['fromOilCost', 'toOilCost'],
    type: 'input'
  },
  {
    title: useI18n().t('operations.vehicles.filter.maintenanceCost'),
    value: ['fromRegularMaintenanceCost', 'toRegularMaintenanceCost'],
    type: 'input'
  }
];
</script>
