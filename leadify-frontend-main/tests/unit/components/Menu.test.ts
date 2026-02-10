/**
 * Menu Component - Design System Compliance Tests
 * =================================================
 * File-based tests for the sidebar Menu component.
 * Component mounting is too complex due to store/composable dependencies.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const componentPath = resolve(__dirname, '../../../components/global/Menu.vue');
let content: string;

beforeAll(() => {
  content = readFileSync(componentPath, 'utf-8');
});

describe('Menu.vue', () => {
  describe('Structure', () => {
    it('should use el-menu component', () => {
      expect(content).toContain('el-menu');
    });

    it('should have sidebar-glass class', () => {
      expect(content).toContain('sidebar-glass');
    });

    it('should have toggle indicator', () => {
      expect(content).toContain('toggle-indicator');
    });

    it('should have mobile overlay', () => {
      expect(content).toContain('background-overlay');
    });
  });

  describe('Navigation', () => {
    it('should render NuxtLink for navigation', () => {
      expect(content).toContain('NuxtLink');
    });

    it('should use .myicon class for icons', () => {
      expect(content).toContain('myicon');
    });

    it('should support sub-menus', () => {
      expect(content).toContain('el-sub-menu');
    });

    it('should support disabled links', () => {
      expect(content).toContain('disabled-link');
    });
  });

  describe('Theme Integration', () => {
    it('should have theme-aware logo', () => {
      expect(content).toContain('logoSrc');
    });

    it('should use glass-card for toggle button', () => {
      expect(content).toContain('glass-card');
    });

    it('should use var(--color-text-primary) for toggle icon', () => {
      expect(content).toContain('var(--color-text-primary)');
    });
  });

  describe('Responsive', () => {
    it('should support mobile navigation', () => {
      expect(content).toContain('mobile');
    });

    it('should support collapse state', () => {
      expect(content).toContain('fullNav');
    });
  });
});
