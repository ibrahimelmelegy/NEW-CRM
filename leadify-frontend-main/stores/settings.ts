import { defineStore } from 'pinia';

type SupportedLanguage = 'en' | 'ar';

interface SettingsState {
  language: SupportedLanguage;
  sidebarCollapsed: boolean;
  timezone: string;
  dateFormat: string;
  currency: string;
}

const STORAGE_KEY = 'crm-settings';

function loadPersistedSettings(): Partial<SettingsState> {
  if (import.meta.server) return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parsing errors
  }
  return {};
}

function persistSettings(state: SettingsState): void {
  if (import.meta.server) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => {
    const defaults: SettingsState = {
      language: 'en',
      sidebarCollapsed: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      dateFormat: 'YYYY-MM-DD',
      currency: 'USD'
    };

    const persisted = loadPersistedSettings();
    return { ...defaults, ...persisted };
  },

  actions: {
    setLanguage(lang: SupportedLanguage) {
      this.language = lang;
      persistSettings(this.$state);
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      persistSettings(this.$state);
    },

    updateSettings(settings: Partial<SettingsState>) {
      if (settings.language !== undefined) this.language = settings.language;
      if (settings.sidebarCollapsed !== undefined) this.sidebarCollapsed = settings.sidebarCollapsed;
      if (settings.timezone !== undefined) this.timezone = settings.timezone;
      if (settings.dateFormat !== undefined) this.dateFormat = settings.dateFormat;
      if (settings.currency !== undefined) this.currency = settings.currency;
      persistSettings(this.$state);
    }
  }
});
