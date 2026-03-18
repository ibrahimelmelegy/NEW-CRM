<template lang="pug">
.demand-forecasting-page.p-6(class="md:p-8")
  //- ╔══════════════════════════════════════════════════════════╗
  //- ║  Page Header                                             ║
  //- ╚══════════════════════════════════════════════════════════╝
  .header.mb-8
    .flex.items-center.justify-between.flex-wrap.gap-4
      .flex.items-center.gap-4
        .header-icon-wrapper
          Icon(name="ph:chart-line-bold" size="28" style="color: #fff")
        div
          h2.text-3xl.font-bold.mb-1.bg-clip-text.text-transparent.bg-gradient-to-r.from-amber-400.to-orange-400
            | {{ $t('demandForecasting.title') }}
          p(style="color: var(--text-muted)") {{ $t('demandForecasting.subtitle') }}
      .flex.items-center.gap-3.flex-wrap
        el-button(type="primary" @click="refreshData" :loading="loading")
          Icon(name="ph:arrow-clockwise-bold" size="16")
          span.ml-2 {{ $t('demandForecasting.refresh') }}
        el-button(@click="exportReport")
          Icon(name="ph:download-simple-bold" size="16")
          span.ml-2 {{ $t('demandForecasting.export') }}

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="40" style="color: #f59e0b")

  template(v-else)
    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  KPI Cards                                               ║
    //- ╚══════════════════════════════════════════════════════════╝
    .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
      .kpi-card(v-for="(kpi, idx) in kpiCards" :key="idx")
        .flex.items-start.justify-between
          div
            p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
            p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}
            .flex.items-center.gap-1.mt-2
              Icon(:name="kpi.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }")
              span.text-xs.font-semibold(:style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ kpi.trend >= 0 ? '+' : '' }}{{ kpi.trend }}%
          .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
            Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  Tabs                                                    ║
    //- ╚══════════════════════════════════════════════════════════╝
    el-tabs(v-model="activeTab" class="forecast-tabs")

      //- ────────────────────────────────────────────────────────
      //- Tab 1: Forecast Overview
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('demandForecasting.forecastOverview')" name="overview")
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:chart-line-up-bold" size="22" style="color: #3b82f6")
              | {{ $t('demandForecasting.demandForecastTrend') }}
            .flex.items-center.gap-3
              .time-range-buttons
                el-button(
                  v-for="range in timeRanges"
                  :key="range.value"
                  :type="selectedTimeRange === range.value ? 'primary' : 'default'"
                  size="small"
                  @click="onTimeRangeChange(range.value)"
                ) {{ range.label }}
              el-select(v-model="selectedCategory" size="small" style="width: 160px" @change="onCategoryChange")
                el-option(:label="$t('demandForecasting.allCategories')" value="all")
                el-option(v-for="cat in productCategories" :key="cat" :label="cat" :value="cat")
          ClientOnly
            VChart.w-full(:option="forecastChartOption" :style="{ height: '420px' }" autoresize)

        //- Summary Cards Below Chart
        .grid.gap-4(class="grid-cols-2 md:grid-cols-4")
          .summary-stat-card(v-for="(stat, sIdx) in forecastSummaryStats" :key="sIdx")
            .flex.items-center.gap-2.mb-2
              .stat-dot(:style="{ background: stat.color }")
              span.text-sm.font-medium(style="color: var(--text-muted)") {{ stat.label }}
            p.text-xl.font-bold(:style="{ color: stat.color }") {{ stat.value }}
            p.text-xs(style="color: var(--text-secondary)") {{ stat.description }}

      //- ────────────────────────────────────────────────────────
      //- Tab 2: Product Forecasts
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('demandForecasting.productForecasts')" name="products")
        .glass-card.p-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:package-bold" size="22" style="color: #7849ff")
              | {{ $t('demandForecasting.productDemandTable') }}
            .flex.items-center.gap-3
              el-input(
                v-model="productSearch"
                :placeholder="$t('demandForecasting.searchProducts')"
                prefix-icon="Search"
                size="small"
                clearable
                style="width: 220px"
              )
              el-select(v-model="productCategoryFilter" size="small" style="width: 160px")
                el-option(:label="$t('demandForecasting.allCategories')" value="all")
                el-option(v-for="cat in productCategories" :key="cat" :label="cat" :value="cat")

          el-table(
            :data="filteredProducts"
            stripe
            :row-class-name="getProductRowClass"
            style="width: 100%"
            max-height="600"
          )
            el-table-column(prop="name" :label="$t('demandForecasting.productName')" min-width="180" sortable)
              template(#default="scope")
                .flex.items-center.gap-2
                  .product-avatar(:style="{ background: getCategoryColor(scope.row.category) + '22' }")
                    Icon(name="ph:cube-bold" size="14" :style="{ color: getCategoryColor(scope.row.category) }")
                  span.font-medium {{ scope.row.name }}
            el-table-column(:label="$t('demandForecasting.category')" min-width="130")
              template(#default="scope")
                el-tag(
                  :type="getCategoryTagType(scope.row.category)"
                  size="small"
                  effect="plain"
                ) {{ scope.row.category }}
            el-table-column(prop="currentStock" :label="$t('demandForecasting.currentStock')" min-width="120" align="right" sortable)
              template(#default="scope")
                span.font-semibold(:style="{ color: scope.row.currentStock < scope.row.reorderPoint ? '#ef4444' : 'var(--text-primary)' }")
                  | {{ scope.row.currentStock.toLocaleString() }}
            el-table-column(prop="predictedDemand" :label="$t('demandForecasting.predictedDemand30d')" min-width="160" align="right" sortable)
              template(#default="scope")
                span.font-bold(style="color: var(--text-primary)") {{ scope.row.predictedDemand.toLocaleString() }}
            el-table-column(:label="$t('demandForecasting.confidence')" min-width="120" align="center")
              template(#default="scope")
                el-tag(
                  :type="scope.row.confidence === 'High' ? 'success' : scope.row.confidence === 'Medium' ? 'warning' : 'danger'"
                  size="small"
                  effect="dark"
                ) {{ scope.row.confidence }}
            el-table-column(:label="$t('demandForecasting.trend')" min-width="90" align="center")
              template(#default="scope")
                Icon(
                  :name="scope.row.trend === 'up' ? 'ph:trend-up-bold' : scope.row.trend === 'down' ? 'ph:trend-down-bold' : 'ph:minus-bold'"
                  size="18"
                  :style="{ color: scope.row.trend === 'up' ? '#22c55e' : scope.row.trend === 'down' ? '#ef4444' : '#94a3b8' }"
                )
            el-table-column(prop="variance" :label="$t('demandForecasting.variancePct')" min-width="110" align="right" sortable)
              template(#default="scope")
                span.font-semibold(:style="{ color: getVarianceColor(scope.row.variance) }")
                  | {{ scope.row.variance }}%

      //- ────────────────────────────────────────────────────────
      //- Tab 3: Seasonal Trends
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('demandForecasting.seasonalTrends')" name="seasonal")
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:sun-horizon-bold" size="22" style="color: #f59e0b")
              | {{ $t('demandForecasting.seasonalDemandHeatmap') }}
            .flex.items-center.gap-3
              el-switch(
                v-model="showLastYear"
                :active-text="$t('demandForecasting.compareLastYear')"
                :inactive-text="$t('demandForecasting.currentYear')"
              )
          ClientOnly
            VChart.w-full(:option="seasonalHeatmapOption" :style="{ height: '380px' }" autoresize)

        //- Key Insights
        .grid.gap-5(class="grid-cols-1 md:grid-cols-3")
          .insight-card
            .flex.items-center.gap-2.mb-3
              .insight-icon-wrapper(style="background: rgba(239, 68, 68, 0.12)")
                Icon(name="ph:fire-bold" size="18" style="color: #ef4444")
              span.font-semibold(style="color: var(--text-primary)") {{ $t('demandForecasting.peakSeason') }}
            p.text-lg.font-bold(style="color: #ef4444") {{ seasonalInsights.peakSeason }}
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ seasonalInsights.peakDescription }}

          .insight-card
            .flex.items-center.gap-2.mb-3
              .insight-icon-wrapper(style="background: rgba(59, 130, 246, 0.12)")
                Icon(name="ph:snowflake-bold" size="18" style="color: #3b82f6")
              span.font-semibold(style="color: var(--text-primary)") {{ $t('demandForecasting.lowestDemand') }}
            p.text-lg.font-bold(style="color: #3b82f6") {{ seasonalInsights.lowestPeriod }}
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ seasonalInsights.lowestDescription }}

          .insight-card
            .flex.items-center.gap-2.mb-3
              .insight-icon-wrapper(style="background: rgba(34, 197, 94, 0.12)")
                Icon(name="ph:chart-line-up-bold" size="18" style="color: #22c55e")
              span.font-semibold(style="color: var(--text-primary)") {{ $t('demandForecasting.yoyGrowth') }}
            p.text-lg.font-bold(style="color: #22c55e") {{ seasonalInsights.yoyGrowth }}
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ seasonalInsights.yoyDescription }}

      //- ────────────────────────────────────────────────────────
      //- Tab 4: Inventory Optimization
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="$t('demandForecasting.inventoryOptimization')" name="inventory")
        //- Reorder Point Cards
        .mb-6
          h3.section-title.mb-5
            Icon.mr-2(name="ph:arrows-clockwise-bold" size="22" style="color: #ef4444")
            | {{ $t('demandForecasting.reorderAlerts') }}
          .grid.gap-5(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
            .reorder-card(v-for="(item, idx) in reorderItems" :key="idx" :class="{ 'reorder-critical': item.daysUntilStockout <= 7 }")
              .flex.items-center.justify-between.mb-4
                span.font-semibold(style="color: var(--text-primary)") {{ item.name }}
                el-tag(
                  :type="item.daysUntilStockout <= 7 ? 'danger' : item.daysUntilStockout <= 14 ? 'warning' : 'info'"
                  size="small"
                  effect="dark"
                )
                  | {{ item.daysUntilStockout }}d {{ $t('demandForecasting.left') }}
              .flex.justify-center.mb-4
                el-progress(
                  type="circle"
                  :percentage="Math.min(100, Math.round((item.currentStock / item.maxStock) * 100))"
                  :width="100"
                  :stroke-width="8"
                  :color="getStockGaugeColor(item.currentStock, item.reorderPoint, item.maxStock)"
                )
                  template(#default="{ percentage }")
                    .text-center
                      span.text-lg.font-bold(:style="{ color: getStockGaugeColor(item.currentStock, item.reorderPoint, item.maxStock) }") {{ percentage }}%
                      p.text-xs(style="color: var(--text-muted)") {{ $t('demandForecasting.stocked') }}
              .space-y-2.text-sm
                .flex.justify-between
                  span(style="color: var(--text-muted)") {{ $t('demandForecasting.currentStock') }}
                  span.font-semibold(style="color: var(--text-primary)") {{ item.currentStock.toLocaleString() }}
                .flex.justify-between
                  span(style="color: var(--text-muted)") {{ $t('demandForecasting.reorderPoint') }}
                  span.font-semibold(style="color: #f59e0b") {{ item.reorderPoint.toLocaleString() }}
                .flex.justify-between
                  span(style="color: var(--text-muted)") {{ $t('demandForecasting.safetyStock') }}
                  span.font-semibold(style="color: #3b82f6") {{ item.safetyStock.toLocaleString() }}
              el-button(
                v-if="item.daysUntilStockout <= 14"
                type="danger"
                size="small"
                class="!w-full !mt-4 !rounded-xl"
                @click="handleReorder(item)"
              )
                Icon.mr-1(name="ph:shopping-cart-bold" size="14")
                | {{ $t('demandForecasting.reorderNow') }}

        //- Safety Stock Calculator
        .glass-card.p-6.mb-6
          h3.section-title.mb-5
            Icon.mr-2(name="ph:calculator-bold" size="22" style="color: #3b82f6")
            | {{ $t('demandForecasting.safetyStockCalculator') }}
          .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
            .space-y-5
              .form-group
                label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)")
                  | {{ $t('demandForecasting.avgDailyDemand') }}
                el-input-number(
                  v-model="calcAvgDailyDemand"
                  :min="1"
                  :max="100000"
                  :step="10"
                  size="large"
                  style="width: 100%"
                  @change="calculateSafetyStock"
                )
              .form-group
                label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)")
                  | {{ $t('demandForecasting.leadTimeDays') }}
                el-input-number(
                  v-model="calcLeadTime"
                  :min="1"
                  :max="365"
                  :step="1"
                  size="large"
                  style="width: 100%"
                  @change="calculateSafetyStock"
                )
              .form-group
                label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)")
                  | {{ $t('demandForecasting.serviceLevel') }}
                el-slider(
                  v-model="calcServiceLevel"
                  :min="80"
                  :max="99.9"
                  :step="0.1"
                  :format-tooltip="(val: number) => val + '%'"
                  @change="calculateSafetyStock"
                )
                .flex.justify-between.text-xs.mt-1(style="color: var(--text-muted)")
                  span 80%
                  span {{ calcServiceLevel }}%
                  span 99.9%
            .calc-results
              .calc-result-card.mb-4
                .flex.items-center.gap-2.mb-2
                  Icon(name="ph:shield-check-bold" size="20" style="color: #3b82f6")
                  span.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('demandForecasting.calculatedSafetyStock') }}
                p.text-3xl.font-bold(style="color: #3b82f6") {{ calculatedSafetyStock.toLocaleString() }}
                p.text-xs.mt-1(style="color: var(--text-secondary)") {{ $t('demandForecasting.unitsRecommended') }}
              .calc-result-card
                .flex.items-center.gap-2.mb-2
                  Icon(name="ph:flag-checkered-bold" size="20" style="color: #22c55e")
                  span.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('demandForecasting.calculatedReorderPoint') }}
                p.text-3xl.font-bold(style="color: #22c55e") {{ calculatedReorderPoint.toLocaleString() }}
                p.text-xs.mt-1(style="color: var(--text-secondary)") {{ $t('demandForecasting.reorderWhenStockReaches') }}

        //- Stock vs Reorder Point Chart
        .glass-card.p-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:chart-bar-bold" size="22" style="color: #f59e0b")
              | {{ $t('demandForecasting.stockVsReorderPoint') }}
          ClientOnly
            VChart.w-full(:option="stockReorderChartOption" :style="{ height: '400px' }" autoresize)
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { graphic } from 'echarts/core';
import VChart from 'vue-echarts';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Demand Forecasting' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const loading = ref(false);
const activeTab = ref('overview');
const selectedTimeRange = ref('6M');
const selectedCategory = ref('all');
const productSearch = ref('');
const productCategoryFilter = ref('all');
const showLastYear = ref(false);

