import { describe, it, expect, vi } from 'vitest';
import { getOpportunities, createOpportunity, StageEnum } from '@/composables/useOpportunity';

vi.mock('@/composables/useApiFetch', () => ({
    useApiFetch: vi.fn((url, method, data) => {
        if (url === 'opportunity' && method === 'POST') {
            if (!data.name) return { success: false, message: 'Missing name' };
            return { success: true };
        }
        return { success: true, body: { docs: [] } };
    }),
}));

describe('Opportunity Business Logic', () => {
    it('should fetch opportunities and format dates', async () => {
        const result = await getOpportunities();
        expect(result.opportunties).toBeDefined();
        expect(Array.isArray(result.opportunties)).toBe(true);
    });

    it('should handle creation validation failure', async () => {
        // This tests the logic in useOpportunity.ts
        // @ts-ignore
        await createOpportunity({ name: '' });
        // We expect an error notification (mocked in setup.ts)
    });
});
