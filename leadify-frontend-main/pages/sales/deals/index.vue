<template lang="pug">
div(class="animate-fade-in")
  //- Premium Header
  PremiumPageHeader(
    :title="$t('deals.title')"
    :description="$t('deals.description')"
    icon="ph:handshake-duotone"
    primaryColor="#10b981"
  )
    template(#actions)
      el-button-group
        el-button(type="primary" size="large" class="!rounded-l-xl shadow-lg shadow-primary/30")
          Icon(name="ph:list-bold" size="18")
          span.ml-1 {{ $t('kanban.tableView') }}
        el-button(:type="'default'" size="large" @click="navigateTo('/sales/deals/kanban')" class="!rounded-r-xl")
          Icon(name="ph:columns-bold" size="18")
          span.ml-1 {{ $t('kanban.kanbanView') }}
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'deals-export'" :title="$t('deals.title')")
      NuxtLink(to="/sales/deals/add-deal")
        el-button(size='large' :loading="loading" v-if="hasPermission('CREATE_DEALS')" native-type="submit" type="primary" :icon="Plus" class="!rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform") {{ $t('deals.newDeal') }}

  //- KPI Metrics
  .deals-kpi-grid
    PremiumKPICards(:metrics="kpiMetrics" v-if="!loadingAction")

  //- Pipeline Analytics
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4" v-if="pipelineAnalytics")
    .glass-card.p-5.rounded-2xl.animate-entrance(v-for="stat in pipelineStats" :key="stat.label")
      .flex.items-center.justify-between
        div
          p.text-xs.font-medium.uppercase.tracking-wide(style="color: var(--text-muted)") {{ stat.label }}
          p.text-2xl.font-bold.mt-1(:style="{ color: stat.color }") {{ stat.value }}
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: stat.color + '20' }")
          Icon(:name="stat.icon" size="20" :style="{ color: stat.color }")

  BulkActions(:count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="handleBulkDelete" @bulk-export="handleBulkExport" @clear-selection="selectedRows = []")
  SavedViews(:entityType="'deal'" :currentFilters="{}" @apply-view="handleApplyView")
  AdvancedSearch(:entityType="'deal'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")

  //- Desktop Table View
  .deals-desktop-view
    AppTable(v-slot="{data}" :filterOptions="filterOptions" :columns="table.columns" position="deal" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('deals.title')" emptyIcon="ph:handshake-bold" :emptyMessage="$t('deals.noDealsYet')" :emptyDescription="$t('deals.noDealsDesc')" emptyActionHref="/sales/deals/create" :emptyActionLabel="$t('deals.createDeal')" )
      .flex.items-center.py-2(@click.stop)
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
                      el-dropdown-item(v-if="hasPermission('DELETE_DEALS')" @click="[deleteLeadPopup=true, deleteId = data?.id]")
                        .flex.items-center
                          Icon.text-md.mr-2(name="IconDelete" )
                          p.text-sm {{ $t('common.delete') }}

  //- Mobile App View
  .deals-mobile-view(v-if="!loadingAction")
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      //- Mobile Search
      .mb-3
        el-input(
          v-model="mobileSearch"
          size="large"
          :placeholder="`${$t('common.search')} ${$t('deals.title')}`"
          clearable
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      //- Stage Filter Pills
      .status-pills.flex.gap-2.mb-4.overflow-x-auto.pb-2.-mx-1.px-1
        button.status-pill(
          v-for="filter in stageFilters"
          :key="filter.value"
          :class="{ 'status-pill--active': mobileStageFilter === filter.value }"
          :style="mobileStageFilter === filter.value ? { background: filter.color, borderColor: filter.color } : {}"
          @click="setMobileStageFilter(filter.value)"
        )
          span {{ filter.label }}
          span.status-pill__count(v-if="filter.count > 0") {{ filter.count }}

      //- Deal Cards with Swipe Actions
      .space-y-3(v-if="mobileFilteredData.length")
        SwipeCard(
          v-for="deal in mobileFilteredData"
          :key="deal.id"
          :rightActions="getSwipeRightActions(deal)"
          :leftActions="getSwipeLeftActions(deal)"
          @action="(name) => handleSwipeAction(name, deal)"
        )
          .deal-card.p-4(@click="handleRowClick(deal)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .deal-avatar.w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: getDealColor(deal.stage) + '20', color: getDealColor(deal.stage) }"
                ) {{ getDealInitial(deal) }}
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ deal.dealDetails?.title || deal.name || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ deal.assign || deal.contractType || '' }}
              el-tag.shrink-0(
                :type="getStageType(deal.stage)"
                size="small"
                effect="dark"
                round
              ) {{ deal.stage }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="deal.price")
                Icon(name="ph:money" size="14" style="color: var(--text-muted)")
                span.text-xs.font-semibold.truncate(style="color: var(--text-secondary)") {{ formatPrice(deal.price) }}
              .flex.items-center.gap-2(v-if="deal.contractType")
                Icon(name="ph:file-text" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ deal.contractType }}
              .flex.items-center.gap-2(v-if="deal.assign")
                Icon(name="ph:user" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ deal.assign }}
              .flex.items-center.gap-2(v-if="deal.signatureDate")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ deal.signatureDate }}

      //- Empty state
      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:handshake" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      //- Mobile result count
      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('deals.title').toLowerCase() }}

    //- Floating Action Button
    .mobile-fab(v-if="hasPermission('CREATE_DEALS')" @click="navigateTo('/sales/deals/add-deal')")
      Icon(name="ph:plus-bold" size="24")

  ActionModel(v-model="deleteLeadPopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import PremiumPageHeader from '~/components/UI/PremiumPageHeader.vue';
import PremiumKPICards from '~/components/UI/PremiumKPICards.vue';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';

const router = useRouter();
const { hasPermission } = await usePermissions();
const { $i18n } = useNuxtApp();
const t = $i18n.t;
const { vibrate } = useMobile();
const loadingAction = ref(false);
const loading = ref(false);
const deleteLeadPopup = ref(false);
const deleteId = ref<string | null>(null);
const deleting = ref(false);
const pipelineAnalytics = ref<any>(null);

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
async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const response = await deleteDeal(deleteId.value);
    if (response?.success) {
      table.data = table.data.filter((r: any) => r.id !== deleteId.value);
    }
  } finally {
    deleting.value = false;
    deleteLeadPopup.value = false;
  }
}

