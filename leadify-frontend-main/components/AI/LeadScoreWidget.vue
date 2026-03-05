<template lang="pug">
.lead-score-widget.glass-card
  //- Loading
  template(v-if="isLeadScoreLoading")
    .skeleton-container
      .skeleton-header
        .skeleton-circle
        .skeleton-lines
          .skeleton-line.w-32
          .skeleton-line.w-20
      .skeleton-factors
        .skeleton-factor(v-for="n in 3" :key="n")
          .skeleton-line.w-full

  //- Score Content
  template(v-else-if="leadScore")
    .score-header
      .score-gauge-wrapper
        .score-gauge
          svg.gauge-svg(viewBox="0 0 120 120")
            circle.gauge-bg(
              cx="60" cy="60" r="52"
              fill="none"
              stroke-width="8"
            )
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
            span.gauge-value {{ leadScore.qualityScore }}
            span.gauge-percent /100
        .gauge-label {{ $t('aiAssistantExpanded.qualityScore') }}

      .score-details
        .tier-badge(:class="'tier-' + leadScore.tier")
          span.tier-text {{ $t('aiAssistantExpanded.tier_' + leadScore.tier) }}
        h3.entity-name {{ leadScore.leadName }}
        p.scored-at {{ $t('aiAssistantExpanded.scored') }}: {{ formatTime(leadScore.scoredAt) }}

    //- Top Factors
    .factors-section(v-if="leadScore.factors.length > 0")
      h4.section-title
        Icon(name="ph:list-checks-bold" size="16")
        | {{ $t('aiAssistantExpanded.keyFactors') }}
      .factors-list
        .factor-item(
          v-for="factor in leadScore.factors.slice(0, 5)"
          :key="factor.name"
          :class="factor.impact"
        )
          .factor-icon
            Icon(
              :name="factor.impact === 'positive' ? 'ph:arrow-up-bold' : factor.impact === 'negative' ? 'ph:arrow-down-bold' : 'ph:minus-bold'"
              size="14"
            )
          .factor-content
            span.factor-name {{ factor.name }}
            span.factor-desc {{ factor.detail }}

    //- Recommendations
    .recommendations-section(v-if="leadScore.recommendations.length > 0")
      h4.section-title
        Icon(name="ph:lightbulb-bold" size="16")
        | {{ $t('aiAssistantExpanded.recommendations') }}
      .recommendations-list
        .recommendation-item(v-for="(rec, i) in leadScore.recommendations" :key="i")
          Icon(name="ph:arrow-right-bold" size="12" class="rec-arrow")
          span {{ rec }}

    //- Refresh
    .score-footer
      el-button.refresh-btn(
        @click="handleRefresh"
        :loading="isLeadScoreLoading"
        size="small"
      )
        Icon(name="ph:arrows-clockwise-bold" size="14" v-if="!isLeadScoreLoading")
        span {{ $t('aiAssistantExpanded.refreshScore') }}

  //- Empty
  template(v-else)
    .empty-score
      .empty-icon
        Icon(name="ph:user-circle-check-bold" size="32")
      p {{ $t('aiAssistantExpanded.noLeadScore') }}
      el-button.refresh-btn(
        @click="handleRefresh"
        :loading="isLeadScoreLoading"
        type="primary"
        size="small"
      )
        Icon(name="ph:sparkle-bold" size="14" v-if="!isLeadScoreLoading")
        span {{ $t('aiAssistantExpanded.analyzeLeadQuality') }}
</template>

<script setup lang="ts">
import { useAiAssistant } from '~/composables/useAiAssistant';

const props = defineProps<{
  leadId: string;
}>();

const { leadScore, isLeadScoreLoading, scoreLeadQuality } = useAiAssistant();

const circumference = 2 * Math.PI * 52;

const gaugeOffset = computed(() => {
  if (!leadScore.value) return circumference;
  const progress = leadScore.value.qualityScore / 100;
  return circumference * (1 - progress);
});

const gaugeColor = computed(() => {
  if (!leadScore.value) return '#6b7280';
  const score = leadScore.value.qualityScore;
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
});

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function handleRefresh() {
  if (props.leadId) {
    await scoreLeadQuality(props.leadId);
  }
}

onMounted(() => {
  if (props.leadId) {
    scoreLeadQuality(props.leadId);
  }
});

watch(() => props.leadId, (newId) => {
  if (newId) scoreLeadQuality(newId);
});
</script>

<style lang="scss" scoped>
.lead-score-widget {
  padding: 20px;
  border-radius: 16px;
  background: var(--glass-bg, var(--bg-elevated));
  backdrop-filter: var(--glass-blur, blur(12px));
  border: 1px solid var(--glass-border-color, var(--border-default));
}

.score-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--glass-border-color, var(--border-default));
}

.score-gauge-wrapper { text-align: center; }

.score-gauge {
  width: 100px;
  height: 100px;
  position: relative;

  .gauge-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .gauge-bg { stroke: rgba(120, 73, 255, 0.1); }

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
      font-size: 11px;
      font-weight: 600;
      color: var(--text-primary);
      opacity: 0.5;
      margin-top: 6px;
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

  .entity-name {
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

.tier-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;

  &.tier-hot {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
  &.tier-warm {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }
  &.tier-cold {
    background: rgba(148, 163, 184, 0.15);
    color: #94a3b8;
  }
}

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
  gap: 6px;
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
  }

  &.positive .factor-icon { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
  &.negative .factor-icon { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
  &.neutral .factor-icon { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

  .factor-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .factor-name { font-size: 12px; font-weight: 700; color: var(--text-primary); }
  .factor-desc { font-size: 11px; color: var(--text-primary); opacity: 0.6; line-height: 1.4; }
}

.recommendations-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--glass-border-color, var(--border-default));
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: var(--text-primary);
  opacity: 0.8;
  line-height: 1.4;

  .rec-arrow {
    color: #7c3aed;
    min-width: 12px;
    margin-top: 2px;
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

.skeleton-container { animation: skeleton-pulse 1.5s ease-in-out infinite; }
.skeleton-header { display: flex; gap: 16px; margin-bottom: 20px; }
.skeleton-circle { width: 80px; height: 80px; border-radius: 50%; background: rgba(120, 73, 255, 0.08); }
.skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
.skeleton-line {
  height: 12px; border-radius: 6px; background: rgba(120, 73, 255, 0.08);
  &.w-32 { width: 128px; }
  &.w-20 { width: 80px; }
  &.w-full { width: 100%; }
}
.skeleton-factors { display: flex; flex-direction: column; gap: 10px; }
.skeleton-factor { height: 40px; border-radius: 10px; background: rgba(120, 73, 255, 0.05); }

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
