<template lang="pug">
.relationship-graph-page
  .page-header.glass-card.mb-6.p-6
    .flex.items-center.justify-between.flex-wrap.gap-4
      .flex.items-center.gap-3
        Icon.text-2xl(name="ph:graph-bold" :style="{ color: 'var(--accent-color)' }")
        div
          h1.text-2xl.font-bold.text-primary {{ $t('relationshipGraph.title') }}
          p.text-secondary.text-sm {{ $t('relationshipGraph.subtitle') }}
      GraphFilters(v-model="filters" :counts="nodeCounts" @update:modelValue="onFilterChange")

  .glass-card.p-4.relative(v-loading="loading")
    GraphCanvas(:elements="cytoscapeElements" @nodeClick="onNodeClick")
    NodeDetailPanel(:node="selectedNode" @close="selectedNode = null")
</template>

<script setup lang="ts">
import { onMounted, computed, watch } from 'vue';
import { useRelationshipGraph } from '~/composables/useRelationshipGraph';
import GraphCanvas from '~/components/RelationshipGraph/GraphCanvas.vue';
import NodeDetailPanel from '~/components/RelationshipGraph/NodeDetailPanel.vue';
import GraphFilters from '~/components/RelationshipGraph/GraphFilters.vue';

const { nodes, edges, loading, selectedNode, filters, fetchGraph, toCytoscapeElements } = useRelationshipGraph();

const cytoscapeElements = computed(() => toCytoscapeElements());

const nodeCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const n of nodes.value) {
    counts[n.type] = (counts[n.type] || 0) + 1;
  }
  return counts;
});

function onNodeClick(node: any) {
  selectedNode.value = node;
}

function onFilterChange() {
  fetchGraph();
}

onMounted(() => {
  fetchGraph();
});
</script>

<style lang="scss" scoped>
.relationship-graph-page {
  max-width: 1600px;
  margin: 0 auto;
}

.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
</style>
