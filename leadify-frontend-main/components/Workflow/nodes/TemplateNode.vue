<template lang="pug">
.workflow-node.template-node
  Handle(type="target" :position="Position.Top")
  .node-header
    Icon(name="ph:file-text-bold" size="16")
    span {{ data.label || $t('workflows.sendTemplate') }}
  .node-body
    .node-config(v-if="data.config?.templateId")
      .template-info
        Icon(name="ph:envelope-simple-bold" size="13" class="template-icon")
        span.template-name {{ data.config.templateName || $t('workflows.templateSelected') }}
      .template-recipient(v-if="data.config.recipientField")
        Icon(name="ph:user-bold" size="12")
        span {{ $t('workflows.to') }}: {{ data.config.recipientField }}
    .node-placeholder(v-else) {{ $t('workflows.clickToConfigure') }}
  Handle(type="source" :position="Position.Bottom")
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

defineProps<{
  data: unknown;
}>();
</script>

<style lang="scss" scoped>
.template-node {
  .node-header {
    background: linear-gradient(135deg, #16a34a, #4ade80);
    color: white;
  }
}

.template-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.template-icon {
  color: #4ade80;
}

.template-name {
  font-weight: 600;
  font-size: 11px;
  color: var(--text-primary, #e4e4e7);
}

.template-recipient {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-secondary, #71717a);
  margin-top: 4px;
}
</style>
