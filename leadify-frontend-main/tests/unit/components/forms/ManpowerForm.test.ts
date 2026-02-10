import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const componentPath = resolve(__dirname, '../../../../components/operations/manPower/Form.vue');
let content: string;

beforeAll(() => {
  content = readFileSync(componentPath, 'utf-8');
});

describe('Manpower Form - Design System Compliance', () => {
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
      expect(sectionCount).toBeGreaterThanOrEqual(5);
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

    it('should have Personal Information section', () => {
      expect(content).toContain('Personal Information');
    });

    it('should have Role & Status section', () => {
      expect(content).toContain('Role & Status');
    });

    it('should have Salary & Compensation section', () => {
      expect(content).toContain('Salary & Compensation');
    });

    it('should have Additional Benefits section', () => {
      expect(content).toContain('Additional Benefits');
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

    it('should have salary-related fields', () => {
      expect(content).toContain('name="salary"');
    });

    it('should have a textarea for notes', () => {
      expect(content).toContain('type="textarea"');
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
