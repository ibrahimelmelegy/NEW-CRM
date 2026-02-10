/**
 * List Pages - UI Design System Compliance Tests
 * ================================================
 * Verifies all list pages follow the modernized EntityList design:
 * - .animate-entrance root
 * - .text-gradient title
 * - .glass-card wrapping AppTable
 * - .premium-table on AppTable
 * - .glass-dropdown on dropdown menus
 * - .hover-scale on action icons
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const BASE = resolve(__dirname, '../../../pages');

const listPages = [
  { path: 'sales/leads/index.vue', name: 'Leads' },
  { path: 'sales/clients/index.vue', name: 'Clients' },
  { path: 'sales/deals/index.vue', name: 'Deals' },
  { path: 'sales/opportunity/index.vue', name: 'Opportunities' },
  { path: 'operations/projects/index.vue', name: 'Projects' },
  { path: 'operations/assets/index.vue', name: 'Assets' },
  { path: 'operations/manpower/index.vue', name: 'Manpower' },
  { path: 'operations/vehicle/index.vue', name: 'Vehicles' },
  { path: 'operations/services/index.vue', name: 'Services' },
  { path: 'staff/index.vue', name: 'Staff' },
  { path: 'roles/index.vue', name: 'Roles' },
];

describe('List Pages - Design System Compliance', () => {
  listPages.forEach(({ path, name }) => {
    describe(`${name} (${path})`, () => {
      let content: string;

      beforeAll(() => {
        content = readFileSync(resolve(BASE, path), 'utf-8');
      });

      it('should have .animate-entrance class on root', () => {
        expect(content).toContain('animate-entrance');
      });

      it('should have .text-gradient title', () => {
        expect(content).toContain('text-gradient');
      });

      it('should wrap table in .glass-card', () => {
        expect(content).toContain('glass-card');
      });

      it('should use premium-table class', () => {
        expect(content).toContain('premium-table');
      });

      it('should use glass-dropdown on dropdown menus', () => {
        expect(content).toContain('glass-dropdown');
      });

      it('should use hover-scale on action icons', () => {
        expect(content).toContain('hover-scale');
      });

      it('should not have hardcoded text-neutral colors in template', () => {
        const templateSection = content.split('<script')[0];
        const hasHardcoded = ['text-neutral-900', 'text-neutral-800'].some(cls =>
          templateSection.includes(cls)
        );
        expect(hasHardcoded).toBe(false);
      });
    });
  });
});

describe('Special List Pages', () => {
  describe('Additional Material', () => {
    let content: string;

    beforeAll(() => {
      content = readFileSync(resolve(BASE, 'operations/additional-material/index.vue'), 'utf-8');
    });

    it('should have glass-card class', () => {
      expect(content).toContain('glass-card');
    });

    it('should use theme-aware text colors', () => {
      const templateSection = content.split('<script')[0];
      expect(templateSection).not.toContain('text-neutral-400');
    });
  });

  describe('Daily Task', () => {
    let content: string;

    beforeAll(() => {
      content = readFileSync(resolve(BASE, 'operations/daily-task/index.vue'), 'utf-8');
    });

    it('should have glass-card class', () => {
      expect(content).toContain('glass-card');
    });

    it('should use premium-table on AppTables', () => {
      expect(content).toContain('premium-table');
    });
  });
});
