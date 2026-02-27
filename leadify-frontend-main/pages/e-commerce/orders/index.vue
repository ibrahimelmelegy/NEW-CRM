<template lang="pug">
div.animate-fade-in
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.title') || 'Orders' }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('salesOrders.subtitle') || 'Manage sales orders, fulfillment, and delivery tracking' }}
    .flex.items-center.gap-3
      el-button(size="large" @click="exportCSV" class="!rounded-xl")
        Icon(name="ph:download-bold" size="16" class="mr-1")
        | {{ $t('common.export') || 'Export' }}
      el-button(
        type="primary"
        size="large"
        @click="navigateTo('/e-commerce/orders/create')"
        class="!rounded-xl"
      )
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ $t('salesOrders.newOrder') || 'New Order' }}

  //- KPI Cards
  .grid.gap-4.mb-6(class="grid-cols-2 md_grid-cols-4")
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:shopping-cart-bold" size="20" style="color: #7849ff")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ pagination.totalItems }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.totalOrders') || 'Total Orders' }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:clock-bold" size="20" style="color: #f59e0b")
        div
          p.text-2xl.font-bold(style="color: #f59e0b") {{ pendingCount }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.statusDraft') || 'Pending' }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:truck-bold" size="20" style="color: #3b82f6")
        div
          p.text-2xl.font-bold(style="color: #3b82f6") {{ shippedCount }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.shipped') || 'Shipped' }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:currency-circle-dollar-bold" size="20" style="color: #22c55e")
        div
          p.text-2xl.font-bold(style="color: #22c55e") {{ formatCurrency(totalRevenue) }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.total') || 'Revenue' }}

  //- Filter Bar
  .glass-card.p-4.rounded-2xl.mb-6
    .flex.flex-wrap.items-center.gap-3
      el-input(
        v-model="search"
        :placeholder="$t('common.search') || 'Search orders...'"
        clearable
        size="large"
        style="max-width: 300px"
        class="!rounded-xl"
        @input="debouncedLoad"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :start-placeholder="$t('common.from') || 'From'"
        :end-placeholder="$t('common.to') || 'To'"
        size="large"
        value-format="YYYY-MM-DD"
        class="!rounded-xl"
        @change="loadOrders"
      )

  //- Status Tabs
  el-tabs(v-model="statusFilter" @tab-change="onStatusChange" class="orders-tabs")
    el-tab-pane(label="All" name="ALL")
    el-tab-pane(:label="$t('salesOrders.statusDraft') || 'Draft'" name="DRAFT")
    el-tab-pane(:label="$t('salesOrders.statusConfirmed') || 'Confirmed'" name="CONFIRMED")
    el-tab-pane(:label="$t('salesOrders.statusProcessing') || 'Processing'" name="PROCESSING")
    el-tab-pane(:label="$t('salesOrders.statusShipped') || 'Shipped'" name="SHIPPED")
    el-tab-pane(:label="$t('salesOrders.statusDelivered') || 'Delivered'" name="DELIVERED")
    el-tab-pane(:label="$t('salesOrders.statusCancelled') || 'Cancelled'" name="CANCELLED")

  //- Orders Table
  el-table(:data="orders" v-loading="loading" stripe style="width: 100%")
    el-table-column(:label="$t('salesOrders.orderNumber') || 'Order #'" width="160" sortable)
      template(#default="{ row }")
        span.font-mono.font-bold.cursor-pointer(
          style="color: #7849ff"
          @click="navigateTo(`/e-commerce/orders/${row.id}`)"
        ) {{ row.orderNumber || '--' }}
    el-table-column(:label="$t('salesOrders.client') || 'Client'" min-width="160")
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-primary)") {{ row.client?.name || row.clientId || '--' }}
    el-table-column(:label="$t('salesOrders.status') || 'Status'" width="140" align="center")
      template(#default="{ row }")
        el-tag(
          :type="getStatusType(row.status)"
          size="small"
          effect="dark"
          round
        ) {{ row.status || '--' }}
    el-table-column(:label="$t('salesOrders.items') || 'Items'" width="90" align="center")
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-primary)") {{ row.items?.length || 0 }}
    el-table-column(:label="$t('salesOrders.subtotal') || 'Subtotal'" width="130" align="right")
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-primary)") {{ formatCurrency(row.subtotal, row.currency) }}
    el-table-column(:label="$t('salesOrders.taxAmount') || 'Tax'" width="110" align="right")
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-muted)") {{ formatCurrency(row.taxAmount, row.currency) }}
    el-table-column(:label="$t('salesOrders.total') || 'Total'" width="140" align="right" sortable)
      template(#default="{ row }")
        span.text-sm.font-bold(style="color: var(--text-primary)") {{ formatCurrency(row.total, row.currency) }}
    el-table-column(:label="$t('common.date') || 'Date'" width="140" sortable)
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}
    el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center" fixed="right")
      template(#default="{ row }")
        el-dropdown(trigger="click")
          el-button(size="small" class="!rounded-lg")
            Icon(name="ph:dots-three-bold" size="16")
          template(#dropdown)
            el-dropdown-menu
              el-dropdown-item(@click="navigateTo(`/e-commerce/orders/${row.id}`)")
                .flex.items-center.gap-2
                  Icon(name="ph:eye-bold" size="14")
                  span {{ $t('common.view') || 'View' }}
              el-dropdown-item(@click="openStatusDialog(row)")
                .flex.items-center.gap-2
                  Icon(name="ph:swap-bold" size="14")
                  span {{ $t('common.update') || 'Edit Status' }}
              el-dropdown-item(divided @click="deleteOrder(row)")
                .flex.items-center.gap-2(style="color: #ef4444")
                  Icon(name="ph:trash-bold" size="14")
                  span {{ $t('common.delete') || 'Delete' }}

  //- Empty state
  .text-center.py-12(v-if="!orders.length && !loading")
    Icon(name="ph:shopping-cart" size="48" style="color: var(--text-muted)")
    p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') || 'No orders found' }}

  //- Pagination
  .flex.justify-end.mt-4
    el-pagination(
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.limit"
      :total="pagination.totalItems"
      :page-sizes="[10, 25, 50]"
      layout="total, sizes, prev, pager, next"
      @current-change="loadOrders"
      @size-change="onPageSizeChange"
    )

  //- Status Update Dialog
  el-dialog(
    v-model="statusDialogVisible"
    :title="$t('salesOrders.status') || 'Update Status'"
    width="420px"
    :close-on-click-modal="false"
  )
    el-form(label-position="top")
      el-form-item(:label="$t('salesOrders.status') || 'Status'" required)
        el-select(v-model="newStatus" style="width: 100%" size="large")
          el-option(
            v-for="opt in salesOrderStatusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          )
    template(#footer)
      el-button(@click="statusDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="saving" @click="confirmStatusUpdate") {{ $t('common.confirm') || 'Confirm' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessageBox } from 'element-plus';
import {
  getSalesOrders,
  updateSalesOrderStatus,
  SalesOrderStatusEnum,
  salesOrderStatusOptions
} from '~/composables/useSalesOrders';
import type { SalesOrder } from '~/composables/useSalesOrders';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// State
const loading = ref(false);
const saving = ref(false);
const orders = ref<SalesOrder[]>([]);
const search = ref('');
const statusFilter = ref('ALL');
const dateRange = ref<string[]>([]);
const pagination = reactive({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1
});

// Status dialog
const statusDialogVisible = ref(false);
const selectedOrder = ref<SalesOrder | null>(null);
const newStatus = ref(SalesOrderStatusEnum.DRAFT);

// Debounce for search
let searchTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedLoad() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    pagination.page = 1;
    loadOrders();
  }, 400);
}

// KPI computed
const pendingCount = computed(() =>
  orders.value.filter(o => o.status === SalesOrderStatusEnum.DRAFT || o.status === SalesOrderStatusEnum.CONFIRMED).length
);
const shippedCount = computed(() =>
  orders.value.filter(o => o.status === SalesOrderStatusEnum.SHIPPED).length
);
const totalRevenue = computed(() =>
  orders.value.reduce((sum, o) => sum + (o.total || 0), 0)
);

// Helpers
function getStatusType(status?: string): string {
  const map: Record<string, string> = {
    DRAFT: 'info',
    CONFIRMED: '',
    PROCESSING: 'warning',
    SHIPPED: '',
    DELIVERED: 'success',
    CANCELLED: 'danger'
  };
  return map[status || ''] || 'info';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount?: number, currency?: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

// Data loading
async function loadOrders() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.set('page', String(pagination.page));
    params.set('limit', String(pagination.limit));
    if (search.value.trim()) params.set('search', search.value.trim());
    if (statusFilter.value && statusFilter.value !== 'ALL') params.set('status', statusFilter.value);
    if (dateRange.value?.length === 2) {
      params.set('startDate', dateRange.value[0]);
      params.set('endDate', dateRange.value[1]);
    }
    const result = await getSalesOrders(params.toString());
    orders.value = result.orders;
    pagination.totalItems = result.pagination.totalItems;
    pagination.totalPages = result.pagination.totalPages;
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
}

function onStatusChange() {
  pagination.page = 1;
  loadOrders();
}

function onPageSizeChange() {
  pagination.page = 1;
  loadOrders();
}

// Status update
function openStatusDialog(order: SalesOrder) {
  selectedOrder.value = order;
  newStatus.value = (order.status as SalesOrderStatusEnum) || SalesOrderStatusEnum.DRAFT;
  statusDialogVisible.value = true;
}

async function confirmStatusUpdate() {
  if (!selectedOrder.value?.id) return;
  saving.value = true;
  try {
    const result = await updateSalesOrderStatus(selectedOrder.value.id, newStatus.value);
    if (result) {
      statusDialogVisible.value = false;
      await loadOrders();
    }
  } finally {
    saving.value = false;
  }
}

// Delete
async function deleteOrder(order: SalesOrder) {
  try {
    await ElMessageBox.confirm(
      t('common.deleteConfirm') || 'Are you sure you want to delete this order?',
      t('common.warning') || 'Warning',
      { type: 'warning' }
    );
    await useApiFetch(`sales-orders/${order.id}`, 'DELETE');
    await loadOrders();
  } catch {
    // cancelled
  }
}

// Export CSV
function exportCSV() {
  if (!orders.value.length) return;
  const headers = ['Order #', 'Client', 'Status', 'Items', 'Subtotal', 'Tax', 'Total', 'Currency', 'Date'];
  const rows = orders.value.map(o => [
    o.orderNumber || '',
    o.client?.name || o.clientId || '',
    o.status || '',
    String(o.items?.length || 0),
    String(o.subtotal || 0),
    String(o.taxAmount || 0),
    String(o.total || 0),
    o.currency || 'SAR',
    o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : ''
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

onMounted(() => {
  loadOrders();
});
</script>

<style lang="scss" scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.orders-tabs {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;

  :deep(.el-tabs__header) {
    background: transparent;
    border-bottom: 1px solid var(--border-default);
  }

  :deep(.el-tabs__content) {
    padding: 16px 0;
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted);

    &.is-active {
      color: #7849ff;
    }
  }
}
</style>
