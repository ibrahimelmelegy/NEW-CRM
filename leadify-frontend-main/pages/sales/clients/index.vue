<template lang="pug">
div(class="animate-fade-in")
  //- Premium Header
  PremiumPageHeader(
    :title="$t('clients.title')"
    description="Manage your enterprise client portfolio and maximize customer lifetime value."
    icon="ph:buildings-duotone"
    primaryColor="#3b82f6"
  )
    template(#actions)
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'clients-export'" :title="$t('clients.title')")
      NuxtLink(to="/sales/clients/add-client")
        el-button(size='large' :loading="loading" v-if="hasPermission('CREATE_CLIENTS')" native-type="submit" type="primary" :icon="Plus" class="!rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform") {{ $t('clients.newClient') }}

  //- KPI Metrics
  .clients-kpi-grid
    PremiumKPICards(:metrics="kpiMetrics" v-if="!loadingAction")

  BulkActions(:count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="handleBulkDelete" @bulk-export="handleBulkExport" @clear-selection="selectedRows = []")
  SavedViews(:entityType="'client'" :currentFilters="{}" @apply-view="handleApplyView")
  AdvancedSearch(:entityType="'client'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")

  //- Desktop Table
  .clients-desktop-view
    AppTable(v-slot="{data}" :filterOptions="filterOptions" :columns="table.columns" position="client" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" searchPlaceholder="clients" emptyIcon="ph:buildings-bold" emptyMessage="No clients yet" emptyDescription="Add your first client to manage customer relationships" emptyActionHref="/sales/clients/create" emptyActionLabel="Add Client" )
      .flex.items-center.py-2(@click.stop)
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

  //- Mobile Card View
  .clients-mobile-view(v-if="!loadingAction")
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('clients.title')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
        button.status-pill(
          v-for="filter in mobileFilters"
          :key="filter.value"
          :class="{ 'status-pill--active': mobileStatusFilter === filter.value }"
          :style="mobileStatusFilter === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="mobileStatusFilter = filter.value; vibrate()"
        )
          span {{ filter.label }}
          span.status-pill__count(v-if="filter.count > 0") {{ filter.count }}

      .space-y-3(v-if="mobileFilteredData.length")
        SwipeCard(
          v-for="client in mobileFilteredData"
          :key="client.id"
          :rightActions="getSwipeRightActions(client)"
          :leftActions="getSwipeLeftActions(client)"
          @action="(name) => handleSwipeAction(name, client)"
        )
          .entity-card.p-4(@click="handleRowClick(client)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: '#3b82f620', color: '#3b82f6' }"
                ) {{ (client.ClientDetails?.title || client.name || '?').charAt(0).toUpperCase() }}
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ client.ClientDetails?.title || client.name || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ client.clientType || '' }}
              el-tag.shrink-0(:type="client.clientStatus === 'ACTIVE' ? 'success' : 'info'" size="small" effect="dark" round) {{ client.clientStatus }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="client.email")
                Icon(name="ph:envelope" size="14" style="color: var(--text-muted)")
                a.text-xs.truncate(:href="`mailto:${client.email}`" style="color: var(--text-secondary)" @click.stop) {{ client.email }}
              .flex.items-center.gap-2(v-if="client.phoneNumber")
                Icon(name="ph:phone" size="14" style="color: var(--text-muted)")
                a.text-xs.truncate(:href="`tel:${client.phoneNumber}`" style="color: var(--text-secondary)" @click.stop) {{ client.phoneNumber }}
              .flex.items-center.gap-2(v-if="client.assign")
                Icon(name="ph:user" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ client.assign }}
              .flex.items-center.gap-2(v-if="client.createdAt")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ client.createdAt }}

      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:buildings" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('clients.title').toLowerCase() }}

    .mobile-fab(v-if="hasPermission('CREATE_CLIENTS')" @click="navigateTo('/sales/clients/add-client')")
      Icon(name="ph:plus-bold" size="24")

  ActionModel(v-model="deleteClientPopup" :loading="loadingAction" btn-text="Move to Archive" description-one="Are you sure you want to delete this Client?" icon="/images/delete-image.png" description-two="It will be archived and can be restored later within 30 days." )
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Plus } from '@element-plus/icons-vue';
import { ElNotification, ElMessageBox } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import PremiumPageHeader from '~/components/UI/PremiumPageHeader.vue';
import PremiumKPICards from '~/components/UI/PremiumKPICards.vue';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';

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
async function handleBulkDelete() {
  if (!selectedRows.value.length) return;
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete ${selectedRows.value.length} client(s)?`,
      t('common.warning') || 'Warning',
      { type: 'warning', confirmButtonText: t('common.delete') || 'Delete', cancelButtonText: t('common.cancel') || 'Cancel' }
    );
    loading.value = true;
    const ids = selectedRows.value.map((r: any) => r.id);
    await Promise.all(ids.map((id: any) => useApiFetch(`client/${id}`, 'DELETE')));
    const res = await useTableFilter('client');
    table.data = res.formattedData;
    selectedRows.value = [];
    ElNotification({ type: 'success', title: t('common.success'), message: `${ids.length} client(s) deleted` });
  } catch {
    // User cancelled or error
  } finally {
    loading.value = false;
  }
}
async function handleBulkExport() {
  if (!selectedRows.value.length) return;
  try {
    loading.value = true;
    const ids = selectedRows.value.map((r: any) => r.id);
    await useApiFetch('client/export', 'POST', { ids });
    ElNotification({ type: 'success', title: t('common.success'), message: 'Export sent to your email' });
    selectedRows.value = [];
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: 'Export failed' });
  } finally {
    loading.value = false;
  }
}

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
const [response, usersResponse] = await Promise.all([useTableFilter('client'), useApiFetch('users')]);
table.data = response.formattedData;

const kpiMetrics = computed<KPIMetric[]>(() => {
  const data = table.data || [];
  const total = data.length;
  const active = data.filter((c: any) => c.clientStatus === 'ACTIVE' || c.status === 'ACTIVE').length;
  const inactive = data.filter((c: any) => c.clientStatus === 'INACTIVE' || c.status === 'INACTIVE').length;

  return [
    { label: 'Total Clients', value: total, icon: 'ph:buildings-bold', color: '#3b82f6' },
    { label: 'Active Clients', value: active, icon: 'ph:check-circle-bold', color: '#10b981' },
    { label: 'Inactive Clients', value: inactive, icon: 'ph:pause-circle-bold', color: '#f59e0b' }
  ];
});

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

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileStatusFilter = ref('ALL');
const mobileRefreshing = ref(false);
const loading = ref(false);

const mobileFilters = computed(() => {
  const data = table.data || [];
  return [
    { value: 'ALL', label: t('common.all'), color: '#3b82f6', count: data.length },
    { value: 'ACTIVE', label: 'Active', color: '#10b981', count: data.filter((c: any) => c.clientStatus === 'ACTIVE' || c.status === 'ACTIVE').length },
    { value: 'INACTIVE', label: 'Inactive', color: '#94a3b8', count: data.filter((c: any) => c.clientStatus === 'INACTIVE' || c.status === 'INACTIVE').length }
  ];
});

const mobileFilteredData = computed(() => {
  let data = table.data || [];
  if (mobileStatusFilter.value !== 'ALL') {
    data = data.filter((c: any) => (c.clientStatus || c.status) === mobileStatusFilter.value);
  }
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((c: any) => {
    const name = (c.ClientDetails?.title || c.name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const phone = (c.phoneNumber || '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    const res = await useTableFilter('client');
    table.data = res.formattedData;
    vibrate([10, 30, 10]);
  } finally { mobileRefreshing.value = false; }
}

function getSwipeRightActions(client: any) {
  const actions = [];
  if (client.phoneNumber) actions.push({ name: 'call', label: t('common.call'), icon: 'ph:phone-bold', color: '#10B981' });
  if (client.email) actions.push({ name: 'email', label: t('common.email'), icon: 'ph:envelope-bold', color: '#3B82F6' });
  return actions;
}

function getSwipeLeftActions(_client: any) {
  const actions = [{ name: 'view', label: t('common.view'), icon: 'ph:eye-bold', color: '#3b82f6' }];
  if (hasPermission('EDIT_CLIENTS')) actions.push({ name: 'edit', label: t('common.edit'), icon: 'ph:pencil-simple-bold', color: '#F59E0B' });
  return actions;
}

function handleSwipeAction(name: string, client: any) {
  vibrate();
  switch (name) {
    case 'call': window.location.href = `tel:${client.phoneNumber}`; break;
    case 'email': window.location.href = `mailto:${client.email}`; break;
    case 'view': navigateTo(`/sales/clients/${client.id}`); break;
    case 'edit': navigateTo(`/sales/clients/edit/${client.id}`); break;
  }
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('clients', #3b82f6);
</style>
