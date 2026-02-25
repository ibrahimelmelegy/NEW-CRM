<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('navigation.manpower') }}
    .flex.items-center.gap-x-3
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'manpower-export'" :title="$t('navigation.manpower')")
      NuxtLink(to="/operations/manpower/add-manpower")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_MANPOWER')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl")  {{ $t('operations.manpower.new') }}

  //- Desktop Table
  .manpower-desktop-view
    AppTable(v-slot="{data}"  :columns="table.columns" :filterOptions="filterOptions" position="manpower" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('navigation.manpower')" )
      .flex.items-center.py-2(@click.stop)
          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md
                    Icon(name="IconToggle"  size="22")
              template(#dropdown='')
                  el-dropdown-menu
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/manpower/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item(v-if="hasPermission('EDIT_MANPOWER')")
                        NuxtLink.flex.items-center(:to="`/operations/manpower/edit/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}

  //- Mobile Card View
  .manpower-mobile-view
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('navigation.manpower')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
        button.status-pill(
          v-for="filter in mobileStatusFilters"
          :key="filter.value"
          :class="{ 'status-pill--active': mobileStatusFilter === filter.value }"
          :style="mobileStatusFilter === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="mobileStatusFilter = filter.value; vibrate()"
        )
          span {{ filter.label }}
          span.status-pill__count(v-if="filter.count > 0") {{ filter.count }}

      .space-y-3(v-if="mobileFilteredData.length")
        SwipeCard(
          v-for="mp in mobileFilteredData"
          :key="mp.id"
          :leftActions="getSwipeLeftActions(mp)"
          :rightActions="[]"
          @action="(name) => handleSwipeAction(name, mp)"
        )
          .entity-card.p-4(@click="handleRowClick(mp)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: '#10b98120', color: '#10b981' }"
                ) {{ (mp.name || '?').charAt(0).toUpperCase() }}
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ mp.name || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ mp.role || '' }}
              el-tag.shrink-0(
                :type="mp.availabilityStatus === 'AVAILABLE' ? 'success' : 'danger'"
                size="small"
                effect="dark"
                round
              ) {{ mp.availabilityStatus === 'AVAILABLE' ? $t('operations.manpower.status.available') : $t('operations.manpower.status.notAvailable') }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="mp.salary")
                Icon(name="ph:money" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ $t('operations.manpower.table.salary') }}: {{ mp.salary }}
              .flex.items-center.gap-2(v-if="mp.dailyCost")
                Icon(name="ph:clock" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ $t('operations.manpower.table.dailyCost') }}: {{ mp.dailyCost }}

      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:users" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('navigation.manpower').toLowerCase() }}

    .mobile-fab(v-if="hasPermission('CREATE_MANPOWER')" @click="navigateTo('/operations/manpower/add-manpower')")
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
  { prop: 'name', label: useI18n().t('operations.manpower.table.fullName') },
  { prop: 'manpowerContacts', label: useI18n().t('operations.manpower.table.contacts') },
  { prop: 'role', label: useI18n().t('operations.manpower.table.role') },
  { prop: 'availabilityStatus', label: useI18n().t('operations.manpower.table.availability') },
  { prop: 'salary', label: useI18n().t('operations.manpower.table.salary') },
  { prop: 'totalCost', label: useI18n().t('operations.manpower.table.totalCost') },
  { prop: 'dailyCost', label: useI18n().t('operations.manpower.table.dailyCost') }
];

