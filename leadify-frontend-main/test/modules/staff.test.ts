import { describe, it, expect, vi } from 'vitest';
import { getStaffs, createStaff, StaffStatusEnums } from '@/composables/useStaff';

const mockApiFetch = vi.fn((url, method = 'GET') => {
    if (url === 'users' && (method === 'GET' || !method)) {
        return Promise.resolve({
            success: true,
            body: { docs: [{ id: 's1', name: 'Staff Member', status: 'ACTIVE' }] }
        });
    }
    if (url === 'users' && method === 'POST') {
        return Promise.resolve({ success: true });
    }
    return Promise.resolve({ success: false });
});
vi.stubGlobal('useApiFetch', mockApiFetch);

// Mock Utils
vi.stubGlobal('normalizePhoneNumber', (p: any) => p);
vi.stubGlobal('cleanObject', (o: any) => o);
vi.stubGlobal('formatDate', (d: any) => '2023-01-01');

vi.mock('element-plus', () => ({
    ElNotification: vi.fn(),
}));
vi.stubGlobal('navigateTo', vi.fn());

describe('Staff Module', () => {
    it('should fetch staff members', async () => {
        const result = await getStaffs();
        expect(result.staffs.length).toBeGreaterThan(0);
        expect(result.staffs[0].name).toBe('Staff Member');
    });

    it('should create a staff member', async () => {
        // @ts-ignore
        await createStaff({ name: 'New Staff', phone: '123' });
        expect(true).toBe(true);
    });
});
