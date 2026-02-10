/**
 * Breadcramp Component - Design System Compliance Tests
 * ======================================================
 * File-based tests for the breadcrumb navigation component.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const componentPath = resolve(__dirname, '../../../components/global/Breadcramp.vue');
let content: string;

beforeAll(() => {
  content = readFileSync(componentPath, 'utf-8');
});

describe('Breadcramp.vue', () => {
  describe('Structure', () => {
    it('should use semantic ol element for breadcrumbs', () => {
      expect(content).toContain('<template lang="pug">');
      expect(content).toContain('ol(');
    });

    it('should have BreadcrumbList schema markup', () => {
      expect(content).toContain('BreadcrumbList');
    });

    it('should have home icon link', () => {
      expect(content).toContain('solar:home-angle-outline');
    });

    it('should use NuxtLink for navigation', () => {
      expect(content).toContain('NuxtLink');
    });
  });

  describe('Props', () => {
    it('should accept title prop with default null', () => {
      expect(content).toContain('title:');
      expect(content).toContain('default: null');
    });
  });

  describe('Theme Compliance', () => {
    it('should use var(--text-muted) for separator color', () => {
      expect(content).toContain('var(--text-muted)');
    });

    it('should use var(--text-primary) for link color', () => {
      expect(content).toContain('var(--text-primary)');
    });

    it('should have .breadcrumb class', () => {
      expect(content).toContain('.breadcrumb');
    });

    it('should style router-link-active', () => {
      expect(content).toContain('.router-link-active');
    });
  });

  describe('Route Integration', () => {
    it('should use useRoute composable', () => {
      expect(content).toContain('useRoute()');
    });

    it('should use useRouter composable', () => {
      expect(content).toContain('useRouter()');
    });

    it('should compute crumbs from route', () => {
      expect(content).toContain('computed(');
      expect(content).toContain('crumbs');
    });
  });
});
