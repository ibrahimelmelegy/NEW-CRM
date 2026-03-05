<template lang="pug">
.workflows-page.p-6.space-y-6
  //- Header
  .flex.justify-between.items-center
    div
      h1.text-2xl.font-bold(style="color: var(--text-primary);") {{ $t('workflows.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('workflows.subtitle') }}
    .flex.gap-3
      el-button(
        @click="showCreateDialog = true"
        type="primary"
        class="!rounded-xl"
      )
        Icon(name="ph:plus-bold" class="w-4 h-4 mr-2")
        | {{ $t('workflows.create') }}

  //- Filters
  .grid.grid-cols-4.gap-4.p-4.rounded-2xl.border(
    style="border-color: var(--border-default); background: var(--bg-elevated);"
  )
    el-input(
      v-model="searchQuery"
      :placeholder="$t('common.search')"
      prefix-icon="Search"
      clearable
      class="!rounded-xl"
      @input="debouncedFetch"
    )
    el-select(
      v-model="filterEntityType"
      :placeholder="$t('workflows.entityType')"
      clearable
      class="!rounded-xl w-full"
      @change="loadWorkflows"
    )
      el-option(
        v-for="et in entityTypes"
        :key="et.value"
        :label="et.label"
        :value="et.value"
      )
    el-select(
      v-model="filterTriggerType"
      :placeholder="$t('workflows.triggerType')"
      clearable
      class="!rounded-xl w-full"
      @change="loadWorkflows"
    )
      el-option(
        v-for="tt in triggerTypes"
        :key="tt.value"
        :label="tt.label"
        :value="tt.value"
      )
    el-select(
      v-model="filterStatus"
      :placeholder="$t('workflows.status')"
      clearable
      class="!rounded-xl w-full"
      @change="loadWorkflows"
    )
      el-option(:label="$t('workflows.active')" value="true")
      el-option(:label="$t('workflows.inactive')" value="false")

  //- Loading skeleton
  .grid.grid-cols-1.md-grid-cols-2.lg-grid-cols-3.gap-6(v-if="loading")
    .p-6.rounded-2xl.border.animate-pulse(
      v-for="i in 6"
      :key="i"
      style="border-color: var(--border-default); background: var(--bg-elevated);"
    )
      .w-2-3.h-5.rounded.mb-3(style="background: var(--bg-card);")
      .w-1-2.h-4.rounded.mb-6(style="background: var(--bg-card);")
      .w-full.h-3.rounded(style="background: var(--bg-card);")

  //- Empty state
  .p-12.rounded-2xl.border.text-center(
    v-else-if="workflows.length === 0 && !loading"
    style="border-color: var(--border-default); background: var(--bg-elevated);"
  )
    .w-20.h-20.mx-auto.mb-4.rounded-full.flex.items-center.justify-center(
      style="background: rgba(120, 73, 255, 0.1);"
    )
      Icon(name="ph:lightning-bold" class="w-10 h-10" style="color: var(--accent-color, #7849ff);")
    h3.text-xl.font-medium.mb-2(style="color: var(--text-primary);") {{ $t('workflows.noWorkflows') }}
    p.text-sm.mb-6(style="color: var(--text-muted);") {{ $t('workflows.noWorkflowsDesc') }}
    el-button(type="primary" class="!rounded-xl" @click="showCreateDialog = true")
      | {{ $t('workflows.create') }}

  //- Workflow Cards Grid
  .grid.grid-cols-1.md-grid-cols-2.lg-grid-cols-3.gap-6(v-else)
    .p-5.rounded-2xl.border.transition-all.group.relative(
      v-for="wf in workflows"
      :key="wf.id"
      style="border-color: var(--border-default); background: var(--bg-elevated);"
      class="hover:border-[color:var(--accent-color)]/40 hover:shadow-lg"
    )
      //- Header row
      .flex.justify-between.items-start.mb-3
        .flex.items-center.gap-3
          .w-10.h-10.rounded-lg.flex.items-center.justify-center(
            :style="{ background: wf.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)' }"
          )
            Icon(
              :name="getEntityIcon(wf.entityType)"
              class="w-5 h-5"
              :style="{ color: wf.isActive ? '#22c55e' : '#94a3b8' }"
            )
          div
            h3.font-semibold.text-sm.line-clamp-1(style="color: var(--text-primary);") {{ wf.name }}
            .flex.items-center.gap-2.mt-1
              el-tag(
                :type="wf.isActive ? 'success' : 'info'"
                size="small"
                effect="dark"
              ) {{ wf.isActive ? $t('workflows.active') : $t('workflows.inactive') }}
              el-tag(size="small" effect="plain" type="") {{ wf.entityType }}

        el-dropdown(trigger="click" @command="(cmd) => handleCommand(cmd, wf)")
          el-button(link size="small")
            Icon(name="ph:dots-three-vertical-bold" class="w-5 h-5" style="color: var(--text-muted);")
          template(#dropdown)
            el-dropdown-menu
              el-dropdown-item(command="edit")
                Icon(name="ph:pencil-simple" class="w-4 h-4 mr-2")
                | {{ $t('workflows.edit') }}
              el-dropdown-item(command="canvas")
                Icon(name="ph:flow-arrow" class="w-4 h-4 mr-2")
                | {{ $t('workflows.openCanvas') }}
              el-dropdown-item(command="toggle")
                Icon(:name="wf.isActive ? 'ph:pause' : 'ph:play'" class="w-4 h-4 mr-2")
                | {{ wf.isActive ? $t('workflows.pause') : $t('workflows.activate') }}
              el-dropdown-item(command="execute")
                Icon(name="ph:play-circle" class="w-4 h-4 mr-2")
                | {{ $t('workflows.runManually') }}
              el-dropdown-item(command="test")
                Icon(name="ph:flask" class="w-4 h-4 mr-2")
                | {{ $t('workflows.testRun') }}
              el-dropdown-item(command="logs")
                Icon(name="ph:list-dashes" class="w-4 h-4 mr-2")
                | {{ $t('workflows.executionLogs') }}
              el-dropdown-item(divided command="delete")
                span.text-red-400
                  Icon(name="ph:trash" class="w-4 h-4 mr-2")
                  | {{ $t('common.delete') }}

      //- Description
      p.text-xs.line-clamp-2.mb-4.min-h-8(style="color: var(--text-muted);")
        | {{ wf.description || $t('workflows.noDescription') }}

      //- Trigger info
      .flex.items-center.gap-2.mb-3.text-xs(style="color: var(--text-muted);")
        Icon(name="ph:lightning" class="w-3.5 h-3.5")
        span {{ getTriggerLabel(wf.triggerType) }}
        template(v-if="wf.triggerField")
          span.mx-1 |
          span {{ wf.triggerField }}
          template(v-if="wf.triggerValue")
            span = {{ wf.triggerValue }}

      //- Actions summary
      .flex.flex-wrap.gap-1.mb-4
        el-tag(
          v-for="(action, idx) in (wf.actions || []).slice(0, 3)"
          :key="idx"
          size="small"
          effect="plain"
          type="info"
        ) {{ getActionLabel(action.type) }}
        el-tag(
          v-if="(wf.actions || []).length > 3"
          size="small"
          effect="plain"
        ) +{{ wf.actions.length - 3 }}

      //- Footer stats
      .flex.items-center.justify-between.pt-3.border-t(style="border-color: var(--border-default);")
        .flex.flex-col
          span.text-xs(style="color: var(--text-muted);") {{ $t('workflows.executions') }}
          span.text-sm.font-medium(style="color: var(--text-primary);") {{ wf.executionCount || 0 }}
        .flex.flex-col.text-right
          span.text-xs(style="color: var(--text-muted);") {{ $t('workflows.lastRun') }}
          span.text-sm(style="color: var(--text-primary);")
            | {{ wf.lastExecutedAt ? formatDate(wf.lastExecutedAt) : $t('workflows.never') }}

  //- Pagination
  .flex.justify-center.pt-4(v-if="pagination.totalPages > 1")
    el-pagination(
      v-model:current-page="pagination.page"
      :page-size="pagination.limit"
      :total="pagination.totalItems"
      layout="prev, pager, next"
      @current-change="loadWorkflows"
    )

  //- Create/Edit Dialog
  el-dialog(
    v-model="showCreateDialog"
    :title="editingWorkflow ? $t('workflows.edit') : $t('workflows.create')"
    width="720px"
    destroy-on-close
    class="dark-dialog"
  )
    el-form(
      ref="formRef"
      :model="form"
      label-position="top"
      @submit.prevent="saveWorkflow"
    )
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('workflows.name')" prop="name" required)
          el-input(v-model="form.name" :placeholder="$t('workflows.namePlaceholder')")

        el-form-item(:label="$t('workflows.entityType')" prop="entityType" required)
          el-select(v-model="form.entityType" class="w-full")
            el-option(
              v-for="et in entityTypes"
              :key="et.value"
              :label="et.label"
              :value="et.value"
            )

      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('workflows.triggerType')" prop="triggerType" required)
          el-select(v-model="form.triggerType" class="w-full")
            el-option(
              v-for="tt in triggerTypes"
              :key="tt.value"
              :label="tt.label"
              :value="tt.value"
            )

        el-form-item(:label="$t('workflows.conditionLogic')")
          el-select(v-model="form.conditionLogic" class="w-full")
            el-option(label="AND (all must match)" value="AND")
            el-option(label="OR (any must match)" value="OR")

      //- Field Change specific
      .grid.grid-cols-2.gap-4(v-if="form.triggerType === 'ON_FIELD_CHANGE'")
        el-form-item(:label="$t('workflows.triggerField')")
          el-input(v-model="form.triggerField" placeholder="e.g. status, stage")
        el-form-item(:label="$t('workflows.triggerValue')")
          el-input(v-model="form.triggerValue" placeholder="e.g. qualified, WON")

      el-form-item(:label="$t('workflows.description')")
        el-input(
          v-model="form.description"
          type="textarea"
          :rows="2"
          :placeholder="$t('workflows.descriptionPlaceholder')"
        )

      //- Priority and Active
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('workflows.priority')")
          el-input-number(v-model="form.priority" :min="0" :max="100")
        el-form-item(:label="$t('workflows.activeToggle')")
          el-switch(v-model="form.isActive")

      //- Conditions
      .mb-4
        .flex.justify-between.items-center.mb-2
          h4.font-medium(style="color: var(--text-primary);") {{ $t('workflows.conditions') }}
          el-button(size="small" @click="addCondition" class="!rounded-lg")
            Icon(name="ph:plus" class="w-3.5 h-3.5 mr-1")
            | {{ $t('workflows.addCondition') }}
        .space-y-2
          .flex.items-center.gap-2(v-for="(cond, idx) in form.conditions" :key="idx")
            el-input(v-model="cond.field" placeholder="Field" class="flex-1")
            el-select(v-model="cond.operator" class="w-40")
              el-option(
                v-for="op in conditionOperators"
                :key="op.value"
                :label="op.label"
                :value="op.value"
              )
            el-input(
              v-if="!['is_empty', 'is_not_empty'].includes(cond.operator)"
              v-model="cond.value"
              placeholder="Value"
              class="flex-1"
            )
            el-button(
              link
              type="danger"
              @click="form.conditions.splice(idx, 1)"
            )
              Icon(name="ph:x" class="w-4 h-4")

      //- Actions
      .mb-4
        .flex.justify-between.items-center.mb-2
          h4.font-medium(style="color: var(--text-primary);") {{ $t('workflows.actions') }}
          el-button(size="small" @click="addAction" class="!rounded-lg")
            Icon(name="ph:plus" class="w-3.5 h-3.5 mr-1")
            | {{ $t('workflows.addAction') }}
        .space-y-3
          .p-3.rounded-lg.border(
            v-for="(action, idx) in form.actions"
            :key="idx"
            style="border-color: var(--border-default); background: var(--bg-card);"
          )
            .flex.justify-between.items-center.mb-2
              el-select(v-model="action.type" class="w-52" @change="onActionTypeChange(action)")
                el-option(
                  v-for="at in actionTypes"
                  :key="at.value"
                  :label="at.label"
                  :value="at.value"
                )
              el-button(link type="danger" @click="form.actions.splice(idx, 1)")
                Icon(name="ph:trash" class="w-4 h-4")

            //- Action config fields based on type
            .grid.grid-cols-2.gap-2(v-if="action.type === 'UPDATE_FIELD'")
              el-input(v-model="action.field" :placeholder="$t('workflows.fieldName')")
              el-input(v-model="action.value" :placeholder="$t('workflows.newValue')")

            .grid.grid-cols-2.gap-2(v-else-if="action.type === 'CREATE_RECORD'")
              el-select(v-model="action.entityType" placeholder="Target Entity" class="w-full")
                el-option(
                  v-for="et in entityTypes"
                  :key="et.value"
                  :label="et.label"
                  :value="et.value"
                )

            .space-y-2(v-else-if="action.type === 'SEND_EMAIL'")
              el-input(v-model="action.to" :placeholder="$t('workflows.recipientEmailPlaceholder')")
              el-input(v-model="action.subject" :placeholder="$t('workflows.emailSubjectPlaceholder')")
              el-input(v-model="action.body" type="textarea" :rows="2" placeholder="Email body (use [field] for variables)")

            .space-y-2(v-else-if="action.type === 'SEND_NOTIFICATION'")
              el-input(v-model="action.title" placeholder="Notification title")
              el-input(v-model="action.message" :placeholder="$t('workflows.notificationMessagePlaceholder')")
              .grid.grid-cols-2.gap-2
                el-input(v-model="action.userId" placeholder="User ID (optional)")
                el-input(v-model="action.role" placeholder="Role name (optional)")

            .grid.grid-cols-2.gap-2(v-else-if="action.type === 'CREATE_TASK'")
              el-input(v-model="action.title" placeholder="Task title")
              el-input(v-model="action.assignedTo" placeholder="Assign to User ID")
              el-input-number(v-model="action.dueInDays" :min="1" placeholder="Due in days")

            .space-y-2(v-else-if="action.type === 'WEBHOOK'")
              el-input(v-model="action.url" placeholder="Webhook URL")
              el-select(v-model="action.method" class="w-full" placeholder="HTTP Method")
                el-option(label="POST" value="POST")
                el-option(label="GET" value="GET")
                el-option(label="PUT" value="PUT")

            .grid.grid-cols-2.gap-2(v-else-if="action.type === 'ASSIGN_TO'")
              el-input(v-model="action.userId" placeholder="User ID (optional)")
              el-select(v-model="action.method" placeholder="Assignment method" class="w-full" clearable)
                el-option(label="Direct" value="direct")
                el-option(label="Round Robin" value="round_robin")
                el-option(label="Least Loaded" value="least_loaded")

            .grid.grid-cols-2.gap-2(v-else-if="action.type === 'DELAY'")
              el-input-number(v-model="action.days" :min="0" placeholder="Days")
              el-input-number(v-model="action.hours" :min="0" placeholder="Hours")

    template(#footer)
      .flex.justify-end.gap-3
        el-button(@click="showCreateDialog = false" class="!rounded-xl") {{ $t('common.cancel') }}
        el-button(
          type="primary"
          :loading="saving"
          @click="saveWorkflow"
          class="!rounded-xl"
        ) {{ editingWorkflow ? $t('common.save') : $t('workflows.create') }}

  //- Execution Logs Dialog
  el-dialog(
    v-model="showLogsDialog"
    :title="$t('workflows.executionLogs') + (logsWorkflowName ? ' - ' + logsWorkflowName : '')"
    width="900px"
    destroy-on-close
  )
    .space-y-3(v-if="executions.length > 0")
      .p-4.rounded-lg.border(
        v-for="exec in executions"
        :key="exec.id"
        style="border-color: var(--border-default); background: var(--bg-card);"
      )
        .flex.justify-between.items-center.mb-2
          .flex.items-center.gap-2
            el-tag(
              :type="exec.status === 'SUCCESS' ? 'success' : exec.status === 'FAILED' ? 'danger' : 'warning'"
              size="small"
              effect="dark"
            ) {{ exec.status }}
            span.text-sm.font-medium(style="color: var(--text-primary);") Run {{ '#' }}{{ exec.id }}
          span.text-xs(style="color: var(--text-muted);") {{ formatDateTime(exec.createdAt) }}
        .flex.items-center.gap-4.text-xs(style="color: var(--text-muted);")
          span Trigger: {{ exec.triggerType }}
          span Entity: {{ exec.entityType }} {{ '#' }}{{ exec.entityId }}
          span(v-if="exec.executionTimeMs") Time: {{ exec.executionTimeMs }}ms

        //- Action results
        .mt-2.space-y-1(v-if="exec.actionsExecuted && exec.actionsExecuted.length > 0")
          .flex.items-center.gap-2.text-xs(
            v-for="(ar, arIdx) in exec.actionsExecuted"
            :key="arIdx"
          )
            Icon(
              :name="ar.status === 'SUCCESS' ? 'ph:check-circle' : ar.status === 'FAILED' ? 'ph:x-circle' : 'ph:minus-circle'"
              class="w-3.5 h-3.5"
              :style="{ color: ar.status === 'SUCCESS' ? '#22c55e' : ar.status === 'FAILED' ? '#ef4444' : '#94a3b8' }"
            )
            span(style="color: var(--text-muted);") {{ ar.actionType }}
            span.text-red-400(v-if="ar.error") -- {{ ar.error }}

    .text-center.py-8(v-else)
      Icon(name="ph:list-dashes" class="w-12 h-12 mx-auto mb-3" style="color: var(--text-muted);")
      p(style="color: var(--text-muted);") {{ $t('workflows.noLogs') }}

    .flex.justify-center.pt-4(v-if="executionPagination.totalPages > 1")
      el-pagination(
        v-model:current-page="executionPagination.page"
        :page-size="executionPagination.limit"
        :total="executionPagination.totalItems"
        layout="prev, pager, next"
        @current-change="loadExecutionLogs"
      )

  //- Test Dialog
  el-dialog(
    v-model="showTestDialog"
    :title="$t('workflows.testRun')"
    width="600px"
    destroy-on-close
  )
    p.text-sm.mb-4(style="color: var(--text-muted);") {{ $t('workflows.testRunDesc') }}
    el-input(
      v-model="testSampleData"
      type="textarea"
      :rows="8"
      :placeholder='`{"status": "qualified", "name": "Test Lead", "email": "test@example.com"}`'
    )
    .mt-4.p-4.rounded-lg.border(
      v-if="testResult"
      style="border-color: var(--border-default); background: var(--bg-card);"
    )
      .flex.items-center.gap-2.mb-2
        Icon(
          :name="testResult.conditionsMatch ? 'ph:check-circle' : 'ph:x-circle'"
          class="w-5 h-5"
          :style="{ color: testResult.conditionsMatch ? '#22c55e' : '#ef4444' }"
        )
        span.font-medium(style="color: var(--text-primary);")
          | {{ $t('workflows.conditionsMatch') }}: {{ testResult.conditionsMatch ? $t('workflows.yes') : $t('workflows.no') }}
      .mt-2(v-if="testResult.resolvedActions && testResult.resolvedActions.length > 0")
        p.text-xs.font-medium.mb-1(style="color: var(--text-muted);") {{ $t('workflows.resolvedActions') }}:
        .text-xs.font-mono.whitespace-pre-wrap.p-2.rounded(
          style="color: var(--text-primary); background: var(--bg-card);"
        ) {{ JSON.stringify(testResult.resolvedActions, null, 2) }}

    template(#footer)
      .flex.justify-end.gap-3
        el-button(@click="showTestDialog = false" class="!rounded-xl") {{ $t('common.close') }}
        el-button(
          type="primary"
          :loading="testLoading"
          @click="runTest"
          class="!rounded-xl"
        ) {{ $t('workflows.runTest') }}
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import {
  useWorkflows,
  ENTITY_TYPES,
  TRIGGER_TYPES,
  CONDITION_OPERATORS,
  ACTION_TYPES,
  type WorkflowRule
} from '~/composables/useWorkflows';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();
const router = useRouter();

const {
  workflows,
  executions,
  loading,
  saving,
  pagination,
  executionPagination,
  fetchWorkflows: apiFetchWorkflows,
  createWorkflow: apiCreateWorkflow,
  updateWorkflow: apiUpdateWorkflow,
  deleteWorkflow: apiDeleteWorkflow,
  toggleWorkflow: apiToggleWorkflow,
  testWorkflow: apiTestWorkflow,
  executeWorkflow: apiExecuteWorkflow,
  fetchExecutions: apiFetchExecutions
} = useWorkflows();

// Constants for the template
const entityTypes = ENTITY_TYPES;
const triggerTypes = TRIGGER_TYPES;
const conditionOperators = CONDITION_OPERATORS;
const actionTypes = ACTION_TYPES;

// Filters
const searchQuery = ref('');
const filterEntityType = ref('');
const filterTriggerType = ref('');
const filterStatus = ref('');

// Dialog state
const showCreateDialog = ref(false);
const showLogsDialog = ref(false);
const showTestDialog = ref(false);
const editingWorkflow = ref<WorkflowRule | null>(null);
const logsWorkflowId = ref<number | null>(null);
const logsWorkflowName = ref('');
const testWorkflowId = ref<number | null>(null);
const testSampleData = ref('{}');
const testResult = ref<Record<string, unknown> | null>(null);
const testLoading = ref(false);

// Form
const form = ref({
  name: '',
  description: '',
  entityType: 'lead',
  triggerType: 'ON_CREATE',
  triggerField: '',
  triggerValue: '',
  conditionLogic: 'AND' as 'AND' | 'OR',
  conditions: [] as Array<{ field: string; operator: string; value: string }>,
  actions: [] as Array<Record<string, unknown>>,
  priority: 0,
  isActive: true
});

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedFetch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadWorkflows(), 400);
}

async function loadWorkflows() {
  const params: Record<string, string> = {};
  if (searchQuery.value) params.search = searchQuery.value;
  if (filterEntityType.value) params.entityType = filterEntityType.value;
  if (filterTriggerType.value) params.triggerType = filterTriggerType.value;
  if (filterStatus.value) params.isActive = filterStatus.value;
  await apiFetchWorkflows(params);
}

function resetForm() {
  form.value = {
    name: '',
    description: '',
    entityType: 'lead',
    triggerType: 'ON_CREATE',
    triggerField: '',
    triggerValue: '',
    conditionLogic: 'AND',
    conditions: [],
    actions: [],
    priority: 0,
    isActive: true
  };
  editingWorkflow.value = null;
}

function addCondition() {
  form.value.conditions.push({ field: '', operator: 'equals', value: '' });
}

function addAction() {
  form.value.actions.push({ type: 'SEND_NOTIFICATION' });
}

function onActionTypeChange(action: Record<string, unknown>) {
  // Reset all config fields except type
  const actionType = action.type;
  Object.keys(action).forEach(key => {
    if (key !== 'type') delete action[key];
  });
  action.type = actionType;
}

async function saveWorkflow() {
  const data = { ...form.value };

  if (editingWorkflow.value) {
    const result = await apiUpdateWorkflow(editingWorkflow.value.id, data);
    if (result) {
      showCreateDialog.value = false;
      resetForm();
      loadWorkflows();
    }
  } else {
    const result = await apiCreateWorkflow(data);
    if (result) {
      showCreateDialog.value = false;
      resetForm();
      loadWorkflows();
    }
  }
}

async function handleCommand(command: string, wf: WorkflowRule) {
  switch (command) {
    case 'edit':
      editingWorkflow.value = wf;
      form.value = {
        name: wf.name,
        description: wf.description || '',
        entityType: wf.entityType,
        triggerType: wf.triggerType,
        triggerField: wf.triggerField || '',
        triggerValue: wf.triggerValue || '',
        conditionLogic: wf.conditionLogic || 'AND',
        conditions: (wf.conditions || []).map(c => ({ field: c.field, operator: c.operator, value: String(c.value ?? '') })),
        actions: (wf.actions || []).map(a => ({ ...a })),
        priority: wf.priority || 0,
        isActive: wf.isActive
      };
      showCreateDialog.value = true;
      break;
    case 'canvas':
      router.push(`/automations/${wf.id}`);
      break;
    case 'toggle':
      await apiToggleWorkflow(wf.id, !wf.isActive);
      loadWorkflows();
      break;
    case 'execute':
      await apiExecuteWorkflow(wf.id);
      loadWorkflows();
      break;
    case 'test':
      testWorkflowId.value = wf.id;
      testResult.value = null;
      testSampleData.value = '{\n  "status": "qualified",\n  "name": "Test Lead"\n}';
      showTestDialog.value = true;
      break;
    case 'logs':
      logsWorkflowId.value = wf.id;
      logsWorkflowName.value = wf.name;
      executionPagination.value.page = 1;
      await apiFetchExecutions(wf.id);
      showLogsDialog.value = true;
      break;
    case 'delete':
      try {
        await ElMessageBox.confirm(
          t('workflows.confirmDelete'),
          t('common.warning'),
          { type: 'warning' }
        );
        await apiDeleteWorkflow(wf.id);
        loadWorkflows();
      } catch {
        // User cancelled
      }
      break;
  }
}

async function loadExecutionLogs() {
  if (logsWorkflowId.value) {
    await apiFetchExecutions(logsWorkflowId.value);
  }
}

async function runTest() {
  if (!testWorkflowId.value) return;
  testLoading.value = true;
  try {
    const sampleData = JSON.parse(testSampleData.value);
    const result = await apiTestWorkflow(testWorkflowId.value, sampleData);
    testResult.value = result as Record<string, unknown>;
  } catch (err) {
    testResult.value = { error: 'Invalid JSON data' };
  } finally {
    testLoading.value = false;
  }
}

// Helper functions
function getEntityIcon(entityType: string): string {
  const icons: Record<string, string> = {
    lead: 'ph:user-focus-bold',
    deal: 'ph:handshake-bold',
    client: 'ph:buildings-bold',
    opportunity: 'ph:target-bold',
    invoice: 'ph:receipt-bold',
    contract: 'ph:file-text-bold',
    task: 'ph:check-square-bold'
  };
  return icons[entityType] || 'ph:lightning-bold';
}

function getTriggerLabel(triggerType: string): string {
  return triggerTypes.find(t => t.value === triggerType)?.label || triggerType;
}

function getActionLabel(actionType: string): string {
  return actionTypes.find(a => a.value === actionType)?.label || actionType;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

onMounted(() => {
  loadWorkflows();
});
</script>
