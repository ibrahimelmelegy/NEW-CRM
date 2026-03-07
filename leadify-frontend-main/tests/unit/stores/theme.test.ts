/**
 * useThemeStore - Unit Tests
 * ===========================
 * Tests for stores/theme.ts Pinia store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useThemeStore, THEME_PRESETS } from '@/stores/theme';

// Mock useApiFetch globally (kept for consistency with other store tests)
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
  setItem: vi.fn((key: string, value: string) => {
    storageData[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete storageData[key];
  }),
  clear: vi.fn(() => {
    clearStorageData();
  }),
  get length() {
    return Object.keys(storageData).length;
  },
  key: vi.fn((index: number) => Object.keys(storageData)[index] ?? null)
};

describe('useThemeStore', () => {
  let store: ReturnType<typeof useThemeStore>;

  beforeEach(() => {
    clearStorageData();
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', localStorageMock);
    setActivePinia(createPinia());
    store = useThemeStore();
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.isLight).toBe(false);
      expect(store.isDark).toBe(true);
      expect(store.activePresetId).toBe('default-purple');
      expect(store.accentColor).toBe('#7849ff');
      expect(store.glassBlur).toBe(12);
      expect(store.glassOpacity).toBe(0.08);
      expect(store.fontSize).toBe(14);
    });

    it('isDark should be the inverse of isLight', () => {
      expect(store.isLight).toBe(false);
      expect(store.isDark).toBe(true);
    });

    it('activePreset should return the default-purple preset', () => {
      const preset = store.activePreset;
      expect(preset!.id).toBe('default-purple');
      expect(preset!.name).toBe('Default Purple');
      expect(preset!.accentColor).toBe('#7849ff');
    });
  });

  // ============================================
  // THEME_PRESETS
  // ============================================
  describe('THEME_PRESETS', () => {
    it('should have 10 presets', () => {
      expect(THEME_PRESETS).toHaveLength(10);
    });

    it('each preset should have required fields', () => {
      THEME_PRESETS.forEach(preset => {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('accentColor');
        expect(preset).toHaveProperty('accentLight');
        expect(preset).toHaveProperty('gradientStart');
        expect(preset).toHaveProperty('gradientEnd');
      });
    });

    it('first preset should be default-purple', () => {
      expect(THEME_PRESETS[0]!.id).toBe('default-purple');
    });
  });

  // ============================================
  // Toggle Theme
  // ============================================
  describe('toggleTheme', () => {
    it('should toggle from dark to light', () => {
      expect(store.isLight).toBe(false);

      store.toggleTheme();

      expect(store.isLight).toBe(true);
      expect(store.isDark).toBe(false);
    });

    it('should toggle from light back to dark', () => {
      store.toggleTheme(); // dark -> light
      store.toggleTheme(); // light -> dark

      expect(store.isLight).toBe(false);
      expect(store.isDark).toBe(true);
    });

    it('should persist theme to localStorage', () => {
      store.toggleTheme();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should persist dark theme when toggled back', () => {
      store.toggleTheme(); // -> light
      vi.clearAllMocks();
      store.toggleTheme(); // -> dark

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  // ============================================
  // Apply Preset
  // ============================================
  describe('applyPreset', () => {
    it('should apply ocean-blue preset', () => {
      store.applyPreset('ocean-blue');

      expect(store.activePresetId).toBe('ocean-blue');
      expect(store.accentColor).toBe('#2563eb');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-preset', 'ocean-blue');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-accent', '#2563eb');
    });

    it('should not change anything for invalid preset id', () => {
      const originalPresetId = store.activePresetId;
      const originalAccent = store.accentColor;

      store.applyPreset('nonexistent-preset');

      expect(store.activePresetId).toBe(originalPresetId);
      expect(store.accentColor).toBe(originalAccent);
    });

    it('should update activePreset computed property', () => {
      store.applyPreset('sunset-orange');

      expect(store.activePreset!.id).toBe('sunset-orange');
      expect(store.activePreset!.name).toBe('Sunset Orange');
    });
  });

  // ============================================
  // Set Actions
  // ============================================
  describe('setGlassBlur', () => {
    it('should update glassBlur value', () => {
      store.setGlassBlur(20);

      expect(store.glassBlur).toBe(20);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-glass-blur', '20');
    });
  });

  describe('setGlassOpacity', () => {
    it('should update glassOpacity value', () => {
      store.setGlassOpacity(0.5);

      expect(store.glassOpacity).toBe(0.5);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-glass-opacity', '0.5');
    });
  });

  describe('setFontSize', () => {
    it('should update fontSize value', () => {
      store.setFontSize(18);

      expect(store.fontSize).toBe(18);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-font-size', '18');
    });
  });

  describe('setAccentColor', () => {
    it('should update accentColor value', () => {
      store.setAccentColor('#ff5733');

      expect(store.accentColor).toBe('#ff5733');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-accent', '#ff5733');
    });
  });

  // ============================================
  // Initialize Theme
  // ============================================
  describe('initializeTheme', () => {
    it('should load light theme from localStorage', () => {
      storageData.theme = 'light';

      store.initializeTheme();

      expect(store.isLight).toBe(true);
    });

    it('should load dark theme from localStorage', () => {
      storageData.theme = 'dark';

      store.initializeTheme();

      expect(store.isLight).toBe(false);
    });

    it('should load saved preset from localStorage', () => {
      storageData['theme-preset'] = 'ocean-blue';

      store.initializeTheme();

      expect(store.activePresetId).toBe('ocean-blue');
    });

    it('should load saved accent color from localStorage', () => {
      storageData['theme-accent'] = '#ff0000';

      store.initializeTheme();

      expect(store.accentColor).toBe('#ff0000');
    });

    it('should load saved glass blur from localStorage', () => {
      storageData['theme-glass-blur'] = '24';

      store.initializeTheme();

      expect(store.glassBlur).toBe(24);
    });

    it('should load saved glass opacity from localStorage', () => {
      storageData['theme-glass-opacity'] = '0.15';

      store.initializeTheme();

      expect(store.glassOpacity).toBe(0.15);
    });

    it('should load saved font size from localStorage', () => {
      storageData['theme-font-size'] = '16';

      store.initializeTheme();

      expect(store.fontSize).toBe(16);
    });

    it('should default to dark when no saved theme and system prefers dark', () => {
      // No localStorage value; mock matchMedia to report dark preference
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any;

      store.initializeTheme();

      expect(store.isLight).toBe(false);
      window.matchMedia = originalMatchMedia;
    });

    it('should detect light theme from system preference', () => {
      // No localStorage value; mock matchMedia to report light preference
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any;

      store.initializeTheme();

      expect(store.isLight).toBe(true);
      window.matchMedia = originalMatchMedia;
    });
  });
});
