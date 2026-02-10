/**
 * Login Page - UI Design System Compliance Tests
 * ================================================
 * Verifies the login page design:
 * - Uses var(--color-primary) for button (not hardcoded #0078D4)
 * - Has ProfessionalBackground component
 * - Theme-aware logo switching
 * - Form inputs and validation
 * - Glass card styling
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const loginPath = resolve(__dirname, '../../../pages/login.vue');
let content: string;

beforeAll(() => {
  content = readFileSync(loginPath, 'utf-8');
});

describe('Login Page - Design System Compliance', () => {
  describe('Theme Integration', () => {
    it('should reference ProfessionalBackground component', () => {
      expect(content).toContain('ProfessionalBackground');
    });

    it('should have theme-aware logo switching', () => {
      expect(content).toContain('themeStore.isLight');
    });

    it('should use both Logo.png and light-logo.png', () => {
      expect(content).toContain('Logo.png');
      expect(content).toContain('light-logo.png');
    });
  });

  describe('Form Structure', () => {
    it('should have email input field', () => {
      expect(content).toContain('name="email"');
    });

    it('should have password input field', () => {
      expect(content).toContain('name="password"');
    });

    it('should have submit button', () => {
      expect(content).toContain('native-type="submit"');
    });

    it('should have forgot password link', () => {
      expect(content).toContain('forget-password');
    });

    it('should have remember me checkbox', () => {
      expect(content).toContain('el-checkbox');
    });
  });

  describe('Styling', () => {
    it('should use var(--color-primary) for button background', () => {
      expect(content).toContain('var(--color-primary)');
    });

    it('should not have hardcoded bg-[#0078D4] as solid button background', () => {
      // bg-[#0078D4]/10 (decorative blur glow) is acceptable
      // bg-[#0078D4] as solid background on buttons is not
      const templateSection = content.split('<script')[0];
      // Match exact bg-[#0078D4] not followed by /
      const hasSolidBg = /bg-\[#0078D4\](?!\/)/.test(templateSection);
      expect(hasSolidBg).toBe(false);
    });

    it('should use glass-card-premium for form container', () => {
      expect(content).toContain('glass-card-premium');
    });

    it('should use theme CSS variables for text', () => {
      expect(content).toContain('theme-text-primary');
      expect(content).toContain('theme-text-muted');
    });

    it('should use var(--text-primary) in style section', () => {
      expect(content).toContain('var(--text-primary)');
    });
  });

  describe('Animations', () => {
    it('should have fade-in-left animation', () => {
      expect(content).toContain('animate-fade-in-left');
    });

    it('should have fade-in-right animation', () => {
      expect(content).toContain('animate-fade-in-right');
    });
  });

  describe('Accessibility', () => {
    it('should have aria labels on form', () => {
      expect(content).toContain('aria-label');
    });

    it('should have aria-required on inputs', () => {
      expect(content).toContain('aria-required');
    });
  });
});

describe('Notification Page - Design Compliance', () => {
  let notifContent: string;

  beforeAll(() => {
    const notificationPath = resolve(__dirname, '../../../pages/notification.vue');
    notifContent = readFileSync(notificationPath, 'utf-8');
  });

  it('should use var(--color-primary) for mark-all-read', () => {
    expect(notifContent).toContain('var(--color-primary)');
  });

  it('should use var(--color-status-error) for unread count', () => {
    expect(notifContent).toContain('var(--color-status-error');
  });

  it('should use var(--color-status-warning) for unread icons', () => {
    expect(notifContent).toContain('var(--color-status-warning');
  });

  it('should not use hardcoded #ff0000 or #6D42E8', () => {
    expect(notifContent).not.toContain('#ff0000');
    expect(notifContent).not.toContain('#6D42E8');
  });
});
