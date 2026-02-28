<template lang="pug">
.journey-builder-page.p-6(class="md:p-8")
  //- ════════════════════════════════════════════════════════
  //- Page Header
  //- ════════════════════════════════════════════════════════
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    div
      h1.text-3xl.font-black.tracking-tight.flex.items-center.gap-3(style="color: var(--text-primary)")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #7849ff, #a855f7)")
          Icon(name="ph:path-bold" size="22" style="color: white")
        | {{ $t('journeyBuilder.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('journeyBuilder.subtitle') }}

    .flex.items-center.gap-3
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :start-placeholder="$t('journeyBuilder.startDate')"
        :end-placeholder="$t('journeyBuilder.endDate')"
        size="large"
        style="width: 280px"
        :shortcuts="dateShortcuts"
      )
      el-button(size="large" type="primary" class="!bg-[#7849ff] !border-none !rounded-xl" @click="refreshData" :loading="loading")
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-2 {{ $t('journeyBuilder.refresh') }}

  //- ════════════════════════════════════════════════════════
  //- KPI Stat Cards
  //- ════════════════════════════════════════════════════════
  .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" v-loading="loading")
    //- Active Journeys
    .kpi-card.journeys-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('journeyBuilder.activeJourneys') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ activeJourneysCount }}
              span.kpi-pct {{ $t('journeyBuilder.running') }}
          .kpi-icon-wrap.journeys-icon
            Icon(name="ph:path-bold" size="24")

    //- Avg Completion Rate
    .kpi-card.completion-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('journeyBuilder.avgCompletionRate') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ avgCompletionRate }}%
              span.kpi-pct.text-emerald-400 {{ $t('journeyBuilder.kpiChange', { value: '+3.2%' }) }}
          .kpi-icon-wrap.completion-icon
            el-progress(type="circle" :percentage="avgCompletionRate" :width="52" :stroke-width="5" color="#22c55e" :show-text="false")

    //- Avg Time to Complete
    .kpi-card.time-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('journeyBuilder.avgTimeToComplete') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ avgTimeToComplete }}
              span.kpi-pct {{ $t('journeyBuilder.days') }}
          .kpi-icon-wrap.time-icon
            Icon(name="ph:clock-bold" size="24")

    //- Conversion Rate
    .kpi-card.conversion-card
      .kpi-card-inner
        .flex.items-center.justify-between
          div
            p.kpi-label {{ $t('journeyBuilder.conversionRate') }}
            .flex.items-baseline.gap-2
              p.kpi-value {{ conversionRate }}%
              span.kpi-pct.text-amber-400 {{ $t('journeyBuilder.kpiChange', { value: '+1.8%' }) }}
          .kpi-icon-wrap.conversion-icon
            Icon(name="ph:arrow-right-bold" size="24")

  //- ════════════════════════════════════════════════════════
  //- Main Tabs
  //- ════════════════════════════════════════════════════════
  el-tabs(v-model="activeTab" type="border-card" class="journey-tabs")

    //- ═══════════════════════════════════════════════════
    //- TAB 1: Journey Templates
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('journeyBuilder.journeyTemplates')" name="templates")
      .flex.items-center.justify-between.mb-6
        h3.text-sm.font-bold(style="color: var(--text-primary)")
          Icon(name="ph:blueprint-bold" size="16" class="mr-2" style="color: #7849ff")
          | {{ $t('journeyBuilder.preBuiltTemplates') }}
        el-button(type="primary" @click="showCreateJourneyDialog = true" class="!bg-[#7849ff] !border-none !rounded-xl")
          Icon(name="ph:plus-bold" size="16")
          span.ml-2 {{ $t('journeyBuilder.createCustom') }}

      .grid.gap-6(class="grid-cols-1 md:grid-cols-2 xl:grid-cols-3")
        .glass-card.rounded-2xl.overflow-hidden.cursor-pointer.transition-all.template-card(
          v-for="tmpl in journeyTemplates"
          :key="tmpl.id"
        )
          .p-5
            .flex.items-center.justify-between.mb-4
              .flex.items-center.gap-3
                .w-12.h-12.rounded-xl.flex.items-center.justify-center(:style="{ background: tmpl.color + '20' }")
                  Icon(:name="tmpl.icon" size="22" :style="{ color: tmpl.color }")
                div
                  h4.text-sm.font-bold(style="color: var(--text-primary)") {{ tmpl.name }}
                  p.text-xs.mt-1(style="color: var(--text-muted)") {{ tmpl.description }}
              el-badge(:value="tmpl.stageCount + ' ' + $t('journeyBuilder.stages')" type="primary" class="stage-badge")

            .grid.grid-cols-3.gap-3.mb-4
              .text-center.p-3.rounded-xl(style="background: var(--bg-elevated)")
                p.text-lg.font-bold(style="color: var(--text-primary)") {{ tmpl.stageCount }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('journeyBuilder.stages') }}
              .text-center.p-3.rounded-xl(style="background: var(--bg-elevated)")
                p.text-lg.font-bold(style="color: var(--text-primary)") {{ tmpl.avgDuration }}{{ $t('journeyBuilder.daySuffix') }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('journeyBuilder.avgDuration') }}
              .text-center.p-3.rounded-xl(style="background: var(--bg-elevated)")
                p.text-lg.font-bold(style="color: var(--text-primary)") {{ tmpl.usageCount }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('journeyBuilder.timesUsed') }}

          .px-5.py-3(style="background: var(--bg-elevated); border-top: 1px solid var(--border-default)")
            .flex.items-center.justify-between
              .flex.items-center.gap-2
                .flex.-space-x-2
                  .w-6.h-6.rounded-full.border-2.flex.items-center.justify-center.text-xs.font-bold(
                    v-for="(stg, idx) in tmpl.stageNames.slice(0, 3)"
                    :key="idx"
                    :style="{ background: tmpl.color + '30', color: tmpl.color, borderColor: 'var(--bg-elevated)' }"
                  ) {{ idx + 1 }}
                span.text-xs(style="color: var(--text-muted)") {{ tmpl.stageNames.slice(0, 2).join(' → ') }} ...
              el-button(size="small" type="primary" @click.stop="useTemplate(tmpl)" class="!bg-[#7849ff] !border-none !rounded-lg")
                Icon(name="ph:play-bold" size="14" class="mr-1")
                | {{ $t('journeyBuilder.useTemplate') }}

    //- ═══════════════════════════════════════════════════
    //- TAB 2: Active Journeys
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('journeyBuilder.activeJourneys')" name="active")
      .glass-card.rounded-2xl.overflow-hidden
        .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--border-default)")
          h3.text-sm.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:list-checks-bold" size="16" class="mr-2" style="color: #7849ff")
            | {{ $t('journeyBuilder.journeyList') }}
          .flex.items-center.gap-2
            el-select(v-model="journeyStatusFilter" clearable :placeholder="$t('journeyBuilder.filterByStatus')" size="default" style="width: 160px")
              el-option(:label="$t('journeyBuilder.all')" value="")
              el-option(:label="$t('journeyBuilder.active')" value="active")
              el-option(:label="$t('journeyBuilder.paused')" value="paused")
              el-option(:label="$t('journeyBuilder.draft')" value="draft")
            el-tag(effect="dark" round size="small") {{ filteredJourneys.length }} {{ $t('journeyBuilder.records') }}

        el-table(:data="paginatedJourneys" stripe style="width: 100%" v-loading="loading")
          el-table-column(:label="$t('journeyBuilder.journeyName')" min-width="220")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: row.color + '20' }")
                  Icon(:name="row.icon" size="18" :style="{ color: row.color }")
                div
                  p.font-semibold.text-sm(style="color: var(--text-primary)") {{ row.name }}
                  p.text-xs(style="color: var(--text-muted)") {{ row.templateName }}

          el-table-column(:label="$t('journeyBuilder.status')" width="130" align="center")
            template(#default="{ row }")
              el-tag(:type="getStatusTagType(row.status)" size="small" round effect="dark") {{ getStatusLabel(row.status) }}

          el-table-column(:label="$t('journeyBuilder.enrolledContacts')" width="160" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-2
                Icon(name="ph:users-bold" size="14" style="color: var(--text-muted)")
                span.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatNumber(row.enrolledContacts) }}

          el-table-column(:label="$t('journeyBuilder.completionRate')" width="200")
            template(#default="{ row }")
              .flex.items-center.gap-3
                el-progress(
                  :percentage="row.completionRate"
                  :stroke-width="8"
                  :color="getProgressColor(row.completionRate)"
                  style="flex: 1"
                )
                span.text-sm.font-bold(:style="{ color: getProgressColor(row.completionRate) }") {{ row.completionRate }}%

          el-table-column(:label="$t('journeyBuilder.avgTime')" width="130" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                Icon(name="ph:clock" size="14" style="color: var(--text-muted)")
                span.text-sm(style="color: var(--text-secondary)") {{ row.avgTime }} {{ $t('journeyBuilder.days') }}

          el-table-column(:label="$t('journeyBuilder.conversionRate')" width="150" align="center")
            template(#default="{ row }")
              span.text-sm.font-bold(:style="{ color: row.conversionRate >= 30 ? '#22c55e' : row.conversionRate >= 15 ? '#f59e0b' : '#ef4444' }") {{ row.conversionRate }}%

          el-table-column(:label="$t('journeyBuilder.lastModified')" width="150")
            template(#default="{ row }")
              .flex.items-center.gap-2
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-sm(style="color: var(--text-secondary)") {{ formatDate(row.lastModified) }}

          el-table-column(:label="$t('journeyBuilder.actions')" width="130" align="center" fixed="right")
            template(#default="{ row }")
              .flex.items-center.gap-1.justify-center
                el-tooltip(:content="$t('journeyBuilder.editJourney')")
                  el-button(link type="primary" @click.stop="editJourney(row)" :aria-label="$t('journeyBuilder.editJourney')")
                    Icon(name="ph:pencil-bold" size="18")
                el-tooltip(:content="row.status === 'active' ? $t('journeyBuilder.pauseJourney') : $t('journeyBuilder.resumeJourney')")
                  el-button(link type="warning" @click.stop="toggleJourneyStatus(row)" :aria-label="$t('journeyBuilder.pauseJourney')")
                    Icon(:name="row.status === 'active' ? 'ph:pause-bold' : 'ph:play-bold'" size="18")
                el-tooltip(:content="$t('journeyBuilder.deleteJourney')")
                  el-button(link type="danger" @click.stop="deleteJourney(row)" :aria-label="$t('journeyBuilder.deleteJourney')")
                    Icon(name="ph:trash-bold" size="18")

        .p-4.flex.justify-center(style="border-top: 1px solid var(--border-default)")
          el-pagination(
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="filteredJourneys.length"
            layout="total, sizes, prev, pager, next"
            background
          )

    //- ═══════════════════════════════════════════════════
    //- TAB 3: Touchpoint Analytics
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('journeyBuilder.touchpointAnalytics')" name="analytics")
      .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
        //- Funnel Chart — Touchpoint Progression
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4
            h3.text-sm.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:funnel-bold" size="16" class="mr-2" style="color: #7849ff")
              | {{ $t('journeyBuilder.touchpointProgression') }}
            el-select(v-model="funnelPeriod" size="small" style="width: 130px")
              el-option(:label="$t('journeyBuilder.last30Days')" value="30d")
              el-option(:label="$t('journeyBuilder.last90Days')" value="90d")
              el-option(:label="$t('journeyBuilder.last12Months')" value="12m")
          .chart-container
            ClientOnly
              VChart(v-if="funnelChartOption" :option="funnelChartOption" autoresize style="height: 380px")

        //- Channel Effectiveness Bar Chart
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4
            h3.text-sm.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:chart-bar-bold" size="16" class="mr-2" style="color: #22c55e")
              | {{ $t('journeyBuilder.channelEffectiveness') }}
            el-radio-group(v-model="channelMetric" size="small")
              el-radio-button(value="engagement") {{ $t('journeyBuilder.engagement') }}
              el-radio-button(value="conversion") {{ $t('journeyBuilder.conversion') }}
          .chart-container
            ClientOnly
              VChart(v-if="channelChartOption" :option="channelChartOption" autoresize style="height: 380px")

      //- Touchpoint Stats Summary Row
      .grid.gap-5.mt-6(class="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5")
        .glass-card.p-4.rounded-2xl.text-center(v-for="tp in touchpointStats" :key="tp.name")
          .w-10.h-10.rounded-xl.flex.items-center.justify-center.mx-auto.mb-2(:style="{ background: tp.color + '20' }")
            Icon(:name="tp.icon" size="20" :style="{ color: tp.color }")
          p.text-lg.font-bold(:style="{ color: tp.color }") {{ formatNumber(tp.count) }}
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ tp.name }}
          .flex.items-center.justify-center.gap-1.mt-1
            Icon(:name="tp.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="12" :style="{ color: tp.trend >= 0 ? '#22c55e' : '#ef4444' }")
            span.text-xs.font-medium(:style="{ color: tp.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ tp.trend > 0 ? '+' : '' }}{{ tp.trend }}%

    //- ═══════════════════════════════════════════════════
    //- TAB 4: Journey Designer
    //- ═══════════════════════════════════════════════════
    el-tab-pane(:label="$t('journeyBuilder.journeyDesigner')" name="designer")
      .flex.items-center.justify-between.mb-6
        .flex.items-center.gap-3
          Icon(name="ph:flow-arrow-bold" size="20" style="color: #7849ff")
          h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('journeyBuilder.visualDesigner') }}
          el-select(v-model="selectedDesignerJourney" :placeholder="$t('journeyBuilder.selectJourney')" size="default" style="width: 240px")
            el-option(
              v-for="j in journeys"
              :key="j.id"
              :value="j.id"
              :label="j.name"
            )
        .flex.items-center.gap-2
          el-button(size="default" plain @click="zoomLevel = Math.max(0.6, zoomLevel - 0.1)" :aria-label="$t('journeyBuilder.zoomOut')")
            Icon(name="ph:minus-bold" size="14")
          span.text-xs.font-semibold.w-12.text-center(style="color: var(--text-muted)") {{ Math.round(zoomLevel * 100) }}%
          el-button(size="default" plain @click="zoomLevel = Math.min(1.4, zoomLevel + 0.1)" :aria-label="$t('journeyBuilder.zoomIn')")
            Icon(name="ph:plus-bold" size="14")

      //- Journey Stage Flow
      template(v-if="designerStages.length > 0")
        .designer-canvas.glass-card.rounded-2xl.p-8.overflow-x-auto
          .stage-flow(:style="{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }")
            //- Start Node
            .stage-node.start-node
              .stage-node-inner
                .w-14.h-14.rounded-2xl.flex.items-center.justify-center.mx-auto.mb-3(style="background: linear-gradient(135deg, #22c55e, #16a34a)")
                  Icon(name="ph:flag-bold" size="28" style="color: white")
                p.text-sm.font-bold.text-center(style="color: var(--text-primary)") {{ $t('journeyBuilder.start') }}
                p.text-xs.text-center.mt-1(style="color: var(--text-muted)") {{ $t('journeyBuilder.entryPoint') }}

            //- Arrow Connector
            .stage-connector
              .connector-line
              .connector-arrow
                Icon(name="ph:caret-right-bold" size="16" style="color: #7849ff")

            //- Stage Cards
            template(v-for="(stage, idx) in designerStages" :key="stage.id")
              .stage-node(:class="{ 'active-stage': stage.isActive }" @click="selectDesignerStage(stage)")
                .stage-node-inner
                  .flex.items-center.justify-between.mb-3
                    el-tag(size="small" round :type="stage.isActive ? 'success' : 'info'" effect="dark") {{ $t('journeyBuilder.stage') }} {{ idx + 1 }}
                    el-dropdown(trigger="click" @command="handleStageAction($event, stage)")
                      el-button(text size="small" @click.stop :aria-label="$t('journeyBuilder.stageActions')")
                        Icon(name="ph:dots-three-vertical" size="14")
                      template(#dropdown)
                        el-dropdown-menu
                          el-dropdown-item(command="edit")
                            Icon(name="ph:pencil" size="14" class="mr-2")
                            | {{ $t('journeyBuilder.edit') }}
                          el-dropdown-item(command="duplicate")
                            Icon(name="ph:copy" size="14" class="mr-2")
                            | {{ $t('journeyBuilder.duplicate') }}
                          el-dropdown-item(command="delete" divided)
                            span(style="color: #ef4444")
                              Icon(name="ph:trash" size="14" class="mr-2")
                              | {{ $t('journeyBuilder.delete') }}

                  .w-12.h-12.rounded-xl.flex.items-center.justify-center.mx-auto.mb-3(:style="{ background: stage.color + '20' }")
                    Icon(:name="stage.icon" size="22" :style="{ color: stage.color }")

                  h4.text-sm.font-bold.text-center.mb-1(style="color: var(--text-primary)") {{ stage.name }}
                  p.text-xs.text-center.mb-3(style="color: var(--text-muted)") {{ stage.description }}

                  .grid.grid-cols-2.gap-2
                    .stat-bubble
                      Icon(name="ph:gear-six" size="12" style="color: var(--text-muted)")
                      span.text-xs.font-medium(style="color: var(--text-secondary)") {{ stage.rulesCount }} {{ $t('journeyBuilder.rules') }}
                    .stat-bubble
                      Icon(name="ph:users" size="12" style="color: var(--text-muted)")
                      span.text-xs.font-medium(style="color: var(--text-secondary)") {{ formatNumber(stage.contactsInStage) }}

                  //- Mini progress bar at bottom
                  .mt-3
                    .flex.justify-between.text-xs.mb-1
                      span(style="color: var(--text-muted)") {{ $t('journeyBuilder.throughput') }}
                      span.font-bold(:style="{ color: stage.color }") {{ stage.throughputRate }}%
                    .w-full.h-1.rounded-full(style="background: var(--border-default)")
                      .h-1.rounded-full.transition-all(:style="{ width: stage.throughputRate + '%', background: stage.color }")

              //- Arrow between stages
              .stage-connector(v-if="idx < designerStages.length - 1")
                .connector-line
                .connector-arrow
                  Icon(name="ph:caret-right-bold" size="16" style="color: #7849ff")

            //- End Node
            .stage-connector
              .connector-line
              .connector-arrow
                Icon(name="ph:caret-right-bold" size="16" style="color: #7849ff")

            .stage-node.end-node
              .stage-node-inner
                .w-14.h-14.rounded-2xl.flex.items-center.justify-center.mx-auto.mb-3(style="background: linear-gradient(135deg, #7849ff, #a855f7)")
                  Icon(name="ph:flag-checkered-bold" size="28" style="color: white")
                p.text-sm.font-bold.text-center(style="color: var(--text-primary)") {{ $t('journeyBuilder.finish') }}
                p.text-xs.text-center.mt-1(style="color: var(--text-muted)") {{ $t('journeyBuilder.conversion') }}

            //- Add Stage Button
            .add-stage-btn(@click="addDesignerStage")
              .add-stage-inner
                Icon(name="ph:plus-bold" size="20" style="color: #7849ff")
                p.text-xs.font-semibold.mt-1(style="color: #7849ff") {{ $t('journeyBuilder.addStage') }}

      //- Empty state
      .text-center.py-16(v-else)
        Icon(name="ph:flow-arrow" size="48" style="color: var(--text-muted)")
        p.mt-3.font-medium(style="color: var(--text-primary)") {{ $t('journeyBuilder.selectJourneyPrompt') }}
        p.mt-1.text-sm(style="color: var(--text-muted)") {{ $t('journeyBuilder.selectJourneyDesc') }}

  //- ════════════════════════════════════════════════════════
  //- Create Journey Dialog
  //- ════════════════════════════════════════════════════════
  el-dialog(v-model="showCreateJourneyDialog" :title="editingJourney ? $t('journeyBuilder.editJourney') : $t('journeyBuilder.createJourney')" width="640px" @close="resetJourneyForm")
    el-form(label-position="top" :model="journeyForm")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('journeyBuilder.journeyName')")
          el-input(v-model="journeyForm.name" :placeholder="$t('journeyBuilder.enterJourneyName')")
        el-form-item(:label="$t('journeyBuilder.templateType')")
          el-select(v-model="journeyForm.templateId" :placeholder="$t('journeyBuilder.selectTemplate')" style="width: 100%")
            el-option(v-for="tmpl in journeyTemplates" :key="tmpl.id" :value="tmpl.id" :label="tmpl.name")
      el-form-item(:label="$t('journeyBuilder.description')")
        el-input(v-model="journeyForm.description" type="textarea" :rows="3" :placeholder="$t('journeyBuilder.enterDescription')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('journeyBuilder.status')")
          el-select(v-model="journeyForm.status" style="width: 100%")
            el-option(:label="$t('journeyBuilder.active')" value="active")
            el-option(:label="$t('journeyBuilder.paused')" value="paused")
            el-option(:label="$t('journeyBuilder.draft')" value="draft")
        el-form-item(:label="$t('journeyBuilder.targetAudience')")
          el-select(v-model="journeyForm.audience" :placeholder="$t('journeyBuilder.selectAudience')" style="width: 100%")
            el-option(:label="$t('journeyBuilder.allContacts')" value="all")
            el-option(:label="$t('journeyBuilder.newLeads')" value="new-leads")
            el-option(:label="$t('journeyBuilder.existingCustomers')" value="existing")
            el-option(:label="$t('journeyBuilder.churned')" value="churned")
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showCreateJourneyDialog = false") {{ $t('journeyBuilder.cancel') }}
        el-button(type="primary" @click="saveJourney" :disabled="!journeyForm.name" class="!bg-[#7849ff] !border-none") {{ editingJourney ? $t('journeyBuilder.update') : $t('journeyBuilder.create') }}

  //- ════════════════════════════════════════════════════════
  //- Stage Edit Dialog
  //- ════════════════════════════════════════════════════════
  el-dialog(v-model="showStageDialog" :title="$t('journeyBuilder.editStage')" width="520px")
    el-form(label-position="top" :model="stageForm")
      el-form-item(:label="$t('journeyBuilder.stageName')")
        el-input(v-model="stageForm.name" :placeholder="$t('journeyBuilder.enterStageName')")
      el-form-item(:label="$t('journeyBuilder.stageDescription')")
        el-input(v-model="stageForm.description" type="textarea" :rows="2" :placeholder="$t('journeyBuilder.enterStageDescription')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('journeyBuilder.stageIcon')")
          el-select(v-model="stageForm.icon" style="width: 100%")
            el-option(v-for="ic in stageIconOptions" :key="ic.value" :value="ic.value" :label="ic.label")
              .flex.items-center.gap-2
                Icon(:name="ic.value" size="16")
                | {{ ic.label }}
        el-form-item(:label="$t('journeyBuilder.stageColor')")
          el-select(v-model="stageForm.color" style="width: 100%")
            el-option(v-for="cl in stageColorOptions" :key="cl.value" :value="cl.value" :label="cl.label")
              .flex.items-center.gap-2
                .w-4.h-4.rounded-full(:style="{ background: cl.value }")
                | {{ cl.label }}
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showStageDialog = false") {{ $t('journeyBuilder.cancel') }}
        el-button(type="primary" @click="saveStage" class="!bg-[#7849ff] !border-none") {{ $t('journeyBuilder.save') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';
import VChart from 'vue-echarts';
import { graphic } from 'echarts';

definePageMeta({ title: 'Customer Journey Builder' });

const { t, locale } = useI18n();

// ── State ────────────────────────────────────────────────
const loading = ref(false);
const activeTab = ref('templates');
const dateRange = ref<[Date, Date] | null>(null);
const journeyStatusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const funnelPeriod = ref('30d');
const channelMetric = ref('engagement');
const selectedDesignerJourney = ref('');
const zoomLevel = ref(1);
const showCreateJourneyDialog = ref(false);
const showStageDialog = ref(false);
const editingJourney = ref<Journey | null>(null);

// ── Interfaces ───────────────────────────────────────────
interface JourneyTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  stageCount: number;
  avgDuration: number;
  usageCount: number;
  stageNames: string[];
}

interface Journey {
  id: string;
  name: string;
  templateName: string;
  icon: string;
  color: string;
  status: 'active' | 'paused' | 'draft';
  enrolledContacts: number;
  completionRate: number;
  avgTime: number;
  conversionRate: number;
  lastModified: string;
  stages: DesignerStage[];
}

interface DesignerStage {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rulesCount: number;
  contactsInStage: number;
  throughputRate: number;
  isActive: boolean;
}

interface TouchpointStat {
  name: string;
  icon: string;
  color: string;
  count: number;
  trend: number;
}

// ── Data ─────────────────────────────────────────────────
const allDeals = ref<any[]>([]);
const allLeads = ref<any[]>([]);
const journeyTemplates = ref<JourneyTemplate[]>([]);
const journeys = ref<Journey[]>([]);

// ── Date Shortcuts ───────────────────────────────────────
const dateShortcuts = [
  {
    text: t('journeyBuilder.last7Days'),
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 7 * 86400000);
      return [start, end];
    }
  },
  {
    text: t('journeyBuilder.last30Days'),
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 30 * 86400000);
      return [start, end];
    }
  },
  {
    text: t('journeyBuilder.last90Days'),
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 90 * 86400000);
      return [start, end];
    }
  }
];

