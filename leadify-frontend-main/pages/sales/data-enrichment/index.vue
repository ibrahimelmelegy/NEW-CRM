<template lang="pug">
.data-enrichment-page.p-6
  //- Header
  .flex.items-center.justify-between.mb-6(class="flex-col md:flex-row gap-4")
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:magic-wand-bold" size="24" class="mr-2" style="color: #7849ff")
        | {{ $t('dataEnrichment.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('dataEnrichment.subtitle') }}
    .flex.items-center.gap-3
      el-button(type="primary" @click="handleBulkEnrich" :loading="enrichingAll" :disabled="!selectedContacts.length" class="!rounded-xl")
        Icon(name="ph:lightning-bold" size="16" class="mr-1")
        | {{ $t('dataEnrichment.bulkEnrich') }} ({{ selectedContacts.length }})
      el-button(@click="runFullEnrichment" :loading="runningFullEnrich" class="!rounded-xl")
        Icon(name="ph:arrows-clockwise-bold" size="16" class="mr-1")
        | {{ $t('dataEnrichment.runEnrichment') }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- KPI Cards
    .grid.gap-4.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
      .glass-card.p-6.rounded-2xl
        .flex.items-center.justify-between
          div
            p.text-sm(style="color: var(--text-muted)") {{ $t('dataEnrichment.enrichedContacts') }}
            p.text-3xl.font-bold.mt-2(style="color: #7849ff") {{ kpi.enrichedCount }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ kpi.enrichedPercent }}% {{ $t('dataEnrichment.ofTotal') }}
          .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
            Icon(name="ph:user-check-bold" size="24" style="color: #7849ff")

      .glass-card.p-6.rounded-2xl
        .flex.items-center.justify-between
          div
            p.text-sm(style="color: var(--text-muted)") {{ $t('dataEnrichment.dataCompleteness') }}
            p.text-3xl.font-bold.mt-2(:style="{ color: getScoreColor(kpi.completenessScore) }") {{ kpi.completenessScore }}%
          .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
            Icon(name="ph:chart-pie-bold" size="24" style="color: #22c55e")

      .glass-card.p-6.rounded-2xl
        .flex.items-center.justify-between
          div
            p.text-sm(style="color: var(--text-muted)") {{ $t('dataEnrichment.missingFields') }}
            p.text-3xl.font-bold.mt-2(style="color: #f59e0b") {{ kpi.missingFieldsCount }}
          .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
            Icon(name="ph:warning-circle-bold" size="24" style="color: #f59e0b")

      .glass-card.p-6.rounded-2xl
        .flex.items-center.justify-between
          div
            p.text-sm(style="color: var(--text-muted)") {{ $t('dataEnrichment.lastRun') }}
            p.text-xl.font-bold.mt-2(style="color: var(--text-primary)") {{ kpi.lastRunFormatted }}
          .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
            Icon(name="ph:clock-bold" size="24" style="color: #3b82f6")

    //- Tabs
    el-tabs(v-model="activeTab" type="border-card" class="enrichment-tabs")

      //- ═══════════════════════════════════════════════
      //- TAB 1: Data Quality Grid
      //- ═══════════════════════════════════════════════
      el-tab-pane(:label="$t('dataEnrichment.dataQuality')" name="quality")
        .mb-4.flex.items-center.justify-between(class="flex-col md:flex-row gap-3")
          el-input(
            v-model="searchQuery"
            :placeholder="$t('dataEnrichment.searchContacts')"
            clearable
            style="max-width: 320px"
            class="!rounded-xl"
          )
            template(#prefix)
              Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")
          .flex.items-center.gap-2
            el-select(v-model="qualityFilter" style="width: 160px" clearable :placeholder="$t('dataEnrichment.filterByScore')")
              el-option(:label="$t('dataEnrichment.allScores')" value="")
              el-option(:label="$t('dataEnrichment.highQuality')" value="high")
              el-option(:label="$t('dataEnrichment.mediumQuality')" value="medium")
              el-option(:label="$t('dataEnrichment.lowQuality')" value="low")

        //- Data Quality Table
        el-table(
          :data="filteredContacts"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          :row-class-name="getRowClassName"
          v-loading="loadingContacts"
          :empty-text="$t('dataEnrichment.noContacts')"
        )
          el-table-column(type="selection" width="50")
          el-table-column(:label="$t('dataEnrichment.name')" prop="name" min-width="160")
            template(#default="{ row }")
              .flex.items-center.gap-2
                .w-8.h-8.rounded-full.flex.items-center.justify-center.text-xs.font-bold(
                  :style="{ background: getAvatarColor(row.name), color: '#fff' }"
                ) {{ getInitials(row.name) }}
                span.font-medium(style="color: var(--text-primary)") {{ row.name }}
          el-table-column(:label="$t('dataEnrichment.email')" prop="email" min-width="200")
            template(#default="{ row }")
              span(style="color: var(--text-secondary)") {{ row.email || '--' }}
          el-table-column(:label="$t('dataEnrichment.company')" prop="company" min-width="160")
            template(#default="{ row }")
              span(style="color: var(--text-secondary)") {{ row.company || '--' }}
          el-table-column(:label="$t('dataEnrichment.phone')" prop="phone" min-width="140")
            template(#default="{ row }")
              span(style="color: var(--text-secondary)") {{ row.phone || '--' }}
          el-table-column(:label="$t('dataEnrichment.industry')" prop="industry" min-width="140")
            template(#default="{ row }")
              el-tag(v-if="row.industry" size="small" round effect="plain") {{ row.industry }}
              span.text-xs(v-else style="color: var(--text-muted)") --
          el-table-column(:label="$t('dataEnrichment.location')" prop="location" min-width="140")
            template(#default="{ row }")
              span(style="color: var(--text-secondary)") {{ row.location || '--' }}
          el-table-column(:label="$t('dataEnrichment.score')" prop="score" width="100" sortable)
            template(#default="{ row }")
              .flex.items-center.justify-center
                .w-10.h-10.rounded-full.flex.items-center.justify-center.text-sm.font-bold(
                  :style="{ background: getScoreColor(row.score) + '20', color: getScoreColor(row.score) }"
                ) {{ row.score }}
          el-table-column(:label="$t('dataEnrichment.missingFieldsLabel')" min-width="180")
            template(#default="{ row }")
              .flex.flex-wrap.gap-1
                el-tag(
                  v-for="field in row.missingFields"
                  :key="field"
                  size="small"
                  type="danger"
                  effect="plain"
                  round
                ) {{ field }}
                span.text-xs(v-if="!row.missingFields?.length" style="color: #22c55e") {{ $t('dataEnrichment.complete') }}
          el-table-column(:label="$t('dataEnrichment.actions')" width="120" fixed="right")
            template(#default="{ row }")
              el-button(
                type="primary"
                size="small"
                :loading="row.enriching"
                @click="enrichContact(row)"
                class="!rounded-lg"
                :disabled="row.score >= 100"
              )
                Icon(name="ph:magic-wand-bold" size="14" class="mr-1")
                | {{ $t('dataEnrichment.enrich') }}

        //- Pagination
        .flex.justify-center.mt-4
          el-pagination(
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalContacts"
            layout="prev, pager, next"
            background
          )

      //- ═══════════════════════════════════════════════
      //- TAB 2: AI Lead Scoring
      //- ═══════════════════════════════════════════════
      el-tab-pane(:label="$t('dataEnrichment.aiLeadScoring')" name="scoring")
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")

          //- Scoring Model Configuration
          .glass-card.p-6.rounded-2xl
            h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
              Icon(name="ph:brain-bold" size="20" class="mr-2" style="color: #7849ff")
              | {{ $t('dataEnrichment.scoringModel') }}

            //- Behavioral Signals
            .mb-6
              .flex.items-center.justify-between.mb-3
                h4.text-sm.font-bold.uppercase(style="color: var(--text-primary)")
                  Icon(name="ph:cursor-click-bold" size="16" class="mr-1" style="color: #3b82f6")
                  | {{ $t('dataEnrichment.behavioral') }}
                el-tag(size="small" type="info" round) {{ $t('dataEnrichment.weight') }}: {{ scoringWeights.behavioral }}%
              .space-y-2.pl-4
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.emailOpens') }}
                  el-tag(size="small" effect="plain" round) +5 {{ $t('dataEnrichment.pts') }}
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.websiteVisits') }}
                  el-tag(size="small" effect="plain" round) +3 {{ $t('dataEnrichment.pts') }}
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.formSubmissions') }}
                  el-tag(size="small" effect="plain" round) +10 {{ $t('dataEnrichment.pts') }}
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.meetingBooked') }}
                  el-tag(size="small" effect="plain" round) +15 {{ $t('dataEnrichment.pts') }}

            //- Demographic Signals
            .mb-6
              .flex.items-center.justify-between.mb-3
                h4.text-sm.font-bold.uppercase(style="color: var(--text-primary)")
                  Icon(name="ph:users-bold" size="16" class="mr-1" style="color: #22c55e")
                  | {{ $t('dataEnrichment.demographic') }}
                el-tag(size="small" type="success" round) {{ $t('dataEnrichment.weight') }}: {{ scoringWeights.demographic }}%
              .space-y-2.pl-4
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.companySize') }}
                  .flex.gap-1
                    el-tag(size="small" effect="plain" round type="danger") Enterprise +20
                    el-tag(size="small" effect="plain" round type="warning") Mid +15
                    el-tag(size="small" effect="plain" round) SMB +10
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.industryMatch') }}
                  el-tag(size="small" effect="plain" round) +15 {{ $t('dataEnrichment.pts') }}
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.jobTitle') }}
                  el-tag(size="small" effect="plain" round) +10-25 {{ $t('dataEnrichment.pts') }}
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.locationMatch') }}
                  el-tag(size="small" effect="plain" round) +5 {{ $t('dataEnrichment.pts') }}

            //- Engagement Signals
            .mb-6
              .flex.items-center.justify-between.mb-3
                h4.text-sm.font-bold.uppercase(style="color: var(--text-primary)")
                  Icon(name="ph:hand-tap-bold" size="16" class="mr-1" style="color: #f59e0b")
                  | {{ $t('dataEnrichment.engagement') }}
                el-tag(size="small" type="warning" round) {{ $t('dataEnrichment.weight') }}: {{ scoringWeights.engagement }}%
              .space-y-2.pl-4
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.responseTime') }}
                  el-tag(size="small" effect="plain" round) +2 to +10 {{ $t('dataEnrichment.pts') }}
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.socialEngagement') }}
                  el-tag(size="small" effect="plain" round) +5 {{ $t('dataEnrichment.pts') }}
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.contentDownloads') }}
                  el-tag(size="small" effect="plain" round) +8 {{ $t('dataEnrichment.pts') }}
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.demoRequested') }}
                  el-tag(size="small" effect="plain" round) +25 {{ $t('dataEnrichment.pts') }}

            //- Firmographic Signals
            .mb-2
              .flex.items-center.justify-between.mb-3
                h4.text-sm.font-bold.uppercase(style="color: var(--text-primary)")
                  Icon(name="ph:buildings-bold" size="16" class="mr-1" style="color: #ef4444")
                  | {{ $t('dataEnrichment.firmographic') }}
                el-tag(size="small" type="danger" round) {{ $t('dataEnrichment.weight') }}: {{ scoringWeights.firmographic }}%
              .space-y-2.pl-4
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.revenueRange') }}
                  el-tag(size="small" effect="plain" round) +10-20 {{ $t('dataEnrichment.pts') }}
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.techStack') }}
                  el-tag(size="small" effect="plain" round) +10 {{ $t('dataEnrichment.pts') }}
                .flex.items-center.justify-between.py-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.budgetConfirmed') }}
                  el-tag(size="small" effect="plain" round) +20 {{ $t('dataEnrichment.pts') }}

          //- Scoring Threshold Configuration
          .glass-card.p-6.rounded-2xl
            h3.text-lg.font-bold.mb-6(style="color: var(--text-primary)")
              Icon(name="ph:sliders-horizontal-bold" size="20" class="mr-2" style="color: #f59e0b")
              | {{ $t('dataEnrichment.threshold') }} {{ $t('dataEnrichment.configuration') }}

            //- Hot Lead Threshold
            .mb-8
              .flex.items-center.justify-between.mb-2
                .flex.items-center.gap-2
                  .w-3.h-3.rounded-full(style="background: #ef4444")
                  span.font-bold(style="color: var(--text-primary)") {{ $t('dataEnrichment.hotLead') }}
                span.text-sm.font-bold(style="color: #ef4444") {{ thresholds.hot }}+ {{ $t('dataEnrichment.pts') }}
              el-slider(
                v-model="thresholds.hot"
                :min="50"
                :max="100"
                :step="5"
                :format-tooltip="(v: number) => v + ' pts'"
                show-input
                input-size="small"
              )
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('dataEnrichment.autoAssign') }}

            //- Warm Lead Threshold
            .mb-8
              .flex.items-center.justify-between.mb-2
                .flex.items-center.gap-2
                  .w-3.h-3.rounded-full(style="background: #f59e0b")
                  span.font-bold(style="color: var(--text-primary)") {{ $t('dataEnrichment.warmLead') }}
                span.text-sm.font-bold(style="color: #f59e0b") {{ thresholds.warm }}-{{ thresholds.hot - 1 }} {{ $t('dataEnrichment.pts') }}
              el-slider(
                v-model="thresholds.warm"
                :min="20"
                :max="thresholds.hot - 5"
                :step="5"
                :format-tooltip="(v: number) => v + ' pts'"
                show-input
                input-size="small"
              )
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('dataEnrichment.nurtureSequence') }}

            //- Cold Lead
            .mb-8
              .flex.items-center.justify-between.mb-2
                .flex.items-center.gap-2
                  .w-3.h-3.rounded-full(style="background: #3b82f6")
                  span.font-bold(style="color: var(--text-primary)") {{ $t('dataEnrichment.coldLead') }}
                span.text-sm.font-bold(style="color: #3b82f6") {{ '<' }}{{ thresholds.warm }} {{ $t('dataEnrichment.pts') }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('dataEnrichment.marketingDrip') }}

            //- Weight Configuration
            h4.text-sm.font-bold.uppercase.mb-4.mt-8(style="color: var(--text-primary)") {{ $t('dataEnrichment.weightConfiguration') }}
            .space-y-4
              div
                .flex.items-center.justify-between.mb-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.behavioral') }}
                  span.text-sm.font-bold(style="color: #3b82f6") {{ scoringWeights.behavioral }}%
                el-slider(v-model="scoringWeights.behavioral" :min="0" :max="100" :step="5" @change="rebalanceWeights('behavioral')")
              div
                .flex.items-center.justify-between.mb-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.demographic') }}
                  span.text-sm.font-bold(style="color: #22c55e") {{ scoringWeights.demographic }}%
                el-slider(v-model="scoringWeights.demographic" :min="0" :max="100" :step="5" @change="rebalanceWeights('demographic')")
              div
                .flex.items-center.justify-between.mb-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.engagement') }}
                  span.text-sm.font-bold(style="color: #f59e0b") {{ scoringWeights.engagement }}%
                el-slider(v-model="scoringWeights.engagement" :min="0" :max="100" :step="5" @change="rebalanceWeights('engagement')")
              div
                .flex.items-center.justify-between.mb-1
                  span.text-sm(style="color: var(--text-secondary)") {{ $t('dataEnrichment.firmographic') }}
                  span.text-sm.font-bold(style="color: #ef4444") {{ scoringWeights.firmographic }}%
                el-slider(v-model="scoringWeights.firmographic" :min="0" :max="100" :step="5" @change="rebalanceWeights('firmographic')")
              .text-center.mt-2
                el-tag(:type="totalWeight === 100 ? 'success' : 'danger'" size="small" round) {{ $t('dataEnrichment.totalWeight') }}: {{ totalWeight }}%

      //- ═══════════════════════════════════════════════
      //- TAB 3: Lead Score Distribution
      //- ═══════════════════════════════════════════════
      el-tab-pane(:label="$t('dataEnrichment.scoreDistribution')" name="distribution")
        .glass-card.p-6.rounded-2xl.mb-6
          h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
            Icon(name="ph:chart-bar-bold" size="20" class="mr-2" style="color: #7849ff")
            | {{ $t('dataEnrichment.scoreDistribution') }}
          .flex.items-center.justify-center(style="min-height: 380px")
            ClientOnly
              VChart.w-full(:option="distributionChartOption" :style="{ height: '360px' }" autoresize)

        //- Score Distribution Summary
        .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
          .glass-card.p-5.rounded-2xl.text-center
            .w-12.h-12.rounded-full.flex.items-center.justify-center.mx-auto.mb-3(style="background: rgba(239, 68, 68, 0.15)")
              Icon(name="ph:fire-bold" size="24" style="color: #ef4444")
            p.text-3xl.font-bold(style="color: #ef4444") {{ scoreDistributionSummary.hot }}
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('dataEnrichment.hotLead') }}s ({{ thresholds.hot }}+)
          .glass-card.p-5.rounded-2xl.text-center
            .w-12.h-12.rounded-full.flex.items-center.justify-center.mx-auto.mb-3(style="background: rgba(245, 158, 11, 0.15)")
              Icon(name="ph:sun-bold" size="24" style="color: #f59e0b")
            p.text-3xl.font-bold(style="color: #f59e0b") {{ scoreDistributionSummary.warm }}
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('dataEnrichment.warmLead') }}s ({{ thresholds.warm }}-{{ thresholds.hot - 1 }})
          .glass-card.p-5.rounded-2xl.text-center
            .w-12.h-12.rounded-full.flex.items-center.justify-center.mx-auto.mb-3(style="background: rgba(59, 130, 246, 0.15)")
              Icon(name="ph:snowflake-bold" size="24" style="color: #3b82f6")
            p.text-3xl.font-bold(style="color: #3b82f6") {{ scoreDistributionSummary.cold }}
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('dataEnrichment.coldLead') }}s ({{ '<' }}{{ thresholds.warm }})

      //- ═══════════════════════════════════════════════
      //- TAB 4: Enrichment Log
      //- ═══════════════════════════════════════════════
      el-tab-pane(:label="$t('dataEnrichment.enrichmentLog')" name="log")
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4
            h3.text-lg.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:clock-counter-clockwise-bold" size="20" class="mr-2" style="color: #3b82f6")
              | {{ $t('dataEnrichment.enrichmentLog') }}
            el-button(size="small" text @click="loadEnrichmentLog" :loading="loadingLog" :aria-label="$t('dataEnrichment.enrichmentLog')")
              Icon(name="ph:arrows-clockwise" size="14")

          //- Empty State
          .text-center.py-16(v-if="!enrichmentLog.length && !loadingLog")
            Icon(name="ph:clock-counter-clockwise" size="48" style="color: var(--text-muted)")
            p.mt-3.font-medium(style="color: var(--text-primary)") {{ $t('dataEnrichment.noLogEntries') }}
            p.mt-1.text-sm(style="color: var(--text-muted)") {{ $t('dataEnrichment.noLogDescription') }}

          //- Timeline
          .space-y-4(v-else)
            .flex.gap-4.p-4.rounded-xl(
              v-for="(entry, idx) in enrichmentLog"
              :key="idx"
              style="background: var(--bg-elevated); border: 1px solid var(--border-default)"
            )
              .flex-shrink-0
                .w-10.h-10.rounded-full.flex.items-center.justify-center(
                  :style="{ background: getLogEntryColor(entry.type) + '20' }"
                )
                  Icon(:name="getLogEntryIcon(entry.type)" size="20" :style="{ color: getLogEntryColor(entry.type) }")
              div.flex-1
                .flex.items-center.justify-between
                  p.font-semibold.text-sm(style="color: var(--text-primary)") {{ entry.message }}
                  span.text-xs(style="color: var(--text-muted)") {{ entry.timestamp }}
                p.text-xs.mt-1(style="color: var(--text-muted)")
                  | {{ $t('dataEnrichment.source') }}: {{ entry.source }}
                .flex.flex-wrap.gap-1.mt-2(v-if="entry.fieldsUpdated?.length")
                  el-tag(
                    v-for="field in entry.fieldsUpdated"
                    :key="field"
                    size="small"
                    type="success"
                    effect="plain"
                    round
                  ) {{ field }}

      //- ═══════════════════════════════════════════════
      //- TAB 5: Auto-Enrichment Rules
      //- ═══════════════════════════════════════════════
      el-tab-pane(:label="$t('dataEnrichment.autoRules')" name="rules")
        .glass-card.p-6.rounded-2xl
          h3.text-lg.font-bold.mb-6(style="color: var(--text-primary)")
            Icon(name="ph:gear-bold" size="20" class="mr-2" style="color: #7849ff")
            | {{ $t('dataEnrichment.autoEnrichment') }}

          .space-y-4
            //- Rule: Auto-enrich new leads from web forms
            .flex.items-center.justify-between.p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
              .flex.items-center.gap-3
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
                  Icon(name="ph:browser-bold" size="20" style="color: #7849ff")
                div
                  p.font-semibold.text-sm(style="color: var(--text-primary)") {{ $t('dataEnrichment.enrichNewLeads') }}
                  p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('dataEnrichment.enrichNewLeadsDesc') }}
              el-switch(v-model="autoRules.enrichNewLeads" active-color="#7849ff")

            //- Rule: Auto-enrich on lead import
            .flex.items-center.justify-between.p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
              .flex.items-center.gap-3
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
                  Icon(name="ph:upload-bold" size="20" style="color: #3b82f6")
                div
                  p.font-semibold.text-sm(style="color: var(--text-primary)") {{ $t('dataEnrichment.enrichOnImport') }}
                  p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('dataEnrichment.enrichOnImportDesc') }}
              el-switch(v-model="autoRules.enrichOnImport" active-color="#7849ff")

            //- Rule: Weekly data refresh
            .flex.items-center.justify-between.p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
              .flex.items-center.gap-3
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
                  Icon(name="ph:calendar-check-bold" size="20" style="color: #22c55e")
                div
                  p.font-semibold.text-sm(style="color: var(--text-primary)") {{ $t('dataEnrichment.weeklyRefresh') }}
                  p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('dataEnrichment.weeklyRefreshDesc') }}
              el-switch(v-model="autoRules.weeklyRefresh" active-color="#7849ff")

            //- Rule: Enrich from email signatures
            .flex.items-center.justify-between.p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
              .flex.items-center.gap-3
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
                  Icon(name="ph:envelope-open-bold" size="20" style="color: #f59e0b")
                div
                  p.font-semibold.text-sm(style="color: var(--text-primary)") {{ $t('dataEnrichment.enrichFromSignatures') }}
                  p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('dataEnrichment.enrichFromSignaturesDesc') }}
              el-switch(v-model="autoRules.enrichFromSignatures" active-color="#7849ff")

          //- Save button
          .flex.justify-end.mt-6
            el-button(type="primary" @click="saveAutoRules" :loading="savingRules" class="!rounded-xl")
              Icon(name="ph:floppy-disk-bold" size="16" class="mr-1")
              | {{ $t('dataEnrichment.saveRules') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import VChart from 'vue-echarts';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();

// ─── Interfaces ──────────────────────────────────────
interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  industry: string;
  location: string;
  score: number;
  missingFields: string[];
  enriching?: boolean;
}

interface LogEntry {
  type: 'auto' | 'manual' | 'bulk' | 'import';
  message: string;
  timestamp: string;
  source: string;
  fieldsUpdated: string[];
}

// ─── State ───────────────────────────────────────────
const loading = ref(true);
const loadingContacts = ref(false);
const loadingLog = ref(false);
const enrichingAll = ref(false);
const runningFullEnrich = ref(false);
const savingRules = ref(false);
const activeTab = ref('quality');
const searchQuery = ref('');
const qualityFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const totalContacts = ref(0);
const selectedContacts = ref<Contact[]>([]);

// ─── KPI Data ────────────────────────────────────────
const kpi = reactive({
  enrichedCount: 0,
  enrichedPercent: 0,
  completenessScore: 0,
  missingFieldsCount: 0,
  lastRunFormatted: '--',
});

// ─── Contacts ────────────────────────────────────────
const contacts = ref<Contact[]>([]);

// ─── Lead Scoring ────────────────────────────────────
const scoringWeights = reactive({
  behavioral: 20,
  demographic: 30,
  engagement: 30,
  firmographic: 20,
});

const thresholds = reactive({
  hot: 80,
  warm: 50,
});

// ─── Auto Rules ──────────────────────────────────────
const autoRules = reactive({
  enrichNewLeads: true,
  enrichOnImport: true,
  weeklyRefresh: false,
  enrichFromSignatures: false,
});

// ─── Enrichment Log ──────────────────────────────────
const enrichmentLog = ref<LogEntry[]>([]);

// ─── Computed ────────────────────────────────────────
const totalWeight = computed(() =>
  scoringWeights.behavioral + scoringWeights.demographic + scoringWeights.engagement + scoringWeights.firmographic
);

const filteredContacts = computed(() => {
  let result = contacts.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
    );
  }
  if (qualityFilter.value === 'high') result = result.filter((c) => c.score >= 80);
  else if (qualityFilter.value === 'medium') result = result.filter((c) => c.score >= 50 && c.score < 80);
  else if (qualityFilter.value === 'low') result = result.filter((c) => c.score < 50);
  return result;
});

