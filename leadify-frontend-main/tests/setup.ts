/**
 * Vitest Setup File
 * ==================
 * Provides Vue and Nuxt auto-imports for tests
 */

import { vi } from 'vitest';
import { ref, computed, reactive, watch, watchEffect, toRefs, onMounted, onUnmounted, onBeforeUnmount, nextTick, h, defineComponent } from 'vue';

const _global = globalThis as any;

// Make Vue reactivity functions globally available
_global.ref = ref;
_global.computed = computed;
_global.reactive = reactive;
_global.watch = watch;
_global.watchEffect = watchEffect;
_global.toRefs = toRefs;
_global.onMounted = onMounted;
_global.onUnmounted = onUnmounted;
_global.onBeforeUnmount = onBeforeUnmount;
_global.nextTick = nextTick;
_global.h = h;
_global.defineComponent = defineComponent;

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
  params: { slug: 'test-123' },
  query: {}
});

_global.useRouter = () => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  resolve: vi.fn().mockReturnValue({ name: 'test', path: '/test' })
});

_global.navigateTo = vi.fn();

// Mock definePageMeta (Nuxt macro)
globalThis.definePageMeta = vi.fn();

// Mock useI18n
globalThis.useI18n = () => ({
    t: (key: string) => key,
    locale: ref('en'),
    locales: ref(['en', 'ar']),
    setLocale: vi.fn()
});

// Mock useAsyncData
globalThis.useAsyncData = vi.fn().mockImplementation((_key: string, fn: Function) => {
    return Promise.resolve({ data: ref(null), pending: ref(false), error: ref(null) });
});

// Mock useApiFetch
globalThis.useApiFetch = vi.fn().mockResolvedValue({
    success: true,
    body: {},
    message: 'Success'
});

// Mock useTableFilter
globalThis.useTableFilter = vi.fn().mockResolvedValue({
    formattedData: [],
    pagination: { totalPages: 1, totalItems: 0 },
    unreadNotificationsCount: 0
});

// Mock usePermissions
globalThis.usePermissions = vi.fn().mockResolvedValue({
    hasPermission: vi.fn().mockReturnValue(true)
});

// Mock useSpotlight
globalThis.useSpotlight = vi.fn().mockReturnValue({
    isOpen: ref(false),
    open: vi.fn(),
    close: vi.fn()
});

// Mock Nuxt data fetching composables
globalThis.useFetch = vi.fn().mockResolvedValue({ data: ref(null), pending: ref(false) });
globalThis.useLazyFetch = vi.fn().mockResolvedValue({ data: ref(null), pending: ref(false) });

// Mock process.client / process.dev
globalThis.process = { ...globalThis.process, client: true, dev: true };

// Mock $fetch
_global.$fetch = vi.fn().mockResolvedValue({
  success: true,
  body: {},
  message: 'Success'
});

// Mock ElNotification
_global.ElNotification = vi.fn();
_global.ElMessage = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };

// Mock onErrorCaptured
_global.onErrorCaptured = vi.fn();
