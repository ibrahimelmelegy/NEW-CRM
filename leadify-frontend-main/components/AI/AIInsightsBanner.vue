<template lang="pug">
.ai-insights-banner
  //- Loading Skeleton
  template(v-if="isInsightsLoading")
    .insights-skeleton
      .skeleton-pill
      .insights-skeleton-grid
        .skeleton-insight(v-for="n in 3" :key="n")
          .skeleton-icon-box
          .skeleton-text-group
            .skeleton-line.w-40
            .skeleton-line.w-64
          .skeleton-action

  //- Insights Content
  template(v-else-if="insights.length > 0")
    .insights-header
      .flex.items-center.gap-2
        .insights-icon
          Icon(name="ph:sparkle-bold" size="18" class="text-white")
        h3.insights-title {{ $t('ai.dailyInsights') }}
      .insights-actions
        el-tooltip(:content="$t('ai.refreshInsights')" placement="top")
          button.refresh-icon-btn(@click="refreshInsights" :disabled="isInsightsLoading")
            Icon(name="ph:arrows-clockwise-bold" size="16" :class="{ 'animate-spin': isInsightsLoading }")

    .insights-grid
      transition-group(name="insight-list" tag="div" class="insights-grid-inner")
        .insight-card(
          v-for="insight in insights"
          :key="insight.id"
          :class="'type-' + insight.type"
        )
          .insight-icon-wrapper(:class="'icon-' + insight.type")
            Icon(:name="insight.icon" size="20")

          .insight-content
            .insight-title-row
              h4.insight-title {{ insight.title }}
              .insight-metric(v-if="insight.metric") {{ insight.metric }}
            p.insight-description {{ insight.description }}

          .insight-actions-row
            el-button.insight-action-btn(
              v-if="insight.action"
              size="small"
              @click="handleAction(insight.action)"
            )
              | {{ insight.action.label }}
              Icon(name="ph:arrow-right-bold" size="12")
            button.dismiss-btn(@click="handleDismiss(insight.id)")
              Icon(name="ph:x-bold" size="12")

  //- Empty state (no insights)
  template(v-else-if="!isInsightsLoading && loaded")
    .insights-empty
      .insights-header
        .flex.items-center.gap-2
          .insights-icon
            Icon(name="ph:sparkle-bold" size="18" class="text-white")
          h3.insights-title {{ $t('ai.dailyInsights') }}
        .insights-actions
          el-tooltip(:content="$t('ai.refreshInsights')" placement="top")
            button.refresh-icon-btn(@click="refreshInsights")
              Icon(name="ph:arrows-clockwise-bold" size="16")
      p.empty-text {{ $t('ai.noInsightsToday') }}
</template>

<script setup lang="ts">
import { useAI } from '~/composables/useAI';

const router = useRouter();
const { insights, isInsightsLoading, getDailyInsights, dismissInsight } = useAI();
const loaded = ref(false);

async function refreshInsights() {
  await getDailyInsights();
  loaded.value = true;
}

function handleAction(action: { label: string; route: string }) {
  if (action.route) {
    router.push(action.route);
  }
}

function handleDismiss(insightId: string) {
  dismissInsight(insightId);
}

onMounted(() => {
  refreshInsights();
});
</script>

<style lang="scss" scoped>
.ai-insights-banner {
  margin-bottom: 20px;
  border-radius: 16px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border-color);
  box-shadow: var(--glass-shadow);
  padding: 16px 20px;
  overflow: hidden;
}

.insights-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;

  .insights-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .insights-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
}

.refresh-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(124, 58, 237, 0.08);
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;

  &:hover {
    opacity: 1;
    background: rgba(124, 58, 237, 0.15);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }
}

.insights-grid-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.insight-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid transparent;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &.type-warning {
    border-color: rgba(245, 158, 11, 0.15);
    .insight-title {
      color: #f59e0b;
    }
  }

  &.type-success {
    border-color: rgba(16, 185, 129, 0.15);
    .insight-title {
      color: #10b981;
    }
  }

  &.type-info {
    border-color: rgba(59, 130, 246, 0.15);
    .insight-title {
      color: #3b82f6;
    }
  }

  &.type-danger {
    border-color: rgba(239, 68, 68, 0.15);
    .insight-title {
      color: #ef4444;
    }
  }
}

.insight-icon-wrapper {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.icon-warning {
    background: rgba(245, 158, 11, 0.12);
    color: #f59e0b;
  }

  &.icon-success {
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;
  }

  &.icon-info {
    background: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
  }

  &.icon-danger {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
  }
}

.insight-content {
  flex: 1;
  min-width: 0;
}

.insight-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.insight-title {
  font-size: 13px;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}

.insight-metric {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  background: rgba(124, 58, 237, 0.08);
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.insight-description {
  font-size: 12px;
  color: var(--text-primary);
  opacity: 0.7;
  margin: 4px 0 0;
  line-height: 1.4;
}

.insight-actions-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-direction: column;
  margin-top: 4px;

  .insight-action-btn {
    border-radius: 8px;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 4px;
    border-color: rgba(124, 58, 237, 0.3);
    color: #7c3aed;
    padding: 4px 10px;
    height: auto;

    &:hover {
      border-color: #7c3aed;
      background: rgba(124, 58, 237, 0.06);
    }
  }

  .dismiss-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--text-primary);
    opacity: 0;
    cursor: pointer;
    transition: all 0.2s;

    .insight-card:hover & {
      opacity: 0.4;
    }

    &:hover {
      opacity: 0.8 !important;
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }
}

// ===== Empty State =====
.insights-empty {
  text-align: center;

  .empty-text {
    font-size: 13px;
    color: var(--text-primary);
    opacity: 0.5;
    margin: 0;
  }
}

// ===== Skeleton =====
.insights-skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-pill {
  height: 24px;
  width: 140px;
  border-radius: 8px;
  background: rgba(124, 58, 237, 0.08);
  margin-bottom: 14px;
}

.insights-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.skeleton-insight {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.02);
}

.skeleton-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(124, 58, 237, 0.06);
}

.skeleton-text-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-line {
  height: 10px;
  border-radius: 4px;
  background: rgba(124, 58, 237, 0.06);

  &.w-40 {
    width: 100px;
  }
  &.w-64 {
    width: 200px;
  }
}

.skeleton-action {
  width: 60px;
  height: 24px;
  border-radius: 6px;
  background: rgba(124, 58, 237, 0.06);
}

// ===== Transitions =====
.insight-list-enter-active,
.insight-list-leave-active {
  transition: all 0.4s ease;
}
.insight-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.insight-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
