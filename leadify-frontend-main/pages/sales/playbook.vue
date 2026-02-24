<template lang="pug">
div(class="space-y-6 pb-8")
  //- Header
  .flex.items-center.justify-between
    div
      h1(class="text-2xl font-bold text-[var(--text-primary)]") {{ $t('playbook.title') }}
      p(class="text-sm text-[var(--text-secondary)] mt-1") {{ $t('playbook.subtitle') }}
    .flex.items-center.gap-3
      //- Playbook selector (when multiple playbooks exist)
      el-select(
        v-if="playbooks.length > 1"
        v-model="selectedId"
        size="large"
        class="!w-56"
        @change="handlePlaybookChange"
      )
        el-option(
          v-for="pb in playbooks"
          :key="pb.id"
          :label="pb.name"
          :value="pb.id"
        )
      //- Reset progress button
      el-button(
        v-if="selectedPlaybook"
        size="large"
        class="!rounded-2xl"
        @click="handleReset"
      )
        Icon(name="ph:arrow-counter-clockwise-bold" size="16")
        span.ml-1 {{ $t('playbook.resetProgress') }}

  //- Loading state
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon(class="is-loading" size="32")
      Icon(name="ph:spinner" size="32")

  //- Content
  template(v-else-if="selectedPlaybook")
    //- Overall Progress
    PlaybookProgress(
      :percentage="overallCompletion"
      :completedSteps="completedStepsCount"
      :totalSteps="totalStepsCount"
    )

    //- Stages
    div(class="space-y-5")
      PlaybookStage(
        v-for="stage in selectedPlaybook.stages"
        :key="stage.id"
        :stage="stage"
        :progress="currentProgress"
        @toggle-step="handleToggleStep"
      )

  //- Empty state
  .flex.flex-col.items-center.justify-center.py-20(v-else)
    Icon(name="ph:book-open" size="64" class="text-[var(--text-secondary)] opacity-40")
    p(class="text-[var(--text-secondary)] mt-4 text-sm") No playbooks available
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { usePlaybook } from '~/composables/usePlaybook';

definePageMeta({ layout: 'default' });

const { playbooks, selectedPlaybook, loading, fetchPlaybooks, getProgress, toggleStep, getOverallCompletion, resetProgress } = usePlaybook();

const selectedId = ref('');
// Reactive trigger to force re-computation when steps are toggled
const progressVersion = ref(0);

const currentProgress = computed(() => {
  // Access progressVersion to make this reactive
  const _v = progressVersion.value;
  if (!selectedPlaybook.value) return {};
  return getProgress(selectedPlaybook.value.id);
});

const overallCompletion = computed(() => {
  const _v = progressVersion.value;
  if (!selectedPlaybook.value) return 0;
  return getOverallCompletion(selectedPlaybook.value.id);
});

const totalStepsCount = computed(() => {
  if (!selectedPlaybook.value) return 0;
  return selectedPlaybook.value.stages.reduce((sum, s) => sum + s.steps.length, 0);
});

const completedStepsCount = computed(() => {
  const _v = progressVersion.value;
  if (!selectedPlaybook.value) return 0;
  const progress = getProgress(selectedPlaybook.value.id);
  return selectedPlaybook.value.stages.reduce((sum, s) => sum + s.steps.filter(step => progress[step.id]).length, 0);
});

function handleToggleStep(stepId: string) {
  if (!selectedPlaybook.value) return;
  toggleStep(selectedPlaybook.value.id, stepId);
  progressVersion.value++;
}

function handlePlaybookChange(id: string) {
  const pb = playbooks.value.find(p => p.id === id);
  if (pb) selectedPlaybook.value = pb;
}

function handleReset() {
  if (!selectedPlaybook.value) return;
  resetProgress(selectedPlaybook.value.id);
  progressVersion.value++;
}

onMounted(async () => {
  await fetchPlaybooks();
  if (selectedPlaybook.value) {
    selectedId.value = selectedPlaybook.value.id;
  }
});
</script>
