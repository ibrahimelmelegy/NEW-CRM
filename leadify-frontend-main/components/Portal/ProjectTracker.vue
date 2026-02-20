<template lang="pug">
.project-tracker
  .glass-card.p-6
    //- Header
    .flex.items-center.justify-between.mb-6
      div
        h3.text-lg.font-bold(style="color: var(--text-primary)") {{ project.name }}
        p.text-sm(style="color: var(--text-muted)") {{ project.description || $t('portal.projects.noDescription') }}
      el-tag(:type="statusTagType" size="default" effect="dark" round)
        | {{ project.status }}

    //- Key Metrics
    .grid.grid-cols-3.gap-4.mb-6
      .metric-card
        .metric-value(:style="{ color: progressColor }") {{ project.progress }}%
        .metric-label {{ $t('portal.projects.completion') }}
      .metric-card
        .metric-value(style="color: var(--text-primary)") {{ project.daysRemaining }}
        .metric-label {{ $t('portal.projects.daysRemaining') }}
      .metric-card
        .metric-value(style="color: var(--text-primary)") {{ completedMilestones }}/{{ project.milestones?.length || 0 }}
        .metric-label {{ $t('portal.projects.milestonesComplete') }}

    //- Progress Bar
    .progress-section.mb-6
      .flex.items-center.justify-between.mb-2
        span.text-sm.font-medium(style="color: var(--text-primary)") {{ $t('portal.projects.overallProgress') }}
        span.text-sm.font-bold(:style="{ color: progressColor }") {{ project.progress }}%
      .progress-bar-track
        .progress-bar-fill(:style="{ width: project.progress + '%', background: progressGradient }")

    //- Date Range
    .date-range.mb-6
      .flex.items-center.justify-between.text-xs(style="color: var(--text-muted)")
        .flex.items-center.gap-1
          Icon(name="ph:calendar-blank-bold" size="14" aria-label="Start date")
          span {{ formatDate(project.startDate) }}
        .flex.items-center.gap-1
          Icon(name="ph:flag-checkered-bold" size="14" aria-label="End date")
          span {{ formatDate(project.endDate) }}

    //- Milestones Timeline
    .milestones-section(v-if="project.milestones?.length")
      h4.text-sm.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('portal.projects.milestones') }}
      .milestone-timeline
        .milestone-item(
          v-for="(milestone, index) in project.milestones"
          :key="index"
          :class="'milestone-' + milestone.status"
        )
          .milestone-dot
            Icon(
              v-if="milestone.status === 'completed'"
              name="ph:check-bold"
              size="12"
              aria-label="Completed"
            )
            Icon(
              v-else-if="milestone.status === 'in-progress'"
              name="ph:arrow-right-bold"
              size="12"
              aria-label="In progress"
            )
          .milestone-connector(v-if="index < project.milestones.length - 1")
          .milestone-content
            .flex.items-center.justify-between
              span.text-sm.font-medium(:style="{ color: milestoneTextColor(milestone.status) }") {{ milestone.name }}
              el-tag(
                :type="milestoneTagType(milestone.status)"
                size="small"
                effect="plain"
                round
              )
                | {{ $t('portal.projects.milestone.' + milestone.status) }}
            p.text-xs.mt-1(v-if="milestone.date" style="color: var(--text-muted)") {{ formatDate(milestone.date) }}
</template>

<script setup lang="ts">
import type { PortalProject } from '~/composables/usePortal';

const props = defineProps<{
  project: PortalProject;
}>();

const statusTagType = computed(() => {
  const map: Record<string, string> = {
    ACTIVE: 'success',
    COMPLETE: '',
    ON_HOLD: 'warning',
    CANCELLED: 'danger'
  };
  return map[props.project.status] || 'info';
});

const progressColor = computed(() => {
  const p = props.project.progress;
  if (p >= 80) return '#22c55e';
  if (p >= 50) return '#7849ff';
  if (p >= 25) return '#f59e0b';
  return '#ef4444';
});

const progressGradient = computed(() => {
  const p = props.project.progress;
  if (p >= 80) return 'linear-gradient(90deg, #22c55e, #16a34a)';
  if (p >= 50) return 'linear-gradient(90deg, #7849ff, #5b2fd4)';
  if (p >= 25) return 'linear-gradient(90deg, #f59e0b, #d97706)';
  return 'linear-gradient(90deg, #ef4444, #dc2626)';
});

const completedMilestones = computed(() => {
  return props.project.milestones?.filter(m => m.status === 'completed').length || 0;
});

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function milestoneTagType(status: string): string {
  const map: Record<string, string> = {
    completed: 'success',
    'in-progress': 'warning',
    pending: 'info'
  };
  return map[status] || 'info';
}

function milestoneTextColor(status: string): string {
  if (status === 'completed') return 'var(--text-muted)';
  if (status === 'in-progress') return 'var(--text-primary)';
  return 'var(--text-muted)';
}
</script>

<style scoped>
.metric-card {
  text-align: center;
  padding: 16px 8px;
  border-radius: 12px;
  background: var(--bg-input);
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.metric-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  margin-top: 4px;
}

.progress-bar-track {
  height: 10px;
  border-radius: 5px;
  background: var(--bg-input);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.6s ease;
}

.date-range {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--bg-input);
}

.milestone-timeline {
  position: relative;
}

.milestone-item {
  position: relative;
  display: flex;
  gap: 16px;
  padding-bottom: 24px;
}

.milestone-item:last-child {
  padding-bottom: 0;
}

.milestone-dot {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  border: 2px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-muted);
}

.milestone-completed .milestone-dot {
  background: #22c55e;
  border-color: #22c55e;
  color: white;
}

.milestone-in-progress .milestone-dot {
  background: rgba(120, 73, 255, 0.15);
  border-color: #7849ff;
  color: #7849ff;
  animation: pulse 2s ease-in-out infinite;
}

.milestone-connector {
  position: absolute;
  left: 13px;
  top: 28px;
  width: 2px;
  height: calc(100% - 28px);
  background: var(--border-default);
}

.milestone-completed + .milestone-item .milestone-connector,
.milestone-completed .milestone-connector {
  background: #22c55e;
}

.milestone-content {
  flex: 1;
  padding-top: 4px;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(120, 73, 255, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(120, 73, 255, 0); }
}
</style>
