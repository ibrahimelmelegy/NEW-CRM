<template lang="pug">
.onboarding-page.p-6.animate-entrance
  //- Page Header
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    div
      h1.text-3xl.font-black.tracking-tight.flex.items-center.gap-3(style="color: var(--text-primary)")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #7849ff, #a855f7)")
          Icon(name="ph:rocket-launch-bold" size="22" style="color: white")
        | {{ $t('customerOnboarding.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('customerOnboarding.subtitle') }}

    .flex.items-center.gap-3
      el-input(
        v-model="searchQuery"
        :placeholder="$t('customerOnboarding.search')"
        clearable
        style="width: 260px"
        size="large"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")
      el-button(type="primary" size="large" @click="showNewOnboardingDialog = true" class="!bg-[#7849ff] !border-none !rounded-xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-2 {{ $t('customerOnboarding.newOnboarding') }}

  //- KPI Stat Cards
  .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
    .kpi-card.active-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('customerOnboarding.activeOnboardings') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ activeOnboardingsCount }}
              span.kpi-pct {{ $t('customerOnboarding.inProgress') }}
          .kpi-icon-wrap.active-icon
            Icon(name="ph:users-three-bold" size="24")

    .kpi-card.completion-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('customerOnboarding.completionRate') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ completionRate }}%
              span.kpi-pct.text-emerald-400 {{ $t('customerOnboarding.kpiChange', { value: '+5%' }) }}
          .kpi-icon-wrap.completion-icon
            Icon(name="ph:check-circle-bold" size="24")

    .kpi-card.duration-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('customerOnboarding.avgDuration') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ avgDuration }}
              span.kpi-pct {{ $t('customerOnboarding.days') }}
          .kpi-icon-wrap.duration-icon
            Icon(name="ph:clock-bold" size="24")

    .kpi-card.risk-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('customerOnboarding.atRiskCount') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ atRiskCount }}
              span.kpi-pct.text-amber-400 {{ $t('customerOnboarding.needsAttention') }}
          .kpi-icon-wrap.risk-icon
            Icon(name="ph:warning-bold" size="24")

  //- Main Tabs
  el-tabs(v-model="activeTab" type="border-card" class="onboarding-tabs")

    //- ═══════════════════════════════════════════════════
    //- TAB 1: Active Onboardings
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('customerOnboarding.activeOnboardings')" name="active")
      .glass-card.rounded-2xl.overflow-hidden
        .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--glass-border)")
          h3.text-sm.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:list-checks-bold" size="16" class="mr-2" style="color: #7849ff")
            | {{ $t('customerOnboarding.onboardingQueue') }}
          .flex.items-center.gap-2
            el-select(v-model="statusFilter" clearable :placeholder="$t('customerOnboarding.filterByStatus')" size="default" style="width: 160px")
              el-option(:label="$t('customerOnboarding.all')" value="")
              el-option(:label="$t('customerOnboarding.onTrack')" value="on-track")
              el-option(:label="$t('customerOnboarding.atRisk')" value="at-risk")
              el-option(:label="$t('customerOnboarding.delayed')" value="delayed")
            el-tag(effect="dark" round size="small") {{ filteredOnboardings.length }} {{ $t('customerOnboarding.records') }}

        el-table(:data="paginatedOnboardings" stripe style="width: 100%" @row-click="openOnboardingDetail")
          el-table-column(:label="$t('customerOnboarding.customerName')" min-width="200")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .avatar-circle(:style="{ background: getAvatarGradient(row.customerName) }")
                  | {{ getInitial(row.customerName) }}
                div
                  p.font-semibold.text-sm(style="color: var(--text-primary)") {{ row.customerName }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.company }}

          el-table-column(:label="$t('customerOnboarding.assignedCSM')" width="160")
            template(#default="{ row }")
              .flex.items-center.gap-2
                .w-6.h-6.rounded-full.flex.items-center.justify-center.text-xs.font-bold(
                  :style="{ background: getAvatarGradient(row.assignedCSM), color: '#fff' }"
                ) {{ getInitial(row.assignedCSM) }}
                span.text-sm(style="color: var(--text-secondary)") {{ row.assignedCSM }}

          el-table-column(:label="$t('customerOnboarding.startDate')" width="130")
            template(#default="{ row }")
              .flex.items-center.gap-2
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-sm(style="color: var(--text-secondary)") {{ formatDate(row.startDate) }}

          el-table-column(:label="$t('customerOnboarding.progress')" width="200")
            template(#default="{ row }")
              .flex.items-center.gap-3
                el-progress(
                  :percentage="row.progress"
                  :stroke-width="8"
                  :color="getProgressColor(row.progress)"
                  style="flex: 1"
                )
                span.text-sm.font-bold(:style="{ color: getProgressColor(row.progress) }") {{ row.progress }}%

          el-table-column(:label="$t('customerOnboarding.currentPhase')" width="170")
            template(#default="{ row }")
              el-tag(size="small" round effect="plain" :style="{ borderColor: '#7849ff40', color: '#7849ff' }") {{ row.currentPhase }}

          el-table-column(:label="$t('customerOnboarding.daysRemaining')" width="130" align="center")
            template(#default="{ row }")
              span.text-sm.font-bold(:style="{ color: row.daysRemaining <= 5 ? '#ef4444' : row.daysRemaining <= 14 ? '#f59e0b' : 'var(--text-primary)' }") {{ row.daysRemaining }} {{ $t('customerOnboarding.days') }}

          el-table-column(:label="$t('customerOnboarding.status')" width="130" align="center")
            template(#default="{ row }")
              el-tag(:type="getStatusTagType(row.status)" size="small" round effect="dark") {{ getStatusLabel(row.status) }}

          el-table-column(:label="$t('customerOnboarding.actions')" width="100" align="center" fixed="right")
            template(#default="{ row }")
              .flex.items-center.gap-1.justify-center
                el-tooltip(:content="$t('customerOnboarding.viewDetail')")
                  el-button(link type="primary" @click.stop="openOnboardingDetail(row)" :aria-label="$t('customerOnboarding.viewDetail')")
                    Icon(name="ph:eye-bold" size="18")
                el-tooltip(:content="$t('customerOnboarding.sendReminder')")
                  el-button(link type="warning" @click.stop="sendReminder(row)" :aria-label="$t('customerOnboarding.sendReminder')")
                    Icon(name="ph:bell-bold" size="18")

        .p-4.flex.justify-center(style="border-top: 1px solid var(--glass-border)")
          el-pagination(
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="filteredOnboardings.length"
            layout="total, sizes, prev, pager, next"
            background
          )

    //- ═══════════════════════════════════════════════════
    //- TAB 2: Onboarding Templates
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('customerOnboarding.templates')" name="templates")
      .flex.items-center.justify-between.mb-6
        h3.text-sm.font-bold(style="color: var(--text-primary)")
          Icon(name="ph:blueprint-bold" size="16" class="mr-2" style="color: #7849ff")
          | {{ $t('customerOnboarding.onboardingTemplates') }}
        el-button(type="primary" @click="openTemplateDialog()" class="!bg-[#7849ff] !border-none !rounded-xl")
          Icon(name="ph:plus-bold" size="16")
          span.ml-2 {{ $t('customerOnboarding.createTemplate') }}

      .grid.gap-6(class="grid-cols-1 md:grid-cols-2 xl:grid-cols-3")
        .glass-card.rounded-2xl.overflow-hidden.cursor-pointer.transition-all.template-card(
          v-for="tmpl in templates"
          :key="tmpl.id"
          @click="openTemplateDialog(tmpl)"
        )
          .p-5
            .flex.items-center.justify-between.mb-4
              .flex.items-center.gap-3
                .w-12.h-12.rounded-xl.flex.items-center.justify-center(:style="{ background: tmpl.color + '20' }")
                  Icon(:name="tmpl.icon" size="22" :style="{ color: tmpl.color }")
                div
                  h4.text-sm.font-bold(style="color: var(--text-primary)") {{ tmpl.name }}
                  p.text-xs.mt-1(style="color: var(--text-muted)") {{ tmpl.description }}
              el-dropdown(trigger="click" @command="handleTemplateAction($event, tmpl)")
                el-button(text size="small" @click.stop :aria-label="$t('customerOnboarding.actions')")
                  Icon(name="ph:dots-three-vertical" size="16")
                template(#dropdown)
                  el-dropdown-menu
                    el-dropdown-item(command="edit")
                      Icon(name="ph:pencil" size="14" class="mr-2")
                      | {{ $t('customerOnboarding.edit') }}
                    el-dropdown-item(command="duplicate")
                      Icon(name="ph:copy" size="14" class="mr-2")
                      | {{ $t('customerOnboarding.duplicate') }}
                    el-dropdown-item(command="delete" divided)
                      span(style="color: #ef4444")
                        Icon(name="ph:trash" size="14" class="mr-2")
                        | {{ $t('customerOnboarding.delete') }}

            .grid.grid-cols-3.gap-3
              .text-center.p-3.rounded-xl(style="background: var(--bg-elevated)")
                p.text-lg.font-bold(style="color: var(--text-primary)") {{ tmpl.phasesCount }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('customerOnboarding.phases') }}
              .text-center.p-3.rounded-xl(style="background: var(--bg-elevated)")
                p.text-lg.font-bold(style="color: var(--text-primary)") {{ tmpl.avgCompletionDays }}{{ $t('customerOnboarding.daySuffix') }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('customerOnboarding.avgCompletion') }}
              .text-center.p-3.rounded-xl(style="background: var(--bg-elevated)")
                p.text-lg.font-bold(style="color: var(--text-primary)") {{ tmpl.usageCount }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('customerOnboarding.timesUsed') }}

          .px-5.py-3(style="background: var(--bg-elevated); border-top: 1px solid var(--glass-border)")
            .flex.items-center.justify-between
              .flex.items-center.gap-1
                Icon(name="ph:clock" size="14" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ $t('customerOnboarding.lastUsed') }}: {{ formatDate(tmpl.lastUsed) }}
              el-button(size="small" type="primary" text @click.stop="useTemplate(tmpl)")
                Icon(name="ph:play-bold" size="14" class="mr-1")
                | {{ $t('customerOnboarding.useTemplate') }}

    //- ═══════════════════════════════════════════════════
    //- TAB 3: Milestones & Checklist
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('customerOnboarding.milestonesChecklist')" name="milestones")
      //- Onboarding Selector
      .flex.items-center.justify-between.mb-6
        .flex.items-center.gap-3
          Icon(name="ph:flag-checkered-bold" size="20" style="color: #7849ff")
          h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('customerOnboarding.milestonesFor') }}
          el-select(v-model="selectedOnboardingId" :placeholder="$t('customerOnboarding.selectOnboarding')" style="width: 280px" size="large")
            el-option(
              v-for="ob in onboardings"
              :key="ob.id"
              :value="ob.id"
              :label="ob.customerName + ' — ' + ob.company"
            )
        .flex.items-center.gap-2(v-if="selectedOnboarding")
          el-tag(type="info" size="small" round effect="dark")
            | {{ selectedOnboarding.progress }}% {{ $t('customerOnboarding.complete') }}

      //- Milestone Steps
      template(v-if="selectedOnboarding")
        .glass-card.p-6.rounded-2xl.mb-6
          el-steps(:active="currentMilestoneStep" finish-status="success" process-status="process" align-center)
            el-step(
              v-for="(phase, idx) in selectedOnboardingPhases"
              :key="idx"
              :title="phase.name"
              :description="phase.completedTasks + '/' + phase.totalTasks + ' ' + $t('customerOnboarding.tasks')"
              :status="getPhaseStepStatus(phase, idx)"
            )

        //- Expandable phases with checklist items
        .space-y-4
          .glass-card.rounded-2xl.overflow-hidden(v-for="(phase, phaseIdx) in selectedOnboardingPhases" :key="phaseIdx")
            .p-5.cursor-pointer.flex.items-center.justify-between(@click="togglePhase(phaseIdx)")
              .flex.items-center.gap-3
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: getPhaseColor(phase) + '20' }")
                  Icon(:name="getPhaseIcon(phase)" size="20" :style="{ color: getPhaseColor(phase) }")
                div
                  h4.text-sm.font-bold(style="color: var(--text-primary)") {{ phase.name }}
                  p.text-xs(style="color: var(--text-muted)") {{ phase.description }}
              .flex.items-center.gap-3
                el-progress(:percentage="phase.progress" :stroke-width="6" :color="getPhaseColor(phase)" style="width: 120px")
                Icon(:name="expandedPhases.includes(phaseIdx) ? 'ph:caret-up' : 'ph:caret-down'" size="16" style="color: var(--text-muted)")

            el-collapse-transition
              .px-5.pb-5(v-if="expandedPhases.includes(phaseIdx)")
                .border-t.pt-4(style="border-color: var(--glass-border)")
                  .checklist-item.flex.items-center.justify-between.py-3(
                    v-for="(task, taskIdx) in phase.tasks"
                    :key="taskIdx"
                    :style="{ borderBottom: taskIdx < phase.tasks.length - 1 ? '1px solid var(--glass-border)' : 'none' }"
                  )
                    .flex.items-center.gap-3
                      el-checkbox(v-model="task.completed" @change="onTaskToggle(phaseIdx, taskIdx)")
                      div
                        p.text-sm(:style="{ color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }") {{ task.name }}
                        .flex.items-center.gap-3.mt-1
                          .flex.items-center.gap-1
                            Icon(name="ph:user" size="12" style="color: var(--text-muted)")
                            span.text-xs(style="color: var(--text-muted)") {{ task.assignee }}
                          .flex.items-center.gap-1
                            Icon(name="ph:calendar" size="12" style="color: var(--text-muted)")
                            span.text-xs(style="color: var(--text-muted)") {{ formatDate(task.dueDate) }}
                    el-tag(:type="getTaskStatusType(task.status)" size="small" round effect="dark") {{ getTaskStatusLabel(task.status) }}

      //- Empty state when no onboarding selected
      .text-center.py-16(v-else)
        Icon(name="ph:flag-checkered" size="48" style="color: var(--text-muted)")
        p.mt-3.font-medium(style="color: var(--text-primary)") {{ $t('customerOnboarding.selectOnboardingPrompt') }}
        p.mt-1.text-sm(style="color: var(--text-muted)") {{ $t('customerOnboarding.selectOnboardingDesc') }}

    //- ═══════════════════════════════════════════════════
    //- TAB 4: Time-to-Value Metrics
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('customerOnboarding.timeToValueMetrics')" name="metrics")
      //- Metric KPI Cards
      .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
        .glass-card.p-5.rounded-2xl.text-center(v-for="metric in ttvMetrics" :key="metric.label")
          .w-12.h-12.rounded-xl.flex.items-center.justify-center.mx-auto.mb-3(:style="{ background: metric.color + '20' }")
            Icon(:name="metric.icon" size="22" :style="{ color: metric.color }")
          p.text-2xl.font-bold(:style="{ color: metric.color }") {{ metric.value }}
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ metric.label }}
          .flex.items-center.justify-center.gap-1.mt-2(v-if="metric.trend !== undefined")
            Icon(:name="metric.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: metric.trend >= 0 ? '#22c55e' : '#ef4444' }")
            span.text-xs.font-medium(:style="{ color: metric.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ metric.trend > 0 ? '+' : '' }}{{ metric.trend }}%

      //- Charts Row
      .grid.gap-6.mb-8(class="grid-cols-1 lg:grid-cols-2")
        //- Onboarding Duration Trend Chart
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4
            h3.text-sm.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:chart-line-up-bold" size="16" class="mr-2" style="color: #7849ff")
              | {{ $t('customerOnboarding.durationTrend') }}
            el-select(v-model="trendPeriod" size="small" style="width: 120px")
              el-option(:label="$t('customerOnboarding.last6Months')" value="6m")
              el-option(:label="$t('customerOnboarding.last12Months')" value="12m")
          .chart-container
            VChart(v-if="durationTrendOption" :option="durationTrendOption" autoresize style="height: 320px")

        //- Completion Rate by Template Chart
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4
            h3.text-sm.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:chart-pie-bold" size="16" class="mr-2" style="color: #22c55e")
              | {{ $t('customerOnboarding.completionByTemplate') }}
          .chart-container
            VChart(v-if="completionByTemplateOption" :option="completionByTemplateOption" autoresize style="height: 320px")

      //- Recent Completions Table
      .glass-card.rounded-2xl.overflow-hidden
        .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--glass-border)")
          h3.text-sm.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:trophy-bold" size="16" class="mr-2" style="color: #22c55e")
            | {{ $t('customerOnboarding.recentCompletions') }}
        el-table(:data="recentCompletions" stripe style="width: 100%")
          el-table-column(:label="$t('customerOnboarding.customerName')" min-width="180")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .avatar-circle.small(:style="{ background: getAvatarGradient(row.customerName) }")
                  | {{ getInitial(row.customerName) }}
                span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.customerName }}

          el-table-column(:label="$t('customerOnboarding.template')" width="180")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-secondary)") {{ row.template }}

          el-table-column(:label="$t('customerOnboarding.completedDate')" width="140")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-secondary)") {{ formatDate(row.completedDate) }}

          el-table-column(:label="$t('customerOnboarding.timeToFirstValue')" width="160" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                Icon(name="ph:lightning-bold" size="14" :style="{ color: row.timeToFirstValue <= 7 ? '#22c55e' : row.timeToFirstValue <= 14 ? '#f59e0b' : '#ef4444' }")
                span.text-sm.font-bold(:style="{ color: row.timeToFirstValue <= 7 ? '#22c55e' : row.timeToFirstValue <= 14 ? '#f59e0b' : '#ef4444' }") {{ row.timeToFirstValue }}{{ $t('customerOnboarding.daySuffix') }}

          el-table-column(:label="$t('customerOnboarding.totalDuration')" width="150" align="center")
            template(#default="{ row }")
              span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.totalDuration }} {{ $t('customerOnboarding.days') }}

          el-table-column(:label="$t('customerOnboarding.npsScore')" width="120" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                .w-8.h-8.rounded-lg.flex.items-center.justify-center.text-xs.font-bold(
                  :style="{ background: getNpsColor(row.npsScore) + '20', color: getNpsColor(row.npsScore) }"
                ) {{ row.npsScore }}

  //- ═══════════════════════════════════════════════════
  //- New Onboarding Dialog
  //- ═══════════════════════════════════════════════════
  el-dialog(v-model="showNewOnboardingDialog" :title="$t('customerOnboarding.startNewOnboarding')" width="600px" @close="resetOnboardingForm")
    el-form(label-position="top" :model="onboardingForm")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('customerOnboarding.customerName')")
          el-input(v-model="onboardingForm.customerName" :placeholder="$t('customerOnboarding.enterCustomerName')")
        el-form-item(:label="$t('customerOnboarding.company')")
          el-input(v-model="onboardingForm.company" :placeholder="$t('customerOnboarding.enterCompany')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('customerOnboarding.assignedCSM')")
          el-select(v-model="onboardingForm.assignedCSM" :placeholder="$t('customerOnboarding.selectCSM')" style="width: 100%" filterable)
            el-option(v-for="csm in csmList" :key="csm" :value="csm" :label="csm")
        el-form-item(:label="$t('customerOnboarding.template')")
          el-select(v-model="onboardingForm.templateId" :placeholder="$t('customerOnboarding.selectTemplate')" style="width: 100%")
            el-option(v-for="tmpl in templates" :key="tmpl.id" :value="tmpl.id" :label="tmpl.name")
      el-form-item(:label="$t('customerOnboarding.startDate')")
        el-date-picker(v-model="onboardingForm.startDate" type="date" style="width: 100%" :placeholder="$t('customerOnboarding.selectDate')")
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showNewOnboardingDialog = false") {{ $t('customerOnboarding.cancel') }}
        el-button(type="primary" @click="createOnboarding" :disabled="!onboardingForm.customerName" class="!bg-[#7849ff] !border-none") {{ $t('customerOnboarding.create') }}

  //- ═══════════════════════════════════════════════════
  //- Template Create/Edit Dialog
  //- ═══════════════════════════════════════════════════
  el-dialog(v-model="showTemplateDialog" :title="editingTemplate ? $t('customerOnboarding.editTemplate') : $t('customerOnboarding.createTemplate')" width="720px" @close="resetTemplateForm")
    el-form(label-position="top" :model="templateForm")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('customerOnboarding.templateName')")
          el-input(v-model="templateForm.name" :placeholder="$t('customerOnboarding.enterTemplateName')")
        el-form-item(:label="$t('customerOnboarding.description')")
          el-input(v-model="templateForm.description" :placeholder="$t('customerOnboarding.enterDescription')")

      //- Phases Builder
      .mb-4
        .flex.items-center.justify-between.mb-3
          h4.text-sm.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:steps-bold" size="16" class="mr-2" style="color: #7849ff")
            | {{ $t('customerOnboarding.phases') }}
          el-button(size="small" @click="addPhase" plain)
            Icon(name="ph:plus" size="14" class="mr-1")
            | {{ $t('customerOnboarding.addPhase') }}

        .phase-builder.space-y-4
          .glass-card.p-4.rounded-xl(v-for="(phase, pIdx) in templateForm.phases" :key="pIdx")
            .flex.items-center.justify-between.mb-3
              .flex.items-center.gap-2
                .w-8.h-8.rounded-lg.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
                  span.text-sm.font-bold(style="color: #7849ff") {{ pIdx + 1 }}
                el-input(v-model="phase.name" :placeholder="$t('customerOnboarding.phaseName')" style="width: 200px" size="small")
              .flex.items-center.gap-2
                el-input-number(v-model="phase.duration" :min="1" :max="90" size="small" style="width: 120px")
                span.text-xs(style="color: var(--text-muted)") {{ $t('customerOnboarding.days') }}
                el-button(size="small" type="danger" text @click="removePhase(pIdx)" :aria-label="$t('customerOnboarding.delete')")
                  Icon(name="ph:trash" size="14")
            el-input(v-model="phase.description" type="textarea" :rows="1" :placeholder="$t('customerOnboarding.phaseDescription')" size="small")
            .mt-3
              .flex.items-center.justify-between.mb-2
                span.text-xs.font-semibold(style="color: var(--text-muted)") {{ $t('customerOnboarding.checklistItems') }}
                el-button(size="small" text @click="addChecklistItem(pIdx)")
                  Icon(name="ph:plus" size="12" class="mr-1")
                  | {{ $t('customerOnboarding.addItem') }}
              .flex.items-center.gap-2.mb-2(v-for="(item, iIdx) in phase.checklistItems" :key="iIdx")
                el-input(v-model="phase.checklistItems[iIdx]" :placeholder="$t('customerOnboarding.itemName')" size="small" style="flex: 1")
                el-button(size="small" type="danger" text @click="phase.checklistItems.splice(iIdx, 1)" :aria-label="$t('customerOnboarding.removeItem')")
                  Icon(name="ph:x" size="12")

    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showTemplateDialog = false") {{ $t('customerOnboarding.cancel') }}
        el-button(type="primary" @click="saveTemplate" :disabled="!templateForm.name" class="!bg-[#7849ff] !border-none") {{ editingTemplate ? $t('customerOnboarding.update') : $t('customerOnboarding.create') }}

  //- ═══════════════════════════════════════════════════
  //- Onboarding Detail Dialog
  //- ═══════════════════════════════════════════════════
  el-dialog(v-model="showDetailDialog" :title="detailOnboarding?.customerName || ''" width="700px")
    template(v-if="detailOnboarding")
      .grid.gap-4.mb-6(class="grid-cols-2")
        .glass-card.p-4.rounded-xl
          p.text-xs(style="color: var(--text-muted)") {{ $t('customerOnboarding.company') }}
          p.text-sm.font-bold.mt-1(style="color: var(--text-primary)") {{ detailOnboarding.company }}
        .glass-card.p-4.rounded-xl
          p.text-xs(style="color: var(--text-muted)") {{ $t('customerOnboarding.assignedCSM') }}
          p.text-sm.font-bold.mt-1(style="color: var(--text-primary)") {{ detailOnboarding.assignedCSM }}
        .glass-card.p-4.rounded-xl
          p.text-xs(style="color: var(--text-muted)") {{ $t('customerOnboarding.progress') }}
          .flex.items-center.gap-2.mt-1
            el-progress(:percentage="detailOnboarding.progress" :stroke-width="8" :color="getProgressColor(detailOnboarding.progress)" style="flex: 1")
            span.text-sm.font-bold(:style="{ color: getProgressColor(detailOnboarding.progress) }") {{ detailOnboarding.progress }}%
        .glass-card.p-4.rounded-xl
          p.text-xs(style="color: var(--text-muted)") {{ $t('customerOnboarding.status') }}
          el-tag.mt-1(:type="getStatusTagType(detailOnboarding.status)" size="small" round effect="dark") {{ getStatusLabel(detailOnboarding.status) }}
      .glass-card.p-4.rounded-xl
        h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)") {{ $t('customerOnboarding.timeline') }}
        el-timeline
          el-timeline-item(
            v-for="event in detailOnboarding.timeline"
            :key="event.date"
            :timestamp="formatDate(event.date)"
            placement="top"
            :color="event.type === 'completed' ? '#22c55e' : event.type === 'started' ? '#7849ff' : '#f59e0b'"
          )
            p.text-sm(style="color: var(--text-primary)") {{ event.description }}
