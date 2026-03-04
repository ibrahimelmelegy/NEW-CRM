<template lang="pug">
el-drawer(
  v-model="visible"
  :title="''"
  direction="rtl"
  size="380px"
)
  template(#header)
    .flex.items-center.gap-3
      .config-icon(:class="nodeType")
        Icon(:name="getIcon()" size="18")
      div
        h3.text-base.font-bold Configure {{ nodeTypeLabel }}
        p.text-xs.text-secondary Set up this workflow step

  .config-form(v-if="node")
    //- Label
    .form-group
      label.form-label Name
      el-input(v-model="localLabel" @change="updateLabel")

    //- Trigger Config
    template(v-if="nodeType === 'trigger'")
      .form-group
        label.form-label Entity Type
        el-select(v-model="config.entityType" @change="emitConfig")
          el-option(v-for="e in entityTypes" :key="e" :label="e" :value="e")
      .form-group
        label.form-label Trigger Type
        el-select(v-model="config.triggerType" @change="emitConfig")
          el-option(v-for="t in triggerTypes" :key="t" :label="t" :value="t")
      .form-group(v-if="config.triggerType === 'ON_FIELD_CHANGE'")
        label.form-label Trigger Field
        el-input(v-model="config.triggerField" @change="emitConfig")

    //- Action Config
    template(v-if="nodeType === 'action'")
      .form-group
        label.form-label Action Type
        el-select(v-model="config.type" @change="emitConfig")
          el-option(v-for="a in actionTypes" :key="a" :label="a" :value="a")
      template(v-if="config.type === 'UPDATE_FIELD'")
        .form-group
          label.form-label Field
          el-input(v-model="config.field" @change="emitConfig")
        .form-group
          label.form-label Value
          el-input(v-model="config.value" @change="emitConfig")
      template(v-if="config.type === 'SEND_NOTIFICATION'")
        .form-group
          label.form-label Title
          el-input(v-model="config.title" @change="emitConfig")
        .form-group
          label.form-label Message
          el-input(v-model="config.message" type="textarea" @change="emitConfig")

    //- Condition Config
    template(v-if="nodeType === 'condition'")
      .form-group
        label.form-label Field
        el-input(v-model="config.field" @change="emitConfig")
      .form-group
        label.form-label Operator
        el-select(v-model="config.operator" @change="emitConfig")
          el-option(v-for="o in operators" :key="o" :label="o" :value="o")
      .form-group
        label.form-label Value
        el-input(v-model="config.value" @change="emitConfig")

    //- Delay Config
    template(v-if="nodeType === 'delay'")
      .form-group
        label.form-label Duration
        el-input-number(v-model="config.delay" :min="1" :max="365" @change="emitConfig")
      .form-group
        label.form-label Unit
        el-select(v-model="config.unit" @change="emitConfig")
          el-option(:label="$t('workflows.minutes')" value="minutes")
          el-option(:label="$t('workflows.hours')" value="hours")
          el-option(:label="$t('workflows.days')" value="days")

    //- HTTP Request Config
    template(v-if="nodeType === 'http'")
      .form-group
        label.form-label Method
        el-select(v-model="config.method" @change="emitConfig")
          el-option(label="GET" value="GET")
          el-option(label="POST" value="POST")
          el-option(label="PUT" value="PUT")
          el-option(label="PATCH" value="PATCH")
          el-option(label="DELETE" value="DELETE")
      .form-group
        label.form-label URL
        el-input(v-model="config.url" placeholder="https://api.example.com/webhook" @change="emitConfig")
      .form-group
        label.form-label Headers (JSON)
        el-input(v-model="config.headersJson" type="textarea" :rows="2" placeholder='{"Authorization": "Bearer ..."}' @change="emitConfig")
      .form-group
        label.form-label Body (JSON)
        el-input(v-model="config.bodyJson" type="textarea" :rows="3" placeholder='{"key": "{{fieldName}}"}' @change="emitConfig")
      .form-group
        label.form-label Retries
        el-input-number(v-model="config.retries" :min="0" :max="5" @change="emitConfig")

    //- Condition (Advanced) Config
    template(v-if="nodeType === 'wfCondition'")
      .form-group
        label.form-label Field
        el-input(v-model="config.field" placeholder="e.g. status, amount, priority" @change="emitConfig")
      .form-group
        label.form-label Operator
        el-select(v-model="config.operator" @change="emitConfig")
          el-option(v-for="o in operators" :key="o" :label="o" :value="o")
      .form-group
        label.form-label Value
        el-input(v-model="config.value" @change="emitConfig")

    //- Template Config
    template(v-if="nodeType === 'template'")
      .form-group
        label.form-label Template ID
        el-input(v-model="config.templateId" :placeholder="$t('workflows.documentTemplateId')" @change="emitConfig")
      .form-group
        label.form-label Template Name
        el-input(v-model="config.templateName" :placeholder="$t('workflows.templateDisplayName')" @change="emitConfig")
      .form-group
        label.form-label Recipient Field
        el-input(v-model="config.recipientField" placeholder="e.g. email, client.email" @change="emitConfig")

    //- Approval Config
    template(v-if="nodeType === 'approval'")
      .form-group
        label.form-label Approver User ID
        el-input(v-model="config.approverUserId" :placeholder="$t('workflows.specificUserId')" @change="emitConfig")
      .form-group
        label.form-label Approver Role
        el-input(v-model="config.approverRole" placeholder="e.g. Sales Manager" @change="emitConfig")
      .form-group
        label.form-label Approval Message
        el-input(v-model="config.message" type="textarea" :rows="2" :placeholder="$t('workflows.describeApproval')" @change="emitConfig")
      .form-group
        label.form-label Timeout (hours)
        el-input-number(v-model="config.timeout" :min="0" :max="720" placeholder="0 = no timeout" @change="emitConfig")

    //- Delete
    el-button.mt-6.w-full(type="danger" plain @click="$emit('delete')")
      Icon.mr-1(name="ph:trash-bold" size="14")
      | Delete Node
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

const props = defineProps<{
  node: any;
  visible: boolean;
}>();

const emit = defineEmits(['update:visible', 'updateConfig', 'updateLabel', 'delete']);

const visible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v)
});

