<template lang="pug">
.sla-indicator.inline-flex.items-center.gap-1
  .w-2.h-2.rounded-full(:style="{ backgroundColor: indicatorColor }")
  span.text-xs.font-semibold(:style="{ color: indicatorColor }") {{ displayText }}
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  deadline: string;
  resolvedAt?: string;
}>();

const indicatorColor = computed(() => {
  if (isBreach.value) return '#f56c6c';
  if (isResolvedInTime.value) return '#67c23a';

  const hoursLeft = remainingHours.value;
  if (hoursLeft > 4) return '#67c23a';     // Green
  if (hoursLeft >= 1) return '#e6a23c';    // Yellow
  return '#f56c6c';                         // Red
});

const isBreach = computed(() => {
  if (!props.deadline) return false;
  const deadlineDate = new Date(props.deadline);
  // If resolved, check if it was resolved after deadline
  if (props.resolvedAt) {
    return new Date(props.resolvedAt) > deadlineDate;
  }
  // If not resolved, check if past deadline
  return new Date() > deadlineDate;
});

const isResolvedInTime = computed(() => {
  if (!props.resolvedAt || !props.deadline) return false;
  return new Date(props.resolvedAt) <= new Date(props.deadline);
});

const remainingHours = computed(() => {
  if (!props.deadline) return Infinity;
  if (props.resolvedAt) return Infinity;
  const diff = new Date(props.deadline).getTime() - new Date().getTime();
  return diff / (1000 * 60 * 60);
});

const displayText = computed(() => {
  if (isResolvedInTime.value) return 'Met';
  if (isBreach.value) return 'Breached';

  const hours = remainingHours.value;
  if (hours < 0) return 'Breached';
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m left`;
  }
  if (hours < 24) {
    return `${Math.round(hours)}h left`;
  }
  const days = Math.round(hours / 24);
  return `${days}d left`;
});
</script>

<style scoped>
.sla-indicator {
  white-space: nowrap;
}
</style>
