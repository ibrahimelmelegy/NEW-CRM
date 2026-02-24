<template lang="pug">
div(class="simulator-page space-y-8 pb-8")
  //- Header
  .flex.items-center.justify-between.flex-wrap.gap-4
    div
      h1(class="text-2xl font-bold text-[var(--text-primary)]") {{ $t('simulator.title') }}
      p(class="text-sm text-[var(--text-secondary)] mt-1") {{ $t('simulator.subtitle') }}
    .flex.items-center.gap-2.flex-wrap
      el-button(size="small" @click="applyPreset('conservative')")
        Icon(name="ph:shield-check" size="14" class="mr-1")
        span {{ $t('simulator.conservative') }}
      el-button(size="small" @click="applyPreset('current')")
        Icon(name="ph:equals" size="14" class="mr-1")
        span {{ $t('simulator.currentPace') }}
      el-button(size="small" type="primary" @click="applyPreset('aggressive')")
        Icon(name="ph:rocket-launch" size="14" class="mr-1")
        span {{ $t('simulator.aggressive') }}
      el-button(size="small" @click="reset")
        Icon(name="ph:arrow-counter-clockwise" size="16")
        span(class="ml-1") {{ $t('simulator.reset') }}

  //- Loading state
  .flex.justify-center.py-20(v-if="loading")
    el-skeleton(:rows="8" animated)

  template(v-else)
    //- Impact Cards
    ImpactCards(
      :impact="impact"
      :current-metrics="baseline"
      :simulated-metrics="sliders"
    )

    //- Main Content: Sliders + Chart
    .grid.gap-8(class="grid-cols-1 lg:grid-cols-3")
      //- Sliders Panel
      .glass-card.p-6(class="lg:col-span-1")
        h3(class="text-lg font-semibold mb-6 text-[var(--text-primary)]")
          Icon(name="ph:sliders-horizontal-bold" size="20" class="mr-2 align-middle")
          | {{ $t('simulator.adjustParameters') }}
        .space-y-4
          SimulatorSlider(
            :model-value="sliders.conversionRate"
            @update:model-value="sliders.conversionRate = $event"
            :label="$t('simulator.conversionRate')"
            :min="0"
            :max="100"
            :step="1"
            :baseline="baseline.conversionRate"
            unit="%"
          )
          SimulatorSlider(
            :model-value="sliders.avgDealSize"
            @update:model-value="sliders.avgDealSize = $event"
            :label="$t('simulator.avgDealSize')"
            :min="0"
            :max="500000"
            :step="1000"
            :baseline="baseline.avgDealSize"
            unit="$"
          )
          SimulatorSlider(
            :model-value="sliders.salesCycleLength"
            @update:model-value="sliders.salesCycleLength = $event"
            :label="$t('simulator.salesCycle')"
            :min="1"
            :max="180"
            :step="1"
            :baseline="baseline.salesCycleLength"
            unit=" days"
          )
          SimulatorSlider(
            :model-value="sliders.newLeadsPerMonth"
            @update:model-value="sliders.newLeadsPerMonth = $event"
            :label="$t('simulator.newLeadsMonth')"
            :min="0"
            :max="500"
            :step="5"
            :baseline="baseline.newLeadsPerMonth"
            unit=""
          )
          SimulatorSlider(
            :model-value="sliders.winRate"
            @update:model-value="sliders.winRate = $event"
            :label="$t('simulator.winRate')"
            :min="0"
            :max="100"
            :step="1"
            :baseline="baseline.winRate"
            unit="%"
          )

      //- Chart Panel
      .glass-card.p-6(class="lg:col-span-2")
        h3(class="text-lg font-semibold mb-4 text-[var(--text-primary)]")
          Icon(name="ph:chart-line-up-bold" size="20" class="mr-2 align-middle")
          | {{ $t('simulator.revenueProjection') }}
        ProjectionChart(
          :current-data="currentProjection"
          :simulated-data="simulatedProjection"
          :months="monthLabels"
        )
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRevenueSimulator } from '~/composables/useRevenueSimulator';
import SimulatorSlider from '~/components/Simulator/SimulatorSlider.vue';
import ProjectionChart from '~/components/Simulator/ProjectionChart.vue';
import ImpactCards from '~/components/Simulator/ImpactCards.vue';

definePageMeta({ layout: 'default' });

const { loading, baseline, sliders, currentProjection, simulatedProjection, monthLabels, impact, applyPreset, reset, fetchBaseline } =
  useRevenueSimulator();

onMounted(async () => {
  await fetchBaseline();
});
</script>

<style lang="scss" scoped>
.simulator-page {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
