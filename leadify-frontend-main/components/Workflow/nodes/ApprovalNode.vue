<template lang="pug">
.workflow-node.approval-node
  Handle(type="target" :position="Position.Top")
  .node-header
    Icon(name="ph:shield-check-bold" size="16")
    span {{ data.label || $t('workflows.approval') }}
  .node-body
    .node-config(v-if="data.config?.message || data.config?.approverUserId || data.config?.approverRole")
      .approval-info
        Icon(name="ph:user-circle-check-bold" size="13" class="approval-icon")
        span.approval-target(v-if="data.config.approverRole") {{ $t('workflows.role') }}: {{ data.config.approverRole }}
        span.approval-target(v-else-if="data.config.approverUserId") {{ $t('workflows.userId') }}: {{ data.config.approverUserId }}
      .approval-message(v-if="data.config.message")
        | "{{ truncatedMessage }}"
      .approval-timeout(v-if="data.config.timeout")
        Icon(name="ph:hourglass-bold" size="12")
        span {{ $t('workflows.timeout') }}: {{ data.config.timeout }}h
    .node-placeholder(v-else) {{ $t('workflows.clickToConfigure') }}
  .approval-outputs
    .output-label.approved {{ $t('workflows.approved') }}
    .output-label.rejected {{ $t('workflows.rejected') }}
  Handle(id="approved" type="source" :position="Position.Bottom" :style="{ left: '30%' }")
  Handle(id="rejected" type="source" :position="Position.Bottom" :style="{ left: '70%' }")
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps<{
  data: any;
}>();

const truncatedMessage = computed(() => {
  const msg = props.data.config?.message || '';
  return msg.length > 35 ? msg.substring(0, 35) + '...' : msg;
});
</script>

<style lang="scss" scoped>
.approval-node {
  .node-header {
    background: linear-gradient(135deg, #ea580c, #f97316);
    color: white;
  }
}

.approval-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.approval-icon {
  color: #fb923c;
}

.approval-target {
  font-weight: 600;
  font-size: 11px;
  color: var(--text-primary, #e4e4e7);
}

.approval-message {
  font-size: 10px;
  color: var(--text-secondary, #71717a);
  font-style: italic;
  margin-bottom: 2px;
}

.approval-timeout {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-secondary, #71717a);
  margin-top: 2px;
}

.approval-outputs {
  display: flex;
  justify-content: space-around;
  padding: 4px 8px;
}

.output-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;

  &.approved { color: #22c55e; }
  &.rejected { color: #ef4444; }
}
</style>
