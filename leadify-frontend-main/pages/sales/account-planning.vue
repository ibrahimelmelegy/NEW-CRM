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
const selectedPlan = ref<any>(null);
const loading = ref(false);

const newPlanForm = ref({
  company: '',
  industry: '',
  tier: '',
  annualValue: '',
  keyContact: '',
  objective: '',
  renewalDate: null as Date | null,
});

// ---- Constants ----
const tiers = [
  { value: 'strategic', labelKey: 'accountPlanning.tier.strategic' },
  { value: 'key', labelKey: 'accountPlanning.tier.key' },
  { value: 'growth', labelKey: 'accountPlanning.tier.growth' },
  { value: 'standard', labelKey: 'accountPlanning.tier.standard' },
];

const products = [
  { key: 'crm', name: 'CRM Suite' },
  { key: 'analytics', name: 'Analytics' },
  { key: 'marketing', name: 'Marketing Hub' },
  { key: 'support', name: 'Support Desk' },
  { key: 'commerce', name: 'Commerce' },
  { key: 'integration', name: 'Integrations' },
];

// ---- Data: Account Plans ----
const accountPlans = ref<any[]>([]);

// ---- Fallback Mock Data ----
const fallbackAccountPlans = [
  {
    id: 1,
    company: 'Aramco Digital',
    industry: 'Oil & Gas Technology',
    tier: 'strategic',
    healthScore: 92,
    annualValue: 2450000,
    keyContact: 'Sultan Al-Harbi',
    nextMilestone: 'Executive QBR',
    daysUntilRenewal: 45,
    adoptedProducts: ['crm', 'analytics', 'marketing', 'support', 'integration'],
    crossSellScore: 85,
    recommendedProduct: 'Commerce',
    goals: [
      { title: 'Expand to 5 business units', description: 'Roll out platform across all major divisions by Q3 2026.', progress: 68 },
      { title: 'Achieve 95% user adoption', description: 'Drive daily active usage above target through training programs.', progress: 82 },
      { title: 'Integrate SAP ERP', description: 'Complete bi-directional data sync with SAP S/4HANA.', progress: 45 },
    ],
    milestones: [
      { title: 'Contract Signed', date: '2025-03-15', status: 'completed', description: 'Master services agreement executed.' },
      { title: 'Phase 1 Go-Live', date: '2025-06-01', status: 'completed', description: 'CRM and analytics deployed to 3 BUs.' },
      { title: 'SAP Integration Kickoff', date: '2025-10-01', status: 'completed', description: 'Integration project team assembled.' },
      { title: 'Executive QBR', date: '2026-03-20', status: 'in-progress', description: 'Quarterly business review with C-suite.' },
      { title: 'Phase 2 Expansion', date: '2026-06-15', status: 'pending', description: 'Deploy marketing hub to remaining BUs.' },
    ],
    risks: [
      { title: 'Budget freeze in Q2', severity: 'high', mitigation: 'Secure multi-year commitment before fiscal year end.' },
      { title: 'Key champion leaving role', severity: 'medium', mitigation: 'Build relationships with 3+ stakeholders at VP level.' },
    ],
    competitors: [
      { name: 'Salesforce', strength: 'Strong brand presence in region', threatLevel: 4 },
      { name: 'Microsoft Dynamics', strength: 'Bundled with existing MS licenses', threatLevel: 3 },
    ],
    actionItems: [
      { action: 'Schedule QBR presentation with CEO', owner: 'Ahmad Nasser', dueDate: '2026-03-15', status: 'in-progress', priority: 'high' },
      { action: 'Prepare SAP integration demo', owner: 'Layla Mansour', dueDate: '2026-03-10', status: 'completed', priority: 'high' },
      { action: 'Conduct user satisfaction survey', owner: 'Omar Farid', dueDate: '2026-04-01', status: 'pending', priority: 'medium' },
    ],
  },
  {
    id: 2,
    company: 'Emirates NBD',
    industry: 'Banking & Finance',
    tier: 'strategic',
    healthScore: 87,
    annualValue: 1890000,
    keyContact: 'Fatima Al-Mazrouei',
    nextMilestone: 'Compliance Audit',
    daysUntilRenewal: 120,
    adoptedProducts: ['crm', 'analytics', 'support'],
    crossSellScore: 72,
    recommendedProduct: 'Marketing Hub',
    goals: [
      { title: 'Digital transformation of wealth management', description: 'Automate client relationship workflows for private banking division.', progress: 55 },
      { title: 'Regulatory compliance automation', description: 'Implement KYC/AML monitoring dashboards.', progress: 78 },
    ],
    milestones: [
      { title: 'Discovery & Planning', date: '2025-02-01', status: 'completed', description: 'Requirements gathering complete.' },
      { title: 'CRM Deployment', date: '2025-05-20', status: 'completed', description: 'Core CRM live across 4 branches.' },
      { title: 'Compliance Audit', date: '2026-04-10', status: 'in-progress', description: 'Annual regulatory compliance review.' },
      { title: 'Marketing Hub Pilot', date: '2026-07-01', status: 'pending', description: 'Test marketing automation with retail banking.' },
    ],
    risks: [
      { title: 'Regulatory changes in H2', severity: 'high', mitigation: 'Proactive compliance feature roadmap alignment.' },
      { title: 'Competitor proof-of-concept', severity: 'medium', mitigation: 'Accelerate value demonstration and case study.' },
    ],
    competitors: [
      { name: 'Oracle CX', strength: 'Deep financial services expertise', threatLevel: 3 },
      { name: 'Temenos', strength: 'Banking-specific solution', threatLevel: 2 },
    ],
    actionItems: [
      { action: 'Deliver compliance readiness report', owner: 'Fatima Al-Mazrouei', dueDate: '2026-03-25', status: 'in-progress', priority: 'high' },
      { action: 'Present marketing hub ROI analysis', owner: 'Khalid Saeed', dueDate: '2026-04-15', status: 'pending', priority: 'medium' },
    ],
  },
  {
    id: 3,
    company: 'Etisalat (e&)',
    industry: 'Telecommunications',
    tier: 'strategic',
    healthScore: 78,
    annualValue: 1650000,
    keyContact: 'Mohammed Al-Suwaidi',
    nextMilestone: 'Product Roadmap Review',
    daysUntilRenewal: 85,
    adoptedProducts: ['crm', 'analytics', 'marketing', 'commerce'],
    crossSellScore: 68,
    recommendedProduct: 'Support Desk',
    goals: [
      { title: 'Unify B2B and B2C customer views', description: 'Single platform for enterprise and consumer segments.', progress: 42 },
      { title: 'Reduce churn by 15%', description: 'Implement predictive churn models and proactive outreach.', progress: 61 },
    ],
    milestones: [
      { title: 'Platform Migration', date: '2025-04-10', status: 'completed', description: 'Migrated from legacy system.' },
      { title: 'B2B Module Live', date: '2025-09-01', status: 'completed', description: 'Enterprise segment fully operational.' },
      { title: 'Product Roadmap Review', date: '2026-03-28', status: 'in-progress', description: 'Joint product roadmap session.' },
      { title: 'Support Desk Integration', date: '2026-08-01', status: 'pending', description: 'Unified support experience rollout.' },
    ],
    risks: [
      { title: '5G platform investment shift', severity: 'medium', mitigation: 'Position as complementary to 5G customer experience.' },
    ],
    competitors: [
      { name: 'Amdocs', strength: 'Telecom-native BSS/OSS', threatLevel: 4 },
      { name: 'Salesforce', strength: 'Communications Cloud offering', threatLevel: 3 },
    ],
    actionItems: [
      { action: 'Prepare joint roadmap presentation', owner: 'Nadia Hamdan', dueDate: '2026-03-22', status: 'in-progress', priority: 'high' },
      { action: 'Schedule support desk pilot planning', owner: 'Rashid Kamal', dueDate: '2026-05-01', status: 'pending', priority: 'low' },
    ],
  },
  {
    id: 4,
    company: 'Al Rajhi Bank',
    industry: 'Islamic Banking',
    tier: 'key',
    healthScore: 85,
    annualValue: 980000,
    keyContact: 'Abdullah Al-Rajhi',
    nextMilestone: 'Phase 2 Kickoff',
    daysUntilRenewal: 200,
    adoptedProducts: ['crm', 'analytics'],
    crossSellScore: 78,
    recommendedProduct: 'Marketing Hub',
    goals: [
      { title: 'Shariah-compliant CRM workflows', description: 'Customize deal management for Islamic finance products.', progress: 89 },
      { title: 'Customer 360 implementation', description: 'Unified view across retail, corporate, and treasury.', progress: 52 },
    ],
    milestones: [
      { title: 'Initial Deployment', date: '2025-06-15', status: 'completed', description: 'Core CRM deployed to corporate banking.' },
      { title: 'Phase 2 Kickoff', date: '2026-04-01', status: 'in-progress', description: 'Expand to retail banking division.' },
      { title: 'Analytics Dashboard Live', date: '2026-07-01', status: 'pending', description: 'Executive dashboard for all segments.' },
    ],
    risks: [
      { title: 'Integration complexity with core banking', severity: 'medium', mitigation: 'Engage dedicated integration partner early.' },
    ],
    competitors: [
      { name: 'Path Solutions', strength: 'Islamic finance specialization', threatLevel: 3 },
    ],
    actionItems: [
      { action: 'Finalize phase 2 scope document', owner: 'Ahmad Nasser', dueDate: '2026-03-30', status: 'in-progress', priority: 'high' },
      { action: 'Train retail banking super-users', owner: 'Sara Khalil', dueDate: '2026-04-20', status: 'pending', priority: 'medium' },
    ],
  },
  {
    id: 5,
    company: 'SABIC',
    industry: 'Chemicals & Manufacturing',
    tier: 'key',
    healthScore: 74,
    annualValue: 750000,
    keyContact: 'Tariq Al-Dosari',
    nextMilestone: 'Integration Testing',
    daysUntilRenewal: 28,
    adoptedProducts: ['crm', 'support', 'integration'],
    crossSellScore: 65,
    recommendedProduct: 'Analytics',
    goals: [
      { title: 'Global distributor portal', description: 'Centralized portal for 200+ distributors across 50 countries.', progress: 38 },
      { title: 'Supply chain visibility', description: 'Real-time order tracking and inventory dashboards.', progress: 55 },
    ],
    milestones: [
      { title: 'Core CRM Go-Live', date: '2025-08-01', status: 'completed', description: 'Deployed to headquarters.' },
      { title: 'Integration Testing', date: '2026-03-15', status: 'in-progress', description: 'Testing with SAP and Oracle ERP.' },
      { title: 'Distributor Portal Beta', date: '2026-06-01', status: 'pending', description: 'Beta launch for top 20 distributors.' },
    ],
    risks: [
      { title: 'Renewal at risk due to slow integration', severity: 'high', mitigation: 'Assign senior engineer and weekly status calls.' },
      { title: 'Scope creep from distributor requirements', severity: 'medium', mitigation: 'Strict change control process.' },
    ],
    competitors: [
      { name: 'SAP CX', strength: 'Already embedded in SAP ecosystem', threatLevel: 5 },
    ],
    actionItems: [
      { action: 'Resolve 3 critical integration bugs', owner: 'Layla Mansour', dueDate: '2026-03-12', status: 'in-progress', priority: 'high' },
      { action: 'Prepare renewal proposal with discount', owner: 'Omar Farid', dueDate: '2026-03-18', status: 'pending', priority: 'high' },
    ],
  },
  {
    id: 6,
    company: 'Majid Al Futtaim',
    industry: 'Retail & Entertainment',
    tier: 'key',
    healthScore: 90,
    annualValue: 1120000,
    keyContact: 'Hessa Al-Futtaim',
    nextMilestone: 'Commerce Module Launch',
    daysUntilRenewal: 310,
    adoptedProducts: ['crm', 'analytics', 'marketing', 'commerce', 'support'],
    crossSellScore: 45,
    recommendedProduct: 'Integrations',
    goals: [
      { title: 'Omnichannel customer engagement', description: 'Unified experience across malls, retail, and entertainment.', progress: 75 },
      { title: 'Loyalty program integration', description: 'Connect Share rewards with CRM insights.', progress: 60 },
    ],
    milestones: [
      { title: 'Full Platform Adoption', date: '2025-04-01', status: 'completed', description: 'All 5 modules deployed.' },
      { title: 'Loyalty Integration', date: '2025-11-15', status: 'completed', description: 'Share rewards connected.' },
      { title: 'Commerce Module Launch', date: '2026-04-15', status: 'in-progress', description: 'Online marketplace integration.' },
    ],
    risks: [
      { title: 'Data privacy regulations (PDPL)', severity: 'low', mitigation: 'Already compliant; monitor updates.' },
    ],
    competitors: [
      { name: 'Adobe Experience Cloud', strength: 'Strong marketing capabilities', threatLevel: 3 },
    ],
    actionItems: [
      { action: 'Demo commerce module to marketing team', owner: 'Khalid Saeed', dueDate: '2026-03-28', status: 'pending', priority: 'medium' },
    ],
  },
  {
    id: 7,
    company: 'Noon Payments',
    industry: 'Fintech',
    tier: 'growth',
    healthScore: 82,
    annualValue: 420000,
    keyContact: 'Reem Al-Awadhi',
    nextMilestone: 'Scaling Assessment',
    daysUntilRenewal: 175,
    adoptedProducts: ['crm', 'analytics'],
    crossSellScore: 80,
    recommendedProduct: 'Support Desk',
    goals: [
      { title: 'Scale CRM for merchant onboarding', description: 'Support 10,000+ merchant accounts with automated workflows.', progress: 48 },
    ],
    milestones: [
      { title: 'Pilot Deployment', date: '2025-09-01', status: 'completed', description: 'CRM deployed for top 500 merchants.' },
      { title: 'Scaling Assessment', date: '2026-04-01', status: 'in-progress', description: 'Performance review for mass rollout.' },
    ],
    risks: [
      { title: 'Rapid growth straining current tier', severity: 'medium', mitigation: 'Propose enterprise tier upgrade with volume pricing.' },
    ],
    competitors: [
      { name: 'HubSpot', strength: 'Lower cost entry point', threatLevel: 3 },
    ],
    actionItems: [
      { action: 'Prepare enterprise upgrade proposal', owner: 'Nadia Hamdan', dueDate: '2026-03-30', status: 'pending', priority: 'high' },
    ],
  },
  {
    id: 8,
    company: 'Talabat',
    industry: 'Food Delivery & Logistics',
    tier: 'growth',
    healthScore: 69,
    annualValue: 380000,
    keyContact: 'Yusuf Bahwan',
    nextMilestone: 'Feature Roadmap Alignment',
    daysUntilRenewal: 60,
    adoptedProducts: ['crm', 'support'],
    crossSellScore: 75,
    recommendedProduct: 'Analytics',
    goals: [
      { title: 'Automate restaurant partner management', description: 'Streamline onboarding and relationship management for 15,000+ partners.', progress: 35 },
    ],
    milestones: [
      { title: 'CRM Go-Live', date: '2025-07-01', status: 'completed', description: 'Core CRM for partner management.' },
      { title: 'Feature Roadmap Alignment', date: '2026-03-25', status: 'in-progress', description: 'Align product roadmap with partner needs.' },
    ],
    risks: [
      { title: 'Low engagement from ops team', severity: 'high', mitigation: 'Executive sponsor involvement and custom training.' },
      { title: 'Competitor offering free tier', severity: 'medium', mitigation: 'Demonstrate ROI with usage analytics.' },
    ],
    competitors: [
      { name: 'Freshworks', strength: 'Aggressive pricing for growth stage', threatLevel: 4 },
    ],
    actionItems: [
      { action: 'Conduct ops team engagement workshop', owner: 'Rashid Kamal', dueDate: '2026-03-20', status: 'in-progress', priority: 'high' },
      { action: 'Build ROI dashboard for account', owner: 'Sara Khalil', dueDate: '2026-04-05', status: 'pending', priority: 'medium' },
    ],
  },
  {
    id: 9,
    company: 'Careem',
    industry: 'Super App & Mobility',
    tier: 'growth',
    healthScore: 76,
    annualValue: 520000,
    keyContact: 'Dina Sharif',
    nextMilestone: 'API Integration Review',
    daysUntilRenewal: 140,
    adoptedProducts: ['crm', 'analytics', 'integration'],
    crossSellScore: 62,
    recommendedProduct: 'Marketing Hub',
    goals: [
      { title: 'Driver relationship management', description: 'CRM workflows for captain onboarding, engagement, and retention.', progress: 58 },
      { title: 'Cross-vertical analytics', description: 'Unified reporting across ride-hailing, delivery, and payments.', progress: 40 },
    ],
    milestones: [
      { title: 'Platform Onboarding', date: '2025-05-01', status: 'completed', description: 'Initial deployment for captain management.' },
      { title: 'API Integration Review', date: '2026-04-10', status: 'in-progress', description: 'Review API performance and scalability.' },
      { title: 'Marketing Hub Evaluation', date: '2026-07-01', status: 'pending', description: 'Assess marketing automation needs.' },
    ],
    risks: [
      { title: 'API rate limiting concerns', severity: 'medium', mitigation: 'Optimize API calls and implement caching layer.' },
    ],
    competitors: [
      { name: 'Zoho', strength: 'Cost-effective all-in-one suite', threatLevel: 2 },
    ],
    actionItems: [
      { action: 'Deliver API performance optimization report', owner: 'Layla Mansour', dueDate: '2026-04-05', status: 'pending', priority: 'high' },
    ],
  },
  {
    id: 10,
    company: 'Gulf Insurance Group',
    industry: 'Insurance',
    tier: 'standard',
    healthScore: 65,
    annualValue: 185000,
    keyContact: 'Nora Al-Sabah',
    nextMilestone: 'Usage Review',
    daysUntilRenewal: 95,
    adoptedProducts: ['crm'],
    crossSellScore: 90,
    recommendedProduct: 'Analytics',
    goals: [
      { title: 'Digitize policy holder management', description: 'Move from spreadsheets to CRM for all policy tracking.', progress: 30 },
    ],
    milestones: [
      { title: 'CRM Pilot', date: '2025-10-01', status: 'completed', description: 'Pilot with motor insurance division.' },
      { title: 'Usage Review', date: '2026-04-01', status: 'in-progress', description: 'Assess adoption and plan expansion.' },
    ],
    risks: [
      { title: 'Very low adoption outside pilot team', severity: 'high', mitigation: 'Assign customer success manager for hands-on training.' },
      { title: 'IT team prefers in-house solution', severity: 'medium', mitigation: 'Demonstrate integration capabilities and time-to-value.' },
    ],
    competitors: [
      { name: 'Guidewire', strength: 'Insurance-specific platform', threatLevel: 3 },
      { name: 'In-house development', strength: 'Full control over customization', threatLevel: 4 },
    ],
    actionItems: [
      { action: 'Assign dedicated CSM', owner: 'Ahmad Nasser', dueDate: '2026-03-08', status: 'completed', priority: 'high' },
      { action: 'Prepare adoption benchmarking report', owner: 'Omar Farid', dueDate: '2026-03-28', status: 'in-progress', priority: 'medium' },
    ],
  },
];