// ── Forms ────────────────────────────────────────────────
const journeyForm = ref({
  name: '',
  description: '',
  templateId: '',
  status: 'draft' as 'active' | 'paused' | 'draft',
  audience: 'all'
});

const stageForm = ref({
  id: '',
  name: '',
  description: '',
  icon: 'ph:envelope-bold',
  color: '#7849ff'
});

const stageIconOptions = [
  { value: 'ph:envelope-bold', label: t('journeyBuilder.iconEmail') },
  { value: 'ph:browser-bold', label: t('journeyBuilder.iconWebpage') },
  { value: 'ph:presentation-chart-bold', label: t('journeyBuilder.iconDemo') },
  { value: 'ph:test-tube-bold', label: t('journeyBuilder.iconTrial') },
  { value: 'ph:shopping-cart-bold', label: t('journeyBuilder.iconPurchase') },
  { value: 'ph:phone-bold', label: t('journeyBuilder.iconCall') },
  { value: 'ph:chat-dots-bold', label: t('journeyBuilder.iconChat') },
  { value: 'ph:megaphone-bold', label: t('journeyBuilder.iconCampaign') },
  { value: 'ph:gift-bold', label: t('journeyBuilder.iconOffer') },
  { value: 'ph:handshake-bold', label: t('journeyBuilder.iconDeal') }
];

