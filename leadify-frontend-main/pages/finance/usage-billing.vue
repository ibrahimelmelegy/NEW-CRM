<template lang="pug">
.usage-billing-page.p-6(class="md:p-8")
  //- Page Header
  .header.mb-8
    .flex.items-center.justify-between.flex-wrap.gap-4
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)")
          Icon.mr-2.align-middle(name="ph:gauge-bold" size="32" style="color: var(--accent-color, #7849ff)")
          | {{ $t('usageBilling.title') }}
        p(style="color: var(--text-muted)") {{ $t('usageBilling.subtitle') }}
      .flex.items-center.gap-3.flex-wrap
        el-select(
          v-model="billingPeriod"
          style="width: 200px"
          :placeholder="$t('usageBilling.selectPeriod')"
        )
          el-option(
            v-for="period in billingPeriods"
            :key="period.value"
            :label="period.label"
            :value="period.value"
          )
        el-button(type="primary" @click="generateInvoices")
          Icon(name="ph:file-text-bold" size="16")
          span.ml-2 {{ $t('usageBilling.generateInvoices') }}
        el-button(@click="exportData")
          Icon(name="ph:export-bold" size="16")
          span.ml-2 {{ $t('common.export') }}

  //- KPI Cards
  .grid.gap-4.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-5")
    .kpi-card(v-for="kpi in kpiCards" :key="kpi.key")
      .flex.items-center.justify-between
        div
          p.text-xs.font-medium.uppercase.tracking-wide(style="color: var(--text-muted)") {{ kpi.label }}
          p.text-2xl.font-bold.mt-1(:style="{ color: kpi.color }") {{ kpi.value }}
          p.text-xs.mt-1(style="color: var(--text-secondary)")
            span(:style="{ color: kpi.trend === 'up' ? '#22c55e' : '#ef4444' }")
              Icon(:name="kpi.trend === 'up' ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="12")
              |  {{ kpi.change }}
            |  {{ $t('usageBilling.vsLastMonth') }}
        .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
          Icon(:name="kpi.icon" size="22" :style="{ color: kpi.color }")

  //- Tabs
  el-tabs(v-model="activeTab" type="border-card")
    //- Usage Dashboard Tab
    el-tab-pane(:label="$t('usageBilling.usageDashboard')" name="usage")
      .mb-4.flex.items-center.justify-between.flex-wrap.gap-3
        el-input(
          v-model="usageSearch"
          :placeholder="$t('usageBilling.searchCustomers')"
          prefix-icon="Search"
          style="width: 280px"
          clearable
        )
        el-select(
          v-model="usageStatusFilter"
          :placeholder="$t('usageBilling.filterByStatus')"
          clearable
          style="width: 180px"
        )
          el-option(:label="$t('common.all')" value="")
          el-option(:label="$t('usageBilling.withinLimit')" value="within")
          el-option(:label="$t('usageBilling.nearLimit')" value="near")
          el-option(:label="$t('usageBilling.overLimit')" value="over")

      el-table(:data="filteredUsageData" stripe style="width: 100%")
        el-table-column(prop="customer" :label="$t('usageBilling.customer')" min-width="180")
          template(#default="{ row }")
            .flex.items-center.gap-2
              .customer-avatar(:style="{ background: getAvatarColor(row.customer) }") {{ getInitials(row.customer) }}
              div
                span.font-semibold {{ row.customer }}
                p.text-xs(style="color: var(--text-muted)") {{ row.plan }}
        el-table-column(:label="$t('usageBilling.currentUsage')" min-width="220")
          template(#default="{ row }")
            .usage-bar-wrapper
              .flex.items-center.justify-between.mb-1
                span.text-xs(style="color: var(--text-secondary)") {{ formatNumber(row.currentUsage) }} / {{ formatNumber(row.planLimit) }} {{ row.unit }}
                span.text-xs.font-bold(:style="{ color: getUsageColor(row.usagePercent) }") {{ row.usagePercent }}%
              el-progress(
                :percentage="Math.min(row.usagePercent, 100)"
                :stroke-width="8"
                :color="getUsageColor(row.usagePercent)"
                :show-text="false"
              )
        el-table-column(:label="$t('usageBilling.overage')" min-width="120" align="center")
          template(#default="{ row }")
            el-tag(
              v-if="row.overage > 0"
              type="danger"
              size="small"
              effect="plain"
            ) +{{ formatNumber(row.overage) }} {{ row.unit }}
            el-tag(v-else size="small" type="success" effect="plain") {{ $t('usageBilling.none') }}
        el-table-column(:label="$t('usageBilling.overageStatus')" min-width="130" align="center")
          template(#default="{ row }")
            el-tag(
              :type="getOverageTagType(row.usagePercent)"
              size="small"
            ) {{ getOverageLabel(row.usagePercent) }}
        el-table-column(:label="$t('usageBilling.projectedInvoice')" min-width="150" align="right")
          template(#default="{ row }")
            span.font-bold(style="color: var(--text-primary)") {{ formatCurrency(row.projectedInvoice) }}
        el-table-column(:label="$t('common.actions')" width="100" align="center")
          template(#default="{ row }")
            el-button(text size="small" @click="viewCustomerDetail(row)")
              Icon(name="ph:eye-bold" size="16")

    //- Meter Configuration Tab
    el-tab-pane(:label="$t('usageBilling.meterConfiguration')" name="meters")
      .mb-4.flex.items-center.justify-between
        p.text-sm(style="color: var(--text-muted)") {{ $t('usageBilling.meterConfigDesc') }}
        el-button(type="primary" size="small" @click="openAddMeterDialog")
          Icon(name="ph:plus-bold" size="14")
          span.ml-1 {{ $t('usageBilling.addMeter') }}

      el-table(:data="meters" stripe style="width: 100%")
        el-table-column(prop="name" :label="$t('usageBilling.meterName')" min-width="160")
          template(#default="{ row }")
            .flex.items-center.gap-2
              .meter-icon(:style="{ background: row.color + '18' }")
                Icon(:name="row.icon" size="18" :style="{ color: row.color }")
              span.font-semibold {{ row.name }}
        el-table-column(prop="unit" :label="$t('usageBilling.unit')" min-width="100")
        el-table-column(:label="$t('usageBilling.unitPrice')" min-width="120" align="right")
          template(#default="{ row }")
            span.font-semibold {{ formatCurrency(row.unitPrice) }}
        el-table-column(:label="$t('usageBilling.billingModel')" min-width="140" align="center")
          template(#default="{ row }")
            el-tag(:type="getBillingModelTag(row.billingModel)" size="small" effect="plain") {{ row.billingModel }}
        el-table-column(:label="$t('usageBilling.totalUsageThisPeriod')" min-width="180")
          template(#default="{ row }")
            .flex.items-center.gap-2
              span.text-sm {{ formatNumber(row.totalUsage) }} {{ row.unit }}
              el-tag(size="small" type="info" effect="plain") {{ row.activeCustomers }} {{ $t('usageBilling.customers') }}
        el-table-column(:label="$t('usageBilling.revenue')" min-width="130" align="right")
          template(#default="{ row }")
            span.font-bold(style="color: #22c55e") {{ formatCurrency(row.revenue) }}
        el-table-column(:label="$t('common.status')" min-width="100" align="center")
          template(#default="{ row }")
            el-switch(
              v-model="row.active"
              :active-text="$t('usageBilling.active')"
              inactive-text=""
              size="small"
            )
        el-table-column(:label="$t('common.actions')" width="100" align="center")
          template(#default="{ row }")
            el-button(text size="small" @click="openEditMeterDialog(row)")
              Icon(name="ph:pencil-simple-bold" size="16")

    //- Invoices Tab
    el-tab-pane(:label="$t('usageBilling.invoices')" name="invoices")
      .mb-4.flex.items-center.justify-between.flex-wrap.gap-3
        .flex.items-center.gap-3
          el-input(
            v-model="invoiceSearch"
            :placeholder="$t('usageBilling.searchInvoices')"
            prefix-icon="Search"
            style="width: 260px"
            clearable
          )
          el-select(
            v-model="invoiceStatusFilter"
            :placeholder="$t('usageBilling.filterByStatus')"
            clearable
            style="width: 160px"
          )
            el-option(:label="$t('common.all')" value="")
            el-option(:label="$t('usageBilling.paid')" value="Paid")
            el-option(:label="$t('usageBilling.pending')" value="Pending")
            el-option(:label="$t('usageBilling.overdue')" value="Overdue")
            el-option(:label="$t('usageBilling.draft')" value="Draft")
        .flex.items-center.gap-2
          .invoice-summary-chip
            span.text-xs(style="color: var(--text-muted)") {{ $t('usageBilling.totalOutstanding') }}:
            span.text-sm.font-bold.ml-1(style="color: #f59e0b") {{ formatCurrency(totalOutstanding) }}

      el-table(:data="filteredInvoices" stripe style="width: 100%")
        el-table-column(prop="invoiceNumber" :label="$t('usageBilling.invoiceNumber')" min-width="130")
          template(#default="{ row }")
            span.font-semibold.text-sm(style="color: var(--accent-color, #7849ff)") {{ row.invoiceNumber }}
        el-table-column(prop="customer" :label="$t('usageBilling.customer')" min-width="160")
        el-table-column(prop="period" :label="$t('usageBilling.period')" min-width="140")
        el-table-column(:label="$t('usageBilling.baseAmount')" min-width="120" align="right")
          template(#default="{ row }")
            span {{ formatCurrency(row.baseAmount) }}
        el-table-column(:label="$t('usageBilling.usageCharges')" min-width="130" align="right")
          template(#default="{ row }")
            span.font-semibold(:style="{ color: row.usageCharges > 0 ? '#f59e0b' : 'var(--text-primary)' }") {{ formatCurrency(row.usageCharges) }}
        el-table-column(:label="$t('usageBilling.total')" min-width="120" align="right")
          template(#default="{ row }")
            span.font-bold(style="color: var(--text-primary)") {{ formatCurrency(row.total) }}
        el-table-column(:label="$t('common.status')" min-width="110" align="center")
          template(#default="{ row }")
            el-tag(
              :type="getInvoiceStatusTag(row.status)"
              size="small"
            ) {{ row.status }}
        el-table-column(:label="$t('common.actions')" width="100" align="center")
          template(#default="{ row }")
            el-button(text size="small" @click="openInvoiceDetail(row)")
              Icon(name="ph:eye-bold" size="16")

    //- Pricing Tiers Tab
    el-tab-pane(:label="$t('usageBilling.pricingTiers')" name="tiers")
      .mb-6
        el-select(
          v-model="selectedMeterForTiers"
          :placeholder="$t('usageBilling.selectMeter')"
          style="width: 240px"
        )
          el-option(
            v-for="meter in meters"
            :key="meter.id"
            :label="meter.name"
            :value="meter.id"
          )

      .grid.gap-6(class="grid-cols-1 md:grid-cols-2 xl:grid-cols-4" v-if="currentMeterTiers.length")
        .tier-card(
          v-for="(tier, idx) in currentMeterTiers"
          :key="tier.name"
          :class="{ 'tier-popular': tier.popular }"
        )
          .tier-header(:style="{ borderBottomColor: tier.color }")
            .flex.items-center.justify-between
              span.tier-badge(:style="{ background: tier.color + '18', color: tier.color }") {{ $t('usageBilling.tier') }} {{ idx + 1 }}
              el-tag(v-if="tier.popular" type="warning" size="small" effect="dark") {{ $t('usageBilling.popular') }}
            h4.text-lg.font-bold.mt-3(style="color: var(--text-primary)") {{ tier.name }}
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ tier.description }}
          .tier-body
            .tier-detail
              span.tier-detail-label {{ $t('usageBilling.usageRange') }}
              span.tier-detail-value {{ tier.rangeLabel }}
            .tier-detail
              span.tier-detail-label {{ $t('usageBilling.unitPrice') }}
              span.tier-detail-value.font-bold(:style="{ color: tier.color }") {{ formatCurrency(tier.unitPrice) }}
            .tier-detail
              span.tier-detail-label {{ $t('usageBilling.currentCustomers') }}
              span.tier-detail-value
                .flex.items-center.gap-2
                  span {{ tier.customerCount }}
                  el-progress(
                    :percentage="tier.customerPercent"
                    :stroke-width="6"
                    :color="tier.color"
                    :show-text="false"
                    style="width: 60px"
                  )
            .tier-detail
              span.tier-detail-label {{ $t('usageBilling.monthlyRevenue') }}
              span.tier-detail-value.font-bold(style="color: #22c55e") {{ formatCurrency(tier.monthlyRevenue) }}

      .text-center.py-12(v-else)
        Icon(name="ph:stack-bold" size="48" style="color: var(--text-muted)")
        p.mt-3(style="color: var(--text-muted)") {{ $t('usageBilling.selectMeterToViewTiers') }}

  //- Meter Configuration Dialog
  el-dialog(
    v-model="showMeterDialog"
    :title="editingMeter ? $t('usageBilling.editMeter') : $t('usageBilling.addMeter')"
    width="600px"
    top="5vh"
  )
    el-form(:model="meterForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('usageBilling.meterName')")
          el-input(v-model="meterForm.name" :placeholder="$t('usageBilling.enterMeterName')")
        el-form-item(:label="$t('usageBilling.unit')")
          el-input(v-model="meterForm.unit" :placeholder="$t('usageBilling.enterUnit')")
        el-form-item(:label="$t('usageBilling.unitPrice')")
          el-input(v-model.number="meterForm.unitPrice" type="number" :placeholder="$t('usageBilling.enterUnitPrice')")
            template(#prepend) $
        el-form-item(:label="$t('usageBilling.billingModel')")
          el-select(v-model="meterForm.billingModel" style="width: 100%")
            el-option(:label="$t('billing.perUnit')" value="Per-Unit")
            el-option(:label="$t('billing.tiered')" value="Tiered")
            el-option(:label="$t('billing.volume')" value="Volume")

      //- Tiers configuration for tiered/volume billing
      template(v-if="meterForm.billingModel === 'Tiered' || meterForm.billingModel === 'Volume'")
        .mb-4.mt-2
          .flex.items-center.justify-between.mb-3
            h4.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('usageBilling.tierConfiguration') }}
            el-button(text size="small" @click="addTierRow")
              Icon(name="ph:plus-bold" size="14")
              span.ml-1 {{ $t('usageBilling.addTier') }}
          .tier-config-row(v-for="(tier, idx) in meterForm.tiers" :key="idx")
            .grid.gap-3.items-end(class="grid-cols-4")
              el-form-item(:label="idx === 0 ? $t('usageBilling.from') : ''" class="!mb-0")
                el-input(v-model.number="tier.from" type="number" size="small")
              el-form-item(:label="idx === 0 ? $t('usageBilling.to') : ''" class="!mb-0")
                el-input(v-model.number="tier.to" type="number" size="small" :placeholder="$t('usageBilling.unlimited')")
              el-form-item(:label="idx === 0 ? $t('usageBilling.pricePerUnit') : ''" class="!mb-0")
                el-input(v-model.number="tier.price" type="number" size="small")
                  template(#prepend) $
              .flex.items-center.justify-center(style="padding-bottom: 2px")
                el-button(
                  text
                  size="small"
                  type="danger"
                  @click="removeTierRow(idx)"
                  :disabled="meterForm.tiers.length <= 1"
                )
                  Icon(name="ph:trash-bold" size="16")

    template(#footer)
      el-button(@click="showMeterDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveMeter") {{ $t('common.save') }}

  //- Invoice Detail Dialog
  el-dialog(
    v-model="showInvoiceDetail"
    :title="$t('usageBilling.invoiceDetail')"
    width="700px"
    top="5vh"
  )
    template(v-if="selectedInvoice")
      .invoice-detail-header.mb-6
        .flex.items-center.justify-between
          div
            h3.text-xl.font-bold(style="color: var(--text-primary)") {{ selectedInvoice.invoiceNumber }}
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ selectedInvoice.customer }} - {{ selectedInvoice.period }}
          el-tag(
            :type="getInvoiceStatusTag(selectedInvoice.status)"
            size="large"
          ) {{ selectedInvoice.status }}

      .invoice-section.mb-4
        h4.text-sm.font-semibold.uppercase.mb-3(style="color: var(--text-muted)") {{ $t('usageBilling.chargeBreakdown') }}
        el-table(:data="selectedInvoice.lineItems" stripe size="small" style="width: 100%")
          el-table-column(prop="description" :label="$t('common.description')" min-width="200")
          el-table-column(prop="quantity" :label="$t('usageBilling.quantity')" min-width="100" align="center")
          el-table-column(:label="$t('usageBilling.rate')" min-width="100" align="right")
            template(#default="{ row }")
              span {{ formatCurrency(row.rate) }}
          el-table-column(:label="$t('usageBilling.amount')" min-width="120" align="right")
            template(#default="{ row }")
              span.font-semibold {{ formatCurrency(row.amount) }}

      .invoice-totals.mt-4
        .invoice-total-row
          span {{ $t('usageBilling.subtotal') }}
          span {{ formatCurrency(selectedInvoice.baseAmount + selectedInvoice.usageCharges) }}
        .invoice-total-row
          span {{ $t('usageBilling.tax') }} ({{ selectedInvoice.taxRate }}%)
          span {{ formatCurrency(selectedInvoice.taxAmount) }}
        .invoice-total-row.total-final
          span.font-bold {{ $t('usageBilling.grandTotal') }}
          span.font-bold.text-lg(:style="{ color: 'var(--accent-color, #7849ff)' }") {{ formatCurrency(selectedInvoice.total) }}

    template(#footer)
      el-button(@click="showInvoiceDetail = false") {{ $t('common.close') }}
      el-button(type="primary" @click="downloadInvoice")
        Icon(name="ph:download-simple-bold" size="14")
        span.ml-1 {{ $t('usageBilling.downloadPDF') }}
</template>

<script setup lang="ts">
/* eslint-disable no-use-before-define */
import { ref, computed, onMounted } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Usage Billing' });

const { t } = useI18n();

const loading = ref(false);

// ─── Types ──────────────────────────────────────────────────
interface UsageCustomer {
  id: number;
  customer: string;
  plan: string;
  currentUsage: number;
  planLimit: number;
  unit: string;
  usagePercent: number;
  overage: number;
  projectedInvoice: number;
}

interface Meter {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  billingModel: string;
  icon: string;
  color: string;
  totalUsage: number;
  activeCustomers: number;
  revenue: number;
  active: boolean;
  tiers: TierConfig[];
}

interface TierConfig {
  name: string;
  from: number;
  to: number | null;
  price: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customer: string;
  period: string;
  baseAmount: number;
  usageCharges: number;
  total: number;
  status: string;
  taxRate: number;
  taxAmount: number;
  lineItems: InvoiceLineItem[];
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface PricingTier {
  name: string;
  description: string;
  rangeLabel: string;
  unitPrice: number;
  customerCount: number;
  customerPercent: number;
  monthlyRevenue: number;
  color: string;
  popular: boolean;
}

interface MeterFormTier {
  from: number;
  to: number | null;
  price: number;
}

// ─── State ──────────────────────────────────────────────────
const activeTab = ref('usage');
const billingPeriod = ref('2026-03');
const usageSearch = ref('');
const usageStatusFilter = ref('');
const invoiceSearch = ref('');
const invoiceStatusFilter = ref('');
const selectedMeterForTiers = ref('meter-api');
const showMeterDialog = ref(false);
const showInvoiceDetail = ref(false);
const editingMeter = ref(false);
const selectedInvoice = ref<Invoice | null>(null);

const billingPeriods = [
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-02', label: 'February 2026' },
  { value: '2026-01', label: 'January 2026' },
  { value: '2025-12', label: 'December 2025' },
  { value: '2025-11', label: 'November 2025' },
  { value: '2025-10', label: 'October 2025' }
];

// ─── Meter Form ─────────────────────────────────────────────
const meterForm = ref({
  id: '',
  name: '',
  unit: '',
  unitPrice: 0,
  billingModel: 'Per-Unit',
  tiers: [{ from: 0, to: null, price: 0 }] as MeterFormTier[]
});

function addTierRow() {
  const lastTier = meterForm.value.tiers[meterForm.value.tiers.length - 1];
  const nextFrom = lastTier && lastTier.to != null ? lastTier.to + 1 : 0;
  meterForm.value.tiers.push({ from: nextFrom, to: null, price: 0 });
}

function removeTierRow(idx: number) {
  if (meterForm.value.tiers.length > 1) {
    meterForm.value.tiers.splice(idx, 1);
  }
}

// ─── Data: Customers ────────────────────────────────────────
const usageData = ref<UsageCustomer[]>([]);

// ─── Data: Meters ───────────────────────────────────────────
const meters = ref<Meter[]>([]);

// ─── Data: Invoices ─────────────────────────────────────────
const invoices = ref<Invoice[]>([]);

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => {
  const pendingInvoices = invoices.value.filter(i => i.status === 'Pending' || i.status === 'Overdue');
  const totalUsageRevenue = invoices.value.reduce((sum, i) => sum + i.usageCharges, 0);
  const activeMeters = meters.value.filter(m => m.active).length;
  const totalInvoices = invoices.value.length;
  const avgRevenuePerCustomer = totalUsageRevenue / 12;
  const overageRevenue = usageData.value.filter(c => c.overage > 0).reduce((sum, c) => sum + c.projectedInvoice * 0.3, 0);

  return [
    {
      key: 'totalRevenue',
      label: t('usageBilling.totalUsageRevenue'),
      value: formatCurrency(totalUsageRevenue),
      icon: 'ph:currency-dollar-bold',
      color: '#7849ff',
      trend: 'up',
      change: '+18.3%'
    },
    {
      key: 'activeMeters',
      label: t('usageBilling.activeMeters'),
      value: String(activeMeters),
      icon: 'ph:gauge-bold',
      color: '#3b82f6',
      trend: 'up',
      change: '+1'
    },
    {
      key: 'invoicesGenerated',
      label: t('usageBilling.invoicesGenerated'),
      value: String(totalInvoices),
      icon: 'ph:file-text-bold',
      color: '#22c55e',
      trend: 'up',
      change: '+3'
    },
    {
      key: 'avgRevenue',
      label: t('usageBilling.avgRevenuePerCustomer'),
      value: formatCurrency(avgRevenuePerCustomer),
      icon: 'ph:users-bold',
      color: '#f59e0b',
      trend: 'up',
      change: '+12.7%'
    },
    {
      key: 'overageRevenue',
      label: t('usageBilling.overageRevenue'),
      value: formatCurrency(overageRevenue),
      icon: 'ph:warning-bold',
      color: '#ef4444',
      trend: 'up',
      change: '+24.1%'
    }
  ];
});

// ─── Computed: Filtered Usage Data ──────────────────────────
const filteredUsageData = computed(() => {
  let data = usageData.value;
  if (usageSearch.value) {
    const q = usageSearch.value.toLowerCase();
    data = data.filter(c => c.customer.toLowerCase().includes(q) || c.plan.toLowerCase().includes(q));
  }
  if (usageStatusFilter.value) {
    if (usageStatusFilter.value === 'within') data = data.filter(c => c.usagePercent < 80);
    else if (usageStatusFilter.value === 'near') data = data.filter(c => c.usagePercent >= 80 && c.usagePercent <= 100);
    else if (usageStatusFilter.value === 'over') data = data.filter(c => c.usagePercent > 100);
  }
  return data;
});

// ─── Computed: Filtered Invoices ────────────────────────────
const filteredInvoices = computed(() => {
  let data = invoices.value;
  if (invoiceSearch.value) {
    const q = invoiceSearch.value.toLowerCase();
    data = data.filter(i => i.invoiceNumber.toLowerCase().includes(q) || i.customer.toLowerCase().includes(q));
  }
  if (invoiceStatusFilter.value) {
    data = data.filter(i => i.status === invoiceStatusFilter.value);
  }
  return data;
});

// ─── Computed: Total Outstanding ────────────────────────────
const totalOutstanding = computed(() => {
  return invoices.value.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((sum, i) => sum + i.total, 0);
});

// ─── Computed: Pricing Tiers for Selected Meter ─────────────
const currentMeterTiers = computed((): PricingTier[] => {
  const meter = meters.value.find(m => m.id === selectedMeterForTiers.value);
  if (!meter) return [];

  const tierColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];
  const totalCustomers = meter.activeCustomers;
  const customerDistributions = [4, 5, 2, 1];

  return meter.tiers.map((tier, idx) => {
    const custCount = customerDistributions[idx] || 1;
    return {
      name: tier.name,
      description: getTierDescription(tier, meter.unit),
      rangeLabel:
        tier.to != null ? `${formatNumber(tier.from)} - ${formatNumber(tier.to)} ${meter.unit}` : `${formatNumber(tier.from)}+ ${meter.unit}`,
      unitPrice: tier.price,
      customerCount: custCount,
      customerPercent: totalCustomers > 0 ? Math.round((custCount / totalCustomers) * 100) : 0,
      monthlyRevenue: Math.round(tier.price * (tier.to != null ? (tier.to - tier.from) * 0.6 : 10000) * custCount),
      color: tierColors[idx] || '#7849ff',
      popular: idx === 1
    };
  });
});

// ─── Helpers ────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function getAvatarColor(name: string): string {
  const colors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] || '#7849ff';
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getUsageColor(percent: number): string {
  if (percent > 100) return '#ef4444';
  if (percent >= 80) return '#f59e0b';
  return '#22c55e';
}

function getOverageTagType(percent: number): string {
  if (percent > 100) return 'danger';
  if (percent >= 80) return 'warning';
  return 'success';
}

function getOverageLabel(percent: number): string {
  if (percent > 100) return t('usageBilling.overLimit');
  if (percent >= 80) return t('usageBilling.nearLimit');
  return t('usageBilling.withinLimit');
}

function getBillingModelTag(model: string): string {
  if (model === 'Tiered') return 'warning';
  if (model === 'Volume') return '';
  return 'success';
}

function getInvoiceStatusTag(status: string): string {
  if (status === 'Paid') return 'success';
  if (status === 'Pending') return 'warning';
  if (status === 'Overdue') return 'danger';
  return 'info';
}

function getTierDescription(tier: TierConfig, unit: string): string {
  if (tier.to != null) {
    return `${t('usageBilling.from')} ${formatNumber(tier.from)} ${t('usageBilling.to').toLowerCase()} ${formatNumber(tier.to)} ${unit}`;
  }
  return `${formatNumber(tier.from)}+ ${unit} (${t('usageBilling.unlimited')})`;
}

// ─── Actions ────────────────────────────────────────────────
function generateInvoices() {
  ElMessage.success(t('usageBilling.invoicesGeneratedMsg'));
}

function exportData() {
  ElMessage.info(t('usageBilling.exportStarted'));
}

function viewCustomerDetail(row: UsageCustomer) {
  ElMessage.info(`${t('usageBilling.viewingDetails')}: ${row.customer}`);
}

function openAddMeterDialog() {
  editingMeter.value = false;
  meterForm.value = {
    id: '',
    name: '',
    unit: '',
    unitPrice: 0,
    billingModel: 'Per-Unit',
    tiers: [{ from: 0, to: null, price: 0 }]
  };
  showMeterDialog.value = true;
}

function openEditMeterDialog(meter: Meter) {
  editingMeter.value = true;
  meterForm.value = {
    id: meter.id,
    name: meter.name,
    unit: meter.unit,
    unitPrice: meter.unitPrice,
    billingModel: meter.billingModel,
    tiers: meter.tiers.map(t => ({ from: t.from, to: t.to, price: t.price }))
  };
  showMeterDialog.value = true;
}

function saveMeter() {
  showMeterDialog.value = false;
  ElMessage.success(t('usageBilling.meterSaved'));
}

function openInvoiceDetail(invoice: Invoice) {
  selectedInvoice.value = invoice;
  showInvoiceDetail.value = true;
}

function downloadInvoice() {
  ElMessage.info(t('usageBilling.downloadStarted'));
}

// ─── API Data Loading ───────────────────────────────────────
const fallbackUsageData: UsageCustomer[] = [
  {
    id: 1,
    customer: 'Acme Corp',
    plan: 'Enterprise',
    currentUsage: 48500,
    planLimit: 50000,
    unit: 'API calls',
    usagePercent: 97,
    overage: 0,
    projectedInvoice: 4850
  },
  {
    id: 2,
    customer: 'GlobalTech Inc',
    plan: 'Business',
    currentUsage: 32100,
    planLimit: 25000,
    unit: 'API calls',
    usagePercent: 128,
    overage: 7100,
    projectedInvoice: 3920
  },
  {
    id: 3,
    customer: 'StartupHub',
    plan: 'Starter',
    currentUsage: 4200,
    planLimit: 10000,
    unit: 'API calls',
    usagePercent: 42,
    overage: 0,
    projectedInvoice: 420
  },
  {
    id: 4,
    customer: 'DataStream LLC',
    plan: 'Enterprise',
    currentUsage: 245,
    planLimit: 200,
    unit: 'GB',
    usagePercent: 122,
    overage: 45,
    projectedInvoice: 6200
  },
  {
    id: 5,
    customer: 'CloudNine Solutions',
    plan: 'Business',
    currentUsage: 78,
    planLimit: 100,
    unit: 'GB',
    usagePercent: 78,
    overage: 0,
    projectedInvoice: 1560
  },
  {
    id: 6,
    customer: 'RetailMax',
    plan: 'Enterprise',
    currentUsage: 142,
    planLimit: 150,
    unit: 'users',
    usagePercent: 95,
    overage: 0,
    projectedInvoice: 7100
  },
  {
    id: 7,
    customer: 'FinanceFirst',
    plan: 'Business',
    currentUsage: 56,
    planLimit: 50,
    unit: 'users',
    usagePercent: 112,
    overage: 6,
    projectedInvoice: 3360
  },
  {
    id: 8,
    customer: 'HealthTech Pro',
    plan: 'Enterprise',
    currentUsage: 89000,
    planLimit: 100000,
    unit: 'emails',
    usagePercent: 89,
    overage: 0,
    projectedInvoice: 5340
  },
  {
    id: 9,
    customer: 'EduLearn Platform',
    plan: 'Starter',
    currentUsage: 1200,
    planLimit: 5000,
    unit: 'API calls',
    usagePercent: 24,
    overage: 0,
    projectedInvoice: 240
  },
  {
    id: 10,
    customer: 'LogiTrack Systems',
    plan: 'Business',
    currentUsage: 18500,
    planLimit: 20000,
    unit: 'workflows',
    usagePercent: 93,
    overage: 0,
    projectedInvoice: 2775
  },
  {
    id: 11,
    customer: 'MediaGroup Co',
    plan: 'Enterprise',
    currentUsage: 310,
    planLimit: 250,
    unit: 'GB',
    usagePercent: 124,
    overage: 60,
    projectedInvoice: 8450
  },
  {
    id: 12,
    customer: 'TravelWise',
    plan: 'Starter',
    currentUsage: 7800,
    planLimit: 10000,
    unit: 'API calls',
    usagePercent: 78,
    overage: 0,
    projectedInvoice: 780
  }
];

const fallbackMeters: Meter[] = [
  {
    id: 'meter-api',
    name: 'API Calls',
    unit: 'calls',
    unitPrice: 0.002,
    billingModel: 'Tiered',
    icon: 'ph:code-bold',
    color: '#7849ff',
    totalUsage: 385200,
    activeCustomers: 12,
    revenue: 7704,
    active: true,
    tiers: [
      { name: 'Free Tier', from: 0, to: 1000, price: 0 },
      { name: 'Standard', from: 1001, to: 50000, price: 0.002 },
      { name: 'High Volume', from: 50001, to: 200000, price: 0.0015 },
      { name: 'Enterprise', from: 200001, to: null, price: 0.001 }
    ]
  },
  {
    id: 'meter-storage',
    name: 'Storage',
    unit: 'GB',
    unitPrice: 0.1,
    billingModel: 'Per-Unit',
    icon: 'ph:database-bold',
    color: '#3b82f6',
    totalUsage: 1840,
    activeCustomers: 9,
    revenue: 18400,
    active: true,
    tiers: [
      { name: 'Basic', from: 0, to: 50, price: 0.1 },
      { name: 'Standard', from: 51, to: 200, price: 0.08 },
      { name: 'Premium', from: 201, to: 500, price: 0.06 },
      { name: 'Unlimited', from: 501, to: null, price: 0.04 }
    ]
  },
  {
    id: 'meter-users',
    name: 'Users',
    unit: 'users',
    unitPrice: 12.0,
    billingModel: 'Per-Unit',
    icon: 'ph:users-bold',
    color: '#22c55e',
    totalUsage: 486,
    activeCustomers: 10,
    revenue: 5832,
    active: true,
    tiers: [
      { name: 'Small Team', from: 0, to: 10, price: 15.0 },
      { name: 'Growth', from: 11, to: 50, price: 12.0 },
      { name: 'Scale', from: 51, to: 150, price: 10.0 },
      { name: 'Enterprise', from: 151, to: null, price: 8.0 }
    ]
  },
  {
    id: 'meter-emails',
    name: 'Emails Sent',
    unit: 'emails',
    unitPrice: 0.001,
    billingModel: 'Volume',
    icon: 'ph:envelope-bold',
    color: '#f59e0b',
    totalUsage: 542000,
    activeCustomers: 8,
    revenue: 5420,
    active: true,
    tiers: [
      { name: 'Starter', from: 0, to: 10000, price: 0.002 },
      { name: 'Growth', from: 10001, to: 100000, price: 0.001 },
      { name: 'Scale', from: 100001, to: 500000, price: 0.0008 },
      { name: 'Bulk', from: 500001, to: null, price: 0.0005 }
    ]
  },
  {
    id: 'meter-workflows',
    name: 'Workflows Run',
    unit: 'runs',
    unitPrice: 0.05,
    billingModel: 'Tiered',
    icon: 'ph:flow-arrow-bold',
    color: '#ec4899',
    totalUsage: 28400,
    activeCustomers: 7,
    revenue: 14200,
    active: true,
    tiers: [
      { name: 'Lite', from: 0, to: 500, price: 0.08 },
      { name: 'Standard', from: 501, to: 5000, price: 0.05 },
      { name: 'Pro', from: 5001, to: 20000, price: 0.03 },
      { name: 'Unlimited', from: 20001, to: null, price: 0.02 }
    ]
  }
];

const fallbackInvoices: Invoice[] = [
  {
    id: 1,
    invoiceNumber: 'INV-2026-0301',
    customer: 'Acme Corp',
    period: 'Mar 2026',
    baseAmount: 2500,
    usageCharges: 2350,
    total: 5557.5,
    status: 'Pending',
    taxRate: 15,
    taxAmount: 707.5,
    lineItems: [
      { description: 'Enterprise Plan - Base', quantity: 1, rate: 2500, amount: 2500 },
      { description: 'API Calls (48,500 calls)', quantity: 48500, rate: 0.002, amount: 970 },
      { description: 'Storage (120 GB)', quantity: 120, rate: 10, amount: 1200 },
      { description: 'Additional Users (5)', quantity: 5, rate: 36, amount: 180 }
    ]
  },
  {
    id: 2,
    invoiceNumber: 'INV-2026-0302',
    customer: 'GlobalTech Inc',
    period: 'Mar 2026',
    baseAmount: 1500,
    usageCharges: 2420,
    total: 4507,
    status: 'Pending',
    taxRate: 15,
    taxAmount: 587,
    lineItems: [
      { description: 'Business Plan - Base', quantity: 1, rate: 1500, amount: 1500 },
      { description: 'API Calls (32,100 calls) + Overage', quantity: 32100, rate: 0.002, amount: 1420 },
      { description: 'Storage (85 GB)', quantity: 85, rate: 10, amount: 850 },
      { description: 'Overage surcharge', quantity: 1, rate: 150, amount: 150 }
    ]
  },
  {
    id: 3,
    invoiceNumber: 'INV-2026-0303',
    customer: 'StartupHub',
    period: 'Mar 2026',
    baseAmount: 500,
    usageCharges: 84,
    total: 671.6,
    status: 'Draft',
    taxRate: 15,
    taxAmount: 87.6,
    lineItems: [
      { description: 'Starter Plan - Base', quantity: 1, rate: 500, amount: 500 },
      { description: 'API Calls (4,200 calls)', quantity: 4200, rate: 0.02, amount: 84 }
    ]
  },
  {
    id: 4,
    invoiceNumber: 'INV-2026-0204',
    customer: 'DataStream LLC',
    period: 'Feb 2026',
    baseAmount: 2500,
    usageCharges: 3700,
    total: 7130,
    status: 'Paid',
    taxRate: 15,
    taxAmount: 930,
    lineItems: [
      { description: 'Enterprise Plan - Base', quantity: 1, rate: 2500, amount: 2500 },
      { description: 'Storage (245 GB) + Overage', quantity: 245, rate: 10, amount: 2450 },
      { description: 'Storage overage (45 GB)', quantity: 45, rate: 25, amount: 1125 },
      { description: 'Workflows (1,200 runs)', quantity: 1200, rate: 0.05, amount: 60 },
      { description: 'Credit adjustment', quantity: 1, rate: -65, amount: -65 }
    ]
  },
  {
    id: 5,
    invoiceNumber: 'INV-2026-0205',
    customer: 'CloudNine Solutions',
    period: 'Feb 2026',
    baseAmount: 1500,
    usageCharges: 1060,
    total: 2944,
    status: 'Paid',
    taxRate: 15,
    taxAmount: 384,
    lineItems: [
      { description: 'Business Plan - Base', quantity: 1, rate: 1500, amount: 1500 },
      { description: 'Storage (78 GB)', quantity: 78, rate: 10, amount: 780 },
      { description: 'Emails Sent (15,000)', quantity: 15000, rate: 0.001, amount: 15 },
      { description: 'Users (18)', quantity: 18, rate: 12, amount: 216 },
      { description: 'Workflows (980 runs)', quantity: 980, rate: 0.05, amount: 49 }
    ]
  },
  {
    id: 6,
    invoiceNumber: 'INV-2026-0206',
    customer: 'RetailMax',
    period: 'Feb 2026',
    baseAmount: 2500,
    usageCharges: 4600,
    total: 8165,
    status: 'Paid',
    taxRate: 15,
    taxAmount: 1065,
    lineItems: [
      { description: 'Enterprise Plan - Base', quantity: 1, rate: 2500, amount: 2500 },
      { description: 'Users (142 seats)', quantity: 142, rate: 10, amount: 1420 },
      { description: 'API Calls (95,000)', quantity: 95000, rate: 0.0015, amount: 1425 },
      { description: 'Emails Sent (350,000)', quantity: 350000, rate: 0.001, amount: 350 },
      { description: 'Workflows (8,100 runs)', quantity: 8100, rate: 0.05, amount: 405 },
      { description: 'Storage (200 GB)', quantity: 200, rate: 5, amount: 1000 }
    ]
  },
  {
    id: 7,
    invoiceNumber: 'INV-2026-0207',
    customer: 'FinanceFirst',
    period: 'Feb 2026',
    baseAmount: 1500,
    usageCharges: 1860,
    total: 3864,
    status: 'Overdue',
    taxRate: 15,
    taxAmount: 504,
    lineItems: [
      { description: 'Business Plan - Base', quantity: 1, rate: 1500, amount: 1500 },
      { description: 'Users (56 seats) + Overage', quantity: 56, rate: 12, amount: 672 },
      { description: 'User overage (6 seats)', quantity: 6, rate: 48, amount: 288 },
      { description: 'API Calls (22,000)', quantity: 22000, rate: 0.002, amount: 440 },
      { description: 'Emails Sent (46,000)', quantity: 46000, rate: 0.01, amount: 460 }
    ]
  },
  {
    id: 8,
    invoiceNumber: 'INV-2026-0208',
    customer: 'HealthTech Pro',
    period: 'Feb 2026',
    baseAmount: 2500,
    usageCharges: 2840,
    total: 6141,
    status: 'Paid',
    taxRate: 15,
    taxAmount: 801,
    lineItems: [
      { description: 'Enterprise Plan - Base', quantity: 1, rate: 2500, amount: 2500 },
      { description: 'Emails Sent (89,000)', quantity: 89000, rate: 0.001, amount: 890 },
      { description: 'API Calls (60,000)', quantity: 60000, rate: 0.0015, amount: 900 },
      { description: 'Storage (105 GB)', quantity: 105, rate: 10, amount: 1050 }
    ]
  },
  {
    id: 9,
    invoiceNumber: 'INV-2026-0109',
    customer: 'EduLearn Platform',
    period: 'Jan 2026',
    baseAmount: 500,
    usageCharges: 168,
    total: 768.2,
    status: 'Paid',
    taxRate: 15,
    taxAmount: 100.2,
    lineItems: [
      { description: 'Starter Plan - Base', quantity: 1, rate: 500, amount: 500 },
      { description: 'API Calls (1,200)', quantity: 1200, rate: 0.02, amount: 24 },
      { description: 'Emails Sent (8,000)', quantity: 8000, rate: 0.002, amount: 16 },
      { description: 'Workflows (320 runs)', quantity: 320, rate: 0.4, amount: 128 }
    ]
  },
  {
    id: 10,
    invoiceNumber: 'INV-2026-0110',
    customer: 'LogiTrack Systems',
    period: 'Jan 2026',
    baseAmount: 1500,
    usageCharges: 1275,
    total: 3190.75,
    status: 'Paid',
    taxRate: 15,
    taxAmount: 415.75,
    lineItems: [
      { description: 'Business Plan - Base', quantity: 1, rate: 1500, amount: 1500 },
      { description: 'Workflows (18,500 runs)', quantity: 18500, rate: 0.05, amount: 925 },
      { description: 'API Calls (14,000)', quantity: 14000, rate: 0.002, amount: 280 },
      { description: 'Storage (35 GB)', quantity: 35, rate: 2, amount: 70 }
    ]
  },
  {
    id: 11,
    invoiceNumber: 'INV-2026-0111',
    customer: 'MediaGroup Co',
    period: 'Jan 2026',
    baseAmount: 2500,
    usageCharges: 5950,
    total: 9717.5,
    status: 'Overdue',
    taxRate: 15,
    taxAmount: 1267.5,
    lineItems: [
      { description: 'Enterprise Plan - Base', quantity: 1, rate: 2500, amount: 2500 },
      { description: 'Storage (310 GB) + Overage', quantity: 310, rate: 10, amount: 3100 },
      { description: 'Storage overage (60 GB)', quantity: 60, rate: 25, amount: 1500 },
      { description: 'API Calls (45,000)', quantity: 45000, rate: 0.002, amount: 900 },
      { description: 'Users (85 seats)', quantity: 85, rate: 5.29, amount: 450 }
    ]
  },
  {
    id: 12,
    invoiceNumber: 'INV-2026-0112',
    customer: 'TravelWise',
    period: 'Jan 2026',
    baseAmount: 500,
    usageCharges: 312,
    total: 933.8,
    status: 'Paid',
    taxRate: 15,
    taxAmount: 121.8,
    lineItems: [
      { description: 'Starter Plan - Base', quantity: 1, rate: 500, amount: 500 },
      { description: 'API Calls (7,800)', quantity: 7800, rate: 0.02, amount: 156 },
      { description: 'Emails Sent (12,000)', quantity: 12000, rate: 0.001, amount: 12 },
      { description: 'Workflows (480 runs)', quantity: 480, rate: 0.3, amount: 144 }
    ]
  },
  {
    id: 13,
    invoiceNumber: 'INV-2025-1213',
    customer: 'Acme Corp',
    period: 'Dec 2025',
    baseAmount: 2500,
    usageCharges: 2180,
    total: 5382,
    status: 'Paid',
    taxRate: 15,
    taxAmount: 702,
    lineItems: [
      { description: 'Enterprise Plan - Base', quantity: 1, rate: 2500, amount: 2500 },
      { description: 'API Calls (42,000)', quantity: 42000, rate: 0.002, amount: 840 },
      { description: 'Storage (110 GB)', quantity: 110, rate: 10, amount: 1100 },
      { description: 'Workflows (4,800 runs)', quantity: 4800, rate: 0.05, amount: 240 }
    ]
  },
  {
    id: 14,
    invoiceNumber: 'INV-2025-1214',
    customer: 'GlobalTech Inc',
    period: 'Dec 2025',
    baseAmount: 1500,
    usageCharges: 1950,
    total: 3967.5,
    status: 'Paid',
    taxRate: 15,
    taxAmount: 517.5,
    lineItems: [
      { description: 'Business Plan - Base', quantity: 1, rate: 1500, amount: 1500 },
      { description: 'API Calls (28,000)', quantity: 28000, rate: 0.002, amount: 560 },
      { description: 'Storage (72 GB)', quantity: 72, rate: 10, amount: 720 },
      { description: 'Users (28 seats)', quantity: 28, rate: 12, amount: 336 },
      { description: 'Emails Sent (33,400)', quantity: 33400, rate: 0.01, amount: 334 }
    ]
  },
  {
    id: 15,
    invoiceNumber: 'INV-2025-1215',
    customer: 'RetailMax',
    period: 'Dec 2025',
    baseAmount: 2500,
    usageCharges: 4200,
    total: 7705,
    status: 'Paid',
    taxRate: 15,
    taxAmount: 1005,
    lineItems: [
      { description: 'Enterprise Plan - Base', quantity: 1, rate: 2500, amount: 2500 },
      { description: 'Users (138 seats)', quantity: 138, rate: 10, amount: 1380 },
      { description: 'API Calls (88,000)', quantity: 88000, rate: 0.0015, amount: 1320 },
      { description: 'Storage (190 GB)', quantity: 190, rate: 5, amount: 950 },
      { description: 'Workflows (5,500 runs)', quantity: 5500, rate: 0.05, amount: 275 },
      { description: 'Emails Sent (275,000)', quantity: 275000, rate: 0.001, amount: 275 }
    ]
  }
];

async function loadMeters() {
  try {
    const res = await useApiFetch('usage-billing/meters');
    if (res.success && Array.isArray(res.body)) {
      meters.value = res.body as any;
    } else {
      meters.value = fallbackMeters;
    }
  } catch {
    meters.value = fallbackMeters;
  }
}

async function loadRecords() {
  try {
    const res = await useApiFetch('usage-billing/records');
    if (res.success && Array.isArray(res.body)) {
      usageData.value = res.body as any;
    } else {
      usageData.value = fallbackUsageData;
    }
  } catch {
    usageData.value = fallbackUsageData;
  }
}

async function loadCharges() {
  try {
    const res = await useApiFetch('usage-billing/charges');
    if (res.success && Array.isArray(res.body)) {
      invoices.value = res.body as any;
    } else {
      invoices.value = fallbackInvoices;
    }
  } catch {
    invoices.value = fallbackInvoices;
  }
}

async function loadData() {
  loading.value = true;
  try {
    await Promise.all([loadMeters(), loadRecords(), loadCharges()]);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.usage-billing-page {
  animation: fadeInUp 0.6s ease-out;
  min-height: 100vh;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ─── KPI Cards ──────────────────────────────────────────────
.kpi-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 1.25rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.1);
    border-color: rgba(120, 73, 255, 0.3);
  }
}

.kpi-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Customer Avatar ────────────────────────────────────────
.customer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.7rem;
  flex-shrink: 0;
}

// ─── Usage Bar ──────────────────────────────────────────────
.usage-bar-wrapper {
  min-width: 160px;
}

// ─── Meter Icon ─────────────────────────────────────────────
.meter-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Tier Cards ─────────────────────────────────────────────
.tier-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.1);
  }

  &.tier-popular {
    border-color: rgba(245, 158, 11, 0.4);
    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.08);
  }
}

.tier-header {
  padding: 1.25rem;
  border-bottom: 2px solid var(--border-default);
}

.tier-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tier-body {
  padding: 1rem 1.25rem;
}

.tier-detail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-bottom: 1px dashed var(--border-default);

  &:last-child {
    border-bottom: none;
  }
}

.tier-detail-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.tier-detail-value {
  font-size: 0.85rem;
  color: var(--text-primary);
}

// ─── Invoice Detail ─────────────────────────────────────────
.invoice-detail-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-default);
}

.invoice-section {
  padding: 1rem 0;
}

.invoice-totals {
  background: rgba(120, 73, 255, 0.04);
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.invoice-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  border-bottom: 1px dashed var(--border-default);

  &:last-child {
    border-bottom: none;
  }

  &.total-final {
    padding-top: 0.75rem;
    margin-top: 0.25rem;
    border-top: 2px solid var(--border-default);
    border-bottom: none;
    color: var(--text-primary);
  }
}

// ─── Invoice Summary Chip ───────────────────────────────────
.invoice-summary-chip {
  display: flex;
  align-items: center;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 20px;
  padding: 6px 14px;
}

// ─── Tier Config Row ────────────────────────────────────────
.tier-config-row {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-default);

  &:last-child {
    border-bottom: none;
  }
}

// ─── Tabs Styling ───────────────────────────────────────────
:deep(.el-tabs--border-card) {
  border-radius: 12px;
  border-color: var(--border-default);
  background: var(--bg-elevated);
}

:deep(.el-tabs__header) {
  background: rgba(120, 73, 255, 0.03);
  border-bottom-color: var(--border-default);
}

:deep(.el-tabs__item.is-active) {
  background: var(--bg-elevated);
}

// ─── Responsive ─────────────────────────────────────────────
@media (max-width: 768px) {
  .usage-billing-page {
    padding: 1rem;
  }
}
</style>
