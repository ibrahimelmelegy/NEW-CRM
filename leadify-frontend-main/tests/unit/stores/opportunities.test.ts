/**
 * useOpportunityStore - Unit Tests
 * ==================================
 * Tests for stores/opportunities.ts Pinia store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useOpportunityStore } from '@/stores/opportunities';

// Mock useApiFetch globally
globalThis.useApiFetch = vi.fn();

// Mock useI18n
globalThis.useI18n = () => ({ t: (key: string) => key, locale: ref('en') });

const mockOpportunity = (overrides: Record<string, unknown> = {}) => ({
  id: 'opp-1',
  name: 'Test Opportunity',
  stage: 'DISCOVERY',
  estimatedValue: 25000,
  probability: 60,
  profit: 5000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
});

describe('useOpportunityStore', () => {
  let store: ReturnType<typeof useOpportunityStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useOpportunityStore();
    vi.clearAllMocks();
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.opportunities).toEqual([]);
      expect(store.currentOpportunity).toBeNull();
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
    it('opportunitiesByStage should group opportunities by stage', () => {
      store.opportunities = [
        mockOpportunity({ id: 'opp-1', stage: 'DISCOVERY' }),
        mockOpportunity({ id: 'opp-2', stage: 'PROPOSAL' }),
        mockOpportunity({ id: 'opp-3', stage: 'DISCOVERY' }),
        mockOpportunity({ id: 'opp-4', stage: 'WON' })
      ] as unknown;

      const grouped = store.opportunitiesByStage;
      expect(grouped.DISCOVERY).toHaveLength(2);
      expect(grouped.PROPOSAL).toHaveLength(1);
      expect(grouped.WON).toHaveLength(1);
    });

    it('totalEstimatedValue should sum all estimated values', () => {
      store.opportunities = [
        mockOpportunity({ id: 'opp-1', estimatedValue: 10000 }),
        mockOpportunity({ id: 'opp-2', estimatedValue: 20000 }),
        mockOpportunity({ id: 'opp-3', estimatedValue: 15000 })
      ] as unknown;

      expect(store.totalEstimatedValue).toBe(45000);
    });

    it('totalEstimatedValue should handle missing values', () => {
      store.opportunities = [
        mockOpportunity({ id: 'opp-1', estimatedValue: 10000 }),
        mockOpportunity({ id: 'opp-2', estimatedValue: undefined })
      ] as unknown;

      expect(store.totalEstimatedValue).toBe(10000);
    });
  });

  // ============================================
  // Actions
  // ============================================
  describe('fetchOpportunities', () => {
    it('should fetch opportunities and update state on success', async () => {
      const opportunities = [mockOpportunity({ id: 'opp-1' }), mockOpportunity({ id: 'opp-2' })];
      const pagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

      (globalThis.useApiFetch as unknown).mockResolvedValue({
        success: true,
        body: { docs: opportunities, pagination }
      });

      await store.fetchOpportunities();

      expect(globalThis.useApiFetch).toHaveBeenCalledWith('opportunity');
      expect(store.opportunities).toEqual(opportunities);
      expect(store.pagination).toEqual(pagination);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should set error on API failure response', async () => {
      (globalThis.useApiFetch as unknown).mockResolvedValue({
        success: false,
        message: 'Permission denied'
      });

      await store.fetchOpportunities();

      expect(store.opportunities).toEqual([]);
      expect(store.error).toBe('Permission denied');
    });

    it('should set error on thrown exception', async () => {
      (globalThis.useApiFetch as unknown).mockRejectedValue(new Error('Request failed'));

      await store.fetchOpportunities();

      expect(store.error).toBe('Request failed');
      expect(store.loading).toBe(false);
    });
  });

  describe('fetchOpportunity', () => {
    it('should fetch a single opportunity and set currentOpportunity', async () => {
      const opp = mockOpportunity({ id: 'opp-1' });

      (globalThis.useApiFetch as unknown).mockResolvedValue({
        success: true,
        body: opp
      });

      await store.fetchOpportunity('opp-1');

      expect(globalThis.useApiFetch).toHaveBeenCalledWith('opportunity/opp-1');
      expect(store.currentOpportunity).toEqual(opp);
      expect(store.loading).toBe(false);
    });

    it('should set error if single fetch fails', async () => {
      (globalThis.useApiFetch as unknown).mockResolvedValue({
        success: false,
        message: 'Not found'
      });

      await store.fetchOpportunity('opp-missing');

      expect(store.currentOpportunity).toBeNull();
      expect(store.error).toBe('Not found');
    });
  });

  describe('createOpportunity', () => {
    it('should create an opportunity and prepend it to the list', async () => {
      const newOpp = mockOpportunity({ id: 'opp-new', name: 'New Opp' });

      (globalThis.useApiFetch as unknown).mockResolvedValue({
        success: true,
        body: newOpp
      });

      store.opportunities = [mockOpportunity({ id: 'opp-existing' })] as unknown;
      const result = await store.createOpportunity({ name: 'New Opp' });

      expect(result).toEqual(newOpp);
      expect(store.opportunities[0]).toEqual(newOpp);
      expect(store.opportunities).toHaveLength(2);
    });

    it('should return null and set error on failure', async () => {
      (globalThis.useApiFetch as unknown).mockResolvedValue({
        success: false,
        message: 'Stage is required'
      });

      const result = await store.createOpportunity({ name: 'Bad Opp' });

      expect(result).toBeNull();
      expect(store.error).toBe('Stage is required');
    });
  });

  describe('updateOpportunity', () => {
    it('should update an existing opportunity and currentOpportunity', async () => {
      const original = mockOpportunity({ id: 'opp-1', name: 'Original' });
      const updated = mockOpportunity({ id: 'opp-1', name: 'Updated', stage: 'WON' });

      store.opportunities = [original] as unknown;
      store.currentOpportunity = original as unknown;

      (globalThis.useApiFetch as unknown).mockResolvedValue({
        success: true,
        body: updated
      });

      const result = await store.updateOpportunity('opp-1', { name: 'Updated', stage: 'WON' } as unknown);

      expect(result).toEqual(updated);
      expect(store.opportunities[0]!.name).toBe('Updated');
      expect(store.currentOpportunity!.name).toBe('Updated');
    });

    it('should return null on update failure', async () => {
      (globalThis.useApiFetch as unknown).mockRejectedValue(new Error('Timeout'));

      const result = await store.updateOpportunity('opp-1', { name: 'X' });

      expect(result).toBeNull();
      expect(store.error).toBe('Timeout');
    });
  });
});
