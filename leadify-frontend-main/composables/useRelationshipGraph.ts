import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface GraphNode {
  id: string;
  label: string;
  type: 'lead' | 'deal' | 'client' | 'user';
  value?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

const NODE_COLORS: Record<string, string> = {
  lead: '#3b82f6',
  deal: '#8b5cf6',
  client: '#22c55e',
  user: '#f59e0b'
};

export function useRelationshipGraph() {
  const nodes = ref<GraphNode[]>([]);
  const edges = ref<GraphEdge[]>([]);
  const loading = ref(false);
  const selectedNode = ref<GraphNode | null>(null);
  const filters = ref<string[]>(['lead', 'deal', 'client', 'user']);

  async function fetchGraph() {
    loading.value = true;
    try {
      const typesParam = filters.value.join(',');
      const res = await useApiFetch(`insights/relationship-graph?types=${typesParam}`, 'GET', {}, true);
      if (res.success && res.body) {
        const rb = res.body as unknown;
        nodes.value = rb.nodes || [];
        edges.value = rb.edges || [];
      }
    } catch (e) {
      console.warn('[RelationshipGraph] Failed to fetch graph data:', e);
    } finally {
      loading.value = false;
    }
  }

  function toCytoscapeElements() {
    const cyNodes = nodes.value.map(n => ({
      data: {
        id: n.id,
        label: n.label,
        type: n.type,
        color: NODE_COLORS[n.type] || '#6b7280',
        size: n.value ? Math.max(20, Math.min(60, Math.log(n.value + 1) * 5)) : 30
      }
    }));

    const cyEdges = edges.value.map((e, i) => ({
      data: {
        id: `edge-${i}`,
        source: e.source,
        target: e.target,
        label: e.label || ''
      }
    }));

    return [...cyNodes, ...cyEdges];
  }

  return {
    nodes,
    edges,
    loading,
    selectedNode,
    filters,
    fetchGraph,
    toCytoscapeElements,
    NODE_COLORS
  };
}
