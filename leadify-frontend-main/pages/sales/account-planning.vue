<template lang="pug">
.account-planning-page.p-6(class="md:p-8")
  //- Page Header
  .flex.items-start.justify-between.mb-8(class="flex-col md:flex-row md:items-center gap-4")
    div
      h2.text-3xl.font-bold.mb-1(style="color: var(--text-primary)")
        Icon.mr-2(name="ph:target-bold" size="28" style="color: #7849ff")
        | {{ $t('accountPlanning.title') }}
      p(style="color: var(--text-muted)") {{ $t('accountPlanning.subtitle') }}
    .flex.items-center.gap-3(class="flex-wrap")
      el-input(
        v-model="searchQuery"
        :placeholder="$t('accountPlanning.searchPlaceholder')"
        prefix-icon="Search"
        clearable
        style="width: 240px"
      )
      el-select(
        v-model="tierFilter"
        :placeholder="$t('accountPlanning.filterByTier')"
        clearable
        style="width: 180px"
      )
        el-option(
          v-for="tier in tiers"
          :key="tier.value"
          :label="$t(tier.labelKey)"
          :value="tier.value"
        )
      el-button(type="primary" @click="showNewPlanDialog = true" class="!rounded-xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('accountPlanning.newAccountPlan') }}

  //- KPI Cards
  .grid.gap-4.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5")
    .kpi-card(v-for="kpi in kpiCards" :key="kpi.key")
      .flex.items-center.justify-between.mb-3
        .w-11.h-11.rounded-xl.flex.items-center.justify-center(:style="{ background: kpi.color + '18' }")
          Icon(:name="kpi.icon" size="22" :style="{ color: kpi.color }")
        .text-right
          el-tag(
            v-if="kpi.trend !== 0"
            :type="kpi.trend > 0 ? 'success' : 'danger'"
            size="small"
            round
            effect="plain"
          )
            | {{ kpi.trend > 0 ? '+' : '' }}{{ kpi.trend.toFixed(1) }}%
      p.text-xs.font-semibold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
      p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}

  //- Tabs
  el-tabs(v-model="activeTab" class="account-planning-tabs")
    //- Tab 1: Account Plans
    el-tab-pane(:label="$t('accountPlanning.accountPlans')" name="plans")
      .grid.gap-5.mt-4(class="grid-cols-1 md:grid-cols-2 xl:grid-cols-3")
        .account-plan-card(
          v-for="plan in filteredPlans"
          :key="plan.id"
          @click="openPlanDetail(plan)"
        )
          .flex.items-start.justify-between.mb-3
            div
              h4.text-base.font-bold(style="color: var(--text-primary)") {{ plan.company }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ plan.industry }}
            el-tag(
              :type="getTierType(plan.tier)"
              size="small"
              effect="plain"
              round
            ) {{ $t('accountPlanning.tier.' + plan.tier) }}

          .mb-3
            .flex.items-center.justify-between.mb-1
              span.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('accountPlanning.healthScore') }}
              span.text-xs.font-bold(:style="{ color: getHealthColor(plan.healthScore) }") {{ plan.healthScore }}%
            el-progress(
              :percentage="plan.healthScore"
              :stroke-width="6"
              :color="getHealthColor(plan.healthScore)"
              :show-text="false"
            )

          .grid.gap-3(class="grid-cols-2")
            .plan-detail-item
              p.text-xs(style="color: var(--text-muted)") {{ $t('accountPlanning.annualValue') }}
              p.text-sm.font-bold(style="color: var(--text-primary)") {{ formatCurrency(plan.annualValue) }}
            .plan-detail-item
              p.text-xs(style="color: var(--text-muted)") {{ $t('accountPlanning.keyContact') }}
              p.text-sm.font-medium(style="color: var(--text-primary)") {{ plan.keyContact }}
            .plan-detail-item
              p.text-xs(style="color: var(--text-muted)") {{ $t('accountPlanning.nextMilestone') }}
              p.text-sm.font-medium(style="color: var(--text-primary)") {{ plan.nextMilestone }}
            .plan-detail-item
              p.text-xs(style="color: var(--text-muted)") {{ $t('accountPlanning.daysUntilRenewal') }}
              p.text-sm.font-bold(:style="{ color: plan.daysUntilRenewal <= 30 ? '#ef4444' : plan.daysUntilRenewal <= 90 ? '#f59e0b' : '#22c55e' }") {{ plan.daysUntilRenewal }}

      .text-center.py-12(v-if="filteredPlans.length === 0")
        p(style="color: var(--text-muted)") {{ $t('accountPlanning.noPlansFound') }}

    //- Tab 2: Whitespace Analysis
    el-tab-pane(:label="$t('accountPlanning.whitespaceAnalysis')" name="whitespace")
      .glass-card.p-6.rounded-2xl.mt-4
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold.flex.items-center.gap-2(style="color: var(--text-primary)")
            Icon(name="ph:grid-four-bold" size="20" style="color: #3b82f6")
            | {{ $t('accountPlanning.productAdoptionMatrix') }}
          el-tag(effect="plain" round type="info") {{ filteredPlans.length }} {{ $t('accountPlanning.accounts') }}
        el-table(:data="whitespaceData" stripe style="width: 100%" :empty-text="$t('common.noData')")
          el-table-column(prop="company" :label="$t('accountPlanning.account')" min-width="160" fixed)
            template(#default="scope")
              .flex.items-center.gap-2
                span.font-semibold {{ scope.row.company }}
                el-tag(:type="getTierType(scope.row.tier)" size="small" effect="plain" round) {{ $t('accountPlanning.tier.' + scope.row.tier) }}
          el-table-column(
            v-for="product in products"
            :key="product.key"
            :label="product.name"
            min-width="110"
            align="center"
          )
            template(#default="scope")
              .flex.justify-center
                Icon(
                  v-if="scope.row.adoptedProducts.includes(product.key)"
                  name="ph:check-circle-fill"
                  size="20"
                  style="color: #22c55e"
                )
                Icon(
                  v-else
                  name="ph:circle-dashed"
                  size="20"
                  style="color: #d1d5db"
                )
          el-table-column(:label="$t('accountPlanning.crossSellScore')" min-width="140" align="center")
            template(#default="scope")
              el-progress(
                :percentage="scope.row.crossSellScore"
                :stroke-width="8"
                :color="scope.row.crossSellScore >= 70 ? '#22c55e' : scope.row.crossSellScore >= 40 ? '#f59e0b' : '#94a3b8'"
              )
          el-table-column(:label="$t('accountPlanning.recommendedProduct')" min-width="170")
            template(#default="scope")
              el-tag(type="primary" effect="plain" size="small" round) {{ scope.row.recommendedProduct }}

    //- Tab 3: Stakeholder Map
    el-tab-pane(:label="$t('accountPlanning.stakeholderMap')" name="stakeholders")
      .glass-card.p-6.rounded-2xl.mt-4
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold.flex.items-center.gap-2(style="color: var(--text-primary)")
            Icon(name="ph:users-three-bold" size="20" style="color: #7849ff")
            | {{ $t('accountPlanning.keyStakeholders') }}
          el-select(v-model="stakeholderAccountFilter" :placeholder="$t('accountPlanning.allAccounts')" clearable style="width: 220px")
            el-option(
              v-for="plan in accountPlans"
              :key="plan.id"
              :label="plan.company"
              :value="plan.id"
            )
        el-table(:data="filteredStakeholders" stripe style="width: 100%" :empty-text="$t('common.noData')")
          el-table-column(prop="name" :label="$t('accountPlanning.stakeholderName')" min-width="160")
            template(#default="scope")
              .flex.items-center.gap-2
                .stakeholder-avatar(:style="{ background: getAvatarColor(scope.$index) }") {{ getInitials(scope.row.name) }}
                div
                  p.font-medium {{ scope.row.name }}
                  p.text-xs(style="color: var(--text-muted)") {{ scope.row.title }}
          el-table-column(prop="company" :label="$t('accountPlanning.account')" min-width="150")
          el-table-column(:label="$t('accountPlanning.role')" min-width="130")
            template(#default="scope")
              el-tag(size="small" effect="plain" round) {{ scope.row.role }}
          el-table-column(:label="$t('accountPlanning.influenceLevel')" min-width="140")
            template(#default="scope")
              el-tag(
                :type="getInfluenceType(scope.row.influence)"
                size="small"
                effect="dark"
                round
              ) {{ $t('accountPlanning.influence.' + scope.row.influence) }}
          el-table-column(:label="$t('accountPlanning.engagementScore')" min-width="160")
            template(#default="scope")
              .flex.items-center.gap-2
                el-progress(
                  :percentage="scope.row.engagementScore"
                  :stroke-width="8"
                  :color="scope.row.engagementScore >= 70 ? '#22c55e' : scope.row.engagementScore >= 40 ? '#f59e0b' : '#ef4444'"
                  :show-text="false"
                  style="flex: 1"
                )
                span.text-xs.font-bold {{ scope.row.engagementScore }}%
          el-table-column(:label="$t('accountPlanning.lastContact')" min-width="130")
            template(#default="scope")
              span.text-sm {{ scope.row.lastContact }}

    //- Tab 4: Forecasting
    el-tab-pane(:label="$t('accountPlanning.forecasting')" name="forecasting")
      .glass-card.p-6.rounded-2xl.mt-4
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold.flex.items-center.gap-2(style="color: var(--text-primary)")
            Icon(name="ph:chart-bar-bold" size="20" style="color: #f59e0b")
            | {{ $t('accountPlanning.quarterlyForecast') }}
          el-tag(effect="plain" round type="warning") {{ $t('accountPlanning.fiscalYear') }} 2026
        el-table(:data="forecastData" stripe style="width: 100%" show-summary :summary-method="getForecastSummary" :empty-text="$t('common.noData')")
          el-table-column(prop="quarter" :label="$t('accountPlanning.quarter')" min-width="110" fixed)
            template(#default="scope")
              span.font-bold {{ scope.row.quarter }}
          el-table-column(:label="$t('accountPlanning.pipelineValue')" min-width="150")
            template(#default="scope")
              span.font-semibold(style="color: #3b82f6") {{ formatCurrency(scope.row.pipelineValue) }}
          el-table-column(:label="$t('accountPlanning.weightedForecast')" min-width="160")
            template(#default="scope")
              span.font-semibold(style="color: #7849ff") {{ formatCurrency(scope.row.weightedForecast) }}
          el-table-column(:label="$t('accountPlanning.bestCase')" min-width="140")
            template(#default="scope")
              span.font-semibold(style="color: #22c55e") {{ formatCurrency(scope.row.bestCase) }}
          el-table-column(:label="$t('accountPlanning.committed')" min-width="140")
            template(#default="scope")
              span.font-semibold(style="color: #06b6d4") {{ formatCurrency(scope.row.committed) }}
          el-table-column(:label="$t('accountPlanning.target')" min-width="140")
            template(#default="scope")
              span.font-semibold {{ formatCurrency(scope.row.target) }}
          el-table-column(:label="$t('accountPlanning.gapToTarget')" min-width="150")
            template(#default="scope")
              span.font-bold(:style="{ color: scope.row.gapToTarget <= 0 ? '#22c55e' : '#ef4444' }")
                | {{ scope.row.gapToTarget <= 0 ? '' : '+' }}{{ formatCurrency(Math.abs(scope.row.gapToTarget)) }}
              el-tag.ml-2(
                v-if="scope.row.gapToTarget <= 0"
                size="small"
                type="success"
                effect="plain"
                round
              ) {{ $t('accountPlanning.onTrack') }}
              el-tag.ml-2(
                v-else
                size="small"
                type="danger"
                effect="plain"
                round
              ) {{ $t('accountPlanning.atRisk') }}
          el-table-column(:label="$t('accountPlanning.probability')" min-width="140")
            template(#default="scope")
              .flex.items-center.gap-2
                el-progress(
                  :percentage="scope.row.probability"
                  :stroke-width="8"
                  :color="scope.row.probability >= 70 ? '#22c55e' : scope.row.probability >= 40 ? '#f59e0b' : '#ef4444'"
                  :show-text="false"
                  style="flex: 1"
                )
                span.text-xs.font-bold {{ scope.row.probability }}%

  //- Account Plan Detail Dialog
  el-dialog(
    v-model="showPlanDetailDialog"
    :title="selectedPlan?.company"
    width="75%"
    top="4vh"
    destroy-on-close
  )
    template(v-if="selectedPlan")
      .flex.items-center.gap-3.mb-6
        el-tag(:type="getTierType(selectedPlan.tier)" effect="dark" round) {{ $t('accountPlanning.tier.' + selectedPlan.tier) }}
        el-tag(effect="plain" round) {{ selectedPlan.industry }}
        .ml-auto.text-right
          p.text-xs(style="color: var(--text-muted)") {{ $t('accountPlanning.annualValue') }}
          p.text-xl.font-bold(style="color: #7849ff") {{ formatCurrency(selectedPlan.annualValue) }}

      //- Plan Goals
      .detail-section.mb-6
        h4.text-base.font-bold.mb-3.flex.items-center.gap-2(style="color: var(--text-primary)")
          Icon(name="ph:flag-bold" size="18" style="color: #7849ff")
          | {{ $t('accountPlanning.strategicGoals') }}
        .grid.gap-3(class="grid-cols-1 md:grid-cols-2")
          .goal-card(v-for="(goal, idx) in selectedPlan.goals" :key="idx")
            .flex.items-start.gap-3
              .goal-number {{ idx + 1 }}
              div
                p.font-medium(style="color: var(--text-primary)") {{ goal.title }}
                p.text-xs.mt-1(style="color: var(--text-muted)") {{ goal.description }}
                .flex.items-center.gap-2.mt-2
                  el-progress(
                    :percentage="goal.progress"
                    :stroke-width="6"
                    :color="goal.progress >= 70 ? '#22c55e' : goal.progress >= 40 ? '#f59e0b' : '#3b82f6'"
                    :show-text="false"
                    style="flex: 1; max-width: 200px"
                  )
                  span.text-xs.font-bold {{ goal.progress }}%

      //- Milestones Timeline
      .detail-section.mb-6
        h4.text-base.font-bold.mb-3.flex.items-center.gap-2(style="color: var(--text-primary)")
          Icon(name="ph:path-bold" size="18" style="color: #3b82f6")
          | {{ $t('accountPlanning.milestones') }}
        el-timeline
          el-timeline-item(
            v-for="(milestone, idx) in selectedPlan.milestones"
            :key="idx"
            :timestamp="milestone.date"
            :type="milestone.status === 'completed' ? 'success' : milestone.status === 'in-progress' ? 'primary' : 'info'"
            :hollow="milestone.status !== 'completed'"
            placement="top"
          )
            .milestone-content
              .flex.items-center.gap-2
                span.font-medium {{ milestone.title }}
                el-tag(
                  :type="milestone.status === 'completed' ? 'success' : milestone.status === 'in-progress' ? 'primary' : 'info'"
                  size="small"
                  effect="plain"
                  round
                ) {{ $t('accountPlanning.milestoneStatus.' + milestone.status) }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ milestone.description }}

      //- Risk Assessment & Competitive Landscape (2 columns)
      .grid.gap-6.mb-6(class="grid-cols-1 lg:grid-cols-2")
        //- Risk Assessment
        .detail-section
          h4.text-base.font-bold.mb-3.flex.items-center.gap-2(style="color: var(--text-primary)")
            Icon(name="ph:warning-bold" size="18" style="color: #ef4444")
            | {{ $t('accountPlanning.riskAssessment') }}
          .space-y-3
            .risk-item(v-for="(risk, idx) in selectedPlan.risks" :key="idx")
              .flex.items-center.justify-between.mb-1
                span.text-sm.font-medium(style="color: var(--text-primary)") {{ risk.title }}
                el-tag(
                  :type="risk.severity === 'high' ? 'danger' : risk.severity === 'medium' ? 'warning' : 'info'"
                  size="small"
                  effect="dark"
                  round
                ) {{ $t('accountPlanning.severity.' + risk.severity) }}
              p.text-xs(style="color: var(--text-muted)") {{ risk.mitigation }}

        //- Competitive Landscape
        .detail-section
          h4.text-base.font-bold.mb-3.flex.items-center.gap-2(style="color: var(--text-primary)")
            Icon(name="ph:sword-bold" size="18" style="color: #f59e0b")
            | {{ $t('accountPlanning.competitiveLandscape') }}
          .space-y-3
            .competitor-item(v-for="(comp, idx) in selectedPlan.competitors" :key="idx")
              .flex.items-center.justify-between
                div
                  p.text-sm.font-medium(style="color: var(--text-primary)") {{ comp.name }}
                  p.text-xs(style="color: var(--text-muted)") {{ comp.strength }}
                .flex.items-center.gap-2
                  span.text-xs(style="color: var(--text-muted)") {{ $t('accountPlanning.threatLevel') }}
                  el-rate(
                    v-model="comp.threatLevel"
                    disabled
                    :max="5"
                    size="small"
                  )

      //- Action Items
      .detail-section
        h4.text-base.font-bold.mb-3.flex.items-center.gap-2(style="color: var(--text-primary)")
          Icon(name="ph:list-checks-bold" size="18" style="color: #22c55e")
          | {{ $t('accountPlanning.actionItems') }}
        el-table(:data="selectedPlan.actionItems" stripe style="width: 100%")
          el-table-column(prop="action" :label="$t('accountPlanning.action')" min-width="220")
          el-table-column(prop="owner" :label="$t('accountPlanning.owner')" min-width="140")
          el-table-column(prop="dueDate" :label="$t('accountPlanning.dueDate')" min-width="120")
          el-table-column(:label="$t('accountPlanning.status')" min-width="120")
            template(#default="scope")
              el-tag(
                :type="scope.row.status === 'completed' ? 'success' : scope.row.status === 'in-progress' ? 'primary' : 'info'"
                size="small"
                effect="plain"
                round
              ) {{ $t('accountPlanning.actionStatus.' + scope.row.status) }}
          el-table-column(:label="$t('accountPlanning.priority')" min-width="100" align="center")
            template(#default="scope")
              el-tag(
                :type="scope.row.priority === 'high' ? 'danger' : scope.row.priority === 'medium' ? 'warning' : 'info'"
                size="small"
                effect="dark"
                round
              ) {{ $t('accountPlanning.priorityLevel.' + scope.row.priority) }}

  //- New Account Plan Dialog
  el-dialog(
    v-model="showNewPlanDialog"
    :title="$t('accountPlanning.createNewPlan')"
    width="600px"
    top="6vh"
    destroy-on-close
  )
    el-form(
      :model="newPlanForm"
      label-position="top"
      ref="newPlanFormRef"
    )
      el-form-item(:label="$t('accountPlanning.companyName')" required)
        el-input(v-model="newPlanForm.company" :placeholder="$t('accountPlanning.companyNamePlaceholder')")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('accountPlanning.industry')")
          el-input(v-model="newPlanForm.industry" :placeholder="$t('accountPlanning.industryPlaceholder')")
        el-form-item(:label="$t('accountPlanning.tierLabel')" required)
          el-select(v-model="newPlanForm.tier" :placeholder="$t('accountPlanning.selectTier')" style="width: 100%")
            el-option(
              v-for="tier in tiers"
              :key="tier.value"
              :label="$t(tier.labelKey)"
              :value="tier.value"
            )
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('accountPlanning.annualValue')")
          el-input(v-model="newPlanForm.annualValue" type="number" :placeholder="$t('accountPlanning.annualValuePlaceholder')")
        el-form-item(:label="$t('accountPlanning.keyContact')")
          el-input(v-model="newPlanForm.keyContact" :placeholder="$t('accountPlanning.keyContactPlaceholder')")
      el-form-item(:label="$t('accountPlanning.strategicObjective')")
        el-input(
          v-model="newPlanForm.objective"
          type="textarea"
          :rows="3"
          :placeholder="$t('accountPlanning.objectivePlaceholder')"
        )
      el-form-item(:label="$t('accountPlanning.renewalDate')")
        el-date-picker(
          v-model="newPlanForm.renewalDate"
          type="date"
          :placeholder="$t('accountPlanning.selectDate')"
          style="width: 100%"
        )
    template(#footer)
      el-button(@click="showNewPlanDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="createNewPlan") {{ $t('accountPlanning.createPlan') }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Account Planning' });

const { t } = useI18n();

// ---- State ----
const searchQuery = ref('');
const tierFilter = ref('');
const activeTab = ref('plans');
const stakeholderAccountFilter = ref<number | string>('');
const showPlanDetailDialog = ref(false);
const showNewPlanDialog = ref(false);
const selectedPlan = ref<Record<string, unknown> | null>(null);
const loading = ref(false);

const newPlanForm = ref({
  company: '',
  industry: '',
  tier: '',
  annualValue: '',
  keyContact: '',
  objective: '',
  renewalDate: null as Date | null
});

// ---- Constants ----
const tiers = [
  { value: 'strategic', labelKey: 'accountPlanning.tier.strategic' },
  { value: 'key', labelKey: 'accountPlanning.tier.key' },
  { value: 'growth', labelKey: 'accountPlanning.tier.growth' },
  { value: 'standard', labelKey: 'accountPlanning.tier.standard' }
];

const products = [
  { key: 'crm', name: 'CRM Suite' },
  { key: 'analytics', name: 'Analytics' },
  { key: 'marketing', name: 'Marketing Hub' },
  { key: 'support', name: 'Support Desk' },
  { key: 'commerce', name: 'Commerce' },
  { key: 'integration', name: 'Integrations' }
];

// ---- Data: Account Plans ----
const accountPlans = ref<Record<string, unknown>[]>([]);

// ---- Data: Stakeholders ----
const stakeholders = ref<Record<string, unknown>[]>([]);

// ---- Data: Forecast ----
const forecastData = ref<Record<string, unknown>[]>([]);

// ---- API Data Loading ----
async function loadAccountPlans() {
  try {
    const res = await useApiFetch('account-plans', 'GET', {}, true);
    if (res.success && res.body) {
      const data = res.body as unknown;
      // API returns { docs, pagination } for paginated results
      accountPlans.value = data.docs || data || [];
    } else {
      accountPlans.value = [];
    }
  } catch {
    accountPlans.value = [];
  }
}

async function loadStakeholders() {
  try {
    // Load stakeholders for all plans; if a specific plan is selected, filter later
    // The API needs an account plan ID, so we aggregate from all plans
    const allStakeholders: Record<string, unknown>[] = [];
    for (const plan of accountPlans.value) {
      try {
        const res = await useApiFetch(`account-plans/${plan.id}/stakeholders`, 'GET', {}, true);
        if (res.success && res.body) {
          const data = Array.isArray(res.body) ? res.body : (res.body as unknown).docs || [];
          allStakeholders.push(...data);
        }
      } catch {
        // Skip individual plan failures
      }
    }
    if (allStakeholders.length > 0) {
      stakeholders.value = allStakeholders;
    } else {
      stakeholders.value = [];
    }
  } catch {
    stakeholders.value = [];
  }
}

async function loadForecastData() {
  try {
    const res = await useApiFetch('account-plans/forecast', 'GET', {}, true);
    if (res.success && res.body) {
      const data = res.body as unknown;
      forecastData.value = Array.isArray(data) ? data : data.docs || [];
    } else {
      forecastData.value = [];
    }
  } catch {
    forecastData.value = [];
  }
}

async function loadAllData() {
  loading.value = true;
  try {
    await loadAccountPlans();
    // Load stakeholders and forecast in parallel (stakeholders depend on accountPlans)
    await Promise.all([loadStakeholders(), loadForecastData()]);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadAllData();
});

// ---- Computed ----
const filteredPlans = computed(() => {
  let plans = accountPlans.value;
  if (tierFilter.value) {
    plans = plans.filter(p => p.tier === tierFilter.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    plans = plans.filter(p => p.company.toLowerCase().includes(q) || p.industry.toLowerCase().includes(q) || p.keyContact.toLowerCase().includes(q));
  }
  return plans;
});

const whitespaceData = computed(() => {
  return filteredPlans.value.map(plan => ({
    company: plan.company,
    tier: plan.tier,
    adoptedProducts: plan.adoptedProducts,
    crossSellScore: plan.crossSellScore,
    recommendedProduct: plan.recommendedProduct
  }));
});

const filteredStakeholders = computed(() => {
  if (stakeholderAccountFilter.value) {
    return stakeholders.value.filter(s => s.accountId === Number(stakeholderAccountFilter.value));
  }
  return stakeholders.value;
});

const kpiCards = computed(() => {
  const plans = accountPlans.value;
  const totalValue = plans.reduce((sum, p) => sum + p.annualValue, 0);
  const activePlans = plans.length;
  const crossSellOps = plans.filter(p => p.crossSellScore >= 60).length;
  const avgHealth = plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + p.healthScore, 0) / plans.length) : 0;
  const renewalPipeline = plans.filter(p => p.daysUntilRenewal <= 120).reduce((sum, p) => sum + p.annualValue, 0);

  return [
    {
      key: 'totalValue',
      label: t('accountPlanning.totalAccountValue'),
      value: formatCurrency(totalValue),
      icon: 'ph:currency-dollar-bold',
      color: '#7849ff',
      trend: 12.4
    },
    {
      key: 'activePlans',
      label: t('accountPlanning.activePlans'),
      value: activePlans.toString(),
      icon: 'ph:file-text-bold',
      color: '#3b82f6',
      trend: 8.3
    },
    {
      key: 'crossSell',
      label: t('accountPlanning.crossSellOpportunities'),
      value: crossSellOps.toString(),
      icon: 'ph:arrows-out-bold',
      color: '#22c55e',
      trend: 15.2
    },
    {
      key: 'avgHealth',
      label: t('accountPlanning.avgHealthScore'),
      value: avgHealth + '%',
      icon: 'ph:heartbeat-bold',
      color: '#f59e0b',
      trend: -2.1
    },
    {
      key: 'renewalPipeline',
      label: t('accountPlanning.renewalPipeline'),
      value: formatCurrency(renewalPipeline),
      icon: 'ph:arrows-clockwise-bold',
      color: '#06b6d4',
      trend: 5.7
    }
  ];
});

// ---- Helpers ----
function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function getTierType(tier: string): string {
  const map: Record<string, string> = {
    strategic: 'danger',
    key: 'warning',
    growth: 'success',
    standard: 'info'
  };
  return map[tier] || 'info';
}

function getHealthColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getInfluenceType(influence: string): string {
  const map: Record<string, string> = {
    champion: 'success',
    sponsor: 'primary',
    evaluator: 'warning',
    blocker: 'danger'
  };
  return map[influence] || 'info';
}

function getAvatarColor(index: number): string {
  const colors = ['#7849ff', '#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#f97316', '#ef4444', '#ec4899'];
  return colors[index % colors.length] || '#7849ff';
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

function openPlanDetail(plan: unknown) {
  selectedPlan.value = plan;
  showPlanDetailDialog.value = true;
}

async function createNewPlan() {
  try {
    const res = await useApiFetch('account-plans', 'POST', {
      company: newPlanForm.value.company,
      industry: newPlanForm.value.industry,
      tier: newPlanForm.value.tier,
      annualValue: Number(newPlanForm.value.annualValue) || 0,
      keyContact: newPlanForm.value.keyContact,
      objective: newPlanForm.value.objective,
      renewalDate: newPlanForm.value.renewalDate
    });
    if (res.success && res.body) {
      // Reload plans to include the new one
      await loadAccountPlans();
    }
  } catch {
    // Silently handle error; plan list will refresh on next load
  }
  showNewPlanDialog.value = false;
  newPlanForm.value = {
    company: '',
    industry: '',
    tier: '',
    annualValue: '',
    keyContact: '',
    objective: '',
    renewalDate: null
  };
}

function getForecastSummary({ columns, data }: { columns: Record<string, unknown>[]; data: Record<string, unknown>[] }) {
  const sums: string[] = [];
  columns.forEach((col: unknown, index: number) => {
    if (index === 0) {
      sums.push(t('accountPlanning.total'));
      return;
    }
    const prop = col.property;
    if (prop && typeof data[0]?.[prop] === 'number') {
      const total = data.reduce((sum, row) => sum + (row[prop] || 0), 0);
      if (prop === 'probability') {
        sums.push(Math.round(total / data.length) + '%');
      } else {
        sums.push(formatCurrency(total));
      }
    } else {
      sums.push('');
    }
  });
  return sums;
}
</script>

<style lang="scss" scoped>
.account-planning-page {
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

// ---- KPI Cards ----
.kpi-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.1);
    border-color: rgba(120, 73, 255, 0.3);
  }
}

// ---- Glass Card ----
.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08);
  }
}

// ---- Account Plan Cards ----
.account-plan-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 48px rgba(120, 73, 255, 0.12);
    border-color: rgba(120, 73, 255, 0.4);
  }
}

.plan-detail-item {
  padding: 0.5rem 0;
  border-top: 1px solid var(--border-default);
}

// ---- Tabs ----
.account-planning-tabs {
  :deep(.el-tabs__item) {
    font-weight: 600;
    font-size: 0.9rem;
  }
}

// ---- Stakeholder Avatar ----
.stakeholder-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
}

// ---- Detail Dialog Sections ----
.detail-section {
  background: rgba(120, 73, 255, 0.02);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 1.25rem;
}

.goal-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  padding: 1rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(120, 73, 255, 0.3);
  }
}

.goal-number {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(120, 73, 255, 0.1);
  color: #7849ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.milestone-content {
  padding: 4px 0;
}

.risk-item {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  padding: 0.85rem 1rem;
}

.competitor-item {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  padding: 0.85rem 1rem;
}

// ---- Responsive ----
@media (max-width: 768px) {
  .account-planning-page {
    padding: 1rem;
  }
}
</style>
