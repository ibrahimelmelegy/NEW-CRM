<template lang="pug">
.purchase-analytics-page.p-6(class="md:p-8")
  //- ╔══════════════════════════════════════════════════════════╗
  //- ║  Page Header                                             ║
  //- ╚══════════════════════════════════════════════════════════╝
  .header.mb-8
    .flex.items-center.justify-between.flex-wrap.gap-4
      .flex.items-center.gap-4
        .header-icon-wrapper
          Icon(name="ph:chart-pie-slice-bold" size="28" style="color: #fff")
        div
          h2.text-3xl.font-bold.mb-1.bg-clip-text.text-transparent.bg-gradient-to-r.from-blue-400.to-cyan-400
            | {{ t('purchaseAnalytics.title') }}
          p(style="color: var(--text-muted)") {{ t('purchaseAnalytics.subtitle') }}
      .flex.items-center.gap-3.flex-wrap
        el-date-picker(
          v-model="dateRange"
          type="daterange"
          range-separator="to"
          :start-placeholder="t('purchaseAnalytics.dateRange')"
          end-placeholder="End"
          style="width: 280px"
        )
        el-button(type="primary" @click="refreshData" :loading="loading")
          Icon(name="ph:arrow-clockwise-bold" size="16")
          span.ml-2 {{ t('purchaseAnalytics.refresh') }}
        el-button(@click="exportReport")
          Icon(name="ph:download-simple-bold" size="16")
          span.ml-2 {{ t('purchaseAnalytics.export') }}

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="40" style="color: #3b82f6")

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
              span.text-xs.font-semibold(:style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ `${kpi.trend >= 0 ? '+' : ''}${kpi.trend}%` }}
          .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
            Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  Tabs                                                    ║
    //- ╚══════════════════════════════════════════════════════════╝
    el-tabs(v-model="activeTab" class="analytics-tabs")

      //- ────────────────────────────────────────────────────────
      //- Tab 1: Spend Analysis
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('purchaseAnalytics.spendAnalysis')" name="spend")
        //- Spend by Category Treemap
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:tree-structure-bold" size="22" style="color: #3b82f6")
              | {{ t('purchaseAnalytics.spendByCategory') }}
          ClientOnly
            VChart.w-full(:option="spendTreemapOption" :style="{ height: '380px' }" autoresize)

        //- Spend Trend Area Chart
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:chart-line-up-bold" size="22" style="color: #22c55e")
              | {{ t('purchaseAnalytics.spendTrend') }}
          ClientOnly
            VChart.w-full(:option="spendTrendOption" :style="{ height: '380px' }" autoresize)

        //- Top 10 Suppliers Table
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:ranking-bold" size="22" style="color: #7849ff")
              | {{ t('purchaseAnalytics.topSuppliers') }}
          el-table(:data="topSuppliers" stripe style="width: 100%")
            el-table-column(:label="t('purchaseAnalytics.rank')" width="70" align="center")
              template(#default="scope")
                .rank-badge(:class="getRankClass(scope.row.rank)") {{ scope.row.rank }}
            el-table-column(prop="name" :label="t('purchaseAnalytics.supplier')" min-width="180")
              template(#default="scope")
                .flex.items-center.gap-2
                  .supplier-avatar(:style="{ background: getCategoryColor(scope.row.category) + '22' }")
                    Icon(name="ph:storefront-bold" size="14" :style="{ color: getCategoryColor(scope.row.category) }")
                  span.font-medium {{ scope.row.name }}
            el-table-column(prop="category" :label="t('purchaseAnalytics.category')" min-width="130")
              template(#default="scope")
                el-tag(size="small" effect="plain") {{ scope.row.category }}
            el-table-column(prop="totalSpend" :label="t('purchaseAnalytics.totalSpend')" min-width="140" align="right" sortable)
              template(#default="scope")
                span.font-bold(style="color: var(--text-primary)") {{ scope.row.totalSpend }}
            el-table-column(prop="percentOfTotal" :label="t('purchaseAnalytics.percentOfTotal')" min-width="120" align="center")
              template(#default="scope")
                el-progress(:percentage="scope.row.percentOfTotal" :stroke-width="6" :show-text="true" :color="'#3b82f6'")
            el-table-column(:label="t('purchaseAnalytics.trend')" min-width="80" align="center")
              template(#default="scope")
                Icon(
                  :name="scope.row.trendDir === 'up' ? 'ph:trend-up-bold' : 'ph:trend-down-bold'"
                  size="18"
                  :style="{ color: scope.row.trendDir === 'up' ? '#22c55e' : '#ef4444' }"
                )

        //- Budget vs Actual — 2-column grid
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
          .glass-card.p-6
            .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
              h3.section-title
                Icon.mr-2(name="ph:scales-bold" size="22" style="color: #f59e0b")
                | {{ t('purchaseAnalytics.budgetVsActual') }}
            ClientOnly
              VChart.w-full(:option="budgetVsActualOption" :style="{ height: '360px' }" autoresize)

          .glass-card.p-6
            .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
              h3.section-title
                Icon.mr-2(name="ph:chart-donut-bold" size="22" style="color: #ec4899")
                | {{ t('purchaseAnalytics.spendByCategory') }}
            ClientOnly
              VChart.w-full(:option="spendDonutOption" :style="{ height: '360px' }" autoresize)

      //- ────────────────────────────────────────────────────────
      //- Tab 2: Supplier Performance
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('purchaseAnalytics.supplierPerformance')" name="suppliers")
        //- Supplier Scorecard Table
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:medal-bold" size="22" style="color: #7849ff")
              | {{ t('purchaseAnalytics.supplierPerformance') }}
          el-table(:data="supplierScorecard" stripe style="width: 100%")
            el-table-column(prop="name" :label="t('purchaseAnalytics.supplier')" min-width="170")
              template(#default="scope")
                span.font-semibold {{ scope.row.name }}
            el-table-column(:label="t('purchaseAnalytics.onTimeDelivery')" min-width="150" align="center" sortable)
              template(#default="scope")
                .flex.items-center.justify-center.gap-2
                  el-progress(
                    :percentage="scope.row.onTimeDelivery"
                    :stroke-width="6"
                    :show-text="false"
                    :color="getDeliveryColor(scope.row.onTimeDelivery)"
                    style="width: 80px"
                  )
                  span.text-sm.font-semibold(:style="{ color: getDeliveryColor(scope.row.onTimeDelivery) }") {{ `${scope.row.onTimeDelivery}%` }}
            el-table-column(:label="t('purchaseAnalytics.qualityScore')" min-width="150" align="center" sortable)
              template(#default="scope")
                el-progress(
                  :percentage="scope.row.qualityScore"
                  :stroke-width="10"
                  :color="getQualityColor(scope.row.qualityScore)"
                )
            el-table-column(:label="t('purchaseAnalytics.responsiveness')" min-width="140" align="center")
              template(#default="scope")
                .flex.items-center.justify-center(class="gap-0.5")
                  Icon(
                    v-for="star in 5"
                    :key="star"
                    :name="star <= scope.row.responsiveness ? 'ph:star-fill' : 'ph:star-bold'"
                    size="16"
                    :style="{ color: star <= scope.row.responsiveness ? '#f59e0b' : '#475569' }"
                  )
            el-table-column(:label="t('purchaseAnalytics.overallRating')" min-width="130" align="center" sortable)
              template(#default="scope")
                .flex.items-center.justify-center.gap-1
                  span.text-lg.font-bold(:style="{ color: getRatingColor(scope.row.overallRating) }") {{ scope.row.overallRating.toFixed(1) }}
                  Icon(name="ph:star-fill" size="16" :style="{ color: getRatingColor(scope.row.overallRating) }")
            el-table-column(:label="t('purchaseAnalytics.trend')" min-width="80" align="center")
              template(#default="scope")
                Icon(
                  :name="scope.row.trend === 'up' ? 'ph:trend-up-bold' : scope.row.trend === 'down' ? 'ph:trend-down-bold' : 'ph:minus-bold'"
                  size="18"
                  :style="{ color: scope.row.trend === 'up' ? '#22c55e' : scope.row.trend === 'down' ? '#ef4444' : '#94a3b8' }"
                )

        //- Charts: Radar + Performance Trend
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
          .glass-card.p-6
            .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
              h3.section-title
                Icon.mr-2(name="ph:chart-polar-bold" size="22" style="color: #3b82f6")
                | {{ t('purchaseAnalytics.supplierComparison') }}
            ClientOnly
              VChart.w-full(:option="supplierRadarOption" :style="{ height: '400px' }" autoresize)

          .glass-card.p-6
            .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
              h3.section-title
                Icon.mr-2(name="ph:chart-line-bold" size="22" style="color: #22c55e")
                | {{ t('purchaseAnalytics.performanceTrend') }}
            ClientOnly
              VChart.w-full(:option="performanceTrendOption" :style="{ height: '400px' }" autoresize)

      //- ────────────────────────────────────────────────────────
      //- Tab 3: Cost Optimization
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('purchaseAnalytics.costOptimization')" name="optimization")
        //- Savings Opportunities Cards
        .mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-5
            h3.section-title
              Icon.mr-2(name="ph:lightbulb-bold" size="22" style="color: #f59e0b")
              | {{ t('purchaseAnalytics.savingsOpportunities') }}
          .grid.gap-5(class="grid-cols-1 md:grid-cols-2 xl:grid-cols-3")
            .opportunity-card(v-for="(opp, idx) in savingsOpportunities" :key="idx")
              .flex.items-start.justify-between.mb-4
                .flex.items-center.gap-2
                  .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: getEffortBg(opp.effort) }")
                    Icon(:name="opp.icon" size="20" :style="{ color: getEffortColor(opp.effort) }")
                el-tag(
                  :type="getStatusType(opp.status)"
                  size="small"
                  effect="dark"
                ) {{ t(`purchaseAnalytics.${opp.statusKey}`) }}
              h4.font-semibold.mb-2(style="color: var(--text-primary)") {{ opp.description }}
              .flex.items-center.justify-between.mb-3
                div
                  p.text-xs(style="color: var(--text-muted)") {{ t('purchaseAnalytics.estimatedSavings') }}
                  p.text-lg.font-bold(style="color: #22c55e") {{ opp.savings }}
                div
                  p.text-xs(style="color: var(--text-muted)") {{ t('purchaseAnalytics.effortLevel') }}
                  el-tag(:type="getEffortType(opp.effort)" size="small" effect="plain") {{ t(`purchaseAnalytics.${opp.effort.toLowerCase()}`) }}
              el-button(
                type="primary"
                size="small"
                class="!w-full !rounded-xl"
                :disabled="opp.status === 'Implemented'"
              )
                Icon.mr-1(name="ph:rocket-launch-bold" size="14")
                | {{ opp.status === 'Implemented' ? t('purchaseAnalytics.implemented') : t('purchaseAnalytics.takeAction') }}

        //- Price Variance Table
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:arrows-split-bold" size="22" style="color: #ef4444")
              | {{ t('purchaseAnalytics.priceVariance') }}
          el-table(:data="priceVarianceData" stripe style="width: 100%")
            el-table-column(prop="item" label="Item" min-width="180")
              template(#default="scope")
                span.font-medium {{ scope.row.item }}
            el-table-column(:label="t('purchaseAnalytics.contracted')" min-width="130" align="right")
              template(#default="scope")
                span(style="color: var(--text-primary)") {{ scope.row.contracted }}
            el-table-column(:label="t('purchaseAnalytics.actual')" min-width="130" align="right")
              template(#default="scope")
                span.font-semibold(:style="{ color: getVarianceTextColor(scope.row.variancePct) }") {{ scope.row.actual }}
            el-table-column(:label="t('purchaseAnalytics.variance')" min-width="110" align="center" sortable)
              template(#default="scope")
                span.font-bold(:style="{ color: getVarianceTextColor(scope.row.variancePct) }") {{ `${scope.row.variancePct > 0 ? '+' : ''}${scope.row.variancePct}%` }}
            el-table-column(label="Status" min-width="120" align="center")
              template(#default="scope")
                el-tag(
                  :type="scope.row.variancePct > 2 ? 'danger' : scope.row.variancePct < -2 ? 'success' : 'info'"
                  size="small"
                  effect="dark"
                ) {{ getVarianceStatus(scope.row.variancePct) }}

        //- Cost Reduction Trend
        .glass-card.p-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:trend-down-bold" size="22" style="color: #22c55e")
              | {{ t('purchaseAnalytics.costReductionTrend') }}
          ClientOnly
            VChart.w-full(:option="costReductionOption" :style="{ height: '380px' }" autoresize)

      //- ────────────────────────────────────────────────────────
      //- Tab 4: Purchase Patterns
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('purchaseAnalytics.purchasePatterns')" name="patterns")
        //- Order Frequency Histogram
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:calendar-dots-bold" size="22" style="color: #3b82f6")
              | {{ t('purchaseAnalytics.orderFrequency') }}
          ClientOnly
            VChart.w-full(:option="orderFrequencyOption" :style="{ height: '340px' }" autoresize)

        //- Seasonal Heatmap
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:sun-horizon-bold" size="22" style="color: #f59e0b")
              | {{ t('purchaseAnalytics.seasonalPatterns') }}
          ClientOnly
            VChart.w-full(:option="seasonalHeatmapOption" :style="{ height: '400px' }" autoresize)

        //- Lead Time Analysis
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-6
            h3.section-title
              Icon.mr-2(name="ph:timer-bold" size="22" style="color: #7849ff")
              | {{ t('purchaseAnalytics.leadTimeAnalysis') }}
          ClientOnly
            VChart.w-full(:option="leadTimeOption" :style="{ height: '380px' }" autoresize)

        //- Reorder Automation Suggestions
        .mb-6
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-5
            h3.section-title
              Icon.mr-2(name="ph:robot-bold" size="22" style="color: #22c55e")
              | {{ t('purchaseAnalytics.reorderSuggestions') }}
          .grid.gap-5(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
            .glass-card.p-5(v-for="(item, idx) in reorderSuggestions" :key="idx")
              .flex.items-center.justify-between.mb-4
                span.font-semibold(style="color: var(--text-primary)") {{ item.name }}
                el-tag(
                  :type="item.stockStatus === 'low' ? 'danger' : item.stockStatus === 'medium' ? 'warning' : 'success'"
                  size="small"
                  effect="dark"
                ) {{ item.stockLabel }}
              .space-y-3.text-sm
                .flex.justify-between
                  span(style="color: var(--text-muted)") {{ t('purchaseAnalytics.currentStock') }}
                  span.font-semibold(style="color: var(--text-primary)") {{ item.currentStock.toLocaleString() }}
                .flex.justify-between
                  span(style="color: var(--text-muted)") {{ t('purchaseAnalytics.reorderPoint') }}
                  span.font-semibold(style="color: #f59e0b") {{ item.reorderPoint.toLocaleString() }}
                .flex.justify-between
                  span(style="color: var(--text-muted)") {{ t('purchaseAnalytics.suggestedQty') }}
                  span.font-bold(style="color: #3b82f6") {{ item.suggestedQty.toLocaleString() }}
                .flex.justify-between
                  span(style="color: var(--text-muted)") {{ t('purchaseAnalytics.estimatedCost') }}
                  span.font-bold(style="color: #22c55e") {{ item.estimatedCost }}
              .flex.items-center.justify-between.mt-4.pt-3(style="border-top: 1px solid var(--border-default)")
                span.text-sm.font-medium(style="color: var(--text-primary)") {{ t('purchaseAnalytics.autoReorder') }}
                el-switch(v-model="item.autoReorder" :active-color="'#22c55e'")
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { graphic } from 'echarts';
import VChart from 'vue-echarts';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Purchase Analytics' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const loading = ref(true);
const activeTab = ref('spend');
const dateRange = ref<[Date, Date] | null>(null);

// ─── Actions ────────────────────────────────────────────────
function exportReport() {
  // placeholder for export
}

// ─── Tooltip Style ──────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.92)',
  borderColor: 'rgba(59, 130, 246, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 12 },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

const axisLabelStyle = { color: '#94a3b8' };
const splitLineStyle = { lineStyle: { color: 'rgba(255,255,255,0.06)' } };

// ─── Months ─────────────────────────────────────────────────
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => [
  {
    label: t('purchaseAnalytics.totalSpendMtd'),
    value: '$1.24M',
    icon: 'ph:currency-dollar-bold',
    color: '#3b82f6',
    trend: 8.3,
  },
  {
    label: t('purchaseAnalytics.costSavings'),
    value: '$186K',
    icon: 'ph:trend-down-bold',
    color: '#22c55e',
    trend: 22.1,
  },
  {
    label: t('purchaseAnalytics.activeSuppliers'),
    value: '47',
    icon: 'ph:storefront-bold',
    color: '#7849ff',
    trend: 4.5,
  },
  {
    label: t('purchaseAnalytics.pendingOrders'),
    value: '23',
    icon: 'ph:clock-bold',
    color: '#f59e0b',
    trend: -12.3,
  },
]);

// ═══════════════════════════════════════════════════════════════
// TAB 1: Spend Analysis
// ═══════════════════════════════════════════════════════════════

// ─── Spend Treemap ──────────────────────────────────────────
const treemapCategories = [
  { name: 'Raw Materials', value: 420000, color: '#3b82f6' },
  { name: 'Electronics', value: 310000, color: '#7849ff' },
  { name: 'Packaging', value: 185000, color: '#22c55e' },
  { name: 'Logistics', value: 142000, color: '#f59e0b' },
  { name: 'Services', value: 98000, color: '#ec4899' },
  { name: 'Office Supplies', value: 52000, color: '#06b6d4' },
  { name: 'Software', value: 78000, color: '#8b5cf6' },
  { name: 'Maintenance', value: 65000, color: '#ef4444' },
];

const spendTreemapOption = computed(() => ({
  tooltip: {
    ...tooltipStyle,
    formatter: (params: any) => {
      const val = (params.value / 1000).toFixed(0);
      return `<strong>${params.name}</strong><br/>Spend: $${val}K`;
    },
  },
  series: [
    {
      type: 'treemap',
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      label: {
        show: true,
        formatter: '{b}\n${c}',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
      },
      itemStyle: {
        borderColor: 'rgba(30,30,45,0.6)',
        borderWidth: 3,
        gapWidth: 3,
        borderRadius: 6,
      },
      data: treemapCategories.map(c => ({
        name: c.name,
        value: c.value,
        itemStyle: { color: c.color },
      })),
    },
  ],
}));

// ─── Spend Trend (Area) ─────────────────────────────────────
const spendTrendData = [820, 930, 1050, 980, 1100, 1240, 1180, 1320, 1100, 1250, 1380, 1240];

const spendTrendOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'axis' },
  grid: { top: 30, right: 20, bottom: 40, left: 60 },
  xAxis: {
    type: 'category',
    data: months,
    axisLabel: axisLabelStyle,
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { ...axisLabelStyle, formatter: '${value}K' },
    splitLine: splitLineStyle,
  },
  series: [
    {
      name: 'Spend',
      type: 'line',
      smooth: true,
      data: spendTrendData,
      lineStyle: { color: '#3b82f6', width: 3 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: {
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
        ]),
      },
      symbol: 'circle',
      symbolSize: 6,
    },
  ],
}));

// ─── Top 10 Suppliers ───────────────────────────────────────
const topSuppliersFallback = [
  { rank: 1, name: 'GlobalTech Industries', category: 'Electronics', totalSpend: '$312,400', percentOfTotal: 25.2, trendDir: 'up' },
  { rank: 2, name: 'RawMat Solutions', category: 'Raw Materials', totalSpend: '$278,900', percentOfTotal: 22.5, trendDir: 'up' },
  { rank: 3, name: 'PackRight Corp', category: 'Packaging', totalSpend: '$185,200', percentOfTotal: 14.9, trendDir: 'down' },
  { rank: 4, name: 'SwiftLogistics Ltd', category: 'Logistics', totalSpend: '$142,600', percentOfTotal: 11.5, trendDir: 'up' },
  { rank: 5, name: 'ProServ Solutions', category: 'Services', totalSpend: '$98,300', percentOfTotal: 7.9, trendDir: 'up' },
  { rank: 6, name: 'TechSoft Inc', category: 'Software', totalSpend: '$78,400', percentOfTotal: 6.3, trendDir: 'up' },
  { rank: 7, name: 'MaintainPro Group', category: 'Maintenance', totalSpend: '$65,100', percentOfTotal: 5.3, trendDir: 'down' },
  { rank: 8, name: 'OfficeHub Supplies', category: 'Office Supplies', totalSpend: '$52,800', percentOfTotal: 4.3, trendDir: 'down' },
  { rank: 9, name: 'ChemWorks Ltd', category: 'Raw Materials', totalSpend: '$41,200', percentOfTotal: 3.3, trendDir: 'up' },
  { rank: 10, name: 'SecureIT Partners', category: 'Software', totalSpend: '$35,700', percentOfTotal: 2.9, trendDir: 'down' },
];

const topSuppliers = ref<any[]>([]);

// ─── Budget vs Actual ───────────────────────────────────────
const budgetVsActualOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'axis' },
  legend: {
    data: ['Budget', 'Actual'],
    textStyle: { color: '#94a3b8' },
    top: 0,
  },
  grid: { top: 40, right: 20, bottom: 40, left: 60 },
  xAxis: {
    type: 'category',
    data: ['Raw Mat.', 'Electronics', 'Packaging', 'Logistics', 'Services', 'Software'],
    axisLabel: axisLabelStyle,
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { ...axisLabelStyle, formatter: '${value}K' },
    splitLine: splitLineStyle,
  },
  series: [
    {
      name: 'Budget',
      type: 'bar',
      data: [450, 320, 200, 150, 110, 90],
      barGap: '10%',
      itemStyle: { color: '#3b82f6', borderRadius: [6, 6, 0, 0] },
    },
    {
      name: 'Actual',
      type: 'bar',
      data: [420, 310, 185, 142, 98, 78],
      itemStyle: { color: '#22c55e', borderRadius: [6, 6, 0, 0] },
    },
  ],
}));

// ─── Spend Donut ────────────────────────────────────────────
const spendDonutOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'item' },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
    textStyle: { color: '#94a3b8', fontSize: 12 },
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
      },
      data: treemapCategories.map(c => ({
        name: c.name,
        value: c.value,
        itemStyle: { color: c.color },
      })),
    },
  ],
}));

