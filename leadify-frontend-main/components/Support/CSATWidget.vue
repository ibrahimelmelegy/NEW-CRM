<template lang="pug">
.csat-widget
  .flex.items-center.gap-1
    button.star-button(
      v-for="star in 5"
      :key="star"
      @click="handleRate(star)"
      :class="{ active: star <= (hovered || currentRating) }"
      @mouseenter="hovered = star"
      @mouseleave="hovered = 0"
    )
      el-icon(:size="28")
        StarFilled

  .flex.items-center.gap-2.mt-2(v-if="currentRating")
    span.text-sm.font-semibold(:style="{ color: ratingColor }") {{ ratingLabel }}
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { StarFilled } from '@element-plus/icons-vue';

const props = defineProps<{
  rating?: number;
}>();

const emit = defineEmits<{
  (e: 'rate', value: number): void;
}>();

const currentRating = ref(props.rating || 0);
const hovered = ref(0);

const ratingLabels: Record<number, string> = {
  1: 'Very Dissatisfied',
  2: 'Dissatisfied',
  3: 'Neutral',
  4: 'Satisfied',
  5: 'Very Satisfied'
};

const ratingColors: Record<number, string> = {
  1: '#f56c6c',
  2: '#e6a23c',
  3: '#909399',
  4: '#67c23a',
  5: '#67c23a'
};

const ratingLabel = computed(() => ratingLabels[currentRating.value] || '');
const ratingColor = computed(() => ratingColors[currentRating.value] || '#909399');

function handleRate(value: number) {
  currentRating.value = value;
  emit('rate', value);
}
</script>

<style scoped>
.star-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: #4b5563;
  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.star-button:hover {
  transform: scale(1.2);
}

.star-button.active {
  color: #f59e0b;
}
</style>
