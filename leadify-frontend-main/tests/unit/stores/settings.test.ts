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

// Storage data object - cleared by mutation to avoid closure reference issues
const storageData: Record<string, string> = {};

function clearStorageData() {
  for (const key of Object.keys(storageData)) {
    delete storageData[key];
  }
}

const localStorageMock = {
  getItem: vi.fn((key: string) => storageData[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { storageData[key] = value; }),
  removeItem: vi.fn((key: string) => { delete storageData[key]; }),
  clear: vi.fn(() => { clearStorageData(); }),
  get length() { return Object.keys(storageData).length; },
  key: vi.fn((index: number) => Object.keys(storageData)[index] ?? null)
};

describe('useSettingsStore', () => {
  let store: ReturnType<typeof useSettingsStore>;

  beforeEach(() => {
    clearStorageData();
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', localStorageMock);
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
      // Pre-populate storage before creating the store
      storageData['crm-settings'] = JSON.stringify({ language: 'ar', currency: 'SAR' });

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
