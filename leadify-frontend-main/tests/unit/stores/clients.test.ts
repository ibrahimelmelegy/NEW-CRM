/**
 * useClientStore - Unit Tests
 * ============================
 * Tests for stores/clients.ts Pinia store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useClientStore } from '@/stores/clients';

// Mock useApiFetch globally
globalThis.useApiFetch = vi.fn();

// Mock useI18n
globalThis.useI18n = () => ({ t: (key: string) => key, locale: ref('en') });

const mockClient = (overrides: Record<string, unknown> = {}) => ({
  id: 'client-1',
  clientName: 'Test Client',
  email: 'client@example.com',
  phoneNumber: '+1234567890',
  companyName: 'Client Corp',
  clientStatus: 'ACTIVE',
  industry: 'Information Technology (IT) & Software',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
});

describe('useClientStore', () => {
  let store: ReturnType<typeof useClientStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useClientStore();
    vi.clearAllMocks();
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.clients).toEqual([]);
      expect(store.currentClient).toBeNull();
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
    it('activeClients should filter clients by ACTIVE status', () => {
      store.clients = [
        mockClient({ id: 'client-1', clientStatus: 'ACTIVE' }),
        mockClient({ id: 'client-2', clientStatus: 'INACTIVE' }),
        mockClient({ id: 'client-3', clientStatus: 'ACTIVE' })
      ] as any;

      expect(store.activeClients).toHaveLength(2);
      expect(store.activeClients.every((c: any) => c.clientStatus === 'ACTIVE')).toBe(true);
    });

    it('clientsByIndustry should group clients by industry', () => {
      store.clients = [
        mockClient({ id: 'client-1', industry: 'Healthcare & Medical Services' }),
        mockClient({ id: 'client-2', industry: 'Healthcare & Medical Services' }),
        mockClient({ id: 'client-3', industry: 'Education & E-Learning' })
      ] as any;

      const grouped = store.clientsByIndustry;
      expect(grouped['Healthcare & Medical Services']).toHaveLength(2);
      expect(grouped['Education & E-Learning']).toHaveLength(1);
    });

    it('clientsByIndustry should skip clients without industry', () => {
      store.clients = [
        mockClient({ id: 'client-1', industry: 'Banking & Financial Services' }),
        mockClient({ id: 'client-2', industry: undefined })
      ] as any;

      const grouped = store.clientsByIndustry;
      expect(grouped['Banking & Financial Services']).toHaveLength(1);
      expect(Object.keys(grouped)).toHaveLength(1);
    });
  });

  // ============================================
  // Actions
  // ============================================
  describe('fetchClients', () => {
    it('should fetch clients and update state on success', async () => {
      const clients = [mockClient({ id: 'client-1' }), mockClient({ id: 'client-2' })];
      const pagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: { docs: clients, pagination }
      });

      await store.fetchClients();

      expect(globalThis.useApiFetch).toHaveBeenCalledWith('client');
      expect(store.clients).toEqual(clients);
      expect(store.pagination).toEqual(pagination);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should set error on API failure response', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: false,
        message: 'Forbidden'
      });

      await store.fetchClients();

      expect(store.clients).toEqual([]);
      expect(store.error).toBe('Forbidden');
      expect(store.loading).toBe(false);
    });

    it('should set error on thrown exception', async () => {
      (globalThis.useApiFetch as any).mockRejectedValue(new Error('Server unreachable'));

      await store.fetchClients();

      expect(store.error).toBe('Server unreachable');
      expect(store.loading).toBe(false);
    });
  });

  describe('createClient', () => {
    it('should create a client and prepend it to the list', async () => {
      const newClient = mockClient({ id: 'client-new', clientName: 'New Client' });

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: newClient
      });

      store.clients = [mockClient({ id: 'client-existing' })] as any;
      const result = await store.createClient({ clientName: 'New Client' });

      expect(result).toEqual(newClient);
      expect(store.clients[0]).toEqual(newClient);
      expect(store.clients).toHaveLength(2);
    });

    it('should return null and set error on failure', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: false,
        message: 'Email already exists'
      });

      const result = await store.createClient({ clientName: 'Bad Client' });

      expect(result).toBeNull();
      expect(store.error).toBe('Email already exists');
    });
  });

  describe('updateClient', () => {
    it('should update an existing client in the list and currentClient', async () => {
      const original = mockClient({ id: 'client-1', clientName: 'Original' });
      const updated = mockClient({ id: 'client-1', clientName: 'Updated' });

      store.clients = [original] as any;
      store.currentClient = original as any;

      (globalThis.useApiFetch as any).mockResolvedValue({
        success: true,
        body: updated
      });

      const result = await store.updateClient('client-1', { clientName: 'Updated' });

      expect(result).toEqual(updated);
      expect(store.clients[0].clientName).toBe('Updated');
      expect(store.currentClient!.clientName).toBe('Updated');
    });
  });

  describe('deleteClient', () => {
    it('should remove client from list and clear currentClient on success', async () => {
      const client = mockClient({ id: 'client-1' });
      store.clients = [client, mockClient({ id: 'client-2' })] as any;
      store.currentClient = client as any;

      (globalThis.useApiFetch as any).mockResolvedValue({ success: true });

      const result = await store.deleteClient('client-1');

      expect(result).toBe(true);
      expect(store.clients).toHaveLength(1);
      expect(store.clients[0].id).toBe('client-2');
      expect(store.currentClient).toBeNull();
    });

    it('should return false on delete failure', async () => {
      (globalThis.useApiFetch as any).mockResolvedValue({
        success: false,
        message: 'Cannot delete client with active deals'
      });

      const result = await store.deleteClient('client-1');

      expect(result).toBe(false);
      expect(store.error).toBe('Cannot delete client with active deals');
    });
  });
});