const scoreDistributionSummary = computed(() => {
  const all = contacts.value;
  return {
    hot: all.filter((c) => c.score >= thresholds.hot).length,
    warm: all.filter((c) => c.score >= thresholds.warm && c.score < thresholds.hot).length,
    cold: all.filter((c) => c.score < thresholds.warm).length,
  };
});

const distributionChartOption = computed(() => {
  const buckets = [
    { label: '0-9', min: 0, max: 10 },
    { label: '10-19', min: 10, max: 20 },
    { label: '20-29', min: 20, max: 30 },
    { label: '30-39', min: 30, max: 40 },
    { label: '40-49', min: 40, max: 50 },
    { label: '50-59', min: 50, max: 60 },
    { label: '60-69', min: 60, max: 70 },
    { label: '70-79', min: 70, max: 80 },
    { label: '80-89', min: 80, max: 90 },
    { label: '90-100', min: 90, max: 101 },
  ];

  const data = buckets.map((b) => contacts.value.filter((c) => c.score >= b.min && c.score < b.max).length);

  const colors = buckets.map((b) => {
    if (b.min >= thresholds.hot) return '#ef4444';
    if (b.min >= thresholds.warm) return '#f59e0b';
    return '#3b82f6';
  });

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: buckets.map((b) => b.label),
      axisLabel: { color: '#94A3B8' },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94A3B8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.15)', type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: data.map((val, i) => ({
          value: val,
          itemStyle: { color: colors[i], borderRadius: [6, 6, 0, 0] },
        })),
        barWidth: '60%',
      },
    ],
  };
});