const stageColorOptions = [
  { value: '#7849ff', label: t('journeyBuilder.colorPurple') },
  { value: '#22c55e', label: t('journeyBuilder.colorGreen') },
  { value: '#3b82f6', label: t('journeyBuilder.colorBlue') },
  { value: '#f59e0b', label: t('journeyBuilder.colorAmber') },
  { value: '#ef4444', label: t('journeyBuilder.colorRed') },
  { value: '#06b6d4', label: t('journeyBuilder.colorCyan') }
];

// ── Computed: KPIs ───────────────────────────────────────
const activeJourneysCount = computed(() =>
  journeys.value.filter(j => j.status === 'active').length
);

const avgCompletionRate = computed(() => {
  const active = journeys.value.filter(j => j.status === 'active');
  if (!active.length) return 0;
  return Math.round(active.reduce((s, j) => s + j.completionRate, 0) / active.length);
});

const avgTimeToComplete = computed(() => {
  const active = journeys.value.filter(j => j.status === 'active');
  if (!active.length) return 0;
  return Math.round(active.reduce((s, j) => s + j.avgTime, 0) / active.length);
});

const conversionRate = computed(() => {
  const active = journeys.value.filter(j => j.status === 'active');
  if (!active.length) return 0;
  return Math.round(active.reduce((s, j) => s + j.conversionRate, 0) / active.length);
});

