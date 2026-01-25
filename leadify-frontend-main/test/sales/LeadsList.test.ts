
import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LeadsIndex from '../../pages/sales/leads/index.vue';
import { createRouter, createWebHistory } from 'vue-router';

// ----------------------------------------------------------------------------
// Setup & Mocks
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Setup & Mocks
// ----------------------------------------------------------------------------

const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div>Home</div>' } }]
});

// Hoisted Mocks
const { hasPermissionMock, mockTableData } = vi.hoisted(() => ({
    hasPermissionMock: vi.fn(),
    mockTableData: {
        formattedData: [] as any[],
        pagination: { page: 1, limit: 10, total: 0 }
    }
}));

vi.mock('@/composables/usePermissions', () => ({
    usePermissions: () => ({
        hasPermission: hasPermissionMock
    })
}));

vi.mock('@/composables/useTableFilter', () => ({
    default: () => ({
        formattedData: mockTableData.formattedData,
        pagination: mockTableData.pagination
    })
}));

vi.mock('@/composables/useApiFetch', () => ({
    useApiFetch: () => ({
        body: { docs: [] }
    })
}));

vi.mock('@element-plus/icons-vue', () => ({
    Plus: 'PlusIcon',
    Search: 'SearchIcon'
}));

// Component Stubs
const AppTableStub = {
    name: 'AppTable',
    template: '<div data-test="app-table">{{ data?.length ? "Has Data" : "No Leads Found" }}</div>',
    props: ['data', 'columns']
};

describe('Leads List Page (Production Ready)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Default State: With Permission, With Data
        hasPermissionMock.mockReturnValue(true);

        // Reset mutable data
        mockTableData.formattedData.length = 0;
        mockTableData.formattedData.push(
            { id: 1, leadDetails: 'Lead A', status: 'NEW' },
            { id: 2, leadDetails: 'Lead B', status: 'CONTACTED' }
        );
        mockTableData.pagination.total = 2;
    });

    function mountPage() {
        return mount({
            template: '<Suspense><LeadsIndex /></Suspense>',
            components: { LeadsIndex }
        }, {
            global: {
                plugins: [router],
                stubs: {
                    AppTable: AppTableStub,
                    // Element Plus Stubs
                    'el-button': { template: '<button><slot /></button>' },
                    'el-dropdown': { template: '<div><slot name="dropdown" /><slot /></div>' },
                    'el-dropdown-menu': { template: '<div><slot /></div>' },
                    'el-dropdown-item': { template: '<div><slot /></div>' },
                    'el-spinner': true,
                    'ActionModel': true,
                    'InputSelect': true,
                    'NuxtLink': { template: '<a><slot /></a>' },
                    'Icon': true,
                }
            }
        });
    }

    // 1. Data Rendering
    it('renders the table with correct leads data', async () => {
        const wrapper = mountPage();
        await flushPromises();

        const table = wrapper.findComponent(AppTableStub);

        // Assert Table Exists
        expect(table.exists()).toBe(true);

        // Assert Props received by AppTable
        expect(table.props('data')).toHaveLength(2);
        expect(table.props('data')[0].leadDetails).toBe('Lead A');

        // Assert "Has Data" text from our smart stub
        expect(wrapper.text()).toContain('Has Data');
    });

    // 2. RBAC Check (Add Lead Button)
    it('shows "New Lead" button for Admin (Permission Granted)', async () => {
        hasPermissionMock.mockReturnValue(true);
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.text()).toContain('New Lead');
    });

    it('hides "New Lead" button for Restricted User (Permission Denied)', async () => {
        hasPermissionMock.mockReturnValue(false);
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.text()).not.toContain('New Lead');
    });

    // 3. Empty State
    it('displays "No Leads Found" state when API returns empty list', async () => {
        // Arrange: Empty Data
        mockTableData.formattedData.length = 0;
        mockTableData.pagination.total = 0;

        const wrapper = mountPage();
        await flushPromises();

        const table = wrapper.findComponent(AppTableStub);

        // Assert empty prop passed
        expect(table.props('data')).toEqual([]);

        // Assert our Stub renders the empty message (mimicking AppTable behavior)
        expect(wrapper.text()).toContain('No Leads Found');
    });
});
