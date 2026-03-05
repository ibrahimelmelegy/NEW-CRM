<template lang="pug">
.workflows-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('workflows.title') }}
    p(style="color: var(--text-muted)") {{ $t('workflows.subtitle') }}

  .glass-card.p-6
    .flex.justify-between.items-center.mb-6
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('workflows.myWorkflows') }}
      el-button(type="primary" @click="showBuilder = true" class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
        Icon(name="ph:plus-bold" size="16" aria-hidden="true")
        span.ml-2 {{ $t('workflows.create') }}

    el-skeleton(:rows="3" animated v-if="loading")

    .space-y-3(v-else-if="workflows.length")
      .workflow-item.p-4.rounded-xl(
        v-for="wf in workflows"
        :key="wf.id"
        style="background: var(--bg-input); border: 1px solid var(--border-default)"
      )
        .flex.items-start.justify-between
          div
            .flex.items-center.gap-3.mb-2
              span.font-bold(style="color: var(--text-primary)") {{ wf.name }}
              el-tag(:type="wf.isActive ? 'success' : 'danger'" size="small" effect="dark") {{ wf.isActive ? $t('workflows.active') : $t('workflows.inactive') }}
              el-tag(size="small" effect="plain") {{ wf.executionCount }} {{ $t('workflows.runs') }}
            p.text-sm(style="color: var(--text-muted)")
              span.font-medium {{ $t('workflows.trigger') }}:
              |  {{ getTriggerLabel(wf.trigger) }}
            .flex.gap-1.mt-2
              el-tag(v-for="(action, i) in wf.actions" :key="i" size="small" type="info") {{ getActionLabel(action.type) }}
          .flex.gap-2.items-center
            el-switch(v-model="wf.isActive" @change="handleToggle(wf)" size="small")
            el-button(link @click="editWorkflow(wf)" size="small")
              Icon(name="ph:pencil" size="16" aria-label="Edit")
            el-button(link @click="viewLogs(wf.id)" size="small")
              Icon(name="ph:list-bullets" size="16" aria-label="Logs")
            el-button(link @click="removeWorkflow(wf.id)" size="small")
              Icon(name="ph:trash" size="16" class="text-red-400" aria-label="Delete")

    .text-center.py-8(v-else)
      Icon(name="ph:lightning" size="48" style="color: var(--text-muted)" aria-hidden="true")
      p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('workflows.noWorkflows') }}

  //- Workflow Builder Dialog
  el-dialog(v-model="showBuilder" :title="editingId ? $t('workflows.edit') : $t('workflows.create')" width="700px" :close-on-click-modal="false")
    .space-y-6
      //- Name
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('workflows.name') }}
        el-input(v-model="form.name" :placeholder="$t('workflows.namePlaceholder')")

      //- Trigger
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('workflows.trigger') }}
        el-select(v-model="form.trigger" class="w-full" :placeholder="$t('workflows.selectTrigger')")
          el-option(v-for="t in WORKFLOW_TRIGGERS" :key="t.value" :label="t.label" :value="t.value")

      //- Conditions
      .form-group
        .flex.justify-between.items-center.mb-2
          label.text-sm.font-medium {{ $t('workflows.conditions') }}
          el-button(link size="small" @click="addCondition")
            Icon(name="ph:plus" size="14" aria-hidden="true")
            span.ml-1 {{ $t('common.add') }}
        .space-y-2
          .flex.gap-2.items-center(v-for="(cond, i) in form.conditions" :key="i")
            el-input(v-model="cond.field" :placeholder="$t('workflows.field')" class="flex-1")
            el-select(v-model="cond.operator" class="w-40")
              el-option(v-for="op in CONDITION_OPERATORS" :key="op.value" :label="op.label" :value="op.value")
            el-input(v-model="cond.value" :placeholder="$t('workflows.value')" class="flex-1")
            el-button(link @click="form.conditions.splice(i, 1)" size="small")
              Icon(name="ph:x" size="14" class="text-red-400" aria-label="Remove")

      //- Actions
      .form-group
        .flex.justify-between.items-center.mb-2
          label.text-sm.font-medium {{ $t('workflows.actions') }}
          el-button(link size="small" @click="addAction")
            Icon(name="ph:plus" size="14" aria-hidden="true")
            span.ml-1 {{ $t('common.add') }}
        .space-y-3
          .p-3.rounded-lg(
            v-for="(action, i) in form.actions"
            :key="i"
            style="background: var(--bg-input); border: 1px solid var(--border-default)"
          )
            .flex.justify-between.items-center.mb-2
              el-select(v-model="action.type" class="w-48")
                el-option(v-for="at in ACTION_TYPES" :key="at.value" :label="at.label" :value="at.value")
              el-button(link @click="form.actions.splice(i, 1)" size="small")
                Icon(name="ph:x" size="14" class="text-red-400" aria-label="Remove")
            //- Dynamic config based on action type
            template(v-if="action.type === 'SEND_EMAIL'")
              el-input.mb-2(v-model="action.config.to" :placeholder="$t('workflows.recipientEmail')")
              el-input(v-model="action.config.subject" :placeholder="$t('workflows.emailSubject')")
            template(v-else-if="action.type === 'CREATE_NOTIFICATION'")
              el-input(v-model="action.config.message" :placeholder="$t('workflows.notificationMessage')")
            template(v-else-if="action.type === 'UPDATE_FIELD'")
              .flex.gap-2
                el-input(v-model="action.config.field" :placeholder="$t('workflows.fieldName')" class="flex-1")
                el-input(v-model="action.config.value" :placeholder="$t('workflows.newValue')" class="flex-1")
            template(v-else-if="action.type === 'ASSIGN_USER'")
              el-input(v-model="action.config.userId" :placeholder="$t('workflows.userId')")

      el-checkbox(v-model="form.isActive") {{ $t('workflows.active') }}

    template(#footer)
      el-button(@click="showBuilder = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveWorkflow" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('common.save') }}

  //- Logs Dialog
  el-dialog(v-model="showLogs" :title="$t('workflows.executionLogs')" width="600px")
    el-skeleton(:rows="3" animated v-if="logsLoading")
    .space-y-2(v-else-if="logs.length")
      .p-3.rounded-lg(
        v-for="log in logs"
        :key="log.id"
        style="background: var(--bg-input); border: 1px solid var(--border-default)"
      )
        .flex.justify-between.items-center
          .flex.items-center.gap-2
            el-tag(:type="log.status === 'SUCCESS' ? 'success' : 'danger'" size="small") {{ log.status }}
            span.text-sm(style="color: var(--text-primary)") {{ log.trigger }}
          span.text-xs(style="color: var(--text-muted)") {{ formatDate(log.createdAt) }}
        p.text-xs.mt-1(style="color: var(--text-muted)" v-if="log.details") {{ log.details }}
    .text-center.py-4(v-else)
      p.text-sm(style="color: var(--text-muted)") {{ $t('workflows.noLogs') }}
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  fetchWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  fetchWorkflowLogs,
  WORKFLOW_TRIGGERS,
  CONDITION_OPERATORS,
  ACTION_TYPES,
  type Workflow
} from '~/composables/useWorkflows';

