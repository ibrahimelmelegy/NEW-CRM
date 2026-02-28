<template lang="pug">
.team-performance-page.p-6(class="md:p-8")
  //- ╔══════════════════════════════════════════════════════════╗
  //- ║  Page Header                                             ║
  //- ╚══════════════════════════════════════════════════════════╝
  .header.mb-8
    .flex.items-center.justify-between.flex-wrap.gap-4
      .flex.items-center.gap-4
        .header-icon-wrapper
          Icon(name="ph:users-four-bold" size="28" style="color: #fff")
        div
          h2.text-3xl.font-bold(style="color: var(--text-primary)") {{ t('teamPerformance.title') }}
          p.mt-1(style="color: var(--text-muted)") {{ t('teamPerformance.subtitle') }}
      .flex.items-center.gap-3.flex-wrap
        el-date-picker(
          v-model="dateRange"
          type="daterange"
          range-separator="to"
          :start-placeholder="t('teamPerformance.dateRange')"
          :end-placeholder="t('teamPerformance.dateRange')"
          style="width: 280px"
        )
        el-button(type="primary" @click="refreshData" :loading="refreshing" class="!bg-[#7849ff] !border-none")
          Icon(name="ph:arrow-clockwise-bold" size="16")
          span.ml-2 {{ t('teamPerformance.refresh') }}

  //- ╔══════════════════════════════════════════════════════════╗
  //- ║  Loading State                                           ║
  //- ╚══════════════════════════════════════════════════════════╝
  .flex.items-center.justify-center.py-20(v-if="loading")
    .space-y-6.w-full
      .grid.gap-5(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
        el-skeleton(v-for="n in 4" :key="n" animated)
          template(#template)
            .kpi-card
              .flex.items-start.justify-between
                div
                  el-skeleton-item(variant="text" style="width: 100px; height: 14px")
                  el-skeleton-item.mt-2(variant="h1" style="width: 80px; height: 28px")
                  el-skeleton-item.mt-2(variant="text" style="width: 60px; height: 12px")
                el-skeleton-item(variant="rect" style="width: 48px; height: 48px; border-radius: 12px")
      .grid.gap-5(class="grid-cols-1 md:grid-cols-3")
        el-skeleton(v-for="n in 3" :key="n" animated)
          template(#template)
            .glass-card.p-6
              el-skeleton-item(variant="text" style="width: 140px; height: 16px")
              el-skeleton-item.mt-4(variant="rect" style="width: 100%; height: 200px; border-radius: 8px")

  //- ╔══════════════════════════════════════════════════════════╗
  //- ║  Main Content                                            ║
  //- ╚══════════════════════════════════════════════════════════╝
  template(v-else)
    //- KPI Cards
    .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
      .kpi-card(v-for="(kpi, idx) in kpiCards" :key="idx")
        .flex.items-start.justify-between
          div
            p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
            p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}
            .flex.items-center.gap-1.mt-2
              Icon(
                :name="kpi.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'"
                size="14"
                :style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }"
              )
              span.text-xs.font-semibold(:style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ formatTrend(kpi.trend) }}
          .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
            Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

    //- ╔══════════════════════════════════════════════════════════╗
    //- ║  Tabs                                                    ║
    //- ╚══════════════════════════════════════════════════════════╝
    el-tabs(v-model="activeTab" class="performance-tabs")

      //- ────────────────────────────────────────────────────────
      //- Tab 1: Overview
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('teamPerformance.overview')" name="overview")
        //- Top Performer Banner
        .top-performer-banner
          .flex.items-center.gap-6.flex-wrap
            .flex.items-center.gap-4
              .w-16.h-16.rounded-full.flex.items-center.justify-center.text-xl.font-bold(
                style="background: linear-gradient(135deg, #7849ff, #3b82f6); color: #fff"
              ) {{ topPerformer.initials }}
              div
                .flex.items-center.gap-2.mb-1
                  h3.text-lg.font-bold(style="color: var(--text-primary)") {{ topPerformer.name }}
                  el-tag(type="warning" effect="dark" size="small" round)
                    Icon.mr-1(name="ph:trophy-bold" size="12")
                    | {{ t('teamPerformance.topPerformerWeek') }}
                p.text-sm(style="color: var(--text-muted)") {{ topPerformer.role }}
            .flex.gap-6.ml-auto
              .text-center
                p.text-xl.font-bold(style="color: #7849ff") {{ topPerformer.tasksCompleted }}
                p.text-xs(style="color: var(--text-muted)") {{ t('teamPerformance.tasksCompleted') }}
              .text-center
                p.text-xl.font-bold(style="color: #22c55e") {{ topPerformer.dealsClosed }}
                p.text-xs(style="color: var(--text-muted)") {{ t('teamPerformance.dealsClosed') }}
              .text-center
                p.text-xl.font-bold(style="color: #f59e0b") {{ topPerformer.revenue }}
                p.text-xs(style="color: var(--text-muted)") {{ t('teamPerformance.revenueGenerated') }}

        //- Team Scorecard Grid
        .grid.gap-5(class="grid-cols-1 md:grid-cols-2 xl:grid-cols-3")
          .member-card(v-for="(member, idx) in teamMembers" :key="idx")
            .flex.items-center.gap-3.mb-4
              .w-12.h-12.rounded-full.flex.items-center.justify-center.font-bold(
                :style="{ background: member.avatarColor + '20', color: member.avatarColor }"
              ) {{ member.initials }}
              div
                p.font-semibold(style="color: var(--text-primary)") {{ member.name }}
                p.text-xs(style="color: var(--text-muted)") {{ member.role }}
            .grid.grid-cols-3.gap-3.mb-4
              .text-center.p-2.rounded-lg(style="background: var(--bg-input)")
                p.text-sm.font-bold(style="color: #7849ff") {{ member.tasksCompleted }}
                p.text-xs(style="color: var(--text-muted)") {{ t('teamPerformance.tasksCompleted') }}
              .text-center.p-2.rounded-lg(style="background: var(--bg-input)")
                p.text-sm.font-bold(style="color: #22c55e") {{ member.dealsClosed }}
                p.text-xs(style="color: var(--text-muted)") {{ t('teamPerformance.dealsClosed') }}
              .text-center.p-2.rounded-lg(style="background: var(--bg-input)")
                p.text-sm.font-bold(style="color: #f59e0b") {{ member.revenue }}
                p.text-xs(style="color: var(--text-muted)") {{ t('teamPerformance.revenueGenerated') }}
            .flex.items-center.justify-between
              .flex.items-center.gap-3
                el-progress(
                  type="circle"
                  :percentage="member.activityScore"
                  :width="48"
                  :stroke-width="4"
                  :color="getScoreColor(member.activityScore)"
                )
                .text-xs(style="color: var(--text-muted)") {{ t('teamPerformance.activityScore') }}
              el-tag(
                :type="getPerformanceTagType(member.performanceLevel)"
                size="small"
                effect="plain"
                round
              ) {{ getPerformanceLabel(member.performanceLevel) }}

      //- ────────────────────────────────────────────────────────
      //- Tab 2: Goals & Targets
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('teamPerformance.goalsTargets')" name="goals")
        //- View Toggle
        .flex.items-center.gap-3.mb-6
          el-radio-group(v-model="goalView" size="default")
            el-radio-button(value="department") {{ t('teamPerformance.department') }}
            el-radio-button(value="individual") {{ t('teamPerformance.individual') }}

        //- Goal Cards Grid
        .grid.gap-5.mb-8(class="grid-cols-1 md:grid-cols-2")
          .glass-card.p-5(v-for="(goal, idx) in filteredGoals" :key="idx")
            .flex.items-start.justify-between.mb-3
              div
                h4.font-semibold(style="color: var(--text-primary)") {{ goal.name }}
                p.text-xs.mt-1(style="color: var(--text-muted)") {{ formatGoalOwner(goal.owner) }}
              el-tag(
                :color="getGoalStatusColor(goal.status)"
                size="small"
                effect="dark"
                round
              ) {{ getGoalStatusLabel(goal.status) }}
            .flex.items-center.justify-between.mb-2
              span.text-sm(style="color: var(--text-muted)") {{ formatGoalProgress(goal.current, goal.target) }}
              span.text-sm.font-bold(:style="{ color: getGoalStatusColor(goal.status) }") {{ goal.percentage }}%
            el-progress(
              :percentage="Math.min(goal.percentage, 100)"
              :stroke-width="8"
              :color="getGoalStatusColor(goal.status)"
              :show-text="false"
            )
            .flex.items-center.justify-between.mt-3
              .flex.items-center.gap-1
                Icon(name="ph:calendar-bold" size="14" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ goal.dueDate }}
              span.text-xs.font-medium(style="color: var(--text-muted)") {{ formatGoalValues(goal.current, goal.target) }}

        //- Goal Completion Trend Chart
        .glass-card.p-6
          .flex.items-center.justify-between.mb-6
            h3.font-semibold(style="color: var(--text-primary)")
              Icon.mr-2(name="ph:chart-bar-bold" size="20" style="color: #7849ff")
              | {{ t('teamPerformance.goalCompletionTrend') }}
          ClientOnly
            VChart.w-full(:option="goalCompletionChartOption" :style="{ height: '360px' }" autoresize)

      //- ────────────────────────────────────────────────────────
      //- Tab 3: Activity Feed
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('teamPerformance.activityFeed')" name="activity")
        .grid.gap-6.mb-8(class="grid-cols-1 lg:grid-cols-5")
          //- Activity Timeline (60%)
          .glass-card.p-6(class="lg:col-span-3")
            h3.font-semibold.mb-4(style="color: var(--text-primary)")
              Icon.mr-2(name="ph:clock-countdown-bold" size="20" style="color: #7849ff")
              | {{ t('teamPerformance.activityFeed') }}
            .activity-list(style="max-height: 600px; overflow-y: auto")
              .activity-item(v-for="(activity, idx) in recentActivities" :key="idx")
                .flex.items-start.gap-3
                  .w-8.h-8.rounded-full.flex.items-center.justify-center.flex-shrink-0(
                    :style="{ background: activity.color + '18' }"
                  )
                    Icon(:name="activity.icon" size="16" :style="{ color: activity.color }")
                  .flex-1
                    p.text-sm(style="color: var(--text-primary)")
                      span.font-semibold {{ activity.memberName }}
                      | &nbsp;
                      span {{ activity.action }}
                    p.text-xs.mt-1(style="color: var(--text-muted)") {{ activity.timestamp }}

          //- Activity Heatmap (40%)
          .glass-card.p-6(class="lg:col-span-2")
            h3.font-semibold.mb-4(style="color: var(--text-primary)")
              Icon.mr-2(name="ph:squares-four-bold" size="20" style="color: #f59e0b")
              | {{ t('teamPerformance.activityHeatmap') }}
            ClientOnly
              VChart.w-full(:option="activityHeatmapOption" :style="{ height: '360px' }" autoresize)

        //- Leaderboard Table
        .glass-card.p-6
          h3.font-semibold.mb-4(style="color: var(--text-primary)")
            Icon.mr-2(name="ph:ranking-bold" size="20" style="color: #7849ff")
            | {{ t('teamPerformance.leaderboard') }}
          el-table(:data="leaderboardData" stripe style="width: 100%" :default-sort="{ prop: 'totalScore', order: 'descending' }")
            el-table-column(:label="t('teamPerformance.rank')" width="70" align="center")
              template(#default="scope")
                span.font-bold(:style="{ color: scope.$index === 0 ? '#f59e0b' : scope.$index === 1 ? '#94a3b8' : scope.$index === 2 ? '#cd7f32' : 'var(--text-primary)' }") {{ scope.$index + 1 }}
            el-table-column(:label="t('teamPerformance.member')" min-width="160")
              template(#default="scope")
                .flex.items-center.gap-2
                  .w-8.h-8.rounded-full.flex.items-center.justify-center.text-xs.font-bold(
                    :style="{ background: scope.row.avatarColor + '20', color: scope.row.avatarColor }"
                  ) {{ scope.row.initials }}
                  span.font-medium {{ scope.row.name }}
            el-table-column(:label="t('teamPerformance.callsMade')" prop="calls" sortable width="120" align="center")
            el-table-column(:label="t('teamPerformance.emailsSent')" prop="emails" sortable width="120" align="center")
            el-table-column(:label="t('teamPerformance.meetingsHeld')" prop="meetings" sortable width="130" align="center")
            el-table-column(:label="t('teamPerformance.dealsClosed')" prop="deals" sortable width="120" align="center")
            el-table-column(:label="t('teamPerformance.totalScore')" prop="totalScore" sortable width="120" align="center")
              template(#default="scope")
                span.font-bold(style="color: #7849ff") {{ scope.row.totalScore }}

      //- ────────────────────────────────────────────────────────
      //- Tab 4: Capacity
      //- ────────────────────────────────────────────────────────
      el-tab-pane(:label="t('teamPerformance.capacity')" name="capacity")
        //- Capacity Planning Summary Cards
        .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
          .glass-card.p-5
            .flex.items-center.gap-3.mb-2
              .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: #22c55e18")
                Icon(name="ph:battery-charging-bold" size="20" style="color: #22c55e")
              span.text-sm.font-medium(style="color: var(--text-muted)") {{ t('teamPerformance.availableCapacity') }}
            p.text-2xl.font-bold(style="color: #22c55e") 156h
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ t('teamPerformance.hoursAllocated') }}
          .glass-card.p-5
            .flex.items-center.gap-3.mb-2
              .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: #ef444418")
                Icon(name="ph:warning-bold" size="20" style="color: #ef4444")
              span.text-sm.font-medium(style="color: var(--text-muted)") {{ t('teamPerformance.overbooked') }}
            p.text-2xl.font-bold(style="color: #ef4444") 3
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ t('teamPerformance.teamMembers') }}
          .glass-card.p-5
            .flex.items-center.gap-3.mb-2
              .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: #f59e0b18")
                Icon(name="ph:airplane-takeoff-bold" size="20" style="color: #f59e0b")
              span.text-sm.font-medium(style="color: var(--text-muted)") {{ t('teamPerformance.onLeave') }}
            p.text-2xl.font-bold(style="color: #f59e0b") 2
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ t('teamPerformance.teamMembers') }}
          .glass-card.p-5
            .flex.items-center.gap-3.mb-2
              .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: #3b82f618")
                Icon(name="ph:lightbulb-bold" size="20" style="color: #3b82f6")
              span.text-sm.font-medium(style="color: var(--text-muted)") {{ t('teamPerformance.recommendations') }}
            p.text-2xl.font-bold(style="color: #3b82f6") 5
            p.text-xs.mt-1(style="color: var(--text-muted)") Action items

        //- Workload Distribution Chart
        .glass-card.p-6.mb-8
          .flex.items-center.justify-between.mb-6
            h3.font-semibold(style="color: var(--text-primary)")
              Icon.mr-2(name="ph:chart-bar-horizontal-bold" size="20" style="color: #7849ff")
              | {{ t('teamPerformance.workloadDistribution') }}
            .flex.items-center.gap-4
              .flex.items-center.gap-1
                .w-3.h-3.rounded-full(style="background: #ef4444")
                span.text-xs(style="color: var(--text-muted)") {{ t('teamPerformance.overloaded') }}
              .flex.items-center.gap-1
                .w-3.h-3.rounded-full(style="background: #22c55e")
                span.text-xs(style="color: var(--text-muted)") {{ t('teamPerformance.optimal') }}
              .flex.items-center.gap-1
                .w-3.h-3.rounded-full(style="background: #f59e0b")
                span.text-xs(style="color: var(--text-muted)") {{ t('teamPerformance.underloaded') }}
          ClientOnly
            VChart.w-full(:option="workloadChartOption" :style="{ height: '420px' }" autoresize)

        //- Utilization Gauges
        h3.font-semibold.mb-4(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:gauge-bold" size="20" style="color: #7849ff")
          | {{ t('teamPerformance.utilization') }}
        .grid.gap-5(class="grid-cols-2 md:grid-cols-3 xl:grid-cols-5")
          .glass-card.p-4.text-center(v-for="(member, idx) in capacityMembers" :key="idx")
            el-progress(
              type="circle"
              :percentage="member.utilization"
              :width="80"
              :stroke-width="6"
              :color="getUtilizationColor(member.utilization)"
            )
            p.text-sm.font-semibold.mt-3(style="color: var(--text-primary)") {{ member.name }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ member.role }}
            el-tag.mt-2(
              :color="getUtilizationTagColor(member.utilization)"
              size="small"
              effect="dark"
              round
            ) {{ getUtilizationLabel(member.utilization) }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { graphic } from 'echarts';
import VChart from 'vue-echarts';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Team Performance' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const loading = ref(true);
const refreshing = ref(false);
const activeTab = ref('overview');
const dateRange = ref<[Date, Date] | null>(null);
const goalView = ref('department');

// ─── Tooltip Style ──────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.92)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 12 },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

// ─── Helpers ────────────────────────────────────────────────
function formatTrend(trend: number): string {
  return `${trend >= 0 ? '+' : ''}${trend}%`;
}

function formatGoalOwner(owner: string): string {
  return `${t('teamPerformance.owner')}: ${owner}`;
}

function formatGoalProgress(current: number, target: number): string {
  return `${current} / ${target}`;
}

function formatGoalValues(current: number, target: number): string {
  return `${t('teamPerformance.current')}: ${current} | ${t('teamPerformance.target')}: ${target}`;
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#3b82f6';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function getPerformanceTagType(level: string): string {
  switch (level) {
    case 'excellent': return 'success';
    case 'good': return '';
    case 'average': return 'warning';
    default: return 'danger';
  }
}

function getPerformanceLabel(level: string): string {
  switch (level) {
    case 'excellent': return t('teamPerformance.excellent');
    case 'good': return t('teamPerformance.good');
    case 'average': return t('teamPerformance.average');
    default: return t('teamPerformance.needsImprovement');
  }
}

function getGoalStatusColor(status: string): string {
  switch (status) {
    case 'on-track': return '#22c55e';
    case 'at-risk': return '#f59e0b';
    case 'behind': return '#ef4444';
    default: return '#7849ff';
  }
}

function getGoalStatusLabel(status: string): string {
  switch (status) {
    case 'on-track': return t('teamPerformance.onTrack');
    case 'at-risk': return t('teamPerformance.atRisk');
    case 'behind': return t('teamPerformance.behind');
    default: return status;
  }
}

function getUtilizationColor(util: number): string {
  if (util > 90) return '#ef4444';
  if (util >= 60) return '#22c55e';
  return '#f59e0b';
}

function getUtilizationTagColor(util: number): string {
  if (util > 90) return '#ef4444';
  if (util >= 60) return '#22c55e';
  return '#f59e0b';
}

function getUtilizationLabel(util: number): string {
  if (util > 90) return t('teamPerformance.overloaded');
  if (util >= 60) return t('teamPerformance.optimal');
  return t('teamPerformance.underloaded');
}

// ─── Avatar Colors ──────────────────────────────────────────
const avatarColors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#10b981', '#f97316'];

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => [
  {
    label: t('teamPerformance.teamMembers'),
    value: '24',
    icon: 'ph:users-bold',
    color: '#7849ff',
    trend: 4.2
  },
  {
    label: t('teamPerformance.tasksCompletedWeek'),
    value: '187',
    icon: 'ph:check-square-bold',
    color: '#22c55e',
    trend: 12.8
  },
  {
    label: t('teamPerformance.avgDealCloseRate'),
    value: '34.5%',
    icon: 'ph:target-bold',
    color: '#3b82f6',
    trend: 5.1
  },
  {
    label: t('teamPerformance.teamUtilization'),
    value: '78.3%',
    icon: 'ph:gauge-bold',
    color: '#f59e0b',
    trend: 2.4
  }
]);

