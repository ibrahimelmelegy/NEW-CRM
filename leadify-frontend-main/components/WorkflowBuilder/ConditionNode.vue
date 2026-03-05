<template lang="pug">
.workflow-node.condition-node
  Handle(type="target" :position="Position.Top")
  .node-header
    Icon(name="ph:git-branch-bold" size="16")
    span {{ data.label }}
  .node-body.diamond-body
    .node-config(v-if="data.config?.field") {{ data.config.field }} {{ data.config.operator }} {{ data.config.value }}
    .node-placeholder(v-else) Click to configure
  .condition-outputs
    .output-label.yes Yes
    .output-label.no No
  Handle(id="yes" type="source" :position="Position.Bottom" :style="{ left: '30%' }")
  Handle(id="no" type="source" :position="Position.Bottom" :style="{ left: '70%' }")
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

defineProps<{
  data: unknown;
}>();
</script>

<style lang="scss" scoped>
.condition-node {
  .node-header {
    background: linear-gradient(135deg, #ea580c, #f59e0b);
    color: white;
  }
}

.condition-outputs {
  display: flex;
  justify-content: space-around;
  padding: 4px 8px;
}

.output-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;

  &.yes {
    color: #22c55e;
  }
  &.no {
    color: #ef4444;
  }
}
</style>
