import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { server } from './mocks/server';
import { ref, reactive, computed, watch, onMounted, nextTick, resolveComponent } from 'vue';

// Use stubGlobal for better compatibility with Vitest environments
vi.stubGlobal('ref', ref);
vi.stubGlobal('reactive', reactive);
vi.stubGlobal('computed', computed);
vi.stubGlobal('watch', watch);
vi.stubGlobal('onMounted', onMounted);
vi.stubGlobal('nextTick', nextTick);
vi.stubGlobal('resolveComponent', resolveComponent);

// Shallow mock for compiler macros
vi.stubGlobal('defineProps', (props: any) => props);
vi.stubGlobal('defineEmits', () => vi.fn());
vi.stubGlobal('defineExpose', () => { });
vi.stubGlobal('defineModel', () => ref());
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: Function) => fn);

// App-specific global mocks (Composables)
vi.stubGlobal('useApiFetch', vi.fn(() => ({ body: { docs: [] } })));
vi.stubGlobal('getLeads', vi.fn(() => ({ leads: [] })));
vi.stubGlobal('getClients', vi.fn(() => ({ clients: [] })));
vi.stubGlobal('getLead', vi.fn());
vi.stubGlobal('usePermissions', vi.fn(() => ({ hasPermission: () => true, permissions: [] })));
vi.stubGlobal('createProject', vi.fn().mockResolvedValue({ success: true }));
vi.stubGlobal('project', ref({}));
vi.stubGlobal('projectCategories', [
    { label: 'Direct Project', value: 'Direct' },
    { label: 'Etimad Project', value: 'Etimad' }
]);
vi.stubGlobal('projectStatuses', [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Cancelled', value: 'CANCELLED' }
]);
vi.stubGlobal('proposalStatuses', []);
vi.stubGlobal('applicationStatuses', []);
vi.stubGlobal('contractTypes', []);

vi.mock('vee-validate', () => ({
    useForm: vi.fn(() => ({
        handleSubmit: vi.fn((fn) => fn),
        errors: {},
        values: {},
        resetForm: vi.fn(),
    })),
    useField: vi.fn(() => ({ value: ref(null), errorMessage: ref(null) })),
    ErrorMessage: { template: '<div></div>' },
    Field: { template: '<input />' },
    Form: { template: '<form><slot /></form>' },
}));

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Close MSW server after all tests
afterAll(() => server.close());

// Reset MSW handlers after each test
afterEach(() => server.resetHandlers());

// Global mocks for Nuxt/Vue
vi.mock('#app', () => ({
    useNuxtApp: () => ({
        $api: vi.fn(),
    }),
    useRuntimeConfig: () => ({
        public: {
            API_BASE_URL: 'http://localhost:3000',
        },
    }),
}));

// Setup mocks
vi.stubGlobal('navigateTo', vi.fn((path) => path));
vi.stubGlobal('ElNotification', vi.fn());
vi.stubGlobal('formatDate', vi.fn((date) => '2023-01-01'));
vi.stubGlobal('useRoute', vi.fn(() => ({ path: '/', query: {}, params: {} })));
vi.stubGlobal('useRouter', vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })));

// Global Nuxt Composables
vi.stubGlobal('useRuntimeConfig', () => ({
    public: { API_BASE_URL: 'http://localhost:3000' }
}));
vi.stubGlobal('useCookie', () => ref('mock-token'));
vi.stubGlobal('createError', (err: any) => ({
    ...err,
    statusCode: err.statusCode || 500,
    message: err.message || 'Error',
    toString() { return this.message; }
}));
vi.stubGlobal('$fetch', vi.fn(() => Promise.resolve({ success: true, data: {}, body: { docs: [] } })));
