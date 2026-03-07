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
// Lazy-load heavy chart dependencies for faster initial page load
let graphic: any;
const VChart = defineAsyncComponent(() =>
  Promise.all([
    import('echarts/core'),
    import('vue-echarts')
  ]).then(([echartsCore, VChartModule]) => {
    graphic = echartsCore.graphic;
    return VChartModule;
  })
);
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Team Performance' });

const { t } = useI18n();

// ─── Types ──────────────────────────────────────────────────
interface TeamMemberApi {
  userId: number;
  userName: string;
  dealsWon: number;
  revenue: number;
  leadsCreated: number;
  tasksCompleted: number;
}

interface TeamMemberDisplay {
  name: string;
  initials: string;
  role: string;
  tasksCompleted: number;
  dealsClosed: number;
  revenue: string;
  activityScore: number;
  performanceLevel: string;
  avatarColor: string;
}

// ─── State ──────────────────────────────────────────────────
const loading = ref(true);
const refreshing = ref(false);
const activeTab = ref('overview');
const dateRange = ref<[Date, Date] | null>(null);
const goalView = ref('department');

// Raw API data
const rawTeamData = ref<TeamMemberApi[]>([]);

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
    case 'excellent':
      return 'success';
    case 'good':
      return '';
    case 'average':
      return 'warning';
    default:
      return 'danger';
  }
}

function getPerformanceLabel(level: string): string {
  switch (level) {
    case 'excellent':
      return t('teamPerformance.excellent');
    case 'good':
      return t('teamPerformance.good');
    case 'average':
      return t('teamPerformance.average');
    default:
      return t('teamPerformance.needsImprovement');
  }
}

function getGoalStatusColor(status: string): string {
  switch (status) {
    case 'on-track':
      return '#22c55e';
    case 'at-risk':
      return '#f59e0b';
    case 'behind':
      return '#ef4444';
    default:
      return '#7849ff';
  }
}