const loading = ref(true);
const saving = ref(false);
const workflows = ref<Workflow[]>([]);
const showBuilder = ref(false);
const showLogs = ref(false);
const logsLoading = ref(false);
const logs = ref<Record<string, unknown>[]>([]);
const editingId = ref<string | null>(null);

const emptyForm = () => ({
  name: '',
  trigger: '',
  conditions: [] as unknown[],
  actions: [] as unknown[],
  isActive: true
});

const form = ref(emptyForm());

onMounted(async () => {
  workflows.value = await fetchWorkflows();
  loading.value = false;
});

function getTriggerLabel(value: string) {
  return WORKFLOW_TRIGGERS.find(t => t.value === value)?.label || value;
}

function getActionLabel(value: string) {
  return ACTION_TYPES.find(a => a.value === value)?.label || value;
}

function addCondition() {
  form.value.conditions.push({ field: '', operator: 'EQUALS', value: '' });
}

function addAction() {
  form.value.actions.push({ type: 'SEND_EMAIL', config: {} });
}

function editWorkflow(wf: Workflow) {
  editingId.value = wf.id;
  form.value = {
    name: wf.name,
    trigger: wf.trigger,
    conditions: [...(wf.conditions || [])],
    actions: (wf.actions || []).map((a) => ({ type: a.type, config: { ...a.config } })),
    isActive: wf.isActive
  };
  showBuilder.value = true;
}

async function saveWorkflow() {
  saving.value = true;
  const data = { ...form.value };
  if (editingId.value) {
    await updateWorkflow(editingId.value, data);
  } else {
    await createWorkflow(data);
  }
  workflows.value = await fetchWorkflows();
  showBuilder.value = false;
  editingId.value = null;
  form.value = emptyForm();
  saving.value = false;
}

async function removeWorkflow(id: string) {
  await deleteWorkflow(id);
  workflows.value = workflows.value.filter(w => w.id !== id);
}

async function handleToggle(wf: Workflow) {
  await toggleWorkflow(wf.id, wf.isActive);
}

async function viewLogs(id: string) {
  showLogs.value = true;
  logsLoading.value = true;
  logs.value = await fetchWorkflowLogs(id);
  logsLoading.value = false;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}
</script>