</template>

<script setup lang="ts">
/* eslint-disable no-use-before-define */
import { ElNotification, ElMessageBox } from 'element-plus';
import VChart from 'vue-echarts';
import { graphic } from 'echarts/core';

definePageMeta({ middleware: 'permissions' });

const { t, locale } = useI18n();

// ── State ──────────────────────────────────────────────
const activeTab = ref('active');
const searchQuery = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const trendPeriod = ref('6m');
const selectedOnboardingId = ref('');
const expandedPhases = ref<number[]>([0]);
const showNewOnboardingDialog = ref(false);
const showTemplateDialog = ref(false);
const showDetailDialog = ref(false);
const editingTemplate = ref<OnboardingTemplate | null>(null);
const detailOnboarding = ref<OnboardingRecord | null>(null);

// ── Interfaces ─────────────────────────────────────────
interface OnboardingTask {
  name: string;
  assignee: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  completed: boolean;
}

interface OnboardingPhase {
  name: string;
  description: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  tasks: OnboardingTask[];
}

interface OnboardingRecord {
  id: string;
  customerName: string;
  company: string;
  assignedCSM: string;
  startDate: string;
  progress: number;
  currentPhase: string;
  daysRemaining: number;
  status: 'on-track' | 'at-risk' | 'delayed';
  templateId: string;
  phases: OnboardingPhase[];
  timeline: { date: string; description: string; type: string }[];
}

interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  phasesCount: number;
  avgCompletionDays: number;
  usageCount: number;
  lastUsed: string;
  phases: { name: string; description: string; duration: number; checklistItems: string[] }[];
}

interface RecentCompletion {
  customerName: string;
  template: string;
  completedDate: string;
  timeToFirstValue: number;
  totalDuration: number;
  npsScore: number;
}

// ── Data ───────────────────────────────────────────────
const csmList = ref(['Sarah Johnson', 'Ahmed Al-Rashid', 'David Chen', 'Maria Garcia', 'James Wilson']);

const onboardings = ref<OnboardingRecord[]>([]);
const templates = ref<OnboardingTemplate[]>([]);
const recentCompletions = ref<RecentCompletion[]>([]);

// ── Forms ──────────────────────────────────────────────
const onboardingForm = ref({
  customerName: '',
  company: '',
  assignedCSM: '',
  templateId: '',
  startDate: new Date()
});

const templateForm = ref({
  name: '',
  description: '',
  phases: [{ name: '', description: '', duration: 7, checklistItems: [''] }] as {
    name: string;
    description: string;
    duration: number;
    checklistItems: string[];
  }[]
});

// ── Computed ───────────────────────────────────────────
const activeOnboardingsCount = computed(() => onboardings.value.filter(o => o.progress < 100).length);
const completionRate = computed(() => {
  const total = onboardings.value.length + recentCompletions.value.length;
  if (!total) return 0;
  return Math.round((recentCompletions.value.length / total) * 100);
});
const avgDuration = computed(() => {
  if (!recentCompletions.value.length) return 0;
  return Math.round(recentCompletions.value.reduce((s, c) => s + c.totalDuration, 0) / recentCompletions.value.length);
});
const atRiskCount = computed(() => onboardings.value.filter(o => o.status === 'at-risk' || o.status === 'delayed').length);

