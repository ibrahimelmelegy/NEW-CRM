<template lang="pug">
.feedback-nps-page.p-6(class="md:p-8")
  //- Page Header
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    div
      h1.text-3xl.font-black.tracking-tight.flex.items-center.gap-3(style="color: var(--text-primary)")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #7849ff, #a855f7)")
          Icon(name="ph:chart-bar-horizontal-bold" size="22" style="color: white")
        | {{ $t('feedbackNps.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('feedbackNps.subtitle') }}

    .flex.items-center.gap-3
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        range-separator="to"
        :start-placeholder="$t('feedbackNps.startDate')"
        :end-placeholder="$t('feedbackNps.endDate')"
        @change="onDateRangeChange"
        style="width: 280px"
      )
      el-button(
        type="primary"
        size="large"
        @click="refreshData"
        :loading="loading"
        class="!bg-[#7849ff] !border-none !rounded-xl"
      )
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-2 {{ $t('feedbackNps.refresh') }}

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="40" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- KPI Cards
    .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
      //- NPS Score
      .kpi-card.nps-card
        .kpi-card-inner
          .flex.items-center.justify-between
            div
              p.kpi-label {{ $t('feedbackNps.npsScore') }}
              .flex.items-baseline.gap-2
                p.kpi-value(:style="{ color: getNpsColor(npsScore) }") {{ npsScore }}
                span.kpi-pct {{ npsScore >= 50 ? $t('feedbackNps.excellent') : npsScore >= 0 ? $t('feedbackNps.good') : $t('feedbackNps.needsWork') }}
            .kpi-icon-wrap.nps-icon
              Icon(name="ph:smiley-bold" size="24")

      //- CSAT Score
      .kpi-card.csat-card
        .kpi-card-inner
          .flex.items-center.justify-between
            div
              p.kpi-label {{ $t('feedbackNps.csatScore') }}
              .flex.items-baseline.gap-2
                p.kpi-value {{ csatScore }}%
                span.kpi-pct {{ $t('feedbackNps.satisfaction') }}
            .kpi-icon-wrap.csat-icon
              Icon(name="ph:star-bold" size="24")

      //- Response Rate
      .kpi-card.response-card
        .kpi-card-inner
          .flex.items-center.justify-between
            div
              p.kpi-label {{ $t('feedbackNps.responseRate') }}
              .flex.items-baseline.gap-2
                p.kpi-value {{ responseRate }}%
                span.kpi-pct {{ $t('feedbackNps.ofSurveyed') }}
            .kpi-icon-wrap.response-icon
              Icon(name="ph:envelope-open-bold" size="24")

      //- Open Action Items
      .kpi-card.action-card
        .kpi-card-inner
          .flex.items-center.justify-between
            div
              p.kpi-label {{ $t('feedbackNps.openActionItems') }}
              .flex.items-baseline.gap-2
                p.kpi-value {{ openActionCount }}
                span.kpi-pct.text-red-400 {{ $t('feedbackNps.pending') }}
            .kpi-icon-wrap.action-icon
              Icon(name="ph:list-checks-bold" size="24")

    //- Main Tabs
    el-tabs(v-model="activeTab" type="border-card" class="feedback-tabs")

      //- ═══════════════════════════════════════════════════
      //- TAB 1: NPS Dashboard
      //- ═══════════════════════════════════════════════════
      el-tab-pane(:label="$t('feedbackNps.npsDashboard')" name="nps")
        .grid.gap-6.mb-6(class="grid-cols-1 lg:grid-cols-2")
          //- NPS Gauge Chart
          .glass-card.p-6.rounded-2xl
            .flex.items-center.justify-between.mb-4
              h3.text-lg.font-bold(style="color: var(--text-primary)")
                Icon(name="ph:gauge-bold" size="20" class="mr-2" style="color: #7849ff")
                | {{ $t('feedbackNps.npsGauge') }}
              el-tag(
                :type="npsScore >= 50 ? 'success' : npsScore >= 0 ? 'warning' : 'danger'"
                size="small"
                round
                effect="dark"
              ) {{ npsScore >= 50 ? $t('feedbackNps.excellent') : npsScore >= 0 ? $t('feedbackNps.good') : $t('feedbackNps.needsWork') }}
            ClientOnly
              VChart(v-if="npsGaugeOption" :option="npsGaugeOption" autoresize style="height: 320px; width: 100%")

          //- NPS Trend Chart
          .glass-card.p-6.rounded-2xl
            .flex.items-center.justify-between.mb-4
              h3.text-lg.font-bold(style="color: var(--text-primary)")
                Icon(name="ph:chart-line-up-bold" size="20" class="mr-2" style="color: #3b82f6")
                | {{ $t('feedbackNps.npsTrend') }}
              el-select(v-model="npsTrendPeriod" size="small" style="width: 120px" @change="updateNpsTrend")
                el-option(:label="$t('feedbackNps.sixMonths')" value="6m")
                el-option(:label="$t('feedbackNps.twelveMonths')" value="12m")
            ClientOnly
              VChart(v-if="npsTrendOption" :option="npsTrendOption" autoresize style="height: 320px; width: 100%")

        //- Promoter / Passive / Detractor Breakdown
        .glass-card.p-6.rounded-2xl
          h3.text-lg.font-bold.mb-5(style="color: var(--text-primary)")
            Icon(name="ph:users-three-bold" size="20" class="mr-2" style="color: #7849ff")
            | {{ $t('feedbackNps.respondentBreakdown') }}
          .grid.gap-5.mb-6(class="grid-cols-1 sm:grid-cols-3")
            //- Promoters
            .breakdown-stat-card.promoter-bg
              .flex.items-center.gap-3
                .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
                  Icon(name="ph:smiley-bold" size="24" style="color: #22c55e")
                div
                  p.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('feedbackNps.promoters') }}
                  p.text-2xl.font-black(style="color: #22c55e") {{ promoterPct }}%
                  p.text-xs(style="color: var(--text-muted)") {{ promoterCount }} {{ $t('feedbackNps.respondents') }}

            //- Passives
            .breakdown-stat-card.passive-bg
              .flex.items-center.gap-3
                .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
                  Icon(name="ph:smiley-meh-bold" size="24" style="color: #f59e0b")
                div
                  p.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('feedbackNps.passives') }}
                  p.text-2xl.font-black(style="color: #f59e0b") {{ passivePct }}%
                  p.text-xs(style="color: var(--text-muted)") {{ passiveCount }} {{ $t('feedbackNps.respondents') }}

            //- Detractors
            .breakdown-stat-card.detractor-bg
              .flex.items-center.gap-3
                .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.15)")
                  Icon(name="ph:smiley-sad-bold" size="24" style="color: #ef4444")
                div
                  p.text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('feedbackNps.detractors') }}
                  p.text-2xl.font-black(style="color: #ef4444") {{ detractorPct }}%
                  p.text-xs(style="color: var(--text-muted)") {{ detractorCount }} {{ $t('feedbackNps.respondents') }}

          //- Stacked Bar
          .stacked-bar-container
            .stacked-bar
              .stacked-segment.promoter-seg(:style="{ width: promoterPct + '%' }")
                span.text-xs.font-bold.text-white(v-if="promoterPct > 10") {{ promoterPct }}%
              .stacked-segment.passive-seg(:style="{ width: passivePct + '%' }")
                span.text-xs.font-bold.text-white(v-if="passivePct > 10") {{ passivePct }}%
              .stacked-segment.detractor-seg(:style="{ width: detractorPct + '%' }")
                span.text-xs.font-bold.text-white(v-if="detractorPct > 10") {{ detractorPct }}%

      //- ═══════════════════════════════════════════════════
      //- TAB 2: Feedback Inbox
      //- ═══════════════════════════════════════════════════
      el-tab-pane(:label="$t('feedbackNps.feedbackInbox')" name="inbox")
        .glass-card.rounded-2xl.overflow-hidden
          .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--glass-border)")
            h3.text-sm.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:envelope-simple-bold" size="16" class="mr-2" style="color: #7849ff")
              | {{ $t('feedbackNps.allFeedback') }}
            .flex.items-center.gap-3
              el-input(
                v-model="feedbackSearch"
                :placeholder="$t('feedbackNps.searchFeedback')"
                clearable
                style="width: 240px"
                size="default"
              )
                template(#prefix)
                  Icon(name="ph:magnifying-glass" size="14" style="color: var(--text-muted)")
              el-select(v-model="sentimentFilter" clearable :placeholder="$t('feedbackNps.filterSentiment')" size="default" style="width: 160px")
                el-option(:label="$t('feedbackNps.allSentiments')" value="")
                el-option(:label="$t('feedbackNps.positive')" value="positive")
                el-option(:label="$t('feedbackNps.neutral')" value="neutral")
                el-option(:label="$t('feedbackNps.negative')" value="negative")
              el-tag(effect="dark" round size="small") {{ filteredFeedback.length }} {{ $t('feedbackNps.items') }}

          el-table(:data="paginatedFeedback" stripe style="width: 100%" :empty-text="$t('feedbackNps.noFeedback')")
            el-table-column(:label="$t('feedbackNps.customer')" min-width="180")
              template(#default="{ row }")
                .flex.items-center.gap-3
                  .avatar-circle(:style="{ background: getAvatarGradient(row.customerName) }")
                    | {{ getInitial(row.customerName) }}
                  div
                    p.font-semibold.text-sm(style="color: var(--text-primary)") {{ row.customerName }}
                    p.text-xs(style="color: var(--text-muted)") {{ row.company }}

            el-table-column(:label="$t('feedbackNps.feedback')" min-width="280")
              template(#default="{ row }")
                el-tooltip(:content="row.feedbackText" placement="top" :show-after="500")
                  p.text-sm.truncate-text(style="color: var(--text-secondary)") {{ row.feedbackText }}

            el-table-column(:label="$t('feedbackNps.sentiment')" width="130" align="center")
              template(#default="{ row }")
                el-tag(
                  :type="row.sentiment === 'positive' ? 'success' : row.sentiment === 'negative' ? 'danger' : 'warning'"
                  size="small"
                  round
                  effect="dark"
                ) {{ $t('feedbackNps.' + row.sentiment) }}

            el-table-column(:label="$t('feedbackNps.channel')" width="110" align="center")
              template(#default="{ row }")
                el-tooltip(:content="row.channel")
                  Icon(:name="getChannelIcon(row.channel)" size="20" :style="{ color: getChannelColor(row.channel) }")

            el-table-column(:label="$t('feedbackNps.npsScore')" width="100" align="center")
              template(#default="{ row }")
                span.text-sm.font-bold(:style="{ color: getNpsColor(row.npsScore) }") {{ row.npsScore !== null ? row.npsScore : '--' }}

            el-table-column(:label="$t('feedbackNps.date')" width="130")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                  span.text-sm(style="color: var(--text-secondary)") {{ formatDate(row.date) }}

            el-table-column(:label="$t('feedbackNps.status')" width="130" align="center")
              template(#default="{ row }")
                el-tag(
                  :type="row.status === 'actioned' ? 'success' : row.status === 'reviewed' ? 'warning' : 'info'"
                  size="small"
                  round
                  effect="dark"
                )
                  Icon(:name="getStatusIcon(row.status)" size="12" class="mr-1")
                  | {{ $t('feedbackNps.' + row.status) }}

          //- Pagination
          .p-4.flex.justify-center(style="border-top: 1px solid var(--glass-border)")
            el-pagination(
              v-model:current-page="feedbackPage"
              v-model:page-size="feedbackPageSize"
              :page-sizes="[10, 20, 50]"
              :total="filteredFeedback.length"
              layout="total, sizes, prev, pager, next"
              background
            )

      //- ═══════════════════════════════════════════════════
      //- TAB 3: CSAT Tracking
      //- ═══════════════════════════════════════════════════
      el-tab-pane(:label="$t('feedbackNps.csatTracking')" name="csat")
        .grid.gap-6.mb-6(class="grid-cols-1 lg:grid-cols-2")
          //- CSAT by Category
          .glass-card.p-6.rounded-2xl
            .flex.items-center.justify-between.mb-4
              h3.text-lg.font-bold(style="color: var(--text-primary)")
                Icon(name="ph:chart-bar-bold" size="20" class="mr-2" style="color: #f59e0b")
                | {{ $t('feedbackNps.csatByCategory') }}
            ClientOnly
              VChart(v-if="csatCategoryOption" :option="csatCategoryOption" autoresize style="height: 340px; width: 100%")

          //- CSAT Trend
          .glass-card.p-6.rounded-2xl
            .flex.items-center.justify-between.mb-4
              h3.text-lg.font-bold(style="color: var(--text-primary)")
                Icon(name="ph:chart-line-up-bold" size="20" class="mr-2" style="color: #06b6d4")
                | {{ $t('feedbackNps.csatTrend') }}
              el-select(v-model="csatTrendPeriod" size="small" style="width: 120px" @change="updateCsatTrend")
                el-option(:label="$t('feedbackNps.sixMonths')" value="6m")
                el-option(:label="$t('feedbackNps.twelveMonths')" value="12m")
            ClientOnly
              VChart(v-if="csatTrendOption" :option="csatTrendOption" autoresize style="height: 340px; width: 100%")

        //- Response Summary Cards
        .grid.gap-5(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
          .glass-card.p-5.rounded-2xl.text-center
            .w-10.h-10.rounded-xl.flex.items-center.justify-center.mx-auto.mb-3(style="background: rgba(120, 73, 255, 0.15)")
              Icon(name="ph:chat-circle-dots-bold" size="20" style="color: #7849ff")
            p.text-2xl.font-bold(style="color: #7849ff") {{ totalResponses }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('feedbackNps.totalResponses') }}

          .glass-card.p-5.rounded-2xl.text-center
            .w-10.h-10.rounded-xl.flex.items-center.justify-center.mx-auto.mb-3(style="background: rgba(34, 197, 94, 0.15)")
              Icon(name="ph:star-bold" size="20" style="color: #22c55e")
            p.text-2xl.font-bold(style="color: #22c55e") {{ avgCsatScore }}%
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('feedbackNps.avgScore') }}

          .glass-card.p-5.rounded-2xl.text-center
            .w-10.h-10.rounded-xl.flex.items-center.justify-center.mx-auto.mb-3(style="background: rgba(59, 130, 246, 0.15)")
              Icon(name="ph:trophy-bold" size="20" style="color: #3b82f6")
            p.text-2xl.font-bold(style="color: #3b82f6") {{ highestCategory }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('feedbackNps.highestCategory') }}

          .glass-card.p-5.rounded-2xl.text-center
            .w-10.h-10.rounded-xl.flex.items-center.justify-center.mx-auto.mb-3(style="background: rgba(239, 68, 68, 0.15)")
              Icon(name="ph:warning-bold" size="20" style="color: #ef4444")
            p.text-2xl.font-bold(style="color: #ef4444") {{ lowestCategory }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('feedbackNps.lowestCategory') }}

      //- ═══════════════════════════════════════════════════
      //- TAB 4: Action Items
      //- ═══════════════════════════════════════════════════
      el-tab-pane(:label="$t('feedbackNps.actionItems')" name="actions")
        .glass-card.rounded-2xl.overflow-hidden
          .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--glass-border)")
            h3.text-sm.font-bold(style="color: var(--text-primary)")
              Icon(name="ph:list-checks-bold" size="16" class="mr-2" style="color: #7849ff")
              | {{ $t('feedbackNps.allActionItems') }}
            .flex.items-center.gap-3
              el-select(v-model="actionStatusFilter" clearable :placeholder="$t('feedbackNps.filterStatus')" size="default" style="width: 160px")
                el-option(:label="$t('feedbackNps.allStatuses')" value="")
                el-option(:label="$t('feedbackNps.open')" value="open")
                el-option(:label="$t('feedbackNps.inProgress')" value="in-progress")
                el-option(:label="$t('feedbackNps.completed')" value="completed")
              el-button(type="primary" size="default" @click="showActionDialog = true" class="!bg-[#7849ff] !border-none !rounded-xl")
                Icon(name="ph:plus-bold" size="14")
                span.ml-1 {{ $t('feedbackNps.addActionItem') }}

          el-table(:data="filteredActions" stripe style="width: 100%" :empty-text="$t('feedbackNps.noActionItems')")
            el-table-column(:label="$t('feedbackNps.actionTitle')" min-width="200")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  Icon(name="ph:check-square-bold" size="16" style="color: #7849ff")
                  span.font-medium(style="color: var(--text-primary)") {{ row.title }}

            el-table-column(:label="$t('feedbackNps.linkedFeedback')" min-width="220")
              template(#default="{ row }")
                p.text-sm.truncate-text(style="color: var(--text-secondary)") {{ row.linkedFeedback }}

            el-table-column(:label="$t('feedbackNps.priority')" width="120" align="center")
              template(#default="{ row }")
                el-tag(
                  :type="row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'info'"
                  size="small"
                  round
                  effect="dark"
                ) {{ $t('feedbackNps.' + row.priority) }}

            el-table-column(:label="$t('feedbackNps.assignedTo')" width="160")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  .avatar-circle.small(:style="{ background: getAvatarGradient(row.assignedTo) }")
                    | {{ getInitial(row.assignedTo) }}
                  span.text-sm(style="color: var(--text-primary)") {{ row.assignedTo }}

            el-table-column(:label="$t('feedbackNps.dueDate')" width="130")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  Icon(name="ph:calendar" size="14" :style="{ color: isOverdue(row.dueDate) ? '#ef4444' : 'var(--text-muted)' }")
                  span.text-sm(:style="{ color: isOverdue(row.dueDate) ? '#ef4444' : 'var(--text-secondary)' }") {{ formatDate(row.dueDate) }}

            el-table-column(:label="$t('feedbackNps.status')" width="140" align="center")
              template(#default="{ row }")
                el-tag(
                  :type="row.status === 'completed' ? 'success' : row.status === 'in-progress' ? 'warning' : 'info'"
                  size="small"
                  round
                  effect="dark"
                )
                  Icon(:name="getActionStatusIcon(row.status)" size="12" class="mr-1")
                  | {{ $t('feedbackNps.' + row.status) }}

            el-table-column(:label="$t('feedbackNps.created')" width="130")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdDate) }}

    //- Add Action Item Dialog
    el-dialog(
      v-model="showActionDialog"
      :title="$t('feedbackNps.addActionItem')"
      width="560px"
      class="action-dialog"
    )
      .space-y-5
        div
          label.text-sm.font-semibold.mb-2.block(style="color: var(--text-primary)") {{ $t('feedbackNps.actionTitle') }}
          el-input(v-model="actionForm.title" :placeholder="$t('feedbackNps.actionTitlePlaceholder')")

        div
          label.text-sm.font-semibold.mb-2.block(style="color: var(--text-primary)") {{ $t('feedbackNps.linkedFeedback') }}
          el-select(v-model="actionForm.linkedFeedbackId" :placeholder="$t('feedbackNps.selectFeedback')" style="width: 100%" filterable)
            el-option(
              v-for="fb in feedbackItems"
              :key="fb.id"
              :label="fb.customerName + ': ' + fb.feedbackText.substring(0, 60) + '...'"
              :value="fb.id"
            )

        .grid.gap-4(class="grid-cols-2")
          div
            label.text-sm.font-semibold.mb-2.block(style="color: var(--text-primary)") {{ $t('feedbackNps.priority') }}
            el-radio-group(v-model="actionForm.priority")
              el-radio-button(value="high")
                Icon(name="ph:fire-bold" size="12" class="mr-1")
                | {{ $t('feedbackNps.high') }}
              el-radio-button(value="medium")
                Icon(name="ph:warning-bold" size="12" class="mr-1")
                | {{ $t('feedbackNps.medium') }}
              el-radio-button(value="low")
                Icon(name="ph:minus-bold" size="12" class="mr-1")
                | {{ $t('feedbackNps.low') }}

          div
            label.text-sm.font-semibold.mb-2.block(style="color: var(--text-primary)") {{ $t('feedbackNps.assignedTo') }}
            el-select(v-model="actionForm.assignedTo" :placeholder="$t('feedbackNps.selectAssignee')" style="width: 100%")
              el-option(v-for="member in teamMembers" :key="member" :label="member" :value="member")

        div
          label.text-sm.font-semibold.mb-2.block(style="color: var(--text-primary)") {{ $t('feedbackNps.dueDate') }}
          el-date-picker(v-model="actionForm.dueDate" type="date" :placeholder="$t('feedbackNps.selectDueDate')" style="width: 100%")

        div
          label.text-sm.font-semibold.mb-2.block(style="color: var(--text-primary)") {{ $t('feedbackNps.description') }}
          el-input(v-model="actionForm.description" type="textarea" :rows="3" :placeholder="$t('feedbackNps.descriptionPlaceholder')")

      template(#footer)
        .flex.justify-end.gap-3
          el-button(@click="showActionDialog = false") {{ $t('feedbackNps.cancel') }}
          el-button(type="primary" @click="createActionItem" class="!bg-[#7849ff] !border-none")
            Icon(name="ph:plus-bold" size="14" class="mr-1")
            | {{ $t('feedbackNps.create') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import VChart from 'vue-echarts';
import { graphic } from 'echarts/core';
import logger from '~/utils/logger'

definePageMeta({ title: 'Feedback & NPS Hub' });

const { t, locale } = useI18n();

// ── Interfaces ────────────────────────────────────────
interface FeedbackItem {
  id: string;
  customerName: string;
  company: string;
  feedbackText: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  channel: 'email' | 'survey' | 'chat' | 'social';
  npsScore: number | null;
  date: string;
  status: 'new' | 'reviewed' | 'actioned';
}

interface ActionItem {
  id: string;
  title: string;
  linkedFeedback: string;
  linkedFeedbackId: string;
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  dueDate: string;
  status: 'open' | 'in-progress' | 'completed';
  createdDate: string;
  description: string;
}

interface CsatCategory {
  name: string;
  score: number;
  responses: number;
}

interface NpsTrendPoint {
  month: string;
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
}

// ── State ─────────────────────────────────────────────
const loading = ref(false);
const activeTab = ref('nps');
const dateRange = ref<[Date, Date] | null>(null);

// NPS State
const npsTrendPeriod = ref('12m');
const npsResponses = ref<{ score: number; customerId: string }[]>([]);

// CSAT State
const csatTrendPeriod = ref('12m');
const csatCategories = ref<CsatCategory[]>([]);
const csatTrendData = ref<{ month: string; score: number }[]>([]);

// Feedback Inbox State
const feedbackSearch = ref('');
const sentimentFilter = ref('');
const feedbackPage = ref(1);
const feedbackPageSize = ref(10);
const feedbackItems = ref<FeedbackItem[]>([]);

// Action Items State
const actionStatusFilter = ref('');
const showActionDialog = ref(false);
const actionItems = ref<ActionItem[]>([]);

// NPS Trend Data
const npsTrendData = ref<NpsTrendPoint[]>([]);

// Action Form
const actionForm = ref({
  title: '',
  linkedFeedbackId: '',
  priority: 'medium' as 'high' | 'medium' | 'low',
  assignedTo: '',
  dueDate: null as Date | null,
  description: ''
});

const teamMembers = ref<string[]>([]);

// ── Computed: KPI Cards ──────────────────────────────
const npsScore = computed(() => {
  if (!npsResponses.value.length) return 0;
  const total = npsResponses.value.length;
  const promoters = npsResponses.value.filter(r => r.score >= 9).length;
  const detractors = npsResponses.value.filter(r => r.score <= 6).length;
  return Math.round(((promoters - detractors) / total) * 100);
});

const csatScore = computed(() => {
  if (!csatCategories.value.length) return 0;
  const totalScore = csatCategories.value.reduce((s, c) => s + c.score * c.responses, 0);
  const totalResponses = csatCategories.value.reduce((s, c) => s + c.responses, 0);
  return totalResponses > 0 ? Math.round(totalScore / totalResponses) : 0;
});

const responseRate = computed(() => {
  // Will be calculated from real survey data when available
  return 0;
});

const openActionCount = computed(() => {
  return actionItems.value.filter(a => a.status !== 'completed').length;
});

// ── Computed: NPS Breakdown ─────────────────────────
const promoterCount = computed(() => npsResponses.value.filter(r => r.score >= 9).length);
const passiveCount = computed(() => npsResponses.value.filter(r => r.score >= 7 && r.score <= 8).length);
const detractorCount = computed(() => npsResponses.value.filter(r => r.score <= 6).length);
const totalNpsResponses = computed(() => npsResponses.value.length || 1);

const promoterPct = computed(() => Math.round((promoterCount.value / totalNpsResponses.value) * 100));
const passivePct = computed(() => Math.round((passiveCount.value / totalNpsResponses.value) * 100));
const detractorPct = computed(() => {
  const remaining = 100 - promoterPct.value - passivePct.value;
  return Math.max(0, remaining);
});

// ── Computed: CSAT Summary ──────────────────────────
const totalResponses = computed(() => csatCategories.value.reduce((s, c) => s + c.responses, 0));
const avgCsatScore = computed(() => csatScore.value);
const highestCategory = computed(() => {
  if (!csatCategories.value.length) return '--';
  return csatCategories.value.reduce((a, b) => (a.score > b.score ? a : b)).name;
});
const lowestCategory = computed(() => {
  if (!csatCategories.value.length) return '--';
  return csatCategories.value.reduce((a, b) => (a.score < b.score ? a : b)).name;
});

// ── Computed: Filtered Feedback ────────────────────
const filteredFeedback = computed(() => {
  let result = [...feedbackItems.value];
  if (feedbackSearch.value) {
    const q = feedbackSearch.value.toLowerCase();
    result = result.filter(
      fb => fb.customerName.toLowerCase().includes(q) || fb.feedbackText.toLowerCase().includes(q) || fb.company.toLowerCase().includes(q)
    );
  }
  if (sentimentFilter.value) {
    result = result.filter(fb => fb.sentiment === sentimentFilter.value);
  }
  return result;
});

const paginatedFeedback = computed(() => {
  const start = (feedbackPage.value - 1) * feedbackPageSize.value;
  return filteredFeedback.value.slice(start, start + feedbackPageSize.value);
});

// ── Computed: Filtered Actions ─────────────────────
const filteredActions = computed(() => {
  let result = [...actionItems.value];
  if (actionStatusFilter.value) {
    result = result.filter(a => a.status === actionStatusFilter.value);
  }
  return result;
});

// ── Chart Options ─────────────────────────────────
const chartTooltip = {
  backgroundColor: 'rgba(30, 30, 45, 0.9)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  textStyle: { color: '#fff' },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

const npsGaugeOption = computed(() => {
  const score = npsScore.value;
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: -100,
        max: 100,
        splitNumber: 10,
        itemStyle: {
          color: score >= 50 ? '#22c55e' : score >= 0 ? '#f59e0b' : '#ef4444'
        },
        progress: {
          show: true,
          roundCap: true,
          width: 18
        },
        pointer: {
          icon: 'path://M2090.36389,615.30999 L2## ... ',
          length: '65%',
          width: 8,
          offsetCenter: [0, '-10%'],
          itemStyle: {
            color: score >= 50 ? '#22c55e' : score >= 0 ? '#f59e0b' : '#ef4444'
          }
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 18,
            color: [
              [0.5, '#ef4444'],
              [0.75, '#f59e0b'],
              [1, '#22c55e']
            ]
          }
        },
        axisTick: {
          splitNumber: 2,
          lineStyle: {
            width: 2,
            color: '#999'
          }
        },
        splitLine: {
          length: 12,
          lineStyle: {
            width: 3,
            color: '#999'
          }
        },
        axisLabel: {
          distance: 25,
          color: '#999',
          fontSize: 11,
          formatter: (value: number) => {
            if (value === -100 || value === 0 || value === 100) return String(value);
            return '';
          }
        },
        title: {
          show: true,
          offsetCenter: [0, '60%'],
          fontSize: 14,
          color: '#999'
        },
        detail: {
          valueAnimation: true,
          fontSize: 44,
          fontWeight: 'bolder',
          offsetCenter: [0, '20%'],
          formatter: '{value}',
          color: score >= 50 ? '#22c55e' : score >= 0 ? '#f59e0b' : '#ef4444'
        },
        data: [{ value: score, name: t('feedbackNps.npsScore') }]
      }
    ],
    tooltip: chartTooltip
  };
});

const npsTrendOption = computed(() => {
  const data = npsTrendData.value;
  const months = data.map(d => d.month);
  const scores = data.map(d => d.score);

  return {
    tooltip: {
      ...chartTooltip,
      trigger: 'axis'
    },
    grid: {
      top: 30,
      right: 20,
      bottom: 30,
      left: 50
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#444' } },
      axisLabel: { color: '#999', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: -100,
      max: 100,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: { color: '#999', fontSize: 11 }
    },
    series: [
      {
        name: t('feedbackNps.npsScore'),
        type: 'line',
        data: scores,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#7849ff' },
        itemStyle: { color: '#7849ff', borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(120, 73, 255, 0.35)' },
            { offset: 1, color: 'rgba(120, 73, 255, 0.02)' }
          ])
        },
        markLine: {
          silent: true,
          data: [
            {
              yAxis: 0,
              lineStyle: { color: '#f59e0b', type: 'dashed', width: 1 },
              label: { show: true, formatter: 'Neutral', color: '#f59e0b', fontSize: 10 }
            },
            {
              yAxis: 50,
              lineStyle: { color: '#22c55e', type: 'dashed', width: 1 },
              label: { show: true, formatter: 'Great', color: '#22c55e', fontSize: 10 }
            }
          ]
        }
      }
    ]
  };
});

const csatCategoryOption = computed(() => {
  const cats = csatCategories.value;
  const names = cats.map(c => c.name);
  const scores = cats.map(c => c.score);

  const barColors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#06b6d4'];

  return {
    tooltip: {
      ...chartTooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      top: 20,
      right: 30,
      bottom: 30,
      left: 100
    },
    xAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: { color: '#999', fontSize: 11, formatter: '{value}%' }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: '#444' } },
      axisLabel: { color: '#999', fontSize: 12, fontWeight: 'bold' }
    },
    series: [
      {
        type: 'bar',
        data: scores.map((val, i) => ({
          value: val,
          itemStyle: {
            color: new graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: barColors[i % barColors.length] ?? '#7849ff' },
              { offset: 1, color: (barColors[i % barColors.length] ?? '#7849ff') + '99' }
            ]),
            borderRadius: [0, 8, 8, 0]
          }
        })),
        barWidth: 24,
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold'
        }
      }
    ]
  };
});

