<template lang="pug">
.workflow-node.trigger-node
  .node-header
    Icon(name="ph:play-circle-bold" size="16")
    span {{ data.label }}
  .node-body
    .node-config(v-if="data.config?.entityType") {{ data.config.entityType }} - {{ data.config.triggerType }}
    .node-placeholder(v-else) Click to configure
  Handle(type="source" :position="Position.Bottom")
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

defineProps<{
  data: any;
}>();
</script>

<style lang="scss" scoped>
.trigger-node {
  .node-header {
    background: linear-gradient(135deg, #16a34a, #22c55e);
    color: white;
  }
}
</style>
