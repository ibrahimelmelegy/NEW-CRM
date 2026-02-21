/**
 * Vitest Setup File
 * ==================
 * Provides Vue and Nuxt auto-imports for tests
 */

import { vi } from 'vitest';
import { ref, computed, reactive, watch, watchEffect, toRefs, onMounted, onUnmounted, h } from 'vue';

// Make Vue reactivity functions globally available
globalThis.ref = ref;
globalThis.computed = computed;
globalThis.reactive = reactive;
globalThis.watch = watch;
globalThis.watchEffect = watchEffect;
globalThis.toRefs = toRefs;
globalThis.onMounted = onMounted;
globalThis.onUnmounted = onUnmounted;
globalThis.h = h;

// Mock Nuxt composables
globalThis.useRuntimeConfig = () => ({
  public: {
    API_BASE_URL: 'http://localhost:3001/api/v1/'
  }
});

globalThis.useCookie = (name: string) => ({
  value: name === 'access_token' ? 'mock-token' : null
});

globalThis.useRoute = () => ({
  fullPath: '/test',
  path: '/test',
  params: {},
  query: {}
});

globalThis.useRouter = () => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn()
});

globalThis.navigateTo = vi.fn();

// Mock $fetch
globalThis.$fetch = vi.fn().mockResolvedValue({
  success: true,
  body: {},
  message: 'Success'
});

// Mock ElNotification
globalThis.ElNotification = vi.fn();