async function handleBulkDelete() {
  if (!selectedRows.value.length) return;
  try {
    await ElMessageBox.confirm(t('deals.confirmBulkDelete', { count: selectedRows.value.length }), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });
    loading.value = true;
    for (const row of selectedRows.value) {
      await deleteDeal(row.id);
    }
    const res = await useTableFilter('deal');
    table.data = res.formattedData;
    selectedRows.value = [];
    ElNotification({ type: 'success', title: t('common.success'), message: t('deals.bulkDeleted') });
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
    await useApiFetch('deal/export', 'POST', { ids });
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.exportSentToEmail') });
    selectedRows.value = [];
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.exportFailed') });
  } finally {
    loading.value = false;
  }
}

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
const [response, usersResponse] = await Promise.all([useTableFilter('deal'), useApiFetch('users')]);
table.data = response.formattedData;

// Fetch pipeline analytics (non-blocking)
fetchPipelineAnalytics();

const kpiMetrics = computed<KPIMetric[]>(() => {
  const data = table.data || [];
  const total = data.length;
  const wonDeals = data.filter((d: any) => d.stage === 'WON').length;
  // Calculate total revenue from won deals
  const totalRevenue = data
    .filter((d: any) => d.stage === 'WON')
    .reduce((sum: number, d: any) => sum + (Number(d.price) || 0), 0)
    .toLocaleString('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });
  const pending = data.filter((d: any) => d.stage !== 'WON' && d.stage !== 'LOST').length;

  return [
    { label: t('deals.kpi.totalDeals'), value: total, icon: 'ph:handshake-bold', color: '#10b981' },
    { label: t('deals.kpi.dealsWon'), value: wonDeals, icon: 'ph:trophy-bold', color: '#f59e0b' },
    { label: t('deals.kpi.totalRevenue'), value: totalRevenue, icon: 'ph:money-bold', color: '#3b82f6' },
    { label: t('deals.kpi.pendingDeals'), value: pending, icon: 'ph:hourglass-bold', color: '#8b5cf6' }
  ];
});

const pipelineStats = computed(() => {
  const p = pipelineAnalytics.value;
  if (!p) return [];
  const fmtCurrency = (v: number) => Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });
  return [
    { label: t('deals.pipeline.totalValue'), value: fmtCurrency(p.totalPipelineValue || 0), icon: 'ph:funnel-bold', color: '#8b5cf6' },
    { label: t('deals.pipeline.weightedValue'), value: fmtCurrency(p.weightedPipelineValue || 0), icon: 'ph:scales-bold', color: '#3b82f6' },
    { label: t('deals.pipeline.dealCount'), value: p.dealCount ?? 0, icon: 'ph:stack-bold', color: '#10b981' },
    { label: t('deals.pipeline.winRate'), value: Number(p.winRate || 0).toFixed(1) + '%', icon: 'ph:trophy-bold', color: '#f59e0b' }
  ];
});

