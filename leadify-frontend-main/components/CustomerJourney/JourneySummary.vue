<template lang="pug">
.journey-summary
  .journey-summary__grid
    //- Total Touchpoints
    .journey-summary__card
      .journey-summary__icon-wrap(style="background: rgba(59, 130, 246, 0.1)")
        Icon(name="ph:path-bold" size="22" style="color: #3b82f6")
      .journey-summary__data
        .journey-summary__value {{ summary.totalTouchpoints }}
        .journey-summary__label {{ $t('journey.totalTouchpoints') }}

    //- Journey Duration
    .journey-summary__card
      .journey-summary__icon-wrap(style="background: rgba(139, 92, 246, 0.1)")
        Icon(name="ph:timer-bold" size="22" style="color: #8b5cf6")
      .journey-summary__data
        .journey-summary__value {{ summary.journeyDurationDays }}
          span(class="text-sm font-normal ml-1" style="color: var(--text-muted)") {{ $t('journey.days') }}
        .journey-summary__label {{ $t('journey.journeyDuration') }}

    //- Avg Days Between Touchpoints
    .journey-summary__card
      .journey-summary__icon-wrap(style="background: rgba(16, 185, 129, 0.1)")
        Icon(name="ph:chart-line-bold" size="22" style="color: #10b981")
      .journey-summary__data
        .journey-summary__value {{ summary.avgDaysBetweenTouchpoints }}
          span(class="text-sm font-normal ml-1" style="color: var(--text-muted)") {{ $t('journey.days') }}
        .journey-summary__label {{ $t('journey.avgTimeBetween') }}

    //- First Contact
    .journey-summary__card
      .journey-summary__icon-wrap(style="background: rgba(245, 158, 11, 0.1)")
        Icon(name="ph:flag-bold" size="22" style="color: #f59e0b")
      .journey-summary__data
        .journey-summary__value.text-base {{ formatShortDate(summary.firstContact) }}
        .journey-summary__label {{ $t('journey.firstContact') }}

    //- Last Contact
    .journey-summary__card
      .journey-summary__icon-wrap(style="background: rgba(239, 68, 68, 0.1)")
        Icon(name="ph:flag-checkered-bold" size="22" style="color: #ef4444")
      .journey-summary__data
        .journey-summary__value.text-base {{ formatShortDate(summary.lastContact) }}
        .journey-summary__label {{ $t('journey.lastContact') }}
</template>

<script lang="ts" setup>
import type { JourneySummary } from '~/composables/useCustomerJourney';

defineProps<{
  summary: JourneySummary;
}>();

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<style scoped lang="scss">
.journey-summary {
  &__grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  &__card {
    background: var(--glass-bg, rgba(255, 255, 255, 0.8));
    backdrop-filter: blur(var(--glass-blur, 12px));
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }
  }

  &__icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__data {
    min-width: 0;
  }

  &__value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
  }

  &__label {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