// ─── Team Members Data ──────────────────────────────────────
const teamMembersFallback = [
  { name: 'Sarah Mitchell', initials: 'SM', role: 'Senior Sales Rep', tasksCompleted: 32, dealsClosed: 8, revenue: '$142K', activityScore: 94, performanceLevel: 'excellent', avatarColor: '#7849ff' },
  { name: 'James Rodriguez', initials: 'JR', role: 'Account Executive', tasksCompleted: 28, dealsClosed: 6, revenue: '$118K', activityScore: 87, performanceLevel: 'excellent', avatarColor: '#3b82f6' },
  { name: 'Emily Chen', initials: 'EC', role: 'Business Dev Manager', tasksCompleted: 25, dealsClosed: 5, revenue: '$96K', activityScore: 82, performanceLevel: 'good', avatarColor: '#22c55e' },
  { name: 'Michael Thompson', initials: 'MT', role: 'Sales Rep', tasksCompleted: 22, dealsClosed: 4, revenue: '$78K', activityScore: 75, performanceLevel: 'good', avatarColor: '#f59e0b' },
  { name: 'Olivia Parker', initials: 'OP', role: 'Account Manager', tasksCompleted: 20, dealsClosed: 5, revenue: '$89K', activityScore: 78, performanceLevel: 'good', avatarColor: '#a855f7' },
  { name: 'Daniel Kim', initials: 'DK', role: 'Sales Rep', tasksCompleted: 18, dealsClosed: 3, revenue: '$52K', activityScore: 65, performanceLevel: 'average', avatarColor: '#06b6d4' },
  { name: 'Rachel Foster', initials: 'RF', role: 'Junior Sales Rep', tasksCompleted: 15, dealsClosed: 2, revenue: '$34K', activityScore: 58, performanceLevel: 'average', avatarColor: '#ec4899' },
  { name: 'Alex Martinez', initials: 'AM', role: 'Sales Rep', tasksCompleted: 19, dealsClosed: 3, revenue: '$61K', activityScore: 70, performanceLevel: 'good', avatarColor: '#ef4444' },
  { name: 'Sophie Turner', initials: 'ST', role: 'Account Executive', tasksCompleted: 14, dealsClosed: 2, revenue: '$45K', activityScore: 52, performanceLevel: 'average', avatarColor: '#10b981' },
  { name: 'Chris Baker', initials: 'CB', role: 'Junior Sales Rep', tasksCompleted: 10, dealsClosed: 1, revenue: '$18K', activityScore: 38, performanceLevel: 'needs-improvement', avatarColor: '#f97316' }
];

