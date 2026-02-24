<template lang="pug">
.workflows-page.p-8
  .flex.justify-between.items-start.mb-8
    div
      h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('approvals.workflows') }}
      p(style="color: var(--text-muted)") {{ $t('approvals.workflowsSubtitle') }}
    el-button(type="primary" @click="openCreate" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !rounded-xl")
      Icon(name="ph:plus-bold" size="14" aria-label="Create")
      span.ml-1 {{ $t('approvals.createWorkflow') }}

  .glass-card.p-6
    el-table(:data="workflows" v-loading="loading" style="width: 100%")
      el-table-column(:label="$t('approvals.workflowName')" min-width="200")
        template(#default="{ row }")
          div
            span.font-semibold(style="color: var(--text-primary)") {{ row.name }}
            p.text-xs.mt-1(v-if="row.description" style="color: var(--text-muted)") {{ row.description }}
      el-table-column(:label="$t('approvals.entityType')" width="160")
        template(#default="{ row }")
          el-tag(size="small") {{ $t('approvals.' + entityTypeKey(row.entityType)) }}
      el-table-column(:label="$t('approvals.steps')" width="120" align="center")
        template(#default="{ row }")
          span {{ row.steps?.length || 0 }}
      el-table-column(:label="$t('approvals.active')" width="100" align="center")
        template(#default="{ row }")
          el-tag(:type="row.isActive ? 'success' : 'info'" size="small" effect="dark") {{ row.isActive ? $t('approvals.active') : '—' }}
      el-table-column(:label="$t('common.actions')" width="160" align="center")
        template(#default="{ row }")
          .flex.gap-1.justify-center
            el-button(size="small" @click="openEdit(row)" class="!rounded-lg")
              Icon(name="ph:pencil-simple-bold" size="14")
            el-button(size="small" type="danger" @click="handleDelete(row.id)" class="!rounded-lg")
              Icon(name="ph:trash-bold" size="14")

    .p-8.text-center(v-if="!loading && workflows.length === 0")
      Icon(name="ph:flow-arrow-bold" size="48" style="color: var(--text-muted)")
      p.mt-3(style="color: var(--text-muted)") {{ $t('approvals.noWorkflows') }}

  //- Create / Edit Dialog
  el-dialog(v-model="showDialog" :title="editingId ? $t('approvals.editWorkflow') : $t('approvals.createWorkflow')" width="650px")
    el-form(ref="formRef" :model="form" :rules="formRules" label-position="top")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('approvals.workflowName')" prop="name")
          el-input(v-model="form.name" :placeholder="$t('approvals.workflowName')")
        el-form-item(:label="$t('approvals.entityType')" prop="entityType")
          el-select(v-model="form.entityType" class="w-full")
            el-option(v-for="et in ENTITY_TYPES" :key="et" :value="et" :label="$t('approvals.' + entityTypeKey(et))")
      el-form-item(:label="$t('approvals.description')")
        el-input(v-model="form.description" type="textarea" :rows="2")
      el-form-item
        .flex.items-center.gap-2
          el-switch(v-model="form.isActive")
          span(style="color: var(--text-primary)") {{ $t('approvals.active') }}

      //- Steps Builder
      .mb-2
        label.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('approvals.steps') }}
      .space-y-3
        .flex.items-center.gap-3.p-3.rounded-lg(
          v-for="(step, idx) in form.steps"
          :key="idx"
          style="background: rgba(120, 73, 255, 0.05); border: 1px solid rgba(120, 73, 255, 0.15)"
        )
          .w-8.h-8.rounded-full.flex.items-center.justify-center.text-white.text-sm.font-bold(style="background: #7849ff") {{ idx + 1 }}
          .flex-1.grid.grid-cols-3.gap-3
            el-input(v-model="step.approverName" placeholder="Approver Name" size="small")
            el-input-number(v-model="step.approverUserId" placeholder="User ID" size="small" :min="1" class="w-full")
            .flex.items-center.gap-2
              el-checkbox(v-model="step.required") {{ $t('approvals.required') }}
          el-button(size="small" type="danger" text @click="removeStep(idx)" :disabled="form.steps.length <= 1")
            Icon(name="ph:trash-bold" size="14")
          .flex.flex-col.gap-1(v-if="form.steps.length > 1")
            el-button(size="small" text @click="moveStep(idx, -1)" :disabled="idx === 0")
              Icon(name="ph:caret-up-bold" size="12")
            el-button(size="small" text @click="moveStep(idx, 1)" :disabled="idx === form.steps.length - 1")
              Icon(name="ph:caret-down-bold" size="12")

      el-button.mt-3(text type="primary" @click="addStep")
        Icon(name="ph:plus-bold" size="14")
        span.ml-1 {{ $t('approvals.addStep') }}

    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="handleSave" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';
import { useApprovals } from '~/composables/useApprovals';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const { fetchWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } = useApprovals();

const ENTITY_TYPES = ['PURCHASE_ORDER', 'INVOICE', 'EXPENSE', 'LEAVE_REQUEST', 'CONTRACT', 'GENERAL'];

const workflows = ref<any[]>([]);
const loading = ref(true);
const saving = ref(false);
const showDialog = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref();

const form = reactive({
  name: '',
  description: '',
  entityType: 'GENERAL',
  isActive: true,
  steps: [{ order: 0, approverUserId: 1, approverName: '', required: true }] as Array<{
    order: number;
    approverUserId: number;
    approverName: string;
    required: boolean;
  }>
});

const formRules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  entityType: [{ required: true, message: 'Entity type is required', trigger: 'change' }]
};

onMounted(() => loadWorkflows());

async function loadWorkflows() {
  loading.value = true;
  const res = await fetchWorkflows();
  if (res.success && res.body) {
    workflows.value = res.body;
  }
  loading.value = false;
}

function openCreate() {
  editingId.value = null;
  form.name = '';
  form.description = '';
  form.entityType = 'GENERAL';
  form.isActive = true;
  form.steps = [{ order: 0, approverUserId: 1, approverName: '', required: true }];
  showDialog.value = true;
}

function openEdit(wf: any) {
  editingId.value = wf.id;
  form.name = wf.name;
  form.description = wf.description || '';
  form.entityType = wf.entityType;
  form.isActive = wf.isActive;
  form.steps = (wf.steps || []).map((s: any, idx: number) => ({ ...s, order: idx }));
  if (form.steps.length === 0) form.steps = [{ order: 0, approverUserId: 1, approverName: '', required: true }];
  showDialog.value = true;
}

function addStep() {
  form.steps.push({
    order: form.steps.length,
    approverUserId: 1,
    approverName: '',
    required: true
  });
}

function removeStep(idx: number) {
  form.steps.splice(idx, 1);
  reindexSteps();
}

function moveStep(idx: number, direction: number) {
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= form.steps.length) return;
  const temp = form.steps[idx]!;
  form.steps[idx] = form.steps[newIdx]!;
  form.steps[newIdx] = temp;
  reindexSteps();
}

function reindexSteps() {
  form.steps.forEach((s, i) => {
    s.order = i;
  });
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  reindexSteps();
  saving.value = true;
  try {
    const payload = { ...form };
    let res;
    if (editingId.value) {
      res = await updateWorkflow(editingId.value, payload);
    } else {
      res = await createWorkflow(payload);
    }
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.created') });
      showDialog.value = false;
      await loadWorkflows();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), { type: 'warning' });
    const res = await deleteWorkflow(id);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      await loadWorkflows();
    }
  } catch (e) {
    /* cancelled */
  }
}

function entityTypeKey(type: string): string {
  const map: Record<string, string> = {
    PURCHASE_ORDER: 'purchaseOrder',
    INVOICE: 'invoice',
    EXPENSE: 'expense',
    LEAVE_REQUEST: 'leaveRequest',
    CONTRACT: 'contract',
    GENERAL: 'general'
  };
  return map[type] || 'general';
}
</script>

<style scoped>
.workflows-page {
  animation: fadeIn 0.4s ease-out;
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
