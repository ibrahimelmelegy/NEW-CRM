<template lang="pug">
.attribution-modeling-page.p-6(class="md:p-8")
  //- Page Header
  .header.mb-8
    .flex.items-center.justify-between.flex-wrap.gap-4
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)")
          Icon.mr-2.align-middle(name="ph:chart-scatter-bold" size="32" style="color: var(--accent-color, #7849ff)")
          | {{ $t('attributionModeling.title') }}
        p(style="color: var(--text-muted)") {{ $t('attributionModeling.subtitle') }}
      .flex.items-center.gap-3.flex-wrap
        el-select(
          v-model="selectedModel"
          :placeholder="$t('attributionModeling.selectModel')"
          style="width: 200px"
          @change="onModelChange"
        )
          el-option(
            v-for="model in attributionModels"
            :key="model.value"
            :label="model.label"
            :value="model.value"
          )
        el-date-picker(
          v-model="dateRange"
          type="daterange"
          range-separator="to"
          :start-placeholder="$t('common.startDate')"
          :end-placeholder="$t('common.endDate')"
          style="width: 300px"
        )
        el-button(type="primary" @click="refreshData")
          Icon(name="ph:arrow-clockwise-bold" size="16")
          span.ml-2 {{ $t('common.refresh') }}

  //- KPI Cards
  .grid.gap-4.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
    .kpi-card(v-for="(kpi, i) in kpiCards" :key="i")
      .flex.items-start.gap-3
        .kpi-icon-wrapper(:style="{ background: kpi.bgColor }")
          Icon(:name="kpi.icon" size="24" :style="{ color: kpi.iconColor }")
        div
          p.text-sm.font-medium(style="color: var(--text-muted)") {{ kpi.label }}
          p.text-2xl.font-bold.mt-1(:style="{ color: kpi.valueColor || 'var(--text-primary)' }") {{ kpi.value }}
          p.text-xs.mt-1(style="color: var(--text-secondary)")
            span(:style="{ color: kpi.changeColor }") {{ kpi.change }}
            |  {{ $t('attributionModeling.vsPreviousPeriod') }}

  //- Tabs
  el-tabs(v-model="activeTab" type="border-card")
    //- ═══════════════════════════════════════════════════
    //- Tab 1: Channel Performance
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('attributionModeling.channelPerformance')" name="channels")
      .glass-card.p-6
        .flex.items-center.justify-between.mb-6
          h3.section-title
            Icon.mr-2(name="ph:broadcast-bold" size="22" style="color: #3b82f6")
            | {{ $t('attributionModeling.channelPerformance') }}
          el-tooltip(:content="$t('attributionModeling.channelTooltip')" placement="top")
            Icon(name="ph:info-bold" size="18" style="color: var(--text-muted); cursor: help")

        el-table(:data="channelData" stripe style="width: 100%" :default-sort="{ prop: 'revenue', order: 'descending' }")
          el-table-column(prop="channel" :label="$t('attributionModeling.channel')" min-width="160")
            template(#default="scope")
              .flex.items-center.gap-3
                .channel-dot(:style="{ background: scope.row.color }")
                span.font-medium {{ scope.row.channel }}

          el-table-column(:label="$t('attributionModeling.attributedRevenue')" prop="revenue" min-width="160" sortable)
            template(#default="scope")
              span.font-bold(style="color: #22c55e") {{ formatCurrency(scope.row.revenue) }}

          el-table-column(:label="$t('attributionModeling.dealsInfluenced')" prop="deals" min-width="140" sortable align="center")
            template(#default="scope")
              el-tag(size="small" type="primary" effect="plain") {{ scope.row.deals }}

          el-table-column(:label="$t('attributionModeling.conversionRate')" prop="conversionRate" min-width="140" sortable align="center")
            template(#default="scope")
              .flex.items-center.justify-center.gap-2
                el-progress(
                  type="circle"
                  :percentage="scope.row.conversionRate"
                  :width="40"
                  :stroke-width="4"
                  :color="scope.row.conversionRate >= 10 ? '#22c55e' : scope.row.conversionRate >= 5 ? '#f59e0b' : '#ef4444'"
                )

          el-table-column(:label="$t('attributionModeling.roi')" prop="roi" min-width="120" sortable align="center")
            template(#default="scope")
              span.font-bold(:style="{ color: scope.row.roi >= 3 ? '#22c55e' : scope.row.roi >= 1 ? '#f59e0b' : '#ef4444' }") {{ scope.row.roi.toFixed(1) }}x

          el-table-column(:label="$t('attributionModeling.revenueShare')" min-width="200")
            template(#default="scope")
              .flex.items-center.gap-3
                el-progress(
                  :percentage="scope.row.sharePercent"
                  :stroke-width="10"
                  :color="scope.row.color"
                  style="flex: 1"
                )
                span.text-xs.font-bold.whitespace-nowrap(style="color: var(--text-secondary)") {{ scope.row.sharePercent }}%

    //- ═══════════════════════════════════════════════════
    //- Tab 2: Campaign Attribution
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('attributionModeling.campaignAttribution')" name="campaigns")
      .glass-card.p-6
        .flex.items-center.justify-between.mb-6
          h3.section-title
            Icon.mr-2(name="ph:megaphone-bold" size="22" style="color: #f59e0b")
            | {{ $t('attributionModeling.campaignAttribution') }}
          el-button(size="small" @click="exportCampaigns")
            Icon(name="ph:download-simple-bold" size="14")
            span.ml-1 {{ $t('attributionModeling.export') }}

        el-table(
          :data="campaignData"
          stripe
          style="width: 100%"
          :default-sort="{ prop: 'multiTouchCredit', order: 'descending' }"
          @row-click="openCampaignDetail"
          row-class-name="clickable-row"
        )
          el-table-column(prop="name" :label="$t('attributionModeling.campaignName')" min-width="200")
            template(#default="scope")
              .flex.items-center.gap-2
                span.font-medium {{ scope.row.name }}
                el-tag(size="small" :type="getStatusType(scope.row.status)" effect="light") {{ scope.row.status }}

          el-table-column(:label="$t('attributionModeling.multiTouchCredit')" prop="multiTouchCredit" min-width="160" sortable)
            template(#default="scope")
              span.font-bold(style="color: #7849ff") {{ formatCurrency(scope.row.multiTouchCredit) }}

          el-table-column(:label="$t('attributionModeling.firstTouchCredit')" prop="firstTouchCredit" min-width="160" sortable)
            template(#default="scope")
              span {{ formatCurrency(scope.row.firstTouchCredit) }}

          el-table-column(:label="$t('attributionModeling.lastTouchCredit')" prop="lastTouchCredit" min-width="160" sortable)
            template(#default="scope")
              span {{ formatCurrency(scope.row.lastTouchCredit) }}

          el-table-column(:label="$t('attributionModeling.pipelineInfluence')" prop="pipelineInfluence" min-width="160" sortable)
            template(#default="scope")
              span(style="color: #3b82f6") {{ formatCurrency(scope.row.pipelineInfluence) }}

          el-table-column(:label="$t('attributionModeling.touchpoints')" prop="touchpoints" min-width="120" align="center" sortable)
            template(#default="scope")
              el-tag(size="small" effect="plain") {{ scope.row.touchpoints }}

    //- ═══════════════════════════════════════════════════
    //- Tab 3: Customer Journey
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('attributionModeling.customerJourney')" name="journey")
      .glass-card.p-6
        .flex.items-center.justify-between.mb-6
          h3.section-title
            Icon.mr-2(name="ph:path-bold" size="22" style="color: #06b6d4")
            | {{ $t('attributionModeling.customerJourney') }}
          .flex.items-center.gap-2
            span.text-sm(style="color: var(--text-muted)") {{ $t('attributionModeling.totalJourneys') }}:
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ totalJourneys.toLocaleString() }}

        //- Funnel Visualization
        .journey-funnel.mb-8
          .funnel-step(
            v-for="(step, idx) in journeyStages"
            :key="step.key"
          )
            .funnel-bar-wrapper
              .funnel-bar(
                :style="{ width: step.widthPercent + '%', background: step.gradient }"
              )
                .funnel-bar-content
                  span.funnel-label {{ step.label }}
                  span.funnel-count {{ step.count.toLocaleString() }}
            .funnel-meta
              .flex.items-center.gap-4
                span.text-sm(style="color: var(--text-secondary)")
                  | {{ step.percent }}% {{ $t('attributionModeling.ofTotal') }}
                template(v-if="idx > 0")
                  .flex.items-center.gap-1
                    Icon(name="ph:arrow-down-bold" size="12" style="color: #ef4444")
                    span.text-xs(style="color: #ef4444") {{ step.dropOff }}% {{ $t('attributionModeling.dropOff') }}
                  span.text-xs(style="color: var(--text-muted)")
                    | {{ $t('attributionModeling.avgTime') }}: {{ step.avgDays }} {{ $t('attributionModeling.days') }}

            //- Connector arrow between stages
            .funnel-connector(v-if="idx < journeyStages.length - 1")
              Icon(name="ph:caret-down-bold" size="20" style="color: var(--text-muted)")

        //- Top Touchpoint Paths
        .mt-8
          h4.text-base.font-semibold.mb-4(style="color: var(--text-primary)") {{ $t('attributionModeling.topPaths') }}
          .path-card(v-for="(path, idx) in topPaths" :key="idx")
            .flex.items-center.justify-between
              .flex.items-center.gap-2.flex-wrap
                template(v-for="(touchpoint, tIdx) in path.steps" :key="tIdx")
                  el-tag(size="small" :type="getChannelTagType(touchpoint)" effect="plain") {{ touchpoint }}
                  Icon(v-if="tIdx < path.steps.length - 1" name="ph:arrow-right-bold" size="12" style="color: var(--text-muted)")
              .text-right
                span.font-bold(style="color: #22c55e") {{ formatCurrency(path.revenue) }}
                p.text-xs(style="color: var(--text-muted)") {{ path.conversions }} {{ $t('attributionModeling.conversions') }}

    //- ═══════════════════════════════════════════════════
    //- Tab 4: Model Comparison
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('attributionModeling.modelComparison')" name="comparison")
      .glass-card.p-6
        .flex.items-center.justify-between.mb-6
          h3.section-title
            Icon.mr-2(name="ph:scales-bold" size="22" style="color: #ec4899")
            | {{ $t('attributionModeling.modelComparison') }}
          el-tooltip(:content="$t('attributionModeling.comparisonTooltip')" placement="top")
            Icon(name="ph:info-bold" size="18" style="color: var(--text-muted); cursor: help")

        .comparison-info.mb-6
          Icon(name="ph:lightbulb-bold" size="16" style="color: #f59e0b")
          span.text-sm.ml-2(style="color: var(--text-secondary)") {{ $t('attributionModeling.comparisonHint') }}

        el-table(:data="comparisonData" stripe style="width: 100%")
          el-table-column(prop="channel" :label="$t('attributionModeling.channel')" min-width="140" fixed)
            template(#default="scope")
              .flex.items-center.gap-2
                .channel-dot(:style="{ background: scope.row.color }")
                span.font-medium {{ scope.row.channel }}

          el-table-column(:label="$t('attributionModeling.firstTouch')" min-width="140" align="center")
            template(#default="scope")
              .model-cell
                span.model-value {{ scope.row.firstTouch }}%
                .model-bar(:style="{ width: scope.row.firstTouch + '%', background: '#7849ff' }")

          el-table-column(:label="$t('attributionModeling.lastTouch')" min-width="140" align="center")
            template(#default="scope")
              .model-cell
                span.model-value {{ scope.row.lastTouch }}%
                .model-bar(:style="{ width: scope.row.lastTouch + '%', background: '#3b82f6' }")

          el-table-column(:label="$t('attributionModeling.linear')" min-width="140" align="center")
            template(#default="scope")
              .model-cell
                span.model-value {{ scope.row.linear }}%
                .model-bar(:style="{ width: scope.row.linear + '%', background: '#06b6d4' }")

          el-table-column(:label="$t('attributionModeling.timeDecay')" min-width="140" align="center")
            template(#default="scope")
              .model-cell
                span.model-value {{ scope.row.timeDecay }}%
                .model-bar(:style="{ width: scope.row.timeDecay + '%', background: '#f59e0b' }")

          el-table-column(:label="$t('attributionModeling.uShaped')" min-width="140" align="center")
            template(#default="scope")
              .model-cell
                span.model-value {{ scope.row.uShaped }}%
                .model-bar(:style="{ width: scope.row.uShaped + '%', background: '#22c55e' }")

        //- Model legend
        .model-legend.mt-6
          .legend-item(v-for="model in modelLegend" :key="model.key")
            .legend-dot(:style="{ background: model.color }")
            .legend-text
              span.font-medium {{ model.name }}
              p.text-xs(style="color: var(--text-muted)") {{ model.description }}

  //- ═══════════════════════════════════════════════════
  //- Campaign Detail Dialog
  //- ═══════════════════════════════════════════════════
  el-dialog(
    v-model="showCampaignDetail"
    :title="selectedCampaign?.name || ''"
    width="70%"
    top="5vh"
  )
    template(v-if="selectedCampaign")
      //- Campaign KPIs
      .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
        .detail-kpi(v-for="(kpi, i) in campaignDetailKpis" :key="i")
          p.text-xs.font-medium(style="color: var(--text-muted)") {{ kpi.label }}
          p.text-lg.font-bold(:style="{ color: kpi.color || 'var(--text-primary)' }") {{ kpi.value }}

      //- Touchpoint Timeline
      h4.text-sm.font-semibold.uppercase.mb-4(style="color: var(--text-muted)") {{ $t('attributionModeling.touchpointTimeline') }}
      .timeline-wrapper
        .timeline-item(v-for="(tp, idx) in selectedCampaign.timeline" :key="idx")
          .timeline-dot(:style="{ background: tp.color }")
          .timeline-content
            .flex.items-center.justify-between
              span.font-medium(style="color: var(--text-primary)") {{ tp.channel }}
              span.text-xs(style="color: var(--text-muted)") {{ tp.date }}
            p.text-sm.mt-1(style="color: var(--text-secondary)") {{ tp.action }}
            .flex.items-center.gap-4.mt-2
              span.text-xs(style="color: var(--text-muted)")
                | {{ $t('attributionModeling.credit') }}:
                span.font-bold(:style="{ color: '#7849ff' }") {{ tp.creditPercent }}%
              span.text-xs(style="color: var(--text-muted)")
                | {{ $t('attributionModeling.revenue') }}:
                span.font-bold(:style="{ color: '#22c55e' }") {{ formatCurrency(tp.revenue) }}

      //- Influenced Deals Table
      h4.text-sm.font-semibold.uppercase.mt-6.mb-4(style="color: var(--text-muted)") {{ $t('attributionModeling.influencedDeals') }}
      el-table(:data="selectedCampaign.deals" stripe max-height="300")
        el-table-column(prop="dealName" :label="$t('attributionModeling.dealName')" min-width="180")
        el-table-column(:label="$t('attributionModeling.dealValue')" min-width="130")
          template(#default="scope")
            span.font-bold(style="color: #22c55e") {{ formatCurrency(scope.row.dealValue) }}
        el-table-column(prop="stage" :label="$t('attributionModeling.stage')" min-width="120")
          template(#default="scope")
            el-tag(size="small" :type="getStageType(scope.row.stage)") {{ scope.row.stage }}
        el-table-column(prop="touchCount" :label="$t('attributionModeling.touches')" min-width="100" align="center")
        el-table-column(:label="$t('attributionModeling.attributedValue')" min-width="150")
          template(#default="scope")
            span.font-bold(style="color: #7849ff") {{ formatCurrency(scope.row.attributedValue) }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Attribution Modeling' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const selectedModel = ref('linear');
const dateRange = ref<[Date, Date] | null>(null);
const activeTab = ref('channels');
const showCampaignDetail = ref(false);
const selectedCampaign = ref<any>(null);
const loading = ref(false);

// ─── Attribution Models ─────────────────────────────────────
const attributionModels = computed(() => [
  { value: 'first_touch', label: t('attributionModeling.firstTouch') },
  { value: 'last_touch', label: t('attributionModeling.lastTouch') },
  { value: 'linear', label: t('attributionModeling.linear') },
  { value: 'time_decay', label: t('attributionModeling.timeDecay') },
  { value: 'u_shaped', label: t('attributionModeling.uShaped') }
]);

// ─── Model Weight Multipliers ───────────────────────────────
// Each model emphasizes different channels differently
const modelWeights: Record<string, Record<string, number>> = {
  first_touch: {
    'Paid Search': 1.4,
    'Social Media': 1.3,
    'Organic Search': 1.2,
    Email: 0.7,
    Referral: 0.9,
    Direct: 0.8,
    Events: 1.1
  },
  last_touch: {
    'Paid Search': 0.9,
    'Social Media': 0.7,
    'Organic Search': 0.8,
    Email: 1.4,
    Referral: 1.3,
    Direct: 1.5,
    Events: 0.8
  },
  linear: {
    'Paid Search': 1.0,
    'Social Media': 1.0,
    'Organic Search': 1.0,
    Email: 1.0,
    Referral: 1.0,
    Direct: 1.0,
    Events: 1.0
  },
  time_decay: {
    'Paid Search': 0.85,
    'Social Media': 0.75,
    'Organic Search': 0.8,
    Email: 1.3,
    Referral: 1.2,
    Direct: 1.35,
    Events: 0.9
  },
  u_shaped: {
    'Paid Search': 1.3,
    'Social Media': 1.2,
    'Organic Search': 0.8,
    Email: 1.25,
    Referral: 0.85,
    Direct: 1.3,
    Events: 0.7
  }
};

// ─── Base Channel Data ──────────────────────────────────────
const mockBaseChannels = [
  { channel: 'Paid Search', baseRevenue: 482000, deals: 67, conversionRate: 12.4, roi: 4.2, color: '#7849ff' },
  { channel: 'Email', baseRevenue: 395000, deals: 54, conversionRate: 9.8, roi: 6.1, color: '#3b82f6' },
  { channel: 'Organic Search', baseRevenue: 328000, deals: 48, conversionRate: 7.2, roi: 8.5, color: '#22c55e' },
  { channel: 'Social Media', baseRevenue: 275000, deals: 41, conversionRate: 5.6, roi: 3.4, color: '#06b6d4' },
  { channel: 'Referral', baseRevenue: 246000, deals: 35, conversionRate: 14.8, roi: 9.2, color: '#f59e0b' },
  { channel: 'Direct', baseRevenue: 198000, deals: 29, conversionRate: 11.3, roi: 7.8, color: '#ec4899' },
  { channel: 'Events', baseRevenue: 164000, deals: 22, conversionRate: 8.9, roi: 2.8, color: '#f97316' }
];

const baseChannels = ref<any[]>(mockBaseChannels);

// ─── Computed Channel Data ──────────────────────────────────
const channelData = computed(() => {
  const weights = modelWeights[selectedModel.value] || modelWeights.linear;
  const channels = baseChannels.value.map(ch => {
    const weight = weights![ch.channel] || 1.0;
    const revenue = Math.round(ch.baseRevenue * weight);
    return {
      ...ch,
      revenue,
      conversionRate: Math.round(ch.conversionRate * weight * 10) / 10,
      roi: Math.round(ch.roi * weight * 10) / 10
    };
  });

  const totalRevenue = channels.reduce((sum, ch) => sum + ch.revenue, 0);
  return channels.map(ch => ({
    ...ch,
    sharePercent: totalRevenue > 0 ? Math.round((ch.revenue / totalRevenue) * 100) : 0
  }));
});

// ─── Base Campaign Data ─────────────────────────────────────
const baseCampaigns = [
  {
    name: 'Spring Product Launch 2026',
    status: 'Active',
    baseMultiTouch: 245000,
    baseFirstTouch: 180000,
    baseLastTouch: 210000,
    pipelineInfluence: 520000,
    touchpoints: 847
  },
  {
    name: 'Enterprise Outreach Q1',
    status: 'Active',
    baseMultiTouch: 198000,
    baseFirstTouch: 145000,
    baseLastTouch: 175000,
    pipelineInfluence: 430000,
    touchpoints: 623
  },
  {
    name: 'Webinar Series: AI in CRM',
    status: 'Active',
    baseMultiTouch: 172000,
    baseFirstTouch: 132000,
    baseLastTouch: 148000,
    pipelineInfluence: 380000,
    touchpoints: 512
  },
  {
    name: 'Partner Co-Marketing Drive',
    status: 'Active',
    baseMultiTouch: 156000,
    baseFirstTouch: 118000,
    baseLastTouch: 134000,
    pipelineInfluence: 340000,
    touchpoints: 445
  },
  {
    name: 'LinkedIn ABM Campaign',
    status: 'Active',
    baseMultiTouch: 134000,
    baseFirstTouch: 95000,
    baseLastTouch: 120000,
    pipelineInfluence: 295000,
    touchpoints: 378
  },
  {
    name: 'Email Nurture: Decision Makers',
    status: 'Completed',
    baseMultiTouch: 128000,
    baseFirstTouch: 82000,
    baseLastTouch: 145000,
    pipelineInfluence: 268000,
    touchpoints: 934
  },
  {
    name: 'Trade Show: TechSummit 2026',
    status: 'Completed',
    baseMultiTouch: 115000,
    baseFirstTouch: 142000,
    baseLastTouch: 78000,
    pipelineInfluence: 245000,
    touchpoints: 289
  },
  {
    name: 'Content Syndication Program',
    status: 'Active',
    baseMultiTouch: 98000,
    baseFirstTouch: 115000,
    baseLastTouch: 72000,
    pipelineInfluence: 210000,
    touchpoints: 567
  },
  {
    name: 'Retargeting: Website Visitors',
    status: 'Paused',
    baseMultiTouch: 87000,
    baseFirstTouch: 45000,
    baseLastTouch: 95000,
    pipelineInfluence: 185000,
    touchpoints: 1240
  },
  {
    name: 'Customer Referral Program',
    status: 'Active',
    baseMultiTouch: 76000,
    baseFirstTouch: 68000,
    baseLastTouch: 82000,
    pipelineInfluence: 160000,
    touchpoints: 198
  }
];

// ─── Campaign model-adjusted multipliers ────────────────────
const campaignModelMultipliers: Record<string, { multi: number; first: number; last: number }> = {
  first_touch: { multi: 0.85, first: 1.4, last: 0.7 },
  last_touch: { multi: 0.85, first: 0.7, last: 1.4 },
  linear: { multi: 1.0, first: 1.0, last: 1.0 },
  time_decay: { multi: 1.05, first: 0.8, last: 1.25 },
  u_shaped: { multi: 1.1, first: 1.2, last: 1.2 }
};

const campaignData = computed(() => {
  const mult = campaignModelMultipliers[selectedModel.value] || campaignModelMultipliers.linear;
  return baseCampaigns.map(c => ({
    ...c,
    multiTouchCredit: Math.round(c.baseMultiTouch * mult!.multi),
    firstTouchCredit: Math.round(c.baseFirstTouch * mult!.first),
    lastTouchCredit: Math.round(c.baseLastTouch * mult!.last)
  }));
});

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => {
  const totalRevenue = channelData.value.reduce((sum, ch) => sum + ch.revenue, 0);
  const totalDeals = channelData.value.reduce((sum, ch) => sum + ch.deals, 0);
  const avgConversion =
    channelData.value.length > 0 ? channelData.value.reduce((sum, ch) => sum + ch.conversionRate, 0) / channelData.value.length : 0;
  const avgTouchpoints = 4.7;

  return [
    {
      label: t('attributionModeling.totalRevenueAttributed'),
      value: formatCurrency(totalRevenue),
      change: '+18.3%',
      changeColor: '#22c55e',
      icon: 'ph:currency-dollar-bold',
      iconColor: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.12)',
      valueColor: '#22c55e'
    },
    {
      label: t('attributionModeling.campaignsTracked'),
      value: baseCampaigns.length.toString(),
      change: '+2',
      changeColor: '#3b82f6',
      icon: 'ph:megaphone-bold',
      iconColor: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.12)'
    },
    {
      label: t('attributionModeling.overallConversionRate'),
      value: avgConversion.toFixed(1) + '%',
      change: '+1.2%',
      changeColor: '#22c55e',
      icon: 'ph:chart-line-up-bold',
      iconColor: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)'
    },
    {
      label: t('attributionModeling.avgTouchpointsPerDeal'),
      value: avgTouchpoints.toFixed(1),
      change: '-0.3',
      changeColor: '#22c55e',
      icon: 'ph:hand-tap-bold',
      iconColor: '#7849ff',
      bgColor: 'rgba(120, 73, 255, 0.12)'
    }
  ];
});

// ─── Customer Journey ───────────────────────────────────────
const totalJourneys = ref(3248);

const journeyStages = computed(() => {
  const stages = [
    { key: 'awareness', label: t('attributionModeling.awareness'), count: 3248, color: '#7849ff', avgDays: 0 },
    { key: 'interest', label: t('attributionModeling.interest'), count: 2156, color: '#3b82f6', avgDays: 8 },
    { key: 'consideration', label: t('attributionModeling.consideration'), count: 1284, color: '#06b6d4', avgDays: 14 },
    { key: 'decision', label: t('attributionModeling.decision'), count: 524, color: '#f59e0b', avgDays: 21 },
    { key: 'purchase', label: t('attributionModeling.purchase'), count: 296, color: '#22c55e', avgDays: 32 }
  ];

  const total = stages[0]!.count;
  return stages.map((stage, idx) => {
    const percent = Math.round((stage.count / total) * 100);
    const prevCount = idx > 0 ? stages[idx - 1]!.count : stage.count;
    const dropOff = idx > 0 ? Math.round(((prevCount - stage.count) / prevCount) * 100) : 0;
    return {
      ...stage,
      percent,
      widthPercent: Math.max(percent, 12),
      dropOff,
      gradient: `linear-gradient(135deg, ${stage.color}, ${stage.color}dd)`
    };
  });
});

// ─── Top Conversion Paths ───────────────────────────────────
const mockTopPaths = [
  { steps: ['Organic Search', 'Email', 'Direct'], revenue: 187000, conversions: 28 },
  { steps: ['Paid Search', 'Referral', 'Email', 'Direct'], revenue: 156000, conversions: 22 },
  { steps: ['Social Media', 'Email', 'Email', 'Direct'], revenue: 134000, conversions: 19 },
  { steps: ['Events', 'Email', 'Paid Search', 'Direct'], revenue: 112000, conversions: 15 },
  { steps: ['Referral', 'Direct'], revenue: 98000, conversions: 14 }
];

const topPaths = ref<any[]>([]);

// ─── Model Comparison Data ──────────────────────────────────
const comparisonData = computed(() => [
  { channel: 'Paid Search', color: '#7849ff', firstTouch: 28, lastTouch: 18, linear: 22, timeDecay: 20, uShaped: 26 },
  { channel: 'Email', color: '#3b82f6', firstTouch: 12, lastTouch: 26, linear: 19, timeDecay: 23, uShaped: 18 },
  { channel: 'Organic Search', color: '#22c55e', firstTouch: 22, lastTouch: 14, linear: 16, timeDecay: 15, uShaped: 14 },
  { channel: 'Social Media', color: '#06b6d4', firstTouch: 18, lastTouch: 8, linear: 13, timeDecay: 10, uShaped: 15 },
  { channel: 'Referral', color: '#f59e0b', firstTouch: 8, lastTouch: 16, linear: 12, timeDecay: 14, uShaped: 10 },
  { channel: 'Direct', color: '#ec4899', firstTouch: 5, lastTouch: 14, linear: 10, timeDecay: 12, uShaped: 11 },
  { channel: 'Events', color: '#f97316', firstTouch: 7, lastTouch: 4, linear: 8, timeDecay: 6, uShaped: 6 }
]);

// ─── Model Legend ───────────────────────────────────────────
const modelLegend = computed(() => [
  { key: 'first', name: t('attributionModeling.firstTouch'), color: '#7849ff', description: t('attributionModeling.firstTouchDesc') },
  { key: 'last', name: t('attributionModeling.lastTouch'), color: '#3b82f6', description: t('attributionModeling.lastTouchDesc') },
  { key: 'linear', name: t('attributionModeling.linear'), color: '#06b6d4', description: t('attributionModeling.linearDesc') },
  { key: 'decay', name: t('attributionModeling.timeDecay'), color: '#f59e0b', description: t('attributionModeling.timeDecayDesc') },
  { key: 'u', name: t('attributionModeling.uShaped'), color: '#22c55e', description: t('attributionModeling.uShapedDesc') }
]);

// ─── Campaign Detail ────────────────────────────────────────
const campaignDetailKpis = computed(() => {
  if (!selectedCampaign.value) return [];
  const c = selectedCampaign.value;
  return [
    { label: t('attributionModeling.multiTouchCredit'), value: formatCurrency(c.multiTouchCredit), color: '#7849ff' },
    { label: t('attributionModeling.firstTouchCredit'), value: formatCurrency(c.firstTouchCredit), color: '#3b82f6' },
    { label: t('attributionModeling.lastTouchCredit'), value: formatCurrency(c.lastTouchCredit), color: '#f59e0b' },
    { label: t('attributionModeling.pipelineInfluence'), value: formatCurrency(c.pipelineInfluence), color: '#22c55e' }
  ];
});

// ─── Campaign detail timelines and deals ────────────────────
const campaignTimelines: Record<string, any[]> = {
  'Spring Product Launch 2026': [
    {
      channel: 'Paid Search',
      date: 'Jan 15, 2026',
      action: 'Ad click: "New CRM Features 2026"',
      creditPercent: 25,
      revenue: 61250,
      color: '#7849ff'
    },
    { channel: 'Email', date: 'Jan 22, 2026', action: 'Opened launch announcement email', creditPercent: 15, revenue: 36750, color: '#3b82f6' },
    { channel: 'Organic Search', date: 'Feb 3, 2026', action: 'Blog visit: "Top CRM Trends"', creditPercent: 10, revenue: 24500, color: '#22c55e' },
    { channel: 'Email', date: 'Feb 10, 2026', action: 'Clicked demo CTA in nurture sequence', creditPercent: 20, revenue: 49000, color: '#3b82f6' },
    { channel: 'Direct', date: 'Feb 18, 2026', action: 'Scheduled and attended demo', creditPercent: 30, revenue: 73500, color: '#ec4899' }
  ],
  'Enterprise Outreach Q1': [
    { channel: 'Events', date: 'Jan 8, 2026', action: 'Attended virtual roundtable', creditPercent: 20, revenue: 39600, color: '#f97316' },
    { channel: 'Email', date: 'Jan 18, 2026', action: 'Follow-up email with case study', creditPercent: 15, revenue: 29700, color: '#3b82f6' },
    { channel: 'Social Media', date: 'Feb 1, 2026', action: 'LinkedIn ad engagement', creditPercent: 10, revenue: 19800, color: '#06b6d4' },
    { channel: 'Referral', date: 'Feb 12, 2026', action: 'Partner referral introduction', creditPercent: 25, revenue: 49500, color: '#f59e0b' },
    { channel: 'Direct', date: 'Feb 25, 2026', action: 'Contract negotiation and close', creditPercent: 30, revenue: 59400, color: '#ec4899' }
  ]
};

const campaignDeals: Record<string, any[]> = {
  'Spring Product Launch 2026': [
    { dealName: 'Acme Corp Expansion', dealValue: 85000, stage: 'Won', touchCount: 7, attributedValue: 42500 },
    { dealName: 'TechFlow Solutions', dealValue: 62000, stage: 'Won', touchCount: 5, attributedValue: 31000 },
    { dealName: 'Global Industries Upgrade', dealValue: 48000, stage: 'Negotiation', touchCount: 4, attributedValue: 24000 },
    { dealName: 'DataBridge Inc.', dealValue: 35000, stage: 'Proposal', touchCount: 3, attributedValue: 17500 },
    { dealName: 'CloudFirst Technologies', dealValue: 28000, stage: 'Won', touchCount: 6, attributedValue: 14000 }
  ],
  'Enterprise Outreach Q1': [
    { dealName: 'MegaCorp Strategic Deal', dealValue: 120000, stage: 'Won', touchCount: 9, attributedValue: 60000 },
    { dealName: 'Pinnacle Group', dealValue: 78000, stage: 'Won', touchCount: 6, attributedValue: 39000 },
    { dealName: 'Apex Dynamics', dealValue: 55000, stage: 'Negotiation', touchCount: 5, attributedValue: 27500 },
    { dealName: 'Summit Partners', dealValue: 42000, stage: 'Proposal', touchCount: 4, attributedValue: 21000 }
  ]
};

// Default timeline/deals for campaigns that don't have specific data
const defaultTimeline = [
  { channel: 'Paid Search', date: 'Jan 20, 2026', action: 'Initial ad click', creditPercent: 20, revenue: 18000, color: '#7849ff' },
  { channel: 'Email', date: 'Feb 5, 2026', action: 'Newsletter engagement', creditPercent: 25, revenue: 22500, color: '#3b82f6' },
  { channel: 'Organic Search', date: 'Feb 15, 2026', action: 'Content discovery', creditPercent: 15, revenue: 13500, color: '#22c55e' },
  { channel: 'Direct', date: 'Feb 28, 2026', action: 'Sales meeting', creditPercent: 40, revenue: 36000, color: '#ec4899' }
];

const defaultDeals = [
  { dealName: 'Standard Deal A', dealValue: 45000, stage: 'Won', touchCount: 4, attributedValue: 22500 },
  { dealName: 'Standard Deal B', dealValue: 32000, stage: 'Negotiation', touchCount: 3, attributedValue: 16000 },
  { dealName: 'Standard Deal C', dealValue: 28000, stage: 'Proposal', touchCount: 5, attributedValue: 14000 }
];

// ─── Channel Color Map ──────────────────────────────────────
const channelColors: Record<string, string> = {
  'Paid Search': '#7849ff',
  Email: '#3b82f6',
  'Organic Search': '#22c55e',
  'Social Media': '#06b6d4',
  Referral: '#f59e0b',
  Direct: '#ec4899',
  Events: '#f97316'
};

// ─── Data Loading ───────────────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    // Fetch attribution and channels in parallel
    const [touchpointsRes, channelsRes] = await Promise.all([
      useApiFetch('attribution' as any).catch(() => null),
      useApiFetch('attribution/channels' as any).catch(() => null)
    ]);

    // ── Channel performance from GET /attribution/channels ──
    if (channelsRes?.success && channelsRes.body) {
      const channelList = Array.isArray(channelsRes.body)
        ? channelsRes.body
        : Array.isArray((channelsRes.body as any)?.channels)
          ? (channelsRes.body as any).channels
          : Array.isArray((channelsRes.body as any)?.docs)
            ? (channelsRes.body as any).docs
            : null;

      if (channelList && channelList.length > 0) {
        baseChannels.value = channelList.map((ch: any) => ({
          channel: ch.channel || ch.name || 'Unknown',
          baseRevenue: parseFloat(ch.baseRevenue || ch.revenue || ch.attributedRevenue || 0),
          deals: parseInt(ch.deals || ch.dealsInfluenced || 0),
          conversionRate: parseFloat(ch.conversionRate || 0),
          roi: parseFloat(ch.roi || 0),
          color: ch.color || channelColors[ch.channel || ch.name] || '#7849ff'
        }));
      } else {
        baseChannels.value = mockBaseChannels;
      }
    } else {
      baseChannels.value = mockBaseChannels;
    }

    // ── Top paths from GET /attribution touchpoints ──
    if (touchpointsRes?.success && touchpointsRes.body) {
      const docs = Array.isArray(touchpointsRes.body)
        ? touchpointsRes.body
        : Array.isArray((touchpointsRes.body as any)?.docs)
          ? (touchpointsRes.body as any).docs
          : Array.isArray((touchpointsRes.body as any)?.paths)
            ? (touchpointsRes.body as any).paths
            : null;

      if (docs && docs.length > 0) {
        // Try to extract path data from touchpoints
        const pathsFromApi = docs
          .filter((d: any) => d.steps || d.path || d.touchpoints)
          .map((d: any) => ({
            steps: d.steps || d.path || d.touchpoints || [],
            revenue: parseFloat(d.revenue || d.attributedRevenue || 0),
            conversions: parseInt(d.conversions || d.conversionCount || 0)
          }));

        if (pathsFromApi.length > 0) {
          topPaths.value = pathsFromApi;
        } else {
          topPaths.value = mockTopPaths;
        }
      } else {
        topPaths.value = mockTopPaths;
      }
    } else {
      topPaths.value = mockTopPaths;
    }
  } catch (e) {
    console.error('Failed to load attribution data, using mock data', e);
    baseChannels.value = mockBaseChannels;
    topPaths.value = mockTopPaths;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

// ─── Actions ────────────────────────────────────────────────
function onModelChange() {
  // Reactive computed properties handle the recalculation
}

function refreshData() {
  loadData();
}

function exportCampaigns() {
  // In a real app, this would trigger a CSV/Excel export
}

function openCampaignDetail(row: any) {
  const timeline = campaignTimelines[row.name] || defaultTimeline;
  const deals = campaignDeals[row.name] || defaultDeals;
  selectedCampaign.value = {
    ...row,
    timeline,
    deals
  };
  showCampaignDetail.value = true;
}

// ─── Helpers ────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function getStatusType(status: string): string {
  const map: Record<string, string> = {
    Active: 'success',
    Completed: 'info',
    Paused: 'warning',
    Draft: ''
  };
  return map[status] || '';
}

function getStageType(stage: string): string {
  const map: Record<string, string> = {
    Won: 'success',
    Negotiation: 'warning',
    Proposal: '',
    Qualified: 'info',
    Lost: 'danger'
  };
  return map[stage] || '';
}

function getChannelTagType(channel: string): string {
  const map: Record<string, string> = {
    'Paid Search': '',
    Email: 'success',
    'Organic Search': 'info',
    'Social Media': 'warning',
    Referral: 'danger',
    Direct: '',
    Events: 'warning'
  };
  return map[channel] || '';
}
</script>

<style lang="scss" scoped>
.attribution-modeling-page {
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
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Channel Dot ────────────────────────────────────────────
.channel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

// ─── Clickable Row ──────────────────────────────────────────
:deep(.clickable-row) {
  cursor: pointer;

  &:hover {
    td {
      background: rgba(120, 73, 255, 0.04) !important;
    }
  }
}

// ─── Journey Funnel ─────────────────────────────────────────
.journey-funnel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.funnel-step {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.funnel-bar-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.funnel-bar {
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s ease;
  min-width: 120px;

  &:hover {
    filter: brightness(1.1);
    transform: scaleX(1.02);
  }
}

.funnel-bar-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
}

.funnel-label {
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
}

.funnel-count {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
  font-size: 1.1rem;
}

.funnel-meta {
  margin-top: 4px;
  margin-bottom: 4px;
}

.funnel-connector {
  opacity: 0.4;
  margin: -2px 0;
}

// ─── Path Cards ─────────────────────────────────────────────
.path-card {
  padding: 14px 18px;
  border-radius: 10px;
  border: 1px solid var(--border-default);
  background: var(--bg-elevated);
  margin-bottom: 8px;
  transition: all 0.25s ease;

  &:hover {
    border-color: rgba(120, 73, 255, 0.3);
    background: rgba(120, 73, 255, 0.03);
  }
}

// ─── Model Comparison ───────────────────────────────────────
.model-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.model-value {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.model-bar {
  height: 6px;
  border-radius: 3px;
  max-width: 100%;
  transition: width 0.5s ease;
}

.comparison-info {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.15);
}

// ─── Model Legend ───────────────────────────────────────────
.model-legend {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.03);
  border: 1px solid var(--border-default);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.legend-text {
  color: var(--text-primary);
  font-size: 0.85rem;
}

// ─── Campaign Detail ────────────────────────────────────────
.detail-kpi {
  padding: 14px;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.04);
  border: 1px solid var(--border-default);
  text-align: center;
}

// ─── Timeline ───────────────────────────────────────────────
.timeline-wrapper {
  position: relative;
  padding-left: 24px;
  border-left: 2px solid var(--border-default);
}

.timeline-item {
  position: relative;
  padding: 12px 0 20px 20px;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: -29px;
  top: 16px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--bg-elevated);
}

.timeline-content {
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.03);
  border: 1px solid var(--border-default);
}

// ─── Tabs Override ──────────────────────────────────────────
:deep(.el-tabs--border-card) {
  border-radius: 12px;
  border-color: var(--border-default);
  background: var(--bg-elevated);
  overflow: hidden;
}

:deep(.el-tabs__header) {
  background: rgba(120, 73, 255, 0.03);
  border-bottom-color: var(--border-default);
}

:deep(.el-tabs__item.is-active) {
  color: #7849ff;
  font-weight: 600;
}

// ─── Responsive ─────────────────────────────────────────────
@media (max-width: 768px) {
  .model-legend {
    grid-template-columns: 1fr;
  }

  .funnel-bar {
    min-width: 80px;
    height: 44px;
  }

  .funnel-label {
    font-size: 0.75rem;
  }

  .funnel-count {
    font-size: 0.9rem;
  }
}
</style>
