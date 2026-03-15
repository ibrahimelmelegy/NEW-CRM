<template>
  <div class="h-[calc(100vh-80px)] w-full flex flex-col bg-slate-950 overflow-hidden relative">
    <!-- Header Controls -->
    <div class="h-16 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 z-10">
      <div class="flex items-center gap-4">
        <NuxtLink to="/automations" class="text-slate-400 hover:text-white transition-colors">
          <Icon name="ph:arrow-left-bold" class="w-5 h-5" />
        </NuxtLink>
        <div v-if="loading" class="w-48 h-6 bg-slate-800 animate-pulse rounded"></div>
        <div v-else class="flex items-center gap-3">
          <h1 class="text-xl font-bold text-white">{{ workflowName }}</h1>
          <el-tag size="small" :type="isActive ? 'success' : 'info'" effect="dark" class="!border-0">
            {{ isActive ? 'Active' : 'Draft' }}
          </el-tag>
        </div>
      </div>

      <div v-if="!loading" class="flex items-center gap-3">
        <div class="text-sm text-slate-400 mr-2">
          Trigger:
          <span class="capitalize text-slate-200 font-medium">{{ (entityType || '').replace('_', ' ') }} ({{ triggerType }})</span>
        </div>
        <el-button class="!bg-slate-800 !border-slate-700 !text-white hover:!bg-slate-700" @click="openSettingsDialog">
          <Icon name="ph:gear-bold" class="w-4 h-4 mr-2" />
          Settings
        </el-button>
        <el-button type="primary" class="!rounded-lg shadow-lg shadow-primary-500/20" :loading="saving" @click="saveJourney">
          <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
          Save Journey
        </el-button>
      </div>
    </div>

    <!-- Canvas Area -->
    <div class="flex-1 flex w-full relative h-[calc(100vh-144px)]">
      <!-- Toolbox Sidebar -->
      <div class="w-64 border-r border-slate-800/60 bg-slate-900/30 flex flex-col h-full z-10 shadow-xl">
        <div class="p-4 border-b border-slate-800/60 font-medium text-slate-200 flex items-center gap-2">
          <Icon name="ph:toolbox-bold" class="w-5 h-5 text-indigo-400" />
          Elements
        </div>

        <div class="p-4 space-y-4 overflow-y-auto">
          <!-- Triggers Section -->
          <div>
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Triggers</div>
            <div
              class="drag-node border border-emerald-500/30 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-300 p-3 rounded-xl cursor-grab flex items-center gap-3 transition-colors text-sm font-medium"
              draggable="true"
              @dragstart="onDragStart($event, 'trigger-node')"
            >
              <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Icon name="ph:lightning-bold" class="w-4 h-4" />
              </div>
              Record Created
            </div>
          </div>

          <!-- Actions Section -->
          <div>
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Actions</div>
            <div
              class="drag-node border border-blue-500/30 bg-blue-900/20 hover:bg-blue-900/40 text-blue-300 p-3 rounded-xl cursor-grab flex items-center gap-3 transition-colors text-sm font-medium mb-2"
              draggable="true"
              @dragstart="onDragStart($event, 'action-node', { subType: 'SEND_EMAIL' })"
            >
              <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Icon name="ph:envelope-simple-bold" class="w-4 h-4" />
              </div>
              Send Email
            </div>

            <div
              class="drag-node border border-orange-500/30 bg-orange-900/20 hover:bg-orange-900/40 text-orange-300 p-3 rounded-xl cursor-grab flex items-center gap-3 transition-colors text-sm font-medium mb-2"
              draggable="true"
              @dragstart="onDragStart($event, 'action-node', { subType: 'CREATE_TASK' })"
            >
              <div class="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Icon name="ph:check-square-offset-bold" class="w-4 h-4" />
              </div>
              Create Task
            </div>

            <div
              class="drag-node border border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 p-3 rounded-xl cursor-grab flex items-center gap-3 transition-colors text-sm font-medium"
              draggable="true"
              @dragstart="onDragStart($event, 'action-node', { subType: 'WEBHOOK' })"
            >
              <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Icon name="ph:plugs-connected-bold" class="w-4 h-4" />
              </div>
              Send Webhook
            </div>
          </div>

          <!-- Flow Control Section -->
          <div>
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Flow Control</div>
            <div
              class="drag-node border border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 p-3 rounded-xl cursor-grab flex items-center gap-3 transition-colors text-sm font-medium"
              draggable="true"
              @dragstart="onDragStart($event, 'delay-node')"
            >
              <div class="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                <Icon name="ph:hourglass-medium-bold" class="w-4 h-4" />
              </div>
              Time Delay
            </div>
          </div>
        </div>
      </div>

      <!-- Flow Canvas -->
      <div class="flex-1 h-full relative" @drop="onDrop" @dragover.prevent @dragenter.prevent="dragOver = true" @dragleave.prevent="dragOver = false">
        <ClientOnly>
          <VueFlow v-model="elements" :default-zoom="1" :min-zoom="0.2" :max-zoom="4" class="vue-flow-theme-dark" @node-click="onNodeClick">
            <Background pattern-color="#334155" :gap="32" />
            <Controls />

            <!-- Custom Node Template Fallbacks (Will build actual components later) -->
            <template #node-trigger-node="{ data }">
              <div class="p-4 rounded-xl border-2 border-emerald-500 bg-slate-900 shadow-xl shadow-emerald-900/20 min-w-[200px]">
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 rounded bg-emerald-500/20 text-emerald-400">
                    <Icon name="ph:lightning-bold" class="w-5 h-5" />
                  </div>
                  <div class="font-bold text-white text-sm">Record Event</div>
                </div>
                <div class="text-xs text-slate-400 font-medium bg-slate-800/50 p-2 rounded truncate block">
                  {{ data.entityType || 'Any' }} -> {{ data.triggerType || 'Created' }}
                </div>
              </div>
            </template>

            <template #node-action-node="{ data }">
              <div class="p-4 rounded-xl border-2 border-blue-500 bg-slate-900 shadow-xl shadow-blue-900/20 min-w-[200px]">
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 rounded bg-blue-500/20 text-blue-400">
                    <Icon name="ph:envelope-simple-bold" class="w-5 h-5" />
                  </div>
                  <div class="font-bold text-white text-sm">{{ data.subType || 'Action' }}</div>
                </div>
                <div class="text-xs text-slate-400">{{ data.summary || 'Configure action...' }}</div>
              </div>
            </template>

            <template #node-delay-node="{ data }">
              <div class="p-3 rounded-xl border-2 border-slate-600 bg-slate-900 shadow-xl min-w-[160px] text-center">
                <div class="flex justify-center items-center gap-2 text-slate-300 font-medium text-sm">
                  <Icon name="ph:clock-bold" class="w-4 h-4 text-amber-400" />
                  Wait {{ data.days || 0 }}d {{ data.hours || 0 }}h
                </div>
              </div>
            </template>
          </VueFlow>
        </ClientOnly>

        <!-- Drag Over Overlay -->
        <div
          v-show="dragOver"
          class="absolute inset-0 z-50 bg-primary-500/10 border-2 border-dashed border-primary-500 pointer-events-none rounded-lg flex items-center justify-center backdrop-blur-sm"
        >
          <div class="bg-slate-900 p-4 rounded-xl border border-primary-500/30 text-primary-400 font-bold flex items-center gap-3 shadow-2xl">
            <Icon name="ph:download-simple-bold" class="w-6 h-6" />
            Drop Here to Add Step
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import { ElMessage } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';
import logger from '~/utils/logger'

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();
const route = useRoute();
const workflowId = route.params.id as string;

