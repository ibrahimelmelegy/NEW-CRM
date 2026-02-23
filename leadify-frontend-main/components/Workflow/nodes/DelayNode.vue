<template lang="pug">
.workflow-node.delay-node
  Handle(type="target" :position="Position.Top")
  .node-header
    Icon(name="ph:clock-bold" size="16")
    span {{ data.label || $t('workflows.delay') }}
  .node-body
    .node-config(v-if="data.config?.delay")
      .delay-display
        Icon(name="ph:timer-bold" size="14" class="delay-icon")
        span {{ $t('workflows.wait') }} {{ data.config.delay }} {{ unitLabel }}
    .node-placeholder(v-else) {{ $t('workflows.clickToConfigure') }}
  Handle(type="source" :position="Position.Bottom")
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps<{
  data: any;
}>();

const unitLabel = computed(() => {
  const unit = props.data.config?.unit || 'hours';
  const delay = props.data.config?.delay || 0;
  const labels: Record<string, string[]> = {
    minutes: ['minute', 'minutes'],
    hours: ['hour', 'hours'],
    days: ['day', 'days']
  };
  const pair = labels[unit] || labels.hours!;
  return delay === 1 ? pair![0] : pair![1];
});
</script>

<style lang="scss" scoped>
.delay-node {
  .node-header {
    background: linear-gradient(135deg, #ca8a04, #eab308);
    color: white;
  }
}

.delay-display {
  display: flex;
  align-items: center;
  gap: 6px;
}

.delay-icon {
  color: #eab308;
}
</style>