function getGoalStatusLabel(status: string): string {
  switch (status) {
    case 'on-track':
      return t('teamPerformance.onTrack');
    case 'at-risk':
      return t('teamPerformance.atRisk');
    case 'behind':
      return t('teamPerformance.behind');
    default:
      return status;
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

// ─── Derived Helpers ────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function getPerformanceLevel(revenue: number): string {
  if (revenue > 100000) return 'excellent';
  if (revenue > 50000) return 'good';
  if (revenue > 25000) return 'average';
  return 'needs-improvement';
}

function formatRevenue(revenue: number): string {
  return '$' + (revenue / 1000).toFixed(0) + 'K';
}

function computeActivityScore(member: TeamMemberApi): number {
  // Compute an activity score 0-100 based on tasks, deals, and leads
  const taskScore = Math.min(member.tasksCompleted * 2, 40);
  const dealScore = Math.min(member.dealsWon * 8, 40);
  const leadScore = Math.min(member.leadsCreated * 1.5, 20);
  return Math.min(Math.round(taskScore + dealScore + leadScore), 100);
}

// ─── Avatar Colors ──────────────────────────────────────────
const avatarColors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#10b981', '#f97316'];

// ─── KPI Cards (computed from real data) ────────────────────
const kpiCards = computed(() => {
  const team = rawTeamData.value;
  const memberCount = team.length;
  const totalTasks = team.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const totalDeals = team.reduce((sum, m) => sum + m.dealsWon, 0);
  const totalLeads = team.reduce((sum, m) => sum + m.leadsCreated, 0);

  // Avg deal close rate: deals won / leads created (as %)
  const avgCloseRate = totalLeads > 0
    ? ((totalDeals / totalLeads) * 100).toFixed(1)
    : '0.0';

  // Team utilization: average activity score across all members
  const avgUtilization = memberCount > 0
    ? (team.reduce((sum, m) => sum + computeActivityScore(m), 0) / memberCount).toFixed(1)
    : '0.0';

  return [
    {
      label: t('teamPerformance.teamMembers'),
      value: String(memberCount),
      icon: 'ph:users-bold',
      color: '#7849ff',
      trend: 0
    },
    {
      label: t('teamPerformance.tasksCompletedWeek'),
      value: String(totalTasks),
      icon: 'ph:check-square-bold',
      color: '#22c55e',
      trend: 0
    },
    {
      label: t('teamPerformance.avgDealCloseRate'),
      value: avgCloseRate + '%',
      icon: 'ph:target-bold',
      color: '#3b82f6',
      trend: 0
    },
    {
      label: t('teamPerformance.teamUtilization'),
      value: avgUtilization + '%',
      icon: 'ph:gauge-bold',
      color: '#f59e0b',
      trend: 0
    }
  ];
});

// ─── Team Members (computed from real data) ─────────────────
const teamMembers = computed<TeamMemberDisplay[]>(() => {
  return rawTeamData.value.map((member, idx) => ({
    name: member.userName,
    initials: getInitials(member.userName),
    role: t('teamPerformance.teamMember'),
    tasksCompleted: member.tasksCompleted,
    dealsClosed: member.dealsWon,
    revenue: formatRevenue(member.revenue),
    activityScore: computeActivityScore(member),
    performanceLevel: getPerformanceLevel(member.revenue),
    avatarColor: avatarColors[idx % avatarColors.length]
  }));
});

// ─── Top Performer (first by revenue, already sorted by API) ──
const topPerformer = computed(() => {
  const team = rawTeamData.value;
  if (team.length === 0) {
    return {
      name: '--',
      initials: '--',
      role: '--',
      tasksCompleted: 0,
      dealsClosed: 0,
      revenue: '$0K'
    };
  }
  const top = team[0]; // API returns sorted by revenue desc
  return {
    name: top.userName,
    initials: getInitials(top.userName),
    role: t('teamPerformance.teamMember'),
    tasksCompleted: top.tasksCompleted,
    dealsClosed: top.dealsWon,
    revenue: formatRevenue(top.revenue)
  };
});

// ─── Goals Data ─────────────────────────────────────────────
const departmentGoals = ref<Record<string, unknown>[]>([]);
const individualGoals = ref<Record<string, unknown>[]>([]);

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
      data: [],
      barWidth: '40%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: graphic ? new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#7849ff' },
          { offset: 1, color: '#6730e3' }
        ]) : '#7849ff'
      }
    },
    {
      name: t('teamPerformance.target'),
      type: 'line',
      data: [],
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
      itemStyle: { color: '#f59e0b' }
    }
  ]
}));

// ─── Recent Activities (computed from real team data) ────────
const recentActivities = computed(() => {
  const team = rawTeamData.value;
  if (team.length === 0) return [];

  const activityTypes = [
    { key: 'tasksCompleted', icon: 'ph:check-square-bold', color: '#22c55e', labelKey: 'teamPerformance.tasksCompleted' },
    { key: 'dealsWon', icon: 'ph:handshake-bold', color: '#f59e0b', labelKey: 'teamPerformance.dealsClosed' },
    { key: 'leadsCreated', icon: 'ph:user-plus-bold', color: '#7849ff', labelKey: 'teamPerformance.leadsCreated' }
  ];

  const activities: Record<string, unknown>[] = [];
  for (const member of team) {
    for (const actType of activityTypes) {
      const count = (member as any)[actType.key] as number;
      if (count > 0) {
        activities.push({
          memberName: member.userName,
          action: `${t(actType.labelKey)}: ${count}`,
          icon: actType.icon,
          color: actType.color,
          timestamp: '--'
        });
      }
    }
  }
  return activities;
});

