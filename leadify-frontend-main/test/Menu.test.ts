import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import Menu from '~/components/global/Menu.vue';

// Mock Nuxt/Router composables and stores
vi.mock('vue-router', () => ({
    useRoute: () => ({ fullPath: '/' }),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock Pinia
vi.mock('pinia', () => ({
    storeToRefs: (val: any) => val,
}));

// Mock Pinia store
vi.mock('~/stores/common', () => ({
    useMain: () => ({
        fullNav: ref(true),
        mobile: ref(false),
        hideNav: ref(false),
        permissions: ref(['CREATE_OPPORTUNITIES'])
    })
}));

// Mock useApiFetch
vi.mock('~/composables/useApiFetch', () => ({
    useApiFetch: vi.fn().mockResolvedValue({ user: { id: 1, name: 'Test User' } })
}));

describe('Sidebar Menu', () => {
    it('navigates to Opportunities without full reload', async () => {
        const routerPush = vi.fn();

        // Override useRouter mock for this test
        vi.mocked(useRouter).mockReturnValue({
            push: routerPush,
        } as any);

        // Wrap in Suspense because Menu uses async setup
        const TestComponent = {
            components: { Menu },
            template: '<Suspense><Menu /></Suspense>'
        };

        const wrapper = mount(TestComponent, {
            global: {
                mocks: {
                    $router: { push: routerPush }
                },
                stubs: {
                    // Update stub to render href for easy finding
                    NuxtLink: {
                        props: ['to'],
                        template: '<a :href="to" class="nuxt-link-stub" @click.prevent="$router.push(to)"><slot /></a>'
                    },
                    'el-menu': { template: '<div><slot /></div>' },
                    'el-sub-menu': { template: '<div><slot name="title" /><slot /></div>' }, // Render slots to expose children
                    'el-menu-item': { template: '<div><slot /></div>' },
                    'el-menu-items': { template: '<div><slot /></div>' },
                    'el-icon': true,
                    'Icon': true,
                    'transition': { template: '<div><slot /></div>' }
                }
            }
        });

        // Wait for async setup
        await new Promise(resolve => setTimeout(resolve, 10));

        // DEBUG: Output HTML to see what is rendered (write to file to avoid console truncation)
        const fs = await import('fs');
        fs.writeFileSync('d:/SAUD - HPT CRM/leadify-frontend-main/test/debug_html.html', wrapper.html());

        // Find the specific link in the DOM
        console.log('Searching for Opportunity link in DOM...');
        const links = wrapper.findAll('.nuxt-link-stub');
        const opportunityLink = links.find(l => l.attributes('href') === '/sales/opportunity');

        expect(opportunityLink).toBeDefined();

        // Simulate click
        if (opportunityLink) {
            await opportunityLink.trigger('click');
            // Verify router push was called with correct path
            expect(routerPush).toHaveBeenCalledWith('/sales/opportunity');
        }
    });
});
