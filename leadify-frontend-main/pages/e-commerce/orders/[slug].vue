<template lang="pug">
div.animate-fade-in(v-loading="loading")
  //- Breadcrumb
  el-breadcrumb.mb-4(separator="/")
    el-breadcrumb-item(:to="{ path: '/' }") {{ $t('common.home') }}
    el-breadcrumb-item(:to="{ path: '/e-commerce/orders' }") {{ $t('salesOrders.title') }}
    el-breadcrumb-item {{ order.orderNumber || '...' }}

  //- Header Row
  .flex.items-center.justify-between.mb-6
    .flex.items-center.gap-4
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ order.orderNumber || '--' }}
      el-tag(
        v-if="order.status"
        :type="getStatusType(order.status)"
        size="large"
        effect="dark"
        round
      ) {{ order.status }}
      el-tag(
        v-if="order.paymentStatus"
        :type="getPaymentStatusType(order.paymentStatus)"
        size="large"
        effect="plain"
        round
      )
        Icon(name="ph:credit-card-bold" size="14" class="mr-1")
        | {{ order.paymentStatus }}
    .flex.items-center.gap-3
      el-button(size="large" @click="navigateTo('/e-commerce/orders')" class="!rounded-xl")
        Icon(name="ph:arrow-left-bold" size="16" class="mr-1")
        | {{ $t('common.back') }}
      el-button(size="large" @click="printOrder" class="!rounded-xl")
        Icon(name="ph:printer-bold" size="16" class="mr-1")
        | {{ $t('common.print') }}
      el-button(size="large" @click="openPaymentStatusDialog" class="!rounded-xl")
        Icon(name="ph:credit-card-bold" size="16" class="mr-1")
        | {{ $t('salesOrders.paymentStatus') }}
      el-button(type="primary" size="large" @click="openStatusDialog" class="!rounded-xl")
        Icon(name="ph:swap-bold" size="16" class="mr-1")
        | {{ $t('salesOrders.status') }}

  //- Status Timeline
  .glass-card.p-5.rounded-2xl.mb-6(v-if="order.status")
    .flex.items-center.gap-1
      .flex-1(v-for="(step, idx) in statusSteps" :key="step.value")
        .relative
          .h-2.rounded-full.transition-all.duration-300(
            :style="{ backgroundColor: getStepColor(step, idx) }"
          )
          .text-center.mt-2
            .text-xs.font-medium(:style="{ color: isStepActive(step, idx) ? '#7849ff' : 'var(--text-muted)' }") {{ step.label }}

  //- Order Info Cards Row
  .grid.gap-6.mb-6(class="grid-cols-1 md_grid-cols-2")
    //- Left: Order Details
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default)")
      template(#header)
        .flex.items-center.gap-2
          Icon(name="ph:file-text-bold" size="18" style="color: #7849ff")
          span.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.title') }}
      .grid.gap-4(class="grid-cols-2")
        div
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.orderNumber') }}
          p.text-sm.font-semibold.font-mono(style="color: var(--text-primary)") {{ order.orderNumber || '--' }}
        div
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.status') }}
          el-tag(
            v-if="order.status"
            :type="getStatusType(order.status)"
            size="small"
            effect="dark"
            round
          ) {{ order.status }}
          span.text-sm(v-else style="color: var(--text-primary)") --
        div
          p.text-xs(style="color: var(--text-muted)") {{ $t('common.date') }}
          p.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatDate(order.createdAt) }}
        div
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.paymentStatus') }}
          el-tag(
            v-if="order.paymentStatus"
            :type="getPaymentStatusType(order.paymentStatus)"
            size="small"
            effect="dark"
            round
          ) {{ order.paymentStatus }}
          span.text-sm(v-else style="color: var(--text-primary)") --
        div
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.paymentTerms') }}
          p.text-sm.font-semibold(style="color: var(--text-primary)") {{ order.paymentTerms || '--' }}
        div
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.currency') }}
          p.text-sm.font-semibold(style="color: var(--text-primary)") {{ order.currency || 'SAR' }}
      .mt-4(v-if="order.notes")
        p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.notes') }}
        p.text-sm.mt-1(style="color: var(--text-primary)") {{ order.notes }}

    //- Right: Client Info
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default)")
      template(#header)
        .flex.items-center.gap-2
          Icon(name="ph:user-bold" size="18" style="color: #7849ff")
          span.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.client') }}
      .grid.gap-4
        div
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.client') }}
          NuxtLink.text-sm.font-semibold.underline(
            v-if="order.client?.id"
            :to="`/sales/clients/${order.client.id}`"
            style="color: #7849ff"
          ) {{ order.client.clientName || order.client.name || '--' }}
          p.text-sm.font-semibold(v-else style="color: var(--text-primary)") {{ order.client?.clientName || order.client?.name || order.clientId || '--' }}
        div
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.shippingAddress') }}
          p.text-sm.font-semibold(style="color: var(--text-primary)") {{ order.shippingAddress || '--' }}

  //- Line Items Section
  el-card.rounded-2xl.mb-6(shadow="never" style="border: 1px solid var(--border-default)")
    template(#header)
      .flex.items-center.gap-2
        Icon(name="ph:list-bullets-bold" size="18" style="color: #7849ff")
        span.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.items') }}
    el-table(:data="order.items || []" stripe style="width: 100%")
      el-table-column(label="#" width="60" align="center")
        template(#default="{ $index }") {{ $index + 1 }}
      el-table-column(:label="$t('salesOrders.description')" min-width="200")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-primary)") {{ row.description || '--' }}
      el-table-column(:label="$t('salesOrders.quantity')" width="100" align="center")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-primary)") {{ row.quantity || 0 }}
      el-table-column(:label="$t('salesOrders.unitPrice')" width="130" align="right")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-primary)") {{ formatCurrency(row.unitPrice) }}
      el-table-column(:label="$t('salesOrders.taxRate')" width="100" align="center")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-muted)") {{ row.taxRate || 0 }}%
      el-table-column(:label="$t('salesOrders.discountRate')" width="110" align="center")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-muted)") {{ row.discountRate || 0 }}%
      el-table-column(:label="$t('salesOrders.lineTotal')" width="140" align="right")
        template(#default="{ row }")
          span.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatCurrency(row.lineTotal) }}

    //- Totals Footer
    .flex.justify-end.mt-4
      .w-72
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--border-default)")
          span.text-sm(style="color: var(--text-muted)") {{ $t('salesOrders.subtotal') }}
          span.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatCurrency(order.subtotal) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--border-default)")
          span.text-sm(style="color: var(--text-muted)") {{ $t('salesOrders.taxAmount') }}
          span.text-sm(style="color: var(--text-primary)") {{ formatCurrency(order.taxAmount) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--border-default)")
          span.text-sm(style="color: var(--text-muted)") {{ $t('salesOrders.discountAmount') }}
          span.text-sm(style="color: var(--text-primary)") -{{ formatCurrency(order.discountAmount) }}
        .flex.justify-between.py-3
          span.text-base.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.total') }}
          span.text-base.font-bold(style="color: #7849ff") {{ formatCurrency(order.total, order.currency) }}

  //- Fulfillment Section
  el-card.rounded-2xl.mb-6(shadow="never" style="border: 1px solid var(--border-default)")
    template(#header)
      .flex.items-center.justify-between
        .flex.items-center.gap-2
          Icon(name="ph:package-bold" size="18" style="color: #7849ff")
          span.font-bold(style="color: var(--text-primary)") {{ $t('salesOrders.fulfillment') }}
        el-button(type="primary" size="small" @click="openAddFulfillment" class="!rounded-lg")
          Icon(name="ph:plus-bold" size="14" class="mr-1")
          | {{ $t('salesOrders.addFulfillment') }}

    //- Fulfillment list
    .space-y-4(v-if="order.fulfillments?.length")
      .p-4.rounded-xl(
        v-for="(ful, idx) in order.fulfillments"
        :key="ful.id || idx"
        style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
      )
        .flex.items-center.justify-between.mb-3
          .flex.items-center.gap-3
            .w-8.h-8.rounded-lg.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
              Icon(name="ph:truck-bold" size="16" style="color: #7849ff")
            span.font-semibold.text-sm(style="color: var(--text-primary)") {{ ($t('salesOrders.fulfillment')) + ' #' + (idx + 1) }}
          .flex.items-center.gap-2
            el-tag(
              :type="getFulfillmentStatusType(ful.status)"
              size="small"
              effect="dark"
              round
            ) {{ ful.status || '--' }}
            el-button(size="small" @click="openEditFulfillment(ful)" class="!rounded-lg")
              Icon(name="ph:pencil-bold" size="14")
        .grid.gap-3(class="grid-cols-2 md_grid-cols-4")
          div
            p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.carrier') }}
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ ful.carrier || '--' }}
          div
            p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.trackingNumber') }}
            p.text-sm.font-semibold.font-mono(style="color: var(--text-primary)") {{ ful.trackingNumber || '--' }}
          div
            p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.shippedDate') }}
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatDate(ful.shippedDate) }}
          div
            p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.deliveredDate') }}
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatDate(ful.deliveredDate) }}
        .mt-2(v-if="ful.notes")
          p.text-xs(style="color: var(--text-muted)") {{ $t('salesOrders.notes') }}
          p.text-sm(style="color: var(--text-primary)") {{ ful.notes }}

    //- Empty fulfillment
    .text-center.py-8(v-else)
      Icon(name="ph:package" size="40" style="color: var(--text-muted)")
      p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

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

  //- Payment Status Update Dialog
  el-dialog(
    v-model="paymentStatusDialogVisible"
    :title="$t('salesOrders.paymentStatus')"
    width="420px"
    :close-on-click-modal="false"
  )
    el-form(label-position="top")
      el-form-item(:label="$t('salesOrders.paymentStatus')" required)
        el-select(v-model="newPaymentStatus" style="width: 100%" size="large")
          el-option(
            v-for="opt in paymentStatusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          )
    template(#footer)
      el-button(@click="paymentStatusDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="confirmPaymentStatusUpdate") {{ $t('common.confirm') }}

  //- Add Fulfillment Dialog
  el-dialog(
    v-model="addFulDialogVisible"
    :title="$t('salesOrders.addFulfillment')"
    width="550px"
    :close-on-click-modal="false"
  )
    el-form(:model="fulfillmentForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md_grid-cols-2")
        el-form-item(:label="$t('salesOrders.carrier')")
          el-input(v-model="fulfillmentForm.carrier" :placeholder="$t('salesOrders.carrier')")
        el-form-item(:label="$t('salesOrders.trackingNumber')")
          el-input(v-model="fulfillmentForm.trackingNumber" :placeholder="$t('salesOrders.trackingNumber')")
      el-form-item(:label="$t('salesOrders.status')")
        el-select(v-model="fulfillmentForm.status" style="width: 100%")
          el-option(
            v-for="opt in fulfillmentStatusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          )
      el-form-item(:label="$t('salesOrders.notes')")
        el-input(v-model="fulfillmentForm.notes" type="textarea" :rows="3" :placeholder="$t('salesOrders.notes')")
    template(#footer)
      el-button(@click="addFulDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="confirmAddFulfillment") {{ $t('common.save') }}

  //- Edit Fulfillment Dialog
  el-dialog(
    v-model="editFulDialogVisible"
    :title="$t('salesOrders.fulfillment')"
    width="550px"
    :close-on-click-modal="false"
  )
    el-form(:model="editFulForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md_grid-cols-2")
        el-form-item(:label="$t('salesOrders.carrier')")
          el-input(v-model="editFulForm.carrier" :placeholder="$t('salesOrders.carrier')")
        el-form-item(:label="$t('salesOrders.trackingNumber')")
          el-input(v-model="editFulForm.trackingNumber" :placeholder="$t('salesOrders.trackingNumber')")
      el-form-item(:label="$t('salesOrders.status')")
        el-select(v-model="editFulForm.status" style="width: 100%")
          el-option(
            v-for="opt in fulfillmentStatusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          )
      .grid.gap-4(class="grid-cols-1 md_grid-cols-2")
        el-form-item(:label="$t('salesOrders.shippedDate')")
          el-date-picker(
            v-model="editFulForm.shippedDate"
            type="date"
            :placeholder="$t('common.select')"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          )
        el-form-item(:label="$t('salesOrders.deliveredDate')")
          el-date-picker(
            v-model="editFulForm.deliveredDate"
            type="date"
            :placeholder="$t('common.select')"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          )
      el-form-item(:label="$t('salesOrders.notes')")
        el-input(v-model="editFulForm.notes" type="textarea" :rows="3" :placeholder="$t('salesOrders.notes')")
    template(#footer)
      el-button(@click="editFulDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="confirmEditFulfillment") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getSalesOrderById,
  updateSalesOrderStatus,
  updatePaymentStatus,
  addFulfillment,
  updateFulfillment,
  SalesOrderStatusEnum,
  PaymentStatusEnum,
  FulfillmentStatusEnum,
  salesOrderStatusOptions,
  paymentStatusOptions,
  fulfillmentStatusOptions
} from '~/composables/useSalesOrders';
import type { SalesOrder, Fulfillment } from '~/composables/useSalesOrders';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const route = useRoute();

const orderId = computed(() => route.params.slug as string);

// State
const loading = ref(false);
const saving = ref(false);
const order = ref<SalesOrder>({} as SalesOrder);

// Status dialog
const statusDialogVisible = ref(false);
const newStatus = ref(SalesOrderStatusEnum.DRAFT);

// Payment status dialog
const paymentStatusDialogVisible = ref(false);
const newPaymentStatus = ref(PaymentStatusEnum.PENDING);

// Fulfillment dialogs
const addFulDialogVisible = ref(false);
const editFulDialogVisible = ref(false);
const editingFulId = ref('');

const fulfillmentForm = reactive({
  carrier: '',
  trackingNumber: '',
  status: FulfillmentStatusEnum.PENDING as string,
  notes: ''
});

const editFulForm = reactive({
  carrier: '',
  trackingNumber: '',
  status: FulfillmentStatusEnum.PENDING as string,
  shippedDate: '',
  deliveredDate: '',
  notes: ''
});

// Status timeline steps
const statusSteps = [
  { label: t('salesOrders.statusDraft'), value: SalesOrderStatusEnum.DRAFT },
  { label: t('salesOrders.statusConfirmed'), value: SalesOrderStatusEnum.CONFIRMED },
  { label: t('salesOrders.statusProcessing'), value: SalesOrderStatusEnum.PROCESSING },
  { label: t('salesOrders.statusShipped'), value: SalesOrderStatusEnum.SHIPPED },
  { label: t('salesOrders.statusDelivered'), value: SalesOrderStatusEnum.DELIVERED }
];

const currentStepIndex = computed(() => {
  if (order.value.status === SalesOrderStatusEnum.CANCELLED) return -1;
  return statusSteps.findIndex(s => s.value === order.value.status);
});

function isStepActive(step: { value: string }, idx: number): boolean {
  if (order.value.status === SalesOrderStatusEnum.CANCELLED) return false;
  return idx <= currentStepIndex.value;
}

function getStepColor(step: { value: string }, idx: number): string {
  if (order.value.status === SalesOrderStatusEnum.CANCELLED) return 'var(--border-default)';
  if (idx <= currentStepIndex.value) return '#7849ff';
  return 'var(--border-default)';
}

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

function getFulfillmentStatusType(status?: string): string {
  const map: Record<string, string> = {
    PENDING: 'info',
    PACKED: 'warning',
    SHIPPED: '',
    DELIVERED: 'success'
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
    currency: currency || order.value.currency || 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

function printOrder() {
  window.print();
}

// Data loading
async function loadOrder() {
  if (!orderId.value) return;
  loading.value = true;
  try {
    order.value = await getSalesOrderById(orderId.value);
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loading.value = false;
  }
}

// Status update
function openStatusDialog() {
  newStatus.value = (order.value.status as SalesOrderStatusEnum) || SalesOrderStatusEnum.DRAFT;
  statusDialogVisible.value = true;
}

async function confirmStatusUpdate() {
  if (!orderId.value) return;
  saving.value = true;
  try {
    const result = await updateSalesOrderStatus(orderId.value, newStatus.value);
    if (result) {
      statusDialogVisible.value = false;
      await loadOrder();
    }
  } finally {
    saving.value = false;
  }
}

// Payment status update
function openPaymentStatusDialog() {
  newPaymentStatus.value = (order.value.paymentStatus as PaymentStatusEnum) || PaymentStatusEnum.PENDING;
  paymentStatusDialogVisible.value = true;
}

async function confirmPaymentStatusUpdate() {
  if (!orderId.value) return;
  saving.value = true;
  try {
    const result = await updatePaymentStatus(orderId.value, newPaymentStatus.value);
    if (result) {
      paymentStatusDialogVisible.value = false;
      await loadOrder();
    }
  } finally {
    saving.value = false;
  }
}

// Add fulfillment
function openAddFulfillment() {
  fulfillmentForm.carrier = '';
  fulfillmentForm.trackingNumber = '';
  fulfillmentForm.status = FulfillmentStatusEnum.PENDING;
  fulfillmentForm.notes = '';
  addFulDialogVisible.value = true;
}

async function confirmAddFulfillment() {
  if (!orderId.value) return;
  saving.value = true;
  try {
    const result = await addFulfillment(orderId.value, { ...fulfillmentForm });
    if (result) {
      addFulDialogVisible.value = false;
      await loadOrder();
    }
  } finally {
    saving.value = false;
  }
}

// Edit fulfillment
function openEditFulfillment(ful: Fulfillment) {
  editingFulId.value = ful.id || '';
  editFulForm.carrier = ful.carrier || '';
  editFulForm.trackingNumber = ful.trackingNumber || '';
  editFulForm.status = ful.status || FulfillmentStatusEnum.PENDING;
  editFulForm.shippedDate = ful.shippedDate || '';
  editFulForm.deliveredDate = ful.deliveredDate || '';
  editFulForm.notes = ful.notes || '';
  editFulDialogVisible.value = true;
}

async function confirmEditFulfillment() {
  if (!orderId.value || !editingFulId.value) return;
  saving.value = true;
  try {
    const result = await updateFulfillment(orderId.value, editingFulId.value, { ...editFulForm });
    if (result) {
      editFulDialogVisible.value = false;
      await loadOrder();
    }
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadOrder();
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
</style>