const filteredOnboardings = computed(() => {
  let result = onboardings.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      o => o.customerName.toLowerCase().includes(q) || o.company.toLowerCase().includes(q) || o.assignedCSM.toLowerCase().includes(q)
    );
  }
  if (statusFilter.value) {
    result = result.filter(o => o.status === statusFilter.value);
  }
  return result;
});

const paginatedOnboardings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredOnboardings.value.slice(start, start + pageSize.value);
});

const selectedOnboarding = computed(() => onboardings.value.find(o => o.id === selectedOnboardingId.value) || null);

const selectedOnboardingPhases = computed(() => selectedOnboarding.value?.phases || []);

const currentMilestoneStep = computed(() => {
  if (!selectedOnboarding.value) return 0;
  const phases = selectedOnboarding.value.phases;
  for (let i = 0; i < phases.length; i++) {
    if (phases[i]!.progress < 100) return i;
  }
  return phases.length;
});

const ttvMetrics = computed(() => [
  {
    label: t('customerOnboarding.avgTimeToFirstValue'),
    value: '8.5' + t('customerOnboarding.daySuffix'),
    icon: 'ph:lightning-bold',
    color: '#7849ff',
    trend: -12
  },
  {
    label: t('customerOnboarding.avgOnboardingDuration'),
    value: avgDuration.value + t('customerOnboarding.daySuffix'),
    icon: 'ph:timer-bold',
    color: '#3b82f6',
    trend: -8
  },
  {
    label: t('customerOnboarding.completionRate'),
    value: completionRate.value + '%',
    icon: 'ph:check-circle-bold',
    color: '#22c55e',
    trend: 5
  },
  {
    label: t('customerOnboarding.avgNpsScore'),
    value: '72',
    icon: 'ph:star-bold',
    color: '#f59e0b',
    trend: 3
  }
]);

