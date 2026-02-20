<template lang="pug">
.workflow-node.http-node
  Handle(type="target" :position="Position.Top")
  .node-header
    Icon(name="ph:globe-bold" size="16")
    span {{ data.label || $t('workflows.httpRequest') }}
  .node-body
    .node-config(v-if="data.config?.url")
      .http-method-badge(:class="methodClass") {{ data.config.method || 'GET' }}
      .http-url {{ truncatedUrl }}
      .http-retries(v-if="data.config.retries")
        Icon(name="ph:arrows-clockwise" size="12")
        span {{ data.config.retries }} {{ $t('workflows.retries') }}
    .node-placeholder(v-else) {{ $t('workflows.clickToConfigure') }}
  .http-outputs
    .output-label.success {{ $t('workflows.success') }}
    .output-label.error {{ $t('workflows.error') }}
  Handle(id="success" type="source" :position="Position.Bottom" :style="{ left: '30%' }")
  Handle(id="error" type="source" :position="Position.Bottom" :style="{ left: '70%' }")
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps<{
  data: any;
}>();

const truncatedUrl = computed(() => {
  const url = props.data.config?.url || '';
  return url.length > 30 ? url.substring(0, 30) + '...' : url;
});

const methodClass = computed(() => {
  const method = (props.data.config?.method || 'GET').toUpperCase();
  return `method-${method.toLowerCase()}`;
});
</script>

<style lang="scss" scoped>
.http-node {
  .node-header {
    background: linear-gradient(135deg, #2563eb, #3b82f6);
    color: white;
  }
}

.http-method-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin-bottom: 4px;

  &.method-get { background: #166534; color: #86efac; }
  &.method-post { background: #1e40af; color: #93c5fd; }
  &.method-put { background: #92400e; color: #fcd34d; }
  &.method-patch { background: #6b21a8; color: #d8b4fe; }
  &.method-delete { background: #991b1b; color: #fca5a5; }
}

.http-url {
  font-size: 10px;
  color: var(--text-secondary, #71717a);
  word-break: break-all;
  margin-top: 2px;
}

.http-retries {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-secondary, #71717a);
  margin-top: 4px;
}

.http-outputs {
  display: flex;
  justify-content: space-around;
  padding: 4px 8px;
}

.output-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;

  &.success { color: #22c55e; }
  &.error { color: #ef4444; }
}
</style>
