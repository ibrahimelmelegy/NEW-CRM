
import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactEditor from '../../../pages/sales/proposals/react-editor.vue';

// ----------------------------------------------------------------------------
// Mocks & Setup
// ----------------------------------------------------------------------------

// Mock `useCookie`
const mockToken = ref('fake-jwt-token');
vi.mock('#app', () => ({
    useCookie: () => mockToken
}));
// Note: In Nuxt context, usually auto-imported. 
// We will stub the globals or use a specific vitest helper if available.
// For now, attempting to mock the global return if possible or via stubbing the component setup context logic if difficult.
// A simpler approach for Nuxt Unit testing is to assume imports work or mock them via vi.mock if they are from libraries.
// Since `useCookie` is a Nuxt composable, we need to mock it.
// We will try mocking the import path if we knew it, but for standard vitest it's cleaner to use `global` or `vi.stubGlobal`.

// Stub Nuxt Auto-Imports
const mockPush = vi.fn();
const mockRouter = { push: mockPush };
const mockRoute = { query: {} };
const mockUseRoute = vi.fn(() => mockRoute);
const mockUseRouter = vi.fn(() => mockRouter);

vi.stubGlobal('useRoute', mockUseRoute);
vi.stubGlobal('useRouter', mockUseRouter);
vi.stubGlobal('useCookie', () => mockToken);
vi.stubGlobal('definePageMeta', vi.fn());

describe('ReactEditor Integration', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mockToken.value = 'fake-jwt-token';
    });

    function mountEditor(query = {}) {
        // Update mock implementation
        mockUseRoute.mockReturnValue({ query } as any);

        return mount(ReactEditor, {
            global: {
                stubs: {
                    'el-button': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
                    'el-icon': true,
                    'Loading': true,
                    // Stub other icons
                    ArrowLeft: true,
                    Refresh: true
                }
            }
        });
    }

    it('constructs correct URL for CREATE mode with token', async () => {
        const wrapper = mountEditor({}); // No ID
        await flushPromises();

        const iframe = wrapper.find('iframe');
        expect(iframe.exists()).toBe(true);

        // Check URL: Standard create URL + Token
        const src = iframe.attributes('src');
        expect(src).toContain('http://localhost:3001/create');
        expect(src).toContain('token=fake-jwt-token');
    });

    it('constructs correct URL for EDIT mode', async () => {
        const wrapper = mountEditor({ id: 'prop-123' });
        await flushPromises();

        const iframe = wrapper.find('iframe');
        expect(iframe.attributes('src')).toContain('http://localhost:3001/edit/prop-123');
    });

    it('handles PROPOSAL_SAVED message correctly', async () => {
        mountEditor();
        await flushPromises();

        // Simulate window message
        const event = new MessageEvent('message', {
            origin: 'http://localhost:3001',
            data: { action: 'PROPOSAL_SAVED', id: 'new-prop-1' }
        });
        window.dispatchEvent(event);

        expect(mockPush).toHaveBeenCalledWith('/sales/proposals/new-prop-1');
    });

    it('ignores messages from unknown origins (Security)', async () => {
        mountEditor();
        await flushPromises();

        // Simulate malicious message
        const event = new MessageEvent('message', {
            origin: 'http://evil.com',
            data: { action: 'PROPOSAL_SAVED' }
        });
        window.dispatchEvent(event);

        expect(mockPush).not.toHaveBeenCalled();
    });
});
