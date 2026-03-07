<template lang="pug">
.ai-insights-page.p-6(class="md:p-8")
  //- Page Header
  .header.mb-8
    .flex.items-center.justify-between.flex-wrap.gap-4
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)")
          Icon.mr-2.align-middle(name="ph:brain-bold" size="32" style="color: var(--accent-color, #7849ff)")
          | {{ $t('aiInsights.title') }}
        p(style="color: var(--text-muted)") {{ $t('aiInsights.subtitle') }}
      .flex.items-center.gap-3.flex-wrap
        el-date-picker(
          v-model="dateRange"
          type="daterange"
          range-separator="to"
          :start-placeholder="$t('aiInsights.startDate')"
          :end-placeholder="$t('aiInsights.endDate')"
          @change="onDateChange"
          style="width: 300px"
        )
        el-button(type="primary" @click="refreshData" :loading="loading")
          Icon(name="ph:arrow-clockwise-bold" size="16")
          span.ml-2 {{ $t('aiInsights.refresh') }}

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="40" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- ╔══════════════════════════════════════════════════╗
    //- ║  KPI Cards                                       ║
    //- ╚══════════════════════════════════════════════════╝
    .grid.gap-4.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
      .kpi-card(v-for="(kpi, i) in kpiCards" :key="i")
        .flex.items-start.gap-3
          .kpi-icon-wrapper(:style="{ background: kpi.bgColor }")
            Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")
          div
            p.text-sm.font-medium(style="color: var(--text-muted)") {{ kpi.label }}
            p.text-2xl.font-bold.mt-1(:style="{ color: kpi.color }") {{ kpi.value }}
            p.text-xs.mt-1(style="color: var(--text-secondary)") {{ kpi.subtext }}

    //- ╔══════════════════════════════════════════════════╗
    //- ║  Tabs                                            ║
    //- ╚══════════════════════════════════════════════════╝
    el-tabs(v-model="activeTab" class="ai-tabs")
      //- ── Tab 1: Predictions ──────────────────────────
      el-tab-pane(:label="$t('aiInsights.predictions')" name="predictions")
        .space-y-8
          //- Win Probability Cards
          .mb-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:target-bold" size="22" style="color: #7849ff")
              | {{ $t('aiInsights.winProbability') }}
            .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
              .probability-card(
                v-for="(group, gi) in winProbabilityGroups"
                :key="gi"
                :style="{ borderLeftColor: group.color }"
              )
                .flex.items-center.justify-between.mb-3
                  el-tag(:type="group.tagType" effect="dark" size="small") {{ group.label }}
                  span.text-sm.font-bold(:style="{ color: group.color }") {{ group.deals.length }} {{ $t('aiInsights.deals') }}
                .space-y-3
                  .deal-row(v-for="(deal, di) in group.deals.slice(0, 3)" :key="di")
                    .flex.items-center.justify-between
                      .flex.items-center.gap-2
                        .deal-avatar(:style="{ background: group.color }") {{ getInitials(deal.name) }}
                        div
                          p.text-sm.font-medium(style="color: var(--text-primary)") {{ deal.name }}
                          p.text-xs(style="color: var(--text-muted)") {{ deal.company }}
                      .text-right
                        p.text-sm.font-bold(:style="{ color: group.color }") {{ deal.probability }}%
                        p.text-xs(style="color: var(--text-muted)") {{ formatCurrency(deal.value) }}

          //- Churn Risk Table
          .glass-card.p-6.mb-6
            .flex.items-center.justify-between.flex-wrap.gap-4.mb-5
              h3.section-title
                Icon.mr-2(name="ph:user-minus-bold" size="22" style="color: #ef4444")
                | {{ $t('aiInsights.churnRisk') }}
              el-select(v-model="churnFilter" size="small" style="width: 160px")
                el-option(:label="$t('aiInsights.allRisks')" value="all")
                el-option(:label="$t('aiInsights.highRisk')" value="high")
                el-option(:label="$t('aiInsights.mediumRisk')" value="medium")
                el-option(:label="$t('aiInsights.lowRisk')" value="low")
            el-table(:data="filteredChurnData" stripe style="width: 100%")
              el-table-column(prop="customerName" :label="$t('aiInsights.customerName')" min-width="160")
                template(#default="scope")
                  .flex.items-center.gap-2
                    .churn-avatar {{ getInitials(scope.row.customerName) }}
                    span.font-medium {{ scope.row.customerName }}
              el-table-column(:label="$t('aiInsights.riskScore')" min-width="180")
                template(#default="scope")
                  .flex.items-center.gap-2
                    el-progress(
                      :percentage="scope.row.riskScore"
                      :stroke-width="10"
                      :color="getRiskColor(scope.row.riskScore)"
                      style="flex: 1"
                    )
              el-table-column(:label="$t('aiInsights.monthlyRevenue')" min-width="130")
                template(#default="scope")
                  span.font-semibold(style="color: #22c55e") {{ formatCurrency(scope.row.monthlyRevenue) }}
              el-table-column(prop="lastActivity" :label="$t('aiInsights.lastActivity')" min-width="120")
              el-table-column(prop="predictedChurnDate" :label="$t('aiInsights.predictedChurnDate')" min-width="140")
              el-table-column(:label="$t('aiInsights.recommendedAction')" min-width="180")
                template(#default="scope")
                  el-tag(size="small" :type="getActionTagType(scope.row.action)") {{ scope.row.action }}

          //- Revenue Forecast Chart
          .glass-card.p-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:chart-line-up-bold" size="22" style="color: #3b82f6")
              | {{ $t('aiInsights.revenueForecast') }}
            ClientOnly
              VChart.w-full(:option="revenueForecastOption" :style="{ height: '380px' }" autoresize)

      //- ── Tab 2: Anomalies ────────────────────────────
      el-tab-pane(:label="$t('aiInsights.anomalies')" name="anomalies")
        .space-y-8
          //- Severity Summary Cards
          .grid.gap-4.mb-6(class="grid-cols-1 sm:grid-cols-3")
            .severity-card(v-for="(sev, si) in severitySummary" :key="si")
              .flex.items-center.gap-3
                .severity-icon-wrapper(:style="{ background: sev.bgColor }")
                  Icon(:name="sev.icon" size="24" :style="{ color: sev.color }")
                div
                  p.text-sm.font-medium(style="color: var(--text-muted)") {{ sev.label }}
                  p.text-3xl.font-bold(:style="{ color: sev.color }") {{ sev.count }}

          //- Anomaly Scatter Chart
          .glass-card.p-6.mb-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:chart-scatter-bold" size="22" style="color: #f59e0b")
              | {{ $t('aiInsights.anomalyDistribution') }}
            ClientOnly
              VChart.w-full(:option="anomalyScatterOption" :style="{ height: '400px' }" autoresize)

          //- Anomaly Log Table
          .glass-card.p-6
            .flex.items-center.justify-between.flex-wrap.gap-4.mb-5
              h3.section-title
                Icon.mr-2(name="ph:list-magnifying-glass-bold" size="22" style="color: #06b6d4")
                | {{ $t('aiInsights.anomalyLog') }}
              .flex.items-center.gap-2
                el-select(v-model="anomalyStatusFilter" size="small" style="width: 150px")
                  el-option(:label="$t('aiInsights.allStatuses')" value="all")
                  el-option(:label="$t('aiInsights.new')" value="new")
                  el-option(:label="$t('aiInsights.investigating')" value="investigating")
                  el-option(:label="$t('aiInsights.resolved')" value="resolved")
            el-table(:data="filteredAnomalyLog" stripe style="width: 100%")
              el-table-column(prop="detectedDate" :label="$t('aiInsights.detectedDate')" min-width="120")
              el-table-column(prop="metricName" :label="$t('aiInsights.metricName')" min-width="150")
                template(#default="scope")
                  span.font-medium {{ scope.row.metricName }}
              el-table-column(:label="$t('aiInsights.expectedValue')" min-width="120" align="right")
                template(#default="scope")
                  span(style="color: var(--text-secondary)") {{ scope.row.expectedValue }}
              el-table-column(:label="$t('aiInsights.actualValue')" min-width="120" align="right")
                template(#default="scope")
                  span.font-bold(:style="{ color: scope.row.deviation > 0 ? '#ef4444' : '#22c55e' }") {{ scope.row.actualValue }}
              el-table-column(:label="$t('aiInsights.deviation')" min-width="110" align="center")
                template(#default="scope")
                  el-tag(
                    :type="Math.abs(scope.row.deviationPct) > 30 ? 'danger' : Math.abs(scope.row.deviationPct) > 15 ? 'warning' : 'info'"
                    size="small"
                  ) {{ scope.row.deviationPct > 0 ? '+' : '' }}{{ scope.row.deviationPct }}%
              el-table-column(:label="$t('aiInsights.severity')" min-width="100" align="center")
                template(#default="scope")
                  el-tag(
                    :type="scope.row.severity === 'critical' ? 'danger' : scope.row.severity === 'warning' ? 'warning' : 'info'"
                    effect="dark"
                    size="small"
                  ) {{ scope.row.severity }}
              el-table-column(:label="$t('aiInsights.status')" min-width="120" align="center")
                template(#default="scope")
                  el-tag(
                    :type="scope.row.status === 'resolved' ? 'success' : scope.row.status === 'investigating' ? 'warning' : 'danger'"
                    size="small"
                  ) {{ scope.row.status }}

      //- ── Tab 3: Recommendations ──────────────────────
      el-tab-pane(:label="$t('aiInsights.recommendations')" name="recommendations")
        .space-y-6
          //- Filter bar
          .flex.items-center.justify-between.flex-wrap.gap-4.mb-4
            .flex.items-center.gap-2
              el-radio-group(v-model="recCategoryFilter" size="small")
                el-radio-button(value="all") {{ $t('aiInsights.all') }}
                el-radio-button(value="cross-sell") {{ $t('aiInsights.crossSell') }}
                el-radio-button(value="upsell") {{ $t('aiInsights.upsell') }}
                el-radio-button(value="engagement") {{ $t('aiInsights.engagement') }}
                el-radio-button(value="retention") {{ $t('aiInsights.retention') }}
            el-badge(:value="pendingRecommendations" :max="99" type="primary")
              span.text-sm(style="color: var(--text-muted)") {{ $t('aiInsights.pendingActions') }}

          //- Recommendation Cards Grid
          .grid.gap-5(class="grid-cols-1 lg:grid-cols-2")
            .rec-card(v-for="(rec, ri) in filteredRecommendations" :key="ri")
              .rec-card-header
                .flex.items-center.gap-2
                  el-tag(
                    :type="rec.priority === 'urgent' ? 'danger' : rec.priority === 'high' ? 'warning' : 'info'"
                    effect="dark"
                    size="small"
                  ) {{ rec.priority }}
                  el-tag(size="small" effect="plain") {{ rec.category }}
                .flex.items-center.gap-1
                  Icon(name="ph:sparkle-bold" size="14" style="color: #f59e0b")
                  span.text-xs.font-medium(style="color: var(--text-muted)") {{ rec.confidence }}% {{ $t('aiInsights.confidence') }}
              h4.text-base.font-semibold.mt-3.mb-2(style="color: var(--text-primary)") {{ rec.title }}
              p.text-sm.mb-4(style="color: var(--text-secondary)") {{ rec.description }}
              .rec-impact.mb-4
                .grid.gap-3(class="grid-cols-2")
                  .impact-item
                    p.text-xs(style="color: var(--text-muted)") {{ $t('aiInsights.revenueImpact') }}
                    p.text-sm.font-bold(style="color: #22c55e") +{{ formatCurrency(rec.revenueImpact) }}
                  .impact-item
                    p.text-xs(style="color: var(--text-muted)") {{ $t('aiInsights.efficiencyGain') }}
                    p.text-sm.font-bold(style="color: #3b82f6") +{{ rec.efficiencyGain }}%
              .flex.items-center.gap-2.justify-end
                el-button(size="small" @click="dismissRecommendation(ri)") {{ $t('aiInsights.dismiss') }}
                el-button(type="primary" size="small" @click="applyRecommendation(ri)")
                  Icon(name="ph:check-bold" size="14" class="mr-1")
                  | {{ $t('aiInsights.apply') }}

      //- ── Tab 4: Model Performance ────────────────────
      el-tab-pane(:label="$t('aiInsights.modelPerformance')" name="performance")
        .space-y-8
          //- Accuracy Trend Chart
          .glass-card.p-6.mb-6
            h3.section-title.mb-5
              Icon.mr-2(name="ph:chart-line-bold" size="22" style="color: #7849ff")
              | {{ $t('aiInsights.accuracyTrend') }}
            ClientOnly
              VChart.w-full(:option="accuracyTrendOption" :style="{ height: '380px' }" autoresize)

          .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
            //- Confidence Distribution Histogram
            .glass-card.p-6
              h3.section-title.mb-5
                Icon.mr-2(name="ph:chart-bar-bold" size="22" style="color: #06b6d4")
                | {{ $t('aiInsights.confidenceDistribution') }}
              ClientOnly
                VChart.w-full(:option="confidenceDistOption" :style="{ height: '320px' }" autoresize)

            //- Model Comparison Table
            .glass-card.p-6
              h3.section-title.mb-5
                Icon.mr-2(name="ph:table-bold" size="22" style="color: #f97316")
                | {{ $t('aiInsights.modelComparison') }}
              el-table(:data="modelComparisonData" stripe style="width: 100%")
                el-table-column(prop="modelName" :label="$t('aiInsights.modelName')" min-width="130")
                  template(#default="scope")
                    span.font-semibold {{ scope.row.modelName }}
                el-table-column(:label="$t('aiInsights.accuracy')" min-width="90" align="center")
                  template(#default="scope")
                    span.font-bold(:style="{ color: scope.row.accuracy >= 90 ? '#22c55e' : scope.row.accuracy >= 80 ? '#f59e0b' : '#ef4444' }") {{ scope.row.accuracy }}%
                el-table-column(prop="precision" :label="$t('aiInsights.precision')" min-width="80" align="center")
                  template(#default="scope")
                    span {{ scope.row.precision.toFixed(2) }}
                el-table-column(prop="recall" :label="$t('aiInsights.recall')" min-width="70" align="center")
                  template(#default="scope")
                    span {{ scope.row.recall.toFixed(2) }}
                el-table-column(:label="$t('aiInsights.f1Score')" min-width="70" align="center")
                  template(#default="scope")
                    span.font-semibold {{ scope.row.f1.toFixed(2) }}
                el-table-column(prop="lastTrained" :label="$t('aiInsights.lastTrained')" min-width="110")
                el-table-column(:label="$t('aiInsights.status')" min-width="100" align="center")
                  template(#default="scope")
                    el-tag(
                      :type="scope.row.status === 'active' ? 'success' : scope.row.status === 'training' ? 'warning' : 'info'"
                      size="small"
                      effect="dark"
                    ) {{ scope.row.status }}

  //- Recommendation Detail Dialog
  el-dialog(v-model="showRecDialog" :title="selectedRec?.title || ''" width="600px")
    .space-y-4(v-if="selectedRec")
      el-alert(:title="$t('aiInsights.aiGenerated')" type="info" :closable="false" show-icon)
      p(style="color: var(--text-secondary)") {{ selectedRec.description }}
      .grid.gap-4(class="grid-cols-2")
        .stat-box
          p.text-xs(style="color: var(--text-muted)") {{ $t('aiInsights.revenueImpact') }}
          p.text-lg.font-bold(style="color: #22c55e") +{{ formatCurrency(selectedRec.revenueImpact) }}
        .stat-box
          p.text-xs(style="color: var(--text-muted)") {{ $t('aiInsights.efficiencyGain') }}
          p.text-lg.font-bold(style="color: #3b82f6") +{{ selectedRec.efficiencyGain }}%
        .stat-box
          p.text-xs(style="color: var(--text-muted)") {{ $t('aiInsights.confidence') }}
          p.text-lg.font-bold(style="color: #f59e0b") {{ selectedRec.confidence }}%
        .stat-box
          p.text-xs(style="color: var(--text-muted)") {{ $t('aiInsights.category') }}
          p.text-lg.font-bold(style="color: #7849ff") {{ selectedRec.category }}
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showRecDialog = false") {{ $t('aiInsights.close') }}
        el-button(type="primary" @click="confirmApply")
          Icon(name="ph:check-bold" size="14" class="mr-1")
          | {{ $t('aiInsights.applyAction') }}
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { graphic } from 'echarts/core';
import VChart from 'vue-echarts';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'AI Insights Dashboard' });

const { t } = useI18n();

const loading = ref(true);
const activeTab = ref('predictions');
const dateRange = ref<[Date, Date] | null>(null);

const rawDeals = ref<Record<string, unknown>[]>([]);
const rawLeads = ref<Record<string, unknown>[]>([]);

const churnFilter = ref('all');
const anomalyStatusFilter = ref('all');
const recCategoryFilter = ref('all');

const showRecDialog = ref(false);
const selectedRec = ref<Record<string, unknown> | null>(null);

const predictionAccuracy = ref(0);
const anomaliesDetected = ref(0);
const recommendationsGenerated = ref(0);
const actionsTaken = ref(0);

const churnData = ref<Record<string, unknown>[]>([]);
const winProbabilityGroups = ref<Record<string, unknown>[]>([]);
const anomalyLog = ref<Record<string, unknown>[]>([]);
const severitySummary = ref<Record<string, unknown>[]>([
  { label: t('aiInsights.critical'), count: 0, icon: 'ph:fire-bold', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.12)' },
  { label: t('aiInsights.warning'), count: 0, icon: 'ph:warning-bold', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' },
  { label: t('aiInsights.informational'), count: 0, icon: 'ph:info-bold', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)' }
]);
const recommendations = ref<Record<string, unknown>[]>([]);
const pendingRecommendations = computed(() => recommendations.value.filter(r => !r.dismissed && !r.applied).length);
const modelComparisonData = ref<Record<string, unknown>[]>([]);

const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.9)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 12 },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

const kpiCards = computed(() => [
  {
    label: t('aiInsights.predictionAccuracy'),
    value: `${predictionAccuracy.value}%`,
    subtext: t('aiInsights.last30Days'),
    icon: 'ph:bullseye-bold',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.12)'
  },
  {
    label: t('aiInsights.anomaliesDetected'),
    value: anomaliesDetected.value,
    subtext: t('aiInsights.thisWeek'),
    icon: 'ph:warning-diamond-bold',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.12)'
  },
  {
    label: t('aiInsights.recommendationsGenerated'),
    value: recommendationsGenerated.value,
    subtext: t('aiInsights.thisMonth'),
    icon: 'ph:lightbulb-bold',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.12)'
  },
  {
    label: t('aiInsights.actionsTaken'),
    value: `${actionsTaken.value}/${recommendationsGenerated.value}`,
    subtext: `${Math.round((actionsTaken.value / Math.max(recommendationsGenerated.value, 1)) * 100)}% ${t('aiInsights.adoptionRate')}`,
    icon: 'ph:check-circle-bold',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)'
  }
]);

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
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

function getRiskColor(score: number): string {
  if (score >= 70) return '#ef4444';
  if (score >= 40) return '#f59e0b';
  return '#22c55e';
}

function getActionTagType(action: string): string {
  if (action.toLowerCase().includes('urgent') || action.toLowerCase().includes('call')) return 'danger';
  if (action.toLowerCase().includes('offer') || action.toLowerCase().includes('discount')) return 'warning';
  return 'info';
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year || '0'), parseInt(month || '1') - 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function getFilteredDeals(): Record<string, unknown>[] {
  if (!dateRange.value) return rawDeals.value;
  const [start, end] = dateRange.value;
  return rawDeals.value.filter((d) => {
    const created = new Date(d.createdAt || d.created_at);
    return created >= start && created <= end;
  });
}

async function loadData() {
  loading.value = true;
  try {
    const [dealsRes, leadsRes] = await Promise.all([
      useApiFetch('deal').catch(() => ({ body: [] })),
      useApiFetch('lead').catch(() => ({ body: [] }))
    ]);

    rawDeals.value = Array.isArray(dealsRes?.body) ? dealsRes.body : Array.isArray((dealsRes?.body as unknown)?.docs) ? (dealsRes.body as unknown).docs : [];
    rawLeads.value = Array.isArray(leadsRes?.body) ? leadsRes.body : Array.isArray((leadsRes?.body as unknown)?.docs) ? (leadsRes.body as unknown).docs : [];

    computeAll();
  } catch (e) {
    console.error('Failed to load AI insights data', e);
  } finally {
    loading.value = false;
  }
}

function computeAll() {
  computeKPIs();
  computeWinProbability();
  computeChurnRisk();
}

function onDateChange() {
  computeAll();
}

function refreshData() {
  loadData();
}

function computeKPIs() {
  const deals = getFilteredDeals();
  const wonDeals = deals.filter((d) => {
    const s = (d.status || d.stage || '').toLowerCase();
    return s.includes('won') || s.includes('closed');
  });
  const totalDeals = deals.length;

  if (totalDeals === 0) {
    predictionAccuracy.value = 0;
    anomaliesDetected.value = 0;
    recommendationsGenerated.value = 0;
    actionsTaken.value = 0;
    return;
  }

  const winRate = (wonDeals.length / totalDeals) * 100;
  predictionAccuracy.value = parseFloat(Math.min(95, Math.max(50, 50 + winRate * 0.5)).toFixed(1));

  const values = deals.map((d) => parseFloat(d.value || d.amount || d.dealValue || 0)).filter(v => v > 0);
  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const variance = values.length > 0 ? values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length : 0;
  const stdDev = Math.sqrt(variance);
  anomaliesDetected.value = values.filter(v => Math.abs(v - mean) > stdDev * 1.5).length;

  recommendationsGenerated.value = 0;
  actionsTaken.value = 0;
}

function computeWinProbability() {
  const deals = getFilteredDeals();
  if (deals.length === 0) {
    winProbabilityGroups.value = [
      { label: t('aiInsights.highProbability'), deals: [], color: '#22c55e', tagType: 'success' },
      { label: t('aiInsights.mediumProbability'), deals: [], color: '#f59e0b', tagType: 'warning' },
      { label: t('aiInsights.lowProbability'), deals: [], color: '#ef4444', tagType: 'danger' }
    ];
    return;
  }

  const scoredDeals = deals.map((d) => {
    const value = parseFloat(d.value || d.amount || d.dealValue || 0);
    const stage = (d.status || d.stage || d.dealStage || '').toLowerCase();
    const name = d.name || d.title || d.dealName || 'Untitled Deal';
    const company = d.company?.name || d.companyName || d.client || '';

    let probability = 50;
    if (stage.includes('won') || stage.includes('closed')) probability = 95;
    else if (stage.includes('negoti')) probability = 80;
    else if (stage.includes('propos')) probability = 60;
    else if (stage.includes('qualif')) probability = 40;
    else if (stage.includes('opportun')) probability = 50;
    else if (stage.includes('lost')) probability = 5;
    else probability = 25;

    return { name, company, value, probability };
  });

  const high = scoredDeals.filter(d => d.probability >= 70).sort((a, b) => b.probability - a.probability);
  const medium = scoredDeals.filter(d => d.probability >= 40 && d.probability < 70).sort((a, b) => b.probability - a.probability);
  const low = scoredDeals.filter(d => d.probability < 40).sort((a, b) => b.probability - a.probability);

  winProbabilityGroups.value = [
    { label: t('aiInsights.highProbability'), deals: high, color: '#22c55e', tagType: 'success' },
    { label: t('aiInsights.mediumProbability'), deals: medium, color: '#f59e0b', tagType: 'warning' },
    { label: t('aiInsights.lowProbability'), deals: low, color: '#ef4444', tagType: 'danger' }
  ];
}

function computeChurnRisk() {
  const deals = getFilteredDeals();
  const leads = rawLeads.value;
  const now = new Date();

  if (deals.length === 0 && leads.length === 0) {
    churnData.value = [];
    return;
  }

  const customers = new Map<string, Record<string, unknown>>();
  deals.forEach((d) => {
    const name = d.company?.name || d.companyName || d.client || d.name || '';
    if (!name) return;
    if (!customers.has(name)) {
      customers.set(name, {
        customerName: name,
        value: 0,
        lastDate: new Date(d.createdAt || d.created_at || Date.now()),
        status: d.status || d.stage || ''
      });
    }
    const c = customers.get(name)!;
    (c as Record<string, unknown>).value = ((c as Record<string, unknown>).value as number) + parseFloat(d.value || d.amount || d.dealValue || 0);
    const date = new Date(d.updatedAt || d.updated_at || d.createdAt || d.created_at || Date.now());
    if (date > (c.lastDate as Date)) c.lastDate = date;
  });

  if (customers.size < 3) {
    leads.slice(0, 10).forEach((l) => {
      const name = l.company || l.name || l.fullName || '';
      if (!name || customers.has(name)) return;
      customers.set(name, {
        customerName: name,
        value: parseFloat(l.value || l.estimatedValue || '0'),
        lastDate: new Date(l.updatedAt || l.updated_at || l.createdAt || l.created_at || Date.now()),
        status: l.status || ''
      });
    });
  }

  const actions = [
    t('aiInsights.actionScheduleCall'),
    t('aiInsights.actionOfferDiscount'),
    t('aiInsights.actionSendSurvey'),
    t('aiInsights.actionPersonalOutreach'),
    t('aiInsights.actionProductDemo'),
    t('aiInsights.actionUrgentEscalation')
  ];

  churnData.value = Array.from(customers.values())
    .map(c => {
      const daysSinceActivity = Math.floor((now.getTime() - (c.lastDate as Date).getTime()) / (1000 * 60 * 60 * 24));
      const riskScore = Math.min(98, Math.max(5, Math.floor(daysSinceActivity * 1.5)));
      const monthlyRevenue = Math.round((c.value as number) / 12);
      const predictedChurnDate = new Date(now.getTime() + (100 - riskScore) * 24 * 60 * 60 * 1000);
      const actionIndex = daysSinceActivity % actions.length;

      return {
        customerName: c.customerName,
        riskScore,
        monthlyRevenue,
        lastActivity: `${daysSinceActivity}d ago`,
        predictedChurnDate: predictedChurnDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        action: actions[actionIndex]
      };
    })
    .sort((a, b) => (b.riskScore as number) - (a.riskScore as number))
    .slice(0, 15);
}

const filteredChurnData = computed(() => {
  if (churnFilter.value === 'all') return churnData.value;
  return churnData.value.filter(c => {
    if (churnFilter.value === 'high') return c.riskScore >= 70;
    if (churnFilter.value === 'medium') return c.riskScore >= 40 && c.riskScore < 70;
    return c.riskScore < 40;
  });
});

const revenueForecastOption = computed(() => {
  const deals = getFilteredDeals();
  const now = new Date();
  const months: string[] = [];
  const actual: (number | null)[] = [];
  const forecast: (number | null)[] = [];
  const upperBand: (number | null)[] = [];
  const lowerBand: (number | null)[] = [];

  const monthMap = new Map<string, number>();
  for (let i = 8; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(d);
    monthMap.set(key, 0);
  }
  deals.forEach((d) => {
    const created = new Date(d.createdAt || d.created_at || Date.now());
    const key = getMonthKey(created);
    const val = parseFloat(d.value || d.amount || d.dealValue || 0);
    if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) || 0) + val);
  });

  const sorted = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const pastValues = sorted.map(([, v]) => v);
  const avgGrowth =
    pastValues.length > 1
      ? pastValues.slice(1).reduce((acc, v, i) => acc + ((pastValues[i] || 0) > 0 ? (v - pastValues[i]!) / pastValues[i]! : 0), 0) /
        (pastValues.length - 1)
      : 0;

  sorted.forEach(([key, val]) => {
    months.push(getMonthLabel(key));
    actual.push(val);
    forecast.push(null);
    upperBand.push(null);
    lowerBand.push(null);
  });

  let lastVal = pastValues[pastValues.length - 1] || 0;
  if (lastVal > 0) {
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(getMonthLabel(getMonthKey(d)));
      actual.push(null);
      const projected = Math.round(lastVal * (1 + avgGrowth));
      forecast.push(projected);
      upperBand.push(Math.round(projected * (1.12 + i * 0.02)));
      lowerBand.push(Math.round(projected * (0.88 - i * 0.02)));
      lastVal = projected;
    }
  }

  const lastActualIdx = actual.findLastIndex(v => v !== null);
  if (lastActualIdx >= 0 && lastActualIdx < actual.length - 1) {
    forecast[lastActualIdx] = actual[lastActualIdx] ?? null;
    upperBand[lastActualIdx] = actual[lastActualIdx] ?? null;
    lowerBand[lastActualIdx] = actual[lastActualIdx] ?? null;
  }

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: unknown) => {
        let result = `<strong>${params[0]?.axisValue}</strong><br/>`;
        params.forEach((p) => {
          if (p.value !== null && p.value !== undefined) {
            result += `${p.marker} ${p.seriesName}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(p.value)}<br/>`;
          }
        });
        return result;
      }
    },
    legend: {
      data: [t('aiInsights.actual'), t('aiInsights.forecast'), t('aiInsights.upperBound'), t('aiInsights.lowerBound')],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8
    },
    grid: { top: 30, right: 30, bottom: 50, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: {
        color: '#64748B',
        formatter: (v: number) => (v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`)
      }
    },
    series: [
      {
        name: t('aiInsights.actual'),
        type: 'line',
        data: actual,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#7849ff' },
        itemStyle: { color: '#7849ff' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(120, 73, 255, 0.25)' },
            { offset: 1, color: 'rgba(120, 73, 255, 0)' }
          ])
        }
      },
      {
        name: t('aiInsights.forecast'),
        type: 'line',
        data: forecast,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#3b82f6', type: 'dashed' },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.15)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0)' }
          ])
        }
      },
      {
        name: t('aiInsights.upperBound'),
        type: 'line',
        data: upperBand,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 1, color: 'rgba(34, 197, 94, 0.4)', type: 'dotted' },
        itemStyle: { color: '#22c55e' }
      },
      {
        name: t('aiInsights.lowerBound'),
        type: 'line',
        data: lowerBand,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 1, color: 'rgba(239, 68, 68, 0.4)', type: 'dotted' },
        itemStyle: { color: '#ef4444' }
      }
    ],
    animationDuration: 1200,
    animationEasing: 'cubicOut'
  };
});

const filteredAnomalyLog = computed(() => {
  if (anomalyStatusFilter.value === 'all') return anomalyLog.value;
  return anomalyLog.value.filter(a => a.status === anomalyStatusFilter.value);
});

const anomalyScatterOption = computed(() => {
  const criticalData: number[][] = [];
  const warningData: number[][] = [];
  const infoData: number[][] = [];

  anomalyLog.value.forEach((a, idx) => {
    const point = [idx, Math.abs(a.deviationPct as number), Math.abs(a.deviationPct as number) * 0.8 + 5];
    if (a.severity === 'critical') criticalData.push(point);
    else if (a.severity === 'warning') warningData.push(point);
    else infoData.push(point);
  });

  return {
    tooltip: {
      ...tooltipStyle,
      formatter: (params: unknown) => {
        const a = anomalyLog.value[params.data[0]];
        if (!a) return '';
        return `<strong>${a.metricName}</strong><br/>${t('aiInsights.deviation')}: ${(a.deviationPct as number) > 0 ? '+' : ''}${a.deviationPct}%<br/>${t('aiInsights.severity')}: ${a.severity}<br/>${t('aiInsights.detected')}: ${a.detectedDate}`;
      }
    },
    legend: {
      data: [t('aiInsights.critical'), t('aiInsights.warning'), t('aiInsights.informational')],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'circle',
      itemWidth: 10
    },
    grid: { top: 30, right: 30, bottom: 50, left: 20, containLabel: true },
    xAxis: {
      type: 'value',
      name: t('aiInsights.timeIndex'),
      nameTextStyle: { color: '#64748B' },
      axisLabel: { color: '#94A3B8' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } }
    },
    yAxis: {
      type: 'value',
      name: t('aiInsights.deviationMagnitude'),
      nameTextStyle: { color: '#64748B' },
      axisLabel: { color: '#94A3B8', formatter: '{value}%' },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } }
    },
    series: [
      {
        name: t('aiInsights.critical'),
        type: 'scatter',
        data: criticalData,
        symbolSize: (data: number[]) => Math.max(10, Math.min(30, data[2] || 0)),
        itemStyle: { color: '#ef4444', shadowBlur: 10, shadowColor: 'rgba(239, 68, 68, 0.4)' }
      },
      {
        name: t('aiInsights.warning'),
        type: 'scatter',
        data: warningData,
        symbolSize: (data: number[]) => Math.max(8, Math.min(25, data[2] || 0)),
        itemStyle: { color: '#f59e0b', shadowBlur: 8, shadowColor: 'rgba(245, 158, 11, 0.3)' }
      },
      {
        name: t('aiInsights.informational'),
        type: 'scatter',
        data: infoData,
        symbolSize: (data: number[]) => Math.max(6, Math.min(20, data[2] || 0)),
        itemStyle: { color: '#3b82f6', shadowBlur: 6, shadowColor: 'rgba(59, 130, 246, 0.3)' }
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
});

const filteredRecommendations = computed(() => {
  let recs = recommendations.value.filter(r => !r.dismissed);
  if (recCategoryFilter.value !== 'all') {
    recs = recs.filter(r => r.category === recCategoryFilter.value);
  }
  return recs;
});

function applyRecommendation(index: number) {
  const rec = filteredRecommendations.value[index];
  if (rec) {
    selectedRec.value = rec;
    showRecDialog.value = true;
  }
}

function dismissRecommendation(index: number) {
  const rec = filteredRecommendations.value[index];
  if (rec) {
    const originalIdx = recommendations.value.indexOf(rec);
    if (originalIdx >= 0) recommendations.value[originalIdx].dismissed = true;
  }
}

function confirmApply() {
  if (selectedRec.value) {
    const idx = recommendations.value.indexOf(selectedRec.value);
    if (idx >= 0) {
      recommendations.value[idx].applied = true;
      actionsTaken.value++;
    }
  }
  showRecDialog.value = false;
}

const accuracyTrendOption = computed(() => {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthLabel(getMonthKey(d)));
  }

  const emptyData = new Array(12).fill(0);

  return {
    tooltip: { trigger: 'axis', ...tooltipStyle },
    legend: {
      data: [t('aiInsights.churnModel'), t('aiInsights.winRateModel'), t('aiInsights.revenueModel')],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8
    },
    grid: { top: 30, right: 30, bottom: 50, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B', formatter: '{value}%' }
    },
    series: [
      {
        name: t('aiInsights.churnModel'),
        type: 'line',
        data: emptyData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 3, color: '#22c55e' },
        itemStyle: { color: '#22c55e' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34, 197, 94, 0.15)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0)' }
          ])
        }
      },
      {
        name: t('aiInsights.winRateModel'),
        type: 'line',
        data: emptyData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 3, color: '#7849ff' },
        itemStyle: { color: '#7849ff' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(120, 73, 255, 0.15)' },
            { offset: 1, color: 'rgba(120, 73, 255, 0)' }
          ])
        }
      },
      {
        name: t('aiInsights.revenueModel'),
        type: 'line',
        data: emptyData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 3, color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 158, 11, 0.15)' },
            { offset: 1, color: 'rgba(245, 158, 11, 0)' }
          ])
        }
      }
    ],
    animationDuration: 1200,
    animationEasing: 'cubicOut'
  };
});

const confidenceDistOption = computed(() => {
  const buckets = ['50-55', '55-60', '60-65', '65-70', '70-75', '75-80', '80-85', '85-90', '90-95', '95-100'];
  const emptyBuckets = new Array(10).fill(0);

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      formatter: (params: unknown) => {
        return `<strong>${params[0]?.axisValue}%</strong><br/>${t('aiInsights.predictions')}: ${params[0]?.value}`;
      }
    },
    grid: { top: 20, right: 20, bottom: 30, left: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: buckets,
      axisLabel: { color: '#94A3B8', fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B' }
    },
    series: [
      {
        type: 'bar',
        data: emptyBuckets.map(() => ({
          value: 0,
          itemStyle: {
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#06b6d4' },
              { offset: 1, color: 'rgba(6, 182, 212, 0.3)' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        })),
        barWidth: '60%',
        animationDuration: 800,
        animationEasing: 'cubicOut'
      }
    ]
  };
});

await loadData().catch(() => {
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.ai-insights-page {
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
    box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08);
  }
}

// ─── KPI Cards ──────────────────────────────────────────────
.kpi-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 1.25rem;
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.12);
    border-color: rgba(120, 73, 255, 0.3);
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

// ─── AI Tabs ────────────────────────────────────────────────
.ai-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
  }
  :deep(.el-tabs__item) {
    font-weight: 600;
    font-size: 0.95rem;
  }
  :deep(.el-tabs__active-bar) {
    background: var(--accent-color, #7849ff);
  }
}

// ─── Win Probability Cards ──────────────────────────────────
.probability-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-left: 4px solid;
  border-radius: 14px;
  padding: 1.25rem;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(120, 73, 255, 0.1);
  }
}

.deal-row {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-default);

  &:last-child {
    border-bottom: none;
  }
}

.deal-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.65rem;
  flex-shrink: 0;
}

// ─── Churn Table ────────────────────────────────────────────
.churn-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(120, 73, 255, 0.15);
  color: var(--accent-color, #7849ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.65rem;
  flex-shrink: 0;
}

// ─── Severity Cards ─────────────────────────────────────────
.severity-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(120, 73, 255, 0.1);
  }
}

.severity-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Recommendation Cards ───────────────────────────────────
.rec-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(120, 73, 255, 0.3);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.1);
  }
}

.rec-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rec-impact {
  padding: 12px;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.04);
  border: 1px solid var(--border-default);
}

.impact-item {
  padding: 4px 0;
}

// ─── Dialog Stat Box ────────────────────────────────────────
.stat-box {
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.04);
  border: 1px solid var(--border-default);
}

// ─── Responsive ─────────────────────────────────────────────
@media (max-width: 768px) {
  .probability-card {
    .deal-row {
      .flex {
        flex-wrap: wrap;
        gap: 4px;
      }
    }
  }

  .rec-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
