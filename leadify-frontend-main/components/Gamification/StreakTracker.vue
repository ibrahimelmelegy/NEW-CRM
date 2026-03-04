<template lang="pug">
.streak-tracker.flex.items-center.gap-6
  .streak-current.text-center
    .streak-flame
      Icon(name="ph:flame-bold" size="32" :style="{ color: current > 0 ? '#f59e0b' : '#6b7280' }")
    .streak-number {{ current }}
    .streak-label Current
  .streak-divider
  .streak-best.text-center
    .streak-number.text-secondary {{ longest }}
    .streak-label Best
</template>

<script setup lang="ts">
defineProps<{
  current: number;
  longest: number;
}>();
</script>

<style lang="scss" scoped>
.streak-tracker {
  padding: 16px;
  justify-content: center;
}

.streak-flame {
  animation: flicker 1.5s infinite alternate;
}

.streak-number {
  font-size: 32px;
  font-weight: 900;
  color: var(--text-primary);

  &.text-secondary {
    color: var(--text-secondary);
    font-size: 24px;
  }
}

.streak-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.streak-divider {
  width: 1px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
}

@keyframes flicker {
  0% {
    transform: scale(1) rotate(-2deg);
  }
  100% {
    transform: scale(1.1) rotate(2deg);
  }
}
</style>