// ─── Helpers ────────────────────────────────────────────────
function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    'Raw Materials': '#3b82f6',
    Electronics: '#7849ff',
    Packaging: '#22c55e',
    Logistics: '#f59e0b',
    Services: '#ec4899',
    'Office Supplies': '#06b6d4',
    Software: '#8b5cf6',
    Maintenance: '#ef4444',
  };
  return map[category] || '#94a3b8';
}

function getRankClass(rank: number): string {
  if (rank === 1) return 'rank-gold';
  if (rank === 2) return 'rank-silver';
  if (rank === 3) return 'rank-bronze';
  return '';
}

// ═══════════════════════════════════════════════════════════════
// TAB 2: Supplier Performance
// ═══════════════════════════════════════════════════════════════

const supplierScorecardFallback = [
  { name: 'GlobalTech Industries', onTimeDelivery: 96, qualityScore: 92, responsiveness: 5, overallRating: 4.7, trend: 'up' },
  { name: 'RawMat Solutions', onTimeDelivery: 89, qualityScore: 88, responsiveness: 4, overallRating: 4.2, trend: 'up' },
  { name: 'PackRight Corp', onTimeDelivery: 93, qualityScore: 85, responsiveness: 4, overallRating: 4.0, trend: 'stable' },
  { name: 'SwiftLogistics Ltd', onTimeDelivery: 97, qualityScore: 91, responsiveness: 5, overallRating: 4.6, trend: 'up' },
  { name: 'ProServ Solutions', onTimeDelivery: 82, qualityScore: 78, responsiveness: 3, overallRating: 3.4, trend: 'down' },
  { name: 'TechSoft Inc', onTimeDelivery: 91, qualityScore: 94, responsiveness: 4, overallRating: 4.3, trend: 'up' },
  { name: 'MaintainPro Group', onTimeDelivery: 85, qualityScore: 82, responsiveness: 3, overallRating: 3.6, trend: 'down' },
  { name: 'OfficeHub Supplies', onTimeDelivery: 94, qualityScore: 86, responsiveness: 4, overallRating: 4.1, trend: 'stable' },
  { name: 'ChemWorks Ltd', onTimeDelivery: 88, qualityScore: 90, responsiveness: 4, overallRating: 4.0, trend: 'up' },
  { name: 'SecureIT Partners', onTimeDelivery: 90, qualityScore: 87, responsiveness: 3, overallRating: 3.8, trend: 'stable' },
];