const teamMembers = ref<any[]>([]);

// ─── Top Performer ──────────────────────────────────────────
const topPerformer = computed(() => ({
  name: 'Sarah Mitchell',
  initials: 'SM',
  role: 'Senior Sales Rep',
  tasksCompleted: 32,
  dealsClosed: 8,
  revenue: '$142K'
}));

// ─── Goals Data ─────────────────────────────────────────────
const departmentGoalsFallback = [
  { name: 'Q1 Revenue Target', owner: 'Sales Department', target: 500000, current: 420000, percentage: 84, dueDate: 'Mar 31, 2026', status: 'on-track', type: 'department' },
  { name: 'New Client Acquisition', owner: 'Business Development', target: 30, current: 22, percentage: 73, dueDate: 'Mar 31, 2026', status: 'on-track', type: 'department' },
  { name: 'Customer Retention Rate', owner: 'Account Management', target: 95, current: 91, percentage: 96, dueDate: 'Mar 31, 2026', status: 'on-track', type: 'department' },
  { name: 'Pipeline Growth', owner: 'Sales Department', target: 200, current: 145, percentage: 73, dueDate: 'Mar 31, 2026', status: 'at-risk', type: 'department' },
  { name: 'Lead Response Time', owner: 'Sales Operations', target: 100, current: 68, percentage: 68, dueDate: 'Feb 28, 2026', status: 'at-risk', type: 'department' },
  { name: 'Training Completion', owner: 'HR Department', target: 24, current: 18, percentage: 75, dueDate: 'Apr 15, 2026', status: 'on-track', type: 'department' }
];

