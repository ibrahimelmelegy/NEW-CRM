<template lang="pug">
.deal-score-card.glass-card
  //- Loading Skeleton
  template(v-if="isDealScoreLoading")
    .skeleton-container
      .skeleton-header
        .skeleton-circle
        .skeleton-lines
          .skeleton-line.w-32
          .skeleton-line.w-20
      .skeleton-factors
        .skeleton-factor(v-for="n in 3" :key="n")
          .skeleton-line.w-full
      .skeleton-line.w-24.mt-4

  //- Score Content
  template(v-else-if="dealScore")
    .score-header
      .score-gauge-wrapper
        .score-gauge
          svg.gauge-svg(viewBox="0 0 120 120")
            //- Background circle
            circle.gauge-bg(
              cx="60" cy="60" r="52"
              fill="none"
              stroke-width="8"
            )
            //- Progress circle
            circle.gauge-progress(
              cx="60" cy="60" r="52"
              fill="none"
              stroke-width="8"
              :stroke="gaugeColor"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="gaugeOffset"
              stroke-linecap="round"
            )
          .gauge-center
            span.gauge-value {{ dealScore.winProbability }}
            span.gauge-percent %
        .gauge-label {{ $t('ai.winProbability') }}

      .score-details
        .grade-badge(:class="gradeClass")
          span.grade-letter {{ dealScore.score }}
          span.grade-text {{ $t('ai.grade') }}
        h3.deal-name {{ dealScore.dealName }}
        p.scored-at {{ $t('ai.lastScored') }}: {{ formatDate(dealScore.scoredAt) }}

    //- Factors Section
    .factors-section
      h4.section-title
        Icon(name="ph:list-checks-bold" size="16")
        | {{ $t('ai.keyFactors') }}
      .factors-list
        .factor-item(
          v-for="factor in dealScore.factors"
          :key="factor.factor"
          :class="factor.impact"
        )
          .factor-icon
            Icon(
              :name="factor.impact === 'positive' ? 'ph:arrow-up-bold' : 'ph:arrow-down-bold'"
              size="14"
            )
          .factor-content
            span.factor-name {{ factor.factor }}
            span.factor-desc {{ factor.description }}

    //- Suggestions Section
    .suggestions-section(v-if="dealScore.suggestions.length > 0")
      h4.section-title
        Icon(name="ph:lightbulb-bold" size="16")
        | {{ $t('ai.suggestions') }}
      .suggestions-list
        .suggestion-item(v-for="(suggestion, i) in dealScore.suggestions" :key="i")
          Icon(name="ph:arrow-right-bold" size="12" class="suggestion-arrow")
          span {{ suggestion }}

    //- Refresh Button
    .score-footer
      el-button.refresh-btn(
        @click="handleRefresh"
        :loading="isDealScoreLoading"
        size="small"
      )
        Icon(name="ph:arrows-clockwise-bold" size="14" v-if="!isDealScoreLoading")
        span {{ $t('ai.refreshScore') }}

  //- Empty State
  template(v-else)
    .empty-score
      .empty-icon
        Icon(name="ph:chart-pie-bold" size="32")
      p {{ $t('ai.noScoreYet') }}
      el-button.refresh-btn(
        @click="handleRefresh"
        :loading="isDealScoreLoading"
        type="primary"
        size="small"
      )
        Icon(name="ph:sparkle-bold" size="14" v-if="!isDealScoreLoading")
        span {{ $t('ai.calculateScore') }}
</template>

<script setup lang="ts">
import { useAI, type DealScoreResult } from '~/composables/useAI';

const props = defineProps<{
    dealId: string;
}>();

const { t } = useI18n();
const { dealScore, isDealScoreLoading, scoreDeal } = useAI();

const circumference = 2 * Math.PI * 52; // ~326.7

const gaugeOffset = computed(() => {
    if (!dealScore.value) return circumference;
    const progress = dealScore.value.winProbability / 100;
    return circumference * (1 - progress);
});

const gaugeColor = computed(() => {
    if (!dealScore.value) return '#6b7280';
    const prob = dealScore.value.winProbability;
    if (prob >= 75) return '#10b981';
    if (prob >= 55) return '#3b82f6';
    if (prob >= 35) return '#f59e0b';
    return '#ef4444';
});