const csatTrendOption = computed(() => {
  const data = csatTrendData.value;
  const months = data.map(d => d.month);
  const scores = data.map(d => d.score);

  return {
    tooltip: {
      ...chartTooltip,
      trigger: 'axis'
    },
    grid: {
      top: 30,
      right: 20,
      bottom: 30,
      left: 50
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#444' } },
      axisLabel: { color: '#999', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: { color: '#999', fontSize: 11, formatter: '{value}%' }
    },
    series: [
      {
        name: t('feedbackNps.csatScore'),
        type: 'line',
        data: scores,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#06b6d4' },
        itemStyle: { color: '#06b6d4', borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(6, 182, 212, 0.35)' },
            { offset: 1, color: 'rgba(6, 182, 212, 0.02)' }
          ])
        }
      }
    ]
  };
});

// ── Helper Functions ──────────────────────────────
function getNpsColor(score: number | null): string {
  if (score === null) return '#999';
  if (score >= 50) return '#22c55e';
  if (score >= 0) return '#f59e0b';
  return '#ef4444';
}

function getChannelIcon(channel: string): string {
  const icons: Record<string, string> = {
    email: 'ph:envelope-bold',
    survey: 'ph:clipboard-text-bold',
    chat: 'ph:chat-circle-bold',
    social: 'ph:share-network-bold'
  };
  return icons[channel] || 'ph:question-bold';
}

