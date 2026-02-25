<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('navigation.vehicle') }}
    .flex.items-center.gap-x-3
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'vehicles-export'" :title="$t('navigation.vehicle')")
      NuxtLink(to="/operations/vehicle/add-vehicle")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_VEHICLES')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl")  {{ $t('operations.vehicles.new') }}

  //- Desktop Table
  .vehicle-desktop-view
    AppTable(v-slot="{data}" :columns="table.columns" :filterOptions="filterOptions" position="vehicle" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('navigation.vehicle')" )
      .flex.items-center.py-2(@click.stop)
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

  //- Mobile Card View
  .vehicle-mobile-view
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('navigation.vehicle')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .space-y-3(v-if="mobileFilteredData.length")
        SwipeCard(
          v-for="v in mobileFilteredData"
          :key="v.id"
          :leftActions="getSwipeLeftActions(v)"
          :rightActions="[]"
          @action="(name) => handleSwipeAction(name, v)"
        )
          .entity-card.p-4(@click="handleRowClick(v)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: '#3b82f620', color: '#3b82f6' }"
                ) {{ (v.plate || '?').charAt(0).toUpperCase() }}
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ v.plate || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ v.manufacturer || '' }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="v.rentCost")
                Icon(name="ph:hand-coins" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") Rent: {{ v.rentCost }}
              .flex.items-center.gap-2(v-if="v.gasCost")
                Icon(name="ph:gas-pump" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") Gas: {{ v.gasCost }}
              .flex.items-center.gap-2(v-if="v.oilCost")
                Icon(name="ph:drop" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") Oil: {{ v.oilCost }}
              .flex.items-center.gap-2(v-if="v.regularMaintenanceCost")
                Icon(name="ph:wrench" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") Maint: {{ v.regularMaintenanceCost }}

      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:car" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('navigation.vehicle').toLowerCase() }}

    .mobile-fab(v-if="hasPermission('CREATE_VEHICLES')" @click="navigateTo('/operations/vehicle/add-vehicle')")
      Icon(name="ph:plus-bold" size="24")

  ActionModel(v-model="deleteLeadPopup" :loading="loadingAction" :btn-text="$t('common.moveToArchive')" :description-one="$t('common.archiveConfirmation')" icon="/images/delete-image.png" :description-two="$t('common.archiveDescription')" )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
const router = useRouter();
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const deleteLeadPopup = ref(false);
const loading = ref(false);

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

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileRefreshing = ref(false);

const mobileFilteredData = computed(() => {
  let data = table.data || [];
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((v: any) => {
    const plate = (v.plate || '').toLowerCase();
    const mfr = (v.manufacturer || '').toLowerCase();
    return plate.includes(q) || mfr.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    const res = await useTableFilter('vehicle');
    table.data = res.formattedData;
    vibrate([10, 30, 10]);
  } finally { mobileRefreshing.value = false; }
}

function getSwipeLeftActions(_v: any) {
  const actions = [{ name: 'view', label: useI18n().t('common.view'), icon: 'ph:eye-bold', color: '#3b82f6' }];
  if (hasPermission('EDIT_VEHICLES')) actions.push({ name: 'edit', label: useI18n().t('common.edit'), icon: 'ph:pencil-simple-bold', color: '#F59E0B' });
  return actions;
}

function handleSwipeAction(name: string, v: any) {
  vibrate();
  if (name === 'view') navigateTo(`/operations/vehicle/${v.id}`);
  if (name === 'edit') navigateTo(`/operations/vehicle/edit/${v.id}`);
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('vehicle', #3b82f6);
</style>
