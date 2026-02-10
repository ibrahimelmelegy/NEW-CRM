/**
 * Vitest Setup File
 * ==================
 * Provides Vue and Nuxt auto-imports for tests
 */

import { vi } from 'vitest';
import { ref, computed, reactive, watch, watchEffect, toRefs, onMounted, onUnmounted, onBeforeUnmount, nextTick, h, defineComponent } from 'vue';

// Make Vue reactivity functions globally available
globalThis.ref = ref;
globalThis.computed = computed;
globalThis.reactive = reactive;
globalThis.watch = watch;
globalThis.watchEffect = watchEffect;
globalThis.toRefs = toRefs;
globalThis.onMounted = onMounted;
globalThis.onUnmounted = onUnmounted;
globalThis.onBeforeUnmount = onBeforeUnmount;
globalThis.nextTick = nextTick;
globalThis.h = h;
globalThis.defineComponent = defineComponent;

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
    params: { slug: 'test-123' },
    query: {}
});

globalThis.useRouter = () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    resolve: vi.fn().mockReturnValue({ name: 'test', path: '/test' })
});

globalThis.navigateTo = vi.fn();

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
globalThis.$fetch = vi.fn().mockResolvedValue({
    success: true,
    body: {},
    message: 'Success'
});

// Mock ElNotification
globalThis.ElNotification = vi.fn();
globalThis.ElMessage = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };

// Mock onErrorCaptured
globalThis.onErrorCaptured = vi.fn();
