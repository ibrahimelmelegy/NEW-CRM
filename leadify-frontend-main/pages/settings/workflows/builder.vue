<template lang="pug">
.workflow-builder-page
  //- Toolbar
  WorkflowToolbar(
    :name="workflowName"
    :active="isActive"
    :saving="saving"
    @update:name="workflowName = $event"
    @update:active="isActive = $event"
    @save="saveWorkflow"
    @back="router.push('/settings/workflows')"
  )

  .builder-layout.mt-4
    //- Node Palette Sidebar
    .node-palette.glass-card.p-4
      h3.text-sm.font-bold.text-primary.mb-3 {{ $t('workflows.nodeTypes') }}
      .palette-item(@click="addNode('trigger')")
        .palette-icon.trigger
          Icon(name="ph:play-circle-bold" size="18")
        div
          .palette-name {{ $t('workflows.triggerNode') }}
          .palette-desc {{ $t('workflows.triggerDesc') }}
      .palette-item(@click="addNode('wfCondition')")
        .palette-icon.condition
          Icon(name="ph:git-branch-bold" size="18")
        div
          .palette-name {{ $t('workflows.conditionNode') }}
          .palette-desc {{ $t('workflows.conditionDesc') }}
      .palette-item(@click="addNode('action')")
        .palette-icon.action
          Icon(name="ph:lightning-bold" size="18")
        div
          .palette-name {{ $t('workflows.actionNode') }}
          .palette-desc {{ $t('workflows.actionDesc') }}
      .palette-item(@click="addNode('delay')")
        .palette-icon.delay
          Icon(name="ph:clock-bold" size="18")
        div
          .palette-name {{ $t('workflows.delayNode') }}
          .palette-desc {{ $t('workflows.delayDesc') }}
      .palette-item(@click="addNode('http')")
        .palette-icon.http
          Icon(name="ph:globe-bold" size="18")
        div
          .palette-name {{ $t('workflows.httpNode') }}
          .palette-desc {{ $t('workflows.httpDesc') }}
      .palette-item(@click="addNode('template')")
        .palette-icon.template-icon
          Icon(name="ph:file-text-bold" size="18")
        div
          .palette-name {{ $t('workflows.templateNode') }}
          .palette-desc {{ $t('workflows.templateDesc') }}
      .palette-item(@click="addNode('approval')")
        .palette-icon.approval
          Icon(name="ph:shield-check-bold" size="18")
        div
          .palette-name {{ $t('workflows.approvalNode') }}
          .palette-desc {{ $t('workflows.approvalDesc') }}

    //- Canvas
    .canvas-area
      ClientOnly
        WorkflowCanvas(
          :nodes="nodes"
          :edges="edges"
          @update:nodes="nodes = $event"
          @update:edges="edges = $event"
          @connect="addEdge"
          @nodeClick="onNodeClick"
        )

  //- Config Panel
  NodeConfigPanel(
    :node="selectedNode"
    :visible="configPanelOpen"
    @update:visible="configPanelOpen = $event"
    @updateConfig="onUpdateConfig"
    @updateLabel="onUpdateLabel"
    @delete="onDeleteNode"
  )
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWorkflowBuilder } from '~/composables/useWorkflowBuilder';
import WorkflowCanvas from '~/components/WorkflowBuilder/WorkflowCanvas.vue';
import WorkflowToolbar from '~/components/WorkflowBuilder/WorkflowToolbar.vue';
import NodeConfigPanel from '~/components/WorkflowBuilder/NodeConfigPanel.vue';

const router = useRouter();
const route = useRoute();

const { workflowName, isActive, nodes, edges, selectedNode, saving, addNode, removeNode, addEdge, updateNodeConfig, saveWorkflow, loadWorkflow } =
  useWorkflowBuilder();

const configPanelOpen = ref(false);

function onNodeClick(node: unknown) {
  selectedNode.value = node;
  configPanelOpen.value = true;
}

function onUpdateConfig(config: Record<string, unknown>) {
  if (selectedNode.value) {
    updateNodeConfig(selectedNode.value.id, config);
  }
}

function onUpdateLabel(label: string) {
  if (selectedNode.value) {
    const node = nodes.value.find((n) => n.id === selectedNode.value.id);
    if (node) node.data = { ...node.data, label };
  }
}

function onDeleteNode() {
  if (selectedNode.value) {
    removeNode(selectedNode.value.id);
    configPanelOpen.value = false;
  }
}

onMounted(() => {
  const id = route.query.id;
  if (id) {
    loadWorkflow(Number(id));
  } else {
    // Start with a trigger node
    addNode('trigger', { x: 300, y: 50 });
  }
});
</script>

<style lang="scss" scoped>
.workflow-builder-page {
  max-width: 1600px;
  margin: 0 auto;
}

.text-primary {
  color: var(--text-primary);
}

.builder-layout {
  display: flex;
  gap: 16px;
}

.node-palette {
  width: 200px;
  flex-shrink: 0;
}

.canvas-area {
  flex: 1;
  min-width: 0;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 6px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}

.palette-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;

  &.trigger {
    background: linear-gradient(135deg, #16a34a, #22c55e);
  }
  &.action {
    background: linear-gradient(135deg, #7849ff, #a855f7);
  }
  &.condition {
    background: linear-gradient(135deg, #ea580c, #f59e0b);
  }
  &.delay {
    background: linear-gradient(135deg, #ca8a04, #eab308);
  }
  &.http {
    background: linear-gradient(135deg, #2563eb, #3b82f6);
  }
  &.template-icon {
    background: linear-gradient(135deg, #16a34a, #4ade80);
  }
  &.approval {
    background: linear-gradient(135deg, #ea580c, #f97316);
  }
}

.palette-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.palette-desc {
  font-size: 11px;
  color: var(--text-secondary);
}
</style>