// ---- Data: Stakeholders ----
const stakeholders = ref<any[]>([]);

const fallbackStakeholders = [
  { name: 'Sultan Al-Harbi', title: 'Chief Digital Officer', company: 'Aramco Digital', accountId: 1, role: 'Executive Sponsor', influence: 'champion', engagementScore: 95, lastContact: '2026-02-28' },
  { name: 'Laila Al-Ghanim', title: 'VP Engineering', company: 'Aramco Digital', accountId: 1, role: 'Technical Decision Maker', influence: 'champion', engagementScore: 88, lastContact: '2026-02-25' },
  { name: 'Faisal Barakat', title: 'CFO', company: 'Aramco Digital', accountId: 1, role: 'Budget Holder', influence: 'sponsor', engagementScore: 62, lastContact: '2026-01-15' },
  { name: 'Fatima Al-Mazrouei', title: 'Head of Digital Banking', company: 'Emirates NBD', accountId: 2, role: 'Project Owner', influence: 'champion', engagementScore: 91, lastContact: '2026-02-26' },
  { name: 'Hassan Darwish', title: 'CTO', company: 'Emirates NBD', accountId: 2, role: 'Technical Evaluator', influence: 'evaluator', engagementScore: 73, lastContact: '2026-02-10' },
  { name: 'Mohammed Al-Suwaidi', title: 'VP Customer Experience', company: 'Etisalat (e&)', accountId: 3, role: 'Executive Sponsor', influence: 'sponsor', engagementScore: 80, lastContact: '2026-02-20' },
  { name: 'Aisha Khalid', title: 'IT Director', company: 'Etisalat (e&)', accountId: 3, role: 'Technical Gatekeeper', influence: 'blocker', engagementScore: 45, lastContact: '2026-01-30' },
  { name: 'Abdullah Al-Rajhi', title: 'Head of Innovation', company: 'Al Rajhi Bank', accountId: 4, role: 'Innovation Lead', influence: 'champion', engagementScore: 85, lastContact: '2026-02-22' },
  { name: 'Tariq Al-Dosari', title: 'Director of Operations', company: 'SABIC', accountId: 5, role: 'Operations Lead', influence: 'evaluator', engagementScore: 58, lastContact: '2026-02-18' },
  { name: 'Mansour Hakeem', title: 'CIO', company: 'SABIC', accountId: 5, role: 'IT Decision Maker', influence: 'blocker', engagementScore: 40, lastContact: '2026-01-05' },
  { name: 'Hessa Al-Futtaim', title: 'Chief Marketing Officer', company: 'Majid Al Futtaim', accountId: 6, role: 'Executive Sponsor', influence: 'champion', engagementScore: 93, lastContact: '2026-02-27' },
  { name: 'Reem Al-Awadhi', title: 'VP Product', company: 'Noon Payments', accountId: 7, role: 'Product Owner', influence: 'champion', engagementScore: 78, lastContact: '2026-02-24' },
  { name: 'Yusuf Bahwan', title: 'Head of Partnerships', company: 'Talabat', accountId: 8, role: 'Partnership Lead', influence: 'evaluator', engagementScore: 55, lastContact: '2026-02-05' },
  { name: 'Dina Sharif', title: 'Director of Engineering', company: 'Careem', accountId: 9, role: 'Technical Lead', influence: 'sponsor', engagementScore: 82, lastContact: '2026-02-21' },
  { name: 'Karim Nabil', title: 'VP Growth', company: 'Careem', accountId: 9, role: 'Business Sponsor', influence: 'champion', engagementScore: 70, lastContact: '2026-02-14' },
  { name: 'Nora Al-Sabah', title: 'Digital Transformation Manager', company: 'Gulf Insurance Group', accountId: 10, role: 'Project Lead', influence: 'evaluator', engagementScore: 50, lastContact: '2026-02-08' },
  { name: 'Waleed Jassim', title: 'CTO', company: 'Gulf Insurance Group', accountId: 10, role: 'IT Decision Maker', influence: 'blocker', engagementScore: 32, lastContact: '2025-12-20' },
  { name: 'Salma Osman', title: 'VP Sales', company: 'Noon Payments', accountId: 7, role: 'Revenue Owner', influence: 'sponsor', engagementScore: 68, lastContact: '2026-02-12' },
  { name: 'Basem Farouq', title: 'Procurement Manager', company: 'Al Rajhi Bank', accountId: 4, role: 'Procurement Lead', influence: 'evaluator', engagementScore: 60, lastContact: '2026-02-16' },
  { name: 'Mariam Haddad', title: 'COO', company: 'Talabat', accountId: 8, role: 'Operations Sponsor', influence: 'sponsor', engagementScore: 48, lastContact: '2026-01-22' },
];