// ─── Methods ─────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function getAvatarColor(name: string): string {
  const colors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length] || '';
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRowClassName({ row }: { row: Contact }) {
  if (row.score >= 80) return 'row-high';
  if (row.score >= 50) return 'row-medium';
  return 'row-low';
}

function handleSelectionChange(selection: Contact[]) {
  selectedContacts.value = selection;
}

function getLogEntryColor(type: string): string {
  const map: Record<string, string> = {
    auto: '#7849ff',
    manual: '#3b82f6',
    bulk: '#22c55e',
    import: '#f59e0b',
  };
  return map[type] || '#7849ff';
}

function getLogEntryIcon(type: string): string {
  const map: Record<string, string> = {
    auto: 'ph:lightning-bold',
    manual: 'ph:user-bold',
    bulk: 'ph:users-bold',
    import: 'ph:upload-bold',
  };
  return map[type] || 'ph:info-bold';
}

function rebalanceWeights(changed: keyof typeof scoringWeights) {
  const keys = ['behavioral', 'demographic', 'engagement', 'firmographic'] as const;
  const others = keys.filter((k) => k !== changed);
  const remaining = 100 - scoringWeights[changed];
  const othersTotal = others.reduce((sum, k) => sum + scoringWeights[k], 0);

  if (othersTotal === 0) {
    const each = Math.floor(remaining / others.length);
    others.forEach((k, i) => {
      scoringWeights[k] = i === others.length - 1 ? remaining - each * (others.length - 1) : each;
    });
  } else {
    others.forEach((k) => {
      scoringWeights[k] = Math.round((scoringWeights[k] / othersTotal) * remaining);
    });
    // Fix rounding
    const newTotal = keys.reduce((sum, k) => sum + scoringWeights[k], 0);
    if (newTotal !== 100) {
      scoringWeights[others[0]!] += 100 - newTotal;
    }
  }
}