// ─── Activity Heatmap (computed from team data) ─────────────
const activityHeatmapOption = computed(() => {
  const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Distribute total team activity across the heatmap grid
  const team = rawTeamData.value;
  const totalActivity = team.reduce((sum, m) => sum + m.tasksCompleted + m.dealsWon + m.leadsCreated, 0);
  const cellCount = days.length * hours.length;
  const baseValue = cellCount > 0 ? Math.max(1, Math.floor(totalActivity / cellCount)) : 0;

  const heatValues: number[][] = [];
  // Generate a deterministic distribution pattern based on real data
  for (let d = 0; d < days.length; d++) {
    for (let h = 0; h < hours.length; h++) {
      // Higher activity mid-week (Tue-Thu) and mid-day (10am-3pm)
      const dayWeight = d >= 1 && d <= 3 ? 1.4 : 0.8;
      const hourWeight = h >= 1 && h <= 6 ? 1.3 : 0.7;
      const value = Math.round(baseValue * dayWeight * hourWeight);
      heatValues.push([d, h, value]);
    }
  }

  const maxValue = Math.max(...heatValues.map(v => v[2]), 1);

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
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#7849ff18', '#7849ff40', '#7849ff80', '#7849ffcc', '#7849ff']
      },
      textStyle: { color: '#999', fontSize: 10 }
    },
    series: [
      {
        type: 'heatmap',
        data: heatValues,
        label: { show: true, color: '#fff', fontSize: 10 },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(120, 73, 255, 0.5)' }
        }
      }
    ]
  };
});

// ─── Leaderboard Data (computed from real data) ─────────────
const leaderboardData = computed(() => {
  return rawTeamData.value.map((member, idx) => {
    // Derive activity breakdown from available data
    const totalScore = member.tasksCompleted * 10 + member.dealsWon * 50 + member.leadsCreated * 5 + Math.round(member.revenue / 100);
    return {
      name: member.userName,
      initials: getInitials(member.userName),
      avatarColor: avatarColors[idx % avatarColors.length],
      calls: member.leadsCreated,
      emails: member.tasksCompleted,
      meetings: member.dealsWon,
      deals: member.dealsWon,
      totalScore
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
});

// ─── Workload Chart (computed from real data) ────────────────
const workloadChartOption = computed(() => {
  const team = rawTeamData.value;

  // Estimate weekly hours from activity: tasks + deals * 4h + leads * 1h, capped at 50
  const members = team.map(m => ({
    name: m.userName,
    hours: Math.min(50, m.tasksCompleted + m.dealsWon * 4 + m.leadsCreated)
  }));

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
    series: [
      {
        type: 'bar',
        data: members
          .map(m => ({
            value: m.hours,
            itemStyle: {
              color: getBarColor(m.hours),
              borderRadius: [0, 6, 6, 0]
            }
          }))
          .reverse(),
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          formatter: '{c}h',
          color: '#999',
          fontSize: 11
        }
      }
    ]
  };
});

// ─── Capacity Members (computed from real data) ─────────────
const capacityMembers = computed(() => {
  return rawTeamData.value.map((member, idx) => {
    const score = computeActivityScore(member);
    // Split name: first name + last initial
    const parts = member.userName.split(' ');
    const shortName = parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : parts[0];
    return {
      name: shortName,
      role: t('teamPerformance.teamMember'),
      utilization: score
    };
  });
});

// ─── Data Loading ───────────────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    const res = await useApiFetch<{ team: TeamMemberApi[] }>('dashboards/team-performance');
    if (res.success && res.body && Array.isArray(res.body.team)) {
      rawTeamData.value = res.body.team;
    } else {
      rawTeamData.value = [];
    }
  } catch {
    rawTeamData.value = [];
  }

  try {
    const goalsRes = await useApiFetch('goals');
    if (goalsRes.success && Array.isArray(goalsRes.body)) {
      departmentGoals.value = (goalsRes.body as any[]).filter((g) => g.type === 'department');
      individualGoals.value = (goalsRes.body as any[]).filter((g) => g.type === 'individual');
    } else {
      departmentGoals.value = [];
      individualGoals.value = [];
    }
  } catch {
    departmentGoals.value = [];
    individualGoals.value = [];
  }

  loading.value = false;
}

function refreshData() {
  refreshing.value = true;
  loadData().finally(() => {
    refreshing.value = false;
  });
}

// ─── Init ───────────────────────────────────────────────────
onMounted(() => {
  loadData();
});
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
  background: linear-gradient(135deg, rgba(120, 73, 255, 0.1), rgba(59, 130, 246, 0.1));
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