const supplierScorecard = ref<any[]>([]);

function getDeliveryColor(pct: number): string {
  if (pct >= 95) return '#22c55e';
  if (pct >= 85) return '#f59e0b';
  return '#ef4444';
}

function getQualityColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 80) return '#3b82f6';
  return '#f59e0b';
}

function getRatingColor(rating: number): string {
  if (rating >= 4.5) return '#22c55e';
  if (rating >= 3.5) return '#f59e0b';
  return '#ef4444';
}

// ─── Supplier Radar Chart ───────────────────────────────────
const supplierRadarOption = computed(() => ({
  tooltip: tooltipStyle,
  legend: {
    data: ['GlobalTech', 'SwiftLogistics', 'TechSoft'],
    textStyle: { color: '#94a3b8' },
    bottom: 0,
  },
  radar: {
    indicator: [
      { name: 'On-Time', max: 100 },
      { name: 'Quality', max: 100 },
      { name: 'Response', max: 100 },
      { name: 'Pricing', max: 100 },
      { name: 'Flexibility', max: 100 },
    ],
    axisName: { color: '#94a3b8', fontSize: 12 },
    splitLine: splitLineStyle,
    splitArea: { areaStyle: { color: ['rgba(59,130,246,0.02)', 'rgba(59,130,246,0.04)'] } },
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: [96, 92, 95, 85, 88],
          name: 'GlobalTech',
          lineStyle: { color: '#3b82f6', width: 2 },
          itemStyle: { color: '#3b82f6' },
          areaStyle: { color: 'rgba(59, 130, 246, 0.15)' },
        },
        {
          value: [97, 91, 93, 80, 90],
          name: 'SwiftLogistics',
          lineStyle: { color: '#22c55e', width: 2 },
          itemStyle: { color: '#22c55e' },
          areaStyle: { color: 'rgba(34, 197, 94, 0.15)' },
        },
        {
          value: [91, 94, 88, 92, 82],
          name: 'TechSoft',
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' },
          areaStyle: { color: 'rgba(245, 158, 11, 0.15)' },
        },
      ],
    },
  ],
}));

