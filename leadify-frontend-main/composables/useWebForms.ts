/**
 * Web Forms / Lead Capture System — API-backed
 * Create embeddable forms that auto-create leads in the CRM.
 */
import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface WebForm {
  id: number;
  name: string;
  fields: WebFormField[];
  thankYouMessage: string;
  redirectUrl?: string;
  isActive: boolean;
  status: string;
  submissions: number;
  submissionCount: number;
  createLead: boolean;
  createdAt: string;
  embedCode?: string;
}

export interface WebFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

const forms = ref<WebForm[]>([]);
const loading = ref(false);

export function useWebForms() {
  const activeForms = computed(() => forms.value.filter(f => f.status === 'ACTIVE'));
  const stats = computed(() => ({
    total: forms.value.length,
    active: activeForms.value.length,
    totalSubmissions: forms.value.reduce((s, f) => s + (f.submissionCount || 0), 0)
  }));

  async function fetchForms() {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('form-builder/templates?limit=100');
      if (success && body) {
        const data = body as any;
        forms.value = (data.docs || []).map((f: any) => ({
          ...f,
          fields: f.fields || [],
          isActive: f.status === 'ACTIVE',
          submissions: f.submissionCount || 0,
          thankYouMessage: f.thankYouMessage || '',
          embedCode: `<iframe src="${window.location.origin}/portal/form/${f.id}" width="100%" height="600" frameborder="0"></iframe>`
        }));
      }
    } finally {
      loading.value = false;
    }
  }

  async function createForm(data: {
    name: string;
    fields: WebFormField[];
    thankYouMessage: string;
    redirectUrl?: string;
    createLead?: boolean;
  }): Promise<boolean> {
    const { success } = await useApiFetch('form-builder/templates', 'POST', {
      name: data.name,
      fields: data.fields,
      thankYouMessage: data.thankYouMessage,
      redirectUrl: data.redirectUrl,
      createLead: data.createLead || false,
      status: 'ACTIVE'
    });
    if (success) await fetchForms();
    return success;
  }

  async function updateForm(id: number, updates: Partial<WebForm>) {
    const { success } = await useApiFetch(`form-builder/templates/${id}`, 'PUT', updates as any);
    if (success) await fetchForms();
    return success;
  }

  async function removeForm(id: number) {
    const { success } = await useApiFetch(`form-builder/templates/${id}`, 'DELETE');
    if (success) {
      forms.value = forms.value.filter(f => f.id !== id);
    }
    return success;
  }

  async function toggleActive(id: number) {
    const f = forms.value.find(x => x.id === id);
    if (f) {
      const newStatus = f.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      await updateForm(id, { status: newStatus } as any);
    }
  }

  return { forms, activeForms, stats, fetchForms, createForm, updateForm, removeForm, toggleActive, loading };
}
