<template lang="pug">
div
  ModuleHeader(
    :title="$t('automationTemplates.title')"
    :subtitle="$t('automationTemplates.subtitle')"
  )

  //- Stats
  StatCards(:stats="summaryStats")

  //- Search + Filter Bar
  .glass-card.p-5.mb-8.animate-entrance
    .flex.flex-wrap.items-center.gap-4
      el-input(
        v-model="searchQuery"
        :placeholder="$t('automationTemplates.searchPlaceholder')"
        clearable
        size="large"
        class="!rounded-xl search-input"
        style="max-width: 360px; flex: 1"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .flex.items-center.gap-3.flex-wrap
        el-select(
          v-model="selectedCategory"
          clearable
          :placeholder="$t('automationTemplates.allCategories')"
          size="large"
          style="width: 200px"
        )
          el-option(
            v-for="cat in categoryOptions"
            :key="cat.value"
            :label="cat.label"
            :value="cat.value"
          )
            .flex.items-center.gap-2
              Icon(:name="cat.icon" size="16")
              span {{ cat.label }}

        el-select(
          v-model="selectedTrigger"
          clearable
          :placeholder="$t('automationTemplates.allTriggers')"
          size="large"
          style="width: 180px"
        )
          el-option(:label="$t('automationTemplates.event')" value="event")
          el-option(:label="$t('automationTemplates.schedule')" value="schedule")
          el-option(:label="$t('automationTemplates.condition')" value="condition")

        el-select(
          v-model="sortBy"
          size="large"
          style="width: 160px"
        )
          el-option(:label="$t('automationTemplates.popular')" value="popular")
          el-option(:label="$t('automationTemplates.newest')" value="newest")
          el-option(:label="$t('automationTemplates.az')" value="az")

  //- Category Tabs
  .flex.items-center.gap-3.mb-6.overflow-x-auto.pb-2
    button.category-chip(
      :class="{ active: selectedCategory === '' }"
      @click="selectedCategory = ''"
    )
      Icon(name="ph:squares-four-bold" size="16")
      span {{ $t('automationTemplates.all') }}
      span.chip-count {{ templates.length }}

    button.category-chip(
      v-for="cat in categoryOptions"
      :key="cat.value"
      :class="{ active: selectedCategory === cat.value }"
      @click="selectedCategory = cat.value"
    )
      Icon(:name="cat.icon" size="16")
      span {{ cat.label }}
      span.chip-count {{ templates.filter(t => t.category === cat.value).length }}

  //- Template Grid
  .template-grid(v-if="filteredTemplates.length")
    .template-card.animate-entrance(
      v-for="(tpl, idx) in filteredTemplates"
      :key="tpl.id"
      :style="{ animationDelay: `${idx * 0.04}s` }"
      @click="openTemplateDetail(tpl)"
    )
      //- Card Header
      .card-header
        .icon-wrapper(:style="{ background: tpl.color + '18' }")
          Icon(:name="tpl.icon" size="28" :style="{ color: tpl.color }")
        .flex.items-center.gap-2
          el-tag(
            size="small"
            effect="plain"
            :style="{ borderColor: triggerColor(tpl.triggerType), color: triggerColor(tpl.triggerType) }"
          )
            Icon(:name="triggerIcon(tpl.triggerType)" size="12" class="mr-1")
            | {{ $t(`automationTemplates.${tpl.triggerType}`) }}

      //- Card Body
      .card-body
        h3.template-title {{ $t(tpl.titleKey) }}
        p.template-desc {{ $t(tpl.descKey) }}

      //- Card Footer
      .card-footer
        .flex.items-center.gap-2
          el-tag(
            size="small"
            :type="categoryTagType(tpl.category)"
            effect="dark"
            round
          ) {{ $t(`automationTemplates.${tpl.category}`) }}

        .flex.items-center.gap-3
          .popularity-indicator
            Icon(name="ph:buildings-bold" size="14" style="color: var(--text-muted)")
            span.text-xs(style="color: var(--text-muted)") {{ tpl.popularity.toLocaleString() }}

          el-button(
            type="primary"
            size="small"
            class="!rounded-xl use-template-btn"
            @click.stop="openTemplateDetail(tpl)"
          )
            Icon(name="ph:play-bold" size="14" class="mr-1")
            | {{ $t('automationTemplates.useTemplate') }}

  //- Empty State
  .glass-card.p-16.text-center(v-else)
    .flex.flex-col.items-center.gap-4
      .w-20.h-20.rounded-3xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
        Icon(name="ph:magnifying-glass" size="40" style="color: var(--text-muted)")
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('automationTemplates.noResults') }}
      p.text-sm(style="color: var(--text-muted); max-width: 360px") {{ $t('automationTemplates.noResultsDesc') }}
      el-button(type="primary" class="!rounded-xl" @click="resetFilters")
        Icon(name="ph:arrow-counter-clockwise-bold" size="14" class="mr-1")
        | {{ $t('automationTemplates.clearFilters') }}

  //- Template Detail Dialog
  el-dialog(
    v-model="detailDialogVisible"
    :title="selectedTemplate ? $t(selectedTemplate.titleKey) : ''"
    width="780px"
    destroy-on-close
    class="template-detail-dialog"
  )
    template(v-if="selectedTemplate")
      //- Header with icon and meta
      .detail-header.mb-6
        .flex.items-center.gap-4.mb-4
          .icon-wrapper-lg(:style="{ background: selectedTemplate.color + '18' }")
            Icon(:name="selectedTemplate.icon" size="36" :style="{ color: selectedTemplate.color }")
          div
            h3.text-xl.font-bold(style="color: var(--text-primary)") {{ $t(selectedTemplate.titleKey) }}
            .flex.items-center.gap-3.mt-2
              el-tag(
                size="small"
                :type="categoryTagType(selectedTemplate.category)"
                effect="dark"
                round
              ) {{ $t(`automationTemplates.${selectedTemplate.category}`) }}
              el-tag(
                size="small"
                effect="plain"
                :style="{ borderColor: triggerColor(selectedTemplate.triggerType), color: triggerColor(selectedTemplate.triggerType) }"
              )
                Icon(:name="triggerIcon(selectedTemplate.triggerType)" size="12" class="mr-1")
                | {{ $t(`automationTemplates.${selectedTemplate.triggerType}`) }}
              .flex.items-center.gap-1
                Icon(name="ph:buildings-bold" size="14" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ $t('automationTemplates.usedByCompanies', { count: selectedTemplate.popularity.toLocaleString() }) }}

        p.text-sm(style="color: var(--text-secondary); line-height: 1.7") {{ $t(selectedTemplate.fullDescKey) }}

      //- Workflow Steps Diagram
      .glass-card.p-6.mb-6
        h4.text-base.font-bold.mb-5(style="color: var(--text-primary)")
          Icon(name="ph:flow-arrow-bold" size="18" class="mr-2" style="color: var(--accent-color, #7849ff)")
          | {{ $t('automationTemplates.workflowSteps') }}

        .workflow-diagram
          .workflow-step(
            v-for="(step, sIdx) in selectedTemplate.steps"
            :key="sIdx"
          )
            .step-connector(v-if="sIdx > 0")
              .connector-line
              Icon(name="ph:caret-down-bold" size="16" style="color: var(--accent-color, #7849ff)")

            .step-node(:class="`step-type-${step.type}`")
              .step-icon-wrapper(:style="{ background: stepColor(step.type) + '18' }")
                Icon(:name="stepIcon(step.type)" size="20" :style="{ color: stepColor(step.type) }")
              .step-content
                .flex.items-center.gap-2.mb-1
                  span.step-label {{ $t(step.labelKey) }}
                  el-tag(size="small" effect="plain" round) {{ $t(`automationTemplates.stepType_${step.type}`) }}
                p.step-description {{ $t(step.descKey) }}

              el-switch(
                v-model="stepToggles[sIdx]"
                size="small"
              )

      //- Configuration Form
      .glass-card.p-6.mb-6
        h4.text-base.font-bold.mb-5(style="color: var(--text-primary)")
          Icon(name="ph:sliders-horizontal-bold" size="18" class="mr-2" style="color: var(--accent-color, #7849ff)")
          | {{ $t('automationTemplates.customize') }}

        el-form(label-position="top")
          .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
            //- Trigger Config
            el-form-item(:label="$t('automationTemplates.triggerCondition')")
              el-select(v-model="config.triggerCondition" class="w-full" size="large")
                el-option(
                  v-for="opt in selectedTemplate.triggerOptions || defaultTriggerOptions"
                  :key="opt.value"
                  :label="$t(opt.labelKey)"
                  :value="opt.value"
                )

            //- Delay
            el-form-item(:label="$t('automationTemplates.delay')")
              .flex.items-center.gap-2
                el-input-number(v-model="config.delayValue" :min="0" :max="365" size="large" style="width: 120px")
                el-select(v-model="config.delayUnit" size="large" style="width: 140px")
                  el-option(:label="$t('automationTemplates.minutes')" value="minutes")
                  el-option(:label="$t('automationTemplates.hours')" value="hours")
                  el-option(:label="$t('automationTemplates.days')" value="days")

          //- Recipients
          el-form-item(:label="$t('automationTemplates.recipients')")
            el-select(
              v-model="config.recipients"
              multiple
              filterable
              allow-create
              default-first-option
              :placeholder="$t('automationTemplates.recipientsPlaceholder')"
              size="large"
              class="w-full"
            )
              el-option(:label="$t('automations.owner')" value="owner")
              el-option(:label="$t('automations.teamLead')" value="team_lead")
              el-option(:label="$t('automations.salesManager')" value="sales_manager")
              el-option(:label="$t('automations.allTeam')" value="all_team")
              el-option(:label="$t('automations.admin')" value="admin")

          //- Additional Notes
          el-form-item(:label="$t('automationTemplates.notes')")
            el-input(
              v-model="config.notes"
              type="textarea"
              :rows="2"
              :placeholder="$t('automationTemplates.notesPlaceholder')"
              size="large"
            )

    template(#footer)
      .flex.items-center.justify-between.w-full
        .flex.items-center.gap-2
          Icon(name="ph:info" size="16" style="color: var(--text-muted)")
          span.text-xs(style="color: var(--text-muted)") {{ $t('automationTemplates.activateHint') }}
        .flex.items-center.gap-3
          el-button(size="large" @click="detailDialogVisible = false") {{ $t('common.cancel') }}
          el-button(
            type="primary"
            size="large"
            class="!rounded-xl"
            @click="activateTemplate"
            :loading="activating"
          )
            Icon(name="ph:lightning-bold" size="16" class="mr-1")
            | {{ $t('automationTemplates.activate') }}

  //- Success Dialog
  el-dialog(
    v-model="successDialogVisible"
    width="480px"
    destroy-on-close
    :show-close="false"
    center
  )
    .text-center.py-4
      .success-icon-wrapper.mx-auto.mb-5
        Icon(name="ph:check-circle-bold" size="56" style="color: #22c55e")
      h3.text-xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('automationTemplates.activated') }}
      p.text-sm.mb-6(style="color: var(--text-muted)") {{ $t('automationTemplates.activatedDesc') }}
      .flex.items-center.justify-center.gap-3
        el-button(size="large" @click="successDialogVisible = false") {{ $t('automationTemplates.stayHere') }}
        NuxtLink(to="/automations")
          el-button(type="primary" size="large" class="!rounded-xl")
            Icon(name="ph:arrow-right-bold" size="14" class="mr-1")
            | {{ $t('automationTemplates.viewAutomations') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// ─── State ────────────────────────────────────────────────────────
const searchQuery = ref('');
const selectedCategory = ref('');
const selectedTrigger = ref('');
const sortBy = ref('popular');
const detailDialogVisible = ref(false);
const successDialogVisible = ref(false);
const activating = ref(false);
const selectedTemplate = ref<any>(null);
const stepToggles = ref<boolean[]>([]);
const config = reactive({
  triggerCondition: 'default',
  delayValue: 0,
  delayUnit: 'hours',
  recipients: ['owner'] as string[],
  notes: ''
});

// ─── Category Options ─────────────────────────────────────────────
const categoryOptions = computed(() => [
  { value: 'leadManagement', label: t('automationTemplates.leadManagement'), icon: 'ph:users-three-bold' },
  { value: 'dealManagement', label: t('automationTemplates.dealManagement'), icon: 'ph:handshake-bold' },
  { value: 'customerSuccess', label: t('automationTemplates.customerSuccess'), icon: 'ph:heart-half-bold' },
  { value: 'support', label: t('automationTemplates.support'), icon: 'ph:lifebuoy-bold' }
]);

const defaultTriggerOptions = [
  { value: 'default', labelKey: 'automationTemplates.defaultTrigger' },
  { value: 'immediate', labelKey: 'automationTemplates.immediate' },
  { value: 'delayed', labelKey: 'automationTemplates.delayed' }
];

// ─── Templates Data ───────────────────────────────────────────────
const templates = ref([
  // Lead Management
  {
    id: 'lead-auto-assign',
    category: 'leadManagement',
    icon: 'ph:map-pin-bold',
    color: '#7849ff',
    triggerType: 'event',
    titleKey: 'automationTemplates.autoAssignLeads',
    descKey: 'automationTemplates.autoAssignLeadsDesc',
    fullDescKey: 'automationTemplates.autoAssignLeadsFullDesc',
    popularity: 2840,
    createdAt: '2025-11-01',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepNewLeadCreated',
        descKey: 'automationTemplates.stepNewLeadCreatedDesc',
        icon: 'ph:lightning-bold'
      },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheckTerritory',
        descKey: 'automationTemplates.stepCheckTerritoryDesc',
        icon: 'ph:map-trifold-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepAssignOwner',
        descKey: 'automationTemplates.stepAssignOwnerDesc',
        icon: 'ph:user-switch-bold'
      },
      {
        type: 'notification',
        labelKey: 'automationTemplates.stepNotifyOwner',
        descKey: 'automationTemplates.stepNotifyOwnerDesc',
        icon: 'ph:bell-bold'
      }
    ],
    triggerOptions: [
      { value: 'default', labelKey: 'automationTemplates.onLeadCreated' },
      { value: 'imported', labelKey: 'automationTemplates.onLeadImported' },
      { value: 'webform', labelKey: 'automationTemplates.onWebFormSubmit' }
    ]
  },
  {
    id: 'lead-nurture',
    category: 'leadManagement',
    icon: 'ph:envelope-simple-bold',
    color: '#3b82f6',
    triggerType: 'schedule',
    titleKey: 'automationTemplates.leadNurture',
    descKey: 'automationTemplates.leadNurtureDesc',
    fullDescKey: 'automationTemplates.leadNurtureFullDesc',
    popularity: 3120,
    createdAt: '2025-10-15',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepLeadEntersPipeline',
        descKey: 'automationTemplates.stepLeadEntersPipelineDesc',
        icon: 'ph:funnel-bold'
      },
      { type: 'delay', labelKey: 'automationTemplates.stepWait1Day', descKey: 'automationTemplates.stepWait1DayDesc', icon: 'ph:clock-bold' },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepSendWelcomeEmail',
        descKey: 'automationTemplates.stepSendWelcomeEmailDesc',
        icon: 'ph:envelope-bold'
      },
      { type: 'delay', labelKey: 'automationTemplates.stepWait3Days', descKey: 'automationTemplates.stepWait3DaysDesc', icon: 'ph:clock-bold' },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepSendFollowUp',
        descKey: 'automationTemplates.stepSendFollowUpDesc',
        icon: 'ph:envelope-bold'
      },
      { type: 'delay', labelKey: 'automationTemplates.stepWait7Days', descKey: 'automationTemplates.stepWait7DaysDesc', icon: 'ph:clock-bold' },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheckEngagement',
        descKey: 'automationTemplates.stepCheckEngagementDesc',
        icon: 'ph:chart-line-bold'
      }
    ]
  },
  {
    id: 'lead-scoring',
    category: 'leadManagement',
    icon: 'ph:chart-line-up-bold',
    color: '#f59e0b',
    triggerType: 'event',
    titleKey: 'automationTemplates.leadScoringUpdate',
    descKey: 'automationTemplates.leadScoringUpdateDesc',
    fullDescKey: 'automationTemplates.leadScoringUpdateFullDesc',
    popularity: 1950,
    createdAt: '2025-12-01',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepLeadActivity',
        descKey: 'automationTemplates.stepLeadActivityDesc',
        icon: 'ph:lightning-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepRecalculateScore',
        descKey: 'automationTemplates.stepRecalculateScoreDesc',
        icon: 'ph:calculator-bold'
      },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheckThreshold',
        descKey: 'automationTemplates.stepCheckThresholdDesc',
        icon: 'ph:funnel-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepPromoteToMql',
        descKey: 'automationTemplates.stepPromoteToMqlDesc',
        icon: 'ph:arrow-up-bold'
      }
    ]
  },
  {
    id: 'lead-notification',
    category: 'leadManagement',
    icon: 'ph:bell-ringing-bold',
    color: '#22c55e',
    triggerType: 'event',
    titleKey: 'automationTemplates.newLeadNotification',
    descKey: 'automationTemplates.newLeadNotificationDesc',
    fullDescKey: 'automationTemplates.newLeadNotificationFullDesc',
    popularity: 4200,
    createdAt: '2025-09-20',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepNewLeadCreated',
        descKey: 'automationTemplates.stepNewLeadCreatedDesc',
        icon: 'ph:lightning-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepSendSlackNotif',
        descKey: 'automationTemplates.stepSendSlackNotifDesc',
        icon: 'ph:chat-circle-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepSendEmailNotif',
        descKey: 'automationTemplates.stepSendEmailNotifDesc',
        icon: 'ph:envelope-bold'
      }
    ]
  },

  // Deal Management
  {
    id: 'deal-stage-change',
    category: 'dealManagement',
    icon: 'ph:swap-bold',
    color: '#8b5cf6',
    triggerType: 'event',
    titleKey: 'automationTemplates.stageChangeNotification',
    descKey: 'automationTemplates.stageChangeNotificationDesc',
    fullDescKey: 'automationTemplates.stageChangeNotificationFullDesc',
    popularity: 3650,
    createdAt: '2025-10-01',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepDealStageChanged',
        descKey: 'automationTemplates.stepDealStageChangedDesc',
        icon: 'ph:lightning-bold'
      },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheckStageType',
        descKey: 'automationTemplates.stepCheckStageTypeDesc',
        icon: 'ph:git-branch-bold'
      },
      {
        type: 'notification',
        labelKey: 'automationTemplates.stepNotifyStakeholders',
        descKey: 'automationTemplates.stepNotifyStakeholdersDesc',
        icon: 'ph:bell-bold'
      }
    ]
  },
  {
    id: 'stale-deal',
    category: 'dealManagement',
    icon: 'ph:clock-countdown-bold',
    color: '#ef4444',
    triggerType: 'schedule',
    titleKey: 'automationTemplates.staleDealAlert',
    descKey: 'automationTemplates.staleDealAlertDesc',
    fullDescKey: 'automationTemplates.staleDealAlertFullDesc',
    popularity: 2780,
    createdAt: '2025-11-10',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepDailyScheduleCheck',
        descKey: 'automationTemplates.stepDailyScheduleCheckDesc',
        icon: 'ph:clock-bold'
      },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheckLastActivity',
        descKey: 'automationTemplates.stepCheckLastActivityDesc',
        icon: 'ph:calendar-x-bold'
      },
      {
        type: 'notification',
        labelKey: 'automationTemplates.stepAlertDealOwner',
        descKey: 'automationTemplates.stepAlertDealOwnerDesc',
        icon: 'ph:warning-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepCreateTask',
        descKey: 'automationTemplates.stepCreateTaskDesc',
        icon: 'ph:check-square-bold'
      }
    ]
  },
  {
    id: 'deal-won',
    category: 'dealManagement',
    icon: 'ph:confetti-bold',
    color: '#22c55e',
    triggerType: 'event',
    titleKey: 'automationTemplates.dealWonCelebration',
    descKey: 'automationTemplates.dealWonCelebrationDesc',
    fullDescKey: 'automationTemplates.dealWonCelebrationFullDesc',
    popularity: 2100,
    createdAt: '2025-12-05',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepDealMarkedWon',
        descKey: 'automationTemplates.stepDealMarkedWonDesc',
        icon: 'ph:trophy-bold'
      },
      {
        type: 'notification',
        labelKey: 'automationTemplates.stepCelebrateTeam',
        descKey: 'automationTemplates.stepCelebrateTeamDesc',
        icon: 'ph:confetti-bold'
      },
      { type: 'action', labelKey: 'automationTemplates.stepUpdateCrm', descKey: 'automationTemplates.stepUpdateCrmDesc', icon: 'ph:database-bold' },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepCreateOnboarding',
        descKey: 'automationTemplates.stepCreateOnboardingDesc',
        icon: 'ph:list-checks-bold'
      }
    ]
  },
  {
    id: 'deal-followup',
    category: 'dealManagement',
    icon: 'ph:arrow-clockwise-bold',
    color: '#3b82f6',
    triggerType: 'event',
    titleKey: 'automationTemplates.autoFollowup',
    descKey: 'automationTemplates.autoFollowupDesc',
    fullDescKey: 'automationTemplates.autoFollowupFullDesc',
    popularity: 3400,
    createdAt: '2025-10-20',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepDealStageChanged',
        descKey: 'automationTemplates.stepDealStageChangedDesc',
        icon: 'ph:lightning-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepCreateFollowupTask',
        descKey: 'automationTemplates.stepCreateFollowupTaskDesc',
        icon: 'ph:check-square-bold'
      },
      { type: 'delay', labelKey: 'automationTemplates.stepWait2Days', descKey: 'automationTemplates.stepWait2DaysDesc', icon: 'ph:clock-bold' },
      {
        type: 'notification',
        labelKey: 'automationTemplates.stepRemindOwner',
        descKey: 'automationTemplates.stepRemindOwnerDesc',
        icon: 'ph:bell-ringing-bold'
      }
    ]
  },

  // Customer Success
  {
    id: 'onboarding-checklist',
    category: 'customerSuccess',
    icon: 'ph:list-checks-bold',
    color: '#06b6d4',
    triggerType: 'event',
    titleKey: 'automationTemplates.onboardingChecklist',
    descKey: 'automationTemplates.onboardingChecklistDesc',
    fullDescKey: 'automationTemplates.onboardingChecklistFullDesc',
    popularity: 1850,
    createdAt: '2025-11-15',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepDealMarkedWon',
        descKey: 'automationTemplates.stepDealMarkedWonDesc',
        icon: 'ph:trophy-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepGenerateChecklist',
        descKey: 'automationTemplates.stepGenerateChecklistDesc',
        icon: 'ph:list-checks-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepAssignCsm',
        descKey: 'automationTemplates.stepAssignCsmDesc',
        icon: 'ph:user-switch-bold'
      },
      {
        type: 'notification',
        labelKey: 'automationTemplates.stepWelcomeCustomer',
        descKey: 'automationTemplates.stepWelcomeCustomerDesc',
        icon: 'ph:envelope-bold'
      }
    ]
  },
  {
    id: 'nps-survey',
    category: 'customerSuccess',
    icon: 'ph:chart-bar-bold',
    color: '#f59e0b',
    triggerType: 'schedule',
    titleKey: 'automationTemplates.npsSurvey',
    descKey: 'automationTemplates.npsSurveyDesc',
    fullDescKey: 'automationTemplates.npsSurveyFullDesc',
    popularity: 2300,
    createdAt: '2025-10-25',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepDealClosedTrigger',
        descKey: 'automationTemplates.stepDealClosedTriggerDesc',
        icon: 'ph:clock-bold'
      },
      { type: 'delay', labelKey: 'automationTemplates.stepWait30Days', descKey: 'automationTemplates.stepWait30DaysDesc', icon: 'ph:clock-bold' },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepSendNpsSurvey',
        descKey: 'automationTemplates.stepSendNpsSurveyDesc',
        icon: 'ph:chart-bar-bold'
      },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheckNpsScore',
        descKey: 'automationTemplates.stepCheckNpsScoreDesc',
        icon: 'ph:funnel-bold'
      }
    ]
  },
  {
    id: 'renewal-reminder',
    category: 'customerSuccess',
    icon: 'ph:calendar-check-bold',
    color: '#8b5cf6',
    triggerType: 'schedule',
    titleKey: 'automationTemplates.renewalReminder',
    descKey: 'automationTemplates.renewalReminderDesc',
    fullDescKey: 'automationTemplates.renewalReminderFullDesc',
    popularity: 2650,
    createdAt: '2025-09-30',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepDailyScheduleCheck',
        descKey: 'automationTemplates.stepDailyScheduleCheckDesc',
        icon: 'ph:clock-bold'
      },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheck60DaysBefore',
        descKey: 'automationTemplates.stepCheck60DaysBeforeDesc',
        icon: 'ph:calendar-bold'
      },
      {
        type: 'notification',
        labelKey: 'automationTemplates.stepNotifyAccountManager',
        descKey: 'automationTemplates.stepNotifyAccountManagerDesc',
        icon: 'ph:bell-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepCreateRenewalTask',
        descKey: 'automationTemplates.stepCreateRenewalTaskDesc',
        icon: 'ph:check-square-bold'
      }
    ]
  },
  {
    id: 'churn-risk',
    category: 'customerSuccess',
    icon: 'ph:warning-circle-bold',
    color: '#ef4444',
    triggerType: 'condition',
    titleKey: 'automationTemplates.churnRiskAlert',
    descKey: 'automationTemplates.churnRiskAlertDesc',
    fullDescKey: 'automationTemplates.churnRiskAlertFullDesc',
    popularity: 1720,
    createdAt: '2025-12-10',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepHealthScoreDrop',
        descKey: 'automationTemplates.stepHealthScoreDropDesc',
        icon: 'ph:trend-down-bold'
      },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheckChurnIndicators',
        descKey: 'automationTemplates.stepCheckChurnIndicatorsDesc',
        icon: 'ph:warning-bold'
      },
      {
        type: 'notification',
        labelKey: 'automationTemplates.stepEscalateToCsm',
        descKey: 'automationTemplates.stepEscalateToCsmDesc',
        icon: 'ph:siren-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepCreateRetentionPlan',
        descKey: 'automationTemplates.stepCreateRetentionPlanDesc',
        icon: 'ph:strategy-bold'
      }
    ]
  },

  // Support
  {
    id: 'ticket-auto-assign',
    category: 'support',
    icon: 'ph:ticket-bold',
    color: '#7849ff',
    triggerType: 'event',
    titleKey: 'automationTemplates.autoAssignTickets',
    descKey: 'automationTemplates.autoAssignTicketsDesc',
    fullDescKey: 'automationTemplates.autoAssignTicketsFullDesc',
    popularity: 3900,
    createdAt: '2025-09-15',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepNewTicketCreated',
        descKey: 'automationTemplates.stepNewTicketCreatedDesc',
        icon: 'ph:lightning-bold'
      },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheckTicketCategory',
        descKey: 'automationTemplates.stepCheckTicketCategoryDesc',
        icon: 'ph:tag-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepAssignToAgent',
        descKey: 'automationTemplates.stepAssignToAgentDesc',
        icon: 'ph:user-switch-bold'
      },
      {
        type: 'notification',
        labelKey: 'automationTemplates.stepNotifyAgent',
        descKey: 'automationTemplates.stepNotifyAgentDesc',
        icon: 'ph:bell-bold'
      }
    ]
  },
  {
    id: 'sla-escalation',
    category: 'support',
    icon: 'ph:siren-bold',
    color: '#ef4444',
    triggerType: 'condition',
    titleKey: 'automationTemplates.slaEscalation',
    descKey: 'automationTemplates.slaEscalationDesc',
    fullDescKey: 'automationTemplates.slaEscalationFullDesc',
    popularity: 2500,
    createdAt: '2025-11-05',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepSlaTimerCheck',
        descKey: 'automationTemplates.stepSlaTimerCheckDesc',
        icon: 'ph:clock-countdown-bold'
      },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheckSlaBreach',
        descKey: 'automationTemplates.stepCheckSlaBreachDesc',
        icon: 'ph:warning-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepEscalateTicket',
        descKey: 'automationTemplates.stepEscalateTicketDesc',
        icon: 'ph:arrow-up-bold'
      },
      {
        type: 'notification',
        labelKey: 'automationTemplates.stepNotifyManager',
        descKey: 'automationTemplates.stepNotifyManagerDesc',
        icon: 'ph:bell-ringing-bold'
      }
    ]
  },
  {
    id: 'csat-survey',
    category: 'support',
    icon: 'ph:smiley-bold',
    color: '#22c55e',
    triggerType: 'event',
    titleKey: 'automationTemplates.csatSurvey',
    descKey: 'automationTemplates.csatSurveyDesc',
    fullDescKey: 'automationTemplates.csatSurveyFullDesc',
    popularity: 2900,
    createdAt: '2025-10-10',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepTicketResolved',
        descKey: 'automationTemplates.stepTicketResolvedDesc',
        icon: 'ph:check-circle-bold'
      },
      { type: 'delay', labelKey: 'automationTemplates.stepWait1Hour', descKey: 'automationTemplates.stepWait1HourDesc', icon: 'ph:clock-bold' },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepSendCsatSurvey',
        descKey: 'automationTemplates.stepSendCsatSurveyDesc',
        icon: 'ph:smiley-bold'
      },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheckCsatScore',
        descKey: 'automationTemplates.stepCheckCsatScoreDesc',
        icon: 'ph:funnel-bold'
      }
    ]
  },
  {
    id: 'vip-routing',
    category: 'support',
    icon: 'ph:crown-bold',
    color: '#f59e0b',
    triggerType: 'condition',
    titleKey: 'automationTemplates.vipRouting',
    descKey: 'automationTemplates.vipRoutingDesc',
    fullDescKey: 'automationTemplates.vipRoutingFullDesc',
    popularity: 1650,
    createdAt: '2025-12-15',
    steps: [
      {
        type: 'trigger',
        labelKey: 'automationTemplates.stepNewTicketCreated',
        descKey: 'automationTemplates.stepNewTicketCreatedDesc',
        icon: 'ph:lightning-bold'
      },
      {
        type: 'condition',
        labelKey: 'automationTemplates.stepCheckVipStatus',
        descKey: 'automationTemplates.stepCheckVipStatusDesc',
        icon: 'ph:crown-bold'
      },
      {
        type: 'action',
        labelKey: 'automationTemplates.stepPriorityRouting',
        descKey: 'automationTemplates.stepPriorityRoutingDesc',
        icon: 'ph:arrow-fat-up-bold'
      },
      {
        type: 'notification',
        labelKey: 'automationTemplates.stepNotifySeniorAgent',
        descKey: 'automationTemplates.stepNotifySeniorAgentDesc',
        icon: 'ph:star-bold'
      }
    ]
  }
]);

