<template lang="pug">
.challenge-card(:class="{ completed: challenge.completed }")
  .challenge-header.flex.items-center.gap-3
    .challenge-icon(:class="challenge.type")
      Icon(:name="challenge.icon || 'ph:target-bold'" size="20")
    div.flex-1
      .challenge-name {{ challenge.name }}
      .challenge-desc {{ challenge.description }}
    .challenge-badge(v-if="challenge.completed")
      Icon(name="ph:check-circle-fill" size="20")
  .challenge-progress.mt-3
    .progress-header.flex.justify-between.text-xs.mb-1
      span {{ challenge.progress }} / {{ challenge.target }}
      span {{ challenge.percentage }}%
    el-progress(
      :percentage="challenge.percentage"
      :stroke-width="8"
      :show-text="false"
      :color="challenge.completed ? '#22c55e' : 'var(--accent-color, #7849ff)'"
    )
  .challenge-reward.mt-2.text-xs
    Icon.mr-1(name="ph:star-bold" size="12" style="color: #fbbf24")
    span +{{ challenge.rewardPoints }} XP
</template>

<script setup lang="ts">
defineProps<{
  challenge: any;
}>();
</script>

<style lang="scss" scoped>
.challenge-card {
  padding: 16px;
  border-radius: 12px;
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border-color, rgba(255,255,255,0.08));
  transition: all 0.3s ease;

  &:hover { transform: translateY(-2px); }
  &.completed { opacity: 0.7; }
}

.challenge-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.weekly { background: rgba(120, 73, 255, 0.15); color: var(--accent-color, #7849ff); }
  &.monthly { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
}

.challenge-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.challenge-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.challenge-badge {
  color: #22c55e;
}

.progress-header {
  color: var(--text-secondary);
}

.challenge-reward {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
}
</style>
