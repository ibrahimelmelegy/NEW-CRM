<template lang="pug">
.shipment-tracker-page.p-6(class="md:p-8")
  //- =====================================================
  //- Page Header
  //- =====================================================
  .header.mb-8
    .flex.items-center.justify-between.flex-wrap.gap-4
      .flex.items-center.gap-4
        .header-icon-wrapper
          Icon(name="ph:package-bold" size="28" style="color: #fff")
        div
          h2.text-3xl.font-bold.mb-1.bg-clip-text.text-transparent.bg-gradient-to-r.from-blue-400.to-blue-600
            | {{ t('shipmentTracker.title') }}
          p(style="color: var(--text-muted)") {{ t('shipmentTracker.subtitle') }}
      .flex.items-center.gap-3.flex-wrap
        el-button(type="primary" @click="handleNewShipment")
          Icon(name="ph:plus-bold" size="16")
          span.ml-2 {{ t('shipmentTracker.newShipment') }}
        el-button(@click="refreshData" :loading="loading")
          Icon(name="ph:arrow-clockwise-bold" size="16")
          span.ml-2 {{ t('shipmentTracker.refresh') }}

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="40" style="color: #3b82f6")

  template(v-else)
    //- =====================================================
    //- KPI Cards
    //- =====================================================
    .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
      .kpi-card(v-for="(kpi, idx) in kpiCards" :key="idx")
        .flex.items-start.justify-between
          div
            p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
            p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}
            .flex.items-center.gap-1.mt-2
              Icon(:name="kpi.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }")
              span.text-xs.font-semibold(:style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ formatTrend(kpi.trend) }}
          .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
            Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

    //- =====================================================
    //- Tabs
    //- =====================================================
    el-tabs(v-model="activeTab" class="tracker-tabs")

      //- ─────────────────────────────────────────────────
      //- Tab 1: Live Tracking
      //- ─────────────────────────────────────────────────
      el-tab-pane(:label="t('shipmentTracker.liveTracking')" name="live")
        //- Filters
        .flex.flex-wrap.gap-3.mb-6
          .flex.flex-wrap.gap-2
            el-button(
              v-for="sf in statusFilters"
              :key="sf.value"
              :type="selectedStatus === sf.value ? 'primary' : 'default'"
              size="small"
              round
              @click="selectedStatus = sf.value"
            ) {{ sf.label }}
          el-select(v-model="selectedCarrier" size="small" style="width: 140px")
            el-option(
              v-for="cf in carrierFilters"
              :key="cf.value"
              :label="cf.label"
              :value="cf.value"
            )

        //- Shipment Cards Grid
        .grid.gap-5(class="grid-cols-1 lg:grid-cols-2")
          .shipment-card(v-for="shipment in filteredLiveShipments" :key="shipment.trackingNumber")
            .flex.items-center.justify-between.mb-3
              .tracking-number(@click="copyTracking(shipment.trackingNumber)")
                | {{ shipment.trackingNumber }}
                Icon.ml-1(name="ph:copy-bold" size="12" style="color: #94a3b8")
              el-tag(
                :type="getStatusTagType(shipment.status)"
                size="small"
                effect="dark"
              ) {{ getStatusLabel(shipment.status) }}

            .flex.items-center.gap-3.mb-3
              .flex.items-center.gap-1
                Icon(name="ph:map-pin-bold" size="14" style="color: #3b82f6")
                span.text-sm.font-medium(style="color: var(--text-primary)") {{ shipment.origin }}
              Icon(name="ph:arrow-right-bold" size="14" style="color: var(--text-muted)")
              .flex.items-center.gap-1
                Icon(name="ph:map-pin-bold" size="14" style="color: #22c55e")
                span.text-sm.font-medium(style="color: var(--text-primary)") {{ shipment.destination }}

            .flex.items-center.justify-between.mb-3
              .flex.items-center.gap-2
                el-tag(size="small" effect="plain" :color="getCarrierColor(shipment.carrier)") {{ shipment.carrier }}
              .flex.items-center.gap-1
                Icon(name="ph:calendar-bold" size="14" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ shipment.eta }}

            //- Progress Steps
            .progress-steps
              template(v-for="(step, sIdx) in progressSteps" :key="sIdx")
                .step-dot(:class="getStepClass(shipment.status, sIdx)" :title="step")
                  Icon(v-if="getStepClass(shipment.status, sIdx) === 'completed'" name="ph:check-bold" size="12")
                  span(v-else) {{ sIdx + 1 }}
                .step-line(v-if="sIdx < progressSteps.length - 1" :class="{ completed: isStepLineCompleted(shipment.status, sIdx) }")

            .flex.justify-between.mt-2
              span.text-xs(
                v-for="step in progressSteps"
                :key="step"
                style="color: var(--text-muted); width: 20%; text-align: center; font-size: 10px"
              ) {{ step }}

        .flex.items-center.justify-center.py-12(v-if="filteredLiveShipments.length === 0")
          .text-center
            Icon(name="ph:package-bold" size="48" style="color: var(--text-muted)")
            p.mt-3(style="color: var(--text-muted)") {{ t('shipmentTracker.noShipments') }}

      //- ─────────────────────────────────────────────────
      //- Tab 2: Shipments Table
      //- ─────────────────────────────────────────────────
      el-tab-pane(:label="t('shipmentTracker.shipmentsTable')" name="table")
        .glass-card.p-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:list-dashes-bold" size="22" style="color: #3b82f6")
              | {{ t('shipmentTracker.shipmentsTable') }}
            .flex.items-center.gap-3.flex-wrap
              el-input(
                v-model="tableSearch"
                :placeholder="t('shipmentTracker.search')"
                prefix-icon="Search"
                size="small"
                clearable
                style="width: 220px"
              )
              el-select(v-model="tableStatusFilter" size="small" style="width: 150px")
                el-option(:label="t('shipmentTracker.all')" value="all")
                el-option(
                  v-for="sf in statusFilters.slice(1)"
                  :key="sf.value"
                  :label="sf.label"
                  :value="sf.value"
                )
              el-date-picker(
                v-model="tableDateRange"
                type="daterange"
                size="small"
                :start-placeholder="t('shipmentTracker.shipDate')"
                :end-placeholder="t('shipmentTracker.eta')"
                style="width: 260px"
              )

          el-table(
            :data="filteredTableShipments"
            stripe
            style="width: 100%"
            max-height="650"
            row-key="trackingNumber"
            :expand-row-keys="expandedRows"
            @expand-change="handleExpandChange"
          )
            el-table-column(type="expand")
              template(#default="scope")
                .px-6.py-4
                  h4.font-semibold.mb-4(style="color: var(--text-primary)")
                    Icon.mr-2(name="ph:clock-clockwise-bold" size="16" style="color: #3b82f6")
                    | {{ t('shipmentTracker.trackingEvents') }}
                  .tracking-timeline
                    .timeline-event(v-for="(evt, eIdx) in scope.row.events" :key="eIdx")
                      .timeline-dot(:class="{ active: eIdx === 0 }")
                      .timeline-line(v-if="eIdx < scope.row.events.length - 1")
                      .timeline-content
                        .flex.items-center.gap-2.mb-1
                          span.text-xs.font-semibold(style="color: #3b82f6") {{ evt.date }}
                          el-tag(size="small" effect="plain") {{ evt.status }}
                        p.text-sm.font-medium(style="color: var(--text-primary)") {{ evt.location }}
                        p.text-xs(style="color: var(--text-muted)") {{ evt.description }}

            el-table-column(prop="trackingNumber" :label="t('shipmentTracker.trackingNumber')" min-width="160" sortable)
              template(#default="scope")
                .tracking-number(@click="copyTracking(scope.row.trackingNumber)") {{ scope.row.trackingNumber }}

            el-table-column(prop="customer" :label="t('shipmentTracker.customer')" min-width="140" sortable)
              template(#default="scope")
                span.font-medium {{ scope.row.customer }}

            el-table-column(:label="t('shipmentTracker.origin')" min-width="120")
              template(#default="scope")
                .flex.items-center.gap-1
                  Icon(name="ph:map-pin-bold" size="12" style="color: #3b82f6")
                  span.text-sm {{ scope.row.origin }}

            el-table-column(:label="t('shipmentTracker.destination')" min-width="120")
              template(#default="scope")
                .flex.items-center.gap-1
                  Icon(name="ph:map-pin-bold" size="12" style="color: #22c55e")
                  span.text-sm {{ scope.row.destination }}

            el-table-column(:label="t('shipmentTracker.carrier')" min-width="100")
              template(#default="scope")
                el-tag(size="small" effect="plain") {{ scope.row.carrier }}

            el-table-column(:label="t('shipmentTracker.weight')" min-width="110" align="right")
              template(#default="scope")
                span.text-sm {{ scope.row.weight }}

            el-table-column(:label="t('shipmentTracker.status')" min-width="130")
              template(#default="scope")
                el-tag(
                  :type="getStatusTagType(scope.row.status)"
                  size="small"
                  effect="dark"
                ) {{ getStatusLabel(scope.row.status) }}

            el-table-column(prop="shipDate" :label="t('shipmentTracker.shipDate')" min-width="110" sortable)
            el-table-column(prop="eta" :label="t('shipmentTracker.eta')" min-width="110" sortable)

            el-table-column(:label="t('shipmentTracker.actions')" min-width="80" align="center" fixed="right")
              template(#default="scope")
                el-button(type="primary" size="small" text @click="viewShipmentDetail(scope.row)")
                  Icon(name="ph:eye-bold" size="16")

      //- ─────────────────────────────────────────────────
      //- Tab 3: Carrier Performance
      //- ─────────────────────────────────────────────────
      el-tab-pane(:label="t('shipmentTracker.carrierPerformance')" name="carrier")
        //- Carrier Comparison Table
        .glass-card.p-6.mb-6
          h3.section-title.mb-5
            Icon.mr-2(name="ph:ranking-bold" size="22" style="color: #7849ff")
            | {{ t('shipmentTracker.carrierPerformance') }}
          el-table(:data="carrierData" stripe style="width: 100%")
            el-table-column(:label="t('shipmentTracker.carrierName')" min-width="150")
              template(#default="scope")
                .flex.items-center.gap-3
                  .carrier-avatar(:style="{ background: scope.row.color + '18' }")
                    Icon(name="ph:truck-bold" size="16" :style="{ color: scope.row.color }")
                  span.font-semibold {{ scope.row.name }}
            el-table-column(prop="totalShipments" :label="t('shipmentTracker.totalShipments')" min-width="130" align="right" sortable)
              template(#default="scope")
                span.font-bold {{ scope.row.totalShipments.toLocaleString() }}
            el-table-column(:label="t('shipmentTracker.onTimePercent')" min-width="130" align="right" sortable)
              template(#default="scope")
                span.font-bold(:style="{ color: scope.row.onTimePercent >= 95 ? '#22c55e' : scope.row.onTimePercent >= 90 ? '#f59e0b' : '#ef4444' }") {{ formatPercent(scope.row.onTimePercent) }}
            el-table-column(:label="t('shipmentTracker.avgTransitTime')" min-width="140" align="right" sortable)
              template(#default="scope")
                span.font-medium {{ formatTransitDays(scope.row.avgTransitDays) }}
            el-table-column(:label="t('shipmentTracker.costPerShipment')" min-width="140" align="right" sortable)
              template(#default="scope")
                span.font-semibold {{ formatCost(scope.row.costPerShipment) }}
            el-table-column(:label="t('shipmentTracker.rating')" min-width="160" align="center")
              template(#default="scope")
                el-rate(
                  :model-value="scope.row.rating"
                  disabled
                  show-score
                  text-color="#f59e0b"
                  score-template="{value}"
                )

        //- Carrier Performance Trend Chart
        .glass-card.p-6.mb-6
          h3.section-title.mb-5
            Icon.mr-2(name="ph:chart-line-up-bold" size="22" style="color: #3b82f6")
            | {{ t('shipmentTracker.performanceTrend') }}
          ClientOnly
            VChart.w-full(:option="carrierTrendChartOption" :style="{ height: '380px' }" autoresize)

        //- Cost Comparison Chart
        .glass-card.p-6
          h3.section-title.mb-5
            Icon.mr-2(name="ph:currency-dollar-bold" size="22" style="color: #22c55e")
            | {{ t('shipmentTracker.costComparison') }}
          ClientOnly
            VChart.w-full(:option="costComparisonChartOption" :style="{ height: '380px' }" autoresize)

      //- ─────────────────────────────────────────────────
      //- Tab 4: Exceptions
      //- ─────────────────────────────────────────────────
      el-tab-pane(:label="t('shipmentTracker.exceptions')" name="exceptions")
        //- Exception Cards Grid
        .grid.gap-5.mb-6(class="grid-cols-1 lg:grid-cols-2")
          .exception-card(v-for="exc in exceptions" :key="exc.shipmentId")
            .flex.items-center.justify-between.mb-3
              .tracking-number {{ exc.shipmentId }}
              .flex.items-center.gap-2
                el-tag(
                  :type="getExceptionTagType(exc.issueType)"
                  size="small"
                  effect="dark"
                ) {{ getIssueTypeLabel(exc.issueType) }}
                el-tag(
                  :type="getResolutionTagType(exc.resolutionStatus)"
                  size="small"
                  effect="plain"
                ) {{ getResolutionLabel(exc.resolutionStatus) }}

            .space-y-2.mb-4
              .flex.items-center.gap-2
                Icon(name="ph:calendar-bold" size="14" style="color: var(--text-muted)")
                span.text-sm(style="color: var(--text-muted)") {{ exc.reportedDate }}
              .flex.items-center.gap-2
                Icon(name="ph:truck-bold" size="14" style="color: var(--text-muted)")
                span.text-sm(style="color: var(--text-muted)") {{ exc.carrier }}
              p.text-sm(style="color: var(--text-primary)") {{ exc.description }}

            .flex.flex-wrap.gap-2
              el-button(size="small" @click="handleContactCarrier(exc)")
                Icon.mr-1(name="ph:phone-bold" size="12")
                | {{ t('shipmentTracker.contactCarrier') }}
              el-button(size="small" @click="handleReroute(exc)")
                Icon.mr-1(name="ph:arrows-split-bold" size="12")
                | {{ t('shipmentTracker.reroute') }}
              el-button(size="small" type="warning" @click="handleRefund(exc)")
                Icon.mr-1(name="ph:currency-dollar-bold" size="12")
                | {{ t('shipmentTracker.refund') }}
              el-button(
                v-if="exc.resolutionStatus !== 'resolved'"
                size="small"
                type="success"
                @click="handleResolve(exc)"
              )
                Icon.mr-1(name="ph:check-circle-bold" size="12")
                | {{ t('shipmentTracker.resolve') }}

        //- Exception Trend Chart
        .glass-card.p-6
          h3.section-title.mb-5
            Icon.mr-2(name="ph:chart-bar-bold" size="22" style="color: #ef4444")
            | {{ t('shipmentTracker.exceptionTrend') }}
          ClientOnly
            VChart.w-full(:option="exceptionTrendChartOption" :style="{ height: '380px' }" autoresize)
</template>

<script lang="ts" setup>
/* eslint-disable no-use-before-define */
import { ref, computed, onMounted } from 'vue';
import { graphic } from 'echarts/core';
import VChart from 'vue-echarts';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Shipment Tracker' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const loading = ref(true);
const activeTab = ref('live');
const selectedStatus = ref('all');
const selectedCarrier = ref('all');
const tableSearch = ref('');
const tableStatusFilter = ref('all');
const tableDateRange = ref<[Date, Date] | null>(null);
const expandedRows = ref<string[]>([]);

// ─── Lifecycle ──────────────────────────────────────────────

// ─── Constants ──────────────────────────────────────────────
const progressSteps = ['Order Placed', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];

const statusFilters = computed(() => [
  { label: t('shipmentTracker.all'), value: 'all' },
  { label: t('shipmentTracker.pickedUp'), value: 'picked_up' },
  { label: t('shipmentTracker.inTransit'), value: 'in_transit' },
  { label: t('shipmentTracker.outForDelivery'), value: 'out_for_delivery' },
  { label: t('shipmentTracker.delivered'), value: 'delivered' },
  { label: t('shipmentTracker.delayed'), value: 'delayed' },
  { label: t('shipmentTracker.exception'), value: 'exception' }
]);

const carrierFilters = computed(() => [
  { label: t('shipmentTracker.all'), value: 'all' },
  { label: 'FedEx', value: 'FedEx' },
  { label: 'DHL', value: 'DHL' },
  { label: 'UPS', value: 'UPS' },
  { label: 'Aramex', value: 'Aramex' },
  { label: 'SMSA', value: 'SMSA' }
]);

// ─── Tooltip Style ──────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.92)',
  borderColor: 'rgba(59, 130, 246, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 12 },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => {
  const all = liveShipments.value;
  const active = all.filter(s => s.status !== 'delivered').length;
  const delivered = all.filter(s => s.status === 'delivered').length;
  const inTransitCount = all.filter(s => s.status === 'in_transit').length;
  const delayedCount = all.filter(s => s.status === 'delayed' || s.status === 'exception').length;
  const onTimeRate = all.length > 0 ? Math.round(((all.length - delayedCount) / all.length) * 1000) / 10 : 0;

  return [
    {
      label: t('shipmentTracker.activeShipments'),
      value: active.toString(),
      icon: 'ph:package-bold',
      color: '#3b82f6',
      trend: 0
    },
    {
      label: t('shipmentTracker.onTimeDeliveryRate'),
      value: `${onTimeRate}%`,
      icon: 'ph:check-circle-bold',
      color: '#22c55e',
      trend: 0
    },
    {
      label: t('shipmentTracker.inTransit'),
      value: inTransitCount.toString(),
      icon: 'ph:truck-bold',
      color: '#7849ff',
      trend: 0
    },
    {
      label: t('shipmentTracker.delayedShipments'),
      value: delayedCount.toString(),
      icon: 'ph:warning-bold',
      color: '#ef4444',
      trend: 0
    }
  ];
});

// ─── Format Helpers ─────────────────────────────────────────
function formatTrend(trend: number): string {
  return `${trend >= 0 ? '+' : ''}${trend}%`;
}

function formatPercent(val: number): string {
  return `${val}%`;
}

function formatTransitDays(days: number): string {
  return `${days} days`;
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

// ─── Live Shipments Data ────────────────────────────────────
interface Shipment {
  trackingNumber: string;
  customer: string;
  origin: string;
  destination: string;
  carrier: string;
  status: string;
  eta: string;
  shipDate: string;
  weight: string;
  events: TrackingEvent[];
}

interface TrackingEvent {
  date: string;
  location: string;
  status: string;
  description: string;
}

const liveShipmentsFallback: Shipment[] = [];

const liveShipments = ref<Shipment[]>([]);

const tableShipments = ref<Shipment[]>([]);

// ─── Filtered Live Shipments ────────────────────────────────
const filteredLiveShipments = computed(() => {
  let items = liveShipments.value;

  if (selectedStatus.value !== 'all') {
    items = items.filter(s => s.status === selectedStatus.value);
  }

  if (selectedCarrier.value !== 'all') {
    items = items.filter(s => s.carrier === selectedCarrier.value);
  }

  return items;
});

// ─── Filtered Table Shipments ───────────────────────────────
const filteredTableShipments = computed(() => {
  let items = tableShipments.value;

  if (tableStatusFilter.value !== 'all') {
    items = items.filter(s => s.status === tableStatusFilter.value);
  }

  if (tableSearch.value) {
    const q = tableSearch.value.toLowerCase();
    items = items.filter(
      s =>
        s.trackingNumber.toLowerCase().includes(q) ||
        s.customer.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.carrier.toLowerCase().includes(q)
    );
  }

  return items;
});

// ─── Status Helpers ─────────────────────────────────────────
function getStatusTagType(status: string): string {
  const map: Record<string, string> = {
    picked_up: '',
    in_transit: 'warning',
    out_for_delivery: 'warning',
    delivered: 'success',
    delayed: 'danger',
    exception: 'danger'
  };
  return map[status] || 'info';
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    picked_up: t('shipmentTracker.pickedUp'),
    in_transit: t('shipmentTracker.inTransit'),
    out_for_delivery: t('shipmentTracker.outForDelivery'),
    delivered: t('shipmentTracker.delivered'),
    delayed: t('shipmentTracker.delayed'),
    exception: t('shipmentTracker.exception')
  };
  return map[status] || status;
}

function getCarrierColor(carrier: string): string {
  const map: Record<string, string> = {
    FedEx: '#4D148C',
    DHL: '#FFCC00',
    UPS: '#351C15',
    Aramex: '#E95E2E',
    SMSA: '#0066B3'
  };
  return map[carrier] || '#64748b';
}

// ─── Progress Step Helpers ──────────────────────────────────
const statusStepIndex: Record<string, number> = {
  picked_up: 1,
  in_transit: 2,
  out_for_delivery: 3,
  delivered: 4,
  delayed: 2,
  exception: 2
};

function getStepClass(status: string, stepIdx: number): string {
  const currentStep = statusStepIndex[status] ?? 0;
  if (stepIdx < currentStep) return 'completed';
  if (stepIdx === currentStep) return 'current';
  return 'pending';
}

function isStepLineCompleted(status: string, stepIdx: number): boolean {
  const currentStep = statusStepIndex[status] ?? 0;
  return stepIdx < currentStep;
}

// ─── Carrier Performance Data ───────────────────────────────
const carrierData = ref<Record<string, unknown>[]>([]);

// ─── Carrier Performance Trend Chart ────────────────────────
const carrierTrendChartOption = computed(() => {
  const carriers = carrierData.value;
  const names = carriers.map(c => c.name);

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle
    },
    legend: {
      data: names,
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 20
    },
    grid: { top: 30, right: 30, bottom: 50, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: [],
      boundaryGap: false,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 85,
      max: 100,
      name: '%',
      nameTextStyle: { color: '#64748B', fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B', fontSize: 11 }
    },
    series: [] as Record<string, unknown>[],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Cost Comparison Chart ──────────────────────────────────
const costComparisonChartOption = computed(() => {
  const carriers = ['FedEx', 'DHL', 'UPS', 'Aramex', 'SMSA'];

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: [t('shipmentTracker.domestic'), t('shipmentTracker.international')],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 20
    },
    grid: { top: 30, right: 30, bottom: 50, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: carriers,
      axisLabel: { color: '#94A3B8', fontSize: 12 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '$',
      nameTextStyle: { color: '#64748B', fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B', fontSize: 11 }
    },
    series: [
      {
        name: t('shipmentTracker.domestic'),
        type: 'bar',
        data: [],
        barWidth: 24,
        barGap: '30%',
        itemStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#2563eb' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: t('shipmentTracker.international'),
        type: 'bar',
        data: [],
        barWidth: 24,
        itemStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#7849ff' },
            { offset: 1, color: '#6333e0' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Exceptions Data ────────────────────────────────────────
interface ShipmentException {
  shipmentId: string;
  issueType: string;
  reportedDate: string;
  carrier: string;
  resolutionStatus: string;
  description: string;
}

const exceptions = ref<ShipmentException[]>([]);

// ─── Exception Helpers ──────────────────────────────────────
function getExceptionTagType(type: string): string {
  const map: Record<string, string> = {
    delayed: 'warning',
    damaged: 'danger',
    lost: 'danger',
    address_issue: 'warning'
  };
  return map[type] || 'info';
}

function getIssueTypeLabel(type: string): string {
  const map: Record<string, string> = {
    delayed: t('shipmentTracker.delayed'),
    damaged: t('shipmentTracker.damaged'),
    lost: t('shipmentTracker.lost'),
    address_issue: t('shipmentTracker.addressIssue')
  };
  return map[type] || type;
}

function getResolutionTagType(status: string): string {
  const map: Record<string, string> = {
    open: 'danger',
    investigating: 'warning',
    resolved: 'success'
  };
  return map[status] || 'info';
}

function getResolutionLabel(status: string): string {
  const map: Record<string, string> = {
    open: t('shipmentTracker.open'),
    investigating: t('shipmentTracker.investigating'),
    resolved: t('shipmentTracker.resolved')
  };
  return map[status] || status;
}

// ─── Exception Trend Chart ──────────────────────────────────
const exceptionTrendChartOption = computed(() => {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: [t('shipmentTracker.delayed'), t('shipmentTracker.damaged'), t('shipmentTracker.lost'), t('shipmentTracker.addressIssue')],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 16
    },
    grid: { top: 30, right: 30, bottom: 60, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: weeks,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B', fontSize: 11 }
    },
    series: [
      {
        name: t('shipmentTracker.delayed'),
        type: 'bar',
        stack: 'exceptions',
        data: [],
        barWidth: 28,
        itemStyle: { color: '#f59e0b', borderRadius: [0, 0, 0, 0] }
      },
      {
        name: t('shipmentTracker.damaged'),
        type: 'bar',
        stack: 'exceptions',
        data: [],
        itemStyle: { color: '#ef4444' }
      },
      {
        name: t('shipmentTracker.lost'),
        type: 'bar',
        stack: 'exceptions',
        data: [],
        itemStyle: { color: '#dc2626' }
      },
      {
        name: t('shipmentTracker.addressIssue'),
        type: 'bar',
        stack: 'exceptions',
        data: [],
        itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] }
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Data Loading ───────────────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    const res = await useApiFetch('shipping');
    if (res.success && Array.isArray(res.body)) {
      liveShipments.value = res.body as unknown;
      tableShipments.value = res.body as unknown;
      // Aggregate carrier data from shipments if available
      const carrierMap = new Map<string, unknown>();
      (res.body as unknown[]).forEach(s => {
        if (s.carrier && !carrierMap.has(s.carrier)) {
          carrierMap.set(s.carrier, {
            name: s.carrier,
            color: '#64748b',
            totalShipments: 0,
            onTimePercent: 0,
            avgTransitDays: 0,
            costPerShipment: 0,
            rating: 0
          });
        }
        if (s.carrier) {
          carrierMap.get(s.carrier).totalShipments++;
        }
      });
      if (carrierMap.size > 0) {
        carrierData.value = Array.from(carrierMap.values());
      } else {
        carrierData.value = [];
      }
    } else {
      liveShipments.value = [];
      tableShipments.value = [];
      carrierData.value = [];
    }
  } catch {
    liveShipments.value = [];
    tableShipments.value = [];
    carrierData.value = [];
  }
  loading.value = false;
}

onMounted(() => {
  loadData();
});

// ─── Actions ────────────────────────────────────────────────
function handleNewShipment() {
  ElMessage.info(t('shipmentTracker.newShipment'));
}

function refreshData() {
  loadData();
}

function copyTracking(trackingNumber: string) {
  navigator.clipboard?.writeText(trackingNumber);
  ElMessage.success(t('shipmentTracker.copyTracking'));
}

function handleExpandChange(row: Shipment, expandedRowsList: Shipment[]) {
  expandedRows.value = expandedRowsList.map(r => r.trackingNumber);
}

function viewShipmentDetail(row: Shipment) {
  ElMessage.info(`${t('shipmentTracker.trackingNumber')}: ${row.trackingNumber}`);
}

function handleContactCarrier(exc: ShipmentException) {
  ElMessage.info(`${t('shipmentTracker.contactCarrier')}: ${exc.carrier}`);
}

function handleReroute(exc: ShipmentException) {
  ElMessage.warning(`${t('shipmentTracker.reroute')}: ${exc.shipmentId}`);
}

function handleRefund(exc: ShipmentException) {
  ElMessage.warning(`${t('shipmentTracker.refund')}: ${exc.shipmentId}`);
}

function handleResolve(exc: ShipmentException) {
  exc.resolutionStatus = 'resolved';
  ElMessage.success(`${t('shipmentTracker.resolve')}: ${exc.shipmentId}`);
}
</script>

<style lang="scss" scoped>
.shipment-tracker-page {
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

// ─── Header ─────────────────────────────────────────────────
.header-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

// ─── Section Title ──────────────────────────────────────────
.section-title {
  display: flex;
  align-items: center;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

// ─── Glass Card ─────────────────────────────────────────────
.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08);
  }
}

// ─── KPI Cards ──────────────────────────────────────────────
.kpi-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.3);
  }
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Tabs Styling ───────────────────────────────────────────
.tracker-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    background: var(--border-default);
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted);
    font-weight: 500;

    &.is-active {
      color: #3b82f6;
      font-weight: 600;
    }

    &:hover {
      color: #3b82f6;
    }
  }

  :deep(.el-tabs__active-bar) {
    background-color: #3b82f6;
  }
}

// ─── Shipment Card ──────────────────────────────────────────
.shipment-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }
}

.tracking-number {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

// ─── Progress Steps ─────────────────────────────────────────
.progress-steps {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 12px;
}

.step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;

  &.completed {
    background: #22c55e;
    color: white;
  }

  &.current {
    background: #3b82f6;
    color: white;
    animation: pulse 2s infinite;
  }

  &.pending {
    background: var(--bg-elevated);
    border: 2px solid var(--border-default);
    color: var(--text-muted);
  }
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--border-default);

  &.completed {
    background: #22c55e;
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

// ─── Exception Card ─────────────────────────────────────────
.exception-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.1);
  }
}

// ─── Tracking Timeline ─────────────────────────────────────
.tracking-timeline {
  position: relative;
  padding-left: 24px;
}

.timeline-event {
  position: relative;
  padding-bottom: 20px;
  padding-left: 20px;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: -8px;
  top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--border-default);
  border: 3px solid var(--bg-elevated);

  &.active {
    background: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  }
}

.timeline-line {
  position: absolute;
  left: -1px;
  top: 22px;
  bottom: 0;
  width: 2px;
  background: var(--border-default);
}

.timeline-content {
  padding-top: 0;
}

// ─── Carrier Avatar ─────────────────────────────────────────
.carrier-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