const individualGoalsFallback = [
  { name: 'Close 10 Enterprise Deals', owner: 'Sarah Mitchell', target: 10, current: 8, percentage: 80, dueDate: 'Mar 31, 2026', status: 'on-track', type: 'individual' },
  { name: 'Generate $200K Revenue', owner: 'James Rodriguez', target: 200000, current: 118000, percentage: 59, dueDate: 'Mar 31, 2026', status: 'at-risk', type: 'individual' },
  { name: 'Onboard 5 New Accounts', owner: 'Emily Chen', target: 5, current: 3, percentage: 60, dueDate: 'Mar 15, 2026', status: 'at-risk', type: 'individual' },
  { name: 'Achieve 90% Activity Score', owner: 'Michael Thompson', target: 90, current: 75, percentage: 83, dueDate: 'Mar 31, 2026', status: 'on-track', type: 'individual' },
  { name: 'Upsell Existing Accounts', owner: 'Olivia Parker', target: 8, current: 5, percentage: 63, dueDate: 'Mar 31, 2026', status: 'at-risk', type: 'individual' },
  { name: 'Complete Certification', owner: 'Daniel Kim', target: 1, current: 0, percentage: 0, dueDate: 'Feb 28, 2026', status: 'behind', type: 'individual' },
  { name: '50 Cold Calls per Week', owner: 'Rachel Foster', target: 50, current: 32, percentage: 64, dueDate: 'Ongoing', status: 'at-risk', type: 'individual' },
  { name: 'Reduce Churn by 5%', owner: 'Alex Martinez', target: 5, current: 2, percentage: 40, dueDate: 'Mar 31, 2026', status: 'behind', type: 'individual' }
];