// ── ECharts: Duration Trend ────────────────────────────
const durationTrendOption = computed(() => {
  const getMonthName = (monthIndex: number) => new Date(2026, monthIndex, 1).toLocaleDateString(locale.value, { month: 'short' });
  const months = trendPeriod.value === '12m' ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1].map(getMonthName) : [8, 9, 10, 11, 0, 1].map(getMonthName);
  const durations = trendPeriod.value === '12m' ? [42, 39, 38, 36, 35, 33, 32, 30, 29, 28, 27, 26] : [33, 32, 30, 29, 27, 26];
  const firstValues = trendPeriod.value === '12m' ? [14, 13, 12, 11, 10, 10, 9, 9, 8, 8, 8, 8] : [10, 9, 9, 8, 8, 8];

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 30, 45, 0.85)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); border-radius: 16px;'
    },
    legend: {
      data: [t('customerOnboarding.onboardingDuration'), t('customerOnboarding.timeToFirstValue')],
      textStyle: { color: '#94A3B8' },
      bottom: 0
    },
    grid: { top: 20, right: 20, bottom: 40, left: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { color: '#94A3B8' },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed' as const, color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B', formatter: `{value}${t('customerOnboarding.daySuffix')}` }
    },
    series: [
      {
        name: t('customerOnboarding.onboardingDuration'),
        type: 'line',
        data: durations,
        smooth: true,
        showSymbol: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: '#7849ff', shadowBlur: 12, shadowColor: 'rgba(120, 73, 255, 0.4)', shadowOffsetY: 6 },
        itemStyle: { color: '#fff', borderColor: '#7849ff', borderWidth: 2 },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(120, 73, 255, 0.25)' },
            { offset: 1, color: 'rgba(120, 73, 255, 0)' }
          ])
        }
      },
      {
        name: t('customerOnboarding.timeToFirstValue'),
        type: 'line',
        data: firstValues,
        smooth: true,
        showSymbol: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: '#22c55e', shadowBlur: 12, shadowColor: 'rgba(34, 197, 94, 0.4)', shadowOffsetY: 6 },
        itemStyle: { color: '#fff', borderColor: '#22c55e', borderWidth: 2 },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34, 197, 94, 0.2)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0)' }
          ])
        }
      }
    ]
  };
});

// ── ECharts: Completion by Template ────────────────────
const completionByTemplateOption = computed(() => {
  const data = templates.value.map(tmpl => ({
    name: tmpl.name,
    value: tmpl.usageCount
  }));

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 30, 45, 0.85)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); border-radius: 16px;',
      formatter: (params: any) => `<strong>${params.name}</strong><br/>${t('customerOnboarding.used')}: ${params.value} (${params.percent}%)`
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#94A3B8', fontSize: 12 }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: 'transparent', borderWidth: 3 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
          scaleSize: 6
        },
        data: data.map((d, i) => ({
          ...d,
          itemStyle: { color: ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'][i % 5] }
        }))
      }
    ]
  };
});

// ── Helpers ────────────────────────────────────────────
function getInitial(name: string): string {
  return (name || '?').charAt(0).toUpperCase();
}

function getAvatarGradient(name: string): string {
  const colors = [
    'linear-gradient(135deg, #7849ff, #a855f7)',
    'linear-gradient(135deg, #3b82f6, #60a5fa)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ef4444, #f87171)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    'linear-gradient(135deg, #ec4899, #f472b6)'
  ];
  return colors[(name || '').charCodeAt(0) % colors.length] || '';
}

function getProgressColor(progress: number): string {
  if (progress >= 80) return '#22c55e';
  if (progress >= 50) return '#3b82f6';
  if (progress >= 25) return '#f59e0b';
  return '#ef4444';
}

function getStatusTagType(status: string): string {
  if (status === 'on-track') return 'success';
  if (status === 'at-risk') return 'warning';
  return 'danger';
}

function getStatusLabel(status: string): string {
  if (status === 'on-track') return t('customerOnboarding.onTrack');
  if (status === 'at-risk') return t('customerOnboarding.atRisk');
  return t('customerOnboarding.delayed');
}

function getTaskStatusType(status: string): string {
  if (status === 'completed') return 'success';
  if (status === 'in-progress') return 'warning';
  return 'info';
}

function getTaskStatusLabel(status: string): string {
  if (status === 'completed') return t('customerOnboarding.completed');
  if (status === 'in-progress') return t('customerOnboarding.inProgressStatus');
  return t('customerOnboarding.pending');
}

function getPhaseColor(phase: OnboardingPhase): string {
  if (phase.progress >= 100) return '#22c55e';
  if (phase.progress >= 50) return '#3b82f6';
  if (phase.progress > 0) return '#f59e0b';
  return '#94a3b8';
}

function getPhaseIcon(phase: OnboardingPhase): string {
  if (phase.progress >= 100) return 'ph:check-circle-bold';
  if (phase.progress > 0) return 'ph:spinner-bold';
  return 'ph:circle-dashed-bold';
}

function getPhaseStepStatus(phase: OnboardingPhase, idx: number): string {
  if (phase.progress >= 100) return 'success';
  if (idx === currentMilestoneStep.value) return 'process';
  if (phase.progress > 0) return 'process';
  return 'wait';
}

function getNpsColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString(locale.value, { month: 'short', day: 'numeric', year: 'numeric' });
}

function togglePhase(idx: number) {
  const pos = expandedPhases.value.indexOf(idx);
  if (pos >= 0) {
    expandedPhases.value.splice(pos, 1);
  } else {
    expandedPhases.value.push(idx);
  }
}