// ─── Performance Trend (multi-line) ─────────────────────────
const perfMonths = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

const performanceTrendOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'axis' },
  legend: {
    data: ['GlobalTech', 'SwiftLogistics', 'TechSoft'],
    textStyle: { color: '#94a3b8' },
    top: 0,
  },
  grid: { top: 40, right: 20, bottom: 40, left: 50 },
  xAxis: {
    type: 'category',
    data: perfMonths,
    axisLabel: axisLabelStyle,
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
  },
  yAxis: {
    type: 'value',
    min: 60,
    max: 100,
    axisLabel: axisLabelStyle,
    splitLine: splitLineStyle,
  },
  series: [
    {
      name: 'GlobalTech',
      type: 'line',
      smooth: true,
      data: [90, 92, 91, 94, 95, 96],
      lineStyle: { color: '#3b82f6', width: 2.5 },
      itemStyle: { color: '#3b82f6' },
      symbol: 'circle',
      symbolSize: 6,
    },
    {
      name: 'SwiftLogistics',
      type: 'line',
      smooth: true,
      data: [88, 90, 93, 95, 96, 97],
      lineStyle: { color: '#22c55e', width: 2.5 },
      itemStyle: { color: '#22c55e' },
      symbol: 'circle',
      symbolSize: 6,
    },
    {
      name: 'TechSoft',
      type: 'line',
      smooth: true,
      data: [85, 87, 88, 90, 91, 91],
      lineStyle: { color: '#f59e0b', width: 2.5 },
      itemStyle: { color: '#f59e0b' },
      symbol: 'circle',
      symbolSize: 6,
    },
  ],
}));