const departmentGoals = ref<any[]>([]);
const individualGoals = ref<any[]>([]);

const filteredGoals = computed(() => {
  return goalView.value === 'department' ? departmentGoals.value : individualGoals.value;
});

// ─── Goal Completion Trend Chart ────────────────────────────
const goalCompletionChartOption = computed(() => ({
  tooltip: {
    ...tooltipStyle,
    trigger: 'axis'
  },
  grid: { top: 40, right: 30, bottom: 40, left: 50 },
  xAxis: {
    type: 'category',
    data: ['Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026'],
    axisLine: { lineStyle: { color: 'rgba(120, 73, 255, 0.2)' } },
    axisLabel: { color: '#999', fontSize: 11 }
  },
  yAxis: {
    type: 'value',
    name: '%',
    max: 100,
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(120, 73, 255, 0.08)' } },
    axisLabel: { color: '#999', fontSize: 11 }
  },
  series: [
    {
      name: t('teamPerformance.goalsTargets'),
      type: 'bar',
      data: [62, 68, 74, 71, 78, 82],
      barWidth: '40%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#7849ff' },
          { offset: 1, color: '#6730e3' }
        ])
      }
    },
    {
      name: t('teamPerformance.target'),
      type: 'line',
      data: [75, 75, 80, 80, 80, 85],
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
      itemStyle: { color: '#f59e0b' }
    }
  ]
}));