// ── Computed: Filtered Journeys Table ────────────────────
const filteredJourneys = computed(() => {
  let result = journeys.value;
  if (journeyStatusFilter.value) {
    result = result.filter(j => j.status === journeyStatusFilter.value);
  }
  return result;
});

const paginatedJourneys = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredJourneys.value.slice(start, start + pageSize.value);
});

// ── Computed: Designer Stages ────────────────────────────
const selectedJourneyData = computed(() =>
  journeys.value.find(j => j.id === selectedDesignerJourney.value) || null
);

const designerStages = computed(() =>
  selectedJourneyData.value?.stages || []
);

// ── Computed: Touchpoint Stats ───────────────────────────
const touchpointStats = computed<TouchpointStat[]>(() => {
  const totalLeads = allLeads.value.length || 1;
  const totalDeals = allDeals.value.length || 1;

  return [
    {
      name: t('journeyBuilder.emailsSent'),
      icon: 'ph:envelope-bold',
      color: '#7849ff',
      count: Math.round(totalLeads * 3.2),
      trend: 12
    },
    {
      name: t('journeyBuilder.pageVisits'),
      icon: 'ph:browser-bold',
      color: '#3b82f6',
      count: Math.round(totalLeads * 8.5),
      trend: 8
    },
    {
      name: t('journeyBuilder.demosBooked'),
      icon: 'ph:presentation-chart-bold',
      color: '#22c55e',
      count: Math.round(totalDeals * 0.6),
      trend: -3
    },
    {
      name: t('journeyBuilder.trialsStarted'),
      icon: 'ph:test-tube-bold',
      color: '#f59e0b',
      count: Math.round(totalDeals * 0.4),
      trend: 5
    },
    {
      name: t('journeyBuilder.purchases'),
      icon: 'ph:shopping-cart-bold',
      color: '#ef4444',
      count: Math.round(totalDeals * 0.15),
      trend: 2
    }
  ];
});

// ── ECharts: Funnel Chart ────────────────────────────────
const funnelChartOption = computed(() => {
  const totalLeads = allLeads.value.length || 100;

  const funnelData = [
    { value: totalLeads, name: t('journeyBuilder.emailTouchpoint') },
    { value: Math.round(totalLeads * 0.65), name: t('journeyBuilder.pageVisitTouchpoint') },
    { value: Math.round(totalLeads * 0.35), name: t('journeyBuilder.demoTouchpoint') },
    { value: Math.round(totalLeads * 0.18), name: t('journeyBuilder.trialTouchpoint') },
    { value: Math.round(totalLeads * 0.08), name: t('journeyBuilder.purchaseTouchpoint') }
  ];

  const funnelColors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 30, 45, 0.9)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;',
      formatter: (params: any) => {
        const rate = totalLeads > 0 ? ((params.value / totalLeads) * 100).toFixed(1) : '0';
        return `<strong>${params.name}</strong><br/>${t('journeyBuilder.contacts')}: <strong>${formatNumber(params.value)}</strong><br/>${t('journeyBuilder.rate')}: <strong>${rate}%</strong>`;
      }
    },
    legend: {
      data: funnelData.map(d => d.name),
      orient: 'vertical',
      right: 10,
      top: 'middle',
      textStyle: { color: '#94A3B8', fontSize: 11 }
    },
    series: [
      {
        type: 'funnel',
        left: '5%',
        top: 20,
        bottom: 20,
        width: '55%',
        min: 0,
        max: totalLeads,
        minSize: '10%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => `${params.name}\n${formatNumber(params.value)}`,
          color: '#fff',
          fontSize: 11,
          fontWeight: 'bold',
          lineHeight: 18
        },
        labelLine: { show: false },
        itemStyle: {
          borderColor: 'transparent',
          borderWidth: 2,
          shadowBlur: 12,
          shadowColor: 'rgba(120, 73, 255, 0.15)'
        },
        emphasis: {
          label: { fontSize: 13 },
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(120, 73, 255, 0.3)' }
        },
        data: funnelData.map((d, i) => ({
          ...d,
          itemStyle: {
            color: new graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: funnelColors[i] || '' },
              { offset: 1, color: (funnelColors[i] || '') + 'cc' }
            ]),
            borderRadius: 4
          }
        }))
      }
    ]
  };
});

