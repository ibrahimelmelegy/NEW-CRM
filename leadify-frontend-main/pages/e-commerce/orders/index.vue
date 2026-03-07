<template lang="pug">
div.animate-fade-in
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('salesOrders.subtitle') }}
    .flex.items-center.gap-3
      el-button(size="large" @click="exportCSV" class="!rounded-xl")
        Icon(name="ph:download-bold" size="16" class="mr-1")
        | {{ $t('common.export') }}
      el-button(
        type="primary"
        size="large"
        @click="navigateTo('/e-commerce/orders/create')"
        class="!rounded-xl"
      )
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ $t('salesOrders.newOrder') }}

  //- KPI Cards
  .grid.gap-4.mb-6(class="grid-cols-2 md_grid-cols-4")
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:shopping-cart-bold" size="20" style="color: #7849ff")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ pagination.totalItems }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.totalOrders') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:clock-bold" size="20" style="color: #f59e0b")
        div
          p.text-2xl.font-bold(style="color: #f59e0b") {{ pendingCount }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.statusDraft') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:truck-bold" size="20" style="color: #3b82f6")
        div
          p.text-2xl.font-bold(style="color: #3b82f6") {{ shippedCount }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.shipped') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:currency-circle-dollar-bold" size="20" style="color: #22c55e")
        div
          p.text-2xl.font-bold(style="color: #22c55e") {{ formatCurrency(totalRevenue) }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.total') }}

  //- Filter Bar
  .glass-card.p-4.rounded-2xl.mb-6
    .flex.flex-wrap.items-center.gap-3
      el-input(
        v-model="search"
        :placeholder="$t('common.search')"
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
        :start-placeholder="$t('common.from')"
        :end-placeholder="$t('common.to')"
        size="large"
        value-format="YYYY-MM-DD"
        class="!rounded-xl"
        @change="loadOrders"
      )

  //- Status Tabs
  el-tabs(v-model="statusFilter" @tab-change="onStatusChange" class="orders-tabs")
    el-tab-pane(:label="$t('tickets.all')" name="ALL")
    el-tab-pane(:label="$t('salesOrders.statusDraft')" name="DRAFT")
    el-tab-pane(:label="$t('salesOrders.statusConfirmed')" name="CONFIRMED")
    el-tab-pane(:label="$t('salesOrders.statusProcessing')" name="PROCESSING")
    el-tab-pane(:label="$t('salesOrders.statusShipped')" name="SHIPPED")
    el-tab-pane(:label="$t('salesOrders.statusDelivered')" name="DELIVERED")
    el-tab-pane(:label="$t('salesOrders.statusCancelled')" name="CANCELLED")

  //- Bulk Actions Bar
  .flex.items-center.gap-2.mb-3(v-if="selectedRows.length")
    span.text-sm.font-medium(style="color: var(--text-primary)") {{ selectedRows.length }} {{ $t('common.selected') }}
    el-button(size="small" type="danger" @click="bulkDelete" class="!rounded-xl")
      Icon(name="ph:trash-bold" size="14")
      span.ml-1 {{ $t('common.delete') }}
    el-button(size="small" @click="bulkMarkShipped" class="!rounded-xl")
      Icon(name="ph:truck-bold" size="14")
      span.ml-1 {{ $t('salesOrders.shipped') }}
    el-button(size="small" @click="bulkMarkDelivered" class="!rounded-xl")
      Icon(name="ph:check-circle-bold" size="14")
      span.ml-1 {{ $t('salesOrders.statusDelivered') }}
    el-button(size="small" @click="exportSelectedCSV" class="!rounded-xl")
      Icon(name="ph:download-bold" size="14")
      span.ml-1 {{ $t('common.export') }}

  //- Orders Table
  el-table(:data="orders" v-loading="loading" stripe style="width: 100%" @selection-change="handleSelectionChange")
    el-table-column(type="selection" width="40")
    el-table-column(:label="$t('salesOrders.orderNumber')" width="160" sortable)
      template(#default="{ row }")
        span.font-mono.font-bold.cursor-pointer(
          style="color: #7849ff"
          @click="navigateTo(`/e-commerce/orders/${row.id}`)"
        ) {{ row.orderNumber || '--' }}
    el-table-column(:label="$t('salesOrders.client')" min-width="160")
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-primary)") {{ row.client?.clientName || row.client?.name || row.clientId || '--' }}
    el-table-column(:label="$t('salesOrders.status')" width="140" align="center")
      template(#default="{ row }")
        el-tag(
          :type="getStatusType(row.status)"
          size="small"
          effect="dark"
          round
        ) {{ row.status || '--' }}
    el-table-column(:label="$t('salesOrders.paymentStatus')" width="130" align="center")
      template(#default="{ row }")
        el-tag(
          v-if="row.paymentStatus"
          :type="getPaymentStatusType(row.paymentStatus)"
          size="small"
          effect="plain"
          round
        ) {{ row.paymentStatus }}
        span.text-sm(v-else style="color: var(--text-muted)") --
    el-table-column(:label="$t('salesOrders.items')" width="90" align="center")
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-primary)") {{ row.items?.length || 0 }}
    el-table-column(:label="$t('salesOrders.subtotal')" width="130" align="right")
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-primary)") {{ formatCurrency(row.subtotal, row.currency) }}
    el-table-column(:label="$t('salesOrders.taxAmount')" width="110" align="right")
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-muted)") {{ formatCurrency(row.taxAmount, row.currency) }}
    el-table-column(:label="$t('salesOrders.total')" width="140" align="right" sortable)
      template(#default="{ row }")
        span.text-sm.font-bold(style="color: var(--text-primary)") {{ formatCurrency(row.total, row.currency) }}
    el-table-column(:label="$t('common.date')" width="140" sortable)
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}
    el-table-column(:label="$t('common.actions')" width="120" align="center" fixed="right")
      template(#default="{ row }")
        el-dropdown(trigger="click")
          el-button(size="small" class="!rounded-lg")
            Icon(name="ph:dots-three-bold" size="16")
          template(#dropdown)
            el-dropdown-menu
              el-dropdown-item(@click="navigateTo(`/e-commerce/orders/${row.id}`)")
                .flex.items-center.gap-2
                  Icon(name="ph:eye-bold" size="14")
                  span {{ $t('common.view') }}
              el-dropdown-item(@click="openStatusDialog(row)")
                .flex.items-center.gap-2
                  Icon(name="ph:swap-bold" size="14")
                  span {{ $t('common.update') }}
              el-dropdown-item(divided @click="deleteOrder(row)")
                .flex.items-center.gap-2(style="color: #ef4444")
                  Icon(name="ph:trash-bold" size="14")
                  span {{ $t('common.delete') }}

  //- Empty state
  .text-center.py-12(v-if="!orders.length && !loading")
    Icon(name="ph:shopping-cart" size="48" style="color: var(--text-muted)")
    p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

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
    :title="$t('salesOrders.status')"
    width="420px"
    :close-on-click-modal="false"
  )
    el-form(label-position="top")
      el-form-item(:label="$t('salesOrders.status')" required)
        el-select(v-model="newStatus" style="width: 100%" size="large")
          el-option(
            v-for="opt in salesOrderStatusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          )
    template(#footer)
      el-button(@click="statusDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="confirmStatusUpdate") {{ $t('common.confirm') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getSalesOrders,
  updateSalesOrderStatus,
  deleteSalesOrder,
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

// Bulk Selection
const selectedRows = ref<Record<string, unknown>[]>([]);
const handleSelectionChange = (rows: Record<string, unknown>[]) => {
  selectedRows.value = rows;
};
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
const pendingCount = computed(
  () => orders.value.filter(o => o.status === SalesOrderStatusEnum.DRAFT || o.status === SalesOrderStatusEnum.CONFIRMED).length
);
const shippedCount = computed(() => orders.value.filter(o => o.status === SalesOrderStatusEnum.SHIPPED).length);
const totalRevenue = computed(() => orders.value.reduce((sum, o) => sum + (o.total || 0), 0));

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

function getPaymentStatusType(status?: string): string {
  const map: Record<string, string> = {
    PENDING: 'warning',
    PAID: 'success',
    PARTIAL: 'info',
    REFUNDED: 'danger'
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
    if (search.value.trim()) params.set('searchKey', search.value.trim());
    if (statusFilter.value && statusFilter.value !== 'ALL') params.set('status', statusFilter.value);
    if (dateRange.value?.length === 2) {
      params.set('startDate', dateRange.value[0] as unknown);
      params.set('endDate', dateRange.value[1] as unknown);
    }
    const result = await getSalesOrders(params.toString());
    orders.value = result.orders;
    pagination.totalItems = result.pagination.totalItems;
    pagination.totalPages = result.pagination.totalPages;
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
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
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.warning'), { type: 'warning' });
    const success = await deleteSalesOrder(order.id!);
    if (success) await loadOrders();
  } catch {
    // cancelled
  }
}

// Bulk Actions
async function bulkDelete() {
  if (!selectedRows.value.length) return;
  try {
    await ElMessageBox.confirm(t('common.confirmBulkDelete', { count: selectedRows.value.length }), t('common.warning'), { type: 'warning' });
    for (const row of selectedRows.value) {
      await deleteSalesOrder(row.id);
    }
    selectedRows.value = [];
    await loadOrders();
    ElMessage.success(t('common.deleted'));
  } catch {
    // User cancelled
  }
}

async function bulkMarkShipped() {
  if (!selectedRows.value.length) return;
  try {
    await ElMessageBox.confirm(`Mark ${selectedRows.value.length} order(s) as shipped?`, t('common.warning'), { type: 'warning' });
    for (const row of selectedRows.value) {
      await updateSalesOrderStatus(row.id, SalesOrderStatusEnum.SHIPPED);
    }
    selectedRows.value = [];
    await loadOrders();
    ElMessage.success(t('common.saved'));
  } catch {
    // User cancelled
  }
}

async function bulkMarkDelivered() {
  if (!selectedRows.value.length) return;
  try {
    await ElMessageBox.confirm(`Mark ${selectedRows.value.length} order(s) as delivered?`, t('common.warning'), { type: 'warning' });
    for (const row of selectedRows.value) {
      await updateSalesOrderStatus(row.id, SalesOrderStatusEnum.DELIVERED);
    }
    selectedRows.value = [];
    await loadOrders();
    ElMessage.success(t('common.saved'));
  } catch {
    // User cancelled
  }
}

function exportSelectedCSV() {
  const data = selectedRows.value.length ? selectedRows.value : orders.value;
  if (!data.length) return;
  const headers = ['Order #', 'Client', 'Status', 'Items', 'Subtotal', 'Tax', 'Total', 'Currency', 'Date'];
  const rows = data.map(o => [
    o.orderNumber || '',
    o.client?.clientName || o.client?.name || o.clientId || '',
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
  ElMessage.success(t('common.exported'));
}

// Export CSV
function exportCSV() {
  if (!orders.value.length) return;
  const headers = ['Order #', 'Client', 'Status', 'Items', 'Subtotal', 'Tax', 'Total', 'Currency', 'Date'];
  const rows = orders.value.map(o => [
    o.orderNumber || '',
    o.client?.clientName || o.client?.name || o.clientId || '',
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