// ─── Recent Activities ──────────────────────────────────────
const recentActivitiesFallback = [
  { memberName: 'Sarah Mitchell', action: t('teamPerformance.callsMade') + ' - Contacted Acme Corp about renewal', icon: 'ph:phone-bold', color: '#7849ff', timestamp: '2 min ago' },
  { memberName: 'James Rodriguez', action: t('teamPerformance.emailsSent') + ' - Follow-up proposal to TechStart Inc', icon: 'ph:envelope-bold', color: '#3b82f6', timestamp: '8 min ago' },
  { memberName: 'Emily Chen', action: t('teamPerformance.meetingsHeld') + ' - Demo with GlobalTech Solutions', icon: 'ph:video-camera-bold', color: '#22c55e', timestamp: '15 min ago' },
  { memberName: 'Michael Thompson', action: t('teamPerformance.dealsProgressed') + ' - Moved CloudFirst to negotiation', icon: 'ph:arrow-fat-right-bold', color: '#f59e0b', timestamp: '22 min ago' },
  { memberName: 'Olivia Parker', action: t('teamPerformance.callsMade') + ' - Check-in with DataFlow Systems', icon: 'ph:phone-bold', color: '#7849ff', timestamp: '30 min ago' },
  { memberName: 'Daniel Kim', action: t('teamPerformance.emailsSent') + ' - Sent pricing sheet to NexGen', icon: 'ph:envelope-bold', color: '#3b82f6', timestamp: '45 min ago' },
  { memberName: 'Rachel Foster', action: t('teamPerformance.callsMade') + ' - Cold call batch completed', icon: 'ph:phone-bold', color: '#7849ff', timestamp: '1h ago' },
  { memberName: 'Alex Martinez', action: t('teamPerformance.meetingsHeld') + ' - Quarterly review with StellarTech', icon: 'ph:video-camera-bold', color: '#22c55e', timestamp: '1h 15min ago' },
  { memberName: 'Sophie Turner', action: t('teamPerformance.dealsProgressed') + ' - Updated proposal for BrightPath', icon: 'ph:arrow-fat-right-bold', color: '#f59e0b', timestamp: '1h 30min ago' },
  { memberName: 'Chris Baker', action: t('teamPerformance.emailsSent') + ' - Introduction email to InnovateCo', icon: 'ph:envelope-bold', color: '#3b82f6', timestamp: '1h 45min ago' },
  { memberName: 'Sarah Mitchell', action: t('teamPerformance.dealsProgressed') + ' - Closed deal with Quantum Labs', icon: 'ph:arrow-fat-right-bold', color: '#f59e0b', timestamp: '2h ago' },
  { memberName: 'James Rodriguez', action: t('teamPerformance.meetingsHeld') + ' - Strategy session for Q2 pipeline', icon: 'ph:video-camera-bold', color: '#22c55e', timestamp: '2h 15min ago' },
  { memberName: 'Emily Chen', action: t('teamPerformance.callsMade') + ' - Follow-up with Apex Industries', icon: 'ph:phone-bold', color: '#7849ff', timestamp: '2h 30min ago' },
  { memberName: 'Michael Thompson', action: t('teamPerformance.emailsSent') + ' - Sent case study to Vertex Corp', icon: 'ph:envelope-bold', color: '#3b82f6', timestamp: '2h 45min ago' },
  { memberName: 'Olivia Parker', action: t('teamPerformance.meetingsHeld') + ' - Onboarding session with PeakTech', icon: 'ph:video-camera-bold', color: '#22c55e', timestamp: '3h ago' },
  { memberName: 'Daniel Kim', action: t('teamPerformance.callsMade') + ' - Prospecting calls to SMB segment', icon: 'ph:phone-bold', color: '#7849ff', timestamp: '3h 20min ago' },
  { memberName: 'Rachel Foster', action: t('teamPerformance.dealsProgressed') + ' - Moved Horizon Inc to discovery', icon: 'ph:arrow-fat-right-bold', color: '#f59e0b', timestamp: '3h 45min ago' },
  { memberName: 'Alex Martinez', action: t('teamPerformance.emailsSent') + ' - Monthly newsletter to accounts', icon: 'ph:envelope-bold', color: '#3b82f6', timestamp: '4h ago' },
  { memberName: 'Sophie Turner', action: t('teamPerformance.callsMade') + ' - Reconnect with former client', icon: 'ph:phone-bold', color: '#7849ff', timestamp: '4h 15min ago' },
  { memberName: 'Chris Baker', action: t('teamPerformance.meetingsHeld') + ' - Training session attendance', icon: 'ph:video-camera-bold', color: '#22c55e', timestamp: '4h 30min ago' }
];