// ── ECharts: Channel Effectiveness ───────────────────────
const channelChartOption = computed(() => {
  const channels = [
    t('journeyBuilder.channelEmail'),
    t('journeyBuilder.channelSMS'),
    t('journeyBuilder.channelInApp'),
    t('journeyBuilder.channelSocial'),
    t('journeyBuilder.channelDirect')
  ];

  const engagementData = [85, 62, 78, 55, 92];
  const conversionData = [32, 18, 28, 12, 45];
  const selectedData = channelMetric.value === 'engagement' ? engagementData : conversionData;
  const channelColors = ['#7849ff', '#22c55e', '#3b82f6', '#f59e0b', '#06b6d4'];

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(30, 30, 45, 0.9)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;',
      formatter: (params: any) => {
        const p = params[0];
        const label = channelMetric.value === 'engagement'
          ? t('journeyBuilder.engagementRate')
          : t('journeyBuilder.conversionRate');
        return `<strong>${p.name}</strong><br/>${label}: <strong>${p.value}%</strong>`;
      }
    },
    grid: { top: 20, right: 30, bottom: 40, left: 80, containLabel: false },
    xAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { type: 'dashed' as const, color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748B', formatter: '{value}%' }
    },
    yAxis: {
      type: 'category',
      data: channels,
      inverse: true,
      axisLabel: { color: '#94A3B8', fontSize: 12, fontWeight: 600 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: selectedData.map((val, i) => ({
          value: val,
          itemStyle: {
            color: new graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: channelColors[i] || '' },
              { offset: 1, color: (channelColors[i] || '') + 'aa' }
            ]),
            borderRadius: [0, 8, 8, 0],
            shadowBlur: 8,
            shadowColor: (channelColors[i] || '') + '40'
          }
        })),
        barWidth: 28,
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(255,255,255,0.03)',
          borderRadius: 8
        },
        label: {
          show: true,
          position: 'right',
          color: '#94A3B8',
          fontWeight: 'bold',
          formatter: '{c}%'
        },
        animationDelay: (idx: number) => idx * 100,
        animationEasing: 'elasticOut'
      }
    ],
    animationDuration: 1200
  };
});

