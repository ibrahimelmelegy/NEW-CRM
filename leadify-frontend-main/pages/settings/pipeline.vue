<template lang="pug">
.pipeline-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('navigation.pipeline') || 'Pipeline Stages' }}
    p(style="color: var(--text-muted)") Configure deal and opportunity pipeline stages

  .max-w-3xl
    //- Entity Type Selector
    .flex.items-center.gap-3.mb-6
      el-select(v-model="entityType" @change="loadStages" style="width: 160px")
        el-option(label="Deal" value="deal")
        el-option(label="Opportunity" value="opportunity")
      el-button(type="primary" @click="openDialog()" class="!rounded-xl")
        Icon.mr-1(name="ph:plus-bold" size="16")
        | Add Stage

    //- Loading
    .flex.items-center.justify-center.py-20(v-if="loading")
      el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

    //- Stages List (Draggable)
    template(v-else)
      .space-y-3(v-if="stages.length")
        .glass-card.p-4.flex.items-center.gap-4.cursor-move(
          v-for="(stage, index) in stages"
          :key="stage.id"
          draggable="true"
          @dragstart="dragStart(index)"
          @dragover.prevent="dragOver(index)"
          @drop="drop(index)"
          :style="{ borderLeft: '4px solid ' + stage.color }"
        )
          .flex.items-center.gap-2(style="min-width: 32px")
            Icon(name="ph:dots-six-vertical-bold" size="20" style="color: var(--text-muted)")
          .flex-1
            .flex.items-center.gap-3
              .w-4.h-4.rounded-full(:style="{ background: stage.color }")
              span.text-sm.font-semibold(style="color: var(--text-primary)") {{ stage.name }}
              el-tag(v-if="stage.isDefault" size="small" type="info") Default
              el-tag(v-if="stage.isWon" size="small" type="success") Won
              el-tag(v-if="stage.isLost" size="small" type="danger") Lost
            .flex.items-center.gap-2.mt-1
              span.text-xs(style="color: var(--text-muted)") {{ stage.probability }}% probability
          .flex.items-center.gap-2
            el-button(size="small" @click="openDialog(stage)" class="!rounded-lg")
              Icon(name="ph:pencil-bold" size="14")
            el-button(size="small" type="danger" plain @click="handleDelete(stage)" class="!rounded-lg")
              Icon(name="ph:trash-bold" size="14")

      .text-center.py-12(v-else)
        Icon(name="ph:flow-arrow-bold" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-3(style="color: var(--text-muted)") No pipeline stages configured

  //- Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingStage ? 'Edit Stage' : 'Add Stage'" width="500px")
    el-form(:model="form" label-position="top")
      el-form-item(label="Stage Name" required)
        el-input(v-model="form.name" placeholder="e.g. Qualification")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(label="Color")
          .flex.flex-wrap.gap-2
            .w-8.h-8.rounded-lg.cursor-pointer(
              v-for="color in presetColors"
              :key="color"
              :style="{ background: color, border: form.color === color ? '2px solid white' : '2px solid transparent' }"
              @click="form.color = color"
            )
        el-form-item(label="Probability %")
          el-slider(v-model="form.probability" :min="0" :max="100" :step="5" show-input :show-input-controls="false" input-size="small")
      .flex.items-center.gap-6
        el-checkbox(v-model="form.isDefault") Default Stage
        el-checkbox(v-model="form.isWon") Won Stage
        el-checkbox(v-model="form.isLost") Lost Stage
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import {
  fetchPipelineStages,
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
  reorderPipelineStages
} from '~/composables/usePipelineConfig';
import type { PipelineStage } from '~/composables/usePipelineConfig';

definePageMeta({ title: 'Pipeline Stages' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const saving = ref(false);
const dialogVisible = ref(false);
const entityType = ref('deal');
const editingStage = ref<PipelineStage | null>(null);
const stages = ref<PipelineStage[]>([]);
let dragIndex = -1;

const presetColors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f97316'];

const form = reactive({
  name: '',
  color: '#7849ff',
  probability: 0,
  isDefault: false,
  isWon: false,
  isLost: false
});

// Load initial data
async function loadStages() {
  loading.value = true;
  try {
    stages.value = await fetchPipelineStages(entityType.value);
  } finally {
    loading.value = false;
  }
}

await loadStages().catch(() => {
  loading.value = false;
});

function openDialog(stage?: PipelineStage) {
  if (stage) {
    editingStage.value = stage;
    form.name = stage.name;
    form.color = stage.color;
    form.probability = stage.probability;
    form.isDefault = stage.isDefault;
    form.isWon = stage.isWon;
    form.isLost = stage.isLost;
  } else {
    editingStage.value = null;
    form.name = '';
    form.color = '#7849ff';
    form.probability = 0;
    form.isDefault = false;
    form.isWon = false;
    form.isLost = false;
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.name.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form, entityType: entityType.value };
    if (editingStage.value) {
      await updatePipelineStage(editingStage.value.id, payload);
    } else {
      await createPipelineStage(payload);
    }
    await loadStages();
    dialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleDelete(stage: PipelineStage) {
  try {
    await ElMessageBox.confirm(t('common.confirmAction'), t('common.warning'), { type: 'warning' });
    await deletePipelineStage(stage.id);
    await loadStages();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
  } catch (e: any) { ElMessage.error(t('common.error')); }
}

// Drag and drop reorder
function dragStart(index: number) {
  dragIndex = index;
}

function dragOver(index: number) {
  // Visual feedback could be added here
}

async function drop(index: number) {
  if (dragIndex === index || dragIndex < 0) return;
  // Optimistic reorder
  const originalStages = [...stages.value];
  const item = stages.value.splice(dragIndex, 1)[0]!;
  stages.value.splice(index, 0, item);
  const stageIds = stages.value.map(s => s.id);
  try {
    const { success } = await reorderPipelineStages(entityType.value, stageIds);
    if (success) {
      // Update local order values to reflect new positions
      stages.value.forEach((s, i) => { s.order = i + 1; });
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    } else {
      // Revert on API failure
      stages.value = originalStages;
      ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
    }
  } catch {
    stages.value = originalStages;
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    dragIndex = -1;
  }
}
</script>

<style lang="scss" scoped>
.pipeline-page {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
