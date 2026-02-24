<template lang="pug">
.workflow-canvas
  VueFlow(
    v-model:nodes="localNodes"
    v-model:edges="localEdges"
    :node-types="nodeTypes"
    :default-viewport="{ zoom: 0.8, x: 100, y: 50 }"
    :snap-to-grid="true"
    :snap-grid="[20, 20]"
    @connect="onConnect"
    @node-click="onNodeClick"
    fit-view-on-init
    class="vue-flow-wrapper"
  )
    template(#node-triggerNode="props")
      TriggerNode(:data="props.data")
    template(#node-actionNode="props")
      ActionNode(:data="props.data")
    template(#node-conditionNode="props")
      ConditionNode(:data="props.data")
    template(#node-delayNode="props")
      DelayNode(:data="props.data")
    template(#node-httpNode="props")
      HttpNode(:data="props.data")
    template(#node-wfConditionNode="props")
      WfConditionNode(:data="props.data")
    template(#node-templateNode="props")
      TemplateNode(:data="props.data")
    template(#node-approvalNode="props")
      ApprovalNode(:data="props.data")
    Background(:gap="20" pattern-color="rgba(255,255,255,0.03)")
    Controls
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { VueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import TriggerNode from './TriggerNode.vue';
import ActionNode from './ActionNode.vue';
import ConditionNode from './ConditionNode.vue';
import DelayNode from '~/components/Workflow/nodes/DelayNode.vue';
import HttpNode from '~/components/Workflow/nodes/HttpNode.vue';
import WfConditionNode from '~/components/Workflow/nodes/ConditionNode.vue';
import TemplateNode from '~/components/Workflow/nodes/TemplateNode.vue';
import ApprovalNode from '~/components/Workflow/nodes/ApprovalNode.vue';

const props = defineProps<{
  nodes: any[];
  edges: any[];
}>();

const emit = defineEmits(['update:nodes', 'update:edges', 'connect', 'nodeClick']);

const localNodes = computed({
  get: () => props.nodes,
  set: (v) => emit('update:nodes', v)
});

const localEdges = computed({
  get: () => props.edges,
  set: (v) => emit('update:edges', v)
});

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  delayNode: DelayNode,
  httpNode: HttpNode,
  wfConditionNode: WfConditionNode,
  templateNode: TemplateNode,
  approvalNode: ApprovalNode
};

function onConnect(params: any) {
  emit('connect', params);
}

function onNodeClick(event: any) {
  emit('nodeClick', event.node);
}
</script>

<style lang="scss">
.workflow-canvas {
  height: 600px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--glass-border-color, rgba(255,255,255,0.08));
}

.vue-flow-wrapper {
  background: rgba(5, 5, 16, 0.8);
}

/* Custom node styles shared across all workflow nodes */
.workflow-node {
  min-width: 180px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(15, 15, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 700;
  }

  .node-body {
    padding: 10px 12px;
  }

  .node-config {
    font-size: 11px;
    color: var(--text-primary, #e4e4e7);
  }

  .node-placeholder {
    font-size: 11px;
    color: var(--text-secondary, #71717a);
    font-style: italic;
  }
}

/* Vue Flow overrides */
.vue-flow__handle {
  width: 10px;
  height: 10px;
  background: var(--accent-color, #7849ff);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.vue-flow__edge-path {
  stroke: var(--accent-color, #7849ff);
  stroke-width: 2;
  stroke-dasharray: 5 5;
}

.vue-flow__controls {
  background: rgba(15, 15, 30, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;

  .vue-flow__controls-button {
    background: transparent;
    color: var(--text-primary, #e4e4e7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
}
</style>
