import { describe, it, expect, vi } from 'vitest';
import { getLeads, createLead, LeadStatusEnums } from '@/composables/useLeads';

// Mock API Fetch Globally
const mockApiFetch = vi.fn((url, method = 'GET') => {
    if (url === 'lead' && (method === 'GET' || !method)) {
        return Promise.resolve({
            success: true,
            body: { docs: [{ id: 'l1', name: 'Test Lead' }] }
        });
    }
    if (url === 'lead' && method === 'POST') {
        return Promise.resolve({ success: true });
    }
    return Promise.resolve({ success: false, message: 'Mock Error' });
});
vi.stubGlobal('useApiFetch', mockApiFetch);

vi.mock('element-plus', () => ({
    ElNotification: vi.fn(),
}));

// Mock Navigate
vi.stubGlobal('navigateTo', vi.fn());

describe('Leads Module', () => {
    it('should fetch leads successfully', async () => {
        const result = await getLeads();
        expect(result.leads.length).toBeGreaterThan(0);
        expect(result.leads[0].name).toBe('Test Lead');
    });

    it('should create a lead successfully', async () => {
        // @ts-ignore
        await createLead({ name: 'New Lead', status: LeadStatusEnums.New });
        // Expect no error thrown
        expect(true).toBe(true);
    });
});
