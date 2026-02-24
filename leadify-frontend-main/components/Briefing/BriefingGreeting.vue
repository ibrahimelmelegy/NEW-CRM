<template lang="pug">
.briefing-greeting(:class="`briefing-greeting--${greeting.timeOfDay}`")
  .briefing-greeting__overlay
  .briefing-greeting__content.relative.z-10
    .flex.items-center.gap-4.mb-3
      .briefing-greeting__icon-wrap
        Icon(:name="greeting.icon" size="36" class="text-white")
      div
        h1(class="text-2xl md:text-3xl font-bold text-white") {{ $t(greeting.message) }}, {{ userName }}
        p(class="text-sm text-white/70 mt-1") {{ formattedDate }}
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BriefingGreeting } from '~/composables/useDailyBriefing';

const props = defineProps<{
  greeting: BriefingGreeting;
  userName: string;
}>();

const formattedDate = computed(() => {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});
</script>

<style lang="scss" scoped>
.briefing-greeting {
  position: relative;
  border-radius: 20px;
  padding: 32px;
  overflow: hidden;
  min-height: 140px;
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &--morning {
    background: linear-gradient(135deg, #f97316 0%, #ec4899 50%, #f59e0b 100%);
    background-size: 200% 200%;
    animation: gradientShift 8s ease infinite;
  }

  &--afternoon {
    background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #2563eb 100%);
    background-size: 200% 200%;
    animation: gradientShift 8s ease infinite;
  }

  &--evening {
    background: linear-gradient(135deg, #8b5cf6 0%, #f97316 50%, #a855f7 100%);
    background-size: 200% 200%;
    animation: gradientShift 8s ease infinite;
  }

  &--night {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%);
    background-size: 200% 200%;
    animation: gradientShift 8s ease infinite;
  }
}

.briefing-greeting__overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.briefing-greeting__content {
  width: 100%;
}

.briefing-greeting__icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