function getChannelColor(channel: string): string {
  const colors: Record<string, string> = {
    email: '#3b82f6',
    survey: '#7849ff',
    chat: '#22c55e',
    social: '#06b6d4'
  };
  return colors[channel] || '#999';
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    new: 'ph:circle-bold',
    reviewed: 'ph:eye-bold',
    actioned: 'ph:check-circle-bold'
  };
  return icons[status] || 'ph:circle-bold';
}

function getActionStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    open: 'ph:circle-bold',
    'in-progress': 'ph:spinner-bold',
    completed: 'ph:check-circle-bold'
  };
  return icons[status] || 'ph:circle-bold';
}

function getAvatarGradient(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #7849ff, #a855f7)',
    'linear-gradient(135deg, #3b82f6, #60a5fa)',
    'linear-gradient(135deg, #22c55e, #4ade80)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ef4444, #f87171)',
    'linear-gradient(135deg, #06b6d4, #22d3ee)'
  ];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return gradients[idx % gradients.length] ?? 'linear-gradient(135deg, #7849ff, #a855f7)';
}

function getInitial(name: string): string {
  return name ? name.charAt(0).toUpperCase() : '?';
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString(locale.value, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(date: string): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

// ── Chart Update Functions ────────────────────────
function updateNpsTrend() {
  generateNpsTrendData();
}

function updateCsatTrend() {
  generateCsatTrendData();
}

// ── Data Generation ───────────────────────────────
function generateNpsResponses() {
  // No fake data - will be populated from real API data when available
  npsResponses.value = [];
}

function generateNpsTrendData() {
  // No fake data - will be populated from real API data when available
  npsTrendData.value = [];
}

function generateCsatCategories() {
  // No fake data - will be populated from real API data when available
  csatCategories.value = [];
}

function generateCsatTrendData() {
  // No fake data - will be populated from real API data when available
  csatTrendData.value = [];
}

function generateFeedbackItems(_leads: Record<string, unknown>[], _deals: Record<string, unknown>[]) {
  // No fake data - will be populated from real API data when available
  feedbackItems.value = [];
}

function generateActionItems() {
  // No fake data - will be populated from real API data when available
  actionItems.value = [];
}

// ── Actions ───────────────────────────────────────
function createActionItem() {
  if (!actionForm.value.title) {
    ElNotification({ type: 'warning', title: t('feedbackNps.validationError'), message: t('feedbackNps.titleRequired') });
    return;
  }

  const linkedFb = feedbackItems.value.find(fb => fb.id === actionForm.value.linkedFeedbackId);

  const newAction: ActionItem = {
    id: 'act-' + Date.now(),
    title: actionForm.value.title,
    linkedFeedback: linkedFb ? linkedFb.feedbackText : '',
    linkedFeedbackId: actionForm.value.linkedFeedbackId,
    priority: actionForm.value.priority,
    assignedTo: actionForm.value.assignedTo || teamMembers.value[0] || '',
    dueDate: actionForm.value.dueDate ? new Date(actionForm.value.dueDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'open',
    createdDate: new Date().toISOString(),
    description: actionForm.value.description
  };

  actionItems.value.unshift(newAction);
  showActionDialog.value = false;
  resetActionForm();

  ElNotification({
    type: 'success',
    title: t('feedbackNps.actionCreated'),
    message: t('feedbackNps.actionCreatedMessage')
  });
}

function resetActionForm() {
  actionForm.value = {
    title: '',
    linkedFeedbackId: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: null,
    description: ''
  };
}

// ── Data Loading ─────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    const [leadsRes, dealsRes] = await Promise.all([useApiFetch('lead'), useApiFetch('deal')]);

    const leads = leadsRes.success && Array.isArray(leadsRes.body) ? leadsRes.body : [];
    const deals = dealsRes.success && Array.isArray(dealsRes.body) ? dealsRes.body : [];

    // Generate derived data
    generateNpsResponses();
    generateNpsTrendData();
    generateCsatCategories();
    generateCsatTrendData();
    generateFeedbackItems(leads, deals);
    generateActionItems();
  } catch (e) {
    logger.error('Failed to load feedback data:', e);
  } finally {
    loading.value = false;
  }
}

function refreshData() {
  loadData();
}

function onDateRangeChange() {
  loadData();
}

// ── Load on mount ──────────────────────────────
await loadData().catch(() => {
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.feedback-nps-page {
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

.nps-card {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(22, 163, 74, 0.06));
  border: 1px solid rgba(34, 197, 94, 0.2);
  &:hover {
    box-shadow: 0 8px 32px rgba(34, 197, 94, 0.15);
  }
}

.csat-card {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.06));
  border: 1px solid rgba(245, 158, 11, 0.2);
  &:hover {
    box-shadow: 0 8px 32px rgba(245, 158, 11, 0.15);
  }
}

.response-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.06));
  border: 1px solid rgba(59, 130, 246, 0.2);
  &:hover {
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
  }
}