// ── Helpers ──────────────────────────────────────────────
function formatNumber(num: number): string {
  return new Intl.NumberFormat(locale.value).format(num);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString(locale.value, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusTagType(status: string): string {
  if (status === 'active') return 'success';
  if (status === 'paused') return 'warning';
  return 'info';
}

function getStatusLabel(status: string): string {
  if (status === 'active') return t('journeyBuilder.active');
  if (status === 'paused') return t('journeyBuilder.paused');
  return t('journeyBuilder.draft');
}

function getProgressColor(pct: number): string {
  if (pct >= 75) return '#22c55e';
  if (pct >= 50) return '#3b82f6';
  if (pct >= 25) return '#f59e0b';
  return '#ef4444';
}

// ── Journey Actions ──────────────────────────────────────
function useTemplate(tmpl: JourneyTemplate) {
  journeyForm.value.templateId = tmpl.id;
  journeyForm.value.name = tmpl.name + ' - ' + t('journeyBuilder.newJourney');
  showCreateJourneyDialog.value = true;
}

function editJourney(journey: Journey) {
  editingJourney.value = journey;
  journeyForm.value = {
    name: journey.name,
    description: '',
    templateId: '',
    status: journey.status,
    audience: 'all'
  };
  showCreateJourneyDialog.value = true;
}

function toggleJourneyStatus(journey: Journey) {
  const newStatus = journey.status === 'active' ? 'paused' : 'active';
  const idx = journeys.value.findIndex(j => j.id === journey.id);
  if (idx >= 0) {
    journeys.value[idx] = { ...journeys.value[idx], status: newStatus, lastModified: new Date().toISOString() } as any;
    ElNotification({
      type: 'success',
      title: t('journeyBuilder.statusUpdated'),
      message: t('journeyBuilder.journeyStatusChanged', { name: journey.name, status: getStatusLabel(newStatus) })
    });
  }
}

function deleteJourney(journey: Journey) {
  ElMessageBox.confirm(
    t('journeyBuilder.deleteJourneyConfirm', { name: journey.name }),
    t('journeyBuilder.delete'),
    { type: 'warning', confirmButtonText: t('journeyBuilder.delete'), cancelButtonText: t('journeyBuilder.cancel') }
  ).then(() => {
    journeys.value = journeys.value.filter(j => j.id !== journey.id);
    ElNotification({ type: 'success', title: t('journeyBuilder.deleted'), message: t('journeyBuilder.journeyDeleted') });
  }).catch(() => { /* cancelled */ });
}

function saveJourney() {
  if (!journeyForm.value.name) return;

  if (editingJourney.value) {
    const idx = journeys.value.findIndex(j => j.id === editingJourney.value!.id);
    if (idx >= 0) {
      journeys.value[idx] = {
        ...journeys.value[idx],
        name: journeyForm.value.name,
        status: journeyForm.value.status,
        lastModified: new Date().toISOString()
      } as any;
    }
    ElNotification({ type: 'success', title: t('journeyBuilder.updated'), message: t('journeyBuilder.journeyUpdated') });
  } else {
    const tmpl = journeyTemplates.value.find(tp => tp.id === journeyForm.value.templateId);
    const defaultStages: DesignerStage[] = tmpl
      ? tmpl.stageNames.map((name, i) => ({
          id: 'stg-' + Date.now() + '-' + i,
          name,
          description: t('journeyBuilder.stageDefaultDesc', { name }),
          icon: ['ph:envelope-bold', 'ph:browser-bold', 'ph:presentation-chart-bold', 'ph:test-tube-bold', 'ph:shopping-cart-bold', 'ph:handshake-bold'][i % 6]!,
          color: ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'][i % 6]!,
          rulesCount: Math.floor(Math.random() * 5) + 1,
          contactsInStage: 0,
          throughputRate: 0,
          isActive: false
        }))
      : [{
          id: 'stg-' + Date.now(),
          name: t('journeyBuilder.initialContact'),
          description: t('journeyBuilder.initialContactDesc'),
          icon: 'ph:envelope-bold',
          color: '#7849ff',
          rulesCount: 2,
          contactsInStage: 0,
          throughputRate: 0,
          isActive: false
        }];

    const newJourney: Journey = {
      id: 'j-' + Date.now(),
      name: journeyForm.value.name,
      templateName: tmpl?.name || t('journeyBuilder.custom'),
      icon: tmpl?.icon || 'ph:path-bold',
      color: tmpl?.color || '#7849ff',
      status: journeyForm.value.status,
      enrolledContacts: 0,
      completionRate: 0,
      avgTime: 0,
      conversionRate: 0,
      lastModified: new Date().toISOString(),
      stages: defaultStages
    };
    journeys.value.unshift(newJourney);
    ElNotification({ type: 'success', title: t('journeyBuilder.created'), message: t('journeyBuilder.journeyCreated') });
  }
  showCreateJourneyDialog.value = false;
  resetJourneyForm();
}

function resetJourneyForm() {
  editingJourney.value = null;
  journeyForm.value = { name: '', description: '', templateId: '', status: 'draft', audience: 'all' };
}

// ── Designer Actions ─────────────────────────────────────
function selectDesignerStage(stage: DesignerStage) {
  stageForm.value = {
    id: stage.id,
    name: stage.name,
    description: stage.description,
    icon: stage.icon,
    color: stage.color
  };
  showStageDialog.value = true;
}

function handleStageAction(command: string, stage: DesignerStage) {
  if (!selectedJourneyData.value) return;
  const journeyIdx = journeys.value.findIndex(j => j.id === selectedJourneyData.value!.id);
  if (journeyIdx < 0) return;

  if (command === 'edit') {
    selectDesignerStage(stage);
  } else if (command === 'duplicate') {
    const newStage: DesignerStage = {
      ...stage,
      id: 'stg-' + Date.now(),
      name: stage.name + ' (' + t('journeyBuilder.copy') + ')',
      contactsInStage: 0,
      throughputRate: 0
    };
    const stageIdx = journeys.value[journeyIdx]!.stages.findIndex(s => s.id === stage.id);
    journeys.value[journeyIdx]!.stages.splice(stageIdx + 1, 0, newStage);
    ElNotification({ type: 'success', title: t('journeyBuilder.duplicated'), message: t('journeyBuilder.stageDuplicated') });
  } else if (command === 'delete') {
    if (journeys.value[journeyIdx]!.stages.length <= 1) {
      ElNotification({ type: 'warning', title: t('journeyBuilder.cannotDelete'), message: t('journeyBuilder.minimumOneStage') });
      return;
    }
    journeys.value[journeyIdx]!.stages = journeys.value[journeyIdx]!.stages.filter(s => s.id !== stage.id);
    ElNotification({ type: 'success', title: t('journeyBuilder.deleted'), message: t('journeyBuilder.stageDeleted') });
  }
}

function addDesignerStage() {
  if (!selectedJourneyData.value) return;
  const journeyIdx = journeys.value.findIndex(j => j.id === selectedJourneyData.value!.id);
  if (journeyIdx < 0) return;

  const newStage: DesignerStage = {
    id: 'stg-' + Date.now(),
    name: t('journeyBuilder.newStage'),
    description: t('journeyBuilder.newStageDesc'),
    icon: 'ph:plus-circle-bold',
    color: '#7849ff',
    rulesCount: 0,
    contactsInStage: 0,
    throughputRate: 0,
    isActive: false
  };
  journeys.value[journeyIdx]!.stages.push(newStage);
  ElNotification({ type: 'success', title: t('journeyBuilder.stageAdded'), message: t('journeyBuilder.newStageAdded') });
}

function saveStage() {
  if (!selectedJourneyData.value || !stageForm.value.id) return;
  const journeyIdx = journeys.value.findIndex(j => j.id === selectedJourneyData.value!.id);
  if (journeyIdx < 0) return;

  const stageIdx = journeys.value[journeyIdx]!.stages.findIndex(s => s.id === stageForm.value.id);
  if (stageIdx >= 0) {
    journeys.value[journeyIdx]!.stages[stageIdx] = {
      ...journeys.value[journeyIdx]!.stages[stageIdx],
      name: stageForm.value.name,
      description: stageForm.value.description,
      icon: stageForm.value.icon,
      color: stageForm.value.color
    } as any;
  }
  showStageDialog.value = false;
  ElNotification({ type: 'success', title: t('journeyBuilder.updated'), message: t('journeyBuilder.stageUpdated') });
}

// ── Seed Demo Data ───────────────────────────────────────
function seedTemplates() {
  journeyTemplates.value = [
    {
      id: 'tmpl-welcome',
      name: t('journeyBuilder.welcomeSeries'),
      description: t('journeyBuilder.welcomeSeriesDesc'),
      icon: 'ph:hand-waving-bold',
      color: '#7849ff',
      stageCount: 5,
      avgDuration: 14,
      usageCount: 34,
      stageNames: [
        t('journeyBuilder.welcomeEmail'),
        t('journeyBuilder.productIntro'),
        t('journeyBuilder.featureHighlight'),
        t('journeyBuilder.socialProof'),
        t('journeyBuilder.activationCTA')
      ]
    },
    {
      id: 'tmpl-onboarding',
      name: t('journeyBuilder.onboardingFlow'),
      description: t('journeyBuilder.onboardingFlowDesc'),
      icon: 'ph:rocket-launch-bold',
      color: '#22c55e',
      stageCount: 6,
      avgDuration: 21,
      usageCount: 28,
      stageNames: [
        t('journeyBuilder.accountSetup'),
        t('journeyBuilder.profileComplete'),
        t('journeyBuilder.firstAction'),
        t('journeyBuilder.guidedTour'),
        t('journeyBuilder.teamInvite'),
        t('journeyBuilder.successMilestone')
      ]
    },
    {
      id: 'tmpl-reengagement',
      name: t('journeyBuilder.reEngagement'),
      description: t('journeyBuilder.reEngagementDesc'),
      icon: 'ph:arrow-counter-clockwise-bold',
      color: '#3b82f6',
      stageCount: 4,
      avgDuration: 30,
      usageCount: 19,
      stageNames: [
        t('journeyBuilder.missYouEmail'),
        t('journeyBuilder.specialOffer'),
        t('journeyBuilder.personalOutreach'),
        t('journeyBuilder.reactivationCTA')
      ]
    },
    {
      id: 'tmpl-upsell',
      name: t('journeyBuilder.upsellPath'),
      description: t('journeyBuilder.upsellPathDesc'),
      icon: 'ph:trend-up-bold',
      color: '#f59e0b',
      stageCount: 5,
      avgDuration: 45,
      usageCount: 15,
      stageNames: [
        t('journeyBuilder.usageAnalysis'),
        t('journeyBuilder.featureTeaser'),
        t('journeyBuilder.caseStudy'),
        t('journeyBuilder.upgradeOffer'),
        t('journeyBuilder.consultationBook')
      ]
    },
    {
      id: 'tmpl-renewal',
      name: t('journeyBuilder.renewalJourney'),
      description: t('journeyBuilder.renewalJourneyDesc'),
      icon: 'ph:arrows-clockwise-bold',
      color: '#06b6d4',
      stageCount: 4,
      avgDuration: 60,
      usageCount: 22,
      stageNames: [
        t('journeyBuilder.renewalReminder'),
        t('journeyBuilder.valueSummary'),
        t('journeyBuilder.renewalOffer'),
        t('journeyBuilder.renewalConfirm')
      ]
    },
    {
      id: 'tmpl-winback',
      name: t('journeyBuilder.winBackCampaign'),
      description: t('journeyBuilder.winBackCampaignDesc'),
      icon: 'ph:trophy-bold',
      color: '#ef4444',
      stageCount: 5,
      avgDuration: 30,
      usageCount: 11,
      stageNames: [
        t('journeyBuilder.exitSurvey'),
        t('journeyBuilder.feedbackReview'),
        t('journeyBuilder.specialIncentive'),
        t('journeyBuilder.personalCall'),
        t('journeyBuilder.returnOffer')
      ]
    }
  ];
}

function seedJourneys() {
  const now = new Date();

  journeys.value = [
    {
      id: 'j-1',
      name: t('journeyBuilder.q1WelcomeCampaign'),
      templateName: t('journeyBuilder.welcomeSeries'),
      icon: 'ph:hand-waving-bold',
      color: '#7849ff',
      status: 'active',
      enrolledContacts: 1245,
      completionRate: 68,
      avgTime: 12,
      conversionRate: 34,
      lastModified: new Date(now.getTime() - 2 * 86400000).toISOString(),
      stages: [
        { id: 'stg-1-1', name: t('journeyBuilder.welcomeEmail'), description: t('journeyBuilder.welcomeEmailDesc'), icon: 'ph:envelope-bold', color: '#7849ff', rulesCount: 3, contactsInStage: 180, throughputRate: 92, isActive: true },
        { id: 'stg-1-2', name: t('journeyBuilder.productIntro'), description: t('journeyBuilder.productIntroDesc'), icon: 'ph:package-bold', color: '#3b82f6', rulesCount: 2, contactsInStage: 320, throughputRate: 78, isActive: true },
        { id: 'stg-1-3', name: t('journeyBuilder.featureHighlight'), description: t('journeyBuilder.featureHighlightDesc'), icon: 'ph:star-bold', color: '#22c55e', rulesCount: 4, contactsInStage: 260, throughputRate: 65, isActive: true },
        { id: 'stg-1-4', name: t('journeyBuilder.socialProof'), description: t('journeyBuilder.socialProofDesc'), icon: 'ph:users-three-bold', color: '#f59e0b', rulesCount: 2, contactsInStage: 185, throughputRate: 52, isActive: false },
        { id: 'stg-1-5', name: t('journeyBuilder.activationCTA'), description: t('journeyBuilder.activationCTADesc'), icon: 'ph:cursor-click-bold', color: '#ef4444', rulesCount: 5, contactsInStage: 300, throughputRate: 34, isActive: false }
      ]
    },
    {
      id: 'j-2',
      name: t('journeyBuilder.enterpriseOnboarding'),
      templateName: t('journeyBuilder.onboardingFlow'),
      icon: 'ph:rocket-launch-bold',
      color: '#22c55e',
      status: 'active',
      enrolledContacts: 456,
      completionRate: 52,
      avgTime: 18,
      conversionRate: 28,
      lastModified: new Date(now.getTime() - 5 * 86400000).toISOString(),
      stages: [
        { id: 'stg-2-1', name: t('journeyBuilder.accountSetup'), description: t('journeyBuilder.accountSetupDesc'), icon: 'ph:gear-six-bold', color: '#7849ff', rulesCount: 4, contactsInStage: 45, throughputRate: 95, isActive: true },
        { id: 'stg-2-2', name: t('journeyBuilder.profileComplete'), description: t('journeyBuilder.profileCompleteDesc'), icon: 'ph:user-circle-bold', color: '#3b82f6', rulesCount: 3, contactsInStage: 82, throughputRate: 80, isActive: true },
        { id: 'stg-2-3', name: t('journeyBuilder.firstAction'), description: t('journeyBuilder.firstActionDesc'), icon: 'ph:cursor-click-bold', color: '#22c55e', rulesCount: 5, contactsInStage: 120, throughputRate: 62, isActive: true },
        { id: 'stg-2-4', name: t('journeyBuilder.guidedTour'), description: t('journeyBuilder.guidedTourDesc'), icon: 'ph:compass-bold', color: '#f59e0b', rulesCount: 2, contactsInStage: 95, throughputRate: 48, isActive: false },
        { id: 'stg-2-5', name: t('journeyBuilder.teamInvite'), description: t('journeyBuilder.teamInviteDesc'), icon: 'ph:users-bold', color: '#06b6d4', rulesCount: 3, contactsInStage: 68, throughputRate: 35, isActive: false },
        { id: 'stg-2-6', name: t('journeyBuilder.successMilestone'), description: t('journeyBuilder.successMilestoneDesc'), icon: 'ph:trophy-bold', color: '#ef4444', rulesCount: 2, contactsInStage: 46, throughputRate: 28, isActive: false }
      ]
    },
    {
      id: 'j-3',
      name: t('journeyBuilder.dormantLeadRecovery'),
      templateName: t('journeyBuilder.reEngagement'),
      icon: 'ph:arrow-counter-clockwise-bold',
      color: '#3b82f6',
      status: 'active',
      enrolledContacts: 892,
      completionRate: 41,
      avgTime: 25,
      conversionRate: 18,
      lastModified: new Date(now.getTime() - 8 * 86400000).toISOString(),
      stages: [
        { id: 'stg-3-1', name: t('journeyBuilder.missYouEmail'), description: t('journeyBuilder.missYouEmailDesc'), icon: 'ph:envelope-bold', color: '#3b82f6', rulesCount: 2, contactsInStage: 350, throughputRate: 88, isActive: true },
        { id: 'stg-3-2', name: t('journeyBuilder.specialOffer'), description: t('journeyBuilder.specialOfferDesc'), icon: 'ph:gift-bold', color: '#f59e0b', rulesCount: 3, contactsInStage: 280, throughputRate: 55, isActive: true },
        { id: 'stg-3-3', name: t('journeyBuilder.personalOutreach'), description: t('journeyBuilder.personalOutreachDesc'), icon: 'ph:phone-bold', color: '#22c55e', rulesCount: 4, contactsInStage: 162, throughputRate: 32, isActive: false },
        { id: 'stg-3-4', name: t('journeyBuilder.reactivationCTA'), description: t('journeyBuilder.reactivationCTADesc'), icon: 'ph:cursor-click-bold', color: '#ef4444', rulesCount: 2, contactsInStage: 100, throughputRate: 18, isActive: false }
      ]
    },
    {
      id: 'j-4',
      name: t('journeyBuilder.premiumUpsellQ1'),
      templateName: t('journeyBuilder.upsellPath'),
      icon: 'ph:trend-up-bold',
      color: '#f59e0b',
      status: 'paused',
      enrolledContacts: 324,
      completionRate: 35,
      avgTime: 38,
      conversionRate: 22,
      lastModified: new Date(now.getTime() - 12 * 86400000).toISOString(),
      stages: [
        { id: 'stg-4-1', name: t('journeyBuilder.usageAnalysis'), description: t('journeyBuilder.usageAnalysisDesc'), icon: 'ph:chart-line-bold', color: '#7849ff', rulesCount: 5, contactsInStage: 120, throughputRate: 75, isActive: false },
        { id: 'stg-4-2', name: t('journeyBuilder.featureTeaser'), description: t('journeyBuilder.featureTeaserDesc'), icon: 'ph:sparkle-bold', color: '#3b82f6', rulesCount: 3, contactsInStage: 88, throughputRate: 58, isActive: false },
        { id: 'stg-4-3', name: t('journeyBuilder.caseStudy'), description: t('journeyBuilder.caseStudyDesc'), icon: 'ph:book-open-bold', color: '#22c55e', rulesCount: 2, contactsInStage: 65, throughputRate: 42, isActive: false },
        { id: 'stg-4-4', name: t('journeyBuilder.upgradeOffer'), description: t('journeyBuilder.upgradeOfferDesc'), icon: 'ph:crown-bold', color: '#f59e0b', rulesCount: 4, contactsInStage: 30, throughputRate: 28, isActive: false },
        { id: 'stg-4-5', name: t('journeyBuilder.consultationBook'), description: t('journeyBuilder.consultationBookDesc'), icon: 'ph:calendar-check-bold', color: '#06b6d4', rulesCount: 2, contactsInStage: 21, throughputRate: 22, isActive: false }
      ]
    },
    {
      id: 'j-5',
      name: t('journeyBuilder.annualRenewalDrive'),
      templateName: t('journeyBuilder.renewalJourney'),
      icon: 'ph:arrows-clockwise-bold',
      color: '#06b6d4',
      status: 'active',
      enrolledContacts: 567,
      completionRate: 78,
      avgTime: 10,
      conversionRate: 65,
      lastModified: new Date(now.getTime() - 1 * 86400000).toISOString(),
      stages: [
        { id: 'stg-5-1', name: t('journeyBuilder.renewalReminder'), description: t('journeyBuilder.renewalReminderDesc'), icon: 'ph:bell-bold', color: '#06b6d4', rulesCount: 2, contactsInStage: 110, throughputRate: 96, isActive: true },
        { id: 'stg-5-2', name: t('journeyBuilder.valueSummary'), description: t('journeyBuilder.valueSummaryDesc'), icon: 'ph:chart-pie-bold', color: '#7849ff', rulesCount: 3, contactsInStage: 165, throughputRate: 88, isActive: true },
        { id: 'stg-5-3', name: t('journeyBuilder.renewalOffer'), description: t('journeyBuilder.renewalOfferDesc'), icon: 'ph:tag-bold', color: '#22c55e', rulesCount: 4, contactsInStage: 180, throughputRate: 75, isActive: true },
        { id: 'stg-5-4', name: t('journeyBuilder.renewalConfirm'), description: t('journeyBuilder.renewalConfirmDesc'), icon: 'ph:check-circle-bold', color: '#f59e0b', rulesCount: 2, contactsInStage: 112, throughputRate: 65, isActive: false }
      ]
    },
    {
      id: 'j-6',
      name: t('journeyBuilder.winBackCampaignName'),
      templateName: t('journeyBuilder.winBackCampaign'),
      icon: 'ph:trophy-bold',
      color: '#ef4444',
      status: 'draft',
      enrolledContacts: 0,
      completionRate: 0,
      avgTime: 0,
      conversionRate: 0,
      lastModified: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
      stages: [
        { id: 'stg-6-1', name: t('journeyBuilder.exitSurvey'), description: t('journeyBuilder.exitSurveyDesc'), icon: 'ph:clipboard-text-bold', color: '#ef4444', rulesCount: 3, contactsInStage: 0, throughputRate: 0, isActive: false },
        { id: 'stg-6-2', name: t('journeyBuilder.feedbackReview'), description: t('journeyBuilder.feedbackReviewDesc'), icon: 'ph:magnifying-glass-bold', color: '#3b82f6', rulesCount: 2, contactsInStage: 0, throughputRate: 0, isActive: false },
        { id: 'stg-6-3', name: t('journeyBuilder.specialIncentive'), description: t('journeyBuilder.specialIncentiveDesc'), icon: 'ph:gift-bold', color: '#f59e0b', rulesCount: 4, contactsInStage: 0, throughputRate: 0, isActive: false },
        { id: 'stg-6-4', name: t('journeyBuilder.personalCall'), description: t('journeyBuilder.personalCallDesc'), icon: 'ph:phone-bold', color: '#22c55e', rulesCount: 2, contactsInStage: 0, throughputRate: 0, isActive: false },
        { id: 'stg-6-5', name: t('journeyBuilder.returnOffer'), description: t('journeyBuilder.returnOfferDesc'), icon: 'ph:arrow-u-up-left-bold', color: '#7849ff', rulesCount: 3, contactsInStage: 0, throughputRate: 0, isActive: false }
      ]
    }
  ];

  selectedDesignerJourney.value = 'j-1';
}

// ── Data Loading ─────────────────────────────────────────
async function loadDeals() {
  try {
    const { body, success } = await useApiFetch('deal?limit=500');
    if (success && body) {
      const data = body as any;
      allDeals.value = data.docs || data || [];
    }
  } catch { /* silent */ }
}

async function loadLeads() {
  try {
    const { body, success } = await useApiFetch('lead?limit=500');
    if (success && body) {
      const data = body as any;
      allLeads.value = data.docs || data || [];
    }
  } catch { /* silent */ }
}

async function loadData() {
  loading.value = true;
  try {
    await Promise.all([loadDeals(), loadLeads()]);
    seedTemplates();
    seedJourneys();
  } catch {
    ElNotification({ type: 'error', title: t('journeyBuilder.error'), message: t('journeyBuilder.loadFailed') });
  } finally {
    loading.value = false;
  }
}

async function refreshData() {
  await loadData().catch(() => {});
}

// ── Initialize ───────────────────────────────────────────
await loadData().catch(() => {});
</script>

<style lang="scss" scoped>
.journey-builder-page {
  animation: fadeInUp 0.4s ease-out;
}

/* ══════════════════════════════════
   KPI Cards
   ══════════════════════════════════ */
.kpi-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

.kpi-card-inner {
  padding: 24px;
  position: relative;
  z-index: 1;
}

.journeys-card {
  background: linear-gradient(135deg, rgba(120, 73, 255, 0.12), rgba(139, 92, 246, 0.06));
  border: 1px solid rgba(120, 73, 255, 0.2);
  &:hover { box-shadow: 0 8px 32px rgba(120, 73, 255, 0.15); }
}

.completion-card {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(22, 163, 74, 0.06));
  border: 1px solid rgba(34, 197, 94, 0.2);
  &:hover { box-shadow: 0 8px 32px rgba(34, 197, 94, 0.15); }
}

.time-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.06));
  border: 1px solid rgba(59, 130, 246, 0.2);
  &:hover { box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15); }
}

