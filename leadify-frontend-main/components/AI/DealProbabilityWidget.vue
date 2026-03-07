<template lang="pug">
.deal-probability-widget.glass-card
  //- Loading
  template(v-if="isDealProbabilityLoading")
    .skeleton-container
      .skeleton-header
        .skeleton-circle
        .skeleton-lines
          .skeleton-line.w-32
          .skeleton-line.w-20
      .skeleton-factors
        .skeleton-factor(v-for="n in 3" :key="n")
          .skeleton-line.w-full

  //- Probability Content
  template(v-else-if="dealProbability")
    .probability-header
      .probability-gauge-wrapper
        .probability-gauge
          svg.gauge-svg(viewBox="0 0 120 120")
            circle.gauge-bg(cx="60" cy="60" r="52" fill="none" stroke-width="8")
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
            span.gauge-value {{ dealProbability.probability }}
            span.gauge-percent %
        .gauge-label {{ $t('aiAssistantExpanded.winProbability') }}

      .probability-details
        .grade-badge(:class="'grade-' + dealProbability.grade.toLowerCase()")
          span.grade-letter {{ dealProbability.grade }}
          span.grade-text {{ $t('aiAssistantExpanded.grade') }}
        h3.deal-name {{ dealProbability.dealName }}
        .meta-row
          el-tag(
            :type="dealProbability.confidence === 'high' ? 'success' : dealProbability.confidence === 'medium' ? 'warning' : 'info'"
            size="small"
            effect="plain"
            round
          ) {{ $t('aiAssistantExpanded.confidence_' + dealProbability.confidence) }}
          span.pipeline-rank {{ dealProbability.comparisons.pipelineRank }}

    //- Positive Signals
    .signals-section(v-if="dealProbability.positiveSignals.length > 0")
      h4.section-title.section-positive
        Icon(name="ph:check-circle-bold" size="16")
        | {{ $t('aiAssistantExpanded.positiveSignals') }}
      .signal-item(v-for="(signal, i) in dealProbability.positiveSignals" :key="'p' + i" class="positive")
        Icon(name="ph:check-bold" size="12" class="signal-icon")
        span {{ signal }}

    //- Risk Factors
    .signals-section(v-if="dealProbability.riskFactors.length > 0")
      h4.section-title.section-risk
        Icon(name="ph:warning-circle-bold" size="16")
        | {{ $t('aiAssistantExpanded.riskFactors') }}
      .signal-item(v-for="(risk, i) in dealProbability.riskFactors" :key="'r' + i" class="negative")
        Icon(name="ph:x-bold" size="12" class="signal-icon")
        span {{ risk }}

    //- Next Steps
    .signals-section(v-if="dealProbability.nextSteps.length > 0")
      h4.section-title.section-steps
        Icon(name="ph:footprints-bold" size="16")
        | {{ $t('aiAssistantExpanded.nextSteps') }}
      .signal-item(v-for="(step, i) in dealProbability.nextSteps" :key="'s' + i" class="action")
        Icon(name="ph:arrow-right-bold" size="12" class="signal-icon")
        span {{ step }}

    //- Refresh
    .score-footer
      el-button.refresh-btn(
        @click="handleRefresh"
        :loading="isDealProbabilityLoading"
        size="small"
      )
        Icon(name="ph:arrows-clockwise-bold" size="14" v-if="!isDealProbabilityLoading")
        span {{ $t('aiAssistantExpanded.refreshAnalysis') }}

  //- Empty
  template(v-else)
    .empty-score
      .empty-icon
        Icon(name="ph:chart-line-up-bold" size="32")
      p {{ $t('aiAssistantExpanded.noProbability') }}
      el-button.refresh-btn(
        @click="handleRefresh"
        :loading="isDealProbabilityLoading"
        type="primary"
        size="small"
      )
        Icon(name="ph:sparkle-bold" size="14" v-if="!isDealProbabilityLoading")
        span {{ $t('aiAssistantExpanded.analyzeDeal') }}
</template>

<script setup lang="ts">
import { useAiAssistant } from '~/composables/useAiAssistant';

const props = defineProps<{
  dealId: string;
}>();

const { dealProbability, isDealProbabilityLoading, calculateDealProbability } = useAiAssistant();

const circumference = 2 * Math.PI * 52;

const gaugeOffset = computed(() => {
  if (!dealProbability.value) return circumference;
  return circumference * (1 - dealProbability.value.probability / 100);
});

const gaugeColor = computed(() => {
  if (!dealProbability.value) return '#6b7280';
  const prob = dealProbability.value.probability;
  if (prob >= 75) return '#22c55e';
  if (prob >= 55) return '#3b82f6';
  if (prob >= 35) return '#f59e0b';
  return '#ef4444';
});

async function handleRefresh() {
  if (props.dealId) await calculateDealProbability(props.dealId);
}

onMounted(() => {
  if (props.dealId) calculateDealProbability(props.dealId);
});

watch(
  () => props.dealId,
  newId => {
    if (newId) calculateDealProbability(newId);
  }
);
</script>

<style lang="scss" scoped>
.deal-probability-widget {
  padding: 20px;
  border-radius: 16px;
  background: var(--glass-bg, var(--bg-elevated));
  backdrop-filter: var(--glass-blur, blur(12px));
  border: 1px solid var(--glass-border-color, var(--border-default));
}

.probability-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--glass-border-color, var(--border-default));
}

.probability-gauge-wrapper {
  text-align: center;
}

.probability-gauge {
  width: 100px;
  height: 100px;
  position: relative;

  .gauge-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  .gauge-bg {
    stroke: rgba(120, 73, 255, 0.1);
  }
  .gauge-progress {
    transition:
      stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1),
      stroke 0.3s ease;
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

.probability-details {
  flex: 1;

  .deal-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 6px 0 4px;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }

  .pipeline-rank {
    font-size: 11px;
    color: var(--text-primary);
    opacity: 0.5;
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
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
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
  &.grade-f {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
}

.signals-section {
  margin-top: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;

  &.section-positive {
    color: #22c55e;
  }
  &.section-risk {
    color: #ef4444;
  }
  &.section-steps {
    color: #3b82f6;
  }
}

.signal-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: var(--text-primary);
  opacity: 0.8;
  line-height: 1.4;
  padding: 4px 0;

  .signal-icon {
    min-width: 12px;
    margin-top: 2px;
  }

  &.positive .signal-icon {
    color: #22c55e;
  }
  &.negative .signal-icon {
    color: #ef4444;
  }
  &.action .signal-icon {
    color: #3b82f6;
  }
}

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
    background: rgba(120, 73, 255, 0.1);
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

// Skeleton
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
  background: rgba(120, 73, 255, 0.08);
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
  background: rgba(120, 73, 255, 0.08);
  &.w-32 {
    width: 128px;
  }
  &.w-20 {
    width: 80px;
  }
  &.w-full {
    width: 100%;
  }
}
.skeleton-factors {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skeleton-factor {
  height: 40px;
  border-radius: 10px;
  background: rgba(120, 73, 255, 0.05);
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
</style>
