<template lang="pug">
.level-progress
  .level-info.flex.items-center.justify-between.mb-2
    .flex.items-center.gap-2
      .level-badge Level {{ level }}
      span.text-secondary.text-xs {{ totalPoints }} XP
    .text-xs.text-secondary {{ nextLevelPoints }} XP to next
  .xp-bar
    .xp-fill(:style="{ width: `${progress}%` }")
    .xp-glow(:style="{ left: `${progress}%` }")
</template>

<script setup lang="ts">
defineProps<{
  level: number;
  totalPoints: number;
  nextLevelPoints: number;
  progress: number;
}>();
</script>

<style lang="scss" scoped>
.level-progress {
  padding: 16px;
}

.text-secondary {
  color: var(--text-secondary);
}

.level-badge {
  background: linear-gradient(135deg, var(--accent-color, #7849ff), var(--gradient-end, #a855f7));
  color: white;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 800;
}

.xp-bar {
  position: relative;
  height: 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 5px;
  overflow: hidden;
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color, #7849ff), var(--gradient-end, #a855f7));
  border-radius: 5px;
  transition: width 1s ease;
}

.xp-glow {
  position: absolute;
  top: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 12px var(--accent-color, #7849ff);
  transform: translateX(-50%);
  transition: left 1s ease;
}
</style>