const recentActivities = ref<any[]>([]);

// ─── Activity Heatmap ───────────────────────────────────────
const activityHeatmapOption = computed(() => {
  const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const data: number[][] = [];

  // Generate realistic heatmap data [dayIndex, hourIndex, value]
  const heatValues = [
    [0,0,5],[0,1,8],[0,2,12],[0,3,6],[0,4,9],[0,5,14],[0,6,11],[0,7,7],[0,8,3],
    [1,0,7],[1,1,11],[1,2,15],[1,3,8],[1,4,10],[1,5,16],[1,6,13],[1,7,9],[1,8,4],
    [2,0,6],[2,1,9],[2,2,18],[2,3,7],[2,4,11],[2,5,19],[2,6,14],[2,7,8],[2,8,5],
    [3,0,8],[3,1,12],[3,2,14],[3,3,9],[3,4,13],[3,5,17],[3,6,12],[3,7,6],[3,8,2],
    [4,0,4],[4,1,7],[4,2,10],[4,3,5],[4,4,8],[4,5,11],[4,6,9],[4,7,5],[4,8,1]
  ];

  return {
    tooltip: {
      ...tooltipStyle,
      formatter: (params: any) => {
        return `${days[params.value[0]]} ${hours[params.value[1]]}<br/>Activities: <b>${params.value[2]}</b>`;
      }
    },
    grid: { top: 30, right: 20, bottom: 40, left: 60 },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true },
      axisLabel: { color: '#999', fontSize: 10 }
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: { show: true },
      axisLabel: { color: '#999', fontSize: 11 }
    },
    visualMap: {
      min: 0,
      max: 20,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#7849ff18', '#7849ff40', '#7849ff80', '#7849ffcc', '#7849ff']
      },
      textStyle: { color: '#999', fontSize: 10 }
    },
    series: [{
      type: 'heatmap',
      data: heatValues,
      label: { show: true, color: '#fff', fontSize: 10 },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(120, 73, 255, 0.5)' }
      }
    }]
  };
});

// ─── Leaderboard Data ───────────────────────────────────────
const leaderboardData = computed(() => {
  return [
    { name: 'Sarah Mitchell', initials: 'SM', avatarColor: '#7849ff', calls: 48, emails: 62, meetings: 12, deals: 8, totalScore: 982 },
    { name: 'James Rodriguez', initials: 'JR', avatarColor: '#3b82f6', calls: 42, emails: 55, meetings: 10, deals: 6, totalScore: 874 },
    { name: 'Emily Chen', initials: 'EC', avatarColor: '#22c55e', calls: 35, emails: 48, meetings: 14, deals: 5, totalScore: 812 },
    { name: 'Michael Thompson', initials: 'MT', avatarColor: '#f59e0b', calls: 38, emails: 41, meetings: 8, deals: 4, totalScore: 745 },
    { name: 'Olivia Parker', initials: 'OP', avatarColor: '#a855f7', calls: 30, emails: 52, meetings: 9, deals: 5, totalScore: 728 },
    { name: 'Alex Martinez', initials: 'AM', avatarColor: '#ef4444', calls: 33, emails: 38, meetings: 7, deals: 3, totalScore: 654 },
    { name: 'Daniel Kim', initials: 'DK', avatarColor: '#06b6d4', calls: 28, emails: 35, meetings: 6, deals: 3, totalScore: 598 },
    { name: 'Rachel Foster', initials: 'RF', avatarColor: '#ec4899', calls: 45, emails: 22, meetings: 4, deals: 2, totalScore: 542 },
    { name: 'Sophie Turner', initials: 'ST', avatarColor: '#10b981', calls: 22, emails: 30, meetings: 5, deals: 2, totalScore: 478 },
    { name: 'Chris Baker', initials: 'CB', avatarColor: '#f97316', calls: 18, emails: 15, meetings: 3, deals: 1, totalScore: 312 }
  ];
});