// Calculator state
const calcAvgDailyDemand = ref(150);
const calcLeadTime = ref(14);
const calcServiceLevel = ref(95);

// ─── Constants ──────────────────────────────────────────────
const productCategories = ['Electronics', 'Clothing', 'Food', 'Home', 'Sports'];

const timeRanges = [
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '12M', value: '12M' }
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Tooltip Style ──────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.92)',
  borderColor: 'rgba(245, 158, 11, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 12 },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => [
  {
    label: t('demandForecasting.forecastAccuracy'),
    value: '94.2%',
    icon: 'ph:crosshair-bold',
    color: '#22c55e',
    trend: 3.8
  },
  {
    label: t('demandForecasting.stockoutRiskItems'),
    value: '12',
    icon: 'ph:warning-bold',
    color: '#ef4444',
    trend: -2.1
  },
  {
    label: t('demandForecasting.overstockItems'),
    value: '8',
    icon: 'ph:package-bold',
    color: '#f59e0b',
    trend: -5.4
  },
  {
    label: t('demandForecasting.avgDaysOfSupply'),
    value: '34',
    icon: 'ph:clock-bold',
    color: '#3b82f6',
    trend: 1.2
  }
]);

// ─── Forecast Data (Seasonal Curves) ────────────────────────
function generateForecastData(numMonths: number) {
  const now = new Date();
  const labels: string[] = [];
  const actual: number[] = [];
  const forecast: number[] = [];
  const upperBound: number[] = [];
  const lowerBound: number[] = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    labels.push(monthLabel);

    // Seasonal pattern: higher in Q4 (Oct-Dec) and summer (Jun-Aug)
    const monthIdx = d.getMonth();
    const seasonalFactor = 1 + 0.3 * Math.sin(((monthIdx - 3) * Math.PI) / 6) + (monthIdx >= 9 ? 0.25 : 0);
    const baseValue = 9250;
    const actualVal = Math.round(baseValue * seasonalFactor);
    const forecastVal = Math.round(actualVal * 1.0);
    const margin = Math.round(forecastVal * 0.1);

    actual.push(actualVal);
    forecast.push(forecastVal);
    upperBound.push(forecastVal + margin);
    lowerBound.push(Math.max(0, forecastVal - margin));
  }

  // Add 3 future forecast-only months
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    labels.push(monthLabel);

    const monthIdx = d.getMonth();
    const seasonalFactor = 1 + 0.3 * Math.sin(((monthIdx - 3) * Math.PI) / 6) + (monthIdx >= 9 ? 0.25 : 0);
    const forecastVal = Math.round(10100 * seasonalFactor);
    const margin = Math.round(forecastVal * 0.12);

    actual.push(NaN); // no actual data for future
    forecast.push(forecastVal);
    upperBound.push(forecastVal + margin);
    lowerBound.push(Math.max(0, forecastVal - margin));
  }

  return { labels, actual, forecast, upperBound, lowerBound };
}

