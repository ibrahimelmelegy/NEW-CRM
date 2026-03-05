<template lang="pug">
.custom-fields-renderer(v-if="fields.length > 0 || loading")
  el-skeleton(:rows="2" animated v-if="loading")

  template(v-else)
    .custom-fields-section(v-if="fields.length > 0")
      h4.text-sm.font-semibold.mb-4(
        v-if="showTitle"
        style="color: var(--text-primary)"
      ) {{ $t('customFields.title') }}

      .custom-fields-grid(:class="gridClass")
        .custom-field-item(
          v-for="field in fields"
          :key="field.id"
        )
          //- TEXT
          template(v-if="field.fieldType === 'TEXT'")
            el-form-item(
              :label="field.fieldLabel"
              :required="field.isRequired || field.required"
            )
              el-input(
                v-if="!readonly"
                v-model="localValues[field.id]"
                :placeholder="getPlaceholder(field)"
                :disabled="disabled"
                :maxlength="field.validationRules?.maxLength"
                show-word-limit
                @change="onFieldChange(field.id)"
              )
              span.readonly-value(v-else) {{ displayValue(field) }}

          //- TEXTAREA
          template(v-else-if="field.fieldType === 'TEXTAREA'")
            el-form-item(
              :label="field.fieldLabel"
              :required="field.isRequired || field.required"
            )
              el-input(
                v-if="!readonly"
                v-model="localValues[field.id]"
                type="textarea"
                :rows="3"
                :placeholder="getPlaceholder(field)"
                :disabled="disabled"
                :maxlength="field.validationRules?.maxLength"
                show-word-limit
                @change="onFieldChange(field.id)"
              )
              span.readonly-value(v-else) {{ displayValue(field) }}

          //- NUMBER
          template(v-else-if="field.fieldType === 'NUMBER'")
            el-form-item(
              :label="field.fieldLabel"
              :required="field.isRequired || field.required"
            )
              el-input-number(
                v-if="!readonly"
                v-model="numericValues[field.id]"
                :placeholder="getPlaceholder(field)"
                :disabled="disabled"
                :min="field.validationRules?.min"
                :max="field.validationRules?.max"
                controls-position="right"
                class="w-full"
                @change="onNumberChange(field.id)"
              )
              span.readonly-value(v-else) {{ displayValue(field) }}

          //- CURRENCY
          template(v-else-if="field.fieldType === 'CURRENCY'")
            el-form-item(
              :label="field.fieldLabel"
              :required="field.isRequired || field.required"
            )
              el-input-number(
                v-if="!readonly"
                v-model="numericValues[field.id]"
                :placeholder="getPlaceholder(field)"
                :disabled="disabled"
                :min="field.validationRules?.min ?? 0"
                :max="field.validationRules?.max"
                :precision="2"
                controls-position="right"
                class="w-full"
                @change="onNumberChange(field.id)"
              )
              span.readonly-value(v-else) {{ displayValue(field) }}

          //- DATE
          template(v-else-if="field.fieldType === 'DATE'")
            el-form-item(
              :label="field.fieldLabel"
              :required="field.isRequired || field.required"
            )
              el-date-picker(
                v-if="!readonly"
                v-model="localValues[field.id]"
                type="date"
                :placeholder="getPlaceholder(field)"
                :disabled="disabled"
                value-format="YYYY-MM-DD"
                class="w-full"
                @change="onFieldChange(field.id)"
              )
              span.readonly-value(v-else) {{ displayValue(field) }}

          //- SELECT
          template(v-else-if="field.fieldType === 'SELECT'")
            el-form-item(
              :label="field.fieldLabel"
              :required="field.isRequired || field.required"
            )
              el-select(
                v-if="!readonly"
                v-model="localValues[field.id]"
                :placeholder="getPlaceholder(field)"
                :disabled="disabled"
                clearable
                class="w-full"
                @change="onFieldChange(field.id)"
              )
                el-option(
                  v-for="opt in getOptions(field)"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                )
              span.readonly-value(v-else) {{ getOptionLabel(field, localValues[field.id]) }}

          //- MULTISELECT
          template(v-else-if="field.fieldType === 'MULTISELECT'")
            el-form-item(
              :label="field.fieldLabel"
              :required="field.isRequired || field.required"
            )
              el-select(
                v-if="!readonly"
                v-model="multiselectValues[field.id]"
                :placeholder="getPlaceholder(field)"
                :disabled="disabled"
                multiple
                clearable
                collapse-tags
                collapse-tags-tooltip
                class="w-full"
                @change="onMultiselectChange(field.id)"
              )
                el-option(
                  v-for="opt in getOptions(field)"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                )
              .readonly-value(v-else)
                el-tag(
                  v-for="val in getMultiselectDisplay(field)"
                  :key="val"
                  size="small"
                  class="mr-1 mb-1"
                ) {{ val }}

          //- CHECKBOX
          template(v-else-if="field.fieldType === 'CHECKBOX'")
            el-form-item(
              :label="field.fieldLabel"
              :required="field.isRequired || field.required"
            )
              el-checkbox(
                v-if="!readonly"
                v-model="checkboxValues[field.id]"
                :disabled="disabled"
                @change="onCheckboxChange(field.id)"
              ) {{ field.fieldLabel }}
              span.readonly-value(v-else) {{ checkboxValues[field.id] ? $t('common.yes') : $t('common.no') }}

          //- EMAIL
          template(v-else-if="field.fieldType === 'EMAIL'")
            el-form-item(
              :label="field.fieldLabel"
              :required="field.isRequired || field.required"
            )
              el-input(
                v-if="!readonly"
                v-model="localValues[field.id]"
                type="email"
                :placeholder="getPlaceholder(field)"
                :disabled="disabled"
                @change="onFieldChange(field.id)"
              )
                template(#prefix)
                  Icon(name="ph:envelope" size="16" aria-hidden="true")
              span.readonly-value(v-else) {{ displayValue(field) }}

          //- PHONE
          template(v-else-if="field.fieldType === 'PHONE'")
            el-form-item(
              :label="field.fieldLabel"
              :required="field.isRequired || field.required"
            )
              el-input(
                v-if="!readonly"
                v-model="localValues[field.id]"
                :placeholder="getPlaceholder(field)"
                :disabled="disabled"
                @change="onFieldChange(field.id)"
              )
                template(#prefix)
                  Icon(name="ph:phone" size="16" aria-hidden="true")
              span.readonly-value(v-else) {{ displayValue(field) }}

          //- URL
          template(v-else-if="field.fieldType === 'URL'")
            el-form-item(
              :label="field.fieldLabel"
              :required="field.isRequired || field.required"
            )
              el-input(
                v-if="!readonly"
                v-model="localValues[field.id]"
                :placeholder="getPlaceholder(field)"
                :disabled="disabled"
                @change="onFieldChange(field.id)"
              )
                template(#prefix)
                  Icon(name="ph:link" size="16" aria-hidden="true")
              a.readonly-value(
                v-else-if="localValues[field.id]"
                :href="localValues[field.id]"
                target="_blank"
                rel="noopener noreferrer"
                style="color: var(--brand-primary)"
              ) {{ localValues[field.id] }}
              span.readonly-value(v-else) -
</template>

<script setup lang="ts">
import type {
  CustomField,
  FieldOption,
  FieldValuePayload,
} from '~/composables/useCustomFields';
import {
  fetchCustomFields,
  fetchFieldValues,
} from '~/composables/useCustomFields';

// ─── Props ───────────────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    entityType: string;
    entityId?: string | null;
    readonly?: boolean;
    disabled?: boolean;
    showTitle?: boolean;
    columns?: 1 | 2 | 3;
  }>(),
  {
    entityId: null,
    readonly: false,
    disabled: false,
    showTitle: true,
    columns: 2,
  }
);

// ─── Emits ───────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: 'change', payload: FieldValuePayload[]): void;
  (e: 'loaded', fields: CustomField[]): void;
}>();

