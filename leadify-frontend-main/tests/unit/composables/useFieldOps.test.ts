/**
 * useFieldOps - Unit Tests
 * =========================
 * Tests for composables/useFieldOps.ts
 *
 * The module provides:
 * - fetchCheckIns(params): fetch field check-in records with optional filters
 * - createCheckIn(data): create a new check-in
 * - fetchMyHistory(): fetch current user's check-in history
 * - fetchTeamLocations(): fetch all team members' latest locations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { fetchCheckIns, createCheckIn, fetchMyHistory, fetchTeamLocations } from '@/composables/useFieldOps';

const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);

describe('useFieldOps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchCheckIns
  // ============================================
  describe('fetchCheckIns', () => {
    it('should fetch check-ins without params', async () => {
      const mockDocs = [
        {
          id: 1,
          userId: 10,
          latitude: 24.7136,
          longitude: 46.6753,
          type: 'CHECK_IN' as const,
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T09:00:00Z'
        }
      ];
      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockDocs, pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 } },
        success: true
      });

      const result = await fetchCheckIns();

      expect(mockUseApiFetch).toHaveBeenCalledWith('field-ops');
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]?.type).toBe('CHECK_IN');
    });

    it('should include query params in the URL', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchCheckIns({ userId: '10', type: 'CHECK_OUT' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('userId=10');
      expect(calledUrl).toContain('type=CHECK_OUT');
    });

    it('should return empty docs when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchCheckIns();

      expect(result.docs).toEqual([]);
      expect(result.pagination).toBeDefined();
    });

    it('should return correct pagination on success', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: { page: 2, limit: 20, totalItems: 50, totalPages: 3 } },
        success: true
      });

      const result = await fetchCheckIns({ page: '2' });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  // ============================================
  // createCheckIn
  // ============================================
  describe('createCheckIn', () => {
    it('should call POST endpoint with check-in data', async () => {
      const data = { latitude: 24.7136, longitude: 46.6753, type: 'CHECK_IN', address: 'Riyadh, Saudi Arabia', notes: 'Morning check-in' };
      mockUseApiFetch.mockResolvedValue({
        success: true,
        body: { id: 1, userId: 10, ...data, createdAt: '2024-01-01T09:00:00Z', updatedAt: '2024-01-01T09:00:00Z' }
      });

      const result = await createCheckIn(data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('field-ops', 'POST', data);
      expect(result).toBeDefined();
    });

    it('should return the API response', async () => {
      const response = { success: true, body: { id: 2 } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await createCheckIn({ latitude: 25.0, longitude: 45.0, type: 'CHECK_OUT' });

      expect(result).toEqual(response);
    });

    it('should handle check-in creation failure', async () => {
      const response = { success: false, message: 'Invalid coordinates' };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await createCheckIn({ latitude: 0, longitude: 0 });

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // fetchMyHistory
  // ============================================
  describe('fetchMyHistory', () => {
    it('should fetch current user check-in history', async () => {
      const mockHistory = [
        {
          id: 1,
          userId: 10,
          latitude: 24.7136,
          longitude: 46.6753,
          type: 'CHECK_IN' as const,
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T09:00:00Z'
        },
        {
          id: 2,
          userId: 10,
          latitude: 24.7136,
          longitude: 46.6753,
          type: 'CHECK_OUT' as const,
          createdAt: '2024-01-01T17:00:00Z',
          updatedAt: '2024-01-01T17:00:00Z'
        }
      ];
      mockUseApiFetch.mockResolvedValue({ body: mockHistory, success: true });

      const result = await fetchMyHistory();

      expect(mockUseApiFetch).toHaveBeenCalledWith('field-ops/my-history');
      expect(result).toHaveLength(2);
    });

    it('should return empty array on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchMyHistory();

      expect(result).toEqual([]);
    });

    it('should return empty array when body is null', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: true });

      const result = await fetchMyHistory();

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // fetchTeamLocations
  // ============================================
  describe('fetchTeamLocations', () => {
    it('should fetch team locations', async () => {
      const mockLocations = [
        {
          id: 10,
          userId: 1,
          latitude: 24.7136,
          longitude: 46.6753,
          type: 'CHECK_IN' as const,
          user: { id: 1, name: 'Alice', email: 'alice@example.com' },
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T09:00:00Z'
        },
        {
          id: 11,
          userId: 2,
          latitude: 24.8,
          longitude: 46.7,
          type: 'CHECK_IN' as const,
          user: { id: 2, name: 'Bob', email: 'bob@example.com' },
          createdAt: '2024-01-01T09:30:00Z',
          updatedAt: '2024-01-01T09:30:00Z'
        }
      ];
      mockUseApiFetch.mockResolvedValue({ body: mockLocations, success: true });

      const result = await fetchTeamLocations();

      expect(mockUseApiFetch).toHaveBeenCalledWith('field-ops/team-locations');
      expect(result).toHaveLength(2);
    });

    it('should return empty array on API failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchTeamLocations();

      expect(result).toEqual([]);
    });

    it('should handle empty team (no one checked in)', async () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      const result = await fetchTeamLocations();

      expect(result).toEqual([]);
    });
  });
});
