<template lang="pug">
div(class="animate-fade-in")
  //- Premium Header
  PremiumPageHeader(
    :title="$t('leads.title')"
    :description="$t('leads.description')"
    icon="ph:users-three-duotone"
    primaryColor="#7849ff"
  )
    template(#actions)
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'leads-export'" :title="$t('leads.title')")
      template(v-if="canCreateLeads")
        NuxtLink(to="/sales/leads/add-lead")
          el-button(size='large' :loading="loading" native-type="submit" type="primary" :icon="Plus" class="!rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform") {{ $t('leads.newLead') }}
      el-dropdown(trigger="click")
        span.el-dropdown-link
          el-button(size="large" class="!rounded-xl" v-wave)
            Icon(name="ph:dots-three-outline-vertical-fill" size="20")
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item
              button.flex.items-center(@click="triggerFileInput" type="button")
                Icon.text-md.mr-2(size="20" name="ph:upload-simple-bold" )
                p.text-sm {{ $t('leads.import') }}

  //- Skeleton Loading State
  SkeletonTable(v-if="loadingAction" :rows="8" :cols="6")

  //- KPI Metrics
  .leads-kpi-grid(v-if="!loadingAction")
    PremiumKPICards(:metrics="kpiMetrics")

  input(type="file", ref="fileInput", style="display: none", accept=".xls,.xlsx", @change="handleFileChange")
  BulkActions(v-if="!loadingAction" :count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="handleBulkDelete" @bulk-export="handleBulkExport" @clear-selection="selectedRows = []")
  SavedViews(v-if="!loadingAction" :entityType="'lead'" :currentFilters="currentFilters" @apply-view="handleApplyView")
  AdvancedSearch(v-if="!loadingAction" :entityType="'lead'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")

  //- Desktop Table View
  .leads-desktop-view(v-if="!loadingAction")
    AppTable(v-slot="{data}" :externalLoading="loading" :filterOptions="filterOptions" :columns="table.columns" position="lead" :pageInfo="response.pagination"  :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('leads.title')" :key="table.data" emptyIcon="ph:user-focus-bold" :emptyMessage="$t('leads.noLeadsYet')" emptyDescription="Create your first lead to start building your sales pipeline" emptyActionHref="/sales/leads/create" emptyActionLabel="Create Lead" )
      .flex.items-center.py-2(@click.stop)
          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md
                    Icon(name="IconToggle"  size="22")
              template(#dropdown='')
                  el-dropdown-menu
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/sales/leads/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('leads.view') }}
                      el-dropdown-item( v-if="hasPermission('EDIT_LEADS')")
                        NuxtLink.flex.items-center(:to="`/sales/leads/edit/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('leads.edit') }}
                      el-dropdown-item(v-if="hasPermission('DELETE_LEADS')" @click="[deleteLeadPopup=true, deleteId = data?.id]")
                        .flex.items-center
                          Icon.text-md.mr-2(name="IconDelete" )
                          p.text-sm {{ $t('leads.delete') }}

  //- Mobile App View
  .leads-mobile-view(v-if="!loadingAction")
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      //- Mobile Search
      .mb-3
        el-input(
          v-model="mobileSearch"
          size="large"
          :placeholder="`${$t('common.search')} ${$t('leads.title')}`"
          clearable
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      //- Status Filter Pills
      .status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
        button.status-pill(
          v-for="filter in statusFilters"
          :key="filter.value"
          :class="{ 'status-pill--active': mobileStatusFilter === filter.value }"
          :style="mobileStatusFilter === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="setMobileStatusFilter(filter.value)"
        )
          span {{ filter.label }}
          span.status-pill__count(v-if="filter.count > 0") {{ filter.count }}

      //- Lead Cards with Swipe Actions
      .space-y-3(v-if="mobileFilteredData.length")
        SwipeCard(
          v-for="lead in mobileFilteredData"
          :key="lead.id"
          :rightActions="getSwipeRightActions(lead)"
          :leftActions="getSwipeLeftActions(lead)"
          @action="(name) => handleSwipeAction(name, lead)"
        )
          .lead-card.p-4(@click="handleRowClick(lead)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .lead-avatar.w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: getLeadColor(lead.status) + '20', color: getLeadColor(lead.status) }"
                ) {{ getLeadInitial(lead) }}
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ lead.leadDetails?.title || lead.name || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ lead.leadDetails?.text || lead.companyName || '' }}
              el-tag.shrink-0(
                :type="getStatusType(lead.status)"
                size="small"
                effect="dark"
                round
              ) {{ lead.status }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="lead.phone")
                Icon(name="ph:phone" size="14" style="color: var(--text-muted)")
                a.text-xs.truncate(
                  :href="`tel:${lead.phone}`"
                  style="color: var(--text-secondary)"
                  @click.stop
                ) {{ lead.phone }}
              .flex.items-center.gap-2(v-if="lead.leadSource")
                Icon(name="ph:funnel" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ lead.leadSource }}
              .flex.items-center.gap-2(v-if="lead.assign")
                Icon(name="ph:user" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ lead.assign }}
              .flex.items-center.gap-2(v-if="lead.createdAt")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ lead.createdAt }}

      //- Empty state
      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:users-three" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      //- Mobile result count
      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('leads.title').toLowerCase() }}

    //- Floating Action Button
    .mobile-fab(v-if="canCreateLeads" @click="navigateTo('/sales/leads/add-lead')")
      Icon(name="ph:plus-bold" size="24")

  ActionModel(v-model="deleteLeadPopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
  ActionModel(v-model="qualifiedLeadPopup" :loading="loadingAction" :btn-text="$t('common.save')" :description="$t('leads.confirmConversion')" @confirm = "editPresent" )
   template(#input)
    InputSelect(:label="$t('leads.present')" @change ="setPresent" :options="leadPresent"  )
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { computed, ref, watch, unref, shallowRef, isRef, onMounted, onBeforeMount } from 'vue';
import { leadStates, leadSources } from '@/composables/useLeads';
import useTableFilter from '@/composables/useTableFilter';
import PremiumPageHeader from '~/components/UI/PremiumPageHeader.vue';
import PremiumKPICards from '~/components/UI/PremiumKPICards.vue';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';
const router = useRouter();

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const loading = ref(false);
const present = ref('');
const select = ref();
const qualifiedLeadPopup = ref(false);
const deleteLeadPopup = ref(false);
const deleteId = ref<string | null>(null);
const deleting = ref(false);

// Create computed property for CREATE_LEADS permission
// This ensures the v-if updates reactively when permissions change
const canCreateLeads = computed(() => hasPermission('CREATE_LEADS') === true);

const leadPresent = computed(() => [
  {
    label: t('leads.convertToOpp'),
    value: 'opportunity'
  },
  {
    label: t('leads.convertToDeal'),
    value: 'deal'
  },
  {
    label: t('common.cancel'), // "Not Now" replaced with Cancel or relevant translation
    value: 'now'
  }
]);

async function setPresent(pre: unknown) {
  present.value = pre.value;
}

async function changeStatus(id: unknown, newStatus: unknown) {
  const lead: unknown = await getLead(id);
  loadingAction.value = true;
  try {
    await updateLead({ ...lead, leadState: newStatus, id });
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  } finally {
    const response = await useTableFilter('lead');
    table.value.data = response.formattedData;
    loadingAction.value = false;
  }
}

async function submitForm(values: unknown) {
  try {
    if (values?.status === 'QUALIFIED') {
      qualifiedLeadPopup.value = true;
      select.value = values;
    }
    if (values?.status !== 'QUALIFIED') changeStatus(values?.id, values?.status);
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}

async function editPresent() {
  await changeStatus(select.value?.id, select.value?.status);
  if (present.value === 'opportunity') router.push(`/sales/opportunity/add-opportunity?leadId=${select.value?.id}`);
  if (present.value === 'deal') router.push(`/sales/deals/add-deal?leadId=${select.value?.id}`);
  qualifiedLeadPopup.value = false;
  present.value = '';
  select.value = {};
}

// Call API to Get the lead and users in parallel
const [initialResponse, usersResponse] = await Promise.all([useTableFilter('lead'), useApiFetch('users')]);
let response = initialResponse;

const table = ref({
  columns: [] as unknown[], // Initialize as empty array
  data: response.formattedData || [],
  sort: [
    { prop: 'price', order: 'ascending', value: 'PRICE_ASC' },
    { prop: 'price', order: 'descending', value: 'PRICE_DESC' },
    { prop: 'identity', order: 'ascending', value: 'IDENTITY_ASC' },
    { prop: 'identity', order: 'descending', value: 'IDENTITY_DESC' }
  ]
});

const kpiMetrics = computed<KPIMetric[]>(() => {
  const data = table.value.data || [];
  const total = data.length;
  const newLeads = data.filter(l => l.status === 'NEW').length;
  const qualified = data.filter(l => l.status === 'QUALIFIED').length;
  const contacted = data.filter(l => l.status === 'CONTACTED').length;
  const rate = total > 0 ? Math.round((qualified / total) * 100) : 0;

  return [
    { label: t('leads.kpi.totalLeads'), value: total, icon: 'ph:users-three-bold', color: '#7849ff' },
    { label: t('leads.kpi.newPipeline'), value: newLeads, icon: 'ph:sparkle-bold', color: '#10b981' },
    { label: t('leads.kpi.qualified'), value: qualified, icon: 'ph:check-circle-bold', color: '#f59e0b' },
    { label: t('leads.kpi.conversion'), value: rate + '%', icon: 'ph:chart-line-up-bold', color: '#3b82f6' }
  ];
});

const updateTableColumns = () => {
  table.value.columns = [
    {
      prop: 'leadDetails',
      label: t('leads.table.leadName'),
      component: 'AvatarText',
      sortable: true,
      type: 'font-bold',
      width: 170
    },
    {
      prop: 'phone',
      label: t('leads.table.phone'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'email',
      label: t('leads.table.email'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 200
    },
    {
      prop: 'status',
      label: t('leads.table.status'),
      component: 'Label',
      sortable: true,
      type: 'select',
      filters: [
        { text: t('crm.stages.new'), value: 'NEW', actions: submitForm },
        { text: t('crm.stages.contacted'), value: 'CONTACTED', actions: submitForm },
        { text: t('crm.stages.lost'), value: 'DISQUALIFIED', actions: submitForm }, // Assuming Disqualified maps to Lost or has its own key
        { text: t('crm.stages.qualified'), value: 'QUALIFIED', actions: submitForm }
      ],
      width: 150
    },

    {
      prop: 'leadSource',
      label: t('leads.table.source'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'lastContactDate',
      label: t('leads.table.lastContact'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'score',
      label: t('leads.table.score'),
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 100
    },
    {
      prop: 'lastActivity',
      label: t('leads.table.lastActivity'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'assign',
      label: t('leads.table.assigned'),
      component: 'Text',
      type: 'font-default',
      width: 200
    },
    {
      prop: 'createdAt',
      label: t('leads.table.created'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 200
    }
    // { prop: 'actions', label: 'Actions', sortable: false },
  ];
};

// Initial update of columns
updateTableColumns();

// If you want columns to react to locale changes, you would watch the locale:
// const { locale } = useI18n();
// watch(locale, updateTableColumns);

function handleRowClick(val: unknown) {
  router.push(`/sales/leads/${val.id}`);
}

const mappedUsers =
  usersResponse?.body?.docs?.map(e => ({
    label: e.name,
    value: e.id
  })) || [];

const filterOptions = computed(() => [
  {
    title: t('leads.table.status'),
    value: 'status',
    options: [...leadStates]
  },
  {
    title: t('leads.table.source'),
    value: 'leadSource',
    options: [...leadSources]
  },
  {
    title: t('leads.table.assigned'), // "Assigned user"
    value: 'userId',
    options: [...mappedUsers]
  },
  {
    title: t('leads.table.created'), // "Creation Date"
    value: ['fromDate', 'toDate'],
    type: 'date'
  },
  {
    title: t('leads.table.lastContact'), // "Last Contact Date"
    value: ['fromLastContactDate', 'toLastContactDate'],
    type: 'date'
  }
]);

// SavedViews & AdvancedSearch
const currentFilters = ref<Record<string, unknown>>({});

const advancedSearchFields = [
  { key: 'name', label: t('leads.table.leadName'), type: 'string' },
  { key: 'email', label: t('leads.table.email'), type: 'string' },
  { key: 'phone', label: t('leads.table.phone'), type: 'string' },
  { key: 'status', label: t('leads.table.status'), type: 'select', options: leadStates.map(s => ({ value: s.value, label: s.label })) },
  { key: 'leadSource', label: t('leads.table.source'), type: 'select', options: leadSources.map(s => ({ value: s.value, label: s.label })) },
  { key: 'createdAt', label: t('leads.table.created'), type: 'date' }
];

async function handleApplyView(view: unknown) {
  if (view?.filters) {
    currentFilters.value = view.filters;
    const response = await useTableFilter('lead', view.filters);
    table.value.data = response.formattedData;
  }
}

async function handleAdvancedFilter(filterPayload: unknown) {
  try {
    const response = await useApiFetch('search/advanced/lead', 'POST', filterPayload);
    if (response?.success && response?.body) {
      const data = response.body as unknown;
      table.value.data = data.docs || data || [];
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}

async function handleClearAdvancedFilter() {
  const response = await useTableFilter('lead');
  table.value.data = response.formattedData;
}

// Export columns & data
const exportColumns = [
  { prop: 'leadDetails', label: t('leads.table.leadName') },
  { prop: 'phone', label: t('leads.table.phone') },
  { prop: 'email', label: t('leads.table.email') },
  { prop: 'status', label: t('leads.table.status') },
  { prop: 'leadSource', label: t('leads.table.source') },
  { prop: 'lastContactDate', label: t('leads.table.lastContact') },
  { prop: 'assign', label: t('leads.table.assigned') },
  { prop: 'createdAt', label: t('leads.table.created') }
];
const exportData = computed(() => table.value.data);

// Mobile app view
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileStatusFilter = ref('ALL');
const mobileRefreshing = ref(false);

const statusFilters = computed(() => {
  const data = table.value.data || [];
  return [
    { value: 'ALL', label: t('common.all'), color: '#7849ff', count: data.length },
    { value: 'NEW', label: t('crm.stages.new'), color: '#7849ff', count: data.filter(l => l.status === 'NEW').length },
    { value: 'CONTACTED', label: t('crm.stages.contacted'), color: '#3b82f6', count: data.filter(l => l.status === 'CONTACTED').length },
    { value: 'QUALIFIED', label: t('crm.stages.qualified'), color: '#10b981', count: data.filter(l => l.status === 'QUALIFIED').length },
    { value: 'DISQUALIFIED', label: t('crm.stages.lost'), color: '#ef4444', count: data.filter(l => l.status === 'DISQUALIFIED').length }
  ];
});

function setMobileStatusFilter(value: string) {
  mobileStatusFilter.value = value;
  vibrate();
}

const mobileFilteredData = computed(() => {
  let data = table.value.data || [];
  if (mobileStatusFilter.value !== 'ALL') {
    data = data.filter(lead => lead.status === mobileStatusFilter.value);
  }
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter(lead => {
    const name = (lead.leadDetails?.title || lead.name || '').toLowerCase();
    const company = (lead.leadDetails?.text || lead.companyName || '').toLowerCase();
    const email = (lead.email || '').toLowerCase();
    const phone = (lead.phone || '').toLowerCase();
    return name.includes(q) || company.includes(q) || email.includes(q) || phone.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    response = await useTableFilter('lead');
    table.value.data = response.formattedData;
    vibrate([10, 30, 10]);
  } finally {
    mobileRefreshing.value = false;
  }
}

function getSwipeRightActions(lead: unknown) {
  const actions = [];
  if (lead.phone) {
    actions.push({ name: 'call', label: t('common.call'), icon: 'ph:phone-bold', color: '#10B981' });
  }
  if (lead.email) {
    actions.push({ name: 'email', label: t('common.email'), icon: 'ph:envelope-bold', color: '#3B82F6' });
  }
  return actions;
}

function getSwipeLeftActions(lead: unknown) {
  const actions = [{ name: 'view', label: t('leads.view'), icon: 'ph:eye-bold', color: '#7849FF' }];
  if (hasPermission('EDIT_LEADS')) {
    actions.push({ name: 'edit', label: t('leads.edit'), icon: 'ph:pencil-simple-bold', color: '#F59E0B' });
  }
  return actions;
}

function handleSwipeAction(name: string, lead: unknown) {
  vibrate();
  switch (name) {
    case 'call':
      window.location.href = `tel:${lead.phone}`;
      break;
    case 'email':
      window.location.href = `mailto:${lead.email}`;
      break;
    case 'view':
      navigateTo(`/sales/leads/${lead.id}`);
      break;
    case 'edit':
      navigateTo(`/sales/leads/edit/${lead.id}`);
      break;
  }
}

function getLeadInitial(lead: unknown): string {
  const name = lead.leadDetails?.title || lead.name || '?';
  return name.charAt(0).toUpperCase();
}

function getLeadColor(status: string): string {
  const map: Record<string, string> = {
    NEW: '#7849ff',
    CONTACTED: '#3b82f6',
    QUALIFIED: '#10b981',
    DISQUALIFIED: '#ef4444'
  };
  return map[status] || '#94a3b8';
}

function getStatusType(status: string): string {
  const map: Record<string, string> = {
    NEW: 'primary',
    CONTACTED: '',
    QUALIFIED: 'success',
    DISQUALIFIED: 'danger'
  };
  return map[status] || 'info';
}

// Bulk actions
const selectedRows = ref<Record<string, unknown>[]>([]);

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const response = await deleteLead(deleteId.value);
    if (response?.success) {
      table.value.data = table.value.data.filter(r => r.id !== deleteId.value);
    }
  } finally {
    deleting.value = false;
    deleteLeadPopup.value = false;
  }
}

async function handleBulkDelete() {
  if (!selectedRows.value.length) return;
  try {
    await ElMessageBox.confirm(t('leads.confirmBulkDelete', { count: selectedRows.value.length }), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });
    loading.value = true;
    for (const row of selectedRows.value) {
      await deleteLead(row.id);
    }
    response = await useTableFilter('lead');
    table.value.data = response.formattedData;
    selectedRows.value = [];
    ElNotification({ type: 'success', title: t('common.success'), message: t('leads.bulkDeleted') });
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
    const ids = selectedRows.value.map(r => r.id);
    await useApiFetch('lead/export', 'POST', { ids });
    ElNotification({ type: 'success', title: t('common.success'), message: t('leads.exportSuccess') });
    selectedRows.value = [];
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('leads.errors.exportFailed') });
  } finally {
    loading.value = false;
  }
}

// implement import leads

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  // Validate file type
  const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (!validTypes.includes(file.type)) {
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('leads.errors.invalidFile')
    });
    target.value = ''; // Reset input
    return;
  }
  loading.value = true;
  try {
    const fileResponse = await useApiFetch('lead/import', 'POST', formData, false, true);
    if (!fileResponse?.success) {
      ElNotification({
        type: 'error',
        title: t('common.error'),
        message: fileResponse?.message || t('leads.errors.importFailed')
      });
      return;
    }
    // Refresh leads after import
    response = await useTableFilter('lead');
    table.value.data = response.formattedData;

    ElNotification({
      type: 'success',
      title: t('common.success'),
      message: t('leads.importSuccess')
    });
  } catch (err) {
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('leads.errors.importFailed')
    });
  } finally {
    // Reset the file input so you can upload the same file again if needed
    target.value = '';
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
// Mobile: show card view, hide table
.leads-mobile-view {
  display: none;
}

@media (max-width: 767px) {
  .leads-mobile-view {
    display: block;
  }

  .leads-desktop-view {
    display: none;
  }

  // Hide desktop header on mobile (FAB replaces add button)
  :deep(.premium-page-header) {
    margin-bottom: 12px !important;

    .actions {
      flex-wrap: wrap;
      gap: 8px !important;
      width: 100%;
    }

    .actions .el-button {
      font-size: 13px !important;
      padding: 8px 12px !important;
    }

    .content h1 {
      font-size: 1.3rem !important;
    }
  }

  // KPI cards: 2-column grid on mobile
  .leads-kpi-grid :deep(.premium-kpi-cards) {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
    margin-bottom: 12px !important;
  }

  .leads-kpi-grid :deep(.kpi-card) {
    padding: 14px !important;

    .text-3xl {
      font-size: 1.4rem !important;
    }

    .text-sm {
      font-size: 0.65rem !important;
    }

    .w-10 {
      width: 32px !important;
      height: 32px !important;
    }
  }

  // Lead cards
  .lead-card {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    background: var(--glass-bg, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));

    &:active {
      opacity: 0.85;
    }
  }
}

// Status filter pills
.status-pills {
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 100px;
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.15));
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  min-height: 36px;

  &:active {
    transform: scale(0.95);
  }

  &--active {
    color: #fff;
    border-color: transparent;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  }

  &__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.2);
    font-size: 10px;
    font-weight: 700;
  }
}

// Floating Action Button
.mobile-fab {
  display: none;
}

@media (max-width: 767px) {
  .mobile-fab {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    bottom: calc(80px + env(safe-area-inset-bottom, 0px) + 16px);
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #7849ff, #9b6dff);
    color: #fff;
    box-shadow: 0 6px 24px rgba(120, 73, 255, 0.4);
    cursor: pointer;
    z-index: 40;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;

    &:active {
      transform: scale(0.9);
      box-shadow: 0 3px 12px rgba(120, 73, 255, 0.3);
    }
  }
}

// Tablet: keep table but allow card view toggle
@media (min-width: 768px) and (max-width: 1024px) {
  .leads-kpi-grid :deep(.premium-kpi-cards) {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