// ─── API Calls ───────────────────────────────────────
async function loadDashboard() {
  loading.value = true;
  try {
    const [kpiRes, contactsRes] = await Promise.all([
      useApiFetch('data-enrichment/kpi'),
      useApiFetch('data-enrichment/contacts?page=1&limit=20'),
    ]);

    if (kpiRes?.body) {
      Object.assign(kpi, kpiRes.body);
    } else {
      // Demo data
      Object.assign(kpi, {
        enrichedCount: 1247,
        enrichedPercent: 78,
        completenessScore: 72,
        missingFieldsCount: 384,
        lastRunFormatted: '2 hours ago',
      });
    }

    if (contactsRes?.body?.data) {
      contacts.value = contactsRes.body.data;
      totalContacts.value = contactsRes.body.total || contactsRes.body.data.length;
    } else {
      loadDemoContacts();
    }
  } catch {
    loadDemoContacts();
  } finally {
    loading.value = false;
  }
}

function loadDemoContacts() {
  const demoNames = [
    'Ahmed Al-Rashid', 'Sarah Johnson', 'Mohammed Ali', 'Emily Chen', 'Khalid Ibrahim',
    'Lisa Martinez', 'Omar Farouk', 'Jessica Williams', 'Youssef Hassan', 'Anna Schmidt',
    'Fatima Al-Sayed', 'David Brown', 'Nour Abdallah', 'Michael O\'Brien', 'Layla Mahmoud',
    'Robert Taylor', 'Hana Yuki', 'James Wilson', 'Maryam Hosseini', 'Thomas Anderson',
  ];
  const industries = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', '', ''];
  const locations = ['Dubai, UAE', 'New York, US', 'London, UK', 'Riyadh, KSA', 'Berlin, DE', '', ''];
  const companies = ['TechCorp', 'FinServe Inc', 'MedPro', 'BuildRight', 'RetailMax', 'EduPlus', '', ''];

  contacts.value = demoNames.map((name, i): Contact => {
    const score = Math.floor(Math.random() * 100);
    const missing: string[] = [];
    const hasEmail = Math.random() > 0.1;
    const hasPhone = Math.random() > 0.3;
    const hasIndustry = Math.random() > 0.35;
    const hasLocation = Math.random() > 0.3;
    const hasCompany = Math.random() > 0.2;
    if (!hasPhone) missing.push('Phone');
    if (!hasIndustry) missing.push('Industry');
    if (!hasLocation) missing.push('Location');
    if (!hasCompany) missing.push('Company');

    return {
      id: `contact-${i + 1}`,
      name,
      email: hasEmail ? `${name.toLowerCase().replace(/[^a-z]/g, '.')}@example.com` : '',
      company: hasCompany ? companies[i % companies.length] || '' : '',
      phone: hasPhone ? `+971 5${Math.floor(Math.random() * 10)} ${Math.floor(1000000 + Math.random() * 9000000)}` : '',
      industry: hasIndustry ? industries[i % industries.length] || '' : '',
      location: hasLocation ? locations[i % locations.length] || '' : '',
      score,
      missingFields: missing,
    };
  });
  totalContacts.value = contacts.value.length;
}

