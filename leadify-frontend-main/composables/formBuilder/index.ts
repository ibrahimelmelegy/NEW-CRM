/* eslint-disable require-await */
/**
 * Form Builder composable — wraps the /api/form-builder routes.
 *
 * Endpoints (all under /form-builder/templates):
 *   GET    /templates                — list all forms (paginated)
 *   POST   /templates                — create a new form
 *   PUT    /templates/:id            — update a form
 *   DELETE /templates/:id            — delete a form
 *   GET    /templates/:id/analytics  — per-form analytics
 *   GET    /submissions              — list all submissions
 */
import { ref, computed } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';

export interface FormBuilderField {
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options?: string[];
}

export interface FormBuilderForm {
  id: number;
  name: string;
  title?: string;
  description?: string;
  type?: string;
  status: string;
  isActive: boolean;
  submissions: number;
  views: number;
  conversionRate: number;
  fieldCount: number;
  fields: FormBuilderField[];
  submitText?: string;
  redirectUrl?: string;
  notifyOnSubmit?: boolean;
  mapToEntity?: string;
  embedToken?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormBuilderDef {
  title: string;
  description: string;
  submitText: string;
  redirectUrl: string;
  notifyOnSubmit: boolean;
  mapToEntity: string;
  fields: FormBuilderField[];
}

const forms = ref<FormBuilderForm[]>([]);
const loading = ref(false);

export function useFormBuilder() {
  const totalSubmissions = computed(() => forms.value.reduce((s, f) => s + (f.submissions || 0), 0));
  const activeForms = computed(() => forms.value.filter(f => f.isActive));
  const avgConversion = computed(() => {
    const active = activeForms.value;
    if (!active.length) return '0.0';
    return (active.reduce((s, f) => s + (f.conversionRate || 0), 0) / active.length).toFixed(1);
  });

  async function fetchForms() {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('form-builder/templates?limit=100');
      if (success && body) {
        const data = body as unknown;
        const docs: Record<string, unknown>[] = data.docs || data || [];
        forms.value = docs.map((f) => ({
          id: f.id,
          name: f.name || f.title || 'Untitled Form',
          title: f.title || f.name || '',
          description: f.description || '',
          type: f.type || 'Lead Capture',
          status: f.status || 'DRAFT',
          isActive: f.status === 'ACTIVE' || f.isActive === true,
          submissions: f.submissionCount ?? f.submissions ?? 0,
          views: f.viewCount ?? f.views ?? 0,
          conversionRate:
            f.conversionRate ?? (f.viewCount && f.submissionCount ? parseFloat(((f.submissionCount / f.viewCount) * 100).toFixed(1)) : 0),
          fieldCount: Array.isArray(f.fields) ? f.fields.length : (f.fieldCount ?? 0),
          fields: f.fields || [],
          submitText: f.submitText || 'Submit',
          redirectUrl: f.redirectUrl || '',
          notifyOnSubmit: f.notifyOnSubmit ?? true,
          mapToEntity: f.mapToEntity || 'lead',
          embedToken: f.embedToken,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt
        }));
      }
    } finally {
      loading.value = false;
    }
  }

  async function createForm(formDef: FormBuilderDef): Promise<boolean> {
    loading.value = true;
    try {
      const { success } = await useApiFetch('form-builder/templates', 'POST', {
        name: formDef.title || 'Untitled Form',
        title: formDef.title,
        description: formDef.description,
        fields: formDef.fields,
        submitText: formDef.submitText,
        redirectUrl: formDef.redirectUrl,
        notifyOnSubmit: formDef.notifyOnSubmit,
        mapToEntity: formDef.mapToEntity,
        status: 'ACTIVE'
      } as Record<string, unknown>);
      if (success) await fetchForms();
      return success;
    } finally {
      loading.value = false;
    }
  }

  async function updateForm(id: number, updates: Partial<FormBuilderDef> & Record<string, unknown>): Promise<boolean> {
    loading.value = true;
    try {
      const { success } = await useApiFetch(`form-builder/templates/${id}`, 'PUT', updates as Record<string, unknown>);
      if (success) await fetchForms();
      return success;
    } finally {
      loading.value = false;
    }
  }

  async function deleteForm(id: number): Promise<boolean> {
    const { success } = await useApiFetch(`form-builder/templates/${id}`, 'DELETE');
    if (success) {
      forms.value = forms.value.filter(f => f.id !== id);
    }
    return success;
  }

  async function toggleFormActive(id: number): Promise<boolean> {
    const form = forms.value.find(f => f.id === id);
    if (!form) return false;
    const newStatus = form.isActive ? 'DRAFT' : 'ACTIVE';
    return updateForm(id, { status: newStatus });
  }

  async function getFormAnalytics(formId: number): Promise<<unknown> {
    const { body, success } = await useApiFetch(`form-builder/templates/${formId}/analytics`);
    if (success && body) return body;
    return null;
  }

  async function getSubmissions(params?: { formId?: number; limit?: number }): Promise<any[]> {
    const qs = params?.formId ? `?formId=${params.formId}&limit=${params?.limit ?? 50}` : `?limit=${params?.limit ?? 50}`;
    const { body, success } = await useApiFetch(`form-builder/submissions${qs}`);
    if (success && body) {
      const data = body as unknown;
      return data.docs || data || [];
    }
    return [];
  }

  return {
    forms,
    loading,
    totalSubmissions,
    activeForms,
    avgConversion,
    fetchForms,
    createForm,
    updateForm,
    deleteForm,
    toggleFormActive,
    getFormAnalytics,
    getSubmissions
  };
}
