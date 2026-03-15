/**
 * useLeadScoring - Unit Tests
 * ============================
 * Tests for composables/useLeadScoring.ts
 *
 * The module provides:
 * - fetchScoringRules, createScoringRule, updateScoringRule, deleteScoringRule
 * - calculateScore, bulkCalculateScores, getScore, getTopScored, getGradeThresholds
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  fetchScoringRules,
  createScoringRule,
  updateScoringRule,
  deleteScoringRule,
  calculateScore,
  bulkCalculateScores,
  getScore,
  getTopScored,
  getGradeThresholds,
  type ScoringRule,
  type GradeThreshold
} from '@/composables/useLeadScoring';

// ============================================
// Mock useApiFetch
// ============================================
const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

describe('useLeadScoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchScoringRules
  // ============================================
  describe('fetchScoringRules', () => {
    it('should fetch scoring rules from correct endpoint', async () => {
      const mockRules: ScoringRule[] = [
        {
          id: 1,
          name: 'Website Form Rule',
          entityType: 'lead',
          criteria: [{ field: 'leadSource', operator: 'eq', value: 'WEBSITE', points: 10 }],
          isActive: true
        }
      ];

      mockUseApiFetch.mockResolvedValue({ body: { docs: mockRules }, success: true });

      const result = await fetchScoringRules();

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead-scoring/rules');
      expect(result).toEqual(mockRules);
    });

    it('should return array directly when not wrapped in docs', async () => {
      const mockRules: ScoringRule[] = [{ id: 1, name: 'Rule 1', entityType: 'lead', criteria: [], isActive: true }];

      mockUseApiFetch.mockResolvedValue({ body: mockRules, success: true });

      const result = await fetchScoringRules();

      expect(result).toEqual(mockRules);
    });

    it('should return empty array when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchScoringRules();

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // createScoringRule
  // ============================================
  describe('createScoringRule', () => {
    it('should create scoring rule with POST method', async () => {
      const newRule: Partial<ScoringRule> = {
        name: 'Email Open Rule',
        entityType: 'lead',
        criteria: [{ field: 'emailOpened', operator: 'eq', value: true, points: 5 }],
        isActive: true
      };

      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 2, ...newRule } });

      await createScoringRule(newRule);

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead-scoring/rules', 'POST', newRule);
    });

    it('should return the API response', async () => {
      const response = { success: true, body: { id: 3 } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await createScoringRule({ name: 'New Rule', entityType: 'lead', criteria: [], isActive: true });

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // updateScoringRule
  // ============================================
  describe('updateScoringRule', () => {
    it('should update scoring rule with PUT method and correct ID', async () => {
      const updateData: Partial<ScoringRule> = { isActive: false };

      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await updateScoringRule(1, updateData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead-scoring/rules/1', 'PUT', updateData);
    });
  });

  // ============================================
  // deleteScoringRule
  // ============================================
  describe('deleteScoringRule', () => {
    it('should delete scoring rule with DELETE method and correct ID', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await deleteScoringRule(1);

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead-scoring/rules/1', 'DELETE');
    });
  });

  // ============================================
  // calculateScore
  // ============================================
  describe('calculateScore', () => {
    it('should calculate score for a specific entity', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { score: 75 } });

      await calculateScore('lead', 123);

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead-scoring/calculate/lead/123', 'POST');
    });

    it('should return the API response', async () => {
      const response = { success: true, body: { score: 80 } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await calculateScore('opportunity', 456);

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // bulkCalculateScores
  // ============================================
  describe('bulkCalculateScores', () => {
    it('should bulk calculate scores for entity type', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { updated: 50 } });

      await bulkCalculateScores('lead');

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead-scoring/calculate/lead', 'POST');
    });

    it('should work for different entity types', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await bulkCalculateScores('opportunity');

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead-scoring/calculate/opportunity', 'POST');
    });
  });

  // ============================================
  // getScore
  // ============================================
  describe('getScore', () => {
    it('should get score for specific entity', async () => {
      const mockScore = { score: 85, grade: 'A', details: [] };

      mockUseApiFetch.mockResolvedValue({ body: mockScore, success: true });

      const result = await getScore('lead', 1);

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead-scoring/scores/lead/1');
      expect(result).toEqual(mockScore);
    });

    it('should return null when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await getScore('lead', 99);

      expect(result).toBeNull();
    });

    it('should return body when success is true', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { score: 60 }, success: true });

      const result = await getScore('opportunity', 5);

      expect(result).toEqual({ score: 60 });
    });
  });

  // ============================================
  // getTopScored
  // ============================================
  describe('getTopScored', () => {
    it('should get top scored entities', async () => {
      const mockTopScored = [
        { id: 1, name: 'Lead 1', score: 95 },
        { id: 2, name: 'Lead 2', score: 88 }
      ];

      mockUseApiFetch.mockResolvedValue({ body: { docs: mockTopScored }, success: true });

      const result = await getTopScored('lead');

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead-scoring/top/lead');
      expect(result).toEqual(mockTopScored);
    });

    it('should return empty array when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await getTopScored('lead');

      expect(result).toEqual([]);
    });

    it('should work for different entity types', async () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      await getTopScored('opportunity');

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead-scoring/top/opportunity');
    });
  });

  // ============================================
  // getGradeThresholds
  // ============================================
  describe('getGradeThresholds', () => {
    it('should fetch grade thresholds', async () => {
      const mockGrades: GradeThreshold[] = [
        { grade: 'A', label: 'Hot', minScore: 80, maxScore: 100, color: '#10B981' },
        { grade: 'B', label: 'Warm', minScore: 60, maxScore: 79, color: '#F59E0B' },
        { grade: 'C', label: 'Cold', minScore: 0, maxScore: 59, color: '#EF4444' }
      ];

      mockUseApiFetch.mockResolvedValue({ body: { docs: mockGrades }, success: true });

      const result = await getGradeThresholds();

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead-scoring/grades');
      expect(result).toEqual(mockGrades);
    });

    it('should return empty array when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await getGradeThresholds();

      expect(result).toEqual([]);
    });

    it('should return grades directly when not wrapped in docs', async () => {
      const mockGrades: GradeThreshold[] = [{ grade: 'A', label: 'Hot', minScore: 80, maxScore: 100, color: '#10B981' }];

      mockUseApiFetch.mockResolvedValue({ body: mockGrades, success: true });

      const result = await getGradeThresholds();

      expect(result).toEqual(mockGrades);
    });
  });
});
