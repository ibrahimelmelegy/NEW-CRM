import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const componentPath = resolve(__dirname, '../../../../components/leads/Form.vue');
let content: string;

beforeAll(() => {
  content = readFileSync(componentPath, 'utf-8');
});

describe('Lead Form - Design System Compliance', () => {
  describe('Structure', () => {
    it('should have a .glass-card wrapper', () => {
      expect(content).toContain('glass-card');
    });

    it('should use Pug template language', () => {
      expect(content).toContain('<template lang="pug">');
    });

    it('should use el-form with submit prevention', () => {
      expect(content).toContain('@submit.prevent');
    });
  });

  describe('Form Sections', () => {
    it('should have form-section blocks', () => {
      const sectionCount = (content.match(/\.form-section\b/g) || []).length;
      expect(sectionCount).toBeGreaterThanOrEqual(4);
    });

    it('should have form-section-header in each section', () => {
      expect(content).toContain('form-section-header');
    });

    it('should have section-icon in each header', () => {
      expect(content).toContain('section-icon');
    });

    it('should have section-title in each header', () => {
      expect(content).toContain('section-title');
    });

    it('should have Contact Information section', () => {
      expect(content).toContain('leadName');
    });

    it('should have Source & Status section', () => {
      expect(content).toContain('Source & Status');
    });

    it('should have Assignment section', () => {
      expect(content).toContain('Assignment');
    });

    it('should have Notes section', () => {
      expect(content).toContain('Notes');
    });
  });

  describe('Form Inputs', () => {
    it('should contain InputText fields', () => {
      expect(content).toContain('InputText');
    });

    it('should contain InputSelect fields', () => {
      expect(content).toContain('InputSelect');
    });

    it('should contain InputPhone field', () => {
      expect(content).toContain('InputPhone');
    });

    it('should contain InputDate field for last contact', () => {
      expect(content).toContain('InputDate');
    });

    it('should have a textarea for notes', () => {
      expect(content).toContain('type="textarea"');
    });
  });

  describe('i18n Integration', () => {
    it('should use $t for translations in template', () => {
      expect(content).toContain('$t(');
    });

    it('should reference leads translation keys', () => {
      expect(content).toContain("$t('leads.");
    });
  });

  describe('Theme Compliance', () => {
    it('should not have hardcoded text-neutral classes in template', () => {
      const templateSection = content.split('<script')[0];
      const forbidden = ['text-neutral-900', 'text-neutral-800', 'text-neutral-700'];
      const hasHardcoded = forbidden.some(cls => templateSection.includes(cls));
      expect(hasHardcoded).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should use vee-validate for form handling', () => {
      expect(content).toContain('useForm');
    });

    it('should use yup for schema validation', () => {
      expect(content).toContain('yup.object');
    });

    it('should emit submit event', () => {
      expect(content).toContain("emit('submit'");
    });
  });
});
