import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import OpportunityPage from '~/pages/sales/opportunity/index.vue';

// Mock Vue Router
vi.mock('vue-router', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useRoute: () => ({ query: {} }),
}));

// Mock Permissions
vi.mock('~/composables/usePermissions', () => ({
    usePermissions: async () => ({
        hasPermission: () => true // Grant all permissions
    })
}));

// Mock useTableFilter (CRITICAL: Called at top-level await)
vi.mock('~/composables/useTableFilter', () => ({
    default: async () => ({
        formattedData: [{ id: 1, name: 'Test Opportunity', stage: 'NEW' }],
        pagination: { totalItems: 1, page: 1, limit: 10, totalPages: 1 },
        status: '200'
    })
}));

// Mock useApiFetch (Called for users list)
vi.mock('~/composables/useApiFetch', () => ({
    useApiFetch: vi.fn().mockImplementation(async (endpoint) => {
        if (endpoint === 'users') {
            return {
                body: {
                    docs: [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }]
                }
            };
        }
        return { body: {} };
    })
}));

// Mock other auto-imports if needed
const globalMocks = {
    getOpportunity: vi.fn(),
    updateOpportunity: vi.fn(),
    stageOptions: [{ label: 'New', value: 'NEW' }],
    priorityOptions: [{ label: 'High', value: 'HIGH' }],
};

// Mixin global mocks to global context if possible, or assume they are auto-imported
// In Vitest with Nuxt, auto-imports are tricky. We might need to map them in config or mock globally.
// For now, I'll rely on stubs for components and hope functions are imported or I'll see error.

describe('Opportunity Page', () => {
    it('mounts without crashing', async () => {
        const TestComponent = {
            components: { OpportunityPage },
            template: '<Suspense><OpportunityPage /></Suspense>'
        };

        const wrapper = mount(TestComponent, {
            global: {
                stubs: {
                    NuxtLink: { template: '<a><slot /></a>' },
                    'el-button': { template: '<button><slot /></button>' },
                    'el-dropdown': { template: '<div><slot /><slot name="dropdown"/></div>' },
                    'el-dropdown-menu': { template: '<div><slot /></div>' },
                    'el-dropdown-item': { template: '<div><slot /></div>' },
                    'AppTable': { template: '<div class="app-table-stub"><slot :data="{id:1}" /></div>' }, // Expose slot data
                    'ActionModel': true,
                    'InputSelect': true,
                    'Icon': true,
                    Plus: true
                },
                mocks: {
                    // Inject global variables usually available in Nuxt
                    ...globalMocks
                }
            }
        });

        // Wait for potential async setup
        await new Promise(resolve => setTimeout(resolve, 10)); // Short tick

        console.log('Opportunity Page Rendered:', wrapper.html());

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.title').text()).toBe('Opportunity');
        expect(wrapper.find('.app-table-stub').exists()).toBe(true);
    });
});
