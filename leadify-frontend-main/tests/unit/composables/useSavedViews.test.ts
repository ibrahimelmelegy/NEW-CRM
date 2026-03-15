/**
 * useSavedViews - Unit Tests
 * ============================
 * Tests for composables/useSavedViews.ts
 *
 * The module provides:
 * - fetchSavedViews, createSavedView, updateSavedView
 * - deleteSavedView, setDefaultView
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { fetchSavedViews, createSavedView, updateSavedView, deleteSavedView, setDefaultView, type SavedView } from '@/composables/useSavedViews';

// ============================================
// Mock useApiFetch
// ============================================
const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

describe('useSavedViews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchSavedViews
  // ============================================
  describe('fetchSavedViews', () => {
    it('should fetch saved views for the given entity type', async () => {
      const mockViews: SavedView[] = [
        { id: 1, name: 'Active Leads', entityType: 'lead', filters: { status: 'NEW' }, userId: 1 },
        { id: 2, name: 'My Leads', entityType: 'lead', filters: { assignedTo: 'me' }, userId: 1 }
      ];

      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockViews },
        success: true
      });

      const result = await fetchSavedViews('lead');

      expect(mockUseApiFetch).toHaveBeenCalledWith('saved-views/lead');
      expect(result).toEqual(mockViews);
    });

    it('should return array directly when not wrapped in docs', async () => {
      const mockViews: SavedView[] = [{ id: 1, name: 'View 1', entityType: 'deal', filters: {}, userId: 1 }];

      mockUseApiFetch.mockResolvedValue({
        body: mockViews,
        success: true
      });

      const result = await fetchSavedViews('deal');

      expect(result).toEqual(mockViews);
    });

    it('should return empty array when API call fails', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: null,
        success: false
      });

      const result = await fetchSavedViews('lead');

      expect(result).toEqual([]);
    });

    it('should use different entity types in endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      await fetchSavedViews('opportunity');

      expect(mockUseApiFetch).toHaveBeenCalledWith('saved-views/opportunity');
    });
  });

  // ============================================
  // createSavedView
  // ============================================
  describe('createSavedView', () => {
    it('should create a saved view with POST method', async () => {
      const newView = {
        name: 'Hot Leads',
        entityType: 'lead',
        filters: { status: 'QUALIFIED', priority: 'HIGH' },
        color: '#FF0000'
      };
      const mockCreated: SavedView = { id: 3, ...newView, userId: 1 };

      mockUseApiFetch.mockResolvedValue({ body: mockCreated, success: true });

      await createSavedView(newView);

      expect(mockUseApiFetch).toHaveBeenCalledWith('saved-views', 'POST', newView);
    });

    it('should return the created view on success', async () => {
      const newView = { name: 'Test View', entityType: 'deal', filters: {} };
      const mockCreated: SavedView = { id: 5, ...newView, userId: 1 };

      mockUseApiFetch.mockResolvedValue({ body: mockCreated, success: true });

      const result = await createSavedView(newView);

      expect(result).toEqual(mockCreated);
    });

    it('should return null when creation fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await createSavedView({ name: 'Test', entityType: 'lead', filters: {} });

      expect(result).toBeNull();
    });

    it('should create view with optional fields', async () => {
      const newView = {
        name: 'Sorted View',
        entityType: 'lead',
        filters: {},
        columns: ['name', 'email', 'status'],
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };

      mockUseApiFetch.mockResolvedValue({ body: { id: 6, ...newView, userId: 1 }, success: true });

      await createSavedView(newView);

      expect(mockUseApiFetch).toHaveBeenCalledWith('saved-views', 'POST', newView);
    });
  });

  // ============================================
  // updateSavedView
  // ============================================
  describe('updateSavedView', () => {
    it('should update a saved view with PUT method and ID', async () => {
      const updateData: Partial<SavedView> = { name: 'Updated View', color: '#00FF00' };
      const mockUpdated: SavedView = { id: 1, name: 'Updated View', entityType: 'lead', filters: {}, color: '#00FF00', userId: 1 };

      mockUseApiFetch.mockResolvedValue({ body: mockUpdated, success: true });

      await updateSavedView(1, updateData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('saved-views/1', 'PUT', updateData);
    });

    it('should return the updated view on success', async () => {
      const mockUpdated: SavedView = { id: 2, name: 'Updated', entityType: 'deal', filters: {}, userId: 1 };

      mockUseApiFetch.mockResolvedValue({ body: mockUpdated, success: true });

      const result = await updateSavedView(2, { name: 'Updated' });

      expect(result).toEqual(mockUpdated);
    });

    it('should return null when update fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await updateSavedView(99, { name: 'Non-existent' });

      expect(result).toBeNull();
    });
  });

  // ============================================
  // deleteSavedView
  // ============================================
  describe('deleteSavedView', () => {
    it('should delete a saved view with correct ID and endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await deleteSavedView(1);

      expect(mockUseApiFetch).toHaveBeenCalledWith('saved-views/1', 'DELETE');
    });

    it('should return the API response', async () => {
      const response = { success: true, body: null };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await deleteSavedView(3);

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // setDefaultView
  // ============================================
  describe('setDefaultView', () => {
    it('should set default view with PATCH method', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await setDefaultView(1);

      expect(mockUseApiFetch).toHaveBeenCalledWith('saved-views/1/default', 'PATCH');
    });

    it('should return the API response', async () => {
      const response = { success: true, body: { id: 1, isDefault: true } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await setDefaultView(2);

      expect(result).toEqual(response);
    });

    it('should handle failure gracefully', async () => {
      const response = { success: false, message: 'Not found' };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await setDefaultView(99);

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // SavedView interface
  // ============================================
  describe('SavedView interface', () => {
    it('should create a valid SavedView object', () => {
      const view: SavedView = {
        id: 1,
        name: 'My View',
        entityType: 'lead',
        filters: { status: 'NEW' },
        columns: ['name', 'email'],
        sortBy: 'createdAt',
        sortOrder: 'desc',
        color: '#FF0000',
        isDefault: true,
        userId: 1
      };

      expect(view.id).toBe(1);
      expect(view.name).toBe('My View');
      expect(view.entityType).toBe('lead');
      expect(view.isDefault).toBe(true);
    });

    it('should allow optional fields', () => {
      const view: SavedView = {
        id: 2,
        name: 'Minimal View',
        entityType: 'deal',
        filters: {},
        userId: 1
      };

      expect(view.columns).toBeUndefined();
      expect(view.color).toBeUndefined();
      expect(view.isDefault).toBeUndefined();
    });
  });
});
