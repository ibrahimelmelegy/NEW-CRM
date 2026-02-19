<template lang="pug">
.dashboard-widget-renderer
  //- KPI widgets
  DashboardBuilderWidgetsWidgetKPI(
    v-if="type === 'kpi-revenue'"
    title="Total Revenue"
    icon="ph:currency-dollar-bold"
    color="#10B981"
    dataSource="revenue"
  )
  DashboardBuilderWidgetsWidgetKPI(
    v-else-if="type === 'kpi-deals'"
    title="Active Deals"
    icon="ph:handshake-bold"
    color="#8B5CF6"
    dataSource="deals"
  )
  DashboardBuilderWidgetsWidgetKPI(
    v-else-if="type === 'kpi-leads'"
    title="Open Leads"
    icon="ph:users-bold"
    color="#3B82F6"
    dataSource="leads"
  )
  DashboardBuilderWidgetsWidgetKPI(
    v-else-if="type === 'kpi-conversion'"
    title="Conversion Rate"
    icon="ph:chart-line-up-bold"
    color="#F59E0B"
    dataSource="conversion"
  )

  //- Chart widgets
  DashboardBuilderWidgetsWidgetChart(
    v-else-if="type === 'chart-pipeline'"
    chartType="pipeline"
    title="Sales Pipeline"
  )
  DashboardBuilderWidgetsWidgetChart(
    v-else-if="type === 'chart-lead-sources'"
    chartType="lead-sources"
    title="Lead Sources"
  )
  DashboardBuilderWidgetsWidgetChart(
    v-else-if="type === 'chart-win-loss'"
    chartType="win-loss"
    title="Win / Loss Ratio"
  )
  DashboardBuilderWidgetsWidgetChart(
    v-else-if="type === 'chart-funnel'"
    chartType="funnel"
    title="Conversion Funnel"
  )
  DashboardBuilderWidgetsWidgetChart(
    v-else-if="type === 'chart-revenue-trend'"
    chartType="revenue-trend"
    title="Revenue Trend"
  )

  //- Table widgets
  DashboardBuilderWidgetsWidgetTable(
    v-else-if="type === 'table-recent-deals'"
    tableType="recent-deals"
    title="Recent Deals"
  )
  DashboardBuilderWidgetsWidgetTable(
    v-else-if="type === 'table-team'"
    tableType="team"
    title="Team Performance"
  )

  //- Feed widgets
  DashboardBuilderWidgetsWidgetFeed(
    v-else-if="type === 'feed-activities'"
    feedType="activities"
    title="Activity Feed"
  )
  DashboardBuilderWidgetsWidgetFeed(
    v-else-if="type === 'feed-notifications'"
    feedType="notifications"
    title="Notifications"
  )

  //- Calendar widget
  DashboardBuilderWidgetsWidgetCalendar(
    v-else-if="type === 'calendar-upcoming'"
    title="Upcoming Events"
  )

  //- Progress widget
  DashboardBuilderWidgetsWidgetProgress(
    v-else-if="type === 'progress-targets'"
    title="Sales Targets"
  )

  //- Unknown widget fallback
  .glass-card.p-5.h-full.flex.items-center.justify-center(v-else)
    .text-center
      Icon(name="ph:question-bold" size="32" style="color: var(--text-muted)")
      p.text-xs.mt-2(style="color: var(--text-muted)") Unknown widget: {{ type }}
</template>

<script setup lang="ts">
defineProps<{
  type: string;
  config?: Record<string, any>;
}>();
</script>

<style lang="scss" scoped>
.dashboard-widget-renderer {
  height: 100%;

  > * {
    height: 100%;
  }
}
</style>