.action-card {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(220, 38, 38, 0.06));
  border: 1px solid rgba(239, 68, 68, 0.2);
  &:hover {
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.15);
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

.nps-icon {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}
.csat-icon {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}
.response-icon {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}
.action-icon {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* ── Glass Card ── */
.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
}

/* ── Tabs ── */
.feedback-tabs {
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

/* ── Breakdown Stat Cards ── */
.breakdown-stat-card {
  padding: 20px;
  border-radius: 14px;
  border: 1px solid var(--border-default);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
}

.promoter-bg {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.06), rgba(34, 197, 94, 0.02));
}

.passive-bg {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(245, 158, 11, 0.02));
}

.detractor-bg {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(239, 68, 68, 0.02));
}

/* ── Stacked Bar ── */
.stacked-bar-container {
  margin-top: 8px;
}

.stacked-bar {
  display: flex;
  height: 32px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--border-default);
}

.stacked-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
}

.promoter-seg {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}
.passive-seg {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.detractor-seg {
  background: linear-gradient(135deg, #ef4444, #dc2626);
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

/* ── Truncated Text ── */
.truncate-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
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

/* ── Dialog ── */
:deep(.action-dialog .el-dialog) {
  border-radius: 16px;
}

:deep(.action-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--border-default);
  padding-bottom: 16px;
}

:deep(.action-dialog .el-dialog__footer) {
  border-top: 1px solid var(--border-default);
  padding-top: 16px;
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

  .feedback-nps-page {
    padding: 16px !important;
  }

  .truncate-text {
    max-width: 180px;
  }
}
</style>
