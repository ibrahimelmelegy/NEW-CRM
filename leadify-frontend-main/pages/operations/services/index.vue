<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('navigation.services') }}
    .flex.items-center.gap-x-3
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'services-export'" :title="$t('navigation.services')")
      NuxtLink(to="/operations/services/add-service")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_SERVICES')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl")  {{ $t('operations.services.new') }}

  //- Desktop Table
  .services-desktop-view
    AppTable(v-slot="{data}" without-filters :columns="table.columns" position="service" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('navigation.services')" )
      .flex.items-center.py-2(@click.stop)
          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md
                    Icon(name="IconToggle"  size="22")
              template(#dropdown='')
                  el-dropdown-menu
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/services/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item(v-if="hasPermission('EDIT_SERVICES')")
                        NuxtLink.flex.items-center(:to="`/operations/services/edit/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}
                      el-dropdown-item(v-if="hasPermission('DELETE_SERVICES')" @click="[deleteLeadPopup=true, deleteId = data?.id]")
                        .flex.items-center
                          Icon.text-md.mr-2(name="ph:trash-bold" )
                          p.text-sm {{ $t('common.delete') }}

  //- Mobile Card View
  .services-mobile-view
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('navigation.services')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .space-y-3(v-if="mobileFilteredData.length")
        SwipeCard(
          v-for="svc in mobileFilteredData"
          :key="svc.id"
          :leftActions="getSwipeLeftActions(svc)"
          :rightActions="[]"
          @action="(name) => handleSwipeAction(name, svc)"
        )
          .entity-card.p-4(@click="handleRowClick(svc)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: '#f59e0b20', color: '#f59e0b' }"
                ) {{ (svc.type || '?').charAt(0).toUpperCase() }}
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ svc.type || '--' }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="svc.price")
                Icon(name="ph:money" size="14" style="color: var(--text-muted)")
                span.text-xs.font-semibold.truncate(style="color: var(--text-secondary)") {{ svc.price }}

      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:wrench" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('navigation.services').toLowerCase() }}

    .mobile-fab(v-if="hasPermission('CREATE_SERVICES')" @click="navigateTo('/operations/services/add-service')")
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
  { prop: 'type', label: useI18n().t('operations.services.table.type') },
  { prop: 'price', label: useI18n().t('operations.services.table.price') }
];

const table = reactive({
  columns: [
    {
      prop: 'type',
      label: useI18n().t('operations.services.table.type'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 500
    },
    {
      prop: 'price',
      label: useI18n().t('operations.services.table.price'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'action',
      label: useI18n().t('common.action'),
      component: 'Action'
    }
  ],
  data: [] as Service[]
});

const response = await useTableFilter('service');
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/operations/services/${val.id}`);
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const response = await deleteServiceById(deleteId.value);
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
  const data = table.data || [];
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((s: any) => {
    const type = (s.type || '').toLowerCase();
    return type.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    const res = await useTableFilter('service');
    table.data = res.formattedData;
    vibrate([10, 30, 10]);
  } finally {
    mobileRefreshing.value = false;
  }
}

function getSwipeLeftActions(_svc: any) {
  const actions = [{ name: 'view', label: useI18n().t('common.view'), icon: 'ph:eye-bold', color: '#f59e0b' }];
  if (hasPermission('EDIT_SERVICES'))
    actions.push({ name: 'edit', label: useI18n().t('common.edit'), icon: 'ph:pencil-simple-bold', color: '#F59E0B' });
  if (hasPermission('DELETE_SERVICES'))
    actions.push({ name: 'delete', label: useI18n().t('common.delete'), icon: 'ph:trash-bold', color: '#ef4444' });
  return actions;
}

function handleSwipeAction(name: string, svc: any) {
  vibrate();
  if (name === 'view') navigateTo(`/operations/services/${svc.id}`);
  if (name === 'edit') navigateTo(`/operations/services/edit/${svc.id}`);
  if (name === 'delete') {
    deleteId.value = svc.id;
    deleteLeadPopup.value = true;
  }
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('services', #f59e0b);
</style>