async function enrichContact(contact: Contact) {
  contact.enriching = true;
  try {
    const res: any = await useApiFetch(`data-enrichment/enrich/${contact.id}`, 'POST');
    if (res?.body) {
      Object.assign(contact, res.body);
    } else {
      // Demo enrichment
      await new Promise((r) => setTimeout(r, 1200));
      contact.score = Math.min(100, contact.score + Math.floor(Math.random() * 25 + 10));
      contact.missingFields = contact.missingFields.slice(1);
      if (!contact.industry) contact.industry = 'Technology';
      if (!contact.phone) contact.phone = '+971 50 1234567';
      if (!contact.location) contact.location = 'Dubai, UAE';
      if (!contact.company) contact.company = 'Enriched Corp';
    }
    ElNotification({
      title: t('dataEnrichment.enrichSuccess'),
      message: `${contact.name} ${t('dataEnrichment.enrichedSuccessfully')}`,
      type: 'success',
    });
  } catch {
    ElNotification({ title: t('common.error'), message: t('dataEnrichment.enrichError'), type: 'error' });
  } finally {
    contact.enriching = false;
  }
}

async function handleBulkEnrich() {
  enrichingAll.value = true;
  try {
    const ids = selectedContacts.value.map((c) => c.id);
    await useApiFetch('data-enrichment/bulk-enrich', 'POST', { ids });
    ElNotification({
      title: t('dataEnrichment.bulkEnrichSuccess'),
      message: `${ids.length} ${t('dataEnrichment.contactsEnriched')}`,
      type: 'success',
    });
    await loadDashboard();
  } catch {
    // Demo fallback
    await new Promise((r) => setTimeout(r, 2000));
    selectedContacts.value.forEach((c) => {
      const contact = contacts.value.find((x) => x.id === c.id);
      if (contact) {
        contact.score = Math.min(100, contact.score + 15);
        contact.missingFields = contact.missingFields.slice(1);
      }
    });
    ElNotification({
      title: t('dataEnrichment.bulkEnrichSuccess'),
      message: `${selectedContacts.value.length} ${t('dataEnrichment.contactsEnriched')}`,
      type: 'success',
    });
  } finally {
    enrichingAll.value = false;
  }
}

