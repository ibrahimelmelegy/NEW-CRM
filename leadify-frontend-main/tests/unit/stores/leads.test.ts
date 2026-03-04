/**
 * useLeadStore - Unit Tests
 * ==========================
 * Tests for stores/leads.ts Pinia store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLeadStore } from '@/stores/leads';

// Mock useApiFetch globally
globalThis.useApiFetch = vi.fn();

// Mock useI18n
globalThis.useI18n = () => ({ t: (key: string) => key, locale: ref('en') });

const mockLead = (overrides: Record<string, unknown> = {}) => ({
  id: 'lead-1',
  name: 'Test Lead',
  companyName: 'Acme Corp',
  email: 'test@example.com',
  phone: '+1234567890',
  leadSource: 'WEBSITE',
  status: 'NEW',
  score: 50,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
});

describe('useLeadStore', () => {
  let store: ReturnType<typeof useLeadStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useLeadStore();
    vi.clearAllMocks();
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.leads).toEqual([]);
      expect(store.currentLead).toBeNull();
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
    it('leadsByStatus should group leads by their status', () => {
      store.leads = [
        mockLead({ id: 'lead-1', status: 'NEW' }),
        mockLead({ id: 'lead-2', status: 'NEW' }),
        mockLead({ id: 'lead-3', status: 'QUALIFIED' })
      ] as any;

      const grouped = store.leadsByStatus;
      expect(grouped.NEW).toHaveLength(2);
      expect(grouped.QUALIFIED).toHaveLength(1);
    });

    it('totalLeads should return pagination total', () => {
      store.pagination.total = 42;
      expect(store.totalLeads).toBe(42);
    });
  });

  // ============================================
  // Actions
  // ============================================
  describe('fetchLeads', () => {
    it('should fetch leads and update state on success', async () => {
      const leads = [mockLead({ id: 'lead-1' }), mockLead({ id: 'lead-2' })];
      const pagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: { docs: leads, pagination }
      });

      await store.fetchLeads();

      expect(globalThis.useApiFetch).toHaveBeenCalledWith('lead');
      expect(store.leads).toEqual(leads);
      expect(store.pagination).toEqual(pagination);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should set error on API failure response', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: false,
        message: 'Unauthorized'
      });

      await store.fetchLeads();

      expect(store.leads).toEqual([]);
      expect(store.error).toBe('Unauthorized');
      expect(store.loading).toBe(false);
    });

    it('should set error on thrown exception', async () => {
      (globalThis.useApiFetch as any).mockRejectedValue(new Error('Network error'));

      await store.fetchLeads();

      expect(store.error).toBe('Network error');
      expect(store.loading).toBe(false);
    });

    it('should pass query params to API call', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: { docs: [], pagination: { page: 2, limit: 10, total: 0, totalPages: 0 } }
      });

      await store.fetchLeads({ page: 2, limit: 10 } as any);

      const calledUrl = (globalThis.useApiFetch as any).mock.calls[0][0];
      expect(calledUrl).toContain('lead?');
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=10');
    });
  });

  describe('createLead', () => {
    it('should create a lead and prepend it to the list', async () => {
      const newLead = mockLead({ id: 'lead-new', name: 'New Lead' });

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: newLead
      });

      store.leads = [mockLead({ id: 'lead-existing' })] as any;
      const result = await store.createLead({ name: 'New Lead' });

      expect(result).toEqual(newLead);
      expect(store.leads[0]).toEqual(newLead);
      expect(store.leads).toHaveLength(2);
      expect(globalThis.useApiFetch).toHaveBeenCalledWith('lead', 'POST', { name: 'New Lead' });
    });

    it('should return null and set error on failure', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: false,
        message: 'Validation failed'
      });

      const result = await store.createLead({ name: '' });

      expect(result).toBeNull();
      expect(store.error).toBe('Validation failed');
    });
  });

  describe('updateLead', () => {
    it('should update an existing lead in the list', async () => {
      const updated = mockLead({ id: 'lead-1', name: 'Updated Lead' });
      store.leads = [mockLead({ id: 'lead-1' })] as any;

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: updated
      });

      const result = await store.updateLead('lead-1', { name: 'Updated Lead' });

      expect(result).toEqual(updated);
      expect(store.leads[0]!.name).toBe('Updated Lead');
    });

    it('should also update currentLead if it matches', async () => {
      const original = mockLead({ id: 'lead-1', name: 'Original' });
      const updated = mockLead({ id: 'lead-1', name: 'Updated' });

      store.leads = [original] as any;
      store.currentLead = original as any;

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: updated
      });

      await store.updateLead('lead-1', { name: 'Updated' });

      expect(store.currentLead!.name).toBe('Updated');
    });
  });

  describe('deleteLead', () => {
    it('should remove lead from list on success', async () => {
      store.leads = [mockLead({ id: 'lead-1' }), mockLead({ id: 'lead-2' })] as any;

      (globalThis.useApiFetch as any).mockResolvedValue({ success: true });

      const result = await store.deleteLead('lead-1');

      expect(result).toBe(true);
      expect(store.leads).toHaveLength(1);
      expect(store.leads[0]!.id).toBe('lead-2');
    });

    it('should clear currentLead if deleted lead matches', async () => {
      const lead = mockLead({ id: 'lead-1' });
      store.leads = [lead] as any;
      store.currentLead = lead as any;

      (globalThis.useApiFetch as any).mockResolvedValue({ success: true });

      await store.deleteLead('lead-1');

      expect(store.currentLead).toBeNull();
    });

    it('should return false on failure', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: false,
        message: 'Not found'
      });

      const result = await store.deleteLead('lead-nonexistent');

      expect(result).toBe(false);
      expect(store.error).toBe('Not found');
    });
  });
});
