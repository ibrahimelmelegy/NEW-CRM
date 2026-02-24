<template lang="pug">
.tour-launcher.glass-card.rounded-2xl.p-6
  .flex.items-center.gap-3.mb-4
    Icon.text-purple-400(name="ph:rocket-launch-bold" size="24")
    h3.text-lg.font-bold.text-white Getting Started

  .space-y-3
    .tour-item(
      v-for="tour in tours"
      :key="tour.id"
      @click="startTour(tour.id)"
      :class="{ completed: isTourCompleted(tour.id) }"
    )
      .flex.items-center.justify-between
        .flex.items-center.gap-3
          .tour-icon-circle(:class="{ done: isTourCompleted(tour.id) }")
            Icon(:name="isTourCompleted(tour.id) ? 'ph:check-bold' : 'ph:play-bold'" size="14")
          .tour-info
            span.text-sm.font-medium.text-white {{ tour.name }}
            span.text-xs.text-gray-400 {{ tour.steps.length }} steps
        Icon.text-gray-500(name="ph:arrow-right" size="16")

  .mt-4.pt-4(
    :style="{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }"
    v-if="completedTours.length > 0"
  )
    button.tour-reset-btn(@click="resetTours") Reset all tours
</template>

<script setup lang="ts">
import { useOnboarding } from '~/composables/useOnboarding';

const { tours, completedTours, startTour, resetTours, isTourCompleted } = useOnboarding();
</script>

<style lang="scss" scoped>
.tour-launcher {
  background: var(--glass-bg-primary, rgba(15, 15, 30, 0.8));
  backdrop-filter: var(--glass-blur, blur(16px));
  -webkit-backdrop-filter: var(--glass-blur, blur(16px));
  border: 1px solid var(--glass-border-color, rgba(255, 255, 255, 0.08));
}

.tour-item {
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);

  &:hover {
    background: rgba(120, 73, 255, 0.08);
    border-color: rgba(120, 73, 255, 0.2);
  }

  &.completed {
    opacity: 0.6;

    &:hover {
      opacity: 0.8;
    }
  }
}

.tour-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(120, 73, 255, 0.15);
  color: var(--accent-color, #7849ff);
  flex-shrink: 0;
  transition: all 0.2s ease;

  &.done {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
}

.tour-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tour-reset-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;

  &:hover {
    color: white;
  }
}
</style>
