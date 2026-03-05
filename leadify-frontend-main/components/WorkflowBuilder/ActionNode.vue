<template lang="pug">
.workflow-node.action-node
  Handle(type="target" :position="Position.Top")
  .node-header
    Icon(name="ph:lightning-bold" size="16")
    span {{ data.label }}
  .node-body
    .node-config(v-if="data.config?.type") {{ data.config.type }}
    .node-placeholder(v-else) Click to configure
  Handle(type="source" :position="Position.Bottom")
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

defineProps<{
  data: unknown;
}>();
</script>

<style lang="scss" scoped>
.action-node {
  .node-header {
    background: linear-gradient(135deg, #7849ff, #a855f7);
    color: white;
  }
}
</style>
