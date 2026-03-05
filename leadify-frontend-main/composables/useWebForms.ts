/* eslint-disable no-use-before-define */
/**
 * Web Forms / Lead Capture System — API-backed
 * Create embeddable forms that auto-create leads in the CRM.
 */
import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface WebForm {
  id: number;
  name: string;
  description?: string;
  fields: WebFormField[];
  thankYouMessage: string;
  redirectUrl?: string;
  isActive: boolean;
  status: string;
  submissions: number;
  submissionCount: number;
  viewCount?: number;
  createLead: boolean;
  createdAt: string;
  embedCode?: string;
  embedToken?: string;
  enableRecaptcha?: boolean;
  enableHoneypot?: boolean;
  rateLimit?: number;
  styling?: Record<string, unknown>;
  autoResponse?: { enabled: boolean; subject?: string; body?: string };
  conditionalLogic?: Array<{ fieldId: string; condition: string; value: unknown; showFields: string[] }>;
}

export interface WebFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
  conditionalLogic?: unknown;
}

const forms = ref<WebForm[]>([]);
const loading = ref(false);

export function useWebForms() {
  const activeForms = computed(() => forms.value.filter(f => f.status === 'ACTIVE'));
  const stats = computed(() => {
    const totalSubmissions = forms.value.reduce((s, f) => s + (f.submissionCount || 0), 0);
    const totalViews = forms.value.reduce((s, f) => s + (f.viewCount || 0), 0);
    const avgConversion = totalViews > 0 ? Math.round((totalSubmissions / totalViews) * 100) : 0;
    return {
      total: forms.value.length,
      active: activeForms.value.length,
      totalSubmissions,
      totalViews,
      avgConversion
    };
  });

  async function fetchForms() {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('form-builder/templates?limit=100');
      if (success && body) {
        const data = body as unknown;
        forms.value = (data.docs || []).map((f) => ({
          ...f,
          fields: f.fields || [],
          isActive: f.status === 'ACTIVE',
          submissions: f.submissionCount || 0,
          thankYouMessage: f.thankYouMessage || '',
          embedCode: `<iframe src="${window.location.origin}/portal/form/${f.embedToken || f.id}" width="100%" height="600" frameborder="0"></iframe>`
        }));
      }
    } finally {
      loading.value = false;
    }
  }

  async function createForm(data: unknown): Promise<boolean> {
    const { success } = await useApiFetch('form-builder/templates', 'POST', {
      ...data,
      status: 'ACTIVE'
    });
    if (success) await fetchForms();
    return success;
  }

  async function updateForm(id: number, updates: unknown) {
    const { success } = await useApiFetch(`form-builder/templates/${id}`, 'PUT', updates);
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
      await updateForm(id, { status: newStatus });
    }
  }

  async function getFormAnalytics(formId: number) {
    const { body, success } = await useApiFetch(`form-builder/templates/${formId}/analytics`);
    if (success && body) return body;
    return null;
  }

  return { forms, activeForms, stats, fetchForms, createForm, updateForm, removeForm, toggleActive, getFormAnalytics, loading };
}
