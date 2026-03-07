<template lang="pug">
.ai-lead-scoring-page.p-6(class="md:p-8")
  //- ╔══════════════════════════════════════════════════╗
  //- ║  Page Header                                     ║
  //- ╚══════════════════════════════════════════════════╝
  .flex.items-start.justify-between.mb-8(class="flex-col md:flex-row md:items-center gap-4")
    div
      h2.text-3xl.font-bold.mb-1(style="color: var(--text-primary)")
        Icon.mr-2(name="ph:brain-bold" size="28" style="color: #7849ff")
        | {{ $t('aiLeadScoring.title') }}
      p(style="color: var(--text-muted)") {{ $t('aiLeadScoring.subtitle') }}
    .flex.items-center.gap-3(class="flex-wrap")
      .model-status-badge(:class="modelStatus === 'active' ? 'status-active' : 'status-training'")
        .status-dot
        span {{ modelStatus === 'active' ? $t('aiLeadScoring.modelActive') : $t('aiLeadScoring.modelTraining') }}
      .text-xs(style="color: var(--text-muted)")
        | {{ $t('aiLeadScoring.lastTrained') }}: {{ lastTrainedAt }}
      el-button(type="primary" @click="showModelConfigDialog = true" class="!rounded-xl")
        Icon(name="ph:gear-six-bold" size="16")
        span.ml-1 {{ $t('aiLeadScoring.trainModel') }}

  //- ╔══════════════════════════════════════════════════╗
  //- ║  KPI Cards                                       ║
  //- ╚══════════════════════════════════════════════════╝
  .grid.gap-4.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5")
    .kpi-card(v-for="kpi in kpiCards" :key="kpi.key")
      .flex.items-center.justify-between.mb-3
        .w-11.h-11.rounded-xl.flex.items-center.justify-center(:style="{ background: kpi.color + '18' }")
          Icon(:name="kpi.icon" size="22" :style="{ color: kpi.color }")
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

  //- ╔══════════════════════════════════════════════════╗
  //- ║  Main Tabs                                       ║
  //- ╚══════════════════════════════════════════════════╝
  el-tabs(v-model="activeTab" class="scoring-tabs")
    //- ── Tab 1: Lead Scoring ──────────────────────────
    el-tab-pane(:label="$t('aiLeadScoring.leadScoring')" name="scoring")
      .glass-card.p-6.rounded-2xl
        .flex.items-center.justify-between.mb-4(class="flex-wrap gap-3")
          .flex.items-center.gap-3
            el-input(
              v-model="leadSearch"
              :placeholder="$t('aiLeadScoring.searchLeads')"
              prefix-icon="Search"
              clearable
              style="width: 260px"
            )
            el-select(v-model="priorityFilter" :placeholder="$t('aiLeadScoring.allPriorities')" clearable style="width: 160px")
              el-option(:label="$t('aiLeadScoring.hot')" value="hot")
              el-option(:label="$t('aiLeadScoring.warm')" value="warm")
              el-option(:label="$t('aiLeadScoring.cold')" value="cold")
          el-button(@click="rescoreAll" :loading="rescoring")
            Icon(name="ph:arrows-clockwise-bold" size="16")
            span.ml-1 {{ $t('aiLeadScoring.rescoreAll') }}

        el-table(:data="filteredLeads" stripe style="width: 100%" @row-click="openLeadDetail" :empty-text="$t('common.noData')")
          el-table-column(:label="$t('aiLeadScoring.leadName')" min-width="180" sortable prop="name")
            template(#default="scope")
              .flex.items-center.gap-2
                .lead-avatar(:style="{ background: getAvatarColor(scope.$index) }") {{ getInitials(scope.row.name) }}
                div
                  p.font-medium {{ scope.row.name }}
                  p.text-xs(style="color: var(--text-muted)") {{ scope.row.email }}

          el-table-column(:label="$t('aiLeadScoring.company')" min-width="140" prop="company")

          el-table-column(:label="$t('aiLeadScoring.score')" min-width="160" sortable prop="score")
            template(#default="scope")
              .flex.items-center.gap-2
                el-progress(
                  :percentage="scope.row.score"
                  :stroke-width="10"
                  :color="getScoreColor(scope.row.score)"
                  style="width: 100px"
                )
                span.font-bold.text-sm(:style="{ color: getScoreColor(scope.row.score) }") {{ scope.row.score }}

          el-table-column(:label="$t('aiLeadScoring.percentile')" min-width="100" align="center" sortable prop="percentile")
            template(#default="scope")
              span.font-semibold {{ scope.row.percentile }}%

          el-table-column(:label="$t('aiLeadScoring.conversionProb')" min-width="130" align="center" sortable prop="conversionProb")
            template(#default="scope")
              el-tag(
                :type="scope.row.conversionProb >= 70 ? 'success' : scope.row.conversionProb >= 40 ? 'warning' : 'info'"
                size="small"
                round
                effect="plain"
              ) {{ scope.row.conversionProb }}%

          el-table-column(:label="$t('aiLeadScoring.recommendedAction')" min-width="140" align="center")
            template(#default="scope")
              el-tag(:type="getActionTagType(scope.row.action)" size="small" effect="dark" round)
                Icon(:name="getActionIcon(scope.row.action)" size="14" class="mr-1")
                | {{ $t('aiLeadScoring.actions.' + scope.row.action) }}

          el-table-column(:label="$t('aiLeadScoring.priority')" min-width="100" align="center" sortable prop="priorityOrder")
            template(#default="scope")
              .priority-badge(:class="'priority-' + scope.row.priority")
                | {{ $t('aiLeadScoring.' + scope.row.priority) }}

          el-table-column(:label="$t('aiLeadScoring.assignedTo')" min-width="130")
            template(#default="scope")
              span {{ scope.row.assignedTo }}

    //- ── Tab 2: Feature Importance ────────────────────
    el-tab-pane(:label="$t('aiLeadScoring.featureImportance')" name="features")
      .glass-card.p-6.rounded-2xl
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold.flex.items-center.gap-2(style="color: var(--text-primary)")
            Icon(name="ph:ranking-bold" size="20" style="color: #7849ff")
            | {{ $t('aiLeadScoring.scoringFactors') }}
          el-tag(effect="plain" round) {{ featureImportance.length }} {{ $t('aiLeadScoring.factors') }}

        el-table(:data="featureImportance" stripe style="width: 100%" :empty-text="$t('common.noData')")
          el-table-column(:label="$t('aiLeadScoring.rank')" width="80" align="center")
            template(#default="scope")
              .rank-number {{ scope.$index + 1 }}

          el-table-column(:label="$t('aiLeadScoring.featureName')" min-width="200" prop="name")
            template(#default="scope")
              .flex.items-center.gap-2
                Icon(:name="scope.row.icon" size="18" :style="{ color: scope.row.color }")
                span.font-medium {{ scope.row.name }}

          el-table-column(:label="$t('aiLeadScoring.importanceWeight')" min-width="220")
            template(#default="scope")
              .flex.items-center.gap-3
                el-progress(
                  :percentage="scope.row.weight"
                  :stroke-width="12"
                  :color="scope.row.color"
                  style="flex: 1"
                )
                span.font-bold.text-sm(style="width: 44px; text-align: right") {{ scope.row.weight }}%

          el-table-column(:label="$t('aiLeadScoring.trend')" min-width="100" align="center")
            template(#default="scope")
              .flex.items-center.justify-center.gap-1
                Icon(
                  :name="scope.row.trend === 'up' ? 'ph:trend-up-bold' : 'ph:trend-down-bold'"
                  size="16"
                  :style="{ color: scope.row.trend === 'up' ? '#22c55e' : '#ef4444' }"
                )
                span.text-xs.font-semibold(
                  :style="{ color: scope.row.trend === 'up' ? '#22c55e' : '#ef4444' }"
                ) {{ scope.row.trendValue }}

          el-table-column(:label="$t('aiLeadScoring.contribution')" min-width="140" align="center")
            template(#default="scope")
              span.font-medium {{ scope.row.contribution }}%

    //- ── Tab 3: Model Performance ─────────────────────
    el-tab-pane(:label="$t('aiLeadScoring.modelPerformance')" name="performance")
      .glass-card.p-6.rounded-2xl
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold.flex.items-center.gap-2(style="color: var(--text-primary)")
            Icon(name="ph:chart-bar-bold" size="20" style="color: #3b82f6")
            | {{ $t('aiLeadScoring.modelComparison') }}
          el-button(size="small" @click="showModelConfigDialog = true")
            Icon(name="ph:plus-bold" size="14")
            span.ml-1 {{ $t('aiLeadScoring.newModel') }}

        el-table(:data="models" stripe style="width: 100%" :empty-text="$t('common.noData')")
          el-table-column(:label="$t('aiLeadScoring.modelName')" min-width="180" prop="name")
            template(#default="scope")
              .flex.items-center.gap-2
                .model-indicator(:style="{ background: scope.row.statusColor }")
                span.font-semibold {{ scope.row.name }}

          el-table-column(:label="$t('aiLeadScoring.accuracy')" min-width="120" align="center" sortable prop="accuracy")
            template(#default="scope")
              span.font-bold(:style="{ color: scope.row.accuracy >= 90 ? '#22c55e' : scope.row.accuracy >= 80 ? '#f59e0b' : '#ef4444' }")
                | {{ scope.row.accuracy }}%

          el-table-column(:label="$t('aiLeadScoring.precision')" min-width="110" align="center" sortable prop="precision")
            template(#default="scope")
              span {{ scope.row.precision }}%

          el-table-column(:label="$t('aiLeadScoring.recall')" min-width="100" align="center" sortable prop="recall")
            template(#default="scope")
              span {{ scope.row.recall }}%

          el-table-column(:label="$t('aiLeadScoring.f1Score')" min-width="100" align="center" sortable prop="f1")
            template(#default="scope")
              span.font-semibold {{ scope.row.f1 }}

          el-table-column(:label="$t('aiLeadScoring.aucRoc')" min-width="110" align="center" sortable prop="aucRoc")
            template(#default="scope")
              el-tooltip(:content="$t('aiLeadScoring.aucRocTooltip')" placement="top")
                span.font-semibold(:style="{ color: scope.row.aucRoc >= 0.9 ? '#22c55e' : '#f59e0b' }") {{ scope.row.aucRoc.toFixed(3) }}

          el-table-column(:label="$t('aiLeadScoring.status')" min-width="120" align="center")
            template(#default="scope")
              el-tag(
                :type="scope.row.status === 'active' ? 'success' : scope.row.status === 'testing' ? 'warning' : 'info'"
                size="small"
                round
              ) {{ $t('aiLeadScoring.modelStatuses.' + scope.row.status) }}

    //- ── Tab 4: A/B Testing ───────────────────────────
    el-tab-pane(:label="$t('aiLeadScoring.abTesting')" name="abtesting")
      .space-y-6
        .glass-card.p-6.rounded-2xl(v-for="(test, tIdx) in abTests" :key="tIdx")
          .flex.items-center.justify-between.mb-4(class="flex-wrap gap-3")
            div
              h3.text-lg.font-bold(style="color: var(--text-primary)") {{ test.name }}
              p.text-xs(style="color: var(--text-muted)") {{ test.dateRange }}
            .flex.items-center.gap-3
              el-tag(
                :type="test.significance >= 95 ? 'success' : test.significance >= 90 ? 'warning' : 'info'"
                size="small"
                round
                effect="plain"
              )
                | {{ $t('aiLeadScoring.significance') }}: {{ test.significance }}%
              el-tag(
                v-if="test.winner"
                type="success"
                size="small"
                round
                effect="dark"
              )
                Icon(name="ph:trophy-bold" size="14" class="mr-1")
                | {{ $t('aiLeadScoring.winner') }}: {{ test.winner }}

          .grid.gap-6(class="grid-cols-1 md:grid-cols-2")
            .ab-variant-card(
              v-for="(variant, vIdx) in test.variants"
              :key="vIdx"
              :class="{ 'variant-winner': test.winner === variant.name }"
            )
              .flex.items-center.justify-between.mb-3
                h4.font-bold.text-base(:style="{ color: variant.color }") {{ variant.name }}
                el-tag(v-if="test.winner === variant.name" type="success" size="small" round)
                  Icon(name="ph:crown-bold" size="12" class="mr-1")
                  | {{ $t('aiLeadScoring.winner') }}
              .grid.gap-4(class="grid-cols-2")
                div
                  p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('aiLeadScoring.conversionRate') }}
                  p.text-xl.font-bold(:style="{ color: variant.color }") {{ variant.conversionRate }}%
                div
                  p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('aiLeadScoring.sampleSize') }}
                  p.text-xl.font-bold(style="color: var(--text-primary)") {{ variant.sampleSize.toLocaleString() }}
                div
                  p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('aiLeadScoring.leadsScored') }}
                  p.text-xl.font-bold(style="color: var(--text-primary)") {{ variant.leadsScored.toLocaleString() }}
                div
                  p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('aiLeadScoring.avgScore') }}
                  p.text-xl.font-bold(style="color: var(--text-primary)") {{ variant.avgScore }}

    //- ── Tab 5: Scoring Rules ─────────────────────────
    el-tab-pane(:label="$t('aiLeadScoring.scoringRules')" name="rules")
      .glass-card.p-6.rounded-2xl
        .flex.items-center.justify-between.mb-4(class="flex-wrap gap-3")
          h3.text-lg.font-bold.flex.items-center.gap-2(style="color: var(--text-primary)")
            Icon(name="ph:sliders-horizontal-bold" size="20" style="color: #f59e0b")
            | {{ $t('aiLeadScoring.configurableRules') }}
          el-button(type="primary" size="small" @click="addNewRule")
            Icon(name="ph:plus-bold" size="14")
            span.ml-1 {{ $t('aiLeadScoring.addRule') }}

        el-table(:data="scoringRules" stripe style="width: 100%" :empty-text="$t('common.noData')")
          el-table-column(:label="$t('aiLeadScoring.ruleName')" min-width="200" prop="name")
            template(#default="scope")
              span.font-semibold {{ scope.row.name }}

          el-table-column(:label="$t('aiLeadScoring.condition')" min-width="260")
            template(#default="scope")
              el-tag(type="info" size="small" effect="plain") {{ scope.row.condition }}

          el-table-column(:label="$t('aiLeadScoring.pointsAwarded')" min-width="130" align="center" sortable prop="points")
            template(#default="scope")
              span.font-bold(:style="{ color: scope.row.points >= 0 ? '#22c55e' : '#ef4444' }")
                | {{ scope.row.points >= 0 ? '+' : '' }}{{ scope.row.points }}

          el-table-column(:label="$t('aiLeadScoring.overridePriority')" min-width="130" align="center" sortable prop="priority")
            template(#default="scope")
              el-tag(
                :type="scope.row.priority <= 3 ? 'danger' : scope.row.priority <= 6 ? 'warning' : 'info'"
                size="small"
                round
              ) {{ scope.row.priority }}

          el-table-column(:label="$t('aiLeadScoring.ruleStatus')" min-width="120" align="center")
            template(#default="scope")
              el-switch(
                v-model="scope.row.enabled"
                :active-text="$t('aiLeadScoring.enabled')"
                inactive-text=""
                inline-prompt
              )

  //- ╔══════════════════════════════════════════════════╗
  //- ║  Lead Detail Dialog                              ║
  //- ╚══════════════════════════════════════════════════╝
  el-dialog(
    v-model="showLeadDialog"
    :title="$t('aiLeadScoring.leadAnalysis')"
    width="720px"
    top="5vh"
  )
    template(v-if="selectedLead")
      .mb-6
        .flex.items-center.gap-4.mb-4
          .lead-detail-avatar(:style="{ background: '#7849ff' }") {{ getInitials(selectedLead.name) }}
          div
            h3.text-xl.font-bold(style="color: var(--text-primary)") {{ selectedLead.name }}
            p.text-sm(style="color: var(--text-muted)") {{ selectedLead.company }} &mdash; {{ selectedLead.email }}

        //- Score Breakdown
        .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
          .detail-stat-card
            p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('aiLeadScoring.overallScore') }}
            p.text-2xl.font-bold(:style="{ color: getScoreColor(selectedLead.score) }") {{ selectedLead.score }}
          .detail-stat-card
            p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('aiLeadScoring.percentile') }}
            p.text-2xl.font-bold(style="color: #3b82f6") {{ selectedLead.percentile }}%
          .detail-stat-card
            p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('aiLeadScoring.conversionProb') }}
            p.text-2xl.font-bold(style="color: #22c55e") {{ selectedLead.conversionProb }}%
          .detail-stat-card
            p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('aiLeadScoring.priority') }}
            .priority-badge(:class="'priority-' + selectedLead.priority")
              | {{ $t('aiLeadScoring.' + selectedLead.priority) }}

        //- Score Breakdown Factors
        h4.font-bold.mb-3(style="color: var(--text-primary)") {{ $t('aiLeadScoring.scoreBreakdown') }}
        .space-y-2.mb-6
          .breakdown-row(v-for="(factor, fIdx) in selectedLead.breakdown" :key="fIdx")
            .flex.items-center.justify-between
              span.text-sm.font-medium(style="color: var(--text-primary)") {{ factor.name }}
              span.text-sm.font-bold(:style="{ color: factor.points >= 0 ? '#22c55e' : '#ef4444' }")
                | {{ factor.points >= 0 ? '+' : '' }}{{ factor.points }}
            el-progress(
              :percentage="Math.abs(factor.points)"
              :stroke-width="6"
              :color="factor.points >= 0 ? '#22c55e' : '#ef4444'"
              :show-text="false"
            )

        //- Activity Timeline
        h4.font-bold.mb-3(style="color: var(--text-primary)") {{ $t('aiLeadScoring.activityTimeline') }}
        .timeline-container
          .timeline-item(v-for="(event, eIdx) in selectedLead.timeline" :key="eIdx")
            .timeline-dot(:style="{ background: event.color }")
            .timeline-content
              .flex.items-center.justify-between
                span.text-sm.font-medium(style="color: var(--text-primary)") {{ event.action }}
                span.text-xs(style="color: var(--text-muted)") {{ event.date }}
              p.text-xs(style="color: var(--text-secondary)") {{ event.detail }}

        //- Next Best Actions
        h4.font-bold.mb-3.mt-6(style="color: var(--text-primary)") {{ $t('aiLeadScoring.nextBestActions') }}
        .grid.gap-3(class="grid-cols-1 md:grid-cols-3")
          .action-suggestion-card(v-for="(action, aIdx) in selectedLead.suggestedActions" :key="aIdx")
            .flex.items-center.gap-2.mb-2
              Icon(:name="action.icon" size="18" :style="{ color: action.color }")
              span.font-semibold.text-sm(:style="{ color: action.color }") {{ action.title }}
            p.text-xs(style="color: var(--text-muted)") {{ action.description }}

  //- ╔══════════════════════════════════════════════════╗
  //- ║  Model Config Dialog                             ║
  //- ╚══════════════════════════════════════════════════╝
  el-dialog(
    v-model="showModelConfigDialog"
    :title="$t('aiLeadScoring.modelConfiguration')"
    width="600px"
    top="5vh"
  )
    el-form(:model="modelConfig" label-position="top")
      el-form-item(:label="$t('aiLeadScoring.modelType')")
        el-select(v-model="modelConfig.modelType" style="width: 100%")
          el-option(:label="$t('aiLeadScoring.gradientBoost')" value="gradient_boost")
          el-option(:label="$t('aiLeadScoring.neuralNetwork')" value="neural_net")
          el-option(:label="$t('aiLeadScoring.bayesian')" value="bayesian")
          el-option(:label="$t('aiLeadScoring.logisticRegression')" value="logistic_regression")
          el-option(:label="$t('aiLeadScoring.randomForest')" value="random_forest")

      el-form-item(:label="$t('aiLeadScoring.trainingDataRange')")
        el-date-picker(
          v-model="modelConfig.dateRange"
          type="daterange"
          :start-placeholder="$t('common.startDate')"
          :end-placeholder="$t('common.endDate')"
          style="width: 100%"
        )

      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('aiLeadScoring.learningRate')")
          el-slider(v-model="modelConfig.learningRate" :min="0.001" :max="0.1" :step="0.001" show-input)

        el-form-item(:label="$t('aiLeadScoring.epochs')")
          el-slider(v-model="modelConfig.epochs" :min="10" :max="500" :step="10" show-input)

      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('aiLeadScoring.batchSize')")
          el-select(v-model="modelConfig.batchSize" style="width: 100%")
            el-option(:label="'32'" :value="32")
            el-option(:label="'64'" :value="64")
            el-option(:label="'128'" :value="128")
            el-option(:label="'256'" :value="256")

        el-form-item(:label="$t('aiLeadScoring.validationSplit')")
          el-slider(v-model="modelConfig.validationSplit" :min="0.1" :max="0.4" :step="0.05" show-input)

      el-form-item(:label="$t('aiLeadScoring.featureSelection')")
        el-switch(v-model="modelConfig.autoFeatureSelection")
          template(#active-action)
            span {{ $t('aiLeadScoring.auto') }}
          template(#inactive-action)
            span {{ $t('aiLeadScoring.manual') }}

      el-alert(
        :title="$t('aiLeadScoring.trainWarning')"
        type="warning"
        show-icon
        :closable="false"
        class="mb-4"
      )

    template(#footer)
      el-button(@click="showModelConfigDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="startTraining" :loading="isTraining")
        Icon(name="ph:play-bold" size="14" class="mr-1")
        | {{ $t('aiLeadScoring.startTraining') }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'AI Lead Scoring' });

const { t } = useI18n();

const loading = ref(false);

// ─── State ──────────────────────────────────────────────────
const activeTab = ref('scoring');
const modelStatus = ref<'active' | 'training'>('active');
const lastTrainedAt = ref('2026-02-28 14:32');
const leadSearch = ref('');
const priorityFilter = ref('');
const rescoring = ref(false);
const isTraining = ref(false);
const showLeadDialog = ref(false);
const showModelConfigDialog = ref(false);
const selectedLead = ref<Record<string, unknown> | null>(null);

// ─── Model Config ───────────────────────────────────────────
const modelConfig = ref({
  modelType: 'gradient_boost',
  dateRange: null as [Date, Date] | null,
  learningRate: 0.01,
  epochs: 100,
  batchSize: 64,
  validationSplit: 0.2,
  autoFeatureSelection: true
});

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => [
  {
    key: 'accuracy',
    label: t('aiLeadScoring.modelAccuracy'),
    value: '94.2%',
    icon: 'ph:target-bold',
    color: '#7849ff',
    trend: 2.1
  },
  {
    key: 'scored',
    label: t('aiLeadScoring.leadsScoredToday'),
    value: '1,247',
    icon: 'ph:users-bold',
    color: '#3b82f6',
    trend: 8.4
  },
  {
    key: 'avg',
    label: t('aiLeadScoring.avgScoreLabel'),
    value: '62.8',
    icon: 'ph:chart-bar-bold',
    color: '#22c55e',
    trend: 3.7
  },
  {
    key: 'conversion',
    label: t('aiLeadScoring.conversionPrediction'),
    value: '38.5%',
    icon: 'ph:arrow-circle-up-bold',
    color: '#f59e0b',
    trend: 5.2
  },
  {
    key: 'distribution',
    label: t('aiLeadScoring.scoreDistribution'),
    value: '72/18/10',
    icon: 'ph:chart-pie-slice-bold',
    color: '#06b6d4',
    trend: 0
  }
]);

// ─── Leads Data ─────────────────────────────────────────────
const leads = ref<Record<string, unknown>[]>([]);

const filteredLeads = computed(() => {
  let result = leads.value;
  if (priorityFilter.value) {
    result = result.filter(l => l.priority === priorityFilter.value);
  }
  if (leadSearch.value) {
    const q = leadSearch.value.toLowerCase();
    result = result.filter(l => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q));
  }
  return result;
});

// ─── Feature Importance ─────────────────────────────────────
const featureImportance = ref<Record<string, unknown>[]>([]);

// ─── Models ─────────────────────────────────────────────────
const models = ref<Record<string, unknown>[]>([]);

// ─── A/B Tests ──────────────────────────────────────────────
const abTests = ref([
  {
    name: 'Gradient Boost v3.2 vs Neural Net v2.1',
    dateRange: 'Feb 1, 2026 - Feb 28, 2026',
    significance: 97,
    winner: 'Gradient Boost v3.2',
    variants: [
      { name: 'Gradient Boost v3.2', conversionRate: 38.5, sampleSize: 4200, leadsScored: 12600, avgScore: 64.2, color: '#7849ff' },
      { name: 'Neural Net v2.1', conversionRate: 35.8, sampleSize: 4150, leadsScored: 12450, avgScore: 61.7, color: '#3b82f6' }
    ]
  },
  {
    name: 'Bayesian v4.0 vs Random Forest v2.5',
    dateRange: 'Feb 10, 2026 - Mar 1, 2026',
    significance: 88,
    winner: null,
    variants: [
      { name: 'Bayesian v4.0', conversionRate: 32.1, sampleSize: 2800, leadsScored: 8400, avgScore: 58.9, color: '#22c55e' },
      { name: 'Random Forest v2.5', conversionRate: 33.4, sampleSize: 2750, leadsScored: 8250, avgScore: 60.1, color: '#f59e0b' }
    ]
  },
  {
    name: 'Enhanced Features vs Base Features',
    dateRange: 'Jan 15, 2026 - Feb 15, 2026',
    significance: 99,
    winner: 'Enhanced Features',
    variants: [
      { name: 'Enhanced Features', conversionRate: 41.2, sampleSize: 5100, leadsScored: 15300, avgScore: 67.8, color: '#ec4899' },
      { name: 'Base Features', conversionRate: 34.6, sampleSize: 5050, leadsScored: 15150, avgScore: 59.3, color: '#94a3b8' }
    ]
  }
]);

// ─── Scoring Rules ──────────────────────────────────────────
const scoringRules = ref([
  { name: 'High-Value Company', condition: 'Company revenue > $10M annually', points: 15, priority: 1, enabled: true },
  { name: 'Recent Website Activity', condition: 'Visited pricing page in last 7 days', points: 12, priority: 2, enabled: true },
  { name: 'Email Engagement', condition: 'Opened 3+ emails in last 14 days', points: 10, priority: 3, enabled: true },
  { name: 'Demo Request', condition: 'Submitted demo request form', points: 20, priority: 1, enabled: true },
  { name: 'Content Download', condition: 'Downloaded whitepaper or case study', points: 8, priority: 4, enabled: true },
  { name: 'Social Engagement', condition: 'Interacted with social media posts', points: 5, priority: 6, enabled: false },
  { name: 'Competitor Mention', condition: 'Mentioned competitor in communications', points: -5, priority: 5, enabled: true },
  { name: 'Unsubscribe Signal', condition: 'Unsubscribed from newsletter', points: -15, priority: 2, enabled: true }
]);

// ─── Helpers ────────────────────────────────────────────────
function getAvatarColor(index: number): string {
  const colors = ['#7849ff', '#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];
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

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getActionTagType(action: string): string {
  const map: Record<string, string> = { call: 'success', demo: 'primary', email: 'warning', nurture: 'info' };
  return map[action] || 'info';
}

function getActionIcon(action: string): string {
  const map: Record<string, string> = {
    call: 'ph:phone-bold',
    demo: 'ph:presentation-chart-bold',
    email: 'ph:envelope-bold',
    nurture: 'ph:plant-bold'
  };
  return map[action] || 'ph:circle-bold';
}

// ─── Actions ────────────────────────────────────────────────
function rescoreAll() {
  rescoring.value = true;
  setTimeout(() => {
    rescoring.value = false;
  }, 2000);
}

function openLeadDetail(row: unknown) {
  selectedLead.value = {
    ...row,
    breakdown: [
      { name: 'Website Engagement', points: 22 },
      { name: 'Email Interaction', points: 18 },
      { name: 'Company Fit', points: 15 },
      { name: 'Job Title Match', points: 12 },
      { name: 'Industry Alignment', points: 10 },
      { name: 'Social Signals', points: 8 },
      { name: 'Content Consumption', points: 6 },
      { name: 'Recency Decay', points: -3 }
    ],
    timeline: [
      { action: 'Visited pricing page', detail: 'Spent 4m 32s on Enterprise plan', date: '2h ago', color: '#7849ff' },
      { action: 'Opened email campaign', detail: '"Q1 Product Update" - Read for 2m 15s', date: '1d ago', color: '#3b82f6' },
      { action: 'Downloaded whitepaper', detail: '"AI in Enterprise CRM" (PDF, 24 pages)', date: '3d ago', color: '#22c55e' },
      { action: 'Attended webinar', detail: '"Predictive Analytics Demo" - Full session', date: '5d ago', color: '#f59e0b' },
      { action: 'LinkedIn interaction', detail: 'Liked and commented on product post', date: '1w ago', color: '#ec4899' }
    ],
    suggestedActions: [
      { title: t('aiLeadScoring.actions.call'), icon: 'ph:phone-bold', color: '#22c55e', description: t('aiLeadScoring.callSuggestion') },
      {
        title: t('aiLeadScoring.actions.demo'),
        icon: 'ph:presentation-chart-bold',
        color: '#7849ff',
        description: t('aiLeadScoring.demoSuggestion')
      },
      { title: t('aiLeadScoring.actions.email'), icon: 'ph:envelope-bold', color: '#3b82f6', description: t('aiLeadScoring.emailSuggestion') }
    ]
  };
  showLeadDialog.value = true;
}

function startTraining() {
  isTraining.value = true;
  modelStatus.value = 'training';
  setTimeout(() => {
    isTraining.value = false;
    modelStatus.value = 'active';
    lastTrainedAt.value = new Date().toLocaleString();
    showModelConfigDialog.value = false;
  }, 3000);
}

function addNewRule() {
  scoringRules.value.push({
    name: 'New Rule',
    condition: 'Define condition...',
    points: 5,
    priority: 5,
    enabled: false
  });
}

// ─── API Data Loading ───────────────────────────────────────
async function loadModels() {
  try {
    const res = await useApiFetch('ai-lead-scoring');
    if (res.success && Array.isArray(res.body)) {
      models.value = res.body as unknown;
    } else {
      models.value = [];
    }
  } catch {
    models.value = [];
  }
}

async function loadLeads() {
  try {
    // Try to score leads using the first active model, or fall back to the lead list
    const activeModel = models.value.find(m => m.status === 'active');
    if (activeModel && (activeModel as unknown).id) {
      const res = await useApiFetch(`ai-lead-scoring/${(activeModel as unknown).id}/score`, 'POST');
      if (res.success && Array.isArray(res.body)) {
        leads.value = res.body as unknown;
        return;
      }
    }
    // Fallback: try fetching from lead endpoint
    const res = await useApiFetch('lead');
    if (res.success && Array.isArray(res.body)) {
      leads.value = res.body as unknown;
    } else {
      leads.value = [];
    }
  } catch {
    leads.value = [];
  }
}

async function loadFeatureImportance() {
  try {
    const activeModel = models.value.find(m => m.status === 'active');
    if (activeModel && (activeModel as unknown).id) {
      const res = await useApiFetch(`ai-lead-scoring/${(activeModel as unknown).id}/feature-importance`);
      if (res.success && Array.isArray(res.body)) {
        featureImportance.value = res.body as unknown;
        return;
      }
    }
    featureImportance.value = [];
  } catch {
    featureImportance.value = [];
  }
}

async function loadData() {
  loading.value = true;
  try {
    // Load models first since leads and feature importance depend on the active model ID
    await loadModels();
    await Promise.all([loadLeads(), loadFeatureImportance()]);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.ai-lead-scoring-page {
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
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.12);
    border-color: rgba(120, 73, 255, 0.3);
  }
}

// ─── Model Status Badge ─────────────────────────────────────
.model-status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  &.status-active {
    background: rgba(34, 197, 94, 0.12);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);

    .status-dot {
      background: #22c55e;
      animation: pulse 2s infinite;
    }
  }

  &.status-training {
    background: rgba(245, 158, 11, 0.12);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);

    .status-dot {
      background: #f59e0b;
      animation: pulse 1s infinite;
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

// ─── Lead Avatar ────────────────────────────────────────────
.lead-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.72rem;
  flex-shrink: 0;
}

.lead-detail-avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

// ─── Priority Badges ────────────────────────────────────────
.priority-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.priority-hot {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  &.priority-warm {
    background: rgba(245, 158, 11, 0.12);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  &.priority-cold {
    background: rgba(148, 163, 184, 0.12);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }
}

// ─── Rank Number ────────────────────────────────────────────
.rank-number {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-secondary);
}

// ─── Model Indicator ────────────────────────────────────────
.model-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

// ─── A/B Testing Cards ──────────────────────────────────────
.ab-variant-card {
  padding: 1.25rem;
  border-radius: 14px;
  border: 1px solid var(--border-default);
  background: var(--bg-elevated);
  transition: all 0.3s ease;

  &.variant-winner {
    border-color: rgba(34, 197, 94, 0.4);
    background: rgba(34, 197, 94, 0.04);
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.08);
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(120, 73, 255, 0.08);
  }
}

// ─── Lead Detail Dialog ─────────────────────────────────────
.detail-stat-card {
  padding: 1rem;
  border-radius: 12px;
  background: rgba(120, 73, 255, 0.04);
  border: 1px solid var(--border-default);
  text-align: center;
}

.breakdown-row {
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(120, 73, 255, 0.02);
  border: 1px solid var(--border-default);
}

// ─── Timeline ───────────────────────────────────────────────
.timeline-container {
  position: relative;
  padding-left: 24px;

  &::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--border-default);
  }
}

.timeline-item {
  position: relative;
  padding-bottom: 16px;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--bg-elevated);
  box-shadow: 0 0 0 2px var(--border-default);
}

.timeline-content {
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.03);
  border: 1px solid var(--border-default);
}

// ─── Action Suggestion Cards ────────────────────────────────
.action-suggestion-card {
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border-default);
  background: var(--bg-elevated);
  transition: all 0.25s ease;
  cursor: pointer;

  &:hover {
    border-color: rgba(120, 73, 255, 0.4);
    box-shadow: 0 4px 16px rgba(120, 73, 255, 0.08);
    transform: translateY(-1px);
  }
}

// ─── Tabs Override ──────────────────────────────────────────
.scoring-tabs {
  :deep(.el-tabs__item) {
    font-weight: 600;
    font-size: 0.9rem;
  }

  :deep(.el-tabs__content) {
    padding-top: 16px;
  }
}

// ─── Responsive ─────────────────────────────────────────────
@media (max-width: 768px) {
  .kpi-card {
    padding: 1rem;
  }
}
</style>
