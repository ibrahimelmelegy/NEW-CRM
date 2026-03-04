<template lang="pug">
.cursor-label(:style="labelStyle")
  span.cursor-name {{ name }}
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  name: string;
  color: string;
}>();

const labelStyle = computed(() => ({
  backgroundColor: props.color
}));
</script>

<style scoped>
.cursor-label {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 8px;
  margin-top: 2px;
  margin-left: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
}

.cursor-name {
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
