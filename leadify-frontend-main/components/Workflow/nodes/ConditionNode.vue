<template lang="pug">
.workflow-node.wf-condition-node
  Handle(type="target" :position="Position.Top")
  .node-header
    Icon(name="ph:git-branch-bold" size="16")
    span {{ data.label || $t('workflows.condition') }}
  .node-body.diamond-body
    .node-config(v-if="data.config?.field")
      .condition-summary
        span.condition-field {{ data.config.field }}
        span.condition-operator {{ operatorLabel }}
        span.condition-value "{{ data.config.value }}"
    .node-placeholder(v-else) {{ $t('workflows.clickToConfigure') }}
  .condition-outputs
    .output-label.yes {{ $t('workflows.true') }}
    .output-label.no {{ $t('workflows.false') }}
  Handle(id="true" type="source" :position="Position.Bottom" :style="{ left: '30%' }")
  Handle(id="false" type="source" :position="Position.Bottom" :style="{ left: '70%' }")
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps<{
  data: unknown;
}>();

const operatorLabels: Record<string, string> = {
  equals: '=',
  not_equals: '!=',
  contains: 'contains',
  greater_than: '>',
  less_than: '<',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  in: 'in',
  not_in: 'not in'
};

const operatorLabel = computed(() => {
  const op = props.data.config?.operator || 'equals';
  return operatorLabels[op] || op;
});
</script>

<style lang="scss" scoped>
.wf-condition-node {
  .node-header {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: white;
  }
}

.condition-summary {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  font-size: 11px;
}

.condition-field {
  font-weight: 700;
  color: #c084fc;
}

.condition-operator {
  font-weight: 600;
  color: var(--text-secondary, #71717a);
}

.condition-value {
  font-weight: 600;
  color: #e9d5ff;
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