// ─── Stats ────────────────────────────────────────────────────────
const summaryStats = computed(() => [
  { label: t('automationTemplates.totalTemplates'), value: templates.value.length, icon: 'ph:files-bold', color: '#7849ff' },
  {
    label: t('automationTemplates.leadManagement'),
    value: templates.value.filter(t => t.category === 'leadManagement').length,
    icon: 'ph:users-three-bold',
    color: '#3b82f6'
  },
  {
    label: t('automationTemplates.dealManagement'),
    value: templates.value.filter(t => t.category === 'dealManagement').length,
    icon: 'ph:handshake-bold',
    color: '#22c55e'
  },
  {
    label: t('automationTemplates.support'),
    value: templates.value.filter(t => t.category === 'support').length,
    icon: 'ph:lifebuoy-bold',
    color: '#f59e0b'
  }
]);

// ─── Filtered & Sorted Templates ──────────────────────────────────
const filteredTemplates = computed(() => {
  let result = [...templates.value];

  // Filter by category
  if (selectedCategory.value) {
    result = result.filter(tpl => tpl.category === selectedCategory.value);
  }

  // Filter by trigger type
  if (selectedTrigger.value) {
    result = result.filter(tpl => tpl.triggerType === selectedTrigger.value);
  }

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(tpl => {
      const title = t(tpl.titleKey).toLowerCase();
      const desc = t(tpl.descKey).toLowerCase();
      const cat = t(`automationTemplates.${tpl.category}`).toLowerCase();
      return title.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }

  // Sort
  if (sortBy.value === 'popular') {
    result.sort((a, b) => b.popularity - a.popularity);
  } else if (sortBy.value === 'newest') {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy.value === 'az') {
    result.sort((a, b) => t(a.titleKey).localeCompare(t(b.titleKey)));
  }

  return result;
});

// ─── Helpers ──────────────────────────────────────────────────────
function triggerIcon(type: string): string {
  const map: Record<string, string> = {
    event: 'ph:lightning-bold',
    schedule: 'ph:clock-bold',
    condition: 'ph:git-branch-bold'
  };
  return map[type] || 'ph:lightning-bold';
}

function triggerColor(type: string): string {
  const map: Record<string, string> = {
    event: '#7849ff',
    schedule: '#3b82f6',
    condition: '#f59e0b'
  };
  return map[type] || '#7849ff';
}

function categoryTagType(category: string): string {
  const map: Record<string, string> = {
    leadManagement: '',
    dealManagement: 'success',
    customerSuccess: 'warning',
    support: 'danger'
  };
  return map[category] || '';
}

function stepIcon(type: string): string {
  const map: Record<string, string> = {
    trigger: 'ph:lightning-bold',
    condition: 'ph:git-branch-bold',
    action: 'ph:gear-bold',
    notification: 'ph:bell-bold',
    delay: 'ph:clock-bold'
  };
  return map[type] || 'ph:gear-bold';
}

function stepColor(type: string): string {
  const map: Record<string, string> = {
    trigger: '#7849ff',
    condition: '#f59e0b',
    action: '#3b82f6',
    notification: '#22c55e',
    delay: '#8b5cf6'
  };
  return map[type] || '#7849ff';
}

// ─── Actions ──────────────────────────────────────────────────────
function openTemplateDetail(tpl: any) {
  selectedTemplate.value = tpl;
  stepToggles.value = tpl.steps.map(() => true);
  config.triggerCondition = 'default';
  config.delayValue = 0;
  config.delayUnit = 'hours';
  config.recipients = ['owner'];
  config.notes = '';
  detailDialogVisible.value = true;
}

async function activateTemplate() {
  activating.value = true;
  try {
    // Simulate activation delay (real implementation would POST to API)
    await new Promise(resolve => setTimeout(resolve, 1200));
    detailDialogVisible.value = false;
    successDialogVisible.value = true;
    ElMessage.success(t('automationTemplates.activatedSuccess'));
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    activating.value = false;
  }
}

function resetFilters() {
  searchQuery.value = '';
  selectedCategory.value = '';
  selectedTrigger.value = '';
  sortBy.value = 'popular';
}
</script>

<style lang="scss" scoped>
// ─── Template Grid ────────────────────────────────────────────────
.template-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(1, 1fr);

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (min-width: 1440px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

// ─── Template Card ────────────────────────────────────────────────
.template-card {
  @include glass-card;
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent-color, #7849ff), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);

    &::before {
      opacity: 1;
    }

    .use-template-btn {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-wrapper-lg {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  margin-bottom: 16px;
}

.template-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  line-height: 1.3;
}

.template-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.popularity-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.use-template-btn {
  opacity: 0.7;
  transform: translateY(2px);
  transition: all 0.3s ease;
}

// ─── Category Chips ───────────────────────────────────────────────
.category-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;

  &:hover {
    border-color: var(--accent-color, #7849ff);
    color: var(--text-primary);
    background: rgba(120, 73, 255, 0.06);
  }

  &.active {
    border-color: var(--accent-color, #7849ff);
    background: rgba(120, 73, 255, 0.12);
    color: var(--accent-color, #7849ff);
    font-weight: 600;
  }

  .chip-count {
    background: rgba(255, 255, 255, 0.08);
    padding: 2px 8px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
  }

  &.active .chip-count {
    background: rgba(120, 73, 255, 0.2);
  }
}

// ─── Workflow Diagram ─────────────────────────────────────────────
.workflow-diagram {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.workflow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0;

  .connector-line {
    width: 2px;
    height: 20px;
    background: linear-gradient(to bottom, var(--accent-color, #7849ff), rgba(120, 73, 255, 0.3));
    border-radius: 1px;
  }
}

.step-node {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.25s ease;

  &:hover {
    border-color: rgba(120, 73, 255, 0.2);
    background: rgba(120, 73, 255, 0.04);
  }
}

.step-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.step-description {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  line-height: 1.4;
}

// ─── Search Input Override ────────────────────────────────────────
.search-input :deep(.el-input__wrapper) {
  border-radius: 12px !important;
}

// ─── Success Icon ─────────────────────────────────────────────────
.success-icon-wrapper {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: successPulse 1.5s ease-in-out infinite;
}

@keyframes successPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

// ─── Animation ────────────────────────────────────────────────────
.animate-entrance {
  animation: fadeSlideIn 0.4s ease-out both;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ─── Glass Card ───────────────────────────────────────────────────
.glass-card {
  @include glass-card;
  border-radius: 16px;
}

// ─── Dialog Overrides ─────────────────────────────────────────────
:deep(.el-dialog) {
  border-radius: 20px !important;
}
</style>
