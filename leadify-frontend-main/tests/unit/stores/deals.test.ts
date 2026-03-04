/**
 * useDealStore - Unit Tests
 * ==========================
 * Tests for stores/deals.ts Pinia store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useDealStore } from '@/stores/deals';

// Mock useApiFetch globally
globalThis.useApiFetch = vi.fn();

// Mock useI18n
globalThis.useI18n = () => ({ t: (key: string) => key, locale: ref('en') });

const mockDeal = (overrides: Record<string, unknown> = {}) => ({
  id: 'deal-1',
  name: 'Test Deal',
  companyName: 'Acme Corp',
  price: 10000,
  contractType: 'Contract',
  stage: 'PROGRESS',
  probability: 50,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
});

describe('useDealStore', () => {
  let store: ReturnType<typeof useDealStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useDealStore();
    vi.clearAllMocks();
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.deals).toEqual([]);
      expect(store.currentDeal).toBeNull();
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
    it('dealsByStage should group deals by stage', () => {
      store.deals = [
        mockDeal({ id: 'deal-1', stage: 'PROGRESS' }),
        mockDeal({ id: 'deal-2', stage: 'PROGRESS' }),
        mockDeal({ id: 'deal-3', stage: 'CLOSED' })
      ] as any;

      const grouped = store.dealsByStage;
      expect(grouped.PROGRESS).toHaveLength(2);
      expect(grouped.CLOSED).toHaveLength(1);
    });

    it('totalDeals should return pagination total', () => {
      store.pagination.total = 99;
      expect(store.totalDeals).toBe(99);
    });

    it('totalValue should sum all deal prices', () => {
      store.deals = [
        mockDeal({ id: 'deal-1', price: 5000 }),
        mockDeal({ id: 'deal-2', price: 3000 }),
        mockDeal({ id: 'deal-3', price: 2000 })
      ] as any;

      expect(store.totalValue).toBe(10000);
    });

    it('totalValue should handle deals with no price', () => {
      store.deals = [
        mockDeal({ id: 'deal-1', price: 5000 }),
        mockDeal({ id: 'deal-2', price: 0 }),
        mockDeal({ id: 'deal-3', price: undefined })
      ] as any;

      expect(store.totalValue).toBe(5000);
    });
  });

  // ============================================
  // Actions
  // ============================================
  describe('fetchDeals', () => {
    it('should fetch deals and update state on success', async () => {
      const deals = [mockDeal({ id: 'deal-1' }), mockDeal({ id: 'deal-2' })];
      const pagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: { docs: deals, pagination }
      });

      await store.fetchDeals();

      expect(globalThis.useApiFetch).toHaveBeenCalledWith('deal');
      expect(store.deals).toEqual(deals);
      expect(store.pagination).toEqual(pagination);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should set error on API failure response', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: false,
        message: 'Access denied'
      });

      await store.fetchDeals();

      expect(store.deals).toEqual([]);
      expect(store.error).toBe('Access denied');
      expect(store.loading).toBe(false);
    });

    it('should set error on thrown exception', async () => {
      (globalThis.useApiFetch as any).mockRejectedValue(new Error('Connection timeout'));

      await store.fetchDeals();

      expect(store.error).toBe('Connection timeout');
      expect(store.loading).toBe(false);
    });
  });

  describe('createDeal', () => {
    it('should create a deal and prepend it to the list', async () => {
      const newDeal = mockDeal({ id: 'deal-new', name: 'New Deal' });

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: newDeal
      });

      store.deals = [mockDeal({ id: 'deal-existing' })] as any;
      const result = await store.createDeal({ name: 'New Deal', price: 10000 });

      expect(result).toEqual(newDeal);
      expect(store.deals[0]).toEqual(newDeal);
      expect(store.deals).toHaveLength(2);
      expect(globalThis.useApiFetch).toHaveBeenCalledWith('deal', 'POST', { name: 'New Deal', price: 10000 });
    });

    it('should return null and set error on failure', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: false,
        message: 'Price is required'
      });

      const result = await store.createDeal({ name: 'Bad Deal' });

      expect(result).toBeNull();
      expect(store.error).toBe('Price is required');
    });
  });

  describe('updateDeal', () => {
    it('should update an existing deal in the list', async () => {
      const updated = mockDeal({ id: 'deal-1', name: 'Updated Deal', price: 20000 });
      store.deals = [mockDeal({ id: 'deal-1' })] as any;

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: updated
      });

      const result = await store.updateDeal('deal-1', { name: 'Updated Deal', price: 20000 });

      expect(result).toEqual(updated);
      expect(store.deals[0]!.name).toBe('Updated Deal');
    });

    it('should also update currentDeal if it matches', async () => {
      const original = mockDeal({ id: 'deal-1', name: 'Original' });
      const updated = mockDeal({ id: 'deal-1', name: 'Updated' });

      store.deals = [original] as any;
      store.currentDeal = original as any;

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: updated
      });

      await store.updateDeal('deal-1', { name: 'Updated' });

      expect(store.currentDeal!.name).toBe('Updated');
    });
  });

  describe('deleteDeal', () => {
    it('should remove deal from list on success', async () => {
      store.deals = [mockDeal({ id: 'deal-1' }), mockDeal({ id: 'deal-2' })] as any;

      (globalThis.useApiFetch as any).mockResolvedValue({ success: true });

      const result = await store.deleteDeal('deal-1');

      expect(result).toBe(true);
      expect(store.deals).toHaveLength(1);
      expect(store.deals[0]!.id).toBe('deal-2');
    });

    it('should clear currentDeal if deleted deal matches', async () => {
      const deal = mockDeal({ id: 'deal-1' });
      store.deals = [deal] as any;
      store.currentDeal = deal as any;

      (globalThis.useApiFetch as any).mockResolvedValue({ success: true });

      await store.deleteDeal('deal-1');

      expect(store.currentDeal).toBeNull();
    });

    it('should return false on failure', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: false,
        message: 'Cannot delete'
      });

      const result = await store.deleteDeal('deal-nonexistent');

      expect(result).toBe(false);
      expect(store.error).toBe('Cannot delete');
    });
  });
});
