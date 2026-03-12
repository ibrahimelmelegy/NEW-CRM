import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface WorkflowNodeData {
  label: string;
  type: 'trigger' | 'action' | 'condition';
  config: Record<string, unknown>;
}

export function useWorkflowBuilder() {
  const workflowId = ref<number | null>(null);
  const workflowName = ref('New Workflow');
  const isActive = ref(true);
  const nodes = ref<Record<string, unknown>[]>([]);
  const edges = ref<Record<string, unknown>[]>([]);
  const selectedNode = ref<Record<string, unknown> | null>(null);
  const saving = ref(false);
  const loading = ref(false);

  let nodeIdCounter = 0;

  type NodeType = 'trigger' | 'action' | 'condition' | 'delay' | 'http' | 'wfCondition' | 'template' | 'approval';

  function addNode(type: NodeType, position?: { x: number; y: number }) {
    const id = `node-${++nodeIdCounter}`;
    const pos = position || { x: 250, y: 50 + nodes.value.length * 120 };

    const labels: Record<string, string> = {
      trigger: 'New Trigger',
      action: 'New Action',
      condition: 'New Condition',
      delay: 'Delay',
      http: 'HTTP Request',
      wfCondition: 'Condition',
      template: 'Send Template',
      approval: 'Approval'
    };

    nodes.value.push({
      id,
      type: `${type}Node`,
      position: pos,
      data: {
        label: labels[type] || 'New Node',
        nodeType: type,
        config: {}
      }
    });
    return id;
  }

  function loadFromTemplate(templateData: { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] }) {
    nodes.value = templateData.nodes.map(n => ({ ...n, position: { ...n.position } }));
    edges.value = templateData.edges.map(e => ({
      ...e,
      style: e.style || { stroke: 'var(--accent-color, #7849ff)', strokeDasharray: '5 5' }
    }));
    nodeIdCounter = nodes.value.length + 1;
  }

  function removeNode(nodeId: string) {
    nodes.value = nodes.value.filter(n => n.id !== nodeId);
    edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId);
    if (selectedNode.value?.id === nodeId) selectedNode.value = null;
  }

  function addEdge(params: unknown) {
    edges.value.push({
      id: `edge-${params.source}-${params.target}`,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      animated: true,
      style: { stroke: 'var(--accent-color, #7849ff)', strokeDasharray: '5 5' }
    });
  }

  function updateNodeConfig(nodeId: string, config: Record<string, unknown>) {
    const node = nodes.value.find(n => n.id === nodeId);
    if (node) {
      node.data = { ...node.data, config: { ...node.data.config, ...config } };
    }
  }

  function serializeToWorkflow() {
    // Convert visual graph to workflow rule format
    const triggerNodes = nodes.value.filter(n => n.data.nodeType === 'trigger');
    const actionNodes = nodes.value.filter(n => n.data.nodeType === 'action');
    const conditionNodes = nodes.value.filter(n => n.data.nodeType === 'condition');

    const trigger = triggerNodes[0]?.data?.config || {};
    const actions = actionNodes.map(n => n.data.config).filter(c => c.type);
    const conditions = conditionNodes.map(n => n.data.config).filter(c => c.field);

    return {
      name: workflowName.value,
      entityType: trigger.entityType || 'deal',
      triggerType: trigger.triggerType || 'ON_CREATE',
      triggerField: trigger.triggerField,
      conditions,
      actions,
      isActive: isActive.value,
      graphData: {
        nodes: nodes.value.map(n => ({ ...n, position: { ...n.position } })),
        edges: edges.value
      }
    };
  }

  async function saveWorkflow() {
    saving.value = true;
    const data = serializeToWorkflow();

    if (workflowId.value) {
      await useApiFetch(`workflows/${workflowId.value}`, 'PUT', data);
    } else {
      const res = await useApiFetch('workflows', 'POST', data);
      if (res.success && (res.body as unknown)?.id) {
        workflowId.value = (res.body as unknown).id;
      }
    }
    saving.value = false;
  }

  async function loadWorkflow(id: number) {
    loading.value = true;
    try {
      const res = await useApiFetch(`workflows/${id}`);
      if (res.success && res.body) {
        const wf = res.body as unknown;
        workflowId.value = wf.id;
        workflowName.value = wf.name;
        isActive.value = wf.isActive;

        if (wf.graphData?.nodes) {
          nodes.value = wf.graphData.nodes;
          edges.value = wf.graphData.edges || [];
          nodeIdCounter = nodes.value.length + 1;
        }
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    workflowId,
    workflowName,
    isActive,
    nodes,
    edges,
    selectedNode,
    saving,
    loading,
    addNode,
    removeNode,
    addEdge,
    updateNodeConfig,
    saveWorkflow,
    loadWorkflow,
    loadFromTemplate
  };
}
