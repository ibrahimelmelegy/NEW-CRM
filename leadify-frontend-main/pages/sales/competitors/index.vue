<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(:title="$t('competitors.title')" :subtitle="$t('competitors.subtitle')")
    template(#actions)
      el-button(type="primary" size="large" @click="openCreateDialog" class="premium-btn")
        Icon(name="ph:binoculars-bold" size="20")
        span.mx-1 {{ $t('competitors.add') }}

  StatCards(:stats="summaryStats")

  //- Market Share Analysis
  .glass-card.p-6.rounded-2xl.mb-6.animate-entrance(v-if="items.length > 0")
    .flex.items-center.gap-2.mb-4
      .w-8.h-8.rounded-xl.flex.items-center.justify-center(style="background: rgba(120,73,255,0.15)")
        Icon(name="ph:chart-pie-bold" size="16" style="color: #7849ff")
      h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('competitors.marketShare') }}
    div(ref="marketShareChartRef" style="height: 280px;")

  //- Threat Matrix Section
  .glass-card.p-6.rounded-2xl.mb-6.animate-entrance(v-if="threatMatrix.length")
    .flex.items-center.gap-2.mb-4
      .w-8.h-8.rounded-xl.flex.items-center.justify-center(style="background: rgba(239,68,68,0.15)")
        Icon(name="ph:shield-warning-bold" size="16" style="color: #ef4444")
      h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('competitors.threatMatrix') }}
    el-table(:data="threatMatrix" style="width: 100%" size="small")
      el-table-column(:label="$t('competitors.name')" min-width="160")
        template(#default="{ row }")
          span.font-bold {{ row.name || '—' }}
      el-table-column(:label="$t('competitors.threatLevel')" width="140" align="center")
        template(#default="{ row }")
          el-tag(:color="threatColor(row.threatLevel)" effect="dark" size="small" round style="border: none; color: #fff") {{ row.threatLevel }}
      el-table-column(:label="$t('competitors.winRate')" width="120" align="center")
        template(#default="{ row }")
          span.font-bold.text-green-500 {{ row.winRate != null ? row.winRate + '%' : '—' }}
      el-table-column(:label="$t('competitors.lossRate')" width="120" align="center")
        template(#default="{ row }")
          span.font-bold.text-red-500 {{ row.lossRate != null ? row.lossRate + '%' : '—' }}
      el-table-column(:label="$t('competitors.totalEngagements')" width="130" align="center")
        template(#default="{ row }")
          span.font-bold {{ row.totalEngagements ?? 0 }}
      template(#empty)
        el-empty(:description="$t('competitors.noThreatData')" :image-size="60")

  //- Pricing Comparison
  .glass-card.p-6.rounded-2xl.mb-6.animate-entrance(v-if="items.length > 0")
    .flex.items-center.justify-between.mb-4
      .flex.items-center.gap-2
        .w-8.h-8.rounded-xl.flex.items-center.justify-center(style="background: rgba(34,197,94,0.15)")
          Icon(name="ph:currency-dollar-bold" size="16" style="color: #22c55e")
        h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('competitors.pricingComparison') }}
      el-button(text size="small" @click="refreshPricing")
        Icon(name="ph:arrows-clockwise" size="14")
    el-table(:data="pricingData" style="width: 100%" size="small" stripe)
      el-table-column(:label="$t('competitors.name')" min-width="140")
        template(#default="{ row }")
          span.font-bold {{ row.name }}
      el-table-column(:label="$t('competitors.pricingModel')" width="140")
        template(#default="{ row }")
          el-tag(size="small" effect="plain") {{ row.pricingModel || 'N/A' }}
      el-table-column(:label="$t('competitors.basePrice')" width="120" align="center")
        template(#default="{ row }")
          span {{ row.basePrice ? '$' + row.basePrice : '—' }}
      el-table-column(:label="$t('competitors.enterprisePrice')" width="130" align="center")
        template(#default="{ row }")
          span {{ row.enterprisePrice ? '$' + row.enterprisePrice : '—' }}
      el-table-column(:label="$t('competitors.notes')" min-width="200" show-overflow-tooltip)
        template(#default="{ row }")
          span.text-sm {{ row.pricingNotes || '—' }}
      template(#empty)
        el-empty(:description="$t('common.noData')" :image-size="60")

  //- Feature Comparison Matrix
  .glass-card.p-6.rounded-2xl.mb-6.animate-entrance(v-if="items.length > 0")
    .flex.items-center.justify-between.mb-4
      .flex.items-center.gap-2
        .w-8.h-8.rounded-xl.flex.items-center.justify-center(style="background: rgba(59,130,246,0.15)")
          Icon(name="ph:list-checks-bold" size="16" style="color: #3b82f6")
        h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('competitors.featureComparison') }}
      el-button(text size="small" @click="showFeatureDialog = true")
        Icon(name="ph:pencil-simple" size="14")
        span.ml-1 {{ $t('common.edit') }}
    el-table(:data="featureComparisonData" style="width: 100%" size="small" stripe)
      el-table-column(:label="$t('competitors.feature')" min-width="160" fixed)
        template(#default="{ row }")
          span.font-semibold {{ row.feature }}
      el-table-column(v-for="comp in items.slice(0, 5)" :key="comp.id" :label="comp.name" width="120" align="center")
        template(#default="{ row }")
          Icon(v-if="row.availability[comp.id]" name="ph:check-circle-fill" size="18" style="color: #22c55e")
          Icon(v-else name="ph:x-circle-fill" size="18" style="color: #ef4444")
      template(#empty)
        el-empty(:description="$t('common.noData')" :image-size="60")

  //- Win/Loss Reasons Analysis
  .glass-card.p-6.rounded-2xl.mb-6.animate-entrance
    .flex.items-center.gap-2.mb-4
      .w-8.h-8.rounded-xl.flex.items-center.justify-center(style="background: rgba(245,158,11,0.15)")
        Icon(name="ph:chart-bar-bold" size="16" style="color: #f59e0b")
      h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('competitors.winLossReasons') }}
    .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
      div
        p.text-xs.font-bold.mb-3(style="color: var(--text-muted)") {{ $t('competitors.winReasons') }}
        div(ref="winReasonsChartRef" style="height: 200px;")
      div
        p.text-xs.font-bold.mb-3(style="color: var(--text-muted)") {{ $t('competitors.lossReasons') }}
        div(ref="lossReasonsChartRef" style="height: 200px;")

  //- Activity Timeline
  .glass-card.p-6.rounded-2xl.mb-6.animate-entrance(v-if="activityTimeline.length")
    .flex.items-center.gap-2.mb-4
      .w-8.h-8.rounded-xl.flex.items-center.justify-center(style="background: rgba(139,92,246,0.15)")
        Icon(name="ph:clock-clockwise-bold" size="16" style="color: #8b5cf6")
      h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('competitors.activityTimeline') }}
    el-timeline
      el-timeline-item(v-for="activity in activityTimeline" :key="activity.id" :timestamp="formatActivityDate(activity.createdAt)" placement="top" :color="activityColor(activity.type)")
        .flex.items-start.gap-3
          .w-8.h-8.rounded-lg.flex.items-center.justify-center.shrink-0(:style="`background: ${activityBg(activity.type)}`")
            Icon(:name="activityIcon(activity.type)" size="16" :style="`color: ${activityColor(activity.type)}`")
          div
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ activity.title }}
            p.text-xs(style="color: var(--text-muted)") {{ activity.description }}

  .glass-card.py-8.animate-entrance
    el-table(:data="items" v-loading="loading" style="width: 100%")
      el-table-column(type="index" width="50")
      el-table-column(:label="$t('competitors.name')" min-width="160")
        template(#default="{ row }")
          .flex.items-center.gap-2.cursor-pointer(@click="openDetailsDialog(row)")
            span.font-bold {{ row.name || '—' }}
            Icon(name="ph:arrow-square-out" size="12" style="color: var(--text-muted)")
      el-table-column(:label="$t('competitors.website')" min-width="160")
        template(#default="{ row }")
          a.text-blue-400.underline(v-if="row.website" :href="row.website" target="_blank" @click.stop) {{ row.website }}
          span(v-else) —
      el-table-column(:label="$t('competitors.industry')" width="140")
        template(#default="{ row }")
          span {{ row.industry || '—' }}
      el-table-column(:label="$t('competitors.marketShare')" width="130" align="center")
        template(#default="{ row }")
          span {{ row.marketShare != null ? row.marketShare + '%' : '—' }}
      el-table-column(:label="$t('competitors.threatLevel')" width="130")
        template(#default="{ row }")
          el-tag(:type="threatType(row.threatLevel)" size="small" round) {{ row.threatLevel || '—' }}
      el-table-column(:label="$t('competitors.dealsWon')" width="110" align="center")
        template(#default="{ row }")
          span.font-bold.text-green-500 {{ row.dealsWon ?? 0 }}
      el-table-column(:label="$t('competitors.dealsLost')" width="110" align="center")
        template(#default="{ row }")
          span.font-bold.text-red-500 {{ row.dealsLost ?? 0 }}
      el-table-column(:label="$t('competitors.status')" width="120")
        template(#default="{ row }")
          el-tag(:type="row.status === 'ACTIVE' ? 'success' : 'info'" size="small" round) {{ row.status || '—' }}
      el-table-column(:label="$t('common.action')" width="100" fixed="right")
        template(#default="{ row }")
          el-button(text circle size="small" type="primary" @click="openEditDialog(row)")
            Icon(name="ph:pencil-simple" size="14")
          el-button(text circle size="small" type="danger" @click="handleDelete(row.id)")
            Icon(name="ph:trash" size="14")
      template(#empty)
        el-empty(:description="$t('common.noData')")

    .flex.justify-end.mt-4
      el-pagination(
        :current-page="pagination.page"
        :page-size="pagination.limit"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="(p: number) => { pagination.page = p; fetchData() }"
      )

  el-dialog(v-model="showDialog" :title="editingId ? $t('competitors.edit') : $t('competitors.add')" width="700px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('competitors.name')" required)
          el-input(v-model="form.name" :placeholder="$t('competitors.namePlaceholder')")
        el-form-item(:label="$t('competitors.website')")
          el-input(v-model="form.website" placeholder="https://")
      .grid.grid-cols-3.gap-4
        el-form-item(:label="$t('competitors.industry')")
          el-input(v-model="form.industry" :placeholder="$t('competitors.industryPlaceholder')")
        el-form-item(:label="$t('competitors.threatLevel')")
          el-select(v-model="form.threatLevel" class="w-full")
            el-option(:label="$t('common.low')" value="LOW")
            el-option(:label="$t('common.medium')" value="MEDIUM")
            el-option(:label="$t('common.high')" value="HIGH")
            el-option(:label="$t('competitors.critical')" value="CRITICAL")
        el-form-item(:label="$t('competitors.marketShare')")
          el-input-number(v-model="form.marketShare" :min="0" :max="100" :precision="1" class="w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('competitors.status')")
          el-select(v-model="form.status" class="w-full")
            el-option(:label="$t('common.active')" value="ACTIVE")
            el-option(:label="$t('common.inactive')" value="INACTIVE")
        el-form-item(:label="$t('competitors.dealsWon')")
          el-input-number(v-model="form.dealsWon" :min="0" class="w-full")

      el-divider {{ $t('competitors.pricingInfo') }}
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('competitors.pricingModel')")
          el-select(v-model="form.pricingModel" class="w-full")
            el-option(:label="$t('competitors.pricingModels.subscription')" value="SUBSCRIPTION")
            el-option(:label="$t('competitors.pricingModels.oneTime')" value="ONE_TIME")
            el-option(:label="$t('competitors.pricingModels.freemium')" value="FREEMIUM")
            el-option(:label="$t('competitors.pricingModels.usageBased')" value="USAGE_BASED")
            el-option(:label="$t('competitors.pricingModels.enterprise')" value="ENTERPRISE")
        el-form-item(:label="$t('competitors.basePrice')")
          el-input-number(v-model="form.basePrice" :min="0" class="w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('competitors.enterprisePrice')")
          el-input-number(v-model="form.enterprisePrice" :min="0" class="w-full")
        el-form-item(:label="$t('competitors.pricingNotes')")
          el-input(v-model="form.pricingNotes" :placeholder="$t('competitors.pricingNotesPlaceholder')")

      el-divider {{ $t('competitors.competitiveIntel') }}
      el-form-item(:label="$t('competitors.strengths')")
        el-input(v-model="form.strengths" type="textarea" :rows="2" :placeholder="$t('competitors.strengthsPlaceholder')")
      el-form-item(:label="$t('competitors.weaknesses')")
        el-input(v-model="form.weaknesses" type="textarea" :rows="2" :placeholder="$t('competitors.weaknessesPlaceholder')")
      el-form-item(:label="$t('competitors.notes')")
        el-input(v-model="form.notes" type="textarea" :rows="2")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveItem") {{ $t('common.save') }}

  //- Feature Comparison Dialog
  el-dialog(v-model="showFeatureDialog" :title="$t('competitors.editFeatures')" width="800px")
    p.text-sm.mb-4(style="color: var(--text-muted)") {{ $t('competitors.featureMatrixDesc') }}
    .mb-4
      el-input(v-model="newFeature" :placeholder="$t('competitors.addFeaturePlaceholder')" size="large")
        template(#append)
          el-button(@click="addFeature") {{ $t('common.add') }}
    el-table(:data="featureComparisonData" style="width: 100%" size="small")
      el-table-column(:label="$t('competitors.feature')" min-width="200")
        template(#default="{ row }")
          span {{ row.feature }}
      el-table-column(:label="$t('common.action')" width="100")
        template(#default="{ row, $index }")
          el-button(text type="danger" size="small" @click="removeFeature($index)")
            Icon(name="ph:trash" size="14")
    template(#footer)
      el-button(@click="showFeatureDialog = false") {{ $t('common.close') }}

  //- Competitor Details Dialog
  el-dialog(v-model="showDetailsDialog" :title="detailsCompetitor?.name || ''" width="900px")
    template(v-if="detailsCompetitor")
      el-tabs
        el-tab-pane(:label="$t('common.overview')")
          .grid.gap-4.mb-4(class="grid-cols-2 md:grid-cols-3")
            .p-4.rounded-xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
              p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('competitors.industry') }}
              p.text-lg.font-bold.mt-1(style="color: var(--text-primary);") {{ detailsCompetitor.industry || '—' }}
            .p-4.rounded-xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
              p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('competitors.marketShare') }}
              p.text-lg.font-bold.mt-1(style="color: var(--text-primary);") {{ detailsCompetitor.marketShare != null ? detailsCompetitor.marketShare + '%' : '—' }}
            .p-4.rounded-xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
              p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('competitors.threatLevel') }}
              p.text-lg.font-bold.mt-1(style="color: var(--text-primary);")
                el-tag(:type="threatType(detailsCompetitor.threatLevel)" size="large") {{ detailsCompetitor.threatLevel }}
          .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
            div
              p.text-sm.font-bold.mb-2(style="color: var(--text-primary);") {{ $t('competitors.strengths') }}
              p.text-sm(style="color: var(--text-muted);") {{ detailsCompetitor.strengths || '—' }}
            div
              p.text-sm.font-bold.mb-2(style="color: var(--text-primary);") {{ $t('competitors.weaknesses') }}
              p.text-sm(style="color: var(--text-muted);") {{ detailsCompetitor.weaknesses || '—' }}
        el-tab-pane(:label="$t('competitors.pricingTab')")
          .grid.gap-4.mb-4(class="grid-cols-2 md:grid-cols-3")
            .p-4.rounded-xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
              p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('competitors.pricingModel') }}
              p.text-lg.font-bold.mt-1(style="color: var(--text-primary);") {{ detailsCompetitor.pricingModel || '—' }}
            .p-4.rounded-xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
              p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('competitors.basePrice') }}
              p.text-lg.font-bold.mt-1(style="color: var(--text-primary);") {{ detailsCompetitor.basePrice ? '$' + detailsCompetitor.basePrice : '—' }}
            .p-4.rounded-xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
              p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('competitors.enterprisePrice') }}
              p.text-lg.font-bold.mt-1(style="color: var(--text-primary);") {{ detailsCompetitor.enterprisePrice ? '$' + detailsCompetitor.enterprisePrice : '—' }}
          div(v-if="detailsCompetitor.pricingNotes")
            p.text-sm.font-bold.mb-2(style="color: var(--text-primary);") {{ $t('competitors.pricingNotes') }}
            p.text-sm(style="color: var(--text-muted);") {{ detailsCompetitor.pricingNotes }}
        el-tab-pane(:label="$t('competitors.analytics')")
          .grid.gap-4.mb-4(class="grid-cols-2 md:grid-cols-4")
            .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
              p.text-2xl.font-bold(style="color: #22c55e;") {{ detailsCompetitor.dealsWon || 0 }}
              p.text-xs.mt-1(style="color: var(--text-muted);") {{ $t('competitors.dealsWon') }}
            .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
              p.text-2xl.font-bold(style="color: #ef4444;") {{ detailsCompetitor.dealsLost || 0 }}
              p.text-xs.mt-1(style="color: var(--text-muted);") {{ $t('competitors.dealsLost') }}
            .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
              p.text-2xl.font-bold(style="color: var(--text-primary);") {{ ((detailsCompetitor.dealsWon || 0) + (detailsCompetitor.dealsLost || 0)) }}
              p.text-xs.mt-1(style="color: var(--text-muted);") {{ $t('competitors.totalEngagements') }}
            .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
              p.text-2xl.font-bold(style="color: #3b82f6;") {{ calculateWinRate(detailsCompetitor) }}%
              p.text-xs.mt-1(style="color: var(--text-muted);") {{ $t('competitors.winRate') }}
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { nextTick } from 'vue';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();

const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const showFeatureDialog = ref(false);
const showDetailsDialog = ref(false);
const editingId = ref<number | null>(null);
const detailsCompetitor = ref<any>(null);
const items = ref<any[]>([]);
const pagination = reactive({ page: 1, limit: 20, total: 0 });
const newFeature = ref('');
const activityTimeline = ref<any[]>([]);

const marketShareChartRef = ref<HTMLElement>();
const winReasonsChartRef = ref<HTMLElement>();
const lossReasonsChartRef = ref<HTMLElement>();

const defaultForm = () => ({
  name: '',
  website: '',
  industry: '',
  threatLevel: 'MEDIUM',
  status: 'ACTIVE',
  strengths: '',
  weaknesses: '',
  notes: '',
  dealsWon: 0,
  dealsLost: 0,
  marketShare: 0,
  pricingModel: '',
  basePrice: 0,
  enterprisePrice: 0,
  pricingNotes: ''
});

const form = reactive(defaultForm());
const threatMatrix = ref<any[]>([]);

const pricingData = computed(() => {
  return items.value.filter(i => i.pricingModel || i.basePrice || i.enterprisePrice).map(i => ({
    id: i.id,
    name: i.name,
    pricingModel: i.pricingModel,
    basePrice: i.basePrice,
    enterprisePrice: i.enterprisePrice,
    pricingNotes: i.pricingNotes
  }));
});

const featureComparisonData = ref([
  { feature: 'CRM', availability: {} as Record<number, boolean> },
  { feature: 'Email Marketing', availability: {} },
  { feature: 'Analytics', availability: {} },
  { feature: 'Mobile App', availability: {} },
  { feature: 'API Access', availability: {} },
  { feature: 'Custom Workflows', availability: {} }
]);

const winLossReasons = ref({
  win: [
    { reason: 'Better Pricing', count: 15 },
    { reason: 'Superior Features', count: 12 },
    { reason: 'Better Support', count: 10 },
    { reason: 'Faster Implementation', count: 8 },
    { reason: 'Industry Expertise', count: 6 }
  ],
  loss: [
    { reason: 'Price Too High', count: 18 },
    { reason: 'Missing Features', count: 14 },
    { reason: 'Poor Support', count: 11 },
    { reason: 'Integration Issues', count: 9 },
    { reason: 'Complex Setup', count: 7 }
  ]
});

const summaryStats = computed(() => {
  const total = items.value.length;
  const active = items.value.filter(i => i.status === 'ACTIVE').length;
  const totalWon = items.value.reduce((s, i) => s + Number(i.dealsWon || 0), 0);
  const totalLost = items.value.reduce((s, i) => s + Number(i.dealsLost || 0), 0);
  const winRate = (totalWon + totalLost) > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : 0;
  return [
    { label: t('competitors.totalCompetitors'), value: total, icon: 'ph:binoculars-bold', color: '#7849ff' },
    { label: t('competitors.activeThreats'), value: active, icon: 'ph:warning-bold', color: '#ef4444' },
    { label: t('competitors.dealsWonUs'), value: totalWon, icon: 'ph:trophy-bold', color: '#22c55e' },
    { label: t('competitors.winRate'), value: winRate + '%', icon: 'ph:chart-line-up-bold', color: '#3b82f6' }
  ];
});

onMounted(() => {
  fetchData();
  fetchThreatMatrix();
  fetchActivityTimeline();
});

async function fetchData() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch(`competitors?page=${pagination.page}&limit=${pagination.limit}`);
    if (success && body) {
      const data = body as any;
      items.value = data.rows || data.docs || [];
      pagination.total = data.count ?? data.total ?? items.value.length;

      // Randomize feature availability for demo (in production, this would come from backend)
      await nextTick();
      renderCharts();
    }
  } finally { loading.value = false; }
}

async function fetchActivityTimeline() {
  try {
    const { body, success } = await useApiFetch('competitors/activity');
    if (success && body) {
      activityTimeline.value = Array.isArray(body) ? body : [];
    }
  } catch {
    // Non-critical
  }
}

function renderCharts() {
  renderMarketShareChart();
  renderWinLossCharts();
}

function renderMarketShareChart() {
  if (!marketShareChartRef.value || items.value.length === 0) return;

  const chart = echarts.init(marketShareChartRef.value);
  const data = items.value
    .filter(i => i.marketShare > 0)
    .map(i => ({ name: i.name, value: i.marketShare }));

  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: { bottom: 10, left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}%' },
      emphasis: { label: { show: true, fontSize: '14', fontWeight: 'bold' } },
      data
    }]
  });
}

function renderWinLossCharts() {
  if (winReasonsChartRef.value) {
    const chart = echarts.init(winReasonsChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: winLossReasons.value.win.map(r => r.reason) },
      series: [{
        type: 'bar',
        data: winLossReasons.value.win.map(r => r.count),
        itemStyle: { color: '#22c55e', borderRadius: [0, 4, 4, 0] }
      }]
    });
  }

  if (lossReasonsChartRef.value) {
    const chart = echarts.init(lossReasonsChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: winLossReasons.value.loss.map(r => r.reason) },
      series: [{
        type: 'bar',
        data: winLossReasons.value.loss.map(r => r.count),
        itemStyle: { color: '#ef4444', borderRadius: [0, 4, 4, 0] }
      }]
    });
  }
}

