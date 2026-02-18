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
      h3.text-sm.font-bold.text-primary.mb-3 Node Types
      .palette-item(@click="addNode('trigger')")
        .palette-icon.trigger
          Icon(name="ph:play-circle-bold" size="18")
        div
          .palette-name Trigger
          .palette-desc Start event
      .palette-item(@click="addNode('condition')")
        .palette-icon.condition
          Icon(name="ph:git-branch-bold" size="18")
        div
          .palette-name Condition
          .palette-desc If/else branch
      .palette-item(@click="addNode('action')")
        .palette-icon.action
          Icon(name="ph:lightning-bold" size="18")
        div
          .palette-name Action
          .palette-desc Execute step

    //- Canvas
    .canvas-area
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

const {
  workflowName, isActive, nodes, edges, selectedNode, saving,
  addNode, removeNode, addEdge, updateNodeConfig, saveWorkflow, loadWorkflow
} = useWorkflowBuilder();

const configPanelOpen = ref(false);

function onNodeClick(node: any) {
  selectedNode.value = node;
  configPanelOpen.value = true;
}

function onUpdateConfig(config: Record<string, any>) {
  if (selectedNode.value) {
    updateNodeConfig(selectedNode.value.id, config);
  }
}

function onUpdateLabel(label: string) {
  if (selectedNode.value) {
    const node = nodes.value.find((n: any) => n.id === selectedNode.value.id);
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

.text-primary { color: var(--text-primary); }

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

  &.trigger { background: linear-gradient(135deg, #16a34a, #22c55e); }
  &.action { background: linear-gradient(135deg, #7849ff, #a855f7); }
  &.condition { background: linear-gradient(135deg, #ea580c, #f59e0b); }
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