// ═══════════════════════════════════════════════════════════════
// TAB 3: Cost Optimization
// ═══════════════════════════════════════════════════════════════

const savingsOpportunitiesFallback = [
  {
    description: 'Consolidate packaging suppliers from 5 to 2 preferred vendors',
    savings: '$42,000/yr',
    effort: 'Medium',
    status: 'Identified',
    statusKey: 'identified',
    icon: 'ph:package-bold',
  },
  {
    description: 'Negotiate volume discounts on raw materials with RawMat Solutions',
    savings: '$67,500/yr',
    effort: 'Low',
    status: 'In Progress',
    statusKey: 'inProgress',
    icon: 'ph:handshake-bold',
  },
  {
    description: 'Switch to regional logistics provider for local deliveries',
    savings: '$28,000/yr',
    effort: 'High',
    status: 'Identified',
    statusKey: 'identified',
    icon: 'ph:truck-bold',
  },
  {
    description: 'Implement automated PO processing to reduce admin costs',
    savings: '$18,500/yr',
    effort: 'Medium',
    status: 'In Progress',
    statusKey: 'inProgress',
    icon: 'ph:robot-bold',
  },
  {
    description: 'Renegotiate software license agreements for bulk pricing',
    savings: '$15,200/yr',
    effort: 'Low',
    status: 'Implemented',
    statusKey: 'implemented',
    icon: 'ph:code-bold',
  },
  {
    description: 'Implement just-in-time inventory for office supplies',
    savings: '$12,800/yr',
    effort: 'High',
    status: 'Identified',
    statusKey: 'identified',
    icon: 'ph:warehouse-bold',
  },
];

