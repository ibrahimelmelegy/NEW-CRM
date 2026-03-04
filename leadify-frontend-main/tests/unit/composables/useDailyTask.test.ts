/**
 * useDailyTask - Unit Tests
 * ===========================
 * Tests for composables/useDailyTask.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

const mockNotification = vi.fn();
(globalThis as any).ElNotification = mockNotification;

const mockNavigateTo = vi.fn();
(globalThis as any).navigateTo = mockNavigateTo;

(globalThis as any).formatDate = vi.fn((d: string) => d);
(globalThis as any).capitalizeName = vi.fn((s: string) => s.charAt(0).toUpperCase() + s.slice(1));

vi.mock('element-plus', () => ({
  ElNotification: (...args: any[]) => mockNotification(...args)
}));

import {
  TaskStatus,
  TaskPriority,
  taskStatusOptions,
  taskPriorityOptions,
  getDailyTasks,
  getDailyTask,
  createDailyTask,
  updateDailyTask,
  deleteDailyTask,
  getDailyTaskStatistics,
  dailyTaskStatisticsLoading,
  type DailyTask
} from '~/composables/useDailyTask';

describe('useDailyTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Enums and Options
  // ============================================
  describe('enums and options', () => {
    it('should have correct TaskStatus values', () => {
      expect(TaskStatus.ACTIVE).toBe('ACTIVE');
      expect(TaskStatus.COMPLETED).toBe('COMPLETED');
      expect(TaskStatus.ON_HOLD).toBe('ON_HOLD');
    });

    it('should have correct TaskPriority values', () => {
      expect(TaskPriority.HIGH).toBe('HIGH');
      expect(TaskPriority.MEDIUM).toBe('MEDIUM');
      expect(TaskPriority.LOW).toBe('LOW');
    });

    it('should have 5 task status options', () => {
      expect(taskStatusOptions).toHaveLength(5);
    });

    it('should have 3 priority options', () => {
      expect(taskPriorityOptions).toHaveLength(3);
    });
  });

  // ============================================
  // getDailyTasks
  // ============================================
  describe('getDailyTasks', () => {
    it('should fetch daily tasks and return mapped data', async () => {
      mockApiFetch.mockResolvedValue({
        success: true,
        body: {
          docs: [{ id: '1', name: 'Task 1', createdAt: '2024-01-01', client: { clientName: 'C1' }, salesRepresentative: { name: 'SR1' }, user: { name: 'U1' } }],
          pagination: { totalItems: 1, page: 1, limit: 10, totalPages: 1 }
        }
      });

      const result = await getDailyTasks();

      expect(mockApiFetch).toHaveBeenCalledWith('daily-task');
      expect(result.tasks).toHaveLength(1);
      expect((result.tasks[0] as any)!.clientName).toBe('C1');
      expect((result.tasks[0] as any)!.salesRepresentativeName).toBe('SR1');
    });

    it('should use limit=1000 when all=true', async () => {
      mockApiFetch.mockResolvedValue({
        success: true,
        body: { docs: [], pagination: { totalItems: 0, page: 1, limit: 1000, totalPages: 1 } }
      });

      await getDailyTasks(true);

      expect(mockApiFetch).toHaveBeenCalledWith('daily-task?limit=1000');
    });

    it('should return empty result on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Error' });

      const result = await getDailyTasks();

      expect(result.tasks).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });

    it('should handle thrown errors', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getDailyTasks();

      expect(result.tasks).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // getDailyTask
  // ============================================
  describe('getDailyTask', () => {
    it('should fetch a single task by id', async () => {
      const task = { id: '1', name: 'Task 1' };
      mockApiFetch.mockResolvedValue({ body: task, success: true });

      const result = await getDailyTask('1');

      expect(mockApiFetch).toHaveBeenCalledWith('daily-task/1');
      expect(result).toEqual(task);
    });

    it('should return empty object on error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Not found'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getDailyTask('999');

      expect(result).toEqual({});
      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // createDailyTask
  // ============================================
  describe('createDailyTask', () => {
    it('should create task and show success notification', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const task = { name: 'New Task', priority: TaskPriority.HIGH } as DailyTask;

      await createDailyTask(task);

      expect(mockApiFetch).toHaveBeenCalledWith('daily-task', 'POST', expect.objectContaining({ name: 'New Task' }));
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
      expect(mockNavigateTo).toHaveBeenCalledWith('/operations/daily-task');
    });

    it('should clear empty clientId to undefined', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const task = { name: 'Task', clientId: '' } as DailyTask;

      await createDailyTask(task);

      expect(mockApiFetch).toHaveBeenCalledWith('daily-task', 'POST', expect.objectContaining({ clientId: undefined }));
    });

    it('should show error notification on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Validation error' });

      await createDailyTask({ name: 'Task' } as DailyTask);

      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Validation error' }));
    });
  });

  // ============================================
  // updateDailyTask
  // ============================================
  describe('updateDailyTask', () => {
    it('should update task with PUT', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateDailyTask({ name: 'Updated' } as DailyTask, '1');

      expect(mockApiFetch).toHaveBeenCalledWith('daily-task/1', 'PUT', expect.objectContaining({ name: 'Updated' }));
      expect(mockNavigateTo).toHaveBeenCalledWith('/operations/daily-task');
    });

    it('should show error on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Not found' });

      await updateDailyTask({ name: 'X' } as DailyTask, '999');

      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
  });

  // ============================================
  // deleteDailyTask
  // ============================================
  describe('deleteDailyTask', () => {
    it('should delete task and show success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteDailyTask('1');

      expect(mockApiFetch).toHaveBeenCalledWith('daily-task/1', 'DELETE');
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    });
  });

  // ============================================
  // getDailyTaskStatistics
  // ============================================
  describe('getDailyTaskStatistics', () => {
    it('should fetch and transform statistics', async () => {
      mockApiFetch.mockResolvedValue({
        success: true,
        body: {
          activeTasks: 10,
          completedTasks: 5,
          taskStatusPercentage: { active: 60, completed: 40 },
          monthlyRevenue: [{ month: 'Jan', totalPaid: 1000 }],
          taskDistributionByClient: [{ clientName: 'Client A', taskCount: 3 }],
          salesPerformance: [{ name: 'Rep A', tasksCount: 5, totalPaid: 2000 }]
        }
      });

      const result = await getDailyTaskStatistics();

      expect(result.taskStatusPercentage).toEqual([
        { name: 'Active', value: 60 },
        { name: 'Completed', value: 40 }
      ]);
      expect(result.monthlyRevenue[0]).toEqual({ name: 'Jan', value: 1000 });
      expect(result.taskDistributionByClient[0]).toEqual({ name: 'Client A', value: 3 });
    });

    it('should toggle loading state', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { taskStatusPercentage: {}, monthlyRevenue: [], taskDistributionByClient: [], salesPerformance: [] } });

      await getDailyTaskStatistics();

      expect(dailyTaskStatisticsLoading.value).toBe(false);
    });

    it('should throw on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Stats error' });

      await expect(getDailyTaskStatistics()).rejects.toThrow('Stats error');
    });
  });
});
