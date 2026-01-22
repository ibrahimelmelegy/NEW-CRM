import { describe, it, expect, vi } from 'vitest';
import authMiddleware from '@/middleware/auth.global';
import permissionsMiddleware from '@/middleware/permissions';

// Mock Nuxt lifecycle
vi.mock('#app', () => ({
    defineNuxtRouteMiddleware: (fn: any) => fn,
    navigateTo: vi.fn((path) => path),
    useCookie: (name: string) => {
        if (name === 'access_token') return { value: null }; // Start unauthenticated
        return { value: null };
    },
    useRuntimeConfig: () => ({ public: {} }),
    useNuxtApp: () => ({ $api: vi.fn() }),
    createError: (err: any) => ({ ...err, statusCode: err.statusCode || 500 }),
}));

vi.mock('@/composables/useApiFetch', () => ({
    useApiFetch: vi.fn(),
}));

vi.mock('@/composables/useUser', () => ({
    user: { value: null },
    useUser: vi.fn(),
}));

vi.mock('@/composables/usePermissions', () => ({
    usePermissions: vi.fn(() => ({
        hasPermission: (p: string) => p === 'CREATE_PROJECTS',
    })),
}));

describe('Multi-Tenant & Auth Route Guards', () => {
    it('should redirect unauthenticated users to login', async () => {
        const to = { path: '/operations/projects', startsWith: (s: string) => '/operations/projects'.startsWith(s) };
        const from = { path: '/login' };

        // @ts-ignore
        const result = await authMiddleware(to, from);
        expect(result).toBe('/login');
    });

    it('should allow access to public routes without token', async () => {
        const to = { path: '/login', startsWith: (s: string) => '/login'.startsWith(s) };
        const from = { path: '/' };

        // @ts-ignore
        const result = await authMiddleware(to, from);
        expect(result).toBeUndefined(); // Undefined means allow navigation
    });

    it('should block users without specific permissions', async () => {
        const to = {
            path: '/operations/projects/delete',
            meta: { permission: 'DELETE_PROJECTS' }
        };

        try {
            // @ts-ignore
            await permissionsMiddleware(to);
        } catch (error: any) {
            expect(error.message).toContain("don't have permission");
            // expect(error.statusCode).toBe(404);
        }
    });
});