const savingsOpportunities = ref<any[]>([]);

function getEffortType(effort: string): string {
  if (effort === 'Low') return 'success';
  if (effort === 'Medium') return 'warning';
  return 'danger';
}

function getEffortBg(effort: string): string {
  if (effort === 'Low') return 'rgba(34,197,94,0.12)';
  if (effort === 'Medium') return 'rgba(245,158,11,0.12)';
  return 'rgba(239,68,68,0.12)';
}

function getEffortColor(effort: string): string {
  if (effort === 'Low') return '#22c55e';
  if (effort === 'Medium') return '#f59e0b';
  return '#ef4444';
}

function getStatusType(status: string): string {
  if (status === 'Implemented') return 'success';
  if (status === 'In Progress') return 'warning';
  return 'info';
}

// ─── Price Variance Data (mock with API fallback) ───────────
const priceVarianceDataFallback = [
  { item: 'Steel Sheets (per ton)', contracted: '$1,200', actual: '$1,248', variancePct: 4.0 },
  { item: 'Copper Wire (per kg)', contracted: '$8.50', actual: '$8.25', variancePct: -2.9 },
  { item: 'Cardboard Boxes (per 1000)', contracted: '$320', actual: '$315', variancePct: -1.6 },
  { item: 'Circuit Boards (per unit)', contracted: '$4.80', actual: '$5.10', variancePct: 6.3 },
  { item: 'Shipping Pallets (each)', contracted: '$18.00', actual: '$17.80', variancePct: -1.1 },
  { item: 'Adhesive Tape (per roll)', contracted: '$3.20', actual: '$3.25', variancePct: 1.6 },
  { item: 'Plastic Pellets (per kg)', contracted: '$2.10', actual: '$2.35', variancePct: 11.9 },
  { item: 'Safety Gloves (per box)', contracted: '$12.00', actual: '$11.40', variancePct: -5.0 },
];

const priceVarianceData = ref<any[]>([]);