async function fetchPipelineAnalytics() {
  try {
    const { body, success } = await useApiFetch('deal/analytics/weighted-pipeline');
    if (success && body) {
      pipelineAnalytics.value = body;
    }
  } catch {
    // Pipeline analytics is non-critical
  }
}

function handleRowClick(val: any) {
  router.push(`/sales/deals/${val.id}`);
}

const mappedUsers =
  usersResponse?.body?.docs?.map((e: any) => ({
    label: e.name,
    value: e.id
  })) || [];

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

// SavedViews & AdvancedSearch
const advancedSearchFields = [
  { key: 'name', label: t('deals.table.dealName'), type: 'string' },
  { key: 'stage', label: t('deals.table.stage'), type: 'select', options: dealStageOptions.map((o: any) => ({ value: o.value, label: o.label })) },
  { key: 'price', label: t('deals.table.price'), type: 'number' },
  {
    key: 'contractType',
    label: t('deals.table.contractType'),
    type: 'select',
    options: contractTypeOptions.map((o: any) => ({ value: o.value, label: o.label }))
  },
  { key: 'signatureDate', label: t('deals.table.signatureDate'), type: 'date' },
  { key: 'createdAt', label: t('deals.table.created'), type: 'date' }
];

async function handleApplyView(view: any) {
  if (view?.filters) {
    const res = await useTableFilter('deal', view.filters);
    table.data = res.formattedData;
  }
}