function onTaskToggle(phaseIdx: number, taskIdx: number) {
  if (!selectedOnboarding.value) return;
  const phase = selectedOnboarding.value.phases[phaseIdx]!;
  const task = phase.tasks[taskIdx]!;
  task.status = task.completed ? 'completed' : 'pending';
  phase.completedTasks = phase.tasks.filter(task => task.completed).length;
  phase.progress = phase.totalTasks > 0 ? Math.round((phase.completedTasks / phase.totalTasks) * 100) : 0;
  // Recalculate onboarding progress
  const totalTasks = selectedOnboarding.value.phases.reduce((s, p) => s + p.totalTasks, 0);
  const completedTasks = selectedOnboarding.value.phases.reduce((s, p) => s + p.completedTasks, 0);
  selectedOnboarding.value.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

// ── Actions ────────────────────────────────────────────
function openOnboardingDetail(row: OnboardingRecord) {
  detailOnboarding.value = row;
  showDetailDialog.value = true;
}

function sendReminder(row: OnboardingRecord) {
  ElNotification({
    type: 'success',
    title: t('customerOnboarding.reminderSent'),
    message: t('customerOnboarding.reminderSentTo', { name: row.customerName })
  });
}

function openTemplateDialog(tmpl?: OnboardingTemplate) {
  if (tmpl) {
    editingTemplate.value = tmpl;
    templateForm.value = {
      name: tmpl.name,
      description: tmpl.description,
      phases: tmpl.phases.map(p => ({ ...p, checklistItems: [...p.checklistItems] }))
    };
  } else {
    editingTemplate.value = null;
    resetTemplateForm();
  }
  showTemplateDialog.value = true;
}

function handleTemplateAction(command: string, tmpl: OnboardingTemplate) {
  if (command === 'edit') {
    openTemplateDialog(tmpl);
  } else if (command === 'duplicate') {
    const dup: OnboardingTemplate = {
      ...tmpl,
      id: 'tmpl-' + Date.now(),
      name: tmpl.name + ' (' + t('customerOnboarding.copy') + ')',
      usageCount: 0,
      phases: tmpl.phases.map(p => ({ ...p, checklistItems: [...p.checklistItems] }))
    };
    templates.value.push(dup);
    ElNotification({ type: 'success', title: t('customerOnboarding.duplicated'), message: t('customerOnboarding.templateDuplicated') });
  } else if (command === 'delete') {
    ElMessageBox.confirm(t('customerOnboarding.deleteTemplateConfirm', { name: tmpl.name }), t('customerOnboarding.delete'), {
      type: 'warning',
      confirmButtonText: t('customerOnboarding.delete'),
      cancelButtonText: t('customerOnboarding.cancel')
    })
      .then(() => {
        templates.value = templates.value.filter(tp => tp.id !== tmpl.id);
        ElNotification({ type: 'success', title: t('customerOnboarding.deleted'), message: t('customerOnboarding.templateDeleted') });
      })
      .catch(() => {
        /* cancelled */
      });
  }
}

function useTemplate(tmpl: OnboardingTemplate) {
  onboardingForm.value.templateId = tmpl.id;
  showNewOnboardingDialog.value = true;
}

function addPhase() {
  templateForm.value.phases.push({ name: '', description: '', duration: 7, checklistItems: [''] });
}

function removePhase(idx: number) {
  templateForm.value.phases.splice(idx, 1);
}

function addChecklistItem(phaseIdx: number) {
  templateForm.value.phases[phaseIdx]!.checklistItems.push('');
}

function saveTemplate() {
  if (!templateForm.value.name) return;
  if (editingTemplate.value) {
    const idx = templates.value.findIndex(tp => tp.id === editingTemplate.value!.id);
    if (idx >= 0) {
      templates.value[idx] = {
        ...templates.value[idx],
        name: templateForm.value.name,
        description: templateForm.value.description,
        phasesCount: templateForm.value.phases.length,
        phases: templateForm.value.phases.map(p => ({ ...p, checklistItems: p.checklistItems.filter(Boolean) }))
      } as any;
    }
    ElNotification({ type: 'success', title: t('customerOnboarding.updated'), message: t('customerOnboarding.templateUpdated') });
  } else {
    const newTmpl: OnboardingTemplate = {
      id: 'tmpl-' + Date.now(),
      name: templateForm.value.name,
      description: templateForm.value.description,
      icon: 'ph:blueprint-bold',
      color: '#7849ff',
      phasesCount: templateForm.value.phases.length,
      avgCompletionDays: templateForm.value.phases.reduce((s, p) => s + p.duration, 0),
      usageCount: 0,
      lastUsed: new Date().toISOString(),
      phases: templateForm.value.phases.map(p => ({ ...p, checklistItems: p.checklistItems.filter(Boolean) }))
    };
    templates.value.push(newTmpl);
    ElNotification({ type: 'success', title: t('customerOnboarding.created'), message: t('customerOnboarding.templateCreated') });
  }
  showTemplateDialog.value = false;
}

function createOnboarding() {
  if (!onboardingForm.value.customerName) return;
  const tmpl = templates.value.find(tp => tp.id === onboardingForm.value.templateId);
  const phases: OnboardingPhase[] = tmpl
    ? tmpl.phases.map(p => ({
        name: p.name,
        description: p.description,
        progress: 0,
        completedTasks: 0,
        totalTasks: p.checklistItems.length,
        tasks: p.checklistItems.map(item => ({
          name: item,
          assignee: onboardingForm.value.assignedCSM || csmList.value[0] || '',
          dueDate: new Date(Date.now() + p.duration * 86400000).toISOString(),
          status: 'pending' as const,
          completed: false
        }))
      }))
    : [
        {
          name: t('customerOnboarding.kickoff'),
          description: t('customerOnboarding.kickoffDesc'),
          progress: 0,
          completedTasks: 0,
          totalTasks: 3,
          tasks: [
            {
              name: t('customerOnboarding.welcomeCall'),
              assignee: onboardingForm.value.assignedCSM || csmList.value[0] || '',
              dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
              status: 'pending' as const,
              completed: false
            },
            {
              name: t('customerOnboarding.accessSetup'),
              assignee: onboardingForm.value.assignedCSM || csmList.value[0] || '',
              dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
              status: 'pending' as const,
              completed: false
            },
            {
              name: t('customerOnboarding.requirementsGathering'),
              assignee: onboardingForm.value.assignedCSM || csmList.value[0] || '',
              dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
              status: 'pending' as const,
              completed: false
            }
          ]
        }
      ];

  const totalDays = tmpl ? tmpl.avgCompletionDays : 30;
  const newOnboarding: OnboardingRecord = {
    id: 'ob-' + Date.now(),
    customerName: onboardingForm.value.customerName,
    company: onboardingForm.value.company || onboardingForm.value.customerName,
    assignedCSM: onboardingForm.value.assignedCSM || csmList.value[0] || '',
    startDate: new Date(onboardingForm.value.startDate).toISOString(),
    progress: 0,
    currentPhase: phases[0]!.name,
    daysRemaining: totalDays,
    status: 'on-track',
    templateId: onboardingForm.value.templateId || '',
    phases,
    timeline: [{ date: new Date().toISOString(), description: t('customerOnboarding.onboardingStarted'), type: 'started' }]
  };

  onboardings.value.unshift(newOnboarding);
  if (tmpl) {
    const tmplIdx = templates.value.findIndex(tp => tp.id === tmpl.id);
    if (tmplIdx >= 0) templates.value[tmplIdx]!.usageCount++;
  }
  showNewOnboardingDialog.value = false;
  resetOnboardingForm();
  ElNotification({ type: 'success', title: t('customerOnboarding.created'), message: t('customerOnboarding.onboardingCreated') });
}

function resetOnboardingForm() {
  onboardingForm.value = { customerName: '', company: '', assignedCSM: '', templateId: '', startDate: new Date() };
}

function resetTemplateForm() {
  editingTemplate.value = null;
  templateForm.value = { name: '', description: '', phases: [{ name: '', description: '', duration: 7, checklistItems: [''] }] };
}

// ── Seed Demo Data ─────────────────────────────────────
function seedDemoData() {
  const now = new Date();

  templates.value = [
    {
      id: 'tmpl-1',
      name: t('customerOnboarding.enterpriseOnboarding'),
      description: t('customerOnboarding.enterpriseOnboardingDesc'),
      icon: 'ph:buildings-bold',
      color: '#7849ff',
      phasesCount: 5,
      avgCompletionDays: 45,
      usageCount: 23,
      lastUsed: new Date(now.getTime() - 3 * 86400000).toISOString(),
      phases: [
        {
          name: t('customerOnboarding.discovery'),
          description: t('customerOnboarding.discoveryDesc'),
          duration: 7,
          checklistItems: [
            t('customerOnboarding.kickoffMeeting'),
            t('customerOnboarding.stakeholderMapping'),
            t('customerOnboarding.requirementsDoc')
          ]
        },
        {
          name: t('customerOnboarding.setup'),
          description: t('customerOnboarding.setupDesc'),
          duration: 10,
          checklistItems: [
            t('customerOnboarding.accountProvisioning'),
            t('customerOnboarding.ssoConfig'),
            t('customerOnboarding.dataImport'),
            t('customerOnboarding.integrationSetup')
          ]
        },
        {
          name: t('customerOnboarding.training'),
          description: t('customerOnboarding.trainingDesc'),
          duration: 10,
          checklistItems: [t('customerOnboarding.adminTraining'), t('customerOnboarding.userTraining'), t('customerOnboarding.trainTheTrainer')]
        },
        {
          name: t('customerOnboarding.goLive'),
          description: t('customerOnboarding.goLiveDesc'),
          duration: 7,
          checklistItems: [t('customerOnboarding.pilotLaunch'), t('customerOnboarding.fullRollout'), t('customerOnboarding.performanceReview')]
        },
        {
          name: t('customerOnboarding.optimization'),
          description: t('customerOnboarding.optimizationDesc'),
          duration: 11,
          checklistItems: [t('customerOnboarding.usageReview'), t('customerOnboarding.successPlan'), t('customerOnboarding.handoffToCSM')]
        }
      ]
    },
    {
      id: 'tmpl-2',
      name: t('customerOnboarding.smbQuickStart'),
      description: t('customerOnboarding.smbQuickStartDesc'),
      icon: 'ph:rocket-bold',
      color: '#22c55e',
      phasesCount: 3,
      avgCompletionDays: 14,
      usageCount: 47,
      lastUsed: new Date(now.getTime() - 1 * 86400000).toISOString(),
      phases: [
        {
          name: t('customerOnboarding.welcomeSetup'),
          description: t('customerOnboarding.welcomeSetupDesc'),
          duration: 3,
          checklistItems: [t('customerOnboarding.welcomeEmail'), t('customerOnboarding.accountSetup'), t('customerOnboarding.quickStartGuide')]
        },
        {
          name: t('customerOnboarding.configTraining'),
          description: t('customerOnboarding.configTrainingDesc'),
          duration: 5,
          checklistItems: [t('customerOnboarding.basicConfig'), t('customerOnboarding.liveDemo'), t('customerOnboarding.dataImport')]
        },
        {
          name: t('customerOnboarding.activationReview'),
          description: t('customerOnboarding.activationReviewDesc'),
          duration: 6,
          checklistItems: [t('customerOnboarding.firstValueCheck'), t('customerOnboarding.feedbackCall'), t('customerOnboarding.successHandoff')]
        }
      ]
    },
    {
      id: 'tmpl-3',
      name: t('customerOnboarding.selfServiceSetup'),
      description: t('customerOnboarding.selfServiceSetupDesc'),
      icon: 'ph:user-circle-gear-bold',
      color: '#3b82f6',
      phasesCount: 3,
      avgCompletionDays: 7,
      usageCount: 89,
      lastUsed: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
      phases: [
        {
          name: t('customerOnboarding.autoSetup'),
          description: t('customerOnboarding.autoSetupDesc'),
          duration: 1,
          checklistItems: [t('customerOnboarding.accountCreated'), t('customerOnboarding.welcomeEmailSent')]
        },
        {
          name: t('customerOnboarding.guidedTour'),
          description: t('customerOnboarding.guidedTourDesc'),
          duration: 3,
          checklistItems: [t('customerOnboarding.productTour'), t('customerOnboarding.firstAction'), t('customerOnboarding.profileComplete')]
        },
        {
          name: t('customerOnboarding.valueRealization'),
          description: t('customerOnboarding.valueRealizationDesc'),
          duration: 3,
          checklistItems: [t('customerOnboarding.firstMilestone'), t('customerOnboarding.inviteTeam')]
        }
      ]
    }
  ];

  const makePhases = (tmplId: string, progress: number): OnboardingPhase[] => {
    const tmpl = templates.value.find(tp => tp.id === tmplId);
    if (!tmpl) return [];
    const phaseCount = tmpl.phases.length;
    const phaseShare = 100 / phaseCount;
    return tmpl.phases.map((p, phaseIndex) => {
      const phaseStart = phaseIndex * phaseShare;
      const phaseProg = Math.round(Math.min(100, Math.max(0, ((progress - phaseStart) / phaseShare) * 100)));
      const completedCount = Math.round((phaseProg / 100) * p.checklistItems.length);
      return {
        name: p.name,
        description: p.description,
        progress: phaseProg,
        completedTasks: completedCount,
        totalTasks: p.checklistItems.length,
        tasks: p.checklistItems.map((item, idx) => ({
          name: item,
          assignee: csmList.value[idx % csmList.value.length] || '',
          dueDate: new Date(now.getTime() + (idx + 1) * 3 * 86400000).toISOString(),
          status: idx < completedCount ? ('completed' as const) : idx === completedCount ? ('in-progress' as const) : ('pending' as const),
          completed: idx < completedCount
        }))
      };
    });
  };

  onboardings.value = [
    {
      id: 'ob-1',
      customerName: 'Acme Corporation',
      company: 'Acme Corp',
      assignedCSM: 'Sarah Johnson',
      startDate: new Date(now.getTime() - 20 * 86400000).toISOString(),
      progress: 65,
      currentPhase: t('customerOnboarding.training'),
      daysRemaining: 25,
      status: 'on-track',
      templateId: 'tmpl-1',
      phases: makePhases('tmpl-1', 65),
      timeline: [
        { date: new Date(now.getTime() - 20 * 86400000).toISOString(), description: t('customerOnboarding.onboardingStarted'), type: 'started' },
        { date: new Date(now.getTime() - 15 * 86400000).toISOString(), description: t('customerOnboarding.discoveryCompleted'), type: 'completed' },
        { date: new Date(now.getTime() - 8 * 86400000).toISOString(), description: t('customerOnboarding.setupCompleted'), type: 'completed' }
      ]
    },
    {
      id: 'ob-2',
      customerName: 'GlobalTech Industries',
      company: 'GlobalTech',
      assignedCSM: 'Ahmed Al-Rashid',
      startDate: new Date(now.getTime() - 30 * 86400000).toISOString(),
      progress: 40,
      currentPhase: t('customerOnboarding.setup'),
      daysRemaining: 15,
      status: 'at-risk',
      templateId: 'tmpl-1',
      phases: makePhases('tmpl-1', 40),
      timeline: [
        { date: new Date(now.getTime() - 30 * 86400000).toISOString(), description: t('customerOnboarding.onboardingStarted'), type: 'started' },
        { date: new Date(now.getTime() - 20 * 86400000).toISOString(), description: t('customerOnboarding.discoveryCompleted'), type: 'completed' },
        { date: new Date(now.getTime() - 5 * 86400000).toISOString(), description: t('customerOnboarding.setupDelayed'), type: 'warning' }
      ]
    },
    {
      id: 'ob-3',
      customerName: 'StartupFlow Inc',
      company: 'StartupFlow',
      assignedCSM: 'David Chen',
      startDate: new Date(now.getTime() - 5 * 86400000).toISOString(),
      progress: 45,
      currentPhase: t('customerOnboarding.configTraining'),
      daysRemaining: 9,
      status: 'on-track',
      templateId: 'tmpl-2',
      phases: makePhases('tmpl-2', 45),
      timeline: [
        { date: new Date(now.getTime() - 5 * 86400000).toISOString(), description: t('customerOnboarding.onboardingStarted'), type: 'started' },
        { date: new Date(now.getTime() - 2 * 86400000).toISOString(), description: t('customerOnboarding.welcomeSetupDone'), type: 'completed' }
      ]
    },
    {
      id: 'ob-4',
      customerName: 'MegaRetail Group',
      company: 'MegaRetail',
      assignedCSM: 'Maria Garcia',
      startDate: new Date(now.getTime() - 45 * 86400000).toISOString(),
      progress: 30,
      currentPhase: t('customerOnboarding.setup'),
      daysRemaining: 3,
      status: 'delayed',
      templateId: 'tmpl-1',
      phases: makePhases('tmpl-1', 30),
      timeline: [
        { date: new Date(now.getTime() - 45 * 86400000).toISOString(), description: t('customerOnboarding.onboardingStarted'), type: 'started' },
        { date: new Date(now.getTime() - 10 * 86400000).toISOString(), description: t('customerOnboarding.setupDelayed'), type: 'warning' }
      ]
    },
    {
      id: 'ob-5',
      customerName: 'CloudNine Solutions',
      company: 'CloudNine',
      assignedCSM: 'James Wilson',
      startDate: new Date(now.getTime() - 2 * 86400000).toISOString(),
      progress: 15,
      currentPhase: t('customerOnboarding.autoSetup'),
      daysRemaining: 5,
      status: 'on-track',
      templateId: 'tmpl-3',
      phases: makePhases('tmpl-3', 15),
      timeline: [
        { date: new Date(now.getTime() - 2 * 86400000).toISOString(), description: t('customerOnboarding.onboardingStarted'), type: 'started' }
      ]
    },
    {
      id: 'ob-6',
      customerName: 'DataDriven Analytics',
      company: 'DataDriven',
      assignedCSM: 'Sarah Johnson',
      startDate: new Date(now.getTime() - 12 * 86400000).toISOString(),
      progress: 80,
      currentPhase: t('customerOnboarding.activationReview'),
      daysRemaining: 2,
      status: 'on-track',
      templateId: 'tmpl-2',
      phases: makePhases('tmpl-2', 80),
      timeline: [
        { date: new Date(now.getTime() - 12 * 86400000).toISOString(), description: t('customerOnboarding.onboardingStarted'), type: 'started' },
        { date: new Date(now.getTime() - 9 * 86400000).toISOString(), description: t('customerOnboarding.welcomeSetupDone'), type: 'completed' },
        { date: new Date(now.getTime() - 4 * 86400000).toISOString(), description: t('customerOnboarding.configTrainingDone'), type: 'completed' }
      ]
    }
  ];

  recentCompletions.value = [
    {
      customerName: 'TechVista Corp',
      template: t('customerOnboarding.enterpriseOnboarding'),
      completedDate: new Date(now.getTime() - 2 * 86400000).toISOString(),
      timeToFirstValue: 6,
      totalDuration: 38,
      npsScore: 85
    },
    {
      customerName: 'QuickShip Logistics',
      template: t('customerOnboarding.smbQuickStart'),
      completedDate: new Date(now.getTime() - 5 * 86400000).toISOString(),
      timeToFirstValue: 3,
      totalDuration: 12,
      npsScore: 92
    },
    {
      customerName: 'FinServe Partners',
      template: t('customerOnboarding.enterpriseOnboarding'),
      completedDate: new Date(now.getTime() - 8 * 86400000).toISOString(),
      timeToFirstValue: 10,
      totalDuration: 42,
      npsScore: 68
    },
    {
      customerName: 'NovaBrand Agency',
      template: t('customerOnboarding.selfServiceSetup'),
      completedDate: new Date(now.getTime() - 10 * 86400000).toISOString(),
      timeToFirstValue: 2,
      totalDuration: 5,
      npsScore: 78
    },
    {
      customerName: 'HealthPlus Medical',
      template: t('customerOnboarding.enterpriseOnboarding'),
      completedDate: new Date(now.getTime() - 14 * 86400000).toISOString(),
      timeToFirstValue: 12,
      totalDuration: 48,
      npsScore: 61
    },
    {
      customerName: 'EduLearn Platform',
      template: t('customerOnboarding.smbQuickStart'),
      completedDate: new Date(now.getTime() - 18 * 86400000).toISOString(),
      timeToFirstValue: 4,
      totalDuration: 11,
      npsScore: 88
    }
  ];

  selectedOnboardingId.value = 'ob-1';
}

onMounted(() => {
  seedDemoData();
});
</script>

<style lang="scss" scoped>
.onboarding-page {
  animation: fadeInUp 0.4s ease-out;
}

/* ── KPI Cards ── */
.kpi-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

.kpi-card-inner {
  padding: 24px;
  position: relative;
  z-index: 1;
}

.active-card {
  background: linear-gradient(135deg, rgba(120, 73, 255, 0.12), rgba(139, 92, 246, 0.06));
  border: 1px solid rgba(120, 73, 255, 0.2);
  &:hover {
    box-shadow: 0 8px 32px rgba(120, 73, 255, 0.15);
  }
}

.completion-card {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(22, 163, 74, 0.06));
  border: 1px solid rgba(34, 197, 94, 0.2);
  &:hover {
    box-shadow: 0 8px 32px rgba(34, 197, 94, 0.15);
  }
}