.conversion-card {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.06));
  border: 1px solid rgba(245, 158, 11, 0.2);
  &:hover { box-shadow: 0 8px 32px rgba(245, 158, 11, 0.15); }
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

.journeys-icon { background: rgba(120, 73, 255, 0.15); color: #7849ff; }
.completion-icon { background: transparent; }
.time-icon { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.conversion-icon { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

/* ══════════════════════════════════
   Glass Card
   ══════════════════════════════════ */
.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
}

/* ══════════════════════════════════
   Tabs
   ══════════════════════════════════ */
.journey-tabs {
  :deep(.el-tabs__header) {
    background: var(--bg-elevated);
    border-color: var(--border-default);
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

/* ══════════════════════════════════
   Template Cards
   ══════════════════════════════════ */
.template-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.1);
  }
}

.stage-badge {
  :deep(.el-badge__content) {
    background: rgba(120, 73, 255, 0.15);
    color: #7849ff;
    border: none;
    font-weight: 700;
    font-size: 11px;
  }
}

/* ══════════════════════════════════
   Table Enhancements
   ══════════════════════════════════ */
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

/* ══════════════════════════════════
   Chart Container
   ══════════════════════════════════ */
.chart-container {
  min-height: 380px;
}

/* ══════════════════════════════════
   Journey Designer
   ══════════════════════════════════ */
.designer-canvas {
  min-height: 400px;
  background:
    radial-gradient(circle at 1px 1px, var(--border-default) 1px, transparent 1px);
  background-size: 24px 24px;
}

.stage-flow {
  display: flex;
  align-items: flex-start;
  gap: 0;
  padding: 16px;
  transition: transform 0.3s ease;
  min-width: max-content;
}

.stage-node {
  width: 220px;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-6px);

    .stage-node-inner {
      box-shadow: 0 12px 40px rgba(120, 73, 255, 0.15);
      border-color: rgba(120, 73, 255, 0.3);
    }
  }

  &.active-stage .stage-node-inner {
    border-color: rgba(120, 73, 255, 0.4);
    box-shadow: 0 0 0 3px rgba(120, 73, 255, 0.1);
  }

  &.start-node,
  &.end-node {
    width: 140px;

    .stage-node-inner {
      padding: 20px 16px;
      text-align: center;
    }
  }
}

