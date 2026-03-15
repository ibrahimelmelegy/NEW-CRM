/**
 * useSequences - Unit Tests
 * ==========================
 * Tests for composables/useSequences.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Mock useApiFetch
// ============================================
const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

import {
  fetchSequences,
  createSequence,
  updateSequence,
  deleteSequence,
  enrollEntity,
  advanceStep,
  pauseEnrollment,
  resumeEnrollment,
  fetchEnrollments,
  fetchSequenceStats,
  type Sequence,
  type SequenceEnrollment,
  type SequenceStats
} from '@/composables/useSequences';

describe('useSequences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchSequences
  // ============================================
  describe('fetchSequences', () => {
    it('should fetch sequences from correct endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchSequences();

      expect(mockUseApiFetch).toHaveBeenCalledWith('sequences');
    });

    it('should append query params when provided', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchSequences({ isActive: 'true', page: '1' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('sequences?');
      expect(calledUrl).toContain('isActive=true');
    });

    it('should return docs and pagination', async () => {
      const mockSequences: Sequence[] = [
        { id: 'seq-1', name: 'Welcome Sequence', steps: [], isActive: true }
      ];
      const mockPagination = { page: 1, limit: 20, totalItems: 1, totalPages: 1 };

      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockSequences, pagination: mockPagination },
        success: true
      });

      const result = await fetchSequences();

      expect(result.docs).toEqual(mockSequences);
      expect(result.pagination).toEqual(mockPagination);
    });

    it('should return empty docs when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchSequences();

      expect(result.docs).toEqual([]);
    });
  });

  // ============================================
  // createSequence
  // ============================================
  describe('createSequence', () => {
    it('should create sequence with POST method', async () => {
      const newSeq: Partial<Sequence> = {
        name: 'Lead Nurture Sequence',
        steps: [{ order: 1, type: 'email', subject: 'Welcome', body: 'Hello!', delayDays: 0 }],
        isActive: true
      };

      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 'seq-new', ...newSeq } });

      await createSequence(newSeq);

      expect(mockUseApiFetch).toHaveBeenCalledWith('sequences', 'POST', newSeq);
    });
  });

  // ============================================
  // updateSequence
  // ============================================
  describe('updateSequence', () => {
    it('should update sequence with PUT method and ID', async () => {
      const updateData = { isActive: false };
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await updateSequence('seq-1', updateData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('sequences/seq-1', 'PUT', updateData);
    });
  });

  // ============================================
  // deleteSequence
  // ============================================
  describe('deleteSequence', () => {
    it('should delete sequence with DELETE method', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await deleteSequence('seq-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('sequences/seq-1', 'DELETE');
    });
  });

  // ============================================
  // enrollEntity
  // ============================================
  describe('enrollEntity', () => {
    it('should enroll an entity into a sequence', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await enrollEntity('seq-1', 'lead', 'lead-123');

      expect(mockUseApiFetch).toHaveBeenCalledWith('sequences/seq-1/enroll', 'POST', {
        entityType: 'lead',
        entityId: 'lead-123'
      });
    });

    it('should return the enrollment result', async () => {
      const response = { success: true, body: { id: 'enr-1' } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await enrollEntity('seq-1', 'deal', 'deal-456');

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // advanceStep
  // ============================================
  describe('advanceStep', () => {
    it('should advance enrollment step with PATCH method', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await advanceStep('enr-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('sequences/enrollments/enr-1/advance', 'PATCH');
    });
  });

  // ============================================
  // pauseEnrollment
  // ============================================
  describe('pauseEnrollment', () => {
    it('should pause enrollment with PATCH method', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await pauseEnrollment('enr-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('sequences/enrollments/enr-1/pause', 'PATCH');
    });
  });

  // ============================================
  // resumeEnrollment
  // ============================================
  describe('resumeEnrollment', () => {
    it('should resume enrollment with PATCH method', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await resumeEnrollment('enr-2');

      expect(mockUseApiFetch).toHaveBeenCalledWith('sequences/enrollments/enr-2/resume', 'PATCH');
    });
  });

  // ============================================
  // fetchEnrollments
  // ============================================
  describe('fetchEnrollments', () => {
    it('should fetch enrollments for a sequence', async () => {
      const mockEnrollments: SequenceEnrollment[] = [
        {
          id: 'enr-1',
          sequenceId: 'seq-1',
          entityType: 'lead',
          entityId: 'lead-1',
          currentStep: 2,
          status: 'active'
        }
      ];

      mockUseApiFetch.mockResolvedValue({ body: { docs: mockEnrollments }, success: true });

      const result = await fetchEnrollments('seq-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('sequences/seq-1/enrollments');
      expect(result).toEqual(mockEnrollments);
    });

    it('should return empty array when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchEnrollments('seq-99');

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // fetchSequenceStats
  // ============================================
  describe('fetchSequenceStats', () => {
    it('should fetch stats for a sequence', async () => {
      const mockStats: SequenceStats = {
        totalEnrolled: 50,
        active: 30,
        paused: 5,
        completed: 10,
        cancelled: 5
      };

      mockUseApiFetch.mockResolvedValue({ body: mockStats, success: true });

      const result = await fetchSequenceStats('seq-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('sequences/seq-1/stats');
      expect(result.totalEnrolled).toBe(50);
    });

    it('should return default empty stats when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchSequenceStats('seq-99');

      expect(result.totalEnrolled).toBe(0);
      expect(result.active).toBe(0);
    });
  });
});
