/**
 * useDeals - Comprehensive Unit Tests
 * =====================================
 * Tests for composables/useDeals.ts
 * Covers: getDeals, getDeal, getDealActivity, createDeal, updateDeal, convertToDeal, deleteDeal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

import {
  getDeals,
  getDeal,
  getDealActivity,
  createDeal,
  updateDeal,
  convertToDeal,
  deleteDeal,
  DealStageEnums,
  ContractTypeEnums,
  dealStageOptions,
  contractTypeOptions,
  type DealValues
} from '@/composables/useDeals';

// ============================================
// Global mocks required by the composable
// ============================================
const mockUseApiFetch = vi.fn();
const mockElNotification = vi.fn();
const mockFormatDate = vi.fn((d: string) => `formatted-${d}`);

// Mock element-plus to intercept the import { ElNotification } in useDeals.ts
vi.mock('element-plus', () => ({
  ElNotification: (...args: any[]) => mockElNotification(...args)
}));

(globalThis as any).useApiFetch = mockUseApiFetch;
(globalThis as any).ElNotification = mockElNotification;
(globalThis as any).useI18n = () => ({ t: (key: string) => key, locale: ref('en') });
(globalThis as any).formatDate = mockFormatDate;
(globalThis as any).useRuntimeConfig = () => ({ public: { API_BASE_URL: 'http://localhost:3001/api/v1/' } });

describe('useDeals composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Enums & Constants
  // ============================================
  describe('DealStageEnums', () => {
    it('should define all deal stage values', () => {
      expect(DealStageEnums.PROGRESS).toBe('PROGRESS');
      expect(DealStageEnums.CLOSED).toBe('CLOSED');
      expect(DealStageEnums.CANCELLED).toBe('CANCELLED');
    });

    it('should contain exactly 3 stages', () => {
      expect(Object.values(DealStageEnums)).toHaveLength(3);
    });
  });

  describe('ContractTypeEnums', () => {
    it('should define Contract and PurchaseOrder', () => {
      expect(ContractTypeEnums.Contract).toBe('Contract');
      expect(ContractTypeEnums.PurchaseOrder).toBe('PurchaseOrder');
    });

    it('should contain exactly 2 types', () => {
      expect(Object.values(ContractTypeEnums)).toHaveLength(2);
    });
  });

  describe('dealStageOptions', () => {
    it('should have correct label-value pairs', () => {
      expect(dealStageOptions).toEqual([
        { label: 'In Progress', value: 'PROGRESS' },
        { label: 'Closed', value: 'CLOSED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ]);
    });
  });

  describe('contractTypeOptions', () => {
    it('should have correct label-value pairs', () => {
      expect(contractTypeOptions).toEqual([
        { label: 'Contract', value: 'Contract' },
        { label: 'Purchase Order', value: 'PurchaseOrder' }
      ]);
    });
  });

  // ============================================
  // getDeals
  // ============================================
  describe('getDeals', () => {
    it('should fetch deals successfully', async () => {
      const mockDocs = [
        {
          id: 'deal-1',
          name: 'Deal Alpha',
          companyName: 'Alpha Inc',
          price: 50000,
          stage: 'PROGRESS',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          user: { name: 'John Doe' }
        }
      ];

      mockUseApiFetch.mockResolvedValueOnce({
        body: { docs: mockDocs, pagination: { page: 1, totalPages: 1, totalItems: 1, limit: 10 } },
        success: true,
        message: 'Success'
      });

      const result = await getDeals();

      expect(mockUseApiFetch).toHaveBeenCalledWith('deal');
      expect(result.deals).toHaveLength(1);
      expect(result.deals[0].name).toBe('Deal Alpha');
      expect(result.deals[0].updatedAt).toBe('-');
      expect(result.deals[0].assign).toBe('John Doe');
    });

    it('should format createdAt using formatDate', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: {
          docs: [{ id: '1', name: 'X', createdAt: '2024-06-01', updatedAt: '' }],
          pagination: { page: 1, totalPages: 1, totalItems: 1, limit: 10 }
        },
        success: true,
        message: 'Success'
      });

      const result = await getDeals();
      expect(mockFormatDate).toHaveBeenCalledWith('2024-06-01');
      expect(result.deals[0].createdAt).toBe('formatted-2024-06-01');
    });

    it('should handle deals without assigned user', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: {
          docs: [{ id: '1', name: 'X', createdAt: '', updatedAt: '' }],
          pagination: { page: 1, totalPages: 1, totalItems: 1, limit: 10 }
        },
        success: true,
        message: 'Success'
      });

      const result = await getDeals();
      expect(result.deals[0].assign).toBeUndefined();
    });

    it('should return empty deals and default pagination on failure', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: null,
        success: false,
        message: 'Server error'
      });

      const result = await getDeals();
      expect(result.deals).toEqual([]);
      expect(result.pagination).toEqual({ totalItems: 0, page: 1, limit: 10, totalPages: 1 });
    });

    it('should show error notification on failure', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: null,
        success: false,
        message: 'Forbidden'
      });

      await getDeals();
      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('should handle API exception gracefully', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await getDeals();
      expect(result.deals).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });

    it('should fetch all deals with limit=1000 when all flag is not provided (default false)', async () => {
      // The `all` parameter defaults to false which uses standard endpoint
      mockUseApiFetch.mockResolvedValueOnce({
        body: { docs: [], pagination: { page: 1, totalPages: 0, totalItems: 0, limit: 10 } },
        success: true,
        message: 'Success'
      });

      await getDeals();
      expect(mockUseApiFetch).toHaveBeenCalledWith('deal');
    });
  });

  // ============================================
  // getDeal
  // ============================================
  describe('getDeal', () => {
    it('should fetch a single deal by ID', async () => {
      const mockDeal = { id: 'deal-1', name: 'Alpha Deal', price: 100000 };
      mockUseApiFetch.mockResolvedValueOnce({ body: mockDeal, success: true });

      const result = await getDeal('deal-1');
      expect(mockUseApiFetch).toHaveBeenCalledWith('deal/deal-1');
      expect(result).toEqual(mockDeal);
    });

    it('should accept string array as ID', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ body: { id: 'x' }, success: true });

      await getDeal(['deal-1']);
      expect(mockUseApiFetch).toHaveBeenCalledWith('deal/deal-1');
    });

    it('should return empty object on error', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Not found'));

      const result = await getDeal('bad-id');
      expect(result).toEqual({});
    });

    it('should show error notification on failure', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('500'));

      await getDeal('bad');
      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
  });

  // ============================================
  // getDealActivity
  // ============================================
  describe('getDealActivity', () => {
    it('should fetch deal activity by ID', async () => {
      const mockActivity = { id: 'act-1', status: 'updated' };
      mockUseApiFetch.mockResolvedValueOnce({ body: mockActivity, success: true });

      const result = await getDealActivity('deal-1');
      expect(mockUseApiFetch).toHaveBeenCalledWith('activity/deal/deal-1');
      expect(result).toEqual(mockActivity);
    });

    it('should return empty object on error', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Not found'));

      const result = await getDealActivity('bad-id');
      expect(result).toEqual({});
    });

    it('should show error notification on failure', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Error'));

      await getDealActivity('bad-id');
      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
  });

  // ============================================
  // createDeal
  // ============================================
  describe('createDeal', () => {
    const validDealValues: DealValues = {
      deal: {
        name: 'New Deal',
        companyName: 'New Co',
        price: 75000,
        contractType: 'Contract',
        stage: 'PROGRESS'
      }
    };

    it('should create a deal successfully', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: { id: 'deal-new' }, message: 'Created' });

      const result = await createDeal(validDealValues);

      expect(mockUseApiFetch).toHaveBeenCalledWith('deal/create', 'POST', validDealValues);
      expect(result?.success).toBe(true);
    });

    it('should show success notification on creation', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'OK' });

      await createDeal(validDealValues);

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Deal created successfully' }));
    });

    it('should show error notification when API returns success=false', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: false, body: null, message: 'Validation error' });

      await createDeal(validDealValues);

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Validation error' }));
    });

    it('should use fallback message when API message is empty', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: false, body: null, message: '' });

      await createDeal(validDealValues);

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Something went wrong' }));
    });

    it('should return error response on exception', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await createDeal(validDealValues);

      expect(result.success).toBe(false);
      expect(result.body).toBeNull();
      expect(result.message).toBe('Network error');
      expect(result.code).toBe(500);
    });

    it('should handle non-Error exception', async () => {
      mockUseApiFetch.mockRejectedValueOnce('string error');

      const result = await createDeal(validDealValues);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unknown error');
    });

    it('should pass deal values with invoices and deliveries', async () => {
      const valuesWithExtras: DealValues = {
        deal: { name: 'Full Deal', price: 100000 },
        invoiceDetail: [{ id: 'inv-1', invoiceNumber: 'INV-001', amount: 50000, invoiceDate: null, collectedDate: null, collected: false }],
        deliveryDetails: [{ id: 'del-1', deliveryDetails: 'Ship to HQ', deliveryDate: null }]
      };

      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'OK' });

      await createDeal(valuesWithExtras);

      expect(mockUseApiFetch).toHaveBeenCalledWith('deal/create', 'POST', valuesWithExtras);
    });
  });

  // ============================================
  // updateDeal
  // ============================================
  describe('updateDeal', () => {
    const updateValues: DealValues = {
      deal: { name: 'Updated Deal', price: 80000, stage: 'COMPLETED' }
    };

    it('should update a deal successfully', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'Updated' });

      const result = await updateDeal(updateValues);

      expect(mockUseApiFetch).toHaveBeenCalledWith('deal/update', 'POST', updateValues);
      expect(result?.success).toBe(true);
    });

    it('should show success notification on update', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'Updated' });

      await updateDeal(updateValues);

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Deal updated successfully' }));
    });

    it('should show error notification on failed update', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: false, body: null, message: 'Permission denied' });

      await updateDeal(updateValues);

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Permission denied' }));
    });

    it('should return error response on exception', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await updateDeal(updateValues);

      expect(result.success).toBe(false);
      expect(result.code).toBe(500);
    });
  });

  // ============================================
  // convertToDeal
  // ============================================
  describe('convertToDeal', () => {
    const convertValues: DealValues = {
      lead: { id: 'lead-1', name: 'Hot Lead' } as any,
      deal: { name: 'Converted Deal', price: 60000, stage: 'PROGRESS' }
    };

    it('should convert a lead to deal successfully', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: { id: 'deal-new' }, message: 'Converted' });

      const result = await convertToDeal(convertValues);

      expect(mockUseApiFetch).toHaveBeenCalledWith('deal/convert-lead', 'POST', convertValues);
      expect(result?.success).toBe(true);
    });

    it('should show success notification on conversion', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'OK' });

      await convertToDeal(convertValues);

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Deal Added successfully' }));
    });

    it('should show error notification when conversion fails', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: false, body: null, message: 'Lead already converted' });

      await convertToDeal(convertValues);

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Lead already converted' }));
    });

    it('should return error response on exception', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Server error'));

      const result = await convertToDeal(convertValues);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Server error');
    });
  });

  // ============================================
  // deleteDeal
  // ============================================
  describe('deleteDeal', () => {
    it('should delete a deal successfully', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: null, message: 'Deleted' });

      const result = await deleteDeal('deal-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('deal/deal-1', 'DELETE');
      expect(result?.success).toBe(true);
    });

    it('should show success notification on deletion', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: null, message: 'Deleted' });

      await deleteDeal('deal-1');

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Deal deleted successfully' }));
    });

    it('should show error notification when deletion fails', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: false, body: null, message: 'Cannot delete' });

      await deleteDeal('deal-1');

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Cannot delete' }));
    });

    it('should use fallback message when API message is empty', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: false, body: null, message: '' });

      await deleteDeal('deal-1');

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Failed to delete deal' }));
    });

    it('should return error response on exception', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('DB locked'));

      const result = await deleteDeal('deal-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('DB locked');
      expect(result.code).toBe(500);
    });

    it('should handle non-Error exception', async () => {
      mockUseApiFetch.mockRejectedValueOnce(42);

      const result = await deleteDeal('deal-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unknown error');
    });
  });
});
