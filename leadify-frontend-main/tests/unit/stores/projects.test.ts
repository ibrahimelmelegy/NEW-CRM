/**
 * useProjectStore - Unit Tests
 * ==============================
 * Tests for stores/projects.ts Pinia store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useProjectStore } from '@/stores/projects';

// Mock useApiFetch globally
globalThis.useApiFetch = vi.fn();

// Mock useI18n
globalThis.useI18n = () => ({ t: (key: string) => key, locale: ref('en') });

const mockProject = (overrides: Record<string, unknown> = {}) => ({
  id: 'proj-1',
  name: 'Test Project',
  isCompleted: false,
  status: 'ACTIVE',
  duration: 90,
  materialMargin: 10,
  materialMarginCommission: 5,
  totalMaterialCost: 1000,
  totalCarRent: 500,
  totalCarRentPerDuration: 200,
  accommodationCost: 300,
  resourceCount: 5,
  foodCostPerDay: 50,
  managementAdditionPercentage: 15,
  manpowerTotalCost: 8000,
  finalManpowerTotalCost: 9200,
  totalAssetRentPrice: 1000,
  totalAssetBuyPrice: 5000,
  totalAssetsCost: 6000,
  discount: 0,
  grandTotal: 25000,
  vat: 3750,
  marginPercentage: 20,
  marginAmount: 5000,
  totalCost: 20000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
});

describe('useProjectStore', () => {
  let store: ReturnType<typeof useProjectStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useProjectStore();
    vi.clearAllMocks();
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.projects).toEqual([]);
      expect(store.currentProject).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      });
    });
  });

  // ============================================
  // Getters
  // ============================================
  describe('getters', () => {
    it('activeProjects should filter projects with ACTIVE status', () => {
      store.projects = [
        mockProject({ id: 'proj-1', status: 'ACTIVE' }),
        mockProject({ id: 'proj-2', status: 'COMPLETE' }),
        mockProject({ id: 'proj-3', status: 'ACTIVE' }),
        mockProject({ id: 'proj-4', status: 'ON_HOLD' })
      ] as any;

      expect(store.activeProjects).toHaveLength(2);
      expect(store.activeProjects.every((p: any) => p.status === 'ACTIVE')).toBe(true);
    });

    it('projectsByStatus should group projects by status', () => {
      store.projects = [
        mockProject({ id: 'proj-1', status: 'ACTIVE' }),
        mockProject({ id: 'proj-2', status: 'COMPLETE' }),
        mockProject({ id: 'proj-3', status: 'ACTIVE' }),
        mockProject({ id: 'proj-4', status: 'ON_HOLD' })
      ] as any;

      const grouped = store.projectsByStatus;
      expect(grouped.ACTIVE).toHaveLength(2);
      expect(grouped.COMPLETE).toHaveLength(1);
      expect(grouped.ON_HOLD).toHaveLength(1);
    });

    it('projectsByStatus should skip projects without status', () => {
      store.projects = [mockProject({ id: 'proj-1', status: 'ACTIVE' }), mockProject({ id: 'proj-2', status: undefined })] as any;

      const grouped = store.projectsByStatus;
      expect(grouped.ACTIVE).toHaveLength(1);
      expect(Object.keys(grouped)).toHaveLength(1);
    });
  });

  // ============================================
  // Actions
  // ============================================
  describe('fetchProjects', () => {
    it('should fetch projects and update state on success', async () => {
      const projects = [mockProject({ id: 'proj-1' }), mockProject({ id: 'proj-2' })];
      const pagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: { docs: projects, pagination }
      });

      await store.fetchProjects();

      expect(globalThis.useApiFetch).toHaveBeenCalledWith('project');
      expect(store.projects).toEqual(projects);
      expect(store.pagination).toEqual(pagination);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should set error on API failure', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: false,
        message: 'Server error'
      });

      await store.fetchProjects();

      expect(store.projects).toEqual([]);
      expect(store.error).toBe('Server error');
    });

    it('should handle network exceptions', async () => {
      (globalThis.useApiFetch as any).mockRejectedValue(new Error('Network failure'));

      await store.fetchProjects();

      expect(store.error).toBe('Network failure');
      expect(store.loading).toBe(false);
    });
  });

  describe('createProject', () => {
    it('should create a project and prepend it to the list', async () => {
      const newProject = mockProject({ id: 'proj-new', name: 'New Project' });

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: newProject
      });

      store.projects = [mockProject({ id: 'proj-existing' })] as any;
      const result = await store.createProject({ name: 'New Project' });

      expect(result).toEqual(newProject);
      expect(store.projects[0]).toEqual(newProject);
      expect(store.projects).toHaveLength(2);
    });

    it('should return null and set error on failure', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: false,
        message: 'Name is required'
      });

      const result = await store.createProject({ name: '' });

      expect(result).toBeNull();
      expect(store.error).toBe('Name is required');
    });
  });

  describe('updateProject', () => {
    it('should update an existing project and currentProject', async () => {
      const original = mockProject({ id: 'proj-1', name: 'Original' });
      const updated = mockProject({ id: 'proj-1', name: 'Updated', status: 'COMPLETE' });

      store.projects = [original] as any;
      store.currentProject = original as any;

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: updated
      });

      const result = await store.updateProject('proj-1', { name: 'Updated', status: 'COMPLETE' } as any);

      expect(result).toEqual(updated);
      expect(store.projects[0]!.name).toBe('Updated');
      expect(store.currentProject!.name).toBe('Updated');
    });

    it('should return null on exception', async () => {
      (globalThis.useApiFetch as any).mockRejectedValue(new Error('Update failed'));

      const result = await store.updateProject('proj-1', { name: 'X' });

      expect(result).toBeNull();
      expect(store.error).toBe('Update failed');
    });
  });
});