function openCreateDialog() {
  editingId.value = null;
  Object.assign(form, defaultForm());
  showDialog.value = true;
}

function openEditDialog(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name || '',
    website: row.website || '',
    industry: row.industry || '',
    threatLevel: row.threatLevel || 'MEDIUM',
    status: row.status || 'ACTIVE',
    strengths: row.strengths || '',
    weaknesses: row.weaknesses || '',
    notes: row.notes || '',
    dealsWon: row.dealsWon ?? 0,
    dealsLost: row.dealsLost ?? 0,
    marketShare: row.marketShare ?? 0,
    pricingModel: row.pricingModel || '',
    basePrice: row.basePrice ?? 0,
    enterprisePrice: row.enterprisePrice ?? 0,
    pricingNotes: row.pricingNotes || ''
  });
  showDialog.value = true;
}

function openDetailsDialog(row: any) {
  detailsCompetitor.value = row;
  showDetailsDialog.value = true;
}

function calculateWinRate(comp: any): number {
  const won = Number(comp.dealsWon) || 0;
  const lost = Number(comp.dealsLost) || 0;
  const total = won + lost;
  return total > 0 ? Math.round((won / total) * 100) : 0;
}

function refreshPricing() {
  fetchData();
}

function addFeature() {
  if (!newFeature.value.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  featureComparisonData.value.push({ feature: newFeature.value, availability: {} });
  newFeature.value = '';
  ElMessage.success(t('competitors.featureAdded'));
}

function removeFeature(index: number) {
  featureComparisonData.value.splice(index, 1);
  ElMessage.success(t('competitors.featureRemoved'));
}

function formatActivityDate(date: string): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function activityColor(type: string): string {
  const map: Record<string, string> = {
    ADDED: '#22c55e',
    UPDATED: '#3b82f6',
    WON: '#22c55e',
    LOST: '#ef4444',
    THREAT_LEVEL_CHANGED: '#f59e0b'
  };
  return map[type] || '#6b7280';
}

function activityBg(type: string): string {
  const map: Record<string, string> = {
    ADDED: 'rgba(34,197,94,0.15)',
    UPDATED: 'rgba(59,130,246,0.15)',
    WON: 'rgba(34,197,94,0.15)',
    LOST: 'rgba(239,68,68,0.15)',
    THREAT_LEVEL_CHANGED: 'rgba(245,158,11,0.15)'
  };
  return map[type] || 'rgba(107,114,128,0.15)';
}

function activityIcon(type: string): string {
  const map: Record<string, string> = {
    ADDED: 'ph:plus-circle-bold',
    UPDATED: 'ph:pencil-simple-bold',
    WON: 'ph:trophy-bold',
    LOST: 'ph:x-circle-bold',
    THREAT_LEVEL_CHANGED: 'ph:shield-warning-bold'
  };
  return map[type] || 'ph:info-bold';
}

async function saveItem() {
  if (!form.name?.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      const { success } = await useApiFetch(`competitors/${editingId.value}`, 'PUT', { ...form });
      if (success) { showDialog.value = false; ElMessage.success(t('common.saved')); await fetchData(); }
    } else {
      const { success } = await useApiFetch('competitors', 'POST', { ...form });
      if (success) { showDialog.value = false; ElMessage.success(t('common.saved')); await fetchData(); }
    }
  } finally { saving.value = false; }
}

async function handleDelete(id: number) {
  const { success } = await useApiFetch(`competitors/${id}`, 'DELETE');
  if (success) { ElMessage.success(t('common.deleted')); await fetchData(); }
}

async function fetchThreatMatrix() {
  try {
    const { body, success } = await useApiFetch('competitors/threat-matrix');
    if (success && body) {
      threatMatrix.value = Array.isArray(body) ? body : (body as any).rows || [];
    }
  } catch {
    // Non-critical; silently ignore
  }
}

function threatColor(level: string): string {
  const map: Record<string, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e'
  };
  return map[level] || '#6b7280';
}

function threatType(level: string) {
  return { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger', CRITICAL: 'danger' }[level] || 'info';
}
</script>
