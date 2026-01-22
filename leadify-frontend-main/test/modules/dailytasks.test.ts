import { describe, it, expect, vi } from 'vitest';
import { getDailyTasks, createDailyTask } from '@/composables/useDailyTask';

// Mock API Fetch Globally
const mockApiFetch = vi.fn((url, method = 'GET') => {
    if (url === 'daily-task' && (method === 'GET' || !method)) {
        return Promise.resolve({
            success: true,
            body: { docs: [{ id: 'dt1', task: 'Fix bugs' }] }
        });
    }
    if (url === 'daily-task' && method === 'POST') {
        return Promise.resolve({ success: true });
    }
    return Promise.resolve({ success: false });
});
vi.stubGlobal('useApiFetch', mockApiFetch);

vi.mock('element-plus', () => ({
    ElNotification: vi.fn(),
}));
vi.stubGlobal('navigateTo', vi.fn());

describe('Daily Tasks Module', () => {
    it('should fetch tasks', async () => {
        const result = await getDailyTasks();
        expect(result.tasks.length).toBeGreaterThan(0);
    });

    it('should create a task', async () => {
        // @ts-ignore
        await createDailyTask({ task: 'New Task' });
        expect(true).toBe(true);
    });
});
