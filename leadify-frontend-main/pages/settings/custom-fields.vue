<template lang="pug">
.custom-fields-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('customFields.title') }}
    p(style="color: var(--text-muted)") {{ $t('customFields.subtitle') }}

  //- Entity type selector tabs
  .mb-6
    el-radio-group(v-model="selectedEntity" size="large" @change="loadFields")
      el-radio-button(value="LEAD") {{ $t('navigation.leads') }}
      el-radio-button(value="DEAL") {{ $t('navigation.deals') }}
      el-radio-button(value="OPPORTUNITY") {{ $t('navigation.opportunities') }}
      el-radio-button(value="CLIENT") {{ $t('navigation.clients') }}
      el-radio-button(value="CONTACT") {{ $t('customFields.contacts') }}
      el-radio-button(value="INVOICE") {{ $t('customFields.invoices') }}

  //- Field list
  .glass-card.p-6
    .flex.justify-between.items-center.mb-6
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('customFields.fieldsFor') }} {{ getEntityLabel(selectedEntity) }}
      .flex.gap-3
        el-checkbox(v-model="showInactive" @change="loadFields") {{ $t('customFields.showInactive') }}
        el-button(
          type="primary"
          @click="openAddDialog"
          class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none"
        )
          Icon(name="ph:plus-bold" size="16" aria-hidden="true")
          span.ml-2 {{ $t('customFields.addField') }}

    el-skeleton(:rows="3" animated v-if="loading")

    //- Draggable field list
    .space-y-3(v-else-if="fields.length")
      transition-group(name="field-list" tag="div" class="space-y-3")
        .field-item.flex.items-center.gap-4.p-4.rounded-xl(
          v-for="(field, index) in fields"
          :key="field.id"
          :class="{ 'opacity-50': !field.isActive }"
          style="background: var(--bg-input); border: 1px solid var(--border-default)"
        )
          //- Drag handle
          .drag-handle.cursor-move.flex.items-center(
            @mousedown="startDrag(index, $event)"
            @touchstart.prevent="startDrag(index, $event)"
          )
            Icon(name="ph:dots-six-vertical" size="20" style="color: var(--text-muted)" aria-label="Drag to reorder")

          .flex-1
            .flex.items-center.gap-3.flex-wrap
              el-tag(:type="getFieldTypeTag(field.fieldType)" size="small" effect="dark") {{ getFieldTypeLabel(field.fieldType) }}
              span.font-medium(style="color: var(--text-primary)") {{ field.fieldLabel }}
              el-tag(v-if="field.isRequired || field.required" type="danger" size="small") {{ $t('customFields.required') }}
              el-tag(v-if="!field.isActive" type="info" size="small") {{ $t('customFields.inactive') }}
              el-tag(v-if="field.defaultValue" type="warning" size="small")
                | {{ $t('customFields.defaultLabel') }}: {{ field.defaultValue }}
            .flex.items-center.gap-4.mt-1
              p.text-xs(style="color: var(--text-muted)") {{ field.fieldName }}
              p.text-xs(v-if="field.options && field.options.length" style="color: var(--text-muted)")
                | {{ field.options.length }} {{ $t('customFields.optionsCount') }}
              p.text-xs(v-if="hasValidationRules(field)" style="color: var(--text-muted)")
                Icon(name="ph:shield-check" size="12" aria-hidden="true")
                span.ml-1 {{ $t('customFields.hasValidation') }}

          .flex.gap-2.items-center
            el-switch(
              v-model="field.isActive"
              :active-text="$t('customFields.active')"
              :inactive-text="$t('customFields.inactive')"
              size="small"
              @change="toggleFieldActive(field)"
            )
            el-button(link @click="editField(field)")
              Icon(name="ph:pencil" size="18" aria-label="Edit")
            el-button(link @click="removeField(field.id)")
              Icon(name="ph:trash" size="18" class="text-red-400" aria-label="Delete")

    .text-center.py-8(v-else)
      Icon(name="ph:sliders-horizontal" size="48" style="color: var(--text-muted)" aria-hidden="true")
      p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('customFields.noFields') }}

  //- Add/Edit Dialog
  el-dialog(
    v-model="showAddDialog"
    :title="editingField ? $t('customFields.editField') : $t('customFields.addField')"
    width="600px"
    destroy-on-close
  )
    el-form(
      ref="formRef"
      :model="formData"
      label-position="top"
    )
      el-row(:gutter="16")
        el-col(:span="12")
          el-form-item(:label="$t('customFields.fieldLabel')" required)
            el-input(
              v-model="formData.fieldLabel"
              :placeholder="$t('customFields.fieldLabelPlaceholder')"
              @input="autoGenerateFieldName"
            )

        el-col(:span="12")
          el-form-item(:label="$t('customFields.fieldName')" required)
            el-input(
              v-model="formData.fieldName"
              :placeholder="$t('customFields.fieldNamePlaceholder')"
              :disabled="!!editingField"
            )
              template(#prepend)
                span.text-xs cf_

      el-row(:gutter="16")
        el-col(:span="12")
          el-form-item(:label="$t('customFields.fieldType')" required)
            el-select(v-model="formData.fieldType" class="w-full" @change="onFieldTypeChange")
              el-option-group(:label="$t('customFields.basicTypes')")
                el-option(value="TEXT" :label="$t('customFields.types.text')")
                el-option(value="TEXTAREA" :label="$t('customFields.types.textarea')")
                el-option(value="NUMBER" :label="$t('customFields.types.number')")
                el-option(value="DATE" :label="$t('customFields.types.date')")
                el-option(value="CHECKBOX" :label="$t('customFields.types.checkbox')")
              el-option-group(:label="$t('customFields.choiceTypes')")
                el-option(value="SELECT" :label="$t('customFields.types.select')")
                el-option(value="MULTISELECT" :label="$t('customFields.types.multiselect')")
              el-option-group(:label="$t('customFields.specialTypes')")
                el-option(value="EMAIL" :label="$t('customFields.types.email')")
                el-option(value="PHONE" :label="$t('customFields.types.phone')")
                el-option(value="URL" :label="$t('customFields.types.url')")
                el-option(value="CURRENCY" :label="$t('customFields.types.currency')")

        el-col(:span="12")
          el-form-item(:label="$t('customFields.defaultValue')")
            //- Render appropriate input based on field type
            el-input(
              v-if="!isChoiceType && formData.fieldType !== 'CHECKBOX'"
              v-model="formData.defaultValue"
              :placeholder="$t('customFields.defaultValuePlaceholder')"
            )
            el-checkbox(
              v-else-if="formData.fieldType === 'CHECKBOX'"
              v-model="defaultCheckbox"
              @change="formData.defaultValue = defaultCheckbox ? 'true' : 'false'"
            ) {{ $t('customFields.checkedByDefault') }}

      //- Options editor for SELECT / MULTISELECT
      .form-group.mb-4(v-if="isChoiceType")
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('customFields.options') }}
        .options-list.space-y-2
          .flex.items-center.gap-2(
            v-for="(opt, i) in formData.options"
            :key="i"
          )
            el-input(
              v-model="formData.options[i].value"
              :placeholder="$t('customFields.optionValue')"
              size="small"
              class="flex-1"
            )
            el-input(
              v-model="formData.options[i].label"
              :placeholder="$t('customFields.optionLabel')"
              size="small"
              class="flex-1"
            )
            el-button(
              link
              size="small"
              @click="formData.options.splice(i, 1)"
            )
              Icon(name="ph:x" size="16" class="text-red-400" aria-label="Remove option")

          .flex.gap-2.mt-2
            el-input(
              v-model="newOptionValue"
              :placeholder="$t('customFields.newOptionValue')"
              size="small"
              @keydown.enter.prevent="addOption"
            )
            el-input(
              v-model="newOptionLabel"
              :placeholder="$t('customFields.newOptionLabel')"
              size="small"
              @keydown.enter.prevent="addOption"
            )
            el-button(size="small" @click="addOption")
              Icon(name="ph:plus" size="14" aria-hidden="true")
              span.ml-1 {{ $t('common.add') }}

      //- Validation rules
      el-divider {{ $t('customFields.validationRules') }}

      el-row(:gutter="16")
        el-col(:span="12")
          el-checkbox(v-model="formData.isRequired") {{ $t('customFields.required') }}

        el-col(:span="12" v-if="supportsMinMax")
          el-form-item(:label="$t('customFields.minValue')")
            el-input-number(
              v-model="formData.validationRules.min"
              :placeholder="$t('customFields.noLimit')"
              controls-position="right"
              class="w-full"
            )

      el-row(:gutter="16" v-if="supportsMinMax")
        el-col(:span="12")
          el-form-item(:label="$t('customFields.maxValue')")
            el-input-number(
              v-model="formData.validationRules.max"
              :placeholder="$t('customFields.noLimit')"
              controls-position="right"
              class="w-full"
            )

      el-row(:gutter="16" v-if="supportsTextValidation")
        el-col(:span="12")
          el-form-item(:label="$t('customFields.minLength')")
            el-input-number(
              v-model="formData.validationRules.minLength"
              :min="0"
              controls-position="right"
              class="w-full"
            )

        el-col(:span="12")
          el-form-item(:label="$t('customFields.maxLength')")
            el-input-number(
              v-model="formData.validationRules.maxLength"
              :min="0"
              controls-position="right"
              class="w-full"
            )

      el-row(:gutter="16" v-if="supportsTextValidation")
        el-col(:span="24")
          el-form-item(:label="$t('customFields.regexPattern')")
            el-input(
              v-model="formData.validationRules.pattern"
              :placeholder="$t('customFields.regexPlaceholder')"
            )

    template(#footer)
      el-button(@click="showAddDialog = false") {{ $t('common.cancel') }}
      el-button(
        type="primary"
        :loading="saving"
        @click="saveField"
        class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none"
      ) {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import type { CustomField, CustomFieldType } from '~/composables/useCustomFields';
import {
  fetchCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  reorderCustomFields,
} from '~/composables/useCustomFields';

definePageMeta({
  middleware: 'permissions',
  permission: 'EDIT_SETTINGS',
});

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// ─── State ───────────────────────────────────────────────────────────────────

const selectedEntity = ref('LEAD');
const fields = ref<CustomField[]>([]);
const loading = ref(true);
const saving = ref(false);
const showAddDialog = ref(false);
const editingField = ref<CustomField | null>(null);
const showInactive = ref(false);

// Option builder state
const newOptionValue = ref('');
const newOptionLabel = ref('');

// Default checkbox state
const defaultCheckbox = ref(false);

interface FormValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

interface FormDataType {
  fieldLabel: string;
  fieldName: string;
  fieldType: CustomFieldType;
  options: Array<{ value: string; label: string }>;
  defaultValue: string;
  isRequired: boolean;
  validationRules: FormValidationRules;
}

const defaultFormData = (): FormDataType => ({
  fieldLabel: '',
  fieldName: '',
  fieldType: 'TEXT' as CustomFieldType,
  options: [],
  defaultValue: '',
  isRequired: false,
  validationRules: {},
});

const formData = ref<FormDataType>(defaultFormData());

// ─── Computed ────────────────────────────────────────────────────────────────

const isChoiceType = computed(() =>
  ['SELECT', 'MULTISELECT'].includes(formData.value.fieldType)
);

const supportsMinMax = computed(() =>
  ['NUMBER', 'CURRENCY'].includes(formData.value.fieldType)
);

const supportsTextValidation = computed(() =>
  ['TEXT', 'TEXTAREA'].includes(formData.value.fieldType)
);

// ─── Methods ─────────────────────────────────────────────────────────────────

function getEntityLabel(entity: string): string {
  const map: Record<string, string> = {
    LEAD: t('navigation.leads'),
    DEAL: t('navigation.deals'),
    OPPORTUNITY: t('navigation.opportunities'),
    CLIENT: t('navigation.clients'),
    CONTACT: t('customFields.contacts'),
    INVOICE: t('customFields.invoices'),
  };
  return map[entity] || entity;
}

function getFieldTypeLabel(type: string): string {
  const key = `customFields.types.${type.toLowerCase()}`;
  return t(key) || type;
}

function getFieldTypeTag(type: string): string {
  const map: Record<string, string> = {
    TEXT: '',
    TEXTAREA: '',
    NUMBER: 'success',
    CURRENCY: 'success',
    DATE: 'warning',
    SELECT: 'primary',
    MULTISELECT: 'primary',
    CHECKBOX: 'info',
    EMAIL: 'danger',
    PHONE: 'danger',
    URL: 'danger',
  };
  return map[type] || '';
}

function hasValidationRules(field: CustomField): boolean {
  if (!field.validationRules) return false;
  return Object.values(field.validationRules).some(
    v => v !== undefined && v !== null && v !== ''
  );
}

function autoGenerateFieldName() {
  if (editingField.value) return; // don't auto-generate when editing
  const label = formData.value.fieldLabel;
  formData.value.fieldName = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function onFieldTypeChange() {
  // Reset options when switching away from choice types
  if (!isChoiceType.value) {
    formData.value.options = [];
  }
  // Reset validation rules
  formData.value.validationRules = {};
}

function addOption() {
  const val = newOptionValue.value.trim();
  const lbl = newOptionLabel.value.trim();
  if (val) {
    formData.value.options.push({
      value: val,
      label: lbl || val,
    });
    newOptionValue.value = '';
    newOptionLabel.value = '';
  }
}

// ─── Load fields ─────────────────────────────────────────────────────────────

onMounted(() => loadFields());

async function loadFields() {
  loading.value = true;
  try {
    fields.value = await fetchCustomFields(
      selectedEntity.value,
      showInactive.value
    );
  } finally {
    loading.value = false;
  }
}

// ─── Dialog management ───────────────────────────────────────────────────────

function openAddDialog() {
  editingField.value = null;
  formData.value = defaultFormData();
  defaultCheckbox.value = false;
  newOptionValue.value = '';
  newOptionLabel.value = '';
  showAddDialog.value = true;
}

function editField(field: CustomField) {
  editingField.value = field;
  formData.value = {
    fieldLabel: field.fieldLabel,
    fieldName: field.fieldName,
    fieldType: field.fieldType,
    options: field.options
      ? field.options.map(o => (typeof o === 'string' ? { value: o, label: o } : { ...o }))
      : [],
    defaultValue: field.defaultValue || '',
    isRequired: field.isRequired || field.required || false,
    validationRules: { ...(field.validationRules || {}) },
  };
  defaultCheckbox.value = field.defaultValue === 'true';
  showAddDialog.value = true;
}

// ─── Save / Delete ───────────────────────────────────────────────────────────

async function saveField() {
  if (!formData.value.fieldLabel || !formData.value.fieldName) {
    ElNotification({
      type: 'warning',
      title: t('common.warning'),
      message: t('common.fillRequired'),
    });
    return;
  }

  // Validate options for choice types
  if (isChoiceType.value && formData.value.options.length === 0) {
    ElNotification({
      type: 'warning',
      title: t('common.warning'),
      message: t('customFields.optionsRequired'),
    });
    return;
  }

  saving.value = true;
  try {
    // Clean up validation rules (remove empty values)
    const cleanRules: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(formData.value.validationRules)) {
      if (v !== undefined && v !== null && v !== '') {
        cleanRules[k] = v;
      }
    }

    const data: Record<string, unknown> = {
      fieldLabel: formData.value.fieldLabel,
      fieldName: formData.value.fieldName,
      fieldType: formData.value.fieldType,
      entityType: selectedEntity.value,
      isRequired: formData.value.isRequired,
      defaultValue: formData.value.defaultValue || null,
      options: isChoiceType.value ? formData.value.options : null,
      validationRules: Object.keys(cleanRules).length > 0 ? cleanRules : null,
      sortOrder: editingField.value
        ? editingField.value.sortOrder
        : fields.value.length,
    };

    if (editingField.value) {
      const result = await updateCustomField(editingField.value.id, data as Partial<CustomField>);
      if (!result.success) {
        ElNotification({
          type: 'error',
          title: t('common.error'),
          message: result.message || t('common.error'),
        });
        return;
      }
    } else {
      const result = await createCustomField(data as Partial<CustomField>);
      if (!result.success) {
        ElNotification({
          type: 'error',
          title: t('common.error'),
          message: result.message || t('common.error'),
        });
        return;
      }
    }

    showAddDialog.value = false;
    editingField.value = null;
    formData.value = defaultFormData();
    await loadFields();
    ElNotification({
      type: 'success',
      title: t('common.success'),
      message: t('common.saved'),
    });
  } finally {
    saving.value = false;
  }
}

async function removeField(id: string) {
  try {
    await ElMessageBox.confirm(
      t('customFields.confirmDelete'),
      t('common.warning'),
      { type: 'warning' }
    );
    await deleteCustomField(id);
    await loadFields();
    ElNotification({
      type: 'success',
      title: t('common.success'),
      message: t('common.deleted'),
    });
  } catch {
    // User cancelled or error
  }
}

async function toggleFieldActive(field: CustomField) {
  try {
    await updateCustomField(field.id, { isActive: field.isActive } as Partial<CustomField>);
    ElNotification({
      type: 'success',
      title: t('common.success'),
      message: field.isActive
        ? t('customFields.fieldActivated')
        : t('customFields.fieldDeactivated'),
    });
  } catch {
    // Revert
    field.isActive = !field.isActive;
    ElMessage.error(t('common.error'));
  }
}

// ─── Drag & Drop reorder ─────────────────────────────────────────────────────

let dragIndex = -1;
let dragStartY = 0;

function startDrag(index: number, event: MouseEvent | TouchEvent) {
  dragIndex = index;
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
  dragStartY = clientY;

  const onMove = (e: MouseEvent | TouchEvent) => {
    const moveY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = moveY - dragStartY;
    const itemHeight = 72; // approximate field-item height

    if (Math.abs(diff) > itemHeight / 2) {
      const direction = diff > 0 ? 1 : -1;
      const newIndex = dragIndex + direction;

      if (newIndex >= 0 && newIndex < fields.value.length) {
        const moved = fields.value.splice(dragIndex, 1)[0];
        fields.value.splice(newIndex, 0, moved);
        dragIndex = newIndex;
        dragStartY = moveY;
      }
    }
  };

  const onEnd = async () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
    dragIndex = -1;

    // Save new order
    const reorderData = fields.value.map((f, i) => ({
      id: f.id,
      sortOrder: i,
    }));
    try {
      await reorderCustomFields(reorderData);
    } catch {
      // Reload on failure
      await loadFields();
    }
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchmove', onMove);
  document.addEventListener('touchend', onEnd);
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

.field-item {
  transition: all 0.3s ease;

  &:hover {
    border-color: #7849ff !important;
  }
}

.field-list-move {
  transition: transform 0.3s ease;
}

.field-list-enter-active,
.field-list-leave-active {
  transition: all 0.3s ease;
}

.field-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.field-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.drag-handle {
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background: var(--bg-elevated, rgba(120, 73, 255, 0.1));
  }
}

.options-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  border-radius: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
}
</style>
