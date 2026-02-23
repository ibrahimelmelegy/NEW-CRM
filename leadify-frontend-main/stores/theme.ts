import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface ThemePreset {
  id: string;
  name: string;
  accentColor: string;
  accentLight: string;
  gradientStart: string;
  gradientEnd: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'default-purple', name: 'Default Purple', accentColor: '#7849ff', accentLight: '#a78bfa', gradientStart: '#7849ff', gradientEnd: '#a855f7' },
  { id: 'ocean-blue', name: 'Ocean Blue', accentColor: '#2563eb', accentLight: '#60a5fa', gradientStart: '#2563eb', gradientEnd: '#06b6d4' },
  { id: 'sunset-orange', name: 'Sunset Orange', accentColor: '#ea580c', accentLight: '#fb923c', gradientStart: '#ea580c', gradientEnd: '#f59e0b' },
  { id: 'forest-green', name: 'Forest Green', accentColor: '#16a34a', accentLight: '#4ade80', gradientStart: '#16a34a', gradientEnd: '#14b8a6' },
  { id: 'rose-pink', name: 'Rose Pink', accentColor: '#e11d48', accentLight: '#fb7185', gradientStart: '#e11d48', gradientEnd: '#ec4899' },
  { id: 'neon-cyan', name: 'Neon Cyan', accentColor: '#06b6d4', accentLight: '#67e8f9', gradientStart: '#06b6d4', gradientEnd: '#8b5cf6' },
  { id: 'midnight-gold', name: 'Midnight Gold', accentColor: '#d97706', accentLight: '#fbbf24', gradientStart: '#d97706', gradientEnd: '#b45309' },
  { id: 'arctic-silver', name: 'Arctic Silver', accentColor: '#6366f1', accentLight: '#a5b4fc', gradientStart: '#6366f1', gradientEnd: '#94a3b8' },
  { id: 'volcanic-red', name: 'Volcanic Red', accentColor: '#dc2626', accentLight: '#f87171', gradientStart: '#dc2626', gradientEnd: '#9333ea' },
  { id: 'lavender-dream', name: 'Lavender Dream', accentColor: '#8b5cf6', accentLight: '#c4b5fd', gradientStart: '#8b5cf6', gradientEnd: '#ec4899' }
];

export const useThemeStore = defineStore('theme', () => {
  const isLight = ref(false);
  const activePresetId = ref('default-purple');
  const accentColor = ref('#7849ff');
  const glassBlur = ref(12);
  const glassOpacity = ref(0.08);
  const fontSize = ref(14);

  const activePreset = computed(() => THEME_PRESETS.find(p => p.id === activePresetId.value) || THEME_PRESETS[0]);

  const initializeTheme = () => {
    const saved = localStorage.getItem('theme');
    isLight.value = saved === 'light' || saved === 'true';

    const savedPreset = localStorage.getItem('theme-preset');
    if (savedPreset) activePresetId.value = savedPreset;

    const savedAccent = localStorage.getItem('theme-accent');
    if (savedAccent) accentColor.value = savedAccent;

    const savedBlur = localStorage.getItem('theme-glass-blur');
    if (savedBlur) glassBlur.value = parseInt(savedBlur, 10);

    const savedOpacity = localStorage.getItem('theme-glass-opacity');
    if (savedOpacity) glassOpacity.value = parseFloat(savedOpacity);

    const savedFontSize = localStorage.getItem('theme-font-size');
    if (savedFontSize) fontSize.value = parseInt(savedFontSize, 10);

    applyTheme();
    applyCustomTheme();
  };

  const toggleTheme = () => {
    isLight.value = !isLight.value;
    localStorage.setItem('theme', isLight.value ? 'light' : 'dark');
    applyTheme();
  };

  const applyTheme = () => {
    if (isLight.value) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    activePresetId.value = presetId;
    accentColor.value = preset.accentColor;
    localStorage.setItem('theme-preset', presetId);
    localStorage.setItem('theme-accent', preset.accentColor);
    applyCustomTheme();
  };

  const applyCustomTheme = () => {
    const root = document.documentElement;
    const preset = activePreset.value;

    root.style.setProperty('--accent-color', accentColor.value);
    root.style.setProperty('--accent-light', preset!.accentLight);
    root.style.setProperty('--gradient-start', preset!.gradientStart);
    root.style.setProperty('--gradient-end', preset!.gradientEnd);
    root.style.setProperty('--glass-blur', `blur(${glassBlur.value}px)`);
    root.style.setProperty('--glass-opacity', `${glassOpacity.value}`);
    root.style.setProperty('--base-font-size', `${fontSize.value}px`);

    // Glass background with dynamic opacity
    const glassBg = isLight.value ? `rgba(255, 255, 255, ${glassOpacity.value})` : `rgba(255, 255, 255, ${glassOpacity.value})`;
    root.style.setProperty('--glass-bg-primary', glassBg);
  };

  const setGlassBlur = (value: number) => {
    glassBlur.value = value;
    localStorage.setItem('theme-glass-blur', String(value));
    applyCustomTheme();
  };

  const setGlassOpacity = (value: number) => {
    glassOpacity.value = value;
    localStorage.setItem('theme-glass-opacity', String(value));
    applyCustomTheme();
  };

  const setFontSize = (value: number) => {
    fontSize.value = value;
    localStorage.setItem('theme-font-size', String(value));
    applyCustomTheme();
  };

  const setAccentColor = (color: string) => {
    accentColor.value = color;
    localStorage.setItem('theme-accent', color);
    applyCustomTheme();
  };

  return {
    isLight,
    activePresetId,
    accentColor,
    glassBlur,
    glassOpacity,
    fontSize,
    activePreset,
    initializeTheme,
    toggleTheme,
    applyTheme,
    applyPreset,
    applyCustomTheme,
    setGlassBlur,
    setGlassOpacity,
    setFontSize,
    setAccentColor
  };
});