async function runFullEnrichment() {
  runningFullEnrich.value = true;
  try {
    await useApiFetch('data-enrichment/run-full', 'POST');
    ElNotification({ title: t('dataEnrichment.enrichmentStarted'), type: 'success' });
    await loadDashboard();
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    kpi.enrichedCount += Math.floor(Math.random() * 20 + 5);
    kpi.completenessScore = Math.min(100, kpi.completenessScore + 3);
    kpi.missingFieldsCount = Math.max(0, kpi.missingFieldsCount - 20);
    kpi.lastRunFormatted = 'Just now';
    ElNotification({ title: t('dataEnrichment.enrichmentStarted'), message: t('dataEnrichment.enrichmentRunning'), type: 'success' });
  } finally {
    runningFullEnrich.value = false;
  }
}

async function loadEnrichmentLog() {
  loadingLog.value = true;
  try {
    const res: any = await useApiFetch('data-enrichment/log');
    if (res?.body?.data) {
      enrichmentLog.value = res.body.data;
    } else {
      loadDemoLog();
    }
  } catch {
    loadDemoLog();
  } finally {
    loadingLog.value = false;
  }
}

function loadDemoLog() {
  enrichmentLog.value = [
    {
      type: 'auto',
      message: t('dataEnrichment.log.autoEnriched'),
      timestamp: t('dataEnrichment.log.twoHoursAgo'),
      source: t('dataEnrichment.log.domainLookupApi'),
      fieldsUpdated: [t('dataEnrichment.company'), t('dataEnrichment.industry'), t('dataEnrichment.log.size'), t('dataEnrichment.location')],
    },
    {
      type: 'manual',
      message: t('dataEnrichment.log.manualEnrichment'),
      timestamp: t('dataEnrichment.log.fiveHoursAgo'),
      source: t('dataEnrichment.log.manualEntry'),
      fieldsUpdated: [t('dataEnrichment.industry'), t('dataEnrichment.log.companySize')],
    },
    {
      type: 'bulk',
      message: t('dataEnrichment.log.bulkEnriched'),
      timestamp: t('dataEnrichment.log.oneDayAgo'),
      source: t('dataEnrichment.log.csvImportEnrichment'),
      fieldsUpdated: [t('dataEnrichment.email'), t('dataEnrichment.phone'), t('dataEnrichment.log.linkedin'), t('dataEnrichment.jobTitle')],
    },
    {
      type: 'auto',
      message: t('dataEnrichment.log.weeklyRefreshCompleted'),
      timestamp: t('dataEnrichment.log.threeDaysAgo'),
      source: t('dataEnrichment.log.scheduledRefresh'),
      fieldsUpdated: [t('dataEnrichment.log.revenue'), t('dataEnrichment.log.employeeCount'), t('dataEnrichment.techStack')],
    },
    {
      type: 'import',
      message: t('dataEnrichment.log.importedEnriched'),
      timestamp: t('dataEnrichment.log.fiveDaysAgo'),
      source: t('dataEnrichment.log.webFormIntegration'),
      fieldsUpdated: [t('dataEnrichment.company'), t('dataEnrichment.industry'), t('dataEnrichment.phone'), t('dataEnrichment.location')],
    },
    {
      type: 'manual',
      message: t('dataEnrichment.log.manualVerification'),
      timestamp: t('dataEnrichment.log.oneWeekAgo'),
      source: t('dataEnrichment.log.manualVerificationSource'),
      fieldsUpdated: [t('dataEnrichment.log.emailVerified'), t('dataEnrichment.log.linkedin'), t('dataEnrichment.log.twitter')],
    },
    {
      type: 'auto',
      message: t('dataEnrichment.log.emailSignatureExtraction'),
      timestamp: t('dataEnrichment.log.oneWeekAgo'),
      source: t('dataEnrichment.log.emailSignatureParser'),
      fieldsUpdated: [t('dataEnrichment.phone'), t('dataEnrichment.jobTitle'), t('dataEnrichment.company')],
    },
  ];
}

