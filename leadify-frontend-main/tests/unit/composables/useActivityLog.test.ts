/**
 * useActivityLog - Unit Tests
 * ============================
 * Tests for composables/useActivityLog.ts
 *
 * The composable provides:
 * - fetchActivities(page): fetch all activity logs
 * - fetchByEntity(entityType, entityId): fetch activities for a specific entity
 * - log(entry): add a local activity entry
 * - getByEntity(entityType, entityId): filter activities in state
 * - getByContact(contactId): filter activities by contact
 * - clearAll(): reset activity list
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useActivityLog } from '@/composables/useActivityLog';

const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);

describe('useActivityLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchActivities
  // ============================================
  describe('fetchActivities', () => {
    it('should fetch activities from audit endpoint', async () => {
      const mockDocs = [
        { id: '1', action: 'CREATE', entityType: 'contact', entityId: '10', entityLabel: 'John Doe', description: 'Created', createdAt: '2024-01-01T10:00:00Z' },
        { id: '2', action: 'UPDATE', entityType: 'deal', entityId: '20', entityLabel: 'Deal A', description: 'Updated', createdAt: '2024-01-02T10:00:00Z' }
      ];
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockDocs }, success: true });

      const { fetchActivities, activities } = useActivityLog();
      await fetchActivities();

      expect(mockUseApiFetch).toHaveBeenCalledWith('audit?page=1&limit=100');
      expect(activities.value).toHaveLength(2);
    });

    it('should map action codes to activity actions correctly', async () => {
      const mockDocs = [
        { id: '1', action: 'CREATE', entityType: 'contact', entityId: '10', entityLabel: 'Jane', description: 'Created', createdAt: '2024-01-01T10:00:00Z' },
        { id: '2', action: 'DELETE', entityType: 'deal', entityId: '20', entityLabel: 'Deal', description: 'Deleted', createdAt: '2024-01-02T10:00:00Z' },
        { id: '3', action: 'ARCHIVE', entityType: 'invoice', entityId: '30', entityLabel: 'Invoice', description: 'Archived', createdAt: '2024-01-03T10:00:00Z' }
      ];
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockDocs }, success: true });

      const { fetchActivities, activities } = useActivityLog();
      await fetchActivities();

      expect(activities.value.find(a => a.id === '1')?.action).toBe('created');
      expect(activities.value.find(a => a.id === '2')?.action).toBe('deleted');
      expect(activities.value.find(a => a.id === '3')?.action).toBe('archived');
    });

    it('should handle body as array (not wrapped in docs)', async () => {
      const mockDocs = [
        { id: '1', action: 'UPDATE', entityType: 'contact', entityId: '10', entityLabel: 'X', description: 'Updated', createdAt: '2024-01-01T10:00:00Z' }
      ];
      mockUseApiFetch.mockResolvedValue({ body: mockDocs, success: true });

      const { fetchActivities, activities } = useActivityLog();
      await fetchActivities();

      expect(activities.value).toHaveLength(1);
    });

    it('should manage loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      mockUseApiFetch.mockReturnValueOnce(new Promise(resolve => { resolvePromise = resolve; }));

      const { fetchActivities, loading } = useActivityLog();

      expect(loading.value).toBe(false);
      const promise = fetchActivities();
      expect(loading.value).toBe(true);

      resolvePromise!({ body: { docs: [] }, success: true });
      await promise;
      expect(loading.value).toBe(false);
    });

    it('should set loading to false even when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const { fetchActivities, loading } = useActivityLog();
      await fetchActivities();

      expect(loading.value).toBe(false);
    });

    it('should use custom page number in fetch', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [] }, success: true });

      const { fetchActivities } = useActivityLog();
      await fetchActivities(3);

      expect(mockUseApiFetch).toHaveBeenCalledWith('audit?page=3&limit=100');
    });
  });

  // ============================================
  // fetchByEntity
  // ============================================
  describe('fetchByEntity', () => {
    it('should fetch by entity type and id using specific URL', async () => {
      const mockDocs = [{ id: '1', action: 'UPDATE', entityType: 'deal', entityId: '5', entityLabel: 'Deal 5', description: 'Updated', createdAt: '2024-01-01T00:00:00Z' }];
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockDocs }, success: true });

      const { fetchByEntity } = useActivityLog();
      const result = await fetchByEntity('deal', '5');

      expect(mockUseApiFetch).toHaveBeenCalledWith('audit/deal/5');
      expect(result).toHaveLength(1);
    });

    it('should use query string when only entityType is given', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [] }, success: true });

      const { fetchByEntity } = useActivityLog();
      await fetchByEntity('contact');

      expect(mockUseApiFetch).toHaveBeenCalledWith('audit?entityType=contact&limit=100');
    });

    it('should return empty array when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const { fetchByEntity } = useActivityLog();
      const result = await fetchByEntity('deal', '99');

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // log (local activity)
  // ============================================
  describe('log', () => {
    it('should prepend a new activity to the list', () => {
      const { log, activities } = useActivityLog();

      log({ action: 'created', entityType: 'contact', entityLabel: 'Test Contact', description: 'Created contact' });

      expect(activities.value).toHaveLength(1);
      expect(activities.value[0]?.action).toBe('created');
      expect(activities.value[0]?.entityLabel).toBe('Test Contact');
    });

    it('should assign auto-generated id and timestamp', () => {
      const { log, activities } = useActivityLog();

      log({ action: 'updated', entityType: 'deal', entityLabel: 'Big Deal', description: 'Updated deal' });

      const entry = activities.value[0];
      expect(entry?.id).toBeDefined();
      expect(typeof entry?.id).toBe('string');
      expect(entry?.timestamp).toBeDefined();
    });

    it('should not exceed 500 entries', () => {
      const { log, activities } = useActivityLog();

      for (let i = 0; i < 505; i++) {
        activities.value.unshift({ id: `old-${i}`, action: 'created', entityType: 'contact', entityLabel: `Contact ${i}`, description: 'Old', timestamp: '2024-01-01T00:00:00Z' });
      }

      log({ action: 'created', entityType: 'contact', entityLabel: 'New Contact', description: 'New' });

      expect(activities.value.length).toBeLessThanOrEqual(500);
    });
  });

  // ============================================
  // getByEntity
  // ============================================
  describe('getByEntity', () => {
    it('should filter activities by entity type and id', async () => {
      const mockDocs = [
        { id: '1', action: 'CREATE', entityType: 'deal', entityId: '5', entityLabel: 'Deal 5', description: 'Created', createdAt: '2024-01-01T10:00:00Z' },
        { id: '2', action: 'UPDATE', entityType: 'contact', entityId: '3', entityLabel: 'Contact 3', description: 'Updated', createdAt: '2024-01-02T10:00:00Z' }
      ];
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockDocs }, success: true });

      const { fetchActivities, getByEntity } = useActivityLog();
      await fetchActivities();

      const dealActivities = getByEntity('deal', '5');
      expect(dealActivities).toHaveLength(1);
      expect(dealActivities[0]?.entityType).toBe('deal');
    });

    it('should return all activities of a type when no id given', async () => {
      const mockDocs = [
        { id: '1', action: 'CREATE', entityType: 'deal', entityId: '5', entityLabel: 'Deal 5', description: 'Created', createdAt: '2024-01-01T10:00:00Z' },
        { id: '2', action: 'UPDATE', entityType: 'deal', entityId: '6', entityLabel: 'Deal 6', description: 'Updated', createdAt: '2024-01-02T10:00:00Z' },
        { id: '3', action: 'CREATE', entityType: 'contact', entityId: '1', entityLabel: 'Contact 1', description: 'Created', createdAt: '2024-01-03T10:00:00Z' }
      ];
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockDocs }, success: true });

      const { fetchActivities, getByEntity } = useActivityLog();
      await fetchActivities();

      const dealActivities = getByEntity('deal');
      expect(dealActivities).toHaveLength(2);
    });
  });

  // ============================================
  // clearAll
  // ============================================
  describe('clearAll', () => {
    it('should empty the activities list', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [{ id: '1', action: 'CREATE', entityType: 'contact', entityId: '1', entityLabel: 'Test', description: 'Created', createdAt: '2024-01-01T00:00:00Z' }] }, success: true });

      const { fetchActivities, clearAll, activities } = useActivityLog();
      await fetchActivities();
      expect(activities.value.length).toBeGreaterThan(0);

      clearAll();
      expect(activities.value).toHaveLength(0);
    });
  });

  // ============================================
  // Constants
  // ============================================
  describe('constants', () => {
    it('should have action icons for all action types', () => {
      const { actionIcons } = useActivityLog();
      expect(actionIcons.created).toBeDefined();
      expect(actionIcons.updated).toBeDefined();
      expect(actionIcons.deleted).toBeDefined();
    });

    it('should have action colors for all action types', () => {
      const { actionColors } = useActivityLog();
      expect(actionColors.created).toBeDefined();
      expect(actionColors.deleted).toContain('#ef4444');
    });

    it('should expose recent computed (top 50 entries)', async () => {
      const mockDocs = Array.from({ length: 60 }, (_, i) => ({
        id: String(i),
        action: 'CREATE',
        entityType: 'contact',
        entityId: String(i),
        entityLabel: `Contact ${i}`,
        description: 'Created',
        createdAt: new Date(2024, 0, i + 1).toISOString()
      }));
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockDocs }, success: true });

      const { fetchActivities, recent } = useActivityLog();
      await fetchActivities();

      expect(recent.value).toHaveLength(50);
    });
  });
});