// State
const loading = ref(true);
const saving = ref(false);
const workflowName = ref('');
const isActive = ref(false);
const entityType = ref('');
const triggerType = ref('');
const elements = ref<Record<string, unknown>[]>([]);

const { project } = useVueFlow();
const dragOver = ref(false);

const onDragStart = (event: DragEvent, type: string, extraData: unknown = {}) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify({ type, ...extraData }));
    event.dataTransfer.effectAllowed = 'move';
  }
};

const onDrop = (event: DragEvent) => {
  dragOver.value = false;
  const dataString = event.dataTransfer?.getData('application/vueflow');
  if (!dataString) return;

  try {
    const data = JSON.parse(dataString);
    const position = project({ x: event.clientX - 256, y: event.clientY - 64 }); // rough offset for sidebar + header

    const newNode = {
      id: `node_${Date.now()}`,
      type: data.type,
      position,
      data: { ...data, label: `${data.subType || data.type} Node` }
    };

    elements.value.push(newNode);

    // Auto connect to the previous node if there's only a single path (simple logic for now)
    const nodes = elements.value.filter(e => !e.source);
    if (nodes.length > 1) {
      const prevNode = nodes[nodes.length - 2];
      elements.value.push({
        id: `e_${prevNode.id}-${newNode.id}`,
        source: prevNode.id,
        target: newNode.id,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 }
      });
    }
  } catch (err) {
    logger.error('Failed parsing dragged element', err);
  }
};

const onNodeClick = (event: unknown) => {
  const node = event.node;
  ElMessage.info(`Clicked ${node.type} node settings (Editor coming soon)`);
};

// Data Fetching
const fetchWorkflow = async () => {
  loading.value = true;
  try {
    const res = await useApiFetch(`workflows/rules/${workflowId}`);
    if (res?.success) {
      const data = res.body;
      workflowName.value = data.name;
      isActive.value = data.isActive;
      entityType.value = data.entityType;
      triggerType.value = data.triggerType;

      // Load saved graph data if exists, otherwise generate a trigger node based on DB schema
      if (data.graphData && data.graphData.elements) {
        elements.value = data.graphData.elements;
      } else {
        // Initialize an empty canvas with just the Start trigger if needed
        elements.value = [
          {
            id: 'trigger-1',
            type: 'trigger-node',
            position: { x: 250, y: 100 },
            data: { entityType: data.entityType, triggerType: data.triggerType }
          }
        ];
      }
    }
  } catch (err: unknown) {
    ElMessage.error(err.response?.data?.message || 'Failed to fetch workflow');
  } finally {
    loading.value = false;
  }
};

const saveJourney = async () => {
  saving.value = true;
  try {
    const graphData = {
      elements: elements.value
    };

    // To functionally execute, we will eventually need to compile the graph back into the `actions` flat array.
    // For MVP, we save the graph view first.

    await useApiFetch(`workflows/rules/${workflowId}`, 'PUT', {
      graphData
    });

    ElMessage.success(t('automations.journeySaved'));
  } catch (err) {
    ElMessage.error(t('automations.saveFailed'));
  } finally {
    saving.value = false;
  }
};

const openSettingsDialog = () => {
  ElMessage.info(t('automations.settingsComingSoon'));
};

onMounted(() => {
  fetchWorkflow();
});
</script>

<style>
.vue-flow-theme-dark {
  background: transparent;
}
.vue-flow-theme-dark .vue-flow__node {
  border-radius: 12px;
}
.vue-flow__edge-path {
  stroke: #475569;
  stroke-width: 2;
}
.vue-flow__connection-path {
  stroke: #6366f1;
  stroke-width: 3;
}
</style>
