<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('navigation.assets') }}
    .flex.items-center.gap-x-3
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'assets-export'" :title="$t('navigation.assets')")
      NuxtLink(to="/operations/assets/add-asset")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_ASSETS')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl")  {{ $t('operations.assets.new') }}

  //- Desktop Table
  .assets-desktop-view
    AppTable(v-slot="{data}" :filterOptions="filterOptions" :columns="table.columns" position="asset" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('navigation.assets')" )
      .flex.items-center.py-2(@click.stop)
          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md
                    Icon(name="IconToggle"  size="22")
              template(#dropdown='')
                  el-dropdown-menu
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/assets/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item(v-if="hasPermission('EDIT_ASSETS')")
                        NuxtLink.flex.items-center(:to="`/operations/assets/edit/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}
                      el-dropdown-item(v-if="hasPermission('DELETE_ASSETS')" @click="[deleteLeadPopup=true, deleteId = data?.id]")
                        .flex.items-center
                          Icon.text-md.mr-2(name="ph:trash-bold" )
                          p.text-sm {{ $t('common.delete') }}

  //- Mobile Card View
  .assets-mobile-view
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('navigation.assets')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .space-y-3(v-if="mobileFilteredData.length")
        SwipeCard(
          v-for="asset in mobileFilteredData"
          :key="asset.id"
          :leftActions="getSwipeLeftActions(asset)"
          :rightActions="[]"
          @action="(name) => handleSwipeAction(name, asset)"
        )
          .entity-card.p-4(@click="handleRowClick(asset)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: '#8b5cf620', color: '#8b5cf6' }"
                ) {{ (asset.name || '?').charAt(0).toUpperCase() }}
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ asset.name || '--' }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="asset.rentPrice")
                Icon(name="ph:hand-coins" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ $t('operations.assets.table.rentPrice') }}: {{ asset.rentPrice }}
              .flex.items-center.gap-2(v-if="asset.buyPrice")
                Icon(name="ph:tag" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ $t('operations.assets.table.buyPrice') }}: {{ asset.buyPrice }}

      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:package" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('navigation.assets').toLowerCase() }}

    .mobile-fab(v-if="hasPermission('CREATE_ASSETS')" @click="navigateTo('/operations/assets/add-asset')")
      Icon(name="ph:plus-bold" size="24")

  ActionModel(v-model="deleteLeadPopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
const router = useRouter();
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const deleteLeadPopup = ref(false);
const deleteId = ref<string | null>(null);
const deleting = ref(false);
const loading = ref(false);

// Export columns
const exportColumns = [
  { prop: 'name', label: useI18n().t('operations.assets.table.name') },
  { prop: 'rentPrice', label: useI18n().t('operations.assets.table.rentPrice') },
  { prop: 'buyPrice', label: useI18n().t('operations.assets.table.buyPrice') }
];

const table = reactive({
  columns: [
    {
      prop: 'name',
      label: useI18n().t('operations.assets.table.name'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 500
    },
    {
      prop: 'rentPrice',
      label: useI18n().t('operations.assets.table.rentPrice'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'buyPrice',
      label: useI18n().t('operations.assets.table.buyPrice'),
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
  data: []
});

const response = await useTableFilter('asset');
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/operations/assets/${val.id}`);
}

const filterOptions = [
  {
    title: useI18n().t('operations.assets.filter.rentPrice'),
    value: ['fromRentPrice', 'toRentPrice'],
    type: 'input'
  },
  {
    title: useI18n().t('operations.assets.filter.buyPrice'),
    value: ['fromBuyPrice', 'toBuyPrice'],
    type: 'input'
  }
];

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const response = await deleteAssetById(deleteId.value);
    if (response?.success) {
      table.data = table.data.filter((r: any) => r.id !== deleteId.value);
    }
  } finally {
    deleting.value = false;
    deleteLeadPopup.value = false;
  }
}

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileRefreshing = ref(false);

const mobileFilteredData = computed(() => {
  let data = table.data || [];
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((a: any) => {
    const name = (a.name || '').toLowerCase();
    return name.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    const res = await useTableFilter('asset');
    table.data = res.formattedData;
    vibrate([10, 30, 10]);
  } finally { mobileRefreshing.value = false; }
}

function getSwipeLeftActions(_asset: any) {
  const actions = [{ name: 'view', label: useI18n().t('common.view'), icon: 'ph:eye-bold', color: '#8b5cf6' }];
  if (hasPermission('EDIT_ASSETS')) actions.push({ name: 'edit', label: useI18n().t('common.edit'), icon: 'ph:pencil-simple-bold', color: '#F59E0B' });
  if (hasPermission('DELETE_ASSETS')) actions.push({ name: 'delete', label: useI18n().t('common.delete'), icon: 'ph:trash-bold', color: '#ef4444' });
  return actions;
}

function handleSwipeAction(name: string, asset: any) {
  vibrate();
  if (name === 'view') navigateTo(`/operations/assets/${asset.id}`);
  if (name === 'edit') navigateTo(`/operations/assets/edit/${asset.id}`);
  if (name === 'delete') { deleteId.value = asset.id; deleteLeadPopup.value = true; }
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('assets', #8b5cf6);
</style>
