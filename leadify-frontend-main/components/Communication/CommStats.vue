<template lang="pug">
.comm-stats
  //- Header
  .stats-header
    h3.stats-title {{ $t('communication.activityStats') || 'Activity Stats' }}
    .stats-controls
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :start-placeholder="$t('common.startDate') || 'Start'"
        :end-placeholder="$t('common.endDate') || 'End'"
        size="small"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @change="onDateRangeChange"
      )

  //- Loading state
  .stats-loading(v-if="loading && !stats")
    .stat-skeleton(v-for="n in 5" :key="n")
      .skeleton-block

  //- Stats Cards
  .stats-grid(v-else-if="stats")
    .stat-card.glass-card(
      v-for="card in statCards"
      :key="card.key"
    )
      .stat-card-inner
        .stat-icon-wrapper(:style="{ background: card.bgColor }")
          Icon(:name="card.icon" size="22" :style="{ color: card.color }")
        .stat-content
          .stat-label {{ card.label }}
          .stat-value {{ card.value }}
          .stat-extra(v-if="card.extra")
            span.extra-text {{ card.extra }}

    //- Trend card
    .stat-card.glass-card.trend-card
      .stat-card-inner
        .stat-icon-wrapper(:style="{ background: trendBg }")
          Icon(:name="trendIcon" size="22" :style="{ color: trendColor }")
        .stat-content
          .stat-label {{ $t('communication.weeklyTrend') || 'Weekly Trend' }}
          .stat-value(:style="{ color: trendColor }") {{ trendLabel }}
          .stat-extra
            span.extra-text vs previous week

  //- Activity Breakdown
  .activity-breakdown(v-if="stats && stats.byType")
    h4.breakdown-title {{ $t('communication.byType') || 'By Type' }}
    .breakdown-bars
      .breakdown-item(
        v-for="typeOpt in activityTypes"
        :key="typeOpt.value"
      )
        .breakdown-header
          .breakdown-label
            Icon(:name="typeOpt.icon" size="14" :style="{ color: typeOpt.color }")
            span {{ typeOpt.label }}
          span.breakdown-count {{ stats.byType[typeOpt.value] || 0 }}
        .breakdown-bar
          .breakdown-fill(
            :style="{ width: getBarWidth(typeOpt.value), background: typeOpt.color }"
          )

  //- Empty State
  .stats-empty(v-else)
    Icon(name="ph:chart-bar-bold" size="48" class="empty-icon")
    p.empty-text {{ $t('communication.noStatsData') || 'No activity data available' }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  useCommunication,
  activityTypeOptions,
  formatCallDuration as formatDuration,
  type ActivityStats
} from '../../composables/useCommunication';

interface Props {
  userId?: number;
}

const props = defineProps<Props>();
const { t } = useI18n();

const { stats, loading, fetchStats } = useCommunication();

const dateRange = ref<[string, string] | null>(null);
const activityTypes = activityTypeOptions;

// Stat card definitions
const statCards = computed(() => {
  if (!stats.value) return [];

  return [
    {
      key: 'total',
      icon: 'ph:lightning-bold',
      label: t('communication.totalActivities') || 'Total Activities',
      value: stats.value.totalActivities.toLocaleString(),
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    },
    {
      key: 'calls',
      icon: 'ph:phone-bold',
      label: t('communication.callsToday') || 'Calls Today',
      value: stats.value.callsToday.toString(),
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      extra: stats.value.avgCallDuration > 0
        ? `Avg: ${formatDuration(stats.value.avgCallDuration)}`
        : null
    },
    {
      key: 'emails',
      icon: 'ph:envelope-bold',
      label: t('communication.emailsWeek') || 'Emails This Week',
      value: stats.value.emailsThisWeek.toString(),
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      key: 'meetings',
      icon: 'ph:calendar-bold',
      label: t('communication.meetingsScheduled') || 'Meetings Scheduled',
      value: stats.value.meetingsScheduled.toString(),
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    },
    {
      key: 'notes',
      icon: 'ph:notepad-bold',
      label: t('communication.notesCreated') || 'Notes Created',
      value: stats.value.notesCreated.toString(),
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.1)'
    }
  ];
});

// Trend computations
const trendValue = computed(() => stats.value?.trend ?? 0);

const trendColor = computed(() => {
  if (trendValue.value > 0) return '#10b981';
  if (trendValue.value < 0) return '#ef4444';
  return '#64748b';
});

const trendBg = computed(() => {
  if (trendValue.value > 0) return 'rgba(16, 185, 129, 0.1)';
  if (trendValue.value < 0) return 'rgba(239, 68, 68, 0.1)';
  return 'rgba(100, 116, 139, 0.1)';
});

const trendIcon = computed(() => {
  if (trendValue.value > 0) return 'ph:trend-up-bold';
  if (trendValue.value < 0) return 'ph:trend-down-bold';
  return 'ph:minus-bold';
});

const trendLabel = computed(() => {
  const v = trendValue.value;
  if (v > 0) return `+${v}%`;
  if (v < 0) return `${v}%`;
  return '0%';
});

// Bar width for breakdown
const maxTypeCount = computed(() => {
  if (!stats.value?.byType) return 1;
  const counts = Object.values(stats.value.byType);
  return Math.max(...counts, 1);
});

function getBarWidth(type: string): string {
  if (!stats.value?.byType) return '0%';
  const count = stats.value.byType[type] || 0;
  return `${Math.round((count / maxTypeCount.value) * 100)}%`;
}

function onDateRangeChange() {
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    fetchStats({ start: dateRange.value[0], end: dateRange.value[1] });
  } else {
    fetchStats();
  }
}

onMounted(() => {
  fetchStats();
});
</script>

<style lang="scss" scoped>
.comm-stats {
  width: 100%;

  .stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 0.75rem;

    .stats-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
  }

  // Loading
  .stats-loading {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;

    .stat-skeleton {
      .skeleton-block {
        height: 100px;
        border-radius: 1rem;
        background: var(--glass-bg);
        animation: pulse 1.5s ease-in-out infinite;
      }
    }
  }

  // Stats grid
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;

    .stat-card {
      padding: 1.25rem;
      border-radius: 1rem;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border-color);
      box-shadow: var(--glass-shadow);
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
      }

      .stat-card-inner {
        display: flex;
        gap: 1rem;
        align-items: flex-start;

        .stat-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
          min-width: 0;

          .stat-label {
            font-size: 0.688rem;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--text-primary);
            font-variant-numeric: tabular-nums;
            line-height: 1.2;
          }

          .stat-extra {
            margin-top: 0.25rem;

            .extra-text {
              font-size: 0.688rem;
              color: var(--text-muted);
            }
          }
        }
      }
    }
  }

  // Breakdown
  .activity-breakdown {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border-color);
    border-radius: 1rem;
    padding: 1.25rem;
    box-shadow: var(--glass-shadow);

    .breakdown-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 1rem;
    }

    .breakdown-bars {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .breakdown-item {
        .breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.375rem;

          .breakdown-label {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-secondary);
          }

          .breakdown-count {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--text-primary);
            font-variant-numeric: tabular-nums;
          }
        }

        .breakdown-bar {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.05);
          overflow: hidden;

          .breakdown-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.6s ease;
            min-width: 2px;
          }
        }
      }
    }
  }

  // Empty
  .stats-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;

    .empty-icon {
      color: var(--text-muted);
      opacity: 0.3;
      margin-bottom: 1rem;
    }

    .empty-text {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
