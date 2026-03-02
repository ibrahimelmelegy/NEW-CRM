/**
 * useAudit - Unit Tests
 * =======================
 * Tests for composables/useAudit.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: any[]) => mockApiFetch(...args)
}));

import { fetchAuditTrail, fetchFieldHistory } from '~/composables/useAudit';

describe('useAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchAuditTrail
  // ============================================
  describe('fetchAuditTrail', () => {
    it('should fetch audit trail for entity with default pagination', async () => {
      const data = {
        docs: [{ id: 1, action: 'CREATE', entityType: 'LEAD', entityId: '10', userId: 1, createdAt: '2024-01-01' }],
        pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 }
      };
      mockApiFetch.mockResolvedValue({ body: data, success: true });

      const result = await fetchAuditTrail('LEAD', '10');

      expect(mockApiFetch).toHaveBeenCalledWith('audit/LEAD/10?page=1&limit=20');
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].action).toBe('CREATE');
    });

    it('should support custom pagination', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchAuditTrail('DEAL', 5, 2, 50);

      expect(mockApiFetch).toHaveBeenCalledWith('audit/DEAL/5?page=2&limit=50');
    });

    it('should return empty result on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchAuditTrail('LEAD', '10');

      expect(result.docs).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });

    it('should handle numeric entityId', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchAuditTrail('DEAL', 42);

      expect(mockApiFetch).toHaveBeenCalledWith('audit/DEAL/42?page=1&limit=20');
    });
  });

  // ============================================
  // fetchFieldHistory
  // ============================================
  describe('fetchFieldHistory', () => {
    it('should fetch history for a specific field', async () => {
      const entries = [
        { id: 1, action: 'UPDATE', entityType: 'LEAD', entityId: '10', fieldName: 'status', oldValue: 'NEW', newValue: 'CONTACTED', userId: 1, createdAt: '2024-01-01' }
      ];
      mockApiFetch.mockResolvedValue({ body: { docs: entries }, success: true });

      const result = await fetchFieldHistory('LEAD', '10', 'status');

      expect(mockApiFetch).toHaveBeenCalledWith('audit/LEAD/10/field/status');
      expect(result).toEqual(entries);
    });

    it('should handle direct array response', async () => {
      const entries = [{ id: 1, action: 'UPDATE' }];
      mockApiFetch.mockResolvedValue({ body: entries, success: true });

      const result = await fetchFieldHistory('DEAL', 5, 'stage');

      expect(result).toEqual(entries);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchFieldHistory('LEAD', '10', 'status');

      expect(result).toEqual([]);
    });

    it('should handle numeric entityId', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });

      await fetchFieldHistory('DEAL', 42, 'price');

      expect(mockApiFetch).toHaveBeenCalledWith('audit/DEAL/42/field/price');
    });
  });
});
