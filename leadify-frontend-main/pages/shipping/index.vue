<template lang="pug">
div.animate-fade-in
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('shipping.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('shipping.subtitle') }}
    .flex.items-center.gap-3
      el-button(
        type="primary"
        size="large"
        @click="openCreateDialog"
        class="!rounded-xl"
      )
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ activeTab === 'rates' ? $t('shipping.newRate') : $t('shipping.newShipment') }}

  //- Analytics Cards (from API)
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:package-bold" size="20" style="color: #7849ff")
        div
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ analytics.totalShipments }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.totalShipments') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:check-circle-bold" size="20" style="color: #22c55e")
        div
          p.text-2xl.font-bold(style="color: #22c55e") {{ analytics.delivered }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.delivered') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:truck-bold" size="20" style="color: #3b82f6")
        div
          p.text-2xl.font-bold(style="color: #3b82f6") {{ analytics.inTransit }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.inTransit') }}
    .glass-card.p-5.rounded-2xl
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:timer-bold" size="20" style="color: #f59e0b")
        div
          p.text-2xl.font-bold(style="color: #f59e0b") {{ analytics.onTimeRate }}%
          p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.onTimeRate') }}

  //- Track Shipment & Rate Calculator
  el-row(:gutter="16" class="mb-6")
    el-col(:span="14")
      .glass-card.p-5.rounded-2xl.h-full
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:magnifying-glass-bold" size="20" class="mr-2" style="color: #7849ff")
          | {{ $t('shipping.trackShipment') }}
        .flex.items-center.gap-3.mb-4
          el-input(
            v-model="trackingInput"
            :placeholder="$t('shipping.enterTracking')"
            size="large"
            clearable
            class="!rounded-xl"
            @keyup.enter="trackShipment"
          )
            template(#prefix)
              Icon(name="ph:barcode" size="16" style="color: var(--text-muted)")
          el-button(
            type="primary"
            size="large"
            @click="trackShipment"
            :loading="loadingTracking"
            :disabled="!trackingInput.trim()"
            class="!rounded-xl"
          )
            Icon(name="ph:magnifying-glass-bold" size="16" class="mr-1")
            | {{ $t('shipping.track') }}
        //- Tracked Shipment Result
        .p-4.rounded-xl(
          v-if="trackedShipment"
          style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
        )
          .flex.items-center.justify-between.mb-3
            .flex.items-center.gap-2
              Icon(name="ph:package-bold" size="18" style="color: #7849ff")
              span.font-mono.font-bold(style="color: #7849ff") {{ trackedShipment.shipmentNumber || trackedShipment.trackingNumber || '--' }}
            el-tag(
              :type="getShipmentStatusType(trackedShipment.status)"
              size="small"
              effect="dark"
              round
            ) {{ trackedShipment.status || '--' }}
          el-row(:gutter="12")
            el-col(:span="8")
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.carrier') }}
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ trackedShipment.carrier || '--' }}
            el-col(:span="8")
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.origin') }}
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ trackedShipment.origin || '--' }}
            el-col(:span="8")
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.destination') }}
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ trackedShipment.destination || '--' }}
          el-row.mt-3(:gutter="12")
            el-col(:span="8")
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.recipient') }}
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ trackedShipment.recipientName || '--' }}
            el-col(:span="8")
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.weight') }}
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ trackedShipment.weight ? trackedShipment.weight + ' kg' : '--' }}
            el-col(:span="8")
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.estimatedDelivery') }}
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ trackedShipment.estimatedDelivery ? formatDate(trackedShipment.estimatedDelivery) : '--' }}
        .text-center.py-4(v-else-if="trackingNotFound")
          Icon(name="ph:x-circle" size="32" style="color: #ef4444")
          p.text-sm.mt-1(style="color: #ef4444") {{ $t('shipping.trackingNotFound') }}

    el-col(:span="10")
      .glass-card.p-5.rounded-2xl.h-full
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:calculator-bold" size="20" class="mr-2" style="color: #f59e0b")
          | {{ $t('shipping.rateCalculator') }}
        el-form(label-position="top" size="large")
          el-form-item(:label="$t('shipping.weight')")
            el-input-number(v-model="calcWeight" :min="0.1" :precision="2" style="width: 100%")
          el-form-item(:label="$t('shipping.zone')")
            el-select(v-model="calcZone" :placeholder="$t('shipping.selectZone')" style="width: 100%" clearable)
              el-option(:label="$t('shipping.domestic')" value="Domestic")
              el-option(:label="$t('shipping.international')" value="International")
              el-option(:label="$t('shipping.express')" value="Express")
              el-option(:label="$t('shipping.economy')" value="Economy")
          el-button(
            type="primary"
            @click="calculateRate"
            :loading="loadingCalcRate"
            :disabled="!calcWeight || !calcZone"
            style="width: 100%"
            class="!rounded-xl"
          )
            Icon(name="ph:calculator-bold" size="16" class="mr-1")
            | {{ $t('shipping.calculate') }}
        .p-4.rounded-xl.mt-4.text-center(
          v-if="calculatedRate !== null"
          style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
        )
          p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.estimatedCost') }}
          p.text-3xl.font-black.mt-1(style="color: #7849ff") {{ formatCurrency(calculatedRate.rate || calculatedRate.cost || calculatedRate, calculatedRate.currency) }}
          p.text-xs.mt-1(v-if="calculatedRate.estimatedDays" style="color: var(--text-muted)") {{ $t('shipping.estimatedDays') }}: {{ calculatedRate.estimatedDays }}

  //- Tabs
  el-tabs(v-model="activeTab" type="border-card" class="shipping-tabs")
    //- ========== SHIPMENTS TAB ==========
    el-tab-pane(:label="$t('shipping.shipments')" name="shipments")
      //- Stats
      .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
        .glass-card.p-4.rounded-2xl
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
              Icon(name="ph:package-bold" size="20" style="color: #7849ff")
            div
              p.text-xl.font-bold(style="color: var(--text-primary)") {{ shipmentStats.total }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.totalShipments') }}
        .glass-card.p-4.rounded-2xl
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
              Icon(name="ph:truck-bold" size="20" style="color: #3b82f6")
            div
              p.text-xl.font-bold(style="color: var(--text-primary)") {{ shipmentStats.inTransit }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.inTransit') }}
        .glass-card.p-4.rounded-2xl
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
              Icon(name="ph:check-circle-bold" size="20" style="color: #22c55e")
            div
              p.text-xl.font-bold(style="color: var(--text-primary)") {{ shipmentStats.delivered }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.delivered') }}
        .glass-card.p-4.rounded-2xl
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.15)")
              Icon(name="ph:arrow-u-up-left-bold" size="20" style="color: #ef4444")
            div
              p.text-xl.font-bold(style="color: var(--text-primary)") {{ shipmentStats.returned }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('shipping.returned') }}

      //- Search & Filter
      .flex.items-center.justify-between.mb-4
        el-input(
          v-model="shipmentSearch"
          :placeholder="$t('shipping.searchShipments')"
          clearable
          size="large"
          style="max-width: 320px"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")
        el-select(v-model="shipmentStatusFilter" clearable :placeholder="$t('shipping.filterStatus')" size="large" style="width: 180px")
          el-option(:label="$t('common.all')" value="")
          el-option(:label="$t('shipping.preparing')" value="PREPARING")
          el-option(:label="$t('common.shipped')" value="SHIPPED")
          el-option(:label="$t('shipping.inTransit')" value="IN_TRANSIT")
          el-option(:label="$t('common.delivered')" value="DELIVERED")
          el-option(:label="$t('common.returned')" value="RETURNED")
          el-option(:label="$t('common.cancelled')" value="CANCELLED")

      //- Shipments Table
      el-table(:data="filteredShipments" v-loading="loadingShipments" stripe style="width: 100%")
        el-table-column(:label="$t('shipping.shipmentNumber')" width="160" sortable)
          template(#default="{ row }")
            span.font-mono.font-bold(style="color: #7849ff") {{ row.shipmentNumber || '--' }}
        el-table-column(:label="$t('shipping.carrier')" prop="carrier" width="140")
          template(#default="{ row }")
            .flex.items-center.gap-2
              Icon(name="ph:truck" size="16" style="color: var(--text-muted)")
              span.text-sm(style="color: var(--text-primary)") {{ row.carrier || '--' }}
        el-table-column(:label="$t('shipping.trackingNumber')" prop="trackingNumber" width="180")
          template(#default="{ row }")
            span.text-sm.font-mono(style="color: var(--text-primary)") {{ row.trackingNumber || '--' }}
        el-table-column(:label="$t('shipping.status')" width="140" align="center")
          template(#default="{ row }")
            el-tag(
              :type="getShipmentStatusType(row.status)"
              size="small"
              effect="dark"
              round
            ) {{ row.status || '--' }}
        el-table-column(:label="$t('shipping.origin')" prop="origin" width="150")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.origin || '--' }}
        el-table-column(:label="$t('shipping.destination')" prop="destination" width="150")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.destination || '--' }}
        el-table-column(:label="$t('shipping.recipient')" prop="recipientName" width="150")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.recipientName || '--' }}
        el-table-column(:label="$t('shipping.weight')" width="100" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.weight ? row.weight + ' kg' : '--' }}
        el-table-column(:label="$t('shipping.cost')" width="120" align="center" sortable)
          template(#default="{ row }")
            span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.shippingCost ? formatCurrency(row.shippingCost) : '--' }}
        el-table-column(:label="$t('shipping.estimatedDelivery')" width="140")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ row.estimatedDelivery ? formatDate(row.estimatedDelivery) : '--' }}
        el-table-column(:label="$t('common.actions')" width="120" align="center" fixed="right")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-1
              el-button(size="small" @click="openEditShipment(row)" class="!rounded-lg")
                Icon(name="ph:pencil-bold" size="14")
              el-button(size="small" type="danger" plain @click="deleteShipment(row)" class="!rounded-lg")
                Icon(name="ph:trash-bold" size="14")

      .text-center.py-12(v-if="!filteredShipments.length && !loadingShipments")
        Icon(name="ph:package" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('shipping.noShipments') }}

      .flex.justify-end.mt-4
        el-pagination(
          :current-page="shipmentsPagination.page"
          :page-size="shipmentsPagination.limit"
          :total="shipmentsPagination.total"
          layout="total, prev, pager, next"
          @current-change="(p: number) => { shipmentsPagination.page = p; loadShipments() }"
        )

    //- ========== RATES TAB ==========
    el-tab-pane(:label="$t('shipping.rates')" name="rates")
      .flex.items-center.justify-between.mb-4
        el-input(
          v-model="rateSearch"
          :placeholder="$t('shipping.searchRates')"
          clearable
          size="large"
          style="max-width: 320px"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")

      //- Rates Table
      el-table(:data="filteredRates" v-loading="loadingRates" stripe style="width: 100%")
        el-table-column(:label="$t('shipping.carrier')" prop="carrier" min-width="160" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-2
              Icon(name="ph:truck-bold" size="16" style="color: #7849ff")
              span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.carrier || '--' }}
        el-table-column(:label="$t('shipping.zone')" prop="zone" width="140")
          template(#default="{ row }")
            el-tag(size="small" effect="plain" round) {{ row.zone || '--' }}
        el-table-column(:label="$t('shipping.weightMin')" width="120" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.weightMin != null ? row.weightMin + ' kg' : '--' }}
        el-table-column(:label="$t('shipping.weightMax')" width="120" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.weightMax != null ? row.weightMax + ' kg' : '--' }}
        el-table-column(:label="$t('shipping.rate')" width="120" align="center" sortable)
          template(#default="{ row }")
            span.text-sm.font-bold(style="color: #7849ff") {{ row.rate != null ? formatCurrency(row.rate, row.currency) : '--' }}
        el-table-column(:label="$t('shipping.currency')" prop="currency" width="100" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.currency || 'SAR' }}
        el-table-column(:label="$t('shipping.estimatedDays')" width="120" align="center")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.estimatedDays != null ? row.estimatedDays + 'd' : '--' }}
        el-table-column(:label="$t('shipping.active')" width="100" align="center")
          template(#default="{ row }")
            el-tag(:type="row.isActive ? 'success' : 'info'" size="small" effect="dark" round) {{ row.isActive ? 'Yes' : 'No' }}
        el-table-column(:label="$t('common.actions')" width="120" align="center" fixed="right")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-1
              el-button(size="small" @click="openEditRate(row)" class="!rounded-lg")
                Icon(name="ph:pencil-bold" size="14")
              el-button(size="small" type="danger" plain @click="deleteRate(row)" class="!rounded-lg")
                Icon(name="ph:trash-bold" size="14")

      .text-center.py-12(v-if="!filteredRates.length && !loadingRates")
        Icon(name="ph:currency-circle-dollar" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('shipping.noRates') }}

      .flex.justify-end.mt-4
        el-pagination(
          :current-page="ratesPagination.page"
          :page-size="ratesPagination.limit"
          :total="ratesPagination.total"
          layout="total, prev, pager, next"
          @current-change="(p: number) => { ratesPagination.page = p; loadRates() }"
        )

  //- ========== CREATE / EDIT SHIPMENT DIALOG ==========
  el-dialog(
    v-model="shipmentDialogVisible"
    :title="editingShipment ? $t('shipping.editShipment') : $t('shipping.newShipment')"
    width="650px"
    :close-on-click-modal="false"
  )
    el-form(:model="shipmentForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('shipping.carrier')" required)
          el-input(v-model="shipmentForm.carrier" :placeholder="$t('shipping.carrier')")
        el-form-item(:label="$t('shipping.trackingNumber')")
          el-input(v-model="shipmentForm.trackingNumber" :placeholder="$t('shipping.trackingNumber')")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('shipping.origin')" required)
          el-input(v-model="shipmentForm.origin" :placeholder="$t('shipping.origin')")
        el-form-item(:label="$t('shipping.destination')" required)
          el-input(v-model="shipmentForm.destination" :placeholder="$t('shipping.destination')")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('shipping.recipient')" required)
          el-input(v-model="shipmentForm.recipientName" :placeholder="$t('shipping.recipient')")
        el-form-item(:label="$t('shipping.status')")
          el-select(v-model="shipmentForm.status" style="width: 100%")
            el-option(:label="$t('shipping.preparing')" value="PREPARING")
            el-option(:label="$t('common.shipped')" value="SHIPPED")
            el-option(:label="$t('shipping.inTransit')" value="IN_TRANSIT")
            el-option(:label="$t('common.delivered')" value="DELIVERED")
            el-option(:label="$t('common.returned')" value="RETURNED")
            el-option(:label="$t('common.cancelled')" value="CANCELLED")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
        el-form-item(:label="$t('shipping.weight')")
          el-input-number(v-model="shipmentForm.weight" :min="0" :precision="2" style="width: 100%")
        el-form-item(:label="$t('shipping.cost')")
          el-input-number(v-model="shipmentForm.shippingCost" :min="0" :precision="2" style="width: 100%")
        el-form-item(:label="$t('shipping.estimatedDelivery')")
          el-date-picker(
            v-model="shipmentForm.estimatedDelivery"
            type="date"
            :placeholder="$t('shipping.selectDate')"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          )
    template(#footer)
      el-button(@click="shipmentDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveShipment") {{ $t('common.save') }}

  //- ========== CREATE / EDIT RATE DIALOG ==========
  el-dialog(
    v-model="rateDialogVisible"
    :title="editingRate ? $t('shipping.editRate') : $t('shipping.newRate')"
    width="550px"
    :close-on-click-modal="false"
  )
    el-form(:model="rateForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('shipping.carrier')" required)
          el-input(v-model="rateForm.carrier" :placeholder="$t('shipping.carrier')")
        el-form-item(:label="$t('shipping.zone')" required)
          el-input(v-model="rateForm.zone" :placeholder="$t('shipping.zone')")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('shipping.weightMin')")
          el-input-number(v-model="rateForm.weightMin" :min="0" :precision="2" style="width: 100%")
        el-form-item(:label="$t('shipping.weightMax')")
          el-input-number(v-model="rateForm.weightMax" :min="0" :precision="2" style="width: 100%")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
        el-form-item(:label="$t('shipping.rate')" required)
          el-input-number(v-model="rateForm.rate" :min="0" :precision="2" style="width: 100%")
        el-form-item(:label="$t('shipping.currency')")
          el-select(v-model="rateForm.currency" style="width: 100%")
            el-option(:label="$t('common.currencySAR')" value="SAR")
            el-option(:label="$t('common.currencyUSD')" value="USD")
            el-option(:label="$t('common.currencyEUR')" value="EUR")
            el-option(:label="$t('common.currencyGBP')" value="GBP")
        el-form-item(:label="$t('shipping.estimatedDays')")
          el-input-number(v-model="rateForm.estimatedDays" :min="0" style="width: 100%")
      el-form-item
        el-checkbox(v-model="rateForm.isActive") {{ $t('shipping.active') }}
    template(#footer)
      el-button(@click="rateDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveRate") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// State
const activeTab = ref('shipments');
const saving = ref(false);

// Analytics from API
const analytics = reactive({
  totalShipments: 0,
  delivered: 0,
  inTransit: 0,
  onTimeRate: 0
});

// Track Shipment
const trackingInput = ref('');
const loadingTracking = ref(false);
const trackedShipment = ref<any>(null);
const trackingNotFound = ref(false);

// Rate Calculator
const calcWeight = ref(1);
const calcZone = ref('');
const loadingCalcRate = ref(false);
const calculatedRate = ref<any>(null);

// Shipments
const loadingShipments = ref(false);
const shipments = ref<any[]>([]);
const shipmentsPagination = reactive({ page: 1, limit: 20, total: 0 });
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
const ratesPagination = reactive({ page: 1, limit: 20, total: 0 });
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
      return (
        (s.shipmentNumber || '').toLowerCase().includes(q) ||
        (s.carrier || '').toLowerCase().includes(q) ||
        (s.trackingNumber || '').toLowerCase().includes(q) ||
        (s.recipientName || '').toLowerCase().includes(q) ||
        (s.origin || '').toLowerCase().includes(q) ||
        (s.destination || '').toLowerCase().includes(q)
      );
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
    const res = await useApiFetch(`shipping?page=${shipmentsPagination.page}&limit=${shipmentsPagination.limit}`);
    if (res?.success) {
      const data = res.body as any;
      shipments.value = data?.rows || data?.docs || data || [];
      shipmentsPagination.total = data?.count ?? data?.total ?? shipments.value.length;
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
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
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
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
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    shipmentDialogVisible.value = false;
    await loadShipments();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function deleteShipment(shipment: any) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), { type: 'warning' });
    await useApiFetch(`shipping/${shipment.id}`, 'DELETE');
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
    await loadShipments();
  } catch {
    // cancelled
  }
}