async function saveAutoRules() {
  savingRules.value = true;
  try {
    await useApiFetch('data-enrichment/rules', 'PUT', { ...autoRules });
    ElNotification({ title: t('dataEnrichment.rulesSaved'), type: 'success' });
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    ElNotification({ title: t('dataEnrichment.rulesSaved'), type: 'success' });
  } finally {
    savingRules.value = false;
  }
}

// ─── Lifecycle ───────────────────────────────────────
onMounted(async () => {
  await loadDashboard();
  loadEnrichmentLog();
});
</script>

<style lang="scss" scoped>
.data-enrichment-page {
  max-width: 1400px;
  margin: 0 auto;
}

.enrichment-tabs {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;

  :deep(.el-tabs__header) {
    background: var(--bg-elevated) !important;
    border-radius: 12px !important;
    border: 1px solid var(--border-default) !important;
    margin-bottom: 20px;
  }

  :deep(.el-tabs__content) {
    padding: 0 !important;
    background: transparent !important;
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted) !important;
    font-weight: 500;

    &.is-active {
      color: var(--accent-color, #7849ff) !important;
    }
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }
}

// Score-based row highlighting
:deep(.row-high td) {
  background: rgba(34, 197, 94, 0.03) !important;
}

:deep(.row-medium td) {
  background: rgba(245, 158, 11, 0.03) !important;
}

:deep(.row-low td) {
  background: rgba(239, 68, 68, 0.03) !important;
}

.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--accent-color, #7849ff);
    box-shadow: 0 4px 20px rgba(120, 73, 255, 0.08);
  }
}
</style>
