<template lang="pug">
.graph-canvas(ref="containerRef" @click.self="deselectNode")
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { GraphNode } from '~/composables/useRelationshipGraph';

const props = defineProps<{
  elements: any[];
}>();

const emit = defineEmits<{
  (e: 'nodeClick', node: GraphNode): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
let cy: any = null;

async function initCytoscape() {
  if (!containerRef.value) return;

  const cytoscape = (await import('cytoscape')).default;

  cy = cytoscape({
    container: containerRef.value,
    elements: props.elements,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          label: 'data(label)',
          width: 'data(size)',
          height: 'data(size)',
          'font-size': '10px',
          color: '#e4e4e7',
          'text-outline-color': '#0a0a1a',
          'text-outline-width': 2,
          'text-valign': 'bottom',
          'text-margin-y': 8,
          'border-width': 2,
          'border-color': 'data(color)',
          'border-opacity': 0.5
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': '#ffffff',
          'font-size': '12px',
          'font-weight': 'bold'
        }
      },
      {
        selector: 'edge',
        style: {
          width: 1.5,
          'line-color': 'rgba(255, 255, 255, 0.15)',
          'target-arrow-color': 'rgba(255, 255, 255, 0.15)',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          label: 'data(label)',
          'font-size': '8px',
          color: 'rgba(255, 255, 255, 0.3)',
          'text-rotation': 'autorotate'
        }
      }
    ],
    layout: {
      name: 'cose',
      animate: true,
      animationDuration: 1000,
      nodeRepulsion: () => 8000,
      idealEdgeLength: () => 120,
      gravity: 0.5,
      padding: 40
    },
    minZoom: 0.3,
    maxZoom: 3,
    wheelSensitivity: 0.3
  });

  cy.on('tap', 'node', (evt: any) => {
    const nodeData = evt.target.data();
    emit('nodeClick', {
      id: nodeData.id,
      label: nodeData.label,
      type: nodeData.type,
      value: nodeData.value
    });
  });
}

function deselectNode() {
  if (cy) cy.elements().unselect();
}

watch(
  () => props.elements,
  async newElements => {
    if (cy) {
      cy.destroy();
    }
    await initCytoscape();
  },
  { deep: true }
);

onMounted(() => {
  initCytoscape();
});

onUnmounted(() => {
  if (cy) cy.destroy();
});
</script>

<style lang="scss" scoped>
.graph-canvas {
  width: 100%;
  height: 600px;
  border-radius: 12px;
  background: rgba(5, 5, 16, 0.6);
  border: 1px solid var(--glass-border-color, rgba(255, 255, 255, 0.08));
}
</style>