// ========== RATE CRUD ==========
async function loadRates() {
  loadingRates.value = true;
  try {
    const res = await useApiFetch(`shipping/rates?page=${ratesPagination.page}&limit=${ratesPagination.limit}`);
    if (res?.success) {
      const data = res.body as any;
      rates.value = data?.rows || data?.docs || data || [];
      ratesPagination.total = data?.count ?? data?.total ?? rates.value.length;
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
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
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
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
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    rateDialogVisible.value = false;
    await loadRates();
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function deleteRate(rate: any) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), { type: 'warning' });
    await useApiFetch(`shipping/rates/${rate.id}`, 'DELETE');
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
    await loadRates();
  } catch {
    // cancelled
  }
}

// Analytics API
async function loadAnalytics() {
  try {
    const res = await useApiFetch('shipping/analytics');
    if (res?.success) {
      const data = res.body as any;
      analytics.totalShipments = data?.totalShipments ?? data?.total ?? 0;
      analytics.delivered = data?.delivered ?? 0;
      analytics.inTransit = data?.inTransit ?? 0;
      analytics.onTimeRate = data?.onTimeRate ?? 0;
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

// Track Shipment API
async function trackShipment() {
  if (!trackingInput.value.trim()) return;
  loadingTracking.value = true;
  trackedShipment.value = null;
  trackingNotFound.value = false;
  try {
    const res = await useApiFetch(`shipping/track/${encodeURIComponent(trackingInput.value.trim())}`);
    if (res?.success && res.body) {
      trackedShipment.value = res.body;
    } else {
      trackingNotFound.value = true;
    }
  } catch {
    trackingNotFound.value = true;
  } finally {
    loadingTracking.value = false;
  }
}

// Rate Calculator API
async function calculateRate() {
  if (!calcWeight.value || !calcZone.value) return;
  loadingCalcRate.value = true;
  calculatedRate.value = null;
  try {
    const res = await useApiFetch(`shipping/calculate-rate?weight=${calcWeight.value}&zone=${encodeURIComponent(calcZone.value)}`);
    if (res?.success && res.body) {
      calculatedRate.value = res.body;
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    loadingCalcRate.value = false;
  }
}

onMounted(() => {
  loadShipments();
  loadRates();
  loadAnalytics();
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
