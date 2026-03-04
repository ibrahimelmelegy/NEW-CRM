/**
 * useTasks - Unit Tests
 * =======================
 * Tests for composables/useTasks.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  fetchTasks,
  fetchMyTasks,
  fetchTasksByEntity,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  fetchTaskStats
} from '~/composables/useTasks';

const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: any[]) => mockApiFetch(...args)
}));

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchTasks
  // ============================================
  describe('fetchTasks', () => {
    it('should fetch tasks without query params', async () => {
      const data = { docs: [{ id: 1, title: 'Task 1' }], pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 } };
      mockApiFetch.mockResolvedValue({ body: data, success: true });

      const result = await fetchTasks();

      expect(mockApiFetch).toHaveBeenCalledWith('tasks');
      expect(result.docs).toHaveLength(1);
    });

    it('should include query parameters', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchTasks({ status: 'TODO', priority: 'HIGH' });

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('status=TODO'));
      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('priority=HIGH'));
    });

    it('should return default empty result on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchTasks();

      expect(result.docs).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  // ============================================
  // fetchMyTasks
  // ============================================
  describe('fetchMyTasks', () => {
    it('should fetch tasks from my endpoint', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchMyTasks();

      expect(mockApiFetch).toHaveBeenCalledWith('tasks/my');
    });

    it('should include query parameters', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchMyTasks({ status: 'IN_PROGRESS' });

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('tasks/my?'));
      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('status=IN_PROGRESS'));
    });

    it('should return empty result on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchMyTasks();

      expect(result.docs).toEqual([]);
    });
  });

  // ============================================
  // fetchTasksByEntity
  // ============================================
  describe('fetchTasksByEntity', () => {
    it('should fetch tasks for entity', async () => {
      const tasks = [{ id: 1, title: 'Follow up' }];
      mockApiFetch.mockResolvedValue({ body: { docs: tasks }, success: true });

      const result = await fetchTasksByEntity('LEAD', '123');

      expect(mockApiFetch).toHaveBeenCalledWith('tasks/entity/LEAD/123');
      expect(result).toEqual(tasks);
    });

    it('should handle direct array response', async () => {
      const tasks = [{ id: 1, title: 'Task' }];
      mockApiFetch.mockResolvedValue({ body: tasks, success: true });

      const result = await fetchTasksByEntity('DEAL', 5);

      expect(result).toEqual(tasks);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchTasksByEntity('LEAD', '123');

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // createTask
  // ============================================
  describe('createTask', () => {
    it('should POST task data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createTask({ title: 'New Task', status: 'TODO', priority: 'HIGH' });

      expect(mockApiFetch).toHaveBeenCalledWith('tasks', 'POST', { title: 'New Task', status: 'TODO', priority: 'HIGH' });
    });
  });

  // ============================================
  // updateTask
  // ============================================
  describe('updateTask', () => {
    it('should PUT task data with id', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateTask(1, { title: 'Updated', status: 'IN_PROGRESS' });

      expect(mockApiFetch).toHaveBeenCalledWith('tasks/1', 'PUT', { title: 'Updated', status: 'IN_PROGRESS' });
    });
  });

  // ============================================
  // completeTask
  // ============================================
  describe('completeTask', () => {
    it('should PATCH complete endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await completeTask(1);

      expect(mockApiFetch).toHaveBeenCalledWith('tasks/1/complete', 'PATCH');
    });
  });

  // ============================================
  // deleteTask
  // ============================================
  describe('deleteTask', () => {
    it('should DELETE task by id', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteTask(1);

      expect(mockApiFetch).toHaveBeenCalledWith('tasks/1', 'DELETE');
    });
  });

  // ============================================
  // fetchTaskStats
  // ============================================
  describe('fetchTaskStats', () => {
    it('should return stats on success', async () => {
      const stats = { total: 50, completed: 20, inProgress: 15, todo: 15 };
      mockApiFetch.mockResolvedValue({ body: stats, success: true });

      const result = await fetchTaskStats();

      expect(mockApiFetch).toHaveBeenCalledWith('tasks/stats');
      expect(result).toEqual(stats);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchTaskStats();

      expect(result).toBeNull();
    });
  });
});