// ─── State ───────────────────────────────────────────────────────────────────

const fields = ref<CustomField[]>([]);
const loading = ref(false);

// String values for text-based fields
const localValues = ref<Record<string, string | null>>({});

// Numeric values for number/currency fields
const numericValues = ref<Record<string, number | undefined>>({});

// Boolean values for checkbox fields
const checkboxValues = ref<Record<string, boolean>>({});

// Array values for multiselect fields
const multiselectValues = ref<Record<string, string[]>>({});

// ─── Computed ────────────────────────────────────────────────────────────────

const gridClass = computed(() => {
  if (props.columns === 1) return 'grid-cols-1';
  if (props.columns === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-1 md:grid-cols-2';
});

// ─── Methods ─────────────────────────────────────────────────────────────────

function getPlaceholder(field: CustomField): string {
  return field.fieldLabel;
}

function getOptions(field: CustomField): FieldOption[] {
  if (!field.options) return [];
  // Support both old format (string[]) and new format ({value, label}[])
  return field.options.map((opt: FieldOption | string) => {
    if (typeof opt === 'string') return { value: opt, label: opt };
    return opt;
  });
}

function getOptionLabel(field: CustomField, value: string | null): string {
  if (!value) return '-';
  const opts = getOptions(field);
  const found = opts.find(o => o.value === value);
  return found ? found.label : value;
}

function displayValue(field: CustomField): string {
  const val = localValues.value[field.id];
  if (val === null || val === undefined || val === '') return '-';
  return val;
}

function getMultiselectDisplay(field: CustomField): string[] {
  const raw = localValues.value[field.id];
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const opts = getOptions(field);
      return parsed.map(v => {
        const found = opts.find(o => o.value === v);
        return found ? found.label : v;
      });
    }
  } catch {
    // not JSON
  }
  return [];
}

