<template lang="pug">
div
  //- Floating trigger button
  .coach-fab(@click="openCoach" v-if="!isOpen")
    Icon(name="ph:robot-bold" size="24")

  //- Slide-out drawer
  el-drawer(
    v-model="isOpen"
    :title="''"
    direction="rtl"
    size="420px"
    :show-close="true"
    class="coach-drawer"
  )
    template(#header)
      .drawer-header.flex.items-center.gap-3
        .coach-icon
          Icon(name="ph:robot-bold" size="22")
        div
          h3.text-lg.font-bold AI Sales Coach
          p.text-xs.text-secondary Powered by rule-based analysis

    .coach-content(v-loading="loading")
      //- Deal Analysis Mode
      template(v-if="dealAnalysis")
        .mb-6
          DealHealthScore(:score="dealAnalysis.winProbability" :status="dealAnalysis.healthStatus")

        NextBestAction(:actions="dealAnalysis.nextBestActions")

        //- Insights
        .insights-section.mt-6(v-if="dealAnalysis.insights.length")
          h3.section-title
            Icon.mr-2(name="ph:lightbulb-bold" size="18")
            | Insights
          .insight-item(v-for="(insight, i) in dealAnalysis.insights" :key="i")
            Icon.flex-shrink-0(name="ph:info-bold" size="16" style="color: var(--accent-color)")
            span {{ insight }}

      //- Pipeline Mode
      template(v-else-if="pipelineHealth")
        .pipeline-stats.grid.grid-cols-2.gap-3.mb-6
          .stat-card
            .stat-value.text-green-400 {{ pipelineHealth.healthy }}
            .stat-label Healthy
          .stat-card
            .stat-value.text-blue-400 {{ pipelineHealth.trendingUp }}
            .stat-label Trending Up
          .stat-card
            .stat-value.text-yellow-400 {{ pipelineHealth.stalling }}
            .stat-label Stalling
          .stat-card
            .stat-value.text-red-400 {{ pipelineHealth.atRisk }}
            .stat-label At Risk

        .pipeline-meta
          .meta-row
            span.meta-label Total Active Deals
            span.meta-value {{ pipelineHealth.totalDeals }}
          .meta-row
            span.meta-label Avg Deal Age
            span.meta-value {{ pipelineHealth.avgDealAge }} days
          .meta-row
            span.meta-label Avg Deal Value
            span.meta-value ${{ pipelineHealth.avgDealValue?.toLocaleString() }}

      //- Empty state
      template(v-else)
        .empty-state.text-center.py-12
          Icon.text-5xl.mb-4(name="ph:robot-bold" style="color: var(--accent-color); opacity: 0.3")
          p.text-secondary Navigate to a deal to get AI coaching insights
          el-button.mt-4(@click="loadPipeline" type="primary" plain) View Pipeline Health
</template>

<script setup lang="ts">
import DealHealthScore from './DealHealthScore.vue';
import NextBestAction from './NextBestAction.vue';
import { useSalesCoach } from '~/composables/useSalesCoach';

const props = defineProps<{
  dealId?: string;
}>();

const { dealAnalysis, pipelineHealth, loading, isOpen, analyzeDeal, fetchPipelineHealth, openCoach, closeCoach } = useSalesCoach();

async function loadPipeline() {
  await fetchPipelineHealth();
}

watch(
  () => props.dealId,
  async newId => {
    if (newId && isOpen.value) {
      await analyzeDeal(newId);
    }
  }
);

watch(isOpen, async open => {
  if (open && props.dealId) {
    await analyzeDeal(props.dealId);
  }
});
</script>

<style lang="scss" scoped>
.coach-fab {
  position: fixed;
  bottom: 90px;
  right: 24px;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--accent-color, #7849ff), var(--gradient-end, #a855f7));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 30px rgba(120, 73, 255, 0.4);
  transition: all 0.3s ease;
  z-index: 100;

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.5);
  }
}

.drawer-header {
  width: 100%;
}

.coach-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-color, #7849ff), var(--gradient-end, #a855f7));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-secondary {
  color: var(--text-secondary);
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--glass-bg-primary);
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
}

.stat-card {
  padding: 16px;
  border-radius: 12px;
  background: var(--glass-bg-primary);
  text-align: center;

  .stat-value {
    font-size: 28px;
    font-weight: 800;
  }
  .stat-label {
    font-size: 11px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }
}

.pipeline-meta {
  background: var(--glass-bg-primary);
  border-radius: 12px;
  padding: 16px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.meta-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.meta-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
