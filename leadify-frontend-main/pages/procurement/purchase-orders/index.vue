<template lang="pug">
div
  ModuleHeader(
    :title="$t('procurement.purchaseOrders.title')"
    :subtitle="$t('procurement.subtitle')"
  )
    template(#actions)
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'purchase-orders-export'" :title="$t('procurement.purchaseOrders.title')")
      NuxtLink(to="/procurement/purchase-orders/create")
        el-button(
          size='large',
          type="primary",
          :icon="Plus",
          class="!rounded-2xl"
        ) {{ $t('procurement.purchaseOrders.create') }}

  .glass-card.p-4(class="!rounded-3xl shadow-glow")
    el-tabs.mb-4(v-model="activeTab" @tab-change="handleTabChange" class="premium-tabs")
        el-tab-pane(:label="$t('procurement.purchaseOrders.activeOrders')" name="active")
        el-tab-pane(:label="$t('procurement.purchaseOrders.archived')" name="archived")

    //- Desktop Table
    .po-desktop-view
      AppTable(
        v-slot="{data}",
        :columns="table.columns",
        position="procurement",
        :pageInfo="response.pagination",
        :data="table.data",
        :searchPlaceholder="$t('procurement.purchaseOrders.title')",
        @handleRowClick="handleRowClick",
        class="premium-table"
      )
        .flex.items-center.py-2(@click.stop)
          el-dropdown(class="outline-0", trigger="click")
            span(class="el-dropdown-link")
              .toggle-icon.text-md.hover-scale
                Icon(name="ph:dots-three-outline-vertical-fill", size="20", class="text-purple-400")
            template(#dropdown='')
              el-dropdown-menu(class="glass-dropdown")
                el-dropdown-item
                  NuxtLink.flex.items-center.gap-2(:to="`/procurement/purchase-orders/${data?.id}`")
                    Icon.text-md(name="IconEye")
                    p.text-sm {{ $t('common.viewDetails') }}

  //- Mobile Card View
  .po-mobile-view
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('procurement.purchaseOrders.title')}`" clearable class="!rounded-xl")
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
          v-for="po in mobileFilteredData"
          :key="po.id"
          :leftActions="[{ name: 'view', label: 'View Details', icon: 'ph:eye-bold', color: '#f59e0b' }]"
          @action="(name) => handleSwipeAction(name, po)"
        )
          .entity-card.p-4(@click="handleRowClick(po)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: '#f59e0b20', color: '#f59e0b' }"
                )
                  Icon(name="ph:file-text" size="18")
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ po.poNumber || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ po.vendor?.name || po['vendor.name'] || '' }}
              el-tag.shrink-0(:type="getPoTagType(po.status)" size="small" effect="dark" round) {{ po.status || '--' }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="po.project?.name || po['project.name']")
                Icon(name="ph:buildings" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ po.project?.name || po['project.name'] }}
              .flex.items-center.gap-2(v-if="po.totalAmount != null")
                Icon(name="ph:currency-circle-dollar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate.font-bold(style="color: var(--text-secondary)") {{ po.totalAmount }}
              .flex.items-center.gap-2(v-if="po.createdAt")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ po.createdAt }}

      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:file-text" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('procurement.purchaseOrders.title').toLowerCase() }}
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';

import { useI18n } from 'vue-i18n';

const { hasPermission } = await usePermissions();
const response = await useTableFilter('procurement');
const { t } = useI18n();

// Export columns
const exportColumns = [
  { prop: 'poNumber', label: t('procurement.purchaseOrders.poNumber') },
  { prop: 'vendor.name', label: t('procurement.purchaseOrders.vendor') },
  { prop: 'project.name', label: t('procurement.purchaseOrders.project') },
  { prop: 'status', label: t('procurement.purchaseOrders.status') },
  { prop: 'totalAmount', label: t('procurement.purchaseOrders.amount') },
  { prop: 'createdAt', label: t('procurement.purchaseOrders.date') }
];

const table = reactive({
  columns: [
    { prop: 'poNumber', label: t('procurement.purchaseOrders.poNumber'), component: 'Text', sortable: true, type: 'font-bold', width: 180 },
    { prop: 'vendor.name', label: t('procurement.purchaseOrders.vendor'), component: 'Text', sortable: false, type: 'font-default', width: 200 },
    { prop: 'project.name', label: t('procurement.purchaseOrders.project'), component: 'Text', sortable: false, type: 'font-default', width: 200 },
    { prop: 'status', label: t('procurement.purchaseOrders.status'), component: 'Label', sortable: true, type: 'outline', width: 140 },
    { prop: 'totalAmount', label: t('procurement.purchaseOrders.amount'), component: 'Text', sortable: true, type: 'font-bold', width: 150 },
    { prop: 'createdAt', label: t('procurement.purchaseOrders.date'), component: 'Text', sortable: true, type: 'font-default', width: 180 }
  ],
  data: response.formattedData
});

const activeTab = ref('active');
const router = useRouter();

function handleRowClick(val: unknown) {
  router.push(`/procurement/purchase-orders/${val.id}`);
}

async function handleTabChange(_tab: string) {
  // Reload data when tab changes (can be extended to filter by archived status)
  const res = await useTableFilter('procurement');
  table.data = res.formattedData;
}

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileStatusFilter = ref('ALL');
const mobileRefreshing = ref(false);

const mobileFilters = computed(() => {
  const data = table.data || [];
  const statuses = [...new Set(data.map(po => po.status).filter(Boolean))] as string[];
  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    APPROVED: '#10b981',
    REJECTED: '#ef4444',
    DRAFT: '#94a3b8',
    SENT: '#3b82f6',
    RECEIVED: '#8b5cf6',
    CANCELLED: '#ef4444'
  };
  return [
    { value: 'ALL', label: t('common.all'), color: '#f59e0b', count: data.length },
    ...statuses.map((s: string) => ({
      value: s,
      label: s.charAt(0) + s.slice(1).toLowerCase(),
      color: statusColors[s] || '#94a3b8',
      count: data.filter(po => po.status === s).length
    }))
  ];
});

const mobileFilteredData = computed(() => {
  let data = table.data || [];
  if (mobileStatusFilter.value !== 'ALL') {
    data = data.filter(po => po.status === mobileStatusFilter.value);
  }
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter(po => {
    const poNum = (po.poNumber || '').toLowerCase();
    const vendor = (po.vendor?.name || po['vendor.name'] || '').toLowerCase();
    const project = (po.project?.name || po['project.name'] || '').toLowerCase();
    return poNum.includes(q) || vendor.includes(q) || project.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    const res = await useTableFilter('procurement');
    table.data = res.formattedData;
    vibrate([10, 30, 10]);
  } finally {
    mobileRefreshing.value = false;
  }
}

function handleSwipeAction(name: string, po: unknown) {
  vibrate();
  if (name === 'view') navigateTo(`/procurement/purchase-orders/${po.id}`);
}

function getPoTagType(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    DRAFT: 'info',
    SENT: '',
    RECEIVED: 'success',
    CANCELLED: 'danger'
  };
  return map[status] || 'info';
}
</script>

<style scoped lang="scss">
@include mobile-list-page('po', #f59e0b);

.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.premium-table {
  :deep(.el-table) {
    background: transparent !important;
    --el-table-bg-color: transparent;
    --el-table-tr-bg-color: transparent;

    th.el-table__cell {
      background: rgba(168, 85, 247, 0.05) !important;
      color: var(--text-secondary);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1px;
    }

    td.el-table__cell {
      border-bottom: 1px solid rgba(168, 85, 247, 0.05) !important;
      padding: 16px 0;
    }

    .el-tag {
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      padding: 4px 10px;
      border: none;
      &.el-tag--success {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
      }
      &.el-tag--warning {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
        box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
      }
      &.el-tag--danger {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
      }
    }
  }
}

.hover-scale {
  transition: transform 0.2s ease;
  cursor: pointer;
  &:hover {
    transform: scale(1.2);
  }
}

.glass-dropdown {
  background: rgba(30, 18, 48, 0.9) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 12px;
}
</style>