// ---- Data: Forecast ----
const forecastData = ref<any[]>([]);

const fallbackForecastData = [
  { quarter: 'Q1 2026', pipelineValue: 4850000, weightedForecast: 3280000, bestCase: 4120000, committed: 2750000, target: 3500000, gapToTarget: -530000, probability: 76 },
  { quarter: 'Q2 2026', pipelineValue: 5320000, weightedForecast: 3150000, bestCase: 4580000, committed: 2100000, target: 3800000, gapToTarget: 650000, probability: 58 },
  { quarter: 'Q3 2026', pipelineValue: 4180000, weightedForecast: 2290000, bestCase: 3650000, committed: 1450000, target: 3600000, gapToTarget: 1310000, probability: 42 },
  { quarter: 'Q4 2026', pipelineValue: 6100000, weightedForecast: 2800000, bestCase: 5200000, committed: 980000, target: 4200000, gapToTarget: 1400000, probability: 35 },
];

// ---- API Data Loading ----
async function loadAccountPlans() {
  try {
    const res = await useApiFetch('account-plans');
    if (res.success && res.body) {
      const data = res.body as any;
      // API returns { docs, pagination } for paginated results
      accountPlans.value = data.docs || data || [];
    } else {
      accountPlans.value = fallbackAccountPlans;
    }
  } catch {
    accountPlans.value = fallbackAccountPlans;
  }
}