.duration-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.06));
  border: 1px solid rgba(59, 130, 246, 0.2);
  &:hover {
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
  }
}

.risk-card {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.06));
  border: 1px solid rgba(245, 158, 11, 0.2);
  &:hover {
    box-shadow: 0 8px 32px rgba(245, 158, 11, 0.15);
  }
}

.kpi-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.kpi-value {
  font-size: 32px;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1;
}

.kpi-pct {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
}

.kpi-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.active-icon {
  background: rgba(120, 73, 255, 0.15);
  color: #7849ff;
}
.completion-icon {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}
.duration-icon {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}
.risk-icon {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

/* ── Glass Card ── */
.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

/* ── Avatar ── */
.avatar-circle {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: white;

  &.small {
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 10px;
    font-size: 13px;
  }
}

/* ── Tabs ── */
.onboarding-tabs {
  :deep(.el-tabs__header) {
    background: var(--glass-bg, rgba(255, 255, 255, 0.04));
    border-color: var(--glass-border, rgba(255, 255, 255, 0.08));
    border-radius: 12px 12px 0 0;
  }

  :deep(.el-tabs__content) {
    padding: 24px;
    background: transparent;
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted, #94a3b8);
  }

  :deep(.el-tabs__item.is-active) {
    color: #7849ff;
  }

  :deep(.el-tabs__active-bar) {
    background-color: #7849ff;
  }
}

/* ── Template Cards ── */
.template-card {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.1);
  }
}

