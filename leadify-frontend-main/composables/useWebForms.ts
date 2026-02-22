/**
 * Web Forms / Lead Capture System
 * Create embeddable forms that auto-create leads in the CRM.
 */
import { ref, computed } from 'vue';

export interface WebForm {
    id: string;
    name: string;
    fields: WebFormField[];
    thankYouMessage: string;
    redirectUrl?: string;
    isActive: boolean;
    submissions: number;
    createdAt: string;
    embedCode?: string;
}

export interface WebFormField {
    id: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
    required: boolean;
    placeholder?: string;
    options?: string[];
    mapTo?: string; // CRM field mapping
}

const STORAGE_KEY = 'crm_web_forms';
function load(): WebForm[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(items: WebForm[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

const forms = ref<WebForm[]>(load());

export function useWebForms() {
    const activeForms = computed(() => forms.value.filter(f => f.isActive));
    const stats = computed(() => ({
        total: forms.value.length,
        active: activeForms.value.length,
        totalSubmissions: forms.value.reduce((s, f) => s + f.submissions, 0),
    }));

    function createForm(data: Omit<WebForm, 'id' | 'createdAt' | 'submissions' | 'embedCode'>): WebForm {
        const form: WebForm = {
            ...data, id: `form_${Date.now()}`, createdAt: new Date().toISOString(), submissions: 0,
            embedCode: `<iframe src="${window.location.origin}/portal/form/form_${Date.now()}" width="100%" height="600" frameborder="0"></iframe>`,
        };
        forms.value.push(form);
        save(forms.value);
        return form;
    }

    function updateForm(id: string, updates: Partial<WebForm>) {
        const f = forms.value.find(x => x.id === id);
        if (f) { Object.assign(f, updates); save(forms.value); }
    }

    function removeForm(id: string) { forms.value = forms.value.filter(f => f.id !== id); save(forms.value); }
    function toggleActive(id: string) {
        const f = forms.value.find(x => x.id === id);
        if (f) { f.isActive = !f.isActive; save(forms.value); }
    }

    return { forms, activeForms, stats, createForm, updateForm, removeForm, toggleActive };
}