.stage-node-inner {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;
}

.stage-connector {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 48px;
  position: relative;
  align-self: center;
  margin-top: 60px;
}

.connector-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, rgba(120, 73, 255, 0.3), rgba(120, 73, 255, 0.6));
  border-radius: 2px;
}

.connector-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(120, 73, 255, 0.1);
  flex-shrink: 0;
}

.stat-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
}

.add-stage-btn {
  width: 120px;
  flex-shrink: 0;
  align-self: center;
  margin-top: 60px;
  margin-left: 16px;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.08);

    .add-stage-inner {
      border-color: rgba(120, 73, 255, 0.5);
      background: rgba(120, 73, 255, 0.06);
    }
  }
}

.add-stage-inner {
  border: 2px dashed rgba(120, 73, 255, 0.3);
  border-radius: 16px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

/* ══════════════════════════════════
   Animations
   ══════════════════════════════════ */
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

/* ══════════════════════════════════
   Responsive
   ══════════════════════════════════ */
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
    min-height: 280px;
  }

  .journey-builder-page {
    padding: 16px !important;
  }

  .stage-node {
    width: 180px;
  }

  .stage-node.start-node,
  .stage-node.end-node {
    width: 120px;
  }

  .stage-connector {
    width: 32px;
  }
}
</style>
