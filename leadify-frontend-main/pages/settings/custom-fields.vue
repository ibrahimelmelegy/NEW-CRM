<template lang="pug">
.custom-fields-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('customFields.title') }}
    p(style="color: var(--text-muted)") {{ $t('customFields.subtitle') }}

  //- Entity type selector
  .mb-6
    el-radio-group(v-model="selectedEntity" size="large" @change="loadFields")
      el-radio-button(value="LEAD") {{ $t('navigation.leads') }}
      el-radio-button(value="DEAL") {{ $t('navigation.deals') }}
      el-radio-button(value="OPPORTUNITY") {{ $t('navigation.opportunities') }}
      el-radio-button(value="CLIENT") {{ $t('navigation.clients') }}

  //- Field list
  .glass-card.p-6
    .flex.justify-between.items-center.mb-6
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('customFields.fieldsFor') }} {{ selectedEntity }}
      el-button(type="primary" @click="showAddDialog = true" class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
        Icon(name="ph:plus-bold" size="16" aria-hidden="true")
        span.ml-2 {{ $t('customFields.addField') }}

    el-skeleton(:rows="3" animated v-if="loading")

    .space-y-3(v-else-if="fields.length")
      .field-item.flex.items-center.gap-4.p-4.rounded-xl(
        v-for="field in fields"
        :key="field.id"
        style="background: var(--bg-input); border: 1px solid var(--border-default)"
      )
        .flex-1
          .flex.items-center.gap-3
            el-tag(:type="getFieldTypeTag(field.fieldType)" size="small" effect="dark") {{ field.fieldType }}
            span.font-medium(style="color: var(--text-primary)") {{ field.fieldLabel }}
            el-tag(v-if="field.required" type="danger" size="small") {{ $t('customFields.required') }}
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ field.fieldName }}
        .flex.gap-2
          el-button(link @click="editField(field)")
            Icon(name="ph:pencil" size="18" aria-label="Edit")
          el-button(link @click="removeField(field.id)")
            Icon(name="ph:trash" size="18" class="text-red-400" aria-label="Delete")

    .text-center.py-8(v-else)
      Icon(name="ph:sliders-horizontal" size="48" style="color: var(--text-muted)" aria-hidden="true")
      p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('customFields.noFields') }}

  //- Add/Edit Dialog
  el-dialog(v-model="showAddDialog" :title="editingField ? $t('customFields.editField') : $t('customFields.addField')" width="500px")
    .space-y-4
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('customFields.fieldLabel') }}
        el-input(v-model="formData.fieldLabel" :placeholder="$t('customFields.fieldLabelPlaceholder')")

      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('customFields.fieldName') }}
        el-input(v-model="formData.fieldName" :placeholder="$t('customFields.fieldNamePlaceholder')")

      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('customFields.fieldType') }}
        el-select(v-model="formData.fieldType" class="w-full")
          el-option(value="TEXT" :label="$t('customFields.text')")
          el-option(value="NUMBER" :label="$t('customFields.number')")
          el-option(value="DATE" :label="$t('customFields.date')")
          el-option(value="SELECT" :label="$t('customFields.selectDropdown')")
          el-option(value="CHECKBOX" :label="$t('customFields.checkbox')")
          el-option(value="TEXTAREA" :label="$t('customFields.textarea')")

      .form-group(v-if="formData.fieldType === 'SELECT'")
        label.block.text-sm.font-medium.mb-2 {{ $t('customFields.options') }}
        el-tag(
          v-for="(opt, i) in formData.options"
          :key="i"
          closable
          @close="formData.options.splice(i, 1)"
          class="mr-2 mb-2"
        ) {{ opt }}
        .flex.gap-2.mt-2
          el-input(v-model="newOption" :placeholder="$t('customFields.addOption')" @keydown.enter.prevent="addOption" size="small")
          el-button(size="small" @click="addOption") {{ $t('common.add') }}

      el-checkbox(v-model="formData.required") {{ $t('customFields.required') }}

    template(#footer)
      el-button(@click="showAddDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveField" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import type { CustomField } from '~/composables/useCustomFields';
import { fetchCustomFields, createCustomField, updateCustomField, deleteCustomField } from '~/composables/useCustomFields';

definePageMeta({
  middleware: 'permissions',
  permission: 'EDIT_SETTINGS'
});

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const selectedEntity = ref('LEAD');
const fields = ref<CustomField[]>([]);
const loading = ref(true);
const saving = ref(false);
const showAddDialog = ref(false);
const editingField = ref<CustomField | null>(null);
const newOption = ref('');

const formData = ref({
  fieldLabel: '',
  fieldName: '',
  fieldType: 'TEXT' as 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX' | 'TEXTAREA',
  options: [] as string[],
  required: false
});

onMounted(() => loadFields());

async function loadFields() {
  loading.value = true;
  try {
    fields.value = await fetchCustomFields(selectedEntity.value);
  } finally {
    loading.value = false;
  }
}

function editField(field: CustomField) {
  editingField.value = field;
  formData.value = {
    fieldLabel: field.fieldLabel,
    fieldName: field.fieldName,
    fieldType: field.fieldType,
    options: [...(field.options || [])],
    required: field.required
  };
  showAddDialog.value = true;
}

function addOption() {
  if (newOption.value.trim()) {
    formData.value.options.push(newOption.value.trim());
    newOption.value = '';
  }
}

async function saveField() {
  if (!formData.value.fieldLabel || !formData.value.fieldName) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }

  saving.value = true;
  try {
    const data = {
      ...formData.value,
      entityType: selectedEntity.value,
      sortOrder: fields.value.length
    };

    if (editingField.value) {
      await updateCustomField(editingField.value.id, data);
    } else {
      await createCustomField(data);
    }

    showAddDialog.value = false;
    editingField.value = null;
    formData.value = { fieldLabel: '', fieldName: '', fieldType: 'TEXT', options: [], required: false };
    await loadFields();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } finally {
    saving.value = false;
  }
}

async function removeField(id: string) {
  try {
    await ElMessageBox.confirm(t('customFields.confirmDelete'), t('common.warning'), { type: 'warning' });
    await deleteCustomField(id);
    await loadFields();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

function getFieldTypeTag(type: string) {
  const map: Record<string, string> = {
    TEXT: '',
    NUMBER: 'success',
    DATE: 'warning',
    SELECT: 'primary',
    CHECKBOX: 'info',
    TEXTAREA: ''
  };
  return map[type] || '';
}
</script>

<style lang="scss" scoped>
.custom-fields-page {
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