/* ── Checklist Items ── */
.checklist-item {
  transition: background 0.2s ease;

  &:hover {
    background: rgba(120, 73, 255, 0.03);
    border-radius: 8px;
    padding-left: 8px;
    padding-right: 8px;
  }
}

/* ── Chart Container ── */
.chart-container {
  min-height: 320px;
}

/* ── Table Enhancements ── */
:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(120, 73, 255, 0.05);
}

:deep(.el-table .el-table__row:hover > td) {
  background: rgba(120, 73, 255, 0.04) !important;
}

:deep(.el-table th.el-table__cell) {
  background: rgba(120, 73, 255, 0.05) !important;
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(.el-table .el-table__row) {
  cursor: pointer;
}

/* ── Steps ── */
:deep(.el-steps) {
  .el-step__head.is-success {
    color: #22c55e;
    border-color: #22c55e;
  }
  .el-step__title.is-success {
    color: #22c55e;
  }
  .el-step__head.is-process {
    color: #7849ff;
    border-color: #7849ff;
  }
  .el-step__title.is-process {
    color: #7849ff;
  }
}

/* ── Timeline ── */
:deep(.el-timeline-item__timestamp) {
  color: var(--text-muted, #94a3b8) !important;
}

/* ── Phase Builder ── */
.phase-builder {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(120, 73, 255, 0.3);
    border-radius: 4px;
  }
}

/* ── Animations ── */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .kpi-value {
    font-size: 24px;
  }

  .kpi-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .chart-container {
    min-height: 250px;
  }

  .onboarding-page {
    padding: 16px !important;
  }
}
</style>