function getVarianceTextColor(pct: number): string {
  if (pct > 2) return '#ef4444';
  if (pct < -2) return '#22c55e';
  return 'var(--text-primary)';
}

function getVarianceStatus(pct: number): string {
  if (pct > 2) return t('purchaseAnalytics.overBudget');
  if (pct < -2) return t('purchaseAnalytics.underBudget');
  return t('purchaseAnalytics.onTarget');
}

// ─── Cost Reduction Trend ───────────────────────────────────
const cumulativeSavings = [12, 28, 45, 62, 84, 105, 118, 132, 148, 165, 178, 186];

const costReductionOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'axis' },
  grid: { top: 30, right: 20, bottom: 40, left: 60 },
  xAxis: {
    type: 'category',
    data: months,
    axisLabel: axisLabelStyle,
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { ...axisLabelStyle, formatter: '${value}K' },
    splitLine: splitLineStyle,
  },
  series: [
    {
      name: 'Cumulative Savings',
      type: 'bar',
      data: cumulativeSavings,
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#22c55e' },
          { offset: 1, color: 'rgba(34, 197, 94, 0.3)' },
        ]),
      },
    },
  ],
}));

// ═══════════════════════════════════════════════════════════════
// TAB 4: Purchase Patterns
// ═══════════════════════════════════════════════════════════════

// ─── Order Frequency ────────────────────────────────────────
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const orderCounts = [45, 62, 58, 71, 54, 18, 8];

const orderFrequencyOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'axis' },
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
  xAxis: {
    type: 'category',
    data: daysOfWeek,
    axisLabel: axisLabelStyle,
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: axisLabelStyle,
    splitLine: splitLineStyle,
  },
  series: [
    {
      name: 'Orders',
      type: 'bar',
      data: orderCounts.map((val, i) => ({
        value: val,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: i === 3 ? '#3b82f6' : 'rgba(59,130,246,0.6)' },
            { offset: 1, color: i === 3 ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.1)' },
          ]),
        },
      })),
      barWidth: '50%',
    },
  ],
}));

// ─── Seasonal Heatmap ───────────────────────────────────────
const heatmapCategories = ['Raw Materials', 'Electronics', 'Packaging', 'Logistics', 'Services', 'Office Supplies', 'Software', 'Maintenance'];

const heatmapRawData: number[][] = [
  [72, 65, 80, 90, 85, 70, 68, 95, 88, 78, 82, 75],
  [55, 60, 70, 65, 80, 90, 85, 75, 70, 60, 95, 88],
  [80, 75, 85, 70, 65, 60, 72, 78, 90, 95, 88, 82],
  [60, 55, 65, 75, 80, 85, 90, 88, 82, 70, 65, 55],
  [40, 45, 50, 55, 60, 70, 65, 55, 50, 45, 40, 38],
  [50, 48, 52, 45, 42, 38, 40, 42, 55, 60, 65, 70],
  [30, 35, 45, 50, 55, 60, 58, 52, 48, 40, 65, 80],
  [45, 42, 50, 55, 48, 52, 60, 65, 58, 50, 45, 42],
];

const seasonalHeatmapOption = computed(() => {
  const data: [number, number, number][] = [];
  heatmapRawData.forEach((row, catIdx) => {
    row.forEach((val, monIdx) => {
      data.push([monIdx, catIdx, val]);
    });
  });

  return {
    tooltip: {
      ...tooltipStyle,
      formatter: (params: any) => {
        const month = months[params.value[0]];
        const cat = heatmapCategories[params.value[1]];
        return `<strong>${cat}</strong><br/>${month}: $${params.value[2]}K`;
      },
    },
    grid: { top: 10, right: 80, bottom: 50, left: 130 },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: axisLabelStyle,
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'transparent'] } },
    },
    yAxis: {
      type: 'category',
      data: heatmapCategories,
      axisLabel: { ...axisLabelStyle, fontSize: 11 },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'transparent'] } },
    },
    visualMap: {
      min: 30,
      max: 95,
      calculable: true,
      orient: 'vertical',
      right: 0,
      top: 'center',
      inRange: {
        color: ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#f59e0b', '#ef4444'],
      },
      textStyle: { color: '#94a3b8' },
    },
    series: [
      {
        type: 'heatmap',
        data,
        label: { show: true, color: '#fff', fontSize: 10 },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' },
        },
      },
    ],
  };
});

// ─── Lead Time Analysis ─────────────────────────────────────
const leadTimeSuppliers = [
  { name: 'GlobalTech Industries', avg: 8, max: 14 },
  { name: 'RawMat Solutions', avg: 12, max: 18 },
  { name: 'PackRight Corp', avg: 5, max: 9 },
  { name: 'SwiftLogistics Ltd', avg: 3, max: 6 },
  { name: 'ProServ Solutions', avg: 10, max: 22 },
  { name: 'TechSoft Inc', avg: 6, max: 10 },
  { name: 'MaintainPro Group', avg: 7, max: 15 },
  { name: 'OfficeHub Supplies', avg: 4, max: 7 },
];

const leadTimeOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'axis' },
  legend: {
    data: ['Avg Lead Time', 'Max Lead Time'],
    textStyle: { color: '#94a3b8' },
    top: 0,
  },
  grid: { top: 40, right: 30, bottom: 20, left: 160 },
  xAxis: {
    type: 'value',
    axisLabel: { ...axisLabelStyle, formatter: '{value}d' },
    splitLine: splitLineStyle,
  },
  yAxis: {
    type: 'category',
    data: leadTimeSuppliers.map(s => s.name),
    axisLabel: { ...axisLabelStyle, fontSize: 11 },
  },
  series: [
    {
      name: 'Avg Lead Time',
      type: 'bar',
      data: leadTimeSuppliers.map(s => s.avg),
      itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] },
      barGap: '10%',
    },
    {
      name: 'Max Lead Time',
      type: 'bar',
      data: leadTimeSuppliers.map(s => s.max),
      itemStyle: { color: 'rgba(239, 68, 68, 0.6)', borderRadius: [0, 4, 4, 0] },
    },
  ],
}));

// ─── Reorder Suggestions ────────────────────────────────────
const reorderSuggestionsFallback = [
  {
    name: 'Steel Sheets',
    currentStock: 240,
    reorderPoint: 300,
    suggestedQty: 500,
    estimatedCost: '$600,000',
    stockStatus: 'low' as const,
    stockLabel: 'Low Stock',
    autoReorder: false,
  },
  {
    name: 'Circuit Boards',
    currentStock: 1850,
    reorderPoint: 1500,
    suggestedQty: 3000,
    estimatedCost: '$14,400',
    stockStatus: 'medium' as const,
    stockLabel: 'Adequate',
    autoReorder: true,
  },
  {
    name: 'Cardboard Boxes',
    currentStock: 320,
    reorderPoint: 500,
    suggestedQty: 2000,
    estimatedCost: '$640',
    stockStatus: 'low' as const,
    stockLabel: 'Low Stock',
    autoReorder: false,
  },
  {
    name: 'Copper Wire',
    currentStock: 480,
    reorderPoint: 200,
    suggestedQty: 600,
    estimatedCost: '$5,100',
    stockStatus: 'high' as const,
    stockLabel: 'In Stock',
    autoReorder: true,
  },
  {
    name: 'Adhesive Tape',
    currentStock: 150,
    reorderPoint: 250,
    suggestedQty: 800,
    estimatedCost: '$2,560',
    stockStatus: 'low' as const,
    stockLabel: 'Low Stock',
    autoReorder: false,
  },
  {
    name: 'Plastic Pellets',
    currentStock: 1200,
    reorderPoint: 800,
    suggestedQty: 2000,
    estimatedCost: '$4,200',
    stockStatus: 'high' as const,
    stockLabel: 'In Stock',
    autoReorder: true,
  },
  {
    name: 'Safety Gloves',
    currentStock: 85,
    reorderPoint: 100,
    suggestedQty: 400,
    estimatedCost: '$4,800',
    stockStatus: 'low' as const,
    stockLabel: 'Critical',
    autoReorder: false,
  },
  {
    name: 'Shipping Pallets',
    currentStock: 340,
    reorderPoint: 200,
    suggestedQty: 500,
    estimatedCost: '$9,000',
    stockStatus: 'high' as const,
    stockLabel: 'In Stock',
    autoReorder: true,
  },
];

const reorderSuggestions = ref<any[]>([]);

// ─── Data Loading ───────────────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    // Wire topSuppliers from procurement API
    const procRes = await useApiFetch('procurement');
    if (procRes.success && Array.isArray(procRes.body)) {
      topSuppliers.value = procRes.body;
    } else {
      topSuppliers.value = topSuppliersFallback;
    }
  } catch {
    topSuppliers.value = topSuppliersFallback;
  }

  try {
    // Wire supplierScorecard from vendor-scorecard/ranking API
    const scoreRes = await useApiFetch('vendor-scorecard/ranking');
    if (scoreRes.success && Array.isArray(scoreRes.body)) {
      supplierScorecard.value = scoreRes.body;
    } else {
      supplierScorecard.value = supplierScorecardFallback;
    }
  } catch {
    supplierScorecard.value = supplierScorecardFallback;
  }

  try {
    // Wire reorderSuggestions from demand-forecasting API
    const reorderRes = await useApiFetch('demand-forecasting');
    if (reorderRes.success && Array.isArray(reorderRes.body)) {
      reorderSuggestions.value = reorderRes.body;
    } else {
      reorderSuggestions.value = reorderSuggestionsFallback;
    }
  } catch {
    reorderSuggestions.value = reorderSuggestionsFallback;
  }

  // Mock data that stays as fallback (no dedicated API)
  savingsOpportunities.value = savingsOpportunitiesFallback;
  priceVarianceData.value = priceVarianceDataFallback;

  loading.value = false;
}

function refreshData() {
  loadData();
}

onMounted(() => { loadData(); });
</script>

<style lang="scss" scoped>
.purchase-analytics-page {
  animation: fadeInUp 0.6s ease-out;
  min-height: 100vh;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: box-shadow 0.3s ease;
  &:hover { box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08); }
}

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
}

.header-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

.analytics-tabs {
  :deep(.el-tabs__nav-wrap::after) { background: var(--border-default); }
  :deep(.el-tabs__item) {
    color: var(--text-muted);
    font-weight: 500;
    &.is-active { color: #3b82f6; font-weight: 600; }
    &:hover { color: #3b82f6; }
  }
  :deep(.el-tabs__active-bar) { background-color: #3b82f6; }
}

.opportunity-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.1);
  }
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.rank-gold {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.3);
}

.rank-silver {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
  border-color: rgba(148, 163, 184, 0.3);
}

.rank-bronze {
  background: rgba(180, 83, 9, 0.15);
  color: #d97706;
  border-color: rgba(180, 83, 9, 0.3);
}

.supplier-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