async function loadStakeholders() {
  try {
    // Load stakeholders for all plans; if a specific plan is selected, filter later
    // The API needs an account plan ID, so we aggregate from all plans
    const allStakeholders: any[] = [];
    for (const plan of accountPlans.value) {
      try {
        const res = await useApiFetch(`account-plans/${plan.id}/stakeholders`);
        if (res.success && res.body) {
          const data = Array.isArray(res.body) ? res.body : (res.body as any).docs || [];
          allStakeholders.push(...data);
        }
      } catch {
        // Skip individual plan failures
      }
    }
    if (allStakeholders.length > 0) {
      stakeholders.value = allStakeholders;
    } else {
      stakeholders.value = fallbackStakeholders;
    }
  } catch {
    stakeholders.value = fallbackStakeholders;
  }
}

async function loadForecastData() {
  try {
    const res = await useApiFetch('account-plans/forecast');
    if (res.success && res.body) {
      const data = res.body as any;
      forecastData.value = Array.isArray(data) ? data : data.docs || [];
    } else {
      forecastData.value = fallbackForecastData;
    }
  } catch {
    forecastData.value = fallbackForecastData;
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
    plans = plans.filter(p =>
      p.company.toLowerCase().includes(q) ||
      p.industry.toLowerCase().includes(q) ||
      p.keyContact.toLowerCase().includes(q)
    );
  }
  return plans;
});

