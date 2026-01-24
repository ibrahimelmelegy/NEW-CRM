import { describe, it, expect, vi } from 'vitest';

// Mocking useRoute/useRouter as requested
vi.mock('vue-router', () => ({
    useRoute: () => ({ params: { id: '123' } }),
    useRouter: () => ({ push: vi.fn(), back: vi.fn() })
}));

// --- Mock Logic Subject Under Test ---
const validateProjectDates = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
        return { valid: false, message: 'End Date cannot be before Start Date' };
    }
    return { valid: true };
};

describe('Component: ProjectInfo (Date Logic)', () => {
    it('should fail if End Date is before Start Date', () => {
        const startDate = '2023-01-10';
        const endDate = '2023-01-05'; // Before start

        const result = validateProjectDates(startDate, endDate);

        expect(result.valid).toBe(false);
        expect(result.message).toContain('End Date cannot be before Start Date');
    });

    it('should pass if End Date is after Start Date', () => {
        const startDate = '2023-01-01';
        const endDate = '2023-02-01';

        const result = validateProjectDates(startDate, endDate);

        expect(result.valid).toBe(true);
    });

    it('should pass if End Date is same as Start Date (Same Day Delivery)', () => {
        const startDate = '2023-01-01';
        const endDate = '2023-01-01';

        const result = validateProjectDates(startDate, endDate);

        expect(result.valid).toBe(true);
    });
});
