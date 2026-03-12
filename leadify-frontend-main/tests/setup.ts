/**
 * Vitest Setup File
 * ==================
 * Provides Vue and Nuxt auto-imports for tests
 */

import { vi } from 'vitest';
import { ref, computed, reactive, watch, watchEffect, toRefs, onMounted, onUnmounted, h } from 'vue';

const _global = globalThis as unknown;

// Make Vue reactivity functions globally available
_global.ref = ref;
_global.computed = computed;
_global.reactive = reactive;
_global.watch = watch;
_global.watchEffect = watchEffect;
_global.toRefs = toRefs;
_global.onMounted = onMounted;
_global.onUnmounted = onUnmounted;
_global.h = h;

// Mock Nuxt composables
_global.useRuntimeConfig = () => ({
  public: {
    API_BASE_URL: 'http://localhost:3001/api/v1/'
  }
});

_global.useCookie = (name: string) => ({
  value: name === 'access_token' ? 'mock-token' : null
});

_global.useRoute = () => ({
  fullPath: '/test',
  path: '/test',
  params: {},
  query: {}
});

_global.useRouter = () => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn()
});

_global.navigateTo = vi.fn();

// Mock useI18n and useNuxtApp
const mockT = (key: string) => key;
_global.useI18n = () => ({ t: mockT, locale: ref('en'), setLocale: vi.fn() });
_global.useNuxtApp = () => ({
  $i18n: { t: mockT, locale: ref('en'), setLocale: vi.fn() }
});

// Mock $fetch
_global.$fetch = vi.fn().mockResolvedValue({
  success: true,
  body: {},
  message: 'Success'
});

// Mock ElNotification
_global.ElNotification = vi.fn();
