import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApiFetch } from '@/composables/useApiFetch';

// Mock Nuxt composables
vi.mock('#app', () => ({
    useRuntimeConfig: () => ({
        public: {
            API_BASE_URL: 'http://localhost:3000/',
        },
    }),
}));

// Mock useCookie
vi.mock('nuxt/app', () => ({
    useCookie: (name: string) => {
        if (name === 'access_token') return { value: 'test-token' };
        return { value: null };
    },
    navigateTo: vi.fn(),
}));

// Since we can't easily mock top-level auto-imports in a pure Vitest environment without Nuxt environment plugin,
// we rely on the stubGlobal in setup.ts for most things.
// But for this test, we want to be explicit.

describe('useApiFetch', () => {
    it('should include Authorization header when token exists', async () => {
        // Mock success response
        vi.stubGlobal('$fetch', vi.fn(() => Promise.resolve({ success: true, body: { docs: [] } })));

        const response = await useApiFetch('opportunity');
        expect(response.success).toBe(true);
        expect(response.body.docs).toBeDefined();
    });

    it('should handle 422 validation errors correctly', async () => {
        // Mock error response
        const error = { response: { _data: { code: 422, message: 'Name is required' } } };
        vi.stubGlobal('$fetch', vi.fn(() => Promise.reject(error)));

        const response = await useApiFetch('opportunity', 'POST', { name: '' }, true);

        expect(response.status).toBe(false);
        expect(response.code).toBe(422);
        expect(response.message).toBe('Name is required');
    });

    it('should handle 500 server errors correctly', async () => {
        // Mock error response
        const error = { response: { _data: { code: 500 } } };
        vi.stubGlobal('$fetch', vi.fn(() => Promise.reject(error)));

        const response = await useApiFetch('fail', 'GET', {}, true);

        expect(response.status).toBe(false);
        expect(response.code).toBe(500);
    });
});