const gradeClass = computed(() => {
    if (!dealScore.value) return '';
    return `grade-${dealScore.value.score.toLowerCase()}`;
});

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

async function handleRefresh() {
    if (props.dealId) {
        await scoreDeal(props.dealId);
    }
}

// Auto-score on mount
onMounted(() => {
    if (props.dealId) {
        scoreDeal(props.dealId);
    }
});

// Re-score when dealId changes
watch(() => props.dealId, (newId) => {
    if (newId) {
        scoreDeal(newId);
    }
});
</script>

<style lang="scss" scoped>
.deal-score-card {
    padding: 20px;
    border-radius: 16px;
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border-color);
}

// ===== Score Header =====
.score-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--glass-border-color);
}

.score-gauge-wrapper {
    text-align: center;
}

.score-gauge {
    width: 100px;
    height: 100px;
    position: relative;

    .gauge-svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
    }

    .gauge-bg {
        stroke: rgba(124, 58, 237, 0.1);
    }

    .gauge-progress {
        transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease;
    }

    .gauge-center {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        .gauge-value {
            font-size: 28px;
            font-weight: 800;
            color: var(--text-primary);
            line-height: 1;
        }

        .gauge-percent {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-primary);
            opacity: 0.6;
            margin-top: 4px;
        }
    }
}

.gauge-label {
    font-size: 11px;
    color: var(--text-primary);
    opacity: 0.6;
    margin-top: 4px;
}

.score-details {
    flex: 1;

    .deal-name {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 6px 0 4px;
    }

    .scored-at {
        font-size: 11px;
        color: var(--text-primary);
        opacity: 0.5;
        margin: 0;
    }
}

.grade-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 8px;
    font-weight: 700;

    .grade-letter {
        font-size: 18px;
    }

    .grade-text {
        font-size: 10px;
        text-transform: uppercase;
        opacity: 0.8;
    }

    &.grade-a {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
    }

    &.grade-b {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
    }

    &.grade-c {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
    }

    &.grade-d {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
    }
}

// ===== Factors Section =====
.section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 10px;
}

.factors-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.factor-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.03);

    .factor-icon {
        width: 22px;
        height: 22px;
        min-width: 22px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 1px;
    }

    &.positive .factor-icon {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
    }

    &.negative .factor-icon {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
    }

    .factor-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .factor-name {
        font-size: 12px;
        font-weight: 700;
        color: var(--text-primary);
    }

    .factor-desc {
        font-size: 11px;
        color: var(--text-primary);
        opacity: 0.6;
        line-height: 1.4;
    }
}

// ===== Suggestions Section =====
.suggestions-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--glass-border-color);
}

.suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.suggestion-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    color: var(--text-primary);
    opacity: 0.8;
    line-height: 1.4;

    .suggestion-arrow {
        color: #7c3aed;
        min-width: 12px;
        margin-top: 2px;
    }
}

// ===== Footer =====
.score-footer {
    margin-top: 16px;
    display: flex;
    justify-content: center;
}

.refresh-btn {
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
}

// ===== Empty State =====
.empty-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px 0;
    text-align: center;

    .empty-icon {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: rgba(124, 58, 237, 0.1);
        color: #7c3aed;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    p {
        font-size: 13px;
        color: var(--text-primary);
        opacity: 0.6;
        margin: 0;
    }
}

// ===== Skeleton =====
.skeleton-container {
    animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-header {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
}

.skeleton-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(124, 58, 237, 0.08);
}

.skeleton-lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: center;
}

.skeleton-line {
    height: 12px;
    border-radius: 6px;
    background: rgba(124, 58, 237, 0.08);

    &.w-32 { width: 128px; }
    &.w-24 { width: 96px; }
    &.w-20 { width: 80px; }
    &.w-full { width: 100%; }
}

.skeleton-factors {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.skeleton-factor {
    height: 40px;
    border-radius: 10px;
    background: rgba(124, 58, 237, 0.05);
}

.mt-4 { margin-top: 16px; }

@keyframes skeleton-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
</style>