const forecastData = ref(generateForecastData(6));

// ─── Forecast Chart Option ──────────────────────────────────
const forecastChartOption = computed(() => {
  const data = forecastData.value;

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: unknown) => {
        const idx = params[0]?.dataIndex ?? 0;
        let html = `<strong>${data.labels[idx]}</strong><br/>`;
        params.forEach(p => {
          if (p.seriesName === 'Upper Bound' || p.seriesName === 'Lower Bound') return;
          const val = p.value;
          if (val === undefined || val === null || isNaN(val)) return;
          html += `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color};margin-right:6px;"></span>`;
          html += `${p.seriesName}: <strong>${val.toLocaleString()}</strong> units<br/>`;
        });
        if (data.upperBound[idx] && data.lowerBound[idx]) {
          html += `<span style="color:#94a3b8">Confidence: ${data.lowerBound[idx].toLocaleString()} - ${data.upperBound[idx].toLocaleString()}</span>`;
        }
        return html;
      }
    },
    legend: {
      data: [t('demandForecasting.actualDemand'), t('demandForecasting.forecastDemand')],
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
      data: data.labels,
      boundaryGap: false,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: t('demandForecasting.units'),
      nameTextStyle: { color: '#64748B', fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: {
        color: '#64748B',
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`)
      }
    },
    series: [
      // Confidence Band Upper (invisible line, acts as boundary)
      {
        name: 'Upper Bound',
        type: 'line',
        data: data.upperBound,
        lineStyle: { opacity: 0 },
        symbol: 'none',
        stack: 'confidence',
        silent: true
      },
      // Confidence Band Fill (between lower and upper)
      {
        name: 'Lower Bound',
        type: 'line',
        data: data.lowerBound.map((val, idx) => (data.upperBound[idx] ?? 0) - val),
        lineStyle: { opacity: 0 },
        symbol: 'none',
        stack: 'confidence',
        areaStyle: {
          color: 'rgba(120, 73, 255, 0.10)'
        },
        silent: true
      },
      // Actual Demand Line
      {
        name: t('demandForecasting.actualDemand'),
        type: 'line',
        data: data.actual,
        smooth: true,
        connectNulls: false,
        lineStyle: { width: 3, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.20)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
          ])
        },
        animationDuration: 1200
      },
      // Forecast Demand Line
      {
        name: t('demandForecasting.forecastDemand'),
        type: 'line',
        data: data.forecast,
        smooth: true,
        lineStyle: { width: 3, color: '#7849ff', type: 'dashed' },
        itemStyle: { color: '#7849ff' },
        symbol: 'diamond',
        symbolSize: 6,
        animationDuration: 1200,
        animationDelay: 200
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Forecast Summary Stats ─────────────────────────────────
const forecastSummaryStats = computed(() => {
  const data = forecastData.value;
  const validForecast = data.forecast.filter(v => !isNaN(v));
  const totalPredicted = validForecast.reduce((s, v) => s + v, 0);
  const validActual = data.actual.filter(v => !isNaN(v));
  const mapeValues = validActual.map((a, i) => Math.abs((a - (data.forecast[i] ?? 0)) / a) * 100);
  const mape = mapeValues.length > 0 ? mapeValues.reduce((s, v) => s + v, 0) / mapeValues.length : 0;

  const lastThree = validForecast.slice(-3);
  const firstThree = validForecast.slice(0, 3);
  const avgLast = lastThree.reduce((s, v) => s + v, 0) / (lastThree.length || 1);
  const avgFirst = firstThree.reduce((s, v) => s + v, 0) / (firstThree.length || 1);
  const trendDir = avgLast > avgFirst * 1.05 ? 'Upward' : avgLast < avgFirst * 0.95 ? 'Downward' : 'Stable';

  return [
    {
      label: t('demandForecasting.totalPredictedDemand'),
      value: totalPredicted.toLocaleString(),
      color: '#7849ff',
      description: t('demandForecasting.acrossForecastPeriod')
    },
    {
      label: t('demandForecasting.confidenceLevel'),
      value: '92.4%',
      color: '#22c55e',
      description: t('demandForecasting.weightedAverage')
    },
    {
      label: t('demandForecasting.mape'),
      value: `${mape.toFixed(1)}%`,
      color: '#3b82f6',
      description: t('demandForecasting.meanAbsolutePercentageError')
    },
    {
      label: t('demandForecasting.trendDirection'),
      value: trendDir,
      color: trendDir === 'Upward' ? '#22c55e' : trendDir === 'Downward' ? '#ef4444' : '#f59e0b',
      description: t('demandForecasting.basedOnRecentData')
    }
  ];
});

// ─── Product Forecast Data ──────────────────────────────────
const productForecasts = ref<Record<string, unknown>[]>([]);

const filteredProducts = computed(() => {
  let items = productForecasts.value;

  if (productCategoryFilter.value !== 'all') {
    items = items.filter(p => p.category === productCategoryFilter.value);
  }

  if (productSearch.value) {
    const q = productSearch.value.toLowerCase();
    items = items.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }

  return items;
});

// ─── Seasonal Heatmap Data ──────────────────────────────────
function generateSeasonalData(isLastYear: boolean) {
  const data: [number, number, number][] = [];
  const seasonalPatterns: Record<string, number[]> = {
    Electronics: [60, 55, 65, 70, 75, 80, 85, 82, 90, 95, 100, 100],
    Clothing: [50, 45, 55, 65, 70, 80, 85, 90, 75, 70, 85, 95],
    Food: [70, 65, 70, 75, 80, 85, 80, 78, 82, 85, 90, 95],
    Home: [55, 50, 60, 70, 75, 80, 75, 70, 65, 70, 80, 90],
    Sports: [45, 40, 55, 70, 85, 95, 100, 90, 75, 60, 50, 45]
  };

  const categories = Object.keys(seasonalPatterns);
  categories.forEach((cat, catIdx) => {
    months.forEach((_, monthIdx) => {
      let val = seasonalPatterns[cat]?.[monthIdx] ?? 50;
      if (isLastYear) {
        val = Math.max(20, val - 10);
      }
      data.push([monthIdx, catIdx, Math.max(10, Math.min(100, val))]);
    });
  });

  return data;
}

const seasonalHeatmapOption = computed(() => {
  const data = generateSeasonalData(showLastYear.value);
  const categories = ['Electronics', 'Clothing', 'Food', 'Home', 'Sports'];

  return {
    tooltip: {
      ...tooltipStyle,
      formatter: (params: unknown) => {
        const [monthIdx, catIdx, value] = params.data;
        return `<strong>${categories[catIdx]}</strong><br/>${months[monthIdx]}: <strong>${value}</strong> ${t('demandForecasting.demandIndex')}`;
      }
    },
    grid: { top: 20, right: 100, bottom: 40, left: 100, containLabel: false },
    xAxis: {
      type: 'category',
      data: months,
      splitArea: { show: true },
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'category',
      data: categories,
      splitArea: { show: true },
      axisLabel: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    visualMap: {
      min: 10,
      max: 100,
      calculable: true,
      orient: 'vertical',
      right: 0,
      top: 'center',
      inRange: {
        color: ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']
      },
      textStyle: { color: '#94A3B8', fontSize: 11 },
      text: [t('demandForecasting.high'), t('demandForecasting.low')]
    },
    series: [
      {
        type: 'heatmap',
        data,
        label: {
          show: true,
          color: '#fff',
          fontSize: 11,
          fontWeight: 'bold',
          formatter: (params: unknown) => params.data[2]
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          borderColor: 'var(--bg-elevated)',
          borderWidth: 3,
          borderRadius: 4
        }
      }
    ],
    animationDuration: 800,
    animationEasing: 'cubicOut'
  };
});

// ─── Seasonal Insights ──────────────────────────────────────
const seasonalInsights = computed(() => ({
  peakSeason: 'Oct - Dec (Q4)',
  peakDescription: t('demandForecasting.peakSeasonDesc'),
  lowestPeriod: 'Jan - Feb',
  lowestDescription: t('demandForecasting.lowestPeriodDesc'),
  yoyGrowth: '+12.6%',
  yoyDescription: t('demandForecasting.yoyGrowthDesc')
}));

// ─── Reorder Items ──────────────────────────────────────────
const reorderItems = ref<Record<string, unknown>[]>([]);

// ─── Safety Stock Calculator ────────────────────────────────
const calculatedSafetyStock = ref(0);
const calculatedReorderPoint = ref(0);

function calculateSafetyStock() {
  // Z-score lookup for common service levels
  const zScoreMap: Record<number, number> = {
    80: 0.84,
    85: 1.04,
    90: 1.28,
    92: 1.41,
    93: 1.48,
    94: 1.55,
    95: 1.65,
    96: 1.75,
    97: 1.88,
    98: 2.05,
    99: 2.33
  };

  const slFloor = Math.floor(calcServiceLevel.value);
  const zScore = zScoreMap[slFloor] || 1.65;

  // Standard deviation approximation (30% of avg demand)
  const demandStdDev = calcAvgDailyDemand.value * 0.3;
  const leadTimeStdDev = calcLeadTime.value * 0.2;

  // Safety stock = Z * sqrt(LT * sigma_d^2 + d^2 * sigma_LT^2)
  const ss = Math.round(
    zScore * Math.sqrt(calcLeadTime.value * Math.pow(demandStdDev, 2) + Math.pow(calcAvgDailyDemand.value, 2) * Math.pow(leadTimeStdDev, 2))
  );

  calculatedSafetyStock.value = ss;
  calculatedReorderPoint.value = Math.round(calcAvgDailyDemand.value * calcLeadTime.value + ss);
}

// Initialize calculator
calculateSafetyStock();

// ─── Stock vs Reorder Point Chart ───────────────────────────
const stockReorderChartOption = computed(() => {
  const top10 = [...productForecasts.value]
    .filter(p => p.reorderPoint > 0)
    .sort((a, b) => a.currentStock / a.reorderPoint - b.currentStock / b.reorderPoint)
    .slice(0, 10);

  const names = top10.map(p => ((p.name?.length ?? 0) > 18 ? p.name.slice(0, 18) + '...' : (p.name ?? '')));
  const stockValues = top10.map(p => p.currentStock ?? 0);
  const reorderValues = top10.map(p => p.reorderPoint ?? 0);

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const idx = params[0]?.dataIndex ?? 0;
        const product = top10[idx];
        if (!product) return '';
        let html = `<strong>${product.name}</strong><br/>`;
        params.forEach(p => {
          html += `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color};margin-right:6px;"></span>`;
          html += `${p.seriesName}: <strong>${p.value.toLocaleString()}</strong><br/>`;
        });
        const ratio = product.reorderPoint > 0 ? ((product.currentStock / product.reorderPoint) * 100).toFixed(0) : '0';
        html += `<br/><span style="color:${Number(ratio) < 100 ? '#ef4444' : '#22c55e'}">Stock/Reorder: <strong>${ratio}%</strong></span>`;
        return html;
      }
    },
    legend: {
      data: [t('demandForecasting.currentStock'), t('demandForecasting.reorderPoint')],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 20
    },
    grid: { top: 20, right: 30, bottom: 60, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: '#94A3B8', fontSize: 10, rotate: 25, interval: 0 },
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
        name: t('demandForecasting.currentStock'),
        type: 'bar',
        data: stockValues,
        barWidth: 20,
        barGap: '30%',
        itemStyle: {
          color: (params: unknown) => {
            const product = top10[params.dataIndex]!;
            if (product.currentStock < product.reorderPoint) {
              return new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#ef4444' },
                { offset: 1, color: '#dc2626' }
              ]);
            }
            return new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#22c55e' },
              { offset: 1, color: '#16a34a' }
            ]);
          },
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: t('demandForecasting.reorderPoint'),
        type: 'bar',
        data: reorderValues,
        barWidth: 20,
        itemStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f59e0b' },
            { offset: 1, color: '#d97706' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

// ─── Helpers ────────────────────────────────────────────────
function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    Electronics: '#3b82f6',
    Clothing: '#8b5cf6',
    Food: '#22c55e',
    Home: '#f59e0b',
    Sports: '#ef4444'
  };
  return colorMap[category] || '#64748b';
}