async function handleAdvancedFilter(filterPayload: any) {
  try {
    const res = await useApiFetch('search/advanced/deal', 'POST', filterPayload);
    if (res?.success && res?.body) {
      const data = res.body as any;
      table.data = data.docs || data || [];
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

async function handleClearAdvancedFilter() {
  const res = await useTableFilter('deal');
  table.data = res.formattedData;
}

// Mobile app view
const mobileSearch = ref('');
const mobileStageFilter = ref('ALL');
const mobileRefreshing = ref(false);

const stageFilters = computed(() => {
  const data = table.data || [];
  return [
    { value: 'ALL', label: t('common.all'), color: '#10b981', count: data.length },
    { value: 'PROGRESS', label: t('kanban.stages.progress'), color: '#3b82f6', count: data.filter((d: any) => d.stage === 'PROGRESS').length },
    { value: 'WON', label: t('kanban.stages.won'), color: '#10b981', count: data.filter((d: any) => d.stage === 'WON').length },
    { value: 'LOST', label: t('kanban.stages.lost'), color: '#ef4444', count: data.filter((d: any) => d.stage === 'LOST').length },
    { value: 'CLOSED', label: t('kanban.stages.closed'), color: '#8b5cf6', count: data.filter((d: any) => d.stage === 'CLOSED').length },
    { value: 'CANCELLED', label: t('kanban.stages.cancelled'), color: '#94a3b8', count: data.filter((d: any) => d.stage === 'CANCELLED').length }
  ];
});

function setMobileStageFilter(value: string) {
  mobileStageFilter.value = value;
  vibrate();
}

const mobileFilteredData = computed(() => {
  let data = table.data || [];
  if (mobileStageFilter.value !== 'ALL') {
    data = data.filter((deal: any) => deal.stage === mobileStageFilter.value);
  }
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((deal: any) => {
    const name = (deal.dealDetails?.title || deal.name || '').toLowerCase();
    const assign = (deal.assign || '').toLowerCase();
    const contractType = (deal.contractType || '').toLowerCase();
    const price = String(deal.price || '').toLowerCase();
    return name.includes(q) || assign.includes(q) || contractType.includes(q) || price.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    const res = await useTableFilter('deal');
    table.data = res.formattedData;
    vibrate([10, 30, 10]);
  } finally {
    mobileRefreshing.value = false;
  }
}

function getSwipeRightActions(deal: any) {
  return [{ name: 'kanban', label: t('kanban.kanbanView'), icon: 'ph:columns-bold', color: '#10B981' }];
}

function getSwipeLeftActions(deal: any) {
  const actions = [{ name: 'view', label: t('common.view'), icon: 'ph:eye-bold', color: '#10b981' }];
  if (hasPermission('EDIT_DEALS')) {
    actions.push({ name: 'edit', label: t('common.edit'), icon: 'ph:pencil-simple-bold', color: '#F59E0B' });
  }
  return actions;
}

function handleSwipeAction(name: string, deal: any) {
  vibrate();
  switch (name) {
    case 'kanban':
      navigateTo('/sales/deals/kanban');
      break;
    case 'view':
      navigateTo(`/sales/deals/${deal.id}`);
      break;
    case 'edit':
      navigateTo(`/sales/deals/edit/${deal.id}`);
      break;
  }
}

function getDealInitial(deal: any): string {
  const name = deal.dealDetails?.title || deal.name || '?';
  return name.charAt(0).toUpperCase();
}

function getDealColor(stage: string): string {
  const map: Record<string, string> = {
    PROGRESS: '#3b82f6',
    WON: '#10b981',
    LOST: '#ef4444',
    CLOSED: '#8b5cf6',
    CANCELLED: '#94a3b8',
    NEGOTIATION: '#f59e0b'
  };
  return map[stage] || '#94a3b8';
}

function getStageType(stage: string): string {
  const map: Record<string, string> = {
    PROGRESS: '',
    WON: 'success',
    LOST: 'danger',
    CLOSED: 'primary',
    CANCELLED: 'info',
    NEGOTIATION: 'warning'
  };
  return map[stage] || 'info';
}

function formatPrice(price: any): string {
  const num = Number(price);
  if (isNaN(num)) return String(price);
  return num.toLocaleString('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });
}
</script>

<style lang="scss" scoped>
// Mobile: show card view, hide table
.deals-mobile-view {
  display: none;
}

@media (max-width: 767px) {
  .deals-mobile-view {
    display: block;
  }

  .deals-desktop-view {
    display: none;
  }

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
  .deals-kpi-grid :deep(.premium-kpi-cards) {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
    margin-bottom: 12px !important;
  }

  .deals-kpi-grid :deep(.kpi-card) {
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

  // Deal cards
  .deal-card {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    background: var(--glass-bg, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
    border-radius: 16px;

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
    background: linear-gradient(135deg, #10b981, #34d399);
    color: #fff;
    box-shadow: 0 6px 24px rgba(16, 185, 129, 0.4);
    cursor: pointer;
    z-index: 40;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;

    &:active {
      transform: scale(0.9);
      box-shadow: 0 3px 12px rgba(16, 185, 129, 0.3);
    }
  }
}

// Tablet: keep table but 2-col KPIs
@media (min-width: 768px) and (max-width: 1024px) {
  .deals-kpi-grid :deep(.premium-kpi-cards) {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
