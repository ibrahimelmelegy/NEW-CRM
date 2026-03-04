<template lang="pug">
div(class="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5")
  //- Total Revenue (12mo)
  .impact-card
    .impact-label {{ $t('simulator.totalRevenue') }}
    .impact-values
      .impact-current
        span(class="text-[var(--text-secondary)] text-xs") {{ $t('simulator.current') }}
        span(class="text-[var(--text-primary)] text-lg font-bold") {{ formatCurrency(impact.totalRevenueCurrent) }}
      .impact-arrow
        Icon(
          :name="arrowIcon(impact.totalRevenueSimulated - impact.totalRevenueCurrent)"
          size="16"
          :class="deltaClass(impact.totalRevenueSimulated - impact.totalRevenueCurrent)"
        )
      .impact-projected
        span(class="text-[var(--text-secondary)] text-xs") {{ $t('simulator.projected') }}
        span(class="text-lg font-bold" :class="deltaClass(impact.totalRevenueSimulated - impact.totalRevenueCurrent)") {{ formatCurrency(impact.totalRevenueSimulated) }}

  //- Monthly Average
  .impact-card
    .impact-label {{ $t('simulator.monthlyAvg') }}
    .impact-values
      .impact-current
        span(class="text-[var(--text-secondary)] text-xs") {{ $t('simulator.current') }}
        span(class="text-[var(--text-primary)] text-lg font-bold") {{ formatCurrency(impact.monthlyAvgCurrent) }}
      .impact-arrow
        Icon(
          :name="arrowIcon(impact.monthlyAvgSimulated - impact.monthlyAvgCurrent)"
          size="16"
          :class="deltaClass(impact.monthlyAvgSimulated - impact.monthlyAvgCurrent)"
        )
      .impact-projected
        span(class="text-[var(--text-secondary)] text-xs") {{ $t('simulator.projected') }}
        span(class="text-lg font-bold" :class="deltaClass(impact.monthlyAvgSimulated - impact.monthlyAvgCurrent)") {{ formatCurrency(impact.monthlyAvgSimulated) }}

  //- Revenue Change
  .impact-card
    .impact-label {{ $t('simulator.revenueChange') }}
    .impact-values.flex-col.items-center
      span(class="text-2xl font-bold" :class="deltaClass(impact.revenueChange)")
        | {{ impact.revenueChange >= 0 ? '+' : '' }}{{ formatCurrency(impact.revenueChange) }}
      span(class="text-sm font-semibold" :class="deltaClass(impact.revenueChangePercent)")
        | {{ impact.revenueChangePercent >= 0 ? '+' : '' }}{{ impact.revenueChangePercent.toFixed(1) }}%

  //- Projected Deals
  .impact-card
    .impact-label {{ $t('simulator.dealsClosed') }}
    .impact-values.flex-col.items-center
      span(class="text-2xl font-bold text-[var(--text-primary)]") {{ impact.projectedDeals }}
      span(class="text-xs text-[var(--text-secondary)]") deals / year

  //- Win Rate Impact
  .impact-card
    .impact-label {{ $t('simulator.winRate') }}
    .impact-values
      .impact-current
        span(class="text-[var(--text-secondary)] text-xs") {{ $t('simulator.current') }}
        span(class="text-[var(--text-primary)] text-lg font-bold") {{ currentMetrics.winRate }}%
      .impact-arrow
        Icon(
          :name="arrowIcon(simulatedMetrics.winRate - currentMetrics.winRate)"
          size="16"
          :class="deltaClass(simulatedMetrics.winRate - currentMetrics.winRate)"
        )
      .impact-projected
        span(class="text-[var(--text-secondary)] text-xs") {{ $t('simulator.projected') }}
        span(class="text-lg font-bold" :class="deltaClass(simulatedMetrics.winRate - currentMetrics.winRate)") {{ simulatedMetrics.winRate }}%
</template>

<script setup lang="ts">
import type { SimulatorImpact, SimulatorSliders, SimulatorBaseline } from '~/composables/useRevenueSimulator';

defineProps<{
  impact: SimulatorImpact;
  currentMetrics: SimulatorBaseline;
  simulatedMetrics: SimulatorSliders;
}>();

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toLocaleString()}`;
}

function arrowIcon(delta: number): string {
  if (delta > 0) return 'ph:arrow-up-right-bold';
  if (delta < 0) return 'ph:arrow-down-right-bold';
  return 'ph:minus-bold';
}

function deltaClass(delta: number): string {
  if (delta > 0) return 'text-emerald-400';
  if (delta < 0) return 'text-red-400';
  return 'text-[var(--text-secondary)]';
}
</script>

<style lang="scss" scoped>
.impact-card {
  padding: 16px 20px;
  border-radius: 14px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.03));
  backdrop-filter: var(--glass-blur, blur(12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.06));
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--brand-primary, rgba(120, 73, 255, 0.3));
  }
}

.impact-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.impact-values {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.impact-current,
.impact-projected {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.impact-arrow {
  flex-shrink: 0;
  animation: pulse-arrow 2s ease-in-out infinite;
}

@keyframes pulse-arrow {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.15);
  }
}

.text-emerald-400 {
  color: #34d399;
}
.text-red-400 {
  color: #f87171;
}
</style>