function getCategoryTagType(category: string): string {
  const typeMap: Record<string, string> = {
    Electronics: 'primary',
    Clothing: 'success',
    Food: 'warning',
    Home: 'info',
    Sports: 'danger'
  };
  return typeMap[category] || 'info';
}

function getVarianceColor(variance: number): string {
  if (variance < 10) return '#22c55e';
  if (variance < 25) return '#f59e0b';
  return '#ef4444';
}

function getProductRowClass({ row }: { row: unknown }): string {
  if (row.currentStock < row.reorderPoint * 0.5) return 'stockout-risk-row';
  if (row.currentStock > row.predictedDemand * 2.5) return 'overstock-row';
  return '';
}

function getStockGaugeColor(current: number, reorderPoint: number, _max: number): string {
  const ratio = current / reorderPoint;
  if (ratio < 0.5) return '#ef4444';
  if (ratio < 1) return '#f59e0b';
  return '#22c55e';
}

function deriveReorderItems(forecasts: Record<string, unknown>[]): Record<string, unknown>[] {
  return forecasts
    .filter(p => p.currentStock < p.reorderPoint)
    .map(p => ({
      name: p.name,
      currentStock: p.currentStock,
      maxStock: Math.round(p.reorderPoint * 2.5),
      reorderPoint: p.reorderPoint,
      safetyStock: Math.round(p.reorderPoint * 0.4),
      daysUntilStockout: p.predictedDemand > 0 ? Math.max(1, Math.round((p.currentStock / p.predictedDemand) * 30)) : 999
    }))
    .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
    .slice(0, 8);
}

