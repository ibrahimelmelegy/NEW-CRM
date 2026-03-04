<template lang="pug">
el-dialog(
  v-model="visible"
  :title="dialogTitle"
  width="560px"
  :close-on-click-modal="false"
  destroy-on-close
  @close="handleClose"
)
  //- Integration header
  .flex.items-center.gap-4.mb-6(v-if="integration")
    .icon-box
      Icon(:name="integration.icon" size="36")
    div
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ integration.name }}
      p.text-xs(style="color: var(--text-muted)") {{ integration.description }}

  //- Dynamic config fields
  el-form(
    ref="formRef"
    :model="formData"
    label-position="top"
    @submit.prevent="handleSave"
  )
    el-form-item(
      v-for="field in configFields"
      :key="field.key"
      :label="field.label"
      :prop="field.key"
      :rules="field.required ? [{ required: true, message: `${field.label} is required`, trigger: 'blur' }] : []"
    )
      el-input(
        v-if="field.type === 'password'"
        v-model="formData[field.key]"
        type="password"
        show-password
        :placeholder="field.placeholder"
        class="glass-input"
      )
      el-input(
        v-else
        v-model="formData[field.key]"
        :placeholder="field.placeholder"
        class="glass-input"
      )

  //- Footer actions
  template(#footer)
    .flex.justify-between.items-center.w-full
      div
        el-button(
          v-if="isConfigured"
          type="danger"
          plain
          :loading="disconnecting"
          @click="handleDisconnect"
        ) {{ $t('integrationHub.config.disconnect') }}
      .flex.gap-2
        el-button(@click="handleClose") {{ $t('integrationHub.config.cancel') }}
        el-button(
          type="info"
          plain
          :loading="testing"
          @click="handleTest"
        ) {{ $t('integrationHub.config.testConnection') }}
        el-button(
          type="primary"
          :loading="saving"
          @click="handleSave"
        ) {{ $t('integrationHub.config.save') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import type { MarketplaceIntegration } from './Marketplace.vue';

const props = defineProps<{
  modelValue: boolean;
  integration: MarketplaceIntegration | null;
  isConfigured: boolean;
  existingConfig?: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', data: { type: string; config: Record<string, any> }): void;
  (e: 'test', data: { type: string; config: Record<string, any> }): void;
  (e: 'disconnect', type: string): void;
}>();

const { t } = useI18n();
const formRef = ref<FormInstance>();
const saving = ref(false);
const testing = ref(false);
const disconnecting = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

const dialogTitle = computed(() => {
  if (!props.integration) return '';
  return props.isConfigured
    ? t('integrationHub.config.manageTitle', { name: props.integration.name })
    : t('integrationHub.config.configureTitle', { name: props.integration.name });
});

const configFields = computed(() => {
  if (!props.integration) return [];
  return props.integration.configFields || getDefaultFields(props.integration.type);
});

// Build reactive form data from fields
const formData = ref<Record<string, string>>({});

watch(
  () => [props.integration, props.existingConfig, props.modelValue],
  () => {
    if (props.modelValue && props.integration) {
      const data: Record<string, string> = {};
      for (const field of configFields.value) {
        data[field.key] = props.existingConfig?.[field.key] || '';
      }
      formData.value = data;
    }
  },
  { immediate: true, deep: true }
);

function getDefaultFields(type: string) {
  // Fallback for integrations that don't have configFields from catalog
  const fieldMap: Record<string, any[]> = {
    GOOGLE_CALENDAR: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Google Client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Client Secret', required: true }
    ],
    OUTLOOK: [
      { key: 'clientId', label: 'Application ID', type: 'text', placeholder: 'Enter Azure App ID', required: true },
      { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'Enter Tenant ID', required: true }
    ],
    WHATSAPP: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', placeholder: 'Enter Phone ID', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Enter Access Token', required: true }
    ],
    OPENAI: [{ key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...', required: true }],
    ERPNEXT: [
      { key: 'baseUrl', label: 'Base URL', type: 'url', placeholder: 'https://your-instance.erpnext.com', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter ERPNext API Key', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Enter ERPNext API Secret', required: true }
    ],
    BREVO: [{ key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'xkeysib-...', required: true }]
  };
  return (
    fieldMap[type] || [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API Key', required: true },
      { key: 'baseUrl', label: 'Base URL', type: 'url', placeholder: 'https://...', required: false },
      { key: 'secret', label: 'Secret', type: 'password', placeholder: 'Enter Secret', required: false }
    ]
  );
}

async function handleSave() {
  if (!formRef.value || !props.integration) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  saving.value = true;
  try {
    emit('save', { type: props.integration.type, config: { ...formData.value } });
  } finally {
    saving.value = false;
  }
}

async function handleTest() {
  if (!props.integration) return;

  testing.value = true;
  try {
    emit('test', { type: props.integration.type, config: { ...formData.value } });
  } finally {
    // Parent handles async; reset after a delay
    setTimeout(() => {
      testing.value = false;
    }, 2000);
  }
}

async function handleDisconnect() {
  if (!props.integration) return;

  try {
    await ElMessageBox.confirm(
      t('integrationHub.config.disconnectConfirm', { name: props.integration.name }),
      t('integrationHub.config.disconnectTitle'),
      { confirmButtonText: t('integrationHub.config.disconnect'), cancelButtonText: t('integrationHub.config.cancel'), type: 'warning' }
    );

    disconnecting.value = true;
    emit('disconnect', props.integration.type);
  } catch {
    // User cancelled
  } finally {
    disconnecting.value = false;
  }
}

function handleClose() {
  visible.value = false;
}
</script>

<style lang="scss" scoped>
.icon-box {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.1);
  flex-shrink: 0;
}
</style>
