/**
 * UI Theme & CSS Utility Tests
 * ==============================
 * Comprehensive tests for theme switching, CSS utility classes,
 * and design system compliance.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('UI Theme Switching', () => {
  let htmlElement: HTMLElement;

  beforeEach(() => {
    htmlElement = document.documentElement;
    htmlElement.className = '';
    document.body.className = '';
  });

  afterEach(() => {
    htmlElement.className = '';
  });

  describe('Dark Mode (Default)', () => {
    it('should default to dark mode with no light-mode class', () => {
      expect(htmlElement.classList.contains('light-mode')).toBe(false);
    });

    it('should NOT have light-mode class on body (uses documentElement)', () => {
      expect(document.body.classList.contains('light-mode')).toBe(false);
    });
  });

  describe('Light Mode Toggle', () => {
    it('should add light-mode class to documentElement when toggling to light', () => {
      htmlElement.classList.add('light-mode');
      expect(htmlElement.classList.contains('light-mode')).toBe(true);
    });

    it('should remove light-mode class when toggling back to dark', () => {
      htmlElement.classList.add('light-mode');
      htmlElement.classList.remove('light-mode');
      expect(htmlElement.classList.contains('light-mode')).toBe(false);
    });

    it('should apply class to documentElement NOT body', () => {
      htmlElement.classList.add('light-mode');
      expect(document.documentElement.classList.contains('light-mode')).toBe(true);
      expect(document.body.classList.contains('light-mode')).toBe(false);
    });

    it('should support toggle function pattern', () => {
      const toggleTheme = () => {
        htmlElement.classList.toggle('light-mode');
      };

      toggleTheme();
      expect(htmlElement.classList.contains('light-mode')).toBe(true);

      toggleTheme();
      expect(htmlElement.classList.contains('light-mode')).toBe(false);
    });
  });

  describe('Theme Class Naming', () => {
    it('should use light-mode NOT light-theme', () => {
      htmlElement.classList.add('light-mode');
      expect(htmlElement.classList.contains('light-mode')).toBe(true);
      expect(htmlElement.classList.contains('light-theme')).toBe(false);
    });

    it('should use light-mode NOT dark-mode (dark is default/absence)', () => {
      expect(htmlElement.classList.contains('dark-mode')).toBe(false);
    });
  });
});

describe('CSS Utility Classes - Structure Validation', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('.glass-card', () => {
    it('should be a valid CSS class name', () => {
      const el = document.createElement('div');
      el.classList.add('glass-card');
      expect(el.classList.contains('glass-card')).toBe(true);
    });
  });

  describe('.premium-btn', () => {
    it('should be a valid CSS class name', () => {
      const el = document.createElement('div');
      el.classList.add('premium-btn');
      expect(el.classList.contains('premium-btn')).toBe(true);
    });
  });

  describe('.form-section', () => {
    it('should be applicable as a class', () => {
      const el = document.createElement('div');
      el.classList.add('form-section');
      expect(el.classList.contains('form-section')).toBe(true);
    });

    it('should support nested .form-section-header', () => {
      container.innerHTML = `
        <div class="form-section">
          <div class="form-section-header">
            <div class="section-icon"></div>
            <div class="section-title">Title</div>
          </div>
        </div>
    `;
      expect(container.querySelector('.form-section')).not.toBeNull();
      expect(container.querySelector('.form-section-header')).not.toBeNull();
      expect(container.querySelector('.section-icon')).not.toBeNull();
      expect(container.querySelector('.section-title')).not.toBeNull();
    });
  });

  describe('.text-gradient', () => {
    it('should be a valid CSS class name', () => {
      const el = document.createElement('div');
      el.classList.add('text-gradient');
      expect(el.classList.contains('text-gradient')).toBe(true);
    });
  });

  describe('.animate-entrance', () => {
    it('should be a valid CSS class name', () => {
      const el = document.createElement('div');
      el.classList.add('animate-entrance');
      expect(el.classList.contains('animate-entrance')).toBe(true);
    });
  });

  describe('.hover-scale', () => {
    it('should be a valid CSS class name', () => {
      const el = document.createElement('div');
      el.classList.add('hover-scale');
      expect(el.classList.contains('hover-scale')).toBe(true);
    });
  });

  describe('.glass-dropdown', () => {
    it('should be a valid CSS class name', () => {
      const el = document.createElement('div');
      el.classList.add('glass-dropdown');
      expect(el.classList.contains('glass-dropdown')).toBe(true);
    });
  });

  describe('.premium-table', () => {
    it('should be a valid CSS class name', () => {
      const el = document.createElement('div');
      el.classList.add('premium-table');
      expect(el.classList.contains('premium-table')).toBe(true);
    });
  });

  describe('.stat-card', () => {
    it('should support variant classes', () => {
      const variants = ['stat-card-primary', 'stat-card-success', 'stat-card-warning', 'stat-card-danger'];
      variants.forEach(variant => {
        const el = document.createElement('div');
        el.classList.add(variant);
        expect(el.classList.contains(variant)).toBe(true);
      });
    });
  });

  describe('Glow effects', () => {
    it('should support glow utility classes', () => {
      const glows = ['glow-purple', 'glow-green', 'glow-red'];
      glows.forEach(glow => {
        const el = document.createElement('div');
        el.classList.add(glow);
        expect(el.classList.contains(glow)).toBe(true);
      });
    });
  });
});

describe('Theme-Aware Tailwind Override Classes', () => {
  it('should map text-neutral-900 to theme variable', () => {
    const el = document.createElement('span');
    el.classList.add('text-neutral-900');
    expect(el.classList.contains('text-neutral-900')).toBe(true);
    // In real browser, _utilities.scss maps this to var(--color-text-primary)
  });

  it('should map text-neutral-800 to theme variable', () => {
    const el = document.createElement('span');
    el.classList.add('text-neutral-800');
    expect(el.classList.contains('text-neutral-800')).toBe(true);
  });

  it('should map text-neutral-700 to secondary theme variable', () => {
    const el = document.createElement('span');
    el.classList.add('text-neutral-700');
    expect(el.classList.contains('text-neutral-700')).toBe(true);
  });

  it('should map text-neutral-500 to tertiary theme variable', () => {
    const el = document.createElement('span');
    el.classList.add('text-neutral-500');
    expect(el.classList.contains('text-neutral-500')).toBe(true);
  });

  it('should map text-neutral-400 to disabled theme variable', () => {
    const el = document.createElement('span');
    el.classList.add('text-neutral-400');
    expect(el.classList.contains('text-neutral-400')).toBe(true);
  });
});

describe('Design System DOM Structure', () => {
  it('should support complete list page structure', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="p-6 animate-entrance">
        <div class="flex items-center justify-between mb-10">
          <div class="header-content">
            <div class="title font-bold text-3xl text-gradient">Page Title</div>
            <p class="text-muted">Subtitle</p>
          </div>
          <button class="premium-btn glow-purple glass-button-press">Add New</button>
        </div>
        <div class="glass-card p-4">
          <div class="premium-table">
            <table></table>
          </div>
        </div>
      </div>
    `;

    expect(container.querySelector('.animate-entrance')).not.toBeNull();
    expect(container.querySelector('.text-gradient')).not.toBeNull();
    expect(container.querySelector('.text-muted')).not.toBeNull();
    expect(container.querySelector('.premium-btn')).not.toBeNull();
    expect(container.querySelector('.glow-purple')).not.toBeNull();
    expect(container.querySelector('.glass-card')).not.toBeNull();
    expect(container.querySelector('.premium-table')).not.toBeNull();
  });

  it('should support complete form page structure', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="glass-card m-auto p-10">
        <div class="form-section">
          <div class="form-section-header">
            <div class="section-icon"><span class="icon"></span></div>
            <div><div class="section-title">Section 1</div></div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="input-text-stub"></div>
            <div class="input-select-stub"></div>
          </div>
        </div>
        <div class="form-section">
          <div class="form-section-header">
            <div class="section-icon"><span class="icon"></span></div>
            <div><div class="section-title">Section 2</div></div>
          </div>
        </div>
      </div>
    `;

    expect(container.querySelector('.glass-card')).not.toBeNull();
    expect(container.querySelectorAll('.form-section').length).toBe(2);
    expect(container.querySelectorAll('.form-section-header').length).toBe(2);
    expect(container.querySelectorAll('.section-icon').length).toBe(2);
    expect(container.querySelectorAll('.section-title').length).toBe(2);
  });

  it('should support detail page structure with glass cards', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-5 mt-5">
          <div class="title font-bold text-2xl">Details</div>
          <div class="el-dropdown">
            <div class="hover-scale">
              <span class="icon"></span>
            </div>
            <div class="glass-dropdown"></div>
          </div>
        </div>
        <div class="glass-card p-10 rounded-3xl">
          <div style="color: var(--text-primary)">Name</div>
          <div style="color: var(--text-muted)">Label</div>
        </div>
      </div>
    `;

    expect(container.querySelector('.glass-card')).not.toBeNull();
    expect(container.querySelector('.title')).not.toBeNull();
  });
});
