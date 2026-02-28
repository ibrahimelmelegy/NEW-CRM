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
import { ref, computed, onMounted } from 'vue';
import { graphic } from 'echarts';
import VChart from 'vue-echarts';

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
onMounted(() => {
  setTimeout(() => {
    loading.value = false;
  }, 800);
});

// ─── Constants ──────────────────────────────────────────────
const progressSteps = [
  'Order Placed',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered'
];

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
const kpiCards = computed(() => [
  {
    label: t('shipmentTracker.activeShipments'),
    value: '142',
    icon: 'ph:package-bold',
    color: '#3b82f6',
    trend: 5.8
  },
  {
    label: t('shipmentTracker.onTimeDeliveryRate'),
    value: '94.2%',
    icon: 'ph:check-circle-bold',
    color: '#22c55e',
    trend: 1.3
  },
  {
    label: t('shipmentTracker.inTransit'),
    value: '68',
    icon: 'ph:truck-bold',
    color: '#7849ff',
    trend: 12.4
  },
  {
    label: t('shipmentTracker.delayedShipments'),
    value: '8',
    icon: 'ph:warning-bold',
    color: '#ef4444',
    trend: -23.1
  }
]);

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

const liveShipments = ref<Shipment[]>([
  {
    trackingNumber: 'FDX-2024-78542',
    customer: 'Ahmed Al-Rashid',
    origin: 'Riyadh, SA',
    destination: 'Jeddah, SA',
    carrier: 'FedEx',
    status: 'in_transit',
    eta: '2026-03-02',
    shipDate: '2026-02-26',
    weight: '4.2 kg (30x25x15)',
    events: [
      { date: '2026-02-27 14:30', location: 'Riyadh Hub', status: 'In Transit', description: 'Package departed from sorting facility' },
      { date: '2026-02-27 08:15', location: 'Riyadh Hub', status: 'Processing', description: 'Package arrived at sorting facility' },
      { date: '2026-02-26 16:00', location: 'Riyadh Pickup', status: 'Picked Up', description: 'Package picked up from sender' },
      { date: '2026-02-26 10:00', location: 'Online', status: 'Order Placed', description: 'Shipping label created' }
    ]
  },
  {
    trackingNumber: 'DHL-2024-91234',
    customer: 'Sara Mohammed',
    origin: 'Dubai, AE',
    destination: 'Riyadh, SA',
    carrier: 'DHL',
    status: 'out_for_delivery',
    eta: '2026-02-28',
    shipDate: '2026-02-24',
    weight: '2.1 kg (20x15x10)',
    events: [
      { date: '2026-02-28 07:30', location: 'Riyadh', status: 'Out for Delivery', description: 'Package is out for delivery' },
      { date: '2026-02-27 22:00', location: 'Riyadh Hub', status: 'Arrived', description: 'Package arrived at local hub' },
      { date: '2026-02-26 10:00', location: 'Dubai Hub', status: 'In Transit', description: 'Package in transit to destination' },
      { date: '2026-02-25 14:00', location: 'Dubai Hub', status: 'Processing', description: 'Customs cleared' },
      { date: '2026-02-24 09:00', location: 'Dubai', status: 'Picked Up', description: 'Package collected from sender' }
    ]
  },
  {
    trackingNumber: 'UPS-2024-45678',
    customer: 'Khalid Bin Saeed',
    origin: 'London, UK',
    destination: 'Dammam, SA',
    carrier: 'UPS',
    status: 'in_transit',
    eta: '2026-03-04',
    shipDate: '2026-02-25',
    weight: '8.7 kg (45x35x30)',
    events: [
      { date: '2026-02-27 18:00', location: 'Frankfurt Hub', status: 'In Transit', description: 'Package in transit through Frankfurt hub' },
      { date: '2026-02-26 06:00', location: 'London Heathrow', status: 'Departed', description: 'Package departed origin country' },
      { date: '2026-02-25 15:30', location: 'London', status: 'Picked Up', description: 'Package picked up by courier' }
    ]
  },
  {
    trackingNumber: 'ARX-2024-33219',
    customer: 'Fatima Al-Zahrani',
    origin: 'Riyadh, SA',
    destination: 'Cairo, EG',
    carrier: 'Aramex',
    status: 'delivered',
    eta: '2026-02-27',
    shipDate: '2026-02-22',
    weight: '1.5 kg (15x12x8)',
    events: [
      { date: '2026-02-27 11:00', location: 'Cairo', status: 'Delivered', description: 'Package delivered successfully' },
      { date: '2026-02-27 08:00', location: 'Cairo', status: 'Out for Delivery', description: 'Package out for delivery' },
      { date: '2026-02-26 20:00', location: 'Cairo Hub', status: 'Arrived', description: 'Package arrived at destination hub' },
      { date: '2026-02-24 12:00', location: 'Riyadh Hub', status: 'In Transit', description: 'Package departed origin hub' },
      { date: '2026-02-22 14:30', location: 'Riyadh', status: 'Picked Up', description: 'Package picked up' }
    ]
  },
  {
    trackingNumber: 'SMSA-2024-87654',
    customer: 'Omar Hassan',
    origin: 'Jeddah, SA',
    destination: 'Medina, SA',
    carrier: 'SMSA',
    status: 'picked_up',
    eta: '2026-03-01',
    shipDate: '2026-02-28',
    weight: '3.3 kg (25x20x18)',
    events: [
      { date: '2026-02-28 10:00', location: 'Jeddah', status: 'Picked Up', description: 'Package collected from sender location' },
      { date: '2026-02-28 08:30', location: 'Online', status: 'Label Created', description: 'Shipping label generated' }
    ]
  },
  {
    trackingNumber: 'FDX-2024-12390',
    customer: 'Noura Al-Otaibi',
    origin: 'New York, US',
    destination: 'Riyadh, SA',
    carrier: 'FedEx',
    status: 'delayed',
    eta: '2026-03-05',
    shipDate: '2026-02-20',
    weight: '5.6 kg (40x30x25)',
    events: [
      { date: '2026-02-27 09:00', location: 'Customs, SA', status: 'Delayed', description: 'Held at customs for documentation review' },
      { date: '2026-02-25 14:00', location: 'Dubai Hub', status: 'In Transit', description: 'Package routed through Dubai' },
      { date: '2026-02-22 08:00', location: 'Memphis Hub', status: 'In Transit', description: 'Departed Memphis sorting facility' },
      { date: '2026-02-20 16:00', location: 'New York', status: 'Picked Up', description: 'Package picked up from sender' }
    ]
  },
  {
    trackingNumber: 'DHL-2024-55432',
    customer: 'Yusuf Ibrahim',
    origin: 'Berlin, DE',
    destination: 'Jeddah, SA',
    carrier: 'DHL',
    status: 'in_transit',
    eta: '2026-03-03',
    shipDate: '2026-02-25',
    weight: '12.4 kg (60x40x35)',
    events: [
      { date: '2026-02-27 20:00', location: 'DHL Hub Leipzig', status: 'In Transit', description: 'Package in transit at Leipzig hub' },
      { date: '2026-02-26 12:00', location: 'Berlin', status: 'Processing', description: 'Export documents processed' },
      { date: '2026-02-25 09:30', location: 'Berlin', status: 'Picked Up', description: 'Collected from warehouse' }
    ]
  },
  {
    trackingNumber: 'UPS-2024-99871',
    customer: 'Layla Qasim',
    origin: 'Shanghai, CN',
    destination: 'Dammam, SA',
    carrier: 'UPS',
    status: 'exception',
    eta: '2026-03-06',
    shipDate: '2026-02-18',
    weight: '22.0 kg (80x60x40)',
    events: [
      { date: '2026-02-26 14:00', location: 'Dubai Customs', status: 'Exception', description: 'Missing commercial invoice - action required' },
      { date: '2026-02-24 08:00', location: 'Dubai Hub', status: 'Arrived', description: 'Package arrived at Dubai transit hub' },
      { date: '2026-02-21 16:00', location: 'Shanghai', status: 'In Transit', description: 'Departed Shanghai hub' },
      { date: '2026-02-18 11:00', location: 'Shanghai', status: 'Picked Up', description: 'Picked up from factory' }
    ]
  },
  {
    trackingNumber: 'ARX-2024-67543',
    customer: 'Mohammed Al-Harbi',
    origin: 'Riyadh, SA',
    destination: 'Kuwait City, KW',
    carrier: 'Aramex',
    status: 'in_transit',
    eta: '2026-03-01',
    shipDate: '2026-02-27',
    weight: '6.8 kg (35x28x22)',
    events: [
      { date: '2026-02-28 02:00', location: 'Aramex Hub', status: 'In Transit', description: 'Package in transit to Kuwait' },
      { date: '2026-02-27 16:00', location: 'Riyadh Hub', status: 'Processing', description: 'Package processed at sorting facility' },
      { date: '2026-02-27 10:00', location: 'Riyadh', status: 'Picked Up', description: 'Courier collected the package' }
    ]
  },
  {
    trackingNumber: 'SMSA-2024-43210',
    customer: 'Huda Nasser',
    origin: 'Dammam, SA',
    destination: 'Riyadh, SA',
    carrier: 'SMSA',
    status: 'delivered',
    eta: '2026-02-27',
    shipDate: '2026-02-25',
    weight: '0.8 kg (10x8x5)',
    events: [
      { date: '2026-02-27 10:30', location: 'Riyadh', status: 'Delivered', description: 'Delivered to recipient' },
      { date: '2026-02-27 07:00', location: 'Riyadh', status: 'Out for Delivery', description: 'With delivery agent' },
      { date: '2026-02-26 22:00', location: 'Riyadh Hub', status: 'Arrived', description: 'Arrived at Riyadh hub' },
      { date: '2026-02-26 06:00', location: 'Dammam Hub', status: 'In Transit', description: 'Departed Dammam' },
      { date: '2026-02-25 14:00', location: 'Dammam', status: 'Picked Up', description: 'Picked up from sender' }
    ]
  },
  {
    trackingNumber: 'FDX-2024-24680',
    customer: 'Abdulaziz Turki',
    origin: 'Tokyo, JP',
    destination: 'Riyadh, SA',
    carrier: 'FedEx',
    status: 'in_transit',
    eta: '2026-03-05',
    shipDate: '2026-02-24',
    weight: '3.1 kg (28x22x16)',
    events: [
      { date: '2026-02-27 12:00', location: 'Guangzhou Hub', status: 'In Transit', description: 'Transiting through China hub' },
      { date: '2026-02-25 20:00', location: 'Tokyo Narita', status: 'Departed', description: 'Left origin airport' },
      { date: '2026-02-24 15:00', location: 'Tokyo', status: 'Picked Up', description: 'Collected from shipper' },
      { date: '2026-02-24 09:00', location: 'Online', status: 'Label Created', description: 'Shipment info sent to FedEx' }
    ]
  },
  {
    trackingNumber: 'DHL-2024-13579',
    customer: 'Reem Al-Dosari',
    origin: 'Paris, FR',
    destination: 'Jeddah, SA',
    carrier: 'DHL',
    status: 'delayed',
    eta: '2026-03-04',
    shipDate: '2026-02-22',
    weight: '7.5 kg (50x35x20)',
    events: [
      { date: '2026-02-27 16:00', location: 'DHL Hub Leipzig', status: 'Delayed', description: 'Weather delay - rescheduled flight' },
      { date: '2026-02-25 10:00', location: 'Paris CDG', status: 'In Transit', description: 'Departed Paris' },
      { date: '2026-02-23 08:00', location: 'Paris', status: 'Processing', description: 'Export cleared' },
      { date: '2026-02-22 12:00', location: 'Paris', status: 'Picked Up', description: 'Package collected' }
    ]
  }
]);