// ─── Workload Chart ─────────────────────────────────────────
const workloadChartOption = computed(() => {
  const members = [
    { name: 'Sarah Mitchell', hours: 46 },
    { name: 'James Rodriguez', hours: 42 },
    { name: 'Emily Chen', hours: 38 },
    { name: 'Michael Thompson', hours: 44 },
    { name: 'Olivia Parker', hours: 35 },
    { name: 'Daniel Kim', hours: 28 },
    { name: 'Rachel Foster', hours: 32 },
    { name: 'Alex Martinez', hours: 40 },
    { name: 'Sophie Turner', hours: 25 },
    { name: 'Chris Baker', hours: 22 }
  ];

  const getBarColor = (hours: number) => {
    if (hours > 42) return '#ef4444';
    if (hours >= 30) return '#22c55e';
    return '#f59e0b';
  };

  return {
    tooltip: {
      ...tooltipStyle,
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: { top: 20, right: 40, bottom: 20, left: 130 },
    xAxis: {
      type: 'value',
      name: t('teamPerformance.hoursAllocated'),
      max: 50,
      axisLine: { lineStyle: { color: 'rgba(120, 73, 255, 0.2)' } },
      splitLine: { lineStyle: { color: 'rgba(120, 73, 255, 0.08)' } },
      axisLabel: { color: '#999', fontSize: 11 }
    },
    yAxis: {
      type: 'category',
      data: members.map(m => m.name).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#999', fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: members.map(m => ({
        value: m.hours,
        itemStyle: {
          color: getBarColor(m.hours),
          borderRadius: [0, 6, 6, 0]
        }
      })).reverse(),
      barWidth: '60%',
      label: {
        show: true,
        position: 'right',
        formatter: '{c}h',
        color: '#999',
        fontSize: 11
      }
    }]
  };
});

// ─── Capacity Members ───────────────────────────────────────
const capacityMembers = computed(() => [
  { name: 'Sarah M.', role: 'Sr. Sales Rep', utilization: 95 },
  { name: 'James R.', role: 'Account Exec', utilization: 88 },
  { name: 'Emily C.', role: 'BD Manager', utilization: 79 },
  { name: 'Michael T.', role: 'Sales Rep', utilization: 92 },
  { name: 'Olivia P.', role: 'Account Mgr', utilization: 73 },
  { name: 'Daniel K.', role: 'Sales Rep', utilization: 58 },
  { name: 'Rachel F.', role: 'Jr. Sales Rep', utilization: 67 },
  { name: 'Alex M.', role: 'Sales Rep', utilization: 83 },
  { name: 'Sophie T.', role: 'Account Exec', utilization: 52 },
  { name: 'Chris B.', role: 'Jr. Sales Rep', utilization: 46 }
]);

// ─── Data Loading ───────────────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    // Wire teamMembers from users API
    const usersRes = await useApiFetch('users');
    if (usersRes.success && Array.isArray(usersRes.body)) {
      teamMembers.value = usersRes.body;
    } else {
      teamMembers.value = teamMembersFallback;
    }
  } catch {
    teamMembers.value = teamMembersFallback;
  }

  try {
    // Wire goals from goals API
    const goalsRes = await useApiFetch('goals');
    if (goalsRes.success && Array.isArray(goalsRes.body)) {
      departmentGoals.value = (goalsRes.body as any[]).filter((g: any) => g.type === 'department');
      individualGoals.value = (goalsRes.body as any[]).filter((g: any) => g.type === 'individual');
      if (departmentGoals.value.length === 0) departmentGoals.value = departmentGoalsFallback;
      if (individualGoals.value.length === 0) individualGoals.value = individualGoalsFallback;
    } else {
      departmentGoals.value = departmentGoalsFallback;
      individualGoals.value = individualGoalsFallback;
    }
  } catch {
    departmentGoals.value = departmentGoalsFallback;
    individualGoals.value = individualGoalsFallback;
  }

  try {
    // Wire recentActivities from activity API
    const actRes = await useApiFetch('activity');
    if (actRes.success && Array.isArray(actRes.body)) {
      recentActivities.value = actRes.body;
    } else {
      recentActivities.value = recentActivitiesFallback;
    }
  } catch {
    recentActivities.value = recentActivitiesFallback;
  }

  loading.value = false;
}

function refreshData() {
  refreshing.value = true;
  loadData().finally(() => { refreshing.value = false; });
}

// ─── Init ───────────────────────────────────────────────────
onMounted(() => { loadData(); });
</script>

<style lang="scss" scoped>
.team-performance-page {
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

.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08);
  }
}

.kpi-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.12);
    border-color: rgba(120, 73, 255, 0.3);
  }
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #7849ff, #6730e3);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(120, 73, 255, 0.3);
}

.performance-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    background: var(--border-default);
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted);
    font-weight: 500;

    &.is-active {
      color: #7849ff;
      font-weight: 600;
    }

    &:hover {
      color: #7849ff;
    }
  }

  :deep(.el-tabs__active-bar) {
    background-color: #7849ff;
  }
}

.member-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(120, 73, 255, 0.1);
  }
}

.top-performer-banner {
  background: linear-gradient(
    135deg,
    rgba(120, 73, 255, 0.1),
    rgba(59, 130, 246, 0.1)
  );
  border: 1px solid rgba(120, 73, 255, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.activity-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-default);

  &:last-child {
    border-bottom: none;
  }
}

.activity-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 73, 255, 0.3) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(120, 73, 255, 0.3);
    border-radius: 4px;
  }
}
</style>