const table = reactive({
  columns: [
    {
      prop: 'name',
      label: useI18n().t('operations.manpower.table.fullName'),
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 150
    },
    {
      prop: 'manpowerContacts',
      label: useI18n().t('operations.manpower.table.contacts'),
      component: 'AvatarText',
      // sortable: true,
      type: 'font-bold',
      width: 200
    },
    {
      prop: 'role',
      label: useI18n().t('operations.manpower.table.role'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'availabilityStatus',
      label: useI18n().t('operations.manpower.table.availability'),
      component: 'Label',
      sortable: true,
      type: 'outline',
      filters: [
        { text: useI18n().t('operations.manpower.status.available'), value: 'AVAILABLE' },
        { text: useI18n().t('operations.manpower.status.notAvailable'), value: 'NOT_AVAILABLE' }
      ],
      width: 200
    },
    {
      prop: 'salary',
      label: useI18n().t('operations.manpower.table.salary'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'totalCost',
      label: useI18n().t('operations.manpower.table.totalCost'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'dailyCost',
      label: useI18n().t('operations.manpower.table.dailyCost'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'action',
      label: useI18n().t('common.action'),
      component: 'Action'
    }
  ],
  data: [] as ManpowerValues[]
});

const response = await useTableFilter('manpower');
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/operations/manpower/${val?.id}`);
}

const filterOptions = [
  {
    title: useI18n().t('operations.manpower.filter.availability'),
    value: 'availabilityStatus',
    options: [...manpowerAvailabilityStatus]
  },
  {
    title: useI18n().t('operations.manpower.filter.role'),
    value: 'role',
    options: [...manpowerRoles]
  },
  {
    title: useI18n().t('operations.manpower.filter.salary'),
    value: ['fromSalary', 'toSalary'],
    type: 'input'
  },
  {
    title: useI18n().t('operations.manpower.filter.variableAllowance'),
    value: ['fromVariableAllowance', 'toVariableAllowance'],
    type: 'input'
  },
  {
    title: useI18n().t('operations.manpower.filter.transportationAllowance'),
    value: ['fromTransportationAllowance', 'toTransportationAllowance'],
    type: 'input'
  },
  {
    title: useI18n().t('operations.manpower.filter.iqamaCost'),
    value: ['fromIqamaCost', 'toIqamaCost'],
    type: 'input'
  },
  {
    title: useI18n().t('operations.manpower.filter.totalCost'),
    value: ['fromTotalCost', 'toTotalCost'],
    type: 'input'
  },
  {
    title: useI18n().t('operations.manpower.filter.dailyCost'),
    value: ['fromDailyCost', 'toDailyCost'],
    type: 'input'
  },
  {
    title: useI18n().t('common.created'),
    value: ['fromDate', 'toDate'],
    type: 'date'
  }
];

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileStatusFilter = ref('ALL');
const mobileRefreshing = ref(false);

const mobileStatusFilters = computed(() => {
  const data = table.data || [];
  return [
    { value: 'ALL', label: useI18n().t('common.all'), color: '#10b981', count: data.length },
    { value: 'AVAILABLE', label: useI18n().t('operations.manpower.status.available'), color: '#10b981', count: data.filter((m: any) => m.availabilityStatus === 'AVAILABLE').length },
    { value: 'NOT_AVAILABLE', label: useI18n().t('operations.manpower.status.notAvailable'), color: '#ef4444', count: data.filter((m: any) => m.availabilityStatus === 'NOT_AVAILABLE').length }
  ];
});

const mobileFilteredData = computed(() => {
  let data = table.data || [];
  if (mobileStatusFilter.value !== 'ALL') {
    data = data.filter((m: any) => m.availabilityStatus === mobileStatusFilter.value);
  }
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((m: any) => {
    const name = (m.name || '').toLowerCase();
    const role = (m.role || '').toLowerCase();
    return name.includes(q) || role.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    const res = await useTableFilter('manpower');
    table.data = res.formattedData;
    vibrate([10, 30, 10]);
  } finally { mobileRefreshing.value = false; }
}

function getSwipeLeftActions(_mp: any) {
  const actions = [{ name: 'view', label: useI18n().t('common.view'), icon: 'ph:eye-bold', color: '#10b981' }];
  if (hasPermission('EDIT_MANPOWER')) actions.push({ name: 'edit', label: useI18n().t('common.edit'), icon: 'ph:pencil-simple-bold', color: '#F59E0B' });
  return actions;
}

function handleSwipeAction(name: string, mp: any) {
  vibrate();
  if (name === 'view') navigateTo(`/operations/manpower/${mp.id}`);
  if (name === 'edit') navigateTo(`/operations/manpower/edit/${mp.id}`);
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('manpower', #10b981);
</style>
