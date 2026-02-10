import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const componentPath = resolve(__dirname, '../../../../components/operations/service/Form.vue');
let content: string;

beforeAll(() => {
  content = readFileSync(componentPath, 'utf-8');
});

describe('Service Form - Design System Compliance', () => {
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
    it('should have at least 1 form-section block', () => {
      const sectionCount = (content.match(/\.form-section\b/g) || []).length;
      expect(sectionCount).toBeGreaterThanOrEqual(1);
    });

    it('should have form-section-header', () => {
      expect(content).toContain('form-section-header');
    });

    it('should have section-icon', () => {
      expect(content).toContain('section-icon');
    });

    it('should have section-title', () => {
      expect(content).toContain('section-title');
    });

    it('should have Service Details section', () => {
      expect(content).toContain('Service Details');
    });
  });

  describe('Form Inputs', () => {
    it('should contain InputText fields', () => {
      expect(content).toContain('InputText');
    });

    it('should have service type/name field', () => {
      expect(content).toContain('name="type"');
    });

    it('should have price field', () => {
      expect(content).toContain('name="price"');
    });
  });

  describe('i18n Integration', () => {
    it('should use $t for translations in template', () => {
      expect(content).toContain('$t(');
    });

    it('should reference service translation keys', () => {
      expect(content).toContain("$t('operations.service.");
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
