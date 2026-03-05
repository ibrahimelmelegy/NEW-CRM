/* eslint-disable require-await */

// ─── Types ───────────────────────────────────────────────────────────────────

export type CustomFieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'SELECT'
  | 'MULTISELECT'
  | 'CHECKBOX'
  | 'TEXTAREA'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'CURRENCY';

export type CustomFieldEntity =
  | 'LEAD'
  | 'DEAL'
  | 'OPPORTUNITY'
  | 'CLIENT'
  | 'CONTACT'
  | 'INVOICE';

export interface FieldOption {
  value: string;
  label: string;
}

export interface ValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface CustomField {
  id: string;
  entityType: CustomFieldEntity;
  fieldName: string;
  fieldLabel: string;
  fieldType: CustomFieldType;
  options?: FieldOption[];
  defaultValue?: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  validationRules?: ValidationRules;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // backward compat
  required?: boolean;
}

export interface CustomFieldValue {
  id: string;
  customFieldId: string;
  entityType: string;
  entityId: string;
  value: string | null;
  customField?: CustomField;
}

export interface FieldValuePayload {
  customFieldId: string;
  value: string | null;
}

// ─── API functions ───────────────────────────────────────────────────────────

/**
 * Fetch custom field definitions for an entity type
 */
export async function fetchCustomFields(
  entityType: string,
  includeInactive = false
): Promise<CustomField[]> {
  const query = includeInactive ? `?includeInactive=true` : '';
  const { body, success } = await useApiFetch(
    `custom-fields/fields/${entityType}${query}`
  );
  if (success && Array.isArray(body)) return body;
  return [];
}

/**
 * Create a new custom field definition
 */
export async function createCustomField(data: Partial<CustomField>) {
  return useApiFetch(
    'custom-fields/fields',
    'POST',
    data as Record<string, unknown>
  );
}

/**
 * Update an existing custom field definition
 */
export async function updateCustomField(
  id: string,
  data: Partial<CustomField>
) {
  return useApiFetch(
    `custom-fields/fields/${id}`,
    'PUT',
    data as Record<string, unknown>
  );
}

/**
 * Soft-delete a custom field (sets isActive=false)
 */
export async function deleteCustomField(id: string) {
  return useApiFetch(`custom-fields/fields/${id}`, 'DELETE');
}

/**
 * Reorder custom fields
 */
export async function reorderCustomFields(
  fields: { id: string; sortOrder: number }[]
) {
  return useApiFetch('custom-fields/fields/reorder', 'PUT', {
    fields,
  } as Record<string, unknown>);
}

/**
 * Fetch custom field values for a specific entity instance
 */
export async function fetchFieldValues(
  entityType: string,
  entityId: string
): Promise<CustomFieldValue[]> {
  const { body, success } = await useApiFetch(
    `custom-fields/values/${entityType}/${entityId}`
  );
  if (success && Array.isArray(body)) return body;
  return [];
}

/**
 * Save (bulk upsert) custom field values for an entity instance
 */
export async function saveFieldValues(
  entityType: string,
  entityId: string,
  values: FieldValuePayload[]
) {
  return useApiFetch(
    `custom-fields/values/${entityType}/${entityId}`,
    'PUT',
    { values } as Record<string, unknown>
  );
}

/**
 * Delete all custom field values for an entity instance
 */
export async function deleteFieldValues(
  entityType: string,
  entityId: string
) {
  return useApiFetch(
    `custom-fields/values/${entityType}/${entityId}`,
    'DELETE'
  );
}

// ─── Composable (reactive) ──────────────────────────────────────────────────

/**
 * Reactive composable for managing custom fields within a component.
 * Provides fields, values, loading states, and helper methods.
 */
export function useCustomFieldsForm(
  entityType: Ref<string> | string,
  entityId?: Ref<string | null> | string | null
) {
  const resolvedType = isRef(entityType) ? entityType : ref(entityType);
  const resolvedId = isRef(entityId) ? entityId : ref(entityId ?? null);

  const fields = ref<CustomField[]>([]);
  const values = ref<Record<string, string | null>>({});
  const loading = ref(false);
  const saving = ref(false);

  /**
   * Load field definitions for the current entity type
   */
  async function loadFields() {
    loading.value = true;
    try {
      fields.value = await fetchCustomFields(resolvedType.value);
      // Set default values
      for (const field of fields.value) {
        if (values.value[field.id] === undefined) {
          values.value[field.id] = field.defaultValue ?? null;
        }
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * Load existing values for an entity (only if entityId is set)
   */
  async function loadValues() {
    if (!resolvedId.value) return;
    loading.value = true;
    try {
      const fetched = await fetchFieldValues(
        resolvedType.value,
        resolvedId.value
      );
      for (const fv of fetched) {
        values.value[fv.customFieldId] = fv.value;
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * Save all current values to the backend
   */
  async function save() {
    if (!resolvedId.value) return;
    saving.value = true;
    try {
      const payload: FieldValuePayload[] = Object.entries(values.value).map(
        ([customFieldId, value]) => ({
          customFieldId,
          value: value ?? null,
        })
      );
      await saveFieldValues(resolvedType.value, resolvedId.value, payload);
    } finally {
      saving.value = false;
    }
  }

  /**
   * Get the current values as a FieldValuePayload array
   */
  function getPayload(): FieldValuePayload[] {
    return Object.entries(values.value).map(([customFieldId, value]) => ({
      customFieldId,
      value: value ?? null,
    }));
  }

  /**
   * Reset values to defaults
   */
  function resetValues() {
    values.value = {};
    for (const field of fields.value) {
      values.value[field.id] = field.defaultValue ?? null;
    }
  }

  return {
    fields,
    values,
    loading,
    saving,
    loadFields,
    loadValues,
    save,
    getPayload,
    resetValues,
  };
}
