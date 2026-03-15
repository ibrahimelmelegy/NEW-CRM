/**
 * useKanban - Unit Tests
 * ========================
 * Tests for composables/useKanban.ts
 *
 * The module provides:
 * - fetchDealKanban, fetchOpportunityKanban
 * - updateDealStage, updateOpportunityStage
 * - getStageColor, getPriorityColor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Mocks
// ============================================
const mockUseApiFetch = vi.fn();
const mockElNotification = vi.fn();

vi.mock('element-plus', () => ({
  ElNotification: (...args: unknown[]) => mockElNotification(...args)
}));

vi.mock('~/utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() }
}));

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = mockUseApiFetch;
(globalThis as Record<string, unknown>).useNuxtApp = () => ({
  $i18n: { t: (key: string) => key }
});

import {
  fetchDealKanban,
  fetchOpportunityKanban,
  updateDealStage,
  updateOpportunityStage,
  getStageColor,
  getPriorityColor,
  type KanbanCard
} from '@/composables/useKanban';

describe('useKanban', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchDealKanban
  // ============================================
  describe('fetchDealKanban', () => {
    it('should fetch deal kanban data from correct endpoint', async () => {
      const mockKanban = {
        PROGRESS: [{ id: 'deal-1', name: 'Deal 1' }],
        CLOSED: [],
        CANCELLED: []
      };

      mockUseApiFetch.mockResolvedValue({
        body: mockKanban,
        success: true,
        message: 'OK'
      });

      const result = await fetchDealKanban();

      expect(mockUseApiFetch).toHaveBeenCalledWith('deal/kanban');
      expect(result).toEqual(mockKanban);
    });

    it('should return empty object when API call fails', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: null,
        success: false,
        message: 'Unauthorized'
      });

      const result = await fetchDealKanban();

      expect(result).toEqual({});
    });

    it('should show error notification when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: null,
        success: false,
        message: 'Failed to fetch'
      });

      await fetchDealKanban();

      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });

    it('should return empty object and show notification when exception is thrown', async () => {
      mockUseApiFetch.mockRejectedValue(new Error('Network error'));

      const result = await fetchDealKanban();

      expect(result).toEqual({});
      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });
  });

  // ============================================
  // fetchOpportunityKanban
  // ============================================
  describe('fetchOpportunityKanban', () => {
    it('should fetch opportunity kanban data from correct endpoint', async () => {
      const mockKanban = {
        DISCOVERY: [{ id: 'opp-1', name: 'Opportunity 1' }],
        PROPOSAL: [],
        WON: []
      };

      mockUseApiFetch.mockResolvedValue({
        body: mockKanban,
        success: true,
        message: 'OK'
      });

      const result = await fetchOpportunityKanban();

      expect(mockUseApiFetch).toHaveBeenCalledWith('opportunity/kanban');
      expect(result).toEqual(mockKanban);
    });

    it('should return empty object when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: null,
        success: false,
        message: 'Forbidden'
      });

      const result = await fetchOpportunityKanban();

      expect(result).toEqual({});
    });

    it('should show error notification when exception is thrown', async () => {
      mockUseApiFetch.mockRejectedValue(new Error('Server error'));

      await fetchOpportunityKanban();

      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });
  });

  // ============================================
  // updateDealStage
  // ============================================
  describe('updateDealStage', () => {
    it('should update deal stage with correct endpoint and data', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, message: 'OK' });

      const result = await updateDealStage('deal-123', 'CLOSED');

      expect(mockUseApiFetch).toHaveBeenCalledWith('deal/stage', 'PATCH', {
        dealId: 'deal-123',
        stage: 'CLOSED'
      });
      expect(result).toBe(true);
    });

    it('should return false and show error when update fails', async () => {
      mockUseApiFetch.mockResolvedValue({
        success: false,
        message: 'Invalid stage transition'
      });

      const result = await updateDealStage('deal-123', 'INVALID');

      expect(result).toBe(false);
      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });

    it('should return false and show notification when exception is thrown', async () => {
      mockUseApiFetch.mockRejectedValue(new Error('Network error'));

      const result = await updateDealStage('deal-123', 'CLOSED');

      expect(result).toBe(false);
      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });

    it('should return true for successful stage update', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true });

      const result = await updateDealStage('deal-456', 'PROGRESS');

      expect(result).toBe(true);
    });
  });

  // ============================================
  // updateOpportunityStage
  // ============================================
  describe('updateOpportunityStage', () => {
    it('should update opportunity stage with correct endpoint and data', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, message: 'OK' });

      const result = await updateOpportunityStage('opp-123', 'PROPOSAL');

      expect(mockUseApiFetch).toHaveBeenCalledWith('opportunity/opp-123/stage', 'PATCH', {
        stage: 'PROPOSAL'
      });
      expect(result).toBe(true);
    });

    it('should return false and show error when update fails', async () => {
      mockUseApiFetch.mockResolvedValue({
        success: false,
        message: 'Forbidden'
      });

      const result = await updateOpportunityStage('opp-123', 'WON');

      expect(result).toBe(false);
      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });

    it('should return false when exception is thrown', async () => {
      mockUseApiFetch.mockRejectedValue(new Error('Server error'));

      const result = await updateOpportunityStage('opp-123', 'LOST');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // getStageColor
  // ============================================
  describe('getStageColor', () => {
    it('should return correct color for PROGRESS stage', () => {
      expect(getStageColor('PROGRESS')).toBe('#3B82F6');
    });

    it('should return correct color for CLOSED stage', () => {
      expect(getStageColor('CLOSED')).toBe('#10B981');
    });

    it('should return correct color for CANCELLED stage', () => {
      expect(getStageColor('CANCELLED')).toBe('#EF4444');
    });

    it('should return correct color for DISCOVERY stage', () => {
      expect(getStageColor('DISCOVERY')).toBe('#8B5CF6');
    });

    it('should return correct color for PROPOSAL stage', () => {
      expect(getStageColor('PROPOSAL')).toBe('#F59E0B');
    });

    it('should return correct color for NEGOTIATION stage', () => {
      expect(getStageColor('NEGOTIATION')).toBe('#3B82F6');
    });

    it('should return correct color for WON stage', () => {
      expect(getStageColor('WON')).toBe('#10B981');
    });

    it('should return correct color for LOST stage', () => {
      expect(getStageColor('LOST')).toBe('#EF4444');
    });

    it('should return default gray color for unknown stage', () => {
      expect(getStageColor('UNKNOWN_STAGE')).toBe('#6B7280');
    });

    it('should return default color for empty string', () => {
      expect(getStageColor('')).toBe('#6B7280');
    });
  });

  // ============================================
  // getPriorityColor
  // ============================================
  describe('getPriorityColor', () => {
    it('should return correct color for VERY_HIGH priority', () => {
      expect(getPriorityColor('VERY_HIGH')).toBe('#EF4444');
    });

    it('should return correct color for HIGH priority', () => {
      expect(getPriorityColor('HIGH')).toBe('#F97316');
    });

    it('should return correct color for MEDIUM priority', () => {
      expect(getPriorityColor('MEDIUM')).toBe('#F59E0B');
    });

    it('should return correct color for LOW priority', () => {
      expect(getPriorityColor('LOW')).toBe('#3B82F6');
    });

    it('should return correct color for VERY_LOW priority', () => {
      expect(getPriorityColor('VERY_LOW')).toBe('#6B7280');
    });

    it('should return default gray color for unknown priority', () => {
      expect(getPriorityColor('UNKNOWN')).toBe('#6B7280');
    });

    it('should return default color for empty string', () => {
      expect(getPriorityColor('')).toBe('#6B7280');
    });
  });

  // ============================================
  // KanbanCard interface
  // ============================================
  describe('KanbanCard interface', () => {
    it('should create valid KanbanCard object', () => {
      const card: KanbanCard = {
        id: 'card-1',
        name: 'Test Deal',
        companyName: 'Acme Corp',
        price: 50000,
        priority: 'HIGH',
        users: [{ id: 1, name: 'Alice', email: 'alice@example.com' }]
      };

      expect(card.id).toBe('card-1');
      expect(card.name).toBe('Test Deal');
      expect(card.price).toBe(50000);
    });

    it('should allow optional fields', () => {
      const card: KanbanCard = {
        id: 'card-2',
        name: 'Minimal Card'
      };

      expect(card.companyName).toBeUndefined();
      expect(card.price).toBeUndefined();
    });
  });
});