const whitespaceData = computed(() => {
  return filteredPlans.value.map(plan => ({
    company: plan.company,
    tier: plan.tier,
    adoptedProducts: plan.adoptedProducts,
    crossSellScore: plan.crossSellScore,
    recommendedProduct: plan.recommendedProduct,
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
  const renewalPipeline = plans
    .filter(p => p.daysUntilRenewal <= 120)
    .reduce((sum, p) => sum + p.annualValue, 0);

  return [
    { key: 'totalValue', label: t('accountPlanning.totalAccountValue'), value: formatCurrency(totalValue), icon: 'ph:currency-dollar-bold', color: '#7849ff', trend: 12.4 },
    { key: 'activePlans', label: t('accountPlanning.activePlans'), value: activePlans.toString(), icon: 'ph:file-text-bold', color: '#3b82f6', trend: 8.3 },
    { key: 'crossSell', label: t('accountPlanning.crossSellOpportunities'), value: crossSellOps.toString(), icon: 'ph:arrows-out-bold', color: '#22c55e', trend: 15.2 },
    { key: 'avgHealth', label: t('accountPlanning.avgHealthScore'), value: avgHealth + '%', icon: 'ph:heartbeat-bold', color: '#f59e0b', trend: -2.1 },
    { key: 'renewalPipeline', label: t('accountPlanning.renewalPipeline'), value: formatCurrency(renewalPipeline), icon: 'ph:arrows-clockwise-bold', color: '#06b6d4', trend: 5.7 },
  ];
});

// ---- Helpers ----
function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTierType(tier: string): string {
  const map: Record<string, string> = {
    strategic: 'danger',
    key: 'warning',
    growth: 'success',
    standard: 'info',
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
    blocker: 'danger',
  };
  return map[influence] || 'info';
}

function getAvatarColor(index: number): string {
  const colors = ['#7849ff', '#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#f97316', '#ef4444', '#ec4899'];
  return colors[index % colors.length] || '#7849ff';
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function openPlanDetail(plan: any) {
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
      renewalDate: newPlanForm.value.renewalDate,
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
    renewalDate: null,
  };
}

function getForecastSummary({ columns, data }: { columns: any[]; data: any[] }) {
  const sums: string[] = [];
  columns.forEach((col: any, index: number) => {
    if (index === 0) {
      sums.push(t('accountPlanning.total'));
      return;
    }
    const prop = col.property;
    if (prop && typeof data[0]?.[prop] === 'number') {
      const total = data.reduce((sum: number, row: any) => sum + (row[prop] || 0), 0);
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
