<template lang="pug">
div.animate-fade-in
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('shipping.title') || 'Shipping Management' }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('shipping.subtitle') || 'Track shipments, manage carriers, and configure shipping rates.' }}
    .flex.items-center.gap-3
      el-button(
        type="primary"
        size="large"
        @click="openCreateDialog"
        class="!rounded-xl"
      )
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ activeTab === 'rates' ? ($t('shipping.newRate') || 'New Rate') : ($t('shipping.newShipment') || 'New Shipment') }}

  //- Tabs
  el-tabs(v-model="activeTab" type="border-card" class="shipping-tabs")
    //- ========== SHIPMENTS TAB ==========
    el-tab-pane(:label="$t('shipping.shipments') || 'Shipments'" name="shipments")
      //- Stats
      .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
        .glass-card.p-4.rounded-2xl
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
              Icon(name="ph:package-bold" size="20" style="color: #7849ff")
            div
              p.text-xl.font-bold(style="color: var(--text-primary)") {{ shipmentStats.total }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.totalShipments') || 'Total' }}
        .glass-card.p-4.rounded-2xl
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
              Icon(name="ph:truck-bold" size="20" style="color: #3b82f6")
            div
              p.text-xl.font-bold(style="color: var(--text-primary)") {{ shipmentStats.inTransit }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.inTransit') || 'In Transit' }}
        .glass-card.p-4.rounded-2xl
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
              Icon(name="ph:check-circle-bold" size="20" style="color: #22c55e")
            div
              p.text-xl.font-bold(style="color: var(--text-primary)") {{ shipmentStats.delivered }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.delivered') || 'Delivered' }}
        .glass-card.p-4.rounded-2xl
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.15)")
              Icon(name="ph:arrow-u-up-left-bold" size="20" style="color: #ef4444")
            div
              p.text-xl.font-bold(style="color: var(--text-primary)") {{ shipmentStats.returned }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.returned') || 'Returned' }}

      //- Search & Filter
      .flex.items-center.justify-between.mb-4
        el-input(
          v-model="shipmentSearch"
          :placeholder="$t('shipping.searchShipments') || 'Search shipments...'"
          clearable
          size="large"
          style="max-width: 320px"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")
        el-select(v-model="shipmentStatusFilter" clearable :placeholder="$t('shipping.filterStatus') || 'Filter Status'" size="large" style="width: 180px")
          el-option(label="All" value="")
          el-option(label="Preparing" value="PREPARING")
          el-option(label="Shipped" value="SHIPPED")
          el-option(label="In Transit" value="IN_TRANSIT")
          el-option(label="Delivered" value="DELIVERED")
          el-option(label="Returned" value="RETURNED")
          el-option(label="Cancelled" value="CANCELLED")

      //- Shipments Table
      el-table(:data="filteredShipments" v-loading="loadingShipments" stripe style="width: 100%")
        el-table-column(:label="$t('shipping.shipmentNumber') || 'Shipment #'" width="160" sortable)
          template(#default="{ row }")
            span.font-mono.font-bold(style="color: #7849ff") {{ row.shipmentNumber || '--' }}
        el-table-column(:label="$t('shipping.carrier') || 'Carrier'" prop="carrier" width="140")
          template(#default="{ row }")
            .flex.items-center.gap-2
              Icon(name="ph:truck" size="16" style="color: var(--text-muted)")
              span.text-sm(style="color: var(--text-primary)") {{ row.carrier || '--' }}
        el-table-column(:label="$t('shipping.trackingNumber') || 'Tracking #'" prop="trackingNumber" width="180")
          template(#default="{ row }")
            span.text-sm.font-mono(style="color: var(--text-primary)") {{ row.trackingNumber || '--' }}
        el-table-column(:label="$t('shipping.status') || 'Status'" width="140" align="center")
          template(#default="{ row }")
            el-tag(
              :type="getShipmentStatusType(row.status)"
              size="small"
              effect="dark"
              round
            ) {{ row.status || '--' }}
        el-table-column(:label="$t('shipping.origin') || 'Origin'" prop="origin" width="150")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.origin || '--' }}
        el-table-column(:label="$t('shipping.destination') || 'Destination'" prop="destination" width="150")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.destination || '--' }}
        el-table-column(:label="$t('shipping.recipient') || 'Recipient'" prop="recipientName" width="150")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.recipientName || '--' }}
        el-table-column(:label="$t('shipping.weight') || 'Weight'" width="100" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.weight ? row.weight + ' kg' : '--' }}
        el-table-column(:label="$t('shipping.cost') || 'Cost'" width="120" align="center" sortable)
          template(#default="{ row }")
            span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.shippingCost ? formatCurrency(row.shippingCost) : '--' }}
        el-table-column(:label="$t('shipping.estimatedDelivery') || 'Est. Delivery'" width="140")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ row.estimatedDelivery ? formatDate(row.estimatedDelivery) : '--' }}
        el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center" fixed="right")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-1
              el-button(size="small" @click="openEditShipment(row)" class="!rounded-lg")
                Icon(name="ph:pencil-bold" size="14")
              el-button(size="small" type="danger" plain @click="deleteShipment(row)" class="!rounded-lg")
                Icon(name="ph:trash-bold" size="14")

      .text-center.py-12(v-if="!filteredShipments.length && !loadingShipments")
        Icon(name="ph:package" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('shipping.noShipments') || 'No shipments found' }}

    //- ========== RATES TAB ==========
    el-tab-pane(:label="$t('shipping.rates') || 'Rates'" name="rates")
      .flex.items-center.justify-between.mb-4
        el-input(
          v-model="rateSearch"
          :placeholder="$t('shipping.searchRates') || 'Search rates...'"
          clearable
          size="large"
          style="max-width: 320px"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")

      //- Rates Table
      el-table(:data="filteredRates" v-loading="loadingRates" stripe style="width: 100%")
        el-table-column(:label="$t('shipping.carrier') || 'Carrier'" prop="carrier" min-width="160" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-2
              Icon(name="ph:truck-bold" size="16" style="color: #7849ff")
              span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.carrier || '--' }}
        el-table-column(:label="$t('shipping.zone') || 'Zone'" prop="zone" width="140")
          template(#default="{ row }")
            el-tag(size="small" effect="plain" round) {{ row.zone || '--' }}
        el-table-column(:label="$t('shipping.weightMin') || 'Min Weight'" width="120" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.weightMin != null ? row.weightMin + ' kg' : '--' }}
        el-table-column(:label="$t('shipping.weightMax') || 'Max Weight'" width="120" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.weightMax != null ? row.weightMax + ' kg' : '--' }}
        el-table-column(:label="$t('shipping.rate') || 'Rate'" width="120" align="center" sortable)
          template(#default="{ row }")
            span.text-sm.font-bold(style="color: #7849ff") {{ row.rate != null ? formatCurrency(row.rate, row.currency) : '--' }}
        el-table-column(:label="$t('shipping.currency') || 'Currency'" prop="currency" width="100" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.currency || 'SAR' }}
        el-table-column(:label="$t('shipping.estimatedDays') || 'Est. Days'" width="120" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.estimatedDays != null ? row.estimatedDays + 'd' : '--' }}
        el-table-column(:label="$t('shipping.active') || 'Active'" width="100" align="center")
          template(#default="{ row }")
            el-tag(:type="row.isActive ? 'success' : 'info'" size="small" effect="dark" round) {{ row.isActive ? 'Yes' : 'No' }}
        el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center" fixed="right")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-1
              el-button(size="small" @click="openEditRate(row)" class="!rounded-lg")
                Icon(name="ph:pencil-bold" size="14")
              el-button(size="small" type="danger" plain @click="deleteRate(row)" class="!rounded-lg")
                Icon(name="ph:trash-bold" size="14")

      .text-center.py-12(v-if="!filteredRates.length && !loadingRates")
        Icon(name="ph:currency-circle-dollar" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('shipping.noRates') || 'No shipping rates found' }}

  //- ========== CREATE / EDIT SHIPMENT DIALOG ==========
  el-dialog(
    v-model="shipmentDialogVisible"
    :title="editingShipment ? ($t('shipping.editShipment') || 'Edit Shipment') : ($t('shipping.newShipment') || 'New Shipment')"
    width="650px"
    :close-on-click-modal="false"
  )
    el-form(:model="shipmentForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('shipping.carrier') || 'Carrier'" required)
          el-input(v-model="shipmentForm.carrier" :placeholder="$t('shipping.carrier') || 'e.g. DHL, FedEx'")
        el-form-item(:label="$t('shipping.trackingNumber') || 'Tracking Number'")
          el-input(v-model="shipmentForm.trackingNumber" :placeholder="$t('shipping.trackingNumber') || 'Tracking Number'")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('shipping.origin') || 'Origin'" required)
          el-input(v-model="shipmentForm.origin" :placeholder="$t('shipping.origin') || 'Origin City / Address'")
        el-form-item(:label="$t('shipping.destination') || 'Destination'" required)
          el-input(v-model="shipmentForm.destination" :placeholder="$t('shipping.destination') || 'Destination City / Address'")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('shipping.recipient') || 'Recipient Name'" required)
          el-input(v-model="shipmentForm.recipientName" :placeholder="$t('shipping.recipient') || 'Recipient Name'")
        el-form-item(:label="$t('shipping.status') || 'Status'")
          el-select(v-model="shipmentForm.status" style="width: 100%")
            el-option(label="Preparing" value="PREPARING")
            el-option(label="Shipped" value="SHIPPED")
            el-option(label="In Transit" value="IN_TRANSIT")
            el-option(label="Delivered" value="DELIVERED")
            el-option(label="Returned" value="RETURNED")
            el-option(label="Cancelled" value="CANCELLED")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
        el-form-item(:label="$t('shipping.weight') || 'Weight (kg)'")
          el-input-number(v-model="shipmentForm.weight" :min="0" :precision="2" style="width: 100%")
        el-form-item(:label="$t('shipping.cost') || 'Shipping Cost'")
          el-input-number(v-model="shipmentForm.shippingCost" :min="0" :precision="2" style="width: 100%")
        el-form-item(:label="$t('shipping.estimatedDelivery') || 'Est. Delivery'")
          el-date-picker(
            v-model="shipmentForm.estimatedDelivery"
            type="date"
            :placeholder="$t('shipping.selectDate') || 'Select date'"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          )
    template(#footer)
      el-button(@click="shipmentDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="saving" @click="saveShipment") {{ $t('common.save') || 'Save' }}

  //- ========== CREATE / EDIT RATE DIALOG ==========
  el-dialog(
    v-model="rateDialogVisible"
    :title="editingRate ? ($t('shipping.editRate') || 'Edit Rate') : ($t('shipping.newRate') || 'New Rate')"
    width="550px"
    :close-on-click-modal="false"
  )
    el-form(:model="rateForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('shipping.carrier') || 'Carrier'" required)
          el-input(v-model="rateForm.carrier" :placeholder="$t('shipping.carrier') || 'e.g. DHL'")
        el-form-item(:label="$t('shipping.zone') || 'Zone'" required)
          el-input(v-model="rateForm.zone" :placeholder="$t('shipping.zone') || 'e.g. Domestic, International'")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('shipping.weightMin') || 'Min Weight (kg)'")
          el-input-number(v-model="rateForm.weightMin" :min="0" :precision="2" style="width: 100%")
        el-form-item(:label="$t('shipping.weightMax') || 'Max Weight (kg)'")
          el-input-number(v-model="rateForm.weightMax" :min="0" :precision="2" style="width: 100%")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
        el-form-item(:label="$t('shipping.rate') || 'Rate'" required)
          el-input-number(v-model="rateForm.rate" :min="0" :precision="2" style="width: 100%")
        el-form-item(:label="$t('shipping.currency') || 'Currency'")
          el-select(v-model="rateForm.currency" style="width: 100%")
            el-option(label="SAR" value="SAR")
            el-option(label="USD" value="USD")
            el-option(label="EUR" value="EUR")
            el-option(label="GBP" value="GBP")
        el-form-item(:label="$t('shipping.estimatedDays') || 'Est. Days'")
          el-input-number(v-model="rateForm.estimatedDays" :min="0" style="width: 100%")
      el-form-item
        el-checkbox(v-model="rateForm.isActive") {{ $t('shipping.active') || 'Active' }}
    template(#footer)
      el-button(@click="rateDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="saving" @click="saveRate") {{ $t('common.save') || 'Save' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// State
const activeTab = ref('shipments');
const saving = ref(false);

// Shipments
const loadingShipments = ref(false);
const shipments = ref<any[]>([]);
const shipmentSearch = ref('');
const shipmentStatusFilter = ref('');
const shipmentDialogVisible = ref(false);
const editingShipment = ref<any>(null);
const shipmentForm = reactive({
  carrier: '',
  trackingNumber: '',
  status: 'PREPARING',
  origin: '',
  destination: '',
  recipientName: '',
  weight: 0 as number,
  shippingCost: 0 as number,
  estimatedDelivery: ''
});

// Rates
const loadingRates = ref(false);
const rates = ref<any[]>([]);
const rateSearch = ref('');
const rateDialogVisible = ref(false);
const editingRate = ref<any>(null);
const rateForm = reactive({
  carrier: '',
  zone: '',
  weightMin: 0 as number,
  weightMax: 0 as number,
  rate: 0 as number,
  currency: 'SAR',
  estimatedDays: 0 as number,
  isActive: true
});

// Helpers
function getShipmentStatusType(status: string): string {
  const map: Record<string, string> = {
    PREPARING: 'info',
    SHIPPED: 'warning',
    IN_TRANSIT: 'primary',
    DELIVERED: 'success',
    RETURNED: 'danger',
    CANCELLED: 'info'
  };
  return map[status] || 'info';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number, currency?: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

function openCreateDialog() {
  if (activeTab.value === 'rates') openCreateRate();
  else openCreateShipment();
}

// Stats
const shipmentStats = computed(() => {
  const data = shipments.value;
  return {
    total: data.length,
    inTransit: data.filter((s: any) => s.status === 'IN_TRANSIT' || s.status === 'SHIPPED').length,
    delivered: data.filter((s: any) => s.status === 'DELIVERED').length,
    returned: data.filter((s: any) => s.status === 'RETURNED').length
  };
});

// Filtered data
const filteredShipments = computed(() => {
  let data = shipments.value;
  if (shipmentStatusFilter.value) {
    data = data.filter((s: any) => s.status === shipmentStatusFilter.value);
  }
  if (shipmentSearch.value) {
    const q = shipmentSearch.value.toLowerCase();
    data = data.filter((s: any) => {
      return (s.shipmentNumber || '').toLowerCase().includes(q) ||
        (s.carrier || '').toLowerCase().includes(q) ||
        (s.trackingNumber || '').toLowerCase().includes(q) ||
        (s.recipientName || '').toLowerCase().includes(q) ||
        (s.origin || '').toLowerCase().includes(q) ||
        (s.destination || '').toLowerCase().includes(q);
    });
  }
  return data;
});

const filteredRates = computed(() => {
  if (!rateSearch.value) return rates.value;
  const q = rateSearch.value.toLowerCase();
  return rates.value.filter((r: any) => {
    return (r.carrier || '').toLowerCase().includes(q) || (r.zone || '').toLowerCase().includes(q);
  });
});

// ========== SHIPMENT CRUD ==========
async function loadShipments() {
  loadingShipments.value = true;
  try {
    const res = await useApiFetch('shipping');
    if (res?.success) {
      shipments.value = res.body?.docs || res.body || [];
    }
  } catch {
    // silent
  } finally {
    loadingShipments.value = false;
  }
}

function openCreateShipment() {
  editingShipment.value = null;
  shipmentForm.carrier = '';
  shipmentForm.trackingNumber = '';
  shipmentForm.status = 'PREPARING';
  shipmentForm.origin = '';
  shipmentForm.destination = '';
  shipmentForm.recipientName = '';
  shipmentForm.weight = 0;
  shipmentForm.shippingCost = 0;
  shipmentForm.estimatedDelivery = '';
  shipmentDialogVisible.value = true;
}

function openEditShipment(shipment: any) {
  editingShipment.value = shipment;
  shipmentForm.carrier = shipment.carrier || '';
  shipmentForm.trackingNumber = shipment.trackingNumber || '';
  shipmentForm.status = shipment.status || 'PREPARING';
  shipmentForm.origin = shipment.origin || '';
  shipmentForm.destination = shipment.destination || '';
  shipmentForm.recipientName = shipment.recipientName || '';
  shipmentForm.weight = shipment.weight || 0;
  shipmentForm.shippingCost = shipment.shippingCost || 0;
  shipmentForm.estimatedDelivery = shipment.estimatedDelivery || '';
  shipmentDialogVisible.value = true;
}

async function saveShipment() {
  if (!shipmentForm.carrier.trim() || !shipmentForm.origin.trim() || !shipmentForm.destination.trim() || !shipmentForm.recipientName.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning') || 'Warning', message: t('common.fillRequired') || 'Please fill required fields' });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...shipmentForm };
    if (editingShipment.value) {
      await useApiFetch(`shipping/${editingShipment.value.id}`, 'PUT', payload);
    } else {
      await useApiFetch('shipping', 'POST', payload);
    }
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.saved') || 'Saved' });
    shipmentDialogVisible.value = false;
    await loadShipments();
  } catch {
    ElNotification({ type: 'error', title: t('common.error') || 'Error', message: t('common.error') || 'Error' });
  } finally {
    saving.value = false;
  }
}

async function deleteShipment(shipment: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure?',
      t('common.warning') || 'Warning',
      { type: 'warning' }
    );
    await useApiFetch(`shipping/${shipment.id}`, 'DELETE');
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.deleted') || 'Deleted' });
    await loadShipments();
  } catch {
    // cancelled
  }
}

// ========== RATE CRUD ==========
async function loadRates() {
  loadingRates.value = true;
  try {
    const res = await useApiFetch('shipping/rates');
    if (res?.success) {
      rates.value = res.body?.docs || res.body || [];
    }
  } catch {
    // silent
  } finally {
    loadingRates.value = false;
  }
}

function openCreateRate() {
  editingRate.value = null;
  rateForm.carrier = '';
  rateForm.zone = '';
  rateForm.weightMin = 0;
  rateForm.weightMax = 0;
  rateForm.rate = 0;
  rateForm.currency = 'SAR';
  rateForm.estimatedDays = 0;
  rateForm.isActive = true;
  rateDialogVisible.value = true;
}

function openEditRate(rate: any) {
  editingRate.value = rate;
  rateForm.carrier = rate.carrier || '';
  rateForm.zone = rate.zone || '';
  rateForm.weightMin = rate.weightMin || 0;
  rateForm.weightMax = rate.weightMax || 0;
  rateForm.rate = rate.rate || 0;
  rateForm.currency = rate.currency || 'SAR';
  rateForm.estimatedDays = rate.estimatedDays || 0;
  rateForm.isActive = rate.isActive !== false;
  rateDialogVisible.value = true;
}

async function saveRate() {
  if (!rateForm.carrier.trim() || !rateForm.zone.trim() || !rateForm.rate) {
    ElNotification({ type: 'warning', title: t('common.warning') || 'Warning', message: t('common.fillRequired') || 'Please fill required fields' });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...rateForm };
    if (editingRate.value) {
      await useApiFetch(`shipping/rates/${editingRate.value.id}`, 'PUT', payload);
    } else {
      await useApiFetch('shipping/rates', 'POST', payload);
    }
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.saved') || 'Saved' });
    rateDialogVisible.value = false;
    await loadRates();
  } catch {
    ElNotification({ type: 'error', title: t('common.error') || 'Error', message: t('common.error') || 'Error' });
  } finally {
    saving.value = false;
  }
}

async function deleteRate(rate: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure?',
      t('common.warning') || 'Warning',
      { type: 'warning' }
    );
    await useApiFetch(`shipping/rates/${rate.id}`, 'DELETE');
    ElNotification({ type: 'success', title: t('common.success') || 'Success', message: t('common.deleted') || 'Deleted' });
    await loadRates();
  } catch {
    // cancelled
  }
}

onMounted(() => {
  loadShipments();
  loadRates();
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

.shipping-tabs {
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
