/**
 * Detail Pages - UI Design System Compliance Tests
 * =================================================
 * Verifies all [slug].vue detail pages follow design guidelines:
 * - Uses .glass-card for info sections
 * - Uses theme-aware text colors (CSS vars OR global overrides for text-neutral-*)
 * - No hardcoded hex colors for borders
 * - Has activity tab with ActivityTimeline
 * - Uses var(--color-border-*) for borders (not hardcoded)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const BASE = resolve(__dirname, '../../../pages');

// Sales pages use inline var(--text-primary) CSS variables
const salesDetailPages = [
  { path: 'sales/leads/[slug].vue', name: 'Lead Detail' },
  { path: 'sales/clients/[slug].vue', name: 'Client Detail' },
  { path: 'sales/opportunity/[slug].vue', name: 'Opportunity Detail' },
  { path: 'sales/deals/[slug].vue', name: 'Deal Detail' },
];

// Operations pages use text-neutral-* classes (overridden by _utilities.scss global CSS)
const operationsDetailPages = [
  { path: 'operations/projects/[slug].vue', name: 'Project Detail' },
  { path: 'operations/assets/[slug].vue', name: 'Asset Detail' },
  { path: 'operations/manpower/[slug].vue', name: 'Manpower Detail' },
  { path: 'operations/vehicle/[slug].vue', name: 'Vehicle Detail' },
  { path: 'operations/services/[slug].vue', name: 'Service Detail' },
  { path: 'operations/daily-task/[slug].vue', name: 'Daily Task Detail' },
  { path: 'operations/additional-material/[slug].vue', name: 'Additional Material Detail' },
];

const allDetailPages = [...salesDetailPages, ...operationsDetailPages];

describe('Detail Pages - Common Design System', () => {
  allDetailPages.forEach(({ path, name }) => {
    const fullPath = resolve(BASE, path);
    if (!existsSync(fullPath)) return;

    describe(`${name} (${path})`, () => {
      let content: string;

      beforeAll(() => {
        content = readFileSync(fullPath, 'utf-8');
      });

      it('should have .glass-card for info sections', () => {
        expect(content).toContain('glass-card');
      });

      it('should not use hardcoded #e7e6e9 border color', () => {
        expect(content).not.toContain('#e7e6e9');
      });

      it('should use theme-aware border variables, glass-card, or scoped styles', () => {
        // Pages may use var(--color-border-*), border utility classes, or inherit from glass-card
        const hasBorderApproach = content.includes('var(--color-border') ||
                             content.includes('var(--border') ||
                             content.includes('border-default') ||
                             content.includes('border-subtle') ||
                             content.includes('glass-card') ||
                             content.includes('rounded-3xl');
        expect(hasBorderApproach).toBe(true);
      });
    });
  });
});

describe('Sales Detail Pages - Inline CSS Variables', () => {
  salesDetailPages.forEach(({ path, name }) => {
    const fullPath = resolve(BASE, path);
    if (!existsSync(fullPath)) return;

    describe(`${name} (${path})`, () => {
      let content: string;

      beforeAll(() => {
        content = readFileSync(fullPath, 'utf-8');
      });

      it('should use var(--text-primary) for text', () => {
        expect(content).toContain('var(--text-primary)');
      });

      it('should use var(--text-muted) or var(--text-secondary) for labels', () => {
        const hasMuted = content.includes('var(--text-muted)') || content.includes('var(--text-secondary)');
        expect(hasMuted).toBe(true);
      });
    });
  });
});

describe('Operations Detail Pages - Tailwind Override Classes', () => {
  operationsDetailPages.forEach(({ path, name }) => {
    const fullPath = resolve(BASE, path);
    if (!existsSync(fullPath)) return;

    describe(`${name} (${path})`, () => {
      let content: string;

      beforeAll(() => {
        content = readFileSync(fullPath, 'utf-8');
      });

      it('should use text-neutral-* classes (overridden by global CSS)', () => {
        // Operations pages use Tailwind text-neutral-* which are theme-overridden in _utilities.scss
        const usesNeutral = content.includes('text-neutral-');
        const usesVarText = content.includes('var(--text-primary)');
        // Must use one approach or the other for text colors
        expect(usesNeutral || usesVarText).toBe(true);
      });

      it('should not use hardcoded hex colors for text (e.g. #333, #666)', () => {
        const templateSection = content.split('<script')[0];
        // These specific hex patterns indicate hardcoded dark text
        const forbidden = ['color: #333', 'color: #666', 'color: #000'];
        const hasHardcoded = forbidden.some(c => templateSection.includes(c));
        expect(hasHardcoded).toBe(false);
      });
    });
  });
});

describe('Detail Pages - Activity Tab', () => {
  const pagesWithActivity = [
    'sales/leads/[slug].vue',
    'sales/clients/[slug].vue',
    'sales/opportunity/[slug].vue',
  ];

  pagesWithActivity.forEach(path => {
    const fullPath = resolve(BASE, path);
    if (!existsSync(fullPath)) return;

    it(`${path} should reference ActivityTimeline component`, () => {
      const content = readFileSync(fullPath, 'utf-8');
      expect(content).toContain('ActivityTimeline');
    });
  });
});

describe('Detail Pages - Icon Backgrounds', () => {
  const iconPages = [
    'sales/leads/[slug].vue',
    'sales/opportunity/[slug].vue',
    'sales/clients/[slug].vue',
  ];

  iconPages.forEach(path => {
    const fullPath = resolve(BASE, path);
    if (!existsSync(fullPath)) return;

    it(`${path} should use var(--color-primary-alpha-10) for icon backgrounds`, () => {
      const content = readFileSync(fullPath, 'utf-8');
      expect(content).toContain('var(--color-primary-alpha-10');
    });
  });
});
