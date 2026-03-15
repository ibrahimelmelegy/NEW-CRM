<template lang="pug">
.sequence-detail-page.p-8
  //- Back Button
  .mb-6
    el-button(text @click="useSafeBack('/marketing/sequences')")
      Icon.mr-1(name="ph:arrow-left-bold" size="16")
      | {{ $t('common.back') }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else-if="sequence")
    //- Header
    .flex.items-center.justify-between.mb-8
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ sequence.name }}
        .flex.items-center.gap-3.mt-1
          el-tag(:type="sequence.isActive ? 'success' : 'info'") {{ sequence.isActive ? $t('common.active') : $t('common.inactive') }}
          span.text-sm(style="color: var(--text-muted)") {{ sequence.steps?.length || 0 }} {{ $t('sequences.steps') }}
      .flex.items-center.gap-2
        el-button(type="primary" @click="editDialogVisible = true" class="!rounded-xl")
          Icon.mr-1(name="ph:pencil-bold" size="16")
          | {{ $t('common.edit') }}

    //- Description
    .glass-card.p-5.mb-6(v-if="sequence.description")
      p.text-sm(style="color: var(--text-muted)") {{ sequence.description }}

    //- Tabs
    el-tabs(v-model="activeTab")
      //- Steps Tab
      el-tab-pane(:label="$t('sequences.steps')" name="steps")
        .flex.justify-end.mb-4
          el-button(type="primary" plain @click="addStep" class="!rounded-lg")
            Icon.mr-1(name="ph:plus-bold" size="14")
            | {{ $t('sequences.addStep') }}

        .space-y-4(v-if="sequence.steps?.length")
          .glass-card.p-5(v-for="(step, idx) in sequence.steps" :key="idx")
            .flex.items-center.justify-between
              .flex.items-center.gap-4
                .w-10.h-10.rounded-full.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
                  span.text-sm.font-bold(style="color: #7849ff") {{ idx + 1 }}
                div
                  .flex.items-center.gap-2
                    el-tag(size="small" :type="stepTypeTag(step.type)") {{ step.type }}
                    span.text-sm.font-semibold(style="color: var(--text-primary)") {{ step.subject || '(No Subject)' }}
                  p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('sequences.delayDays') }}: {{ step.delayDays }} {{ $t('sequences.days') }}
              .flex.items-center.gap-2
                el-button(size="small" plain @click="editStep(idx)" class="!rounded-lg")
                  Icon(name="ph:pencil-bold" size="14")
                el-button(type="danger" size="small" plain @click="removeStep(idx)" class="!rounded-lg")
                  Icon(name="ph:trash-bold" size="14")

        .text-center.py-8(v-else)
          p.text-sm(style="color: var(--text-muted)") {{ $t('sequences.noSteps') }}

      //- Enrollments Tab
      el-tab-pane(:label="$t('sequences.enrollments')" name="enrollments")
        .flex.justify-end.mb-4
          el-button(type="primary" plain @click="enrollDialogVisible = true" class="!rounded-lg")
            Icon.mr-1(name="ph:user-plus-bold" size="14")
            | {{ $t('sequences.enrollEntity') }}

        el-table(:data="enrollments" stripe style="width: 100%" v-if="enrollments.length")
          el-table-column(prop="entityType" :label="$t('sequences.entityType')" min-width="100")
          el-table-column(prop="entityId" :label="$t('sequences.entityId')" min-width="150")
            template(#default="scope")
              span.text-xs.font-mono {{ scope.row.entityId?.slice(0, 8) }}...
          el-table-column(prop="currentStep" :label="$t('sequences.currentStep')" min-width="100")
            template(#default="scope")
              span Step {{ scope.row.currentStep + 1 }} / {{ sequence.steps?.length || 0 }}
          el-table-column(prop="status" :label="$t('sequences.status')" min-width="100")
            template(#default="scope")
              el-tag(size="small" :type="enrollmentStatusType(scope.row.status)") {{ scope.row.status }}
          el-table-column(:label="$t('common.actions')" width="160")
            template(#default="scope")
              .flex.gap-1
                el-button(v-if="scope.row.status === 'active'" size="small" plain @click="handlePause(scope.row)" class="!rounded-lg")
                  Icon(name="ph:pause-bold" size="12")
                el-button(v-if="scope.row.status === 'paused'" size="small" plain @click="handleResume(scope.row)" class="!rounded-lg")
                  Icon(name="ph:play-bold" size="12")
                el-button(v-if="scope.row.status === 'active'" type="primary" size="small" plain @click="handleAdvance(scope.row)" class="!rounded-lg")
                  Icon(name="ph:fast-forward-bold" size="12")

        .text-center.py-8(v-else)
          p.text-sm(style="color: var(--text-muted)") {{ $t('sequences.noEnrollments') }}

      //- Stats Tab
      el-tab-pane(:label="$t('sequences.statistics')" name="stats")
        .grid.gap-4(class="grid-cols-2 md:grid-cols-5")
          .glass-card.p-4.text-center
            p.text-xs.font-semibold.uppercase.mb-1(style="color: var(--text-muted)") {{ $t('sequences.totalEnrolled') }}
            p.text-2xl.font-bold(style="color: #7849ff") {{ stats.totalEnrolled }}
          .glass-card.p-4.text-center
            p.text-xs.font-semibold.uppercase.mb-1(style="color: var(--text-muted)") {{ $t('sequences.active') }}
            p.text-2xl.font-bold(style="color: #22c55e") {{ stats.active }}
          .glass-card.p-4.text-center
            p.text-xs.font-semibold.uppercase.mb-1(style="color: var(--text-muted)") {{ $t('sequences.paused') }}
            p.text-2xl.font-bold(style="color: #f59e0b") {{ stats.paused }}
          .glass-card.p-4.text-center
            p.text-xs.font-semibold.uppercase.mb-1(style="color: var(--text-muted)") {{ $t('sequences.completed') }}
            p.text-2xl.font-bold(style="color: #3b82f6") {{ stats.completed }}
          .glass-card.p-4.text-center
            p.text-xs.font-semibold.uppercase.mb-1(style="color: var(--text-muted)") {{ $t('sequences.cancelled') }}
            p.text-2xl.font-bold(style="color: #ef4444") {{ stats.cancelled }}

  //- Edit Sequence Dialog
  el-dialog(v-model="editDialogVisible" :title="$t('sequences.editSequence')" width="500px")
    el-form(:model="editForm" label-position="top")
      el-form-item(:label="$t('sequences.name')" required)
        el-input(v-model="editForm.name")
      el-form-item(:label="$t('sequences.descriptionLabel')")
        el-input(v-model="editForm.description" type="textarea" :rows="3")
      el-form-item(:label="$t('sequences.activeStatus')")
        el-switch(v-model="editForm.isActive")
    template(#footer)
      el-button(@click="editDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSaveEdit" :loading="saving") {{ $t('common.save') }}

  //- Step Editor Dialog
  el-dialog(v-model="stepDialogVisible" :title="editingStepIndex >= 0 ? $t('sequences.editStep') : $t('sequences.addStep')" width="600px")
    el-form(:model="stepForm" label-position="top")
      el-form-item(:label="$t('sequences.stepType')" required)
        el-select(v-model="stepForm.type" style="width: 100%")
          el-option(:label="$t('sequences.email')" value="email")
          el-option(:label="$t('sequences.wait')" value="wait")
          el-option(:label="$t('sequences.task')" value="task")
      el-form-item(:label="$t('sequences.subject')")
        el-input(v-model="stepForm.subject")
      el-form-item(:label="$t('sequences.body')")
        el-input(v-model="stepForm.body" type="textarea" :rows="5")
      el-form-item(:label="$t('sequences.delayDays')")
        el-input-number(v-model="stepForm.delayDays" :min="0" style="width: 100%")
    template(#footer)
      el-button(@click="stepDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSaveStep" :loading="saving") {{ $t('common.save') }}

  //- Enroll Dialog
  el-dialog(v-model="enrollDialogVisible" :title="$t('sequences.enrollEntity')" width="500px")
    el-form(:model="enrollForm" label-position="top")
      el-form-item(:label="$t('sequences.entityType')" required)
        el-select(v-model="enrollForm.entityType" style="width: 100%")
          el-option(:label="$t('common.lead')" value="lead")
          el-option(:label="$t('common.client')" value="client")
          el-option(:label="$t('common.deal')" value="deal")
          el-option(:label="$t('common.opportunity')" value="opportunity")
      el-form-item(:label="$t('sequences.entityId')" required)
        el-input(v-model="enrollForm.entityId" :placeholder="$t('sequences.entityUuid')")
    template(#footer)
      el-button(@click="enrollDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleEnroll" :loading="saving") {{ $t('sequences.enroll') }}
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElNotification, ElMessage } from 'element-plus';
import {
  fetchSequences,
  updateSequence,
  fetchEnrollments,
  fetchSequenceStats,
  enrollEntity,
  advanceStep,
  pauseEnrollment,
  resumeEnrollment
} from '~/composables/useSequences';
import type { Sequence, SequenceEnrollment, SequenceStats, SequenceStep } from '~/composables/useSequences';
import { useSafeBack } from '~/composables/useSafeBack';
import logger from '~/utils/logger';

definePageMeta({ title: 'Sequence Detail' });

const route = useRoute();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const saving = ref(false);
const activeTab = ref('steps');
const editDialogVisible = ref(false);
const stepDialogVisible = ref(false);
const enrollDialogVisible = ref(false);
const editingStepIndex = ref(-1);

const sequence = ref<Sequence | null>(null);
const enrollments = ref<SequenceEnrollment[]>([]);
const stats = ref<SequenceStats>({ totalEnrolled: 0, active: 0, paused: 0, completed: 0, cancelled: 0 });

const editForm = reactive({ name: '', description: '', isActive: true });
const stepForm = reactive({ type: 'email', subject: '', body: '', delayDays: 1 });
const enrollForm = reactive({ entityType: 'lead', entityId: '' });

async function loadData() {
  loading.value = true;
  try {
    const id = route.params.id as string;
    const [seqRes, enrollRes, statsRes] = await Promise.all([fetchSequences({ id }), fetchEnrollments(id), fetchSequenceStats(id)]);
    sequence.value = seqRes.docs[0] || null;
    enrollments.value = enrollRes;
    stats.value = statsRes;
    if (sequence.value) {
      editForm.name = sequence.value.name;
      editForm.description = sequence.value.description || '';
      editForm.isActive = sequence.value.isActive;
    }
  } catch (e) {
    logger.error('Failed to load sequence', e);
  } finally {
    loading.value = false;
  }
}

await loadData().catch(() => {
  loading.value = false;
});

function stepTypeTag(type: string) {
  const map: Record<string, string> = { email: 'primary', wait: 'warning', task: 'success' };
  return (map[type] || 'info') as unknown;
}

function enrollmentStatusType(status: string) {
  const map: Record<string, string> = { active: 'success', paused: 'warning', completed: 'primary', cancelled: 'danger' };
  return (map[status] || 'info') as unknown;
}

async function handleSaveEdit() {
  if (!sequence.value || !editForm.name) return;
  saving.value = true;
  try {
    await updateSequence(sequence.value.id, { name: editForm.name, description: editForm.description, isActive: editForm.isActive });
    sequence.value.name = editForm.name;
    sequence.value.description = editForm.description;
    sequence.value.isActive = editForm.isActive;
    editDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.updatedSuccessfully') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

function addStep() {
  editingStepIndex.value = -1;
  stepForm.type = 'email';
  stepForm.subject = '';
  stepForm.body = '';
  stepForm.delayDays = 1;
  stepDialogVisible.value = true;
}

function editStep(idx: number) {
  if (!sequence.value) return;
  const step = sequence.value.steps[idx]!;
  editingStepIndex.value = idx;
  stepForm.type = step.type;
  stepForm.subject = step.subject;
  stepForm.body = step.body;
  stepForm.delayDays = step.delayDays;
  stepDialogVisible.value = true;
}

function removeStep(idx: number) {
  if (!sequence.value) return;
  const steps = [...sequence.value.steps];
  steps.splice(idx, 1);
  steps.forEach((s, i) => {
    s.order = i;
  });
  saving.value = true;
  updateSequence(sequence.value.id, { steps })
    .then(() => {
      sequence.value!.steps = steps;
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deletedSuccessfully') });
    })
    .catch(() => {
      ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
    })
    .finally(() => {
      saving.value = false;
    });
}

async function handleSaveStep() {
  if (!sequence.value) return;
  saving.value = true;
  try {
    const steps = [...(sequence.value.steps || [])];
    const newStep: SequenceStep = {
      order: editingStepIndex.value >= 0 ? editingStepIndex.value : steps.length,
      type: stepForm.type,
      subject: stepForm.subject,
      body: stepForm.body,
      delayDays: stepForm.delayDays
    };
    if (editingStepIndex.value >= 0) {
      steps[editingStepIndex.value] = newStep;
    } else {
      steps.push(newStep);
    }
    await updateSequence(sequence.value.id, { steps });
    sequence.value.steps = steps;
    stepDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.savedSuccessfully') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleEnroll() {
  if (!sequence.value || !enrollForm.entityId) return;
  saving.value = true;
  try {
    await enrollEntity(sequence.value.id, enrollForm.entityType, enrollForm.entityId);
    enrollments.value = await fetchEnrollments(sequence.value.id);
    stats.value = await fetchSequenceStats(sequence.value.id);
    enrollDialogVisible.value = false;
    enrollForm.entityId = '';
    ElNotification({ type: 'success', title: t('common.success'), message: t('sequences.enrolled') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handlePause(enrollment: SequenceEnrollment) {
  try {
    await pauseEnrollment(enrollment.id);
    enrollment.status = 'paused';
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}

async function handleResume(enrollment: SequenceEnrollment) {
  try {
    await resumeEnrollment(enrollment.id);
    enrollment.status = 'active';
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}

async function handleAdvance(enrollment: SequenceEnrollment) {
  try {
    await advanceStep(enrollment.id);
    enrollment.currentStep += 1;
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}
</script>

<style lang="scss" scoped>
.sequence-detail-page {
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