function initFieldValues() {
  for (const field of fields.value) {
    const currentVal = localValues.value[field.id];

    // Initialize default if not set
    if (currentVal === undefined) {
      localValues.value[field.id] = field.defaultValue ?? null;
    }

    // Sync numeric values
    if (field.fieldType === 'NUMBER' || field.fieldType === 'CURRENCY') {
      const strVal = localValues.value[field.id];
      numericValues.value[field.id] = strVal ? Number(strVal) : undefined;
    }

    // Sync checkbox values
    if (field.fieldType === 'CHECKBOX') {
      const strVal = localValues.value[field.id];
      checkboxValues.value[field.id] = strVal === 'true' || strVal === '1';
    }

    // Sync multiselect values
    if (field.fieldType === 'MULTISELECT') {
      const strVal = localValues.value[field.id];
      if (strVal) {
        try {
          const parsed = JSON.parse(strVal);
          multiselectValues.value[field.id] = Array.isArray(parsed) ? parsed : [];
        } catch {
          multiselectValues.value[field.id] = [];
        }
      } else {
        multiselectValues.value[field.id] = [];
      }
    }
  }
}

function emitChange() {
  const payload: FieldValuePayload[] = fields.value.map(field => ({
    customFieldId: field.id,
    value: localValues.value[field.id] ?? null,
  }));
  emit('change', payload);
}

function onFieldChange(_fieldId: string) {
  emitChange();
}

function onNumberChange(fieldId: string) {
  const val = numericValues.value[fieldId];
  localValues.value[fieldId] = val !== undefined ? String(val) : null;
  emitChange();
}

function onCheckboxChange(fieldId: string) {
  localValues.value[fieldId] = checkboxValues.value[fieldId] ? 'true' : 'false';
  emitChange();
}

function onMultiselectChange(fieldId: string) {
  const selected = multiselectValues.value[fieldId] || [];
  localValues.value[fieldId] = selected.length > 0 ? JSON.stringify(selected) : null;
  emitChange();
}

// ─── Load data ───────────────────────────────────────────────────────────────

async function loadAll() {
  loading.value = true;
  try {
    fields.value = await fetchCustomFields(props.entityType);

    if (props.entityId) {
      const existingValues = await fetchFieldValues(
        props.entityType,
        props.entityId
      );
      for (const fv of existingValues) {
        localValues.value[fv.customFieldId] = fv.value;
      }
    }

    initFieldValues();
    emit('loaded', fields.value);
  } finally {
    loading.value = false;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get current values as payload array (for parent components to use when saving)
 */
function getPayload(): FieldValuePayload[] {
  return fields.value.map(field => ({
    customFieldId: field.id,
    value: localValues.value[field.id] ?? null,
  }));
}

/**
 * Set values externally (e.g. when loading from parent)
 */
function setValues(vals: Record<string, string | null>) {
  for (const [key, value] of Object.entries(vals)) {
    localValues.value[key] = value;
  }
  initFieldValues();
}

defineExpose({ getPayload, setValues, fields, loading });

// ─── Lifecycle ───────────────────────────────────────────────────────────────

onMounted(() => loadAll());

watch(
  () => props.entityType,
  () => loadAll()
);

watch(
  () => props.entityId,
  (newId) => {
    if (newId) loadAll();
  }
);
</script>

<style lang="scss" scoped>
.custom-fields-renderer {
  width: 100%;
}

.custom-fields-grid {
  display: grid;
  gap: 16px;

  &.grid-cols-1 {
    grid-template-columns: 1fr;
  }

  &.grid-cols-1.md\:grid-cols-2 {
    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &.grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 {
    @media (min-width: 1024px) {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }
}

.readonly-value {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
}

.custom-field-item {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-date-editor) {
    width: 100% !important;
  }

  :deep(.el-select) {
    width: 100%;
  }
}
</style>