const nodeType = computed(() => props.node?.data?.nodeType || 'trigger');
const nodeTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    trigger: 'Trigger',
    action: 'Action',
    condition: 'Condition',
    delay: 'Delay',
    http: 'HTTP Request',
    wfCondition: 'Condition',
    template: 'Template',
    approval: 'Approval'
  };
  return labels[nodeType.value] || 'Node';
});

const localLabel = ref('');
const config = ref<Record<string, any>>({});

watch(
  () => props.node,
  n => {
    if (n) {
      localLabel.value = n.data?.label || '';
      config.value = { ...(n.data?.config || {}) };
    }
  },
  { immediate: true, deep: true }
);

function getIcon(): string {
  const icons: Record<string, string> = {
    trigger: 'ph:play-circle-bold',
    action: 'ph:lightning-bold',
    condition: 'ph:git-branch-bold',
    delay: 'ph:clock-bold',
    http: 'ph:globe-bold',
    wfCondition: 'ph:git-branch-bold',
    template: 'ph:file-text-bold',
    approval: 'ph:shield-check-bold'
  };
  return icons[nodeType.value] || 'ph:circle-bold';
}

function updateLabel() {
  emit('updateLabel', localLabel.value);
}

function emitConfig() {
  emit('updateConfig', { ...config.value });
}

const entityTypes = ['lead', 'deal', 'client', 'opportunity', 'invoice', 'contract', 'task'];
const triggerTypes = ['ON_CREATE', 'ON_UPDATE', 'ON_DELETE', 'ON_FIELD_CHANGE', 'SCHEDULED', 'MANUAL'];
const actionTypes = ['UPDATE_FIELD', 'SEND_EMAIL', 'SEND_NOTIFICATION', 'CREATE_TASK', 'WEBHOOK', 'ASSIGN_TO'];
const operators = ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'];
</script>

<style lang="scss" scoped>
.text-secondary {
  color: var(--text-secondary);
}

.config-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  &.trigger {
    background: linear-gradient(135deg, #16a34a, #22c55e);
  }
  &.action {
    background: linear-gradient(135deg, #7849ff, #a855f7);
  }
  &.condition {
    background: linear-gradient(135deg, #ea580c, #f59e0b);
  }
  &.delay {
    background: linear-gradient(135deg, #ca8a04, #eab308);
  }
  &.http {
    background: linear-gradient(135deg, #2563eb, #3b82f6);
  }
  &.wfCondition {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
  }
  &.template {
    background: linear-gradient(135deg, #16a34a, #4ade80);
  }
  &.approval {
    background: linear-gradient(135deg, #ea580c, #f97316);
  }
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
</style>
