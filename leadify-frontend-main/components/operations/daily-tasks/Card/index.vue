<template lang="pug">
    .stat-card(v-loading="loading")
            Icon.text-2xl.text-main(:name="icon?.name" :style="{color :icon?.color}")
            .stat-value(id="active-projects-count") {{ data }}
            .stat-label(id="active-projects-count") {{ name }}
    </template>

<script lang="ts" setup>
const props = defineProps({
  name: {
    type: String,
    required: true
  },
  data: {
    type: [Number, String],
    required: true
  },
  icon: {
    type: Object,
    required: true
  }
});
</script>
<style>
.stat-card {
  flex: 1;
  min-width: 200px;
  background-color: var(--color-neutral-background-2);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-large);
  box-shadow: var(--elevation-shadow-4);
  padding: 20px;
  text-align: center;
  transition: all var(--duration-fast) var(--curve-standard);

  &:hover {
    box-shadow: var(--elevation-shadow-8);
    transform: translateY(-2px);
  }
}

.stat-value {
  font-size: var(--font-size-600);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin: 10px 0;
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-200);
}
</style>
