/**
 * Theme Initialization Plugin
 * Applies the saved theme classes IMMEDIATELY on client-side load
 * to prevent a flash of wrong theme on page refresh.
 *
 * This plugin:
 * 1. Reads the saved theme from localStorage (or detects system preference)
 * 2. Applies the correct classes to html and body BEFORE components mount
 * 3. Initializes the Pinia theme store on app:mounted
 * 4. Watches for system preference changes when no explicit preference is saved
 *
 * Styling is handled by:
 * - assets/css/dark-theme.css (html.dark overrides for Element Plus)
 * - assets/css/microsoft-light.css (html.light-mode glass theme)
 * - assets/scss/theme-variables.scss (Base theme variables)
 */

import { useThemeStore } from '@/stores/theme';

export default defineNuxtPlugin(nuxtApp => {
  if (!process.client) return;

  /**
   * Determine whether the user prefers light mode.
   * Priority: localStorage > system preference > default (dark)
   */
  const getIsLight = (): boolean => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'true') return true;
    if (saved === 'dark' || saved === 'false') return false;
    // No explicit preference saved - use system preference
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    return false; // Default to dark
  };

  /**
   * Apply theme classes to html and body elements.
   * Keeps both the legacy class names and the new html.dark class in sync.
   */
  const applyThemeClasses = (isLight: boolean) => {
    const root = document.documentElement;
    const body = document.body;

    if (isLight) {
      root.classList.add('light-mode');
      root.classList.remove('dark');
      body.classList.add('light-theme');
      body.classList.remove('dark');
    } else {
      root.classList.remove('light-mode');
      root.classList.add('dark');
      body.classList.remove('light-theme');
      body.classList.add('dark');
    }

    // Update meta theme-color for mobile browser chrome
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isLight ? '#f4f4f5' : '#0a0a0f');
    }
  };

  // Apply theme immediately (before any component mounts) to prevent flash
  applyThemeClasses(getIsLight());

  // Once the Vue app is mounted, initialize the full Pinia theme store
  // which handles accent colors, presets, glass settings, etc.
  nuxtApp.hook('app:mounted', () => {
    try {
      const themeStore = useThemeStore();
      themeStore.initializeTheme();
    } catch {
      // Store may not be available yet; classes are already applied above
    }
  });

  // Watch for system preference changes (only if the user has not set a manual preference)
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('theme');
      // Only react to system changes if the user hasn't explicitly chosen a theme
      if (!saved) {
        const isLight = !e.matches;
        applyThemeClasses(isLight);
        // Also update the Pinia store if it exists
        try {
          const themeStore = useThemeStore();
          themeStore.isLight = isLight;
          themeStore.applyCustomTheme();
        } catch {
          // Silently ignore if store is not yet available
        }
      }
    };

    // addEventListener is the modern API; addListener is deprecated but more compatible
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemChange);
    }
  }
});