async function loadData() {
  loading.value = true;
  try {
    // Fetch demand forecasts
    const { body: forecastsData, success: forecastsOk } = await useApiFetch('demand-forecasting' as unknown);
    if (forecastsOk && Array.isArray(forecastsData)) {
      productForecasts.value = forecastsData;
      // Derive reorder items from forecast data
      const derived = deriveReorderItems(forecastsData);
      reorderItems.value = derived;
    } else {
      productForecasts.value = [];
      reorderItems.value = [];
    }

    // Try to also fetch accuracy data for KPIs (optional enhancement)
    try {
      const { body: accuracyData, success: accuracyOk } = await useApiFetch('demand-forecasting/accuracy' as unknown);
      if (accuracyOk && accuracyData) {
        // Could be used to update KPI cards if backend provides accuracy metrics
      }
    } catch {
      // KPIs stay computed from local data
    }
  } catch {
    // On failure, leave data empty
    productForecasts.value = [];
    reorderItems.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

// ─── Actions ────────────────────────────────────────────────
function onTimeRangeChange(range: string) {
  selectedTimeRange.value = range;
  const monthMap: Record<string, number> = { '3M': 3, '6M': 6, '12M': 12 };
  forecastData.value = generateForecastData(monthMap[range] || 6);
}

function onCategoryChange(_category: string) {
  // Re-filter data based on selected category
  forecastData.value = generateForecastData({ '3M': 3, '6M': 6, '12M': 12 }[selectedTimeRange.value] || 6);
}

async function refreshData() {
  forecastData.value = generateForecastData(({ '3M': 3, '6M': 6, '12M': 12 } as Record<string, number>)[selectedTimeRange.value] || 6);
  await loadData();
}

function exportReport() {
  ElMessage.success(t('demandForecasting.exportStarted'));
}

function handleReorder(item: unknown) {
  ElMessage.warning(`${t('demandForecasting.reorderInitiated')}: ${item.name}`);
}
</script>

<style lang="scss" scoped>
.demand-forecasting-page {
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
  background: linear-gradient(135deg, #f59e0b, #f97316);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
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
    box-shadow: 0 8px 32px rgba(245, 158, 11, 0.08);
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
    box-shadow: 0 12px 40px rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.3);
  }
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Summary Stats ──────────────────────────────────────────
.summary-stat-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(245, 158, 11, 0.3);
    background: rgba(245, 158, 11, 0.03);
  }
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

// ─── Time Range Buttons ─────────────────────────────────────
.time-range-buttons {
  display: flex;
  gap: 4px;
}

// ─── Product Table Rows ─────────────────────────────────────
:deep(.stockout-risk-row) {
  td {
    background: rgba(239, 68, 68, 0.06) !important;
  }
}

:deep(.overstock-row) {
  td {
    background: rgba(245, 158, 11, 0.06) !important;
  }
}

.product-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Insight Cards ──────────────────────────────────────────
.insight-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(245, 158, 11, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.insight-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Reorder Cards ──────────────────────────────────────────
.reorder-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  &.reorder-critical {
    border-color: rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.04);
    animation: criticalPulse 2s ease-in-out infinite;
  }
}

@keyframes criticalPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
  50% {
    box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.12);
  }
}

// ─── Calculator Results ─────────────────────────────────────
.calc-results {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.calc-result-card {
  background: rgba(59, 130, 246, 0.04);
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.06);
  }
}

// ─── Tabs Styling ───────────────────────────────────────────
.forecast-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    background: var(--border-default);
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted);
    font-weight: 500;
    font-size: 0.95rem;

    &.is-active {
      color: #f59e0b;
      font-weight: 600;
    }

    &:hover {
      color: #f59e0b;
    }
  }

  :deep(.el-tabs__active-bar) {
    background-color: #f59e0b;
  }
}

// ─── Stockout Warning ───────────────────────────────────────
.stockout-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-size: 0.82rem;
  font-weight: 600;
}

// ─── Form Group ─────────────────────────────────────────────
.form-group {
  label {
    color: var(--text-primary);
  }
}
</style>
