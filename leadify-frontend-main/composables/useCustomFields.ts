export interface CustomField {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX' | 'TEXTAREA';
  entityType: string;
  options?: string[];
  required: boolean;
  sortOrder: number;
}

export interface CustomFieldValue {
  id: string;
  customFieldId: string;
  entityId: string;
  entityType: string;
  value: any;
  customField?: CustomField;
}

export async function fetchCustomFields(entityType: string): Promise<CustomField[]> {
  const { body, success } = await useApiFetch(`custom-fields/fields/${entityType}`);
  if (success && Array.isArray(body)) return body;
  return [];
}

export async function createCustomField(data: Partial<CustomField>) {
  return useApiFetch('custom-fields/fields', 'POST', data as any);
}

export async function updateCustomField(id: string, data: Partial<CustomField>) {
  return useApiFetch(`custom-fields/fields/${id}`, 'PUT', data as any);
}

export async function deleteCustomField(id: string) {
  return useApiFetch(`custom-fields/fields/${id}`, 'DELETE');
}

export async function fetchFieldValues(entityType: string, entityId: string): Promise<CustomFieldValue[]> {
  const { body, success } = await useApiFetch(`custom-fields/values/${entityType}/${entityId}`);
  if (success && Array.isArray(body)) return body;
  return [];
}

export async function saveFieldValues(entityType: string, entityId: string, values: { customFieldId: string; value: any }[]) {
  return useApiFetch(`custom-fields/values/${entityType}/${entityId}`, 'PUT', { values } as any);
}