// ─── Table Shipments (18 items with varied events) ──────────
const tableShipments = ref<Shipment[]>([
  ...liveShipments.value,
  {
    trackingNumber: 'ARX-2024-88901',
    customer: 'Tariq Al-Mutairi',
    origin: 'Jeddah, SA',
    destination: 'Bahrain, BH',
    carrier: 'Aramex',
    status: 'delivered',
    eta: '2026-02-25',
    shipDate: '2026-02-21',
    weight: '2.9 kg (22x18x14)',
    events: [
      { date: '2026-02-25 09:00', location: 'Bahrain', status: 'Delivered', description: 'Signed by recipient' },
      { date: '2026-02-25 06:30', location: 'Bahrain', status: 'Out for Delivery', description: 'With driver' },
      { date: '2026-02-24 18:00', location: 'Bahrain Hub', status: 'Arrived', description: 'Package at local hub' },
      { date: '2026-02-22 10:00', location: 'Jeddah', status: 'Picked Up', description: 'Collected from sender' }
    ]
  },
  {
    trackingNumber: 'UPS-2024-77321',
    customer: 'Salma Fahad',
    origin: 'Mumbai, IN',
    destination: 'Riyadh, SA',
    carrier: 'UPS',
    status: 'in_transit',
    eta: '2026-03-03',
    shipDate: '2026-02-26',
    weight: '15.2 kg (55x45x30)',
    events: [
      { date: '2026-02-28 04:00', location: 'Dubai Hub', status: 'In Transit', description: 'Arrived at Dubai for transfer' },
      { date: '2026-02-27 10:00', location: 'Mumbai Airport', status: 'Departed', description: 'Departed Mumbai' },
      { date: '2026-02-26 14:00', location: 'Mumbai', status: 'Picked Up', description: 'Collected from warehouse' }
    ]
  },
  {
    trackingNumber: 'SMSA-2024-11223',
    customer: 'Ali Al-Qahtani',
    origin: 'Riyadh, SA',
    destination: 'Abha, SA',
    carrier: 'SMSA',
    status: 'out_for_delivery',
    eta: '2026-02-28',
    shipDate: '2026-02-26',
    weight: '1.2 kg (12x10x8)',
    events: [
      { date: '2026-02-28 08:00', location: 'Abha', status: 'Out for Delivery', description: 'Package with delivery agent' },
      { date: '2026-02-27 23:00', location: 'Abha Hub', status: 'Arrived', description: 'Arrived at Abha distribution center' },
      { date: '2026-02-27 06:00', location: 'Riyadh Hub', status: 'In Transit', description: 'Departed Riyadh' },
      { date: '2026-02-26 11:00', location: 'Riyadh', status: 'Picked Up', description: 'Package collected' }
    ]
  },
  {
    trackingNumber: 'FDX-2024-55667',
    customer: 'Maha Al-Shehri',
    origin: 'Istanbul, TR',
    destination: 'Dammam, SA',
    carrier: 'FedEx',
    status: 'picked_up',
    eta: '2026-03-06',
    shipDate: '2026-02-28',
    weight: '9.4 kg (42x32x28)',
    events: [
      { date: '2026-02-28 15:00', location: 'Istanbul', status: 'Picked Up', description: 'Package collected from sender' },
      { date: '2026-02-28 09:00', location: 'Online', status: 'Label Created', description: 'Shipping label generated' }
    ]
  },
  {
    trackingNumber: 'DHL-2024-44556',
    customer: 'Badr Al-Enazi',
    origin: 'Riyadh, SA',
    destination: 'Amman, JO',
    carrier: 'DHL',
    status: 'delivered',
    eta: '2026-02-26',
    shipDate: '2026-02-23',
    weight: '4.8 kg (33x25x20)',
    events: [
      { date: '2026-02-26 13:00', location: 'Amman', status: 'Delivered', description: 'Delivered to recipient' },
      { date: '2026-02-26 07:00', location: 'Amman', status: 'Out for Delivery', description: 'With delivery driver' },
      { date: '2026-02-25 20:00', location: 'Amman Hub', status: 'Arrived', description: 'At local distribution' },
      { date: '2026-02-24 12:00', location: 'Riyadh', status: 'In Transit', description: 'Departed Riyadh hub' },
      { date: '2026-02-23 10:00', location: 'Riyadh', status: 'Picked Up', description: 'Collected by courier' },
      { date: '2026-02-23 08:00', location: 'Online', status: 'Label Created', description: 'Shipment created' }
    ]
  },
  {
    trackingNumber: 'ARX-2024-99087',
    customer: 'Nadia Saleh',
    origin: 'Casablanca, MA',
    destination: 'Riyadh, SA',
    carrier: 'Aramex',
    status: 'in_transit',
    eta: '2026-03-04',
    shipDate: '2026-02-25',
    weight: '6.1 kg (38x28x22)',
    events: [
      { date: '2026-02-27 22:00', location: 'Cairo Hub', status: 'In Transit', description: 'Transiting through Cairo' },
      { date: '2026-02-26 08:00', location: 'Casablanca', status: 'Departed', description: 'Departed origin' },
      { date: '2026-02-25 14:30', location: 'Casablanca', status: 'Picked Up', description: 'Collected from shipper' }
    ]
  }
]);

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
    items = items.filter(s =>
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
const carrierData = ref([
  { name: 'FedEx', color: '#4D148C', totalShipments: 2845, onTimePercent: 96.4, avgTransitDays: 3.2, costPerShipment: 45.80, rating: 4.5 },
  { name: 'DHL', color: '#FFCC00', totalShipments: 3120, onTimePercent: 95.1, avgTransitDays: 3.8, costPerShipment: 42.50, rating: 4.3 },
  { name: 'UPS', color: '#351C15', totalShipments: 1960, onTimePercent: 93.7, avgTransitDays: 4.1, costPerShipment: 48.20, rating: 4.2 },
  { name: 'Aramex', color: '#E95E2E', totalShipments: 4250, onTimePercent: 91.8, avgTransitDays: 4.5, costPerShipment: 28.90, rating: 4.0 },
  { name: 'SMSA', color: '#0066B3', totalShipments: 5680, onTimePercent: 94.2, avgTransitDays: 2.1, costPerShipment: 18.50, rating: 4.4 }
]);

// ─── Carrier Performance Trend Chart ────────────────────────
const carrierTrendChartOption = computed(() => {
  const monthLabels = ['Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26'];

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle
    },
    legend: {
      data: ['FedEx', 'DHL', 'UPS', 'Aramex'],
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
      data: monthLabels,
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
    series: [
      {
        name: 'FedEx',
        type: 'line',
        data: [94.2, 95.1, 95.8, 94.5, 96.1, 96.4],
        smooth: true,
        lineStyle: { width: 2.5, color: '#4D148C' },
        itemStyle: { color: '#4D148C' },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: 'DHL',
        type: 'line',
        data: [93.8, 94.2, 93.5, 95.0, 94.8, 95.1],
        smooth: true,
        lineStyle: { width: 2.5, color: '#D4A800' },
        itemStyle: { color: '#D4A800' },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: 'UPS',
        type: 'line',
        data: [92.1, 91.5, 92.8, 93.2, 93.0, 93.7],
        smooth: true,
        lineStyle: { width: 2.5, color: '#6B3A2A' },
        itemStyle: { color: '#6B3A2A' },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: 'Aramex',
        type: 'line',
        data: [90.5, 89.8, 91.2, 90.9, 91.5, 91.8],
        smooth: true,
        lineStyle: { width: 2.5, color: '#E95E2E' },
        itemStyle: { color: '#E95E2E' },
        symbol: 'circle',
        symbolSize: 6
      }
    ],
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
        data: [32.50, 35.00, 38.20, 18.50, 12.80],
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
        data: [58.90, 52.30, 62.40, 38.90, 45.20],
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

const exceptions = ref<ShipmentException[]>([
  {
    shipmentId: 'FDX-2024-12390',
    issueType: 'delayed',
    reportedDate: '2026-02-27',
    carrier: 'FedEx',
    resolutionStatus: 'investigating',
    description: 'Shipment held at Saudi customs due to incomplete commercial documentation. Awaiting sender to provide updated proforma invoice.'
  },
  {
    shipmentId: 'UPS-2024-99871',
    issueType: 'address_issue',
    reportedDate: '2026-02-26',
    carrier: 'UPS',
    resolutionStatus: 'open',
    description: 'Missing commercial invoice for customs clearance. Recipient notified to provide required documentation for release.'
  },
  {
    shipmentId: 'DHL-2024-13579',
    issueType: 'delayed',
    reportedDate: '2026-02-27',
    carrier: 'DHL',
    resolutionStatus: 'investigating',
    description: 'Flight cancellation due to severe weather at Leipzig hub. Package rescheduled for next available flight.'
  },
  {
    shipmentId: 'ARX-2024-44821',
    issueType: 'damaged',
    reportedDate: '2026-02-25',
    carrier: 'Aramex',
    resolutionStatus: 'open',
    description: 'Recipient reported external damage to packaging upon delivery. Contents appear intact but inspection is needed.'
  },
  {
    shipmentId: 'SMSA-2024-76543',
    issueType: 'lost',
    reportedDate: '2026-02-24',
    carrier: 'SMSA',
    resolutionStatus: 'investigating',
    description: 'Package not scanned since departure from Riyadh hub 4 days ago. Investigation opened with sorting facility.'
  },
  {
    shipmentId: 'FDX-2024-88213',
    issueType: 'address_issue',
    reportedDate: '2026-02-26',
    carrier: 'FedEx',
    resolutionStatus: 'resolved',
    description: 'Incorrect delivery address provided. Contact with sender confirmed updated address and package rerouted successfully.'
  },
  {
    shipmentId: 'DHL-2024-32145',
    issueType: 'damaged',
    reportedDate: '2026-02-23',
    carrier: 'DHL',
    resolutionStatus: 'resolved',
    description: 'Water damage reported on electronics shipment. Claim filed and refund processed to sender account.'
  },
  {
    shipmentId: 'UPS-2024-65432',
    issueType: 'delayed',
    reportedDate: '2026-02-27',
    carrier: 'UPS',
    resolutionStatus: 'open',
    description: 'Regulatory hold at origin country. Export permit pending approval from trade authority. Estimated delay of 3-5 business days.'
  }
]);

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
      data: [
        t('shipmentTracker.delayed'),
        t('shipmentTracker.damaged'),
        t('shipmentTracker.lost'),
        t('shipmentTracker.addressIssue')
      ],
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
        data: [5, 3, 7, 4, 6, 3, 5, 4],
        barWidth: 28,
        itemStyle: { color: '#f59e0b', borderRadius: [0, 0, 0, 0] }
      },
      {
        name: t('shipmentTracker.damaged'),
        type: 'bar',
        stack: 'exceptions',
        data: [2, 1, 3, 2, 1, 2, 1, 2],
        itemStyle: { color: '#ef4444' }
      },
      {
        name: t('shipmentTracker.lost'),
        type: 'bar',
        stack: 'exceptions',
        data: [0, 1, 0, 1, 0, 0, 1, 0],
        itemStyle: { color: '#dc2626' }
      },
      {
        name: t('shipmentTracker.addressIssue'),
        type: 'bar',
        stack: 'exceptions',
        data: [3, 2, 4, 1, 3, 2, 2, 3],
        itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] }
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Actions ────────────────────────────────────────────────
function handleNewShipment() {
  ElMessage.info(t('shipmentTracker.newShipment'));
}

function refreshData() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 800);
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
  0%, 100% {
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
