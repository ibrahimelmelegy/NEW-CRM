/**
 * useEmailComposer - Unit Tests
 * ================================
 * Tests for composables/useEmailComposer.ts
 *
 * The composable provides:
 * - fetchTemplates(): load email templates
 * - selectTemplate(template): apply template to form
 * - injectVariables(text): replace {{variable}} placeholders
 * - openComposer(context), closeComposer(), resetForm()
 * - getSuggestedSubjects(category)
 * - bestSendTime (computed)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useEmailComposer } from '@/composables/useEmailComposer';

const mockUseApiFetch = vi.fn();
const mockElNotification = vi.fn();
const mockNuxtApp = { $i18n: { t: (key: string) => key } };

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

vi.mock('element-plus', () => ({
  ElNotification: (...args: unknown[]) => mockElNotification(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);
(globalThis as Record<string, unknown>).ElNotification = (...args: unknown[]) => mockElNotification(...args);
(globalThis as Record<string, unknown>).useNuxtApp = () => mockNuxtApp;

const { ref, reactive, computed } = await import('vue');
(globalThis as Record<string, unknown>).ref = ref;
(globalThis as Record<string, unknown>).reactive = reactive;
(globalThis as Record<string, unknown>).computed = computed;

describe('useEmailComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchTemplates
  // ============================================
  describe('fetchTemplates', () => {
    it('should fetch templates and set state', async () => {
      const mockTemplates = [
        { id: 1, name: 'Welcome', subject: 'Welcome {{firstName}}!', body: 'Hello {{firstName}}' },
        { id: 2, name: 'Follow Up', subject: 'Follow up', body: 'Just checking in' }
      ];
      mockUseApiFetch.mockResolvedValue({ body: mockTemplates, success: true });

      const { fetchTemplates, templates } = useEmailComposer();
      await fetchTemplates();

      expect(mockUseApiFetch).toHaveBeenCalledWith('email/templates');
      expect(templates.value).toHaveLength(2);
    });

    it('should manage loading state', async () => {
      let resolvePromise: (value: unknown) => void;
      mockUseApiFetch.mockReturnValueOnce(
        new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

      const { fetchTemplates, loading } = useEmailComposer();

      expect(loading.value).toBe(false);
      const promise = fetchTemplates();
      expect(loading.value).toBe(true);

      resolvePromise!({ body: [], success: true });
      await promise;
      expect(loading.value).toBe(false);
    });

    it('should show error notification on failure', async () => {
      mockUseApiFetch.mockRejectedValue(new Error('Fetch failed'));

      const { fetchTemplates } = useEmailComposer();
      await fetchTemplates();

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('should set loading to false even on error', async () => {
      mockUseApiFetch.mockRejectedValue(new Error('Error'));

      const { fetchTemplates, loading } = useEmailComposer();
      await fetchTemplates();

      expect(loading.value).toBe(false);
    });
  });

  // ============================================
  // selectTemplate
  // ============================================
  describe('selectTemplate', () => {
    it('should set selectedTemplate and populate email form', () => {
      const { selectTemplate, selectedTemplate, emailForm, context } = useEmailComposer();
      context.value = { firstName: 'John', companyName: 'Acme' };

      const template = { id: 1, subject: 'Hello {{firstName}}', body: 'Dear {{firstName}} from {{companyName}}' };
      selectTemplate(template);

      expect(selectedTemplate.value).toEqual(template);
      expect(emailForm.subject).toBe('Hello John');
      expect(emailForm.body).toBe('Dear John from Acme');
    });

    it('should use template text as-is when no context variables match', () => {
      const { selectTemplate, emailForm } = useEmailComposer();

      const template = { id: 1, subject: 'Static Subject', body: 'Static body' };
      selectTemplate(template);

      expect(emailForm.subject).toBe('Static Subject');
      expect(emailForm.body).toBe('Static body');
    });
  });

  // ============================================
  // injectVariables
  // ============================================
  describe('injectVariables', () => {
    it('should replace all {{variable}} placeholders', () => {
      const { injectVariables, context } = useEmailComposer();
      context.value = { firstName: 'Jane', dealName: 'Big Deal' };

      const result = injectVariables('Hello {{firstName}}, regarding {{dealName}}.');
      expect(result).toBe('Hello Jane, regarding Big Deal.');
    });

    it('should leave unreplaced placeholders intact', () => {
      const { injectVariables, context } = useEmailComposer();
      context.value = { firstName: 'Jane' };

      const result = injectVariables('Hello {{firstName}}, from {{companyName}}.');
      expect(result).toBe('Hello Jane, from {{companyName}}.');
    });

    it('should return empty string for null/undefined text', () => {
      const { injectVariables } = useEmailComposer();
      expect(injectVariables('')).toBe('');
    });

    it('should replace multiple occurrences of the same variable', () => {
      const { injectVariables, context } = useEmailComposer();
      context.value = { firstName: 'John' };

      const result = injectVariables('{{firstName}}, {{firstName}}, {{firstName}}');
      expect(result).toBe('John, John, John');
    });
  });

  // ============================================
  // openComposer / closeComposer
  // ============================================
  describe('openComposer', () => {
    it('should set composerVisible to true', () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      const { openComposer, composerVisible } = useEmailComposer();
      openComposer();

      expect(composerVisible.value).toBe(true);
    });

    it('should set context data when provided', () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      const { openComposer, context } = useEmailComposer();
      openComposer({ firstName: 'Alice', companyName: 'Wonderland Inc' });

      expect(context.value.firstName).toBe('Alice');
      expect(context.value.companyName).toBe('Wonderland Inc');
    });

    it('should fetch templates when opened', () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      const { openComposer } = useEmailComposer();
      openComposer();

      expect(mockUseApiFetch).toHaveBeenCalledWith('email/templates');
    });
  });

  describe('closeComposer', () => {
    it('should set composerVisible to false', () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      const { openComposer, closeComposer, composerVisible } = useEmailComposer();
      openComposer();
      expect(composerVisible.value).toBe(true);

      closeComposer();
      expect(composerVisible.value).toBe(false);
    });
  });

  // ============================================
  // resetForm
  // ============================================
  describe('resetForm', () => {
    it('should clear all form fields', () => {
      const { emailForm, selectedTemplate, resetForm } = useEmailComposer();
      emailForm.to = 'test@test.com';
      emailForm.subject = 'Test Subject';
      emailForm.body = 'Test body';

      resetForm();

      expect(emailForm.to).toBe('');
      expect(emailForm.subject).toBe('');
      expect(emailForm.body).toBe('');
      expect(selectedTemplate.value).toBeNull();
    });
  });

  // ============================================
  // getSuggestedSubjects
  // ============================================
  describe('getSuggestedSubjects', () => {
    it('should return suggestions for follow-up category', () => {
      const { getSuggestedSubjects } = useEmailComposer();
      const suggestions = getSuggestedSubjects('follow-up');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toContain('follow');
    });

    it('should return suggestions for introduction category', () => {
      const { getSuggestedSubjects } = useEmailComposer();
      const suggestions = getSuggestedSubjects('introduction');

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown category', () => {
      const { getSuggestedSubjects } = useEmailComposer();
      const suggestions = getSuggestedSubjects('nonexistent-category');

      expect(suggestions).toEqual([]);
    });

    it('should return suggestions for all valid categories', () => {
      const { getSuggestedSubjects } = useEmailComposer();
      const categories = ['follow-up', 'introduction', 'proposal', 'thank-you', 'win-back'];

      for (const category of categories) {
        expect(getSuggestedSubjects(category).length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================
  // availableVariables
  // ============================================
  describe('availableVariables', () => {
    it('should expose list of available template variables', () => {
      const { availableVariables } = useEmailComposer();

      expect(availableVariables).toContain('firstName');
      expect(availableVariables).toContain('lastName');
      expect(availableVariables).toContain('companyName');
      expect(availableVariables.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // bestSendTime (computed)
  // ============================================
  describe('bestSendTime', () => {
    it('should return a non-empty string', () => {
      const { bestSendTime } = useEmailComposer();
      expect(bestSendTime.value).toBeTruthy();
      expect(typeof bestSendTime.value).toBe('string');
    });
  });
});
