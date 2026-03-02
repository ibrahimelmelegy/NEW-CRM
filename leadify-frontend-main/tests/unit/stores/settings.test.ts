/**
 * useSettingsStore - Unit Tests
 * ===============================
 * Tests for stores/settings.ts Pinia store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSettingsStore } from '@/stores/settings';

// Mock useApiFetch globally (even though settings store does not use it, kept for consistency)
globalThis.useApiFetch = vi.fn();

// Mock useI18n
globalThis.useI18n = () => ({ t: (key: string) => key, locale: ref('en') });

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('useSettingsStore', () => {
  let store: ReturnType<typeof useSettingsStore>;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    setActivePinia(createPinia());
    store = useSettingsStore();
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.language).toBe('en');
      expect(store.sidebarCollapsed).toBe(false);
      expect(store.dateFormat).toBe('YYYY-MM-DD');
      expect(store.currency).toBe('USD');
      // timezone defaults to system timezone
      expect(typeof store.timezone).toBe('string');
      expect(store.timezone.length).toBeGreaterThan(0);
    });

    it('should load persisted settings from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ language: 'ar', currency: 'SAR' })
      );

      // Re-create pinia and store to pick up localStorage values
      setActivePinia(createPinia());
      const freshStore = useSettingsStore();

      expect(freshStore.language).toBe('ar');
      expect(freshStore.currency).toBe('SAR');
    });
  });

  // ============================================
  // Actions
  // ============================================
  describe('setLanguage', () => {
    it('should set the language and persist', () => {
      store.setLanguage('ar');

      expect(store.language).toBe('ar');
      expect(localStorageMock.setItem).toHaveBeenCalled();

      const persisted = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(persisted.language).toBe('ar');
    });

    it('should switch back to English', () => {
      store.setLanguage('ar');
      store.setLanguage('en');

      expect(store.language).toBe('en');
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebarCollapsed from false to true', () => {
      expect(store.sidebarCollapsed).toBe(false);

      store.toggleSidebar();

      expect(store.sidebarCollapsed).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should toggle sidebarCollapsed from true to false', () => {
      store.toggleSidebar(); // false -> true
      store.toggleSidebar(); // true -> false

      expect(store.sidebarCollapsed).toBe(false);
    });
  });

  describe('updateSettings', () => {
    it('should update multiple settings at once', () => {
      store.updateSettings({
        language: 'ar',
        currency: 'SAR',
        dateFormat: 'DD/MM/YYYY'
      });

      expect(store.language).toBe('ar');
      expect(store.currency).toBe('SAR');
      expect(store.dateFormat).toBe('DD/MM/YYYY');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should only update provided fields', () => {
      const originalTimezone = store.timezone;

      store.updateSettings({ currency: 'EUR' });

      expect(store.currency).toBe('EUR');
      expect(store.language).toBe('en'); // unchanged
      expect(store.timezone).toBe(originalTimezone); // unchanged
    });

    it('should update sidebarCollapsed through updateSettings', () => {
      store.updateSettings({ sidebarCollapsed: true });

      expect(store.sidebarCollapsed).toBe(true);
    });

    it('should persist after updateSettings', () => {
      store.updateSettings({ timezone: 'Asia/Riyadh' });

      expect(localStorageMock.setItem).toHaveBeenCalled();

      const persistedCall = localStorageMock.setItem.mock.calls[
        localStorageMock.setItem.mock.calls.length - 1
      ];
      const persisted = JSON.parse(persistedCall[1]);
      expect(persisted.timezone).toBe('Asia/Riyadh');
    });
  });
});
