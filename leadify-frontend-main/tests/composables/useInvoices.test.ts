/**
 * useInvoices - Comprehensive Unit Tests
 * ========================================
 * Tests for composables/useInvoices.ts
 * Covers: fetchInvoices, fetchInvoiceById, markCollected, markUncollected,
 *         fetchInvoiceSummary, downloadInvoicePdf
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

import {
  fetchInvoices,
  fetchInvoiceById,
  markCollected,
  markUncollected,
  fetchInvoiceSummary,
  downloadInvoicePdf,
  type InvoiceItem,
  type InvoiceSummary
} from '@/composables/useInvoices';

// ============================================
// Global mocks required by the composable
// ============================================
const mockUseApiFetch = vi.fn();
const mockElNotification = vi.fn();
const mockFetch = vi.fn();

// Mock element-plus to intercept the import { ElNotification } in useInvoices.ts
vi.mock('element-plus', () => ({
  ElNotification: (...args: unknown[]) => mockElNotification(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = mockUseApiFetch;
(globalThis as Record<string, unknown>).ElNotification = mockElNotification;
(globalThis as Record<string, unknown>).useI18n = () => ({ t: (key: string) => key, locale: ref('en') });
(globalThis as Record<string, unknown>).useRuntimeConfig = () => ({ public: { API_BASE_URL: 'http://localhost:3001/api/v1/' } });
(globalThis as unknown).$fetch = mockFetch;

describe('useInvoices composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset useI18n for each test
    (globalThis as Record<string, unknown>).useI18n = () => ({ t: (key: string) => key, locale: ref('en') });
  });

  // ============================================
  // fetchInvoices
  // ============================================
  describe('fetchInvoices', () => {
    it('should fetch invoices with default parameters', async () => {
      const mockBody = {
        docs: [{ id: 1, invoiceNumber: 'INV-001', amount: 5000, collected: false, dealId: 'deal-1' }],
        pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 }
      };

      mockUseApiFetch.mockResolvedValueOnce({ body: mockBody, success: true });

      const result = await fetchInvoices();

      expect(mockUseApiFetch).toHaveBeenCalledWith('invoices?');
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].invoiceNumber).toBe('INV-001');
      expect(result.pagination.totalItems).toBe(1);
    });

    it('should pass page and limit query parameters', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: { docs: [], pagination: { page: 2, limit: 10, totalItems: 15, totalPages: 2 } },
        success: true
      });

      await fetchInvoices({ page: 2, limit: 10 });

      const calledUrl = mockUseApiFetch.mock.calls[0][0];
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=10');
    });

    it('should pass status filter parameter', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } },
        success: true
      });

      await fetchInvoices({ status: 'collected' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0];
      expect(calledUrl).toContain('status=collected');
    });

    it('should pass search parameter', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } },
        success: true
      });

      await fetchInvoices({ search: 'INV-001' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0];
      expect(calledUrl).toContain('search=INV-001');
    });

    it('should pass all query parameters together', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: { docs: [], pagination: { page: 1, limit: 5, totalItems: 0, totalPages: 0 } },
        success: true
      });

      await fetchInvoices({ page: 3, limit: 5, status: 'pending', search: 'acme' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0];
      expect(calledUrl).toContain('page=3');
      expect(calledUrl).toContain('limit=5');
      expect(calledUrl).toContain('status=pending');
      expect(calledUrl).toContain('search=acme');
    });

    it('should return empty docs and default pagination on failure', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ body: null, success: false });

      const result = await fetchInvoices();

      expect(result.docs).toEqual([]);
      expect(result.pagination).toEqual({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });
    });

    it('should return empty docs when body is null', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ body: null, success: true });

      const result = await fetchInvoices();

      expect(result.docs).toEqual([]);
    });

    it('should not include falsy query params', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } },
        success: true
      });

      await fetchInvoices({ page: 0, limit: 0, status: '', search: '' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0];
      // page=0 and limit=0 are falsy, so they should not be included
      expect(calledUrl).not.toContain('page=');
      expect(calledUrl).not.toContain('limit=');
      expect(calledUrl).not.toContain('status=');
      expect(calledUrl).not.toContain('search=');
    });
  });

  // ============================================
  // fetchInvoiceById
  // ============================================
  describe('fetchInvoiceById', () => {
    it('should fetch a single invoice by ID', async () => {
      const mockInvoice: InvoiceItem = {
        id: 1,
        invoiceNumber: 'INV-001',
        amount: 5000,
        collected: false,
        dealId: 'deal-1'
      };

      mockUseApiFetch.mockResolvedValueOnce({ body: mockInvoice, success: true });

      const result = await fetchInvoiceById(1);

      expect(mockUseApiFetch).toHaveBeenCalledWith('invoices/1');
      expect(result).toEqual(mockInvoice);
      expect(result?.invoiceNumber).toBe('INV-001');
    });

    it('should return null when invoice not found', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ body: null, success: false });

      const result = await fetchInvoiceById(999);

      expect(result).toBeNull();
    });

    it('should return null when body is null even with success', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ body: null, success: true });

      const result = await fetchInvoiceById(1);

      expect(result).toBeNull();
    });

    it('should return invoice with deal information', async () => {
      const mockInvoice: InvoiceItem = {
        id: 2,
        invoiceNumber: 'INV-002',
        amount: 10000,
        collected: true,
        collectedDate: '2024-01-15',
        dealId: 'deal-2',
        deal: { id: 'deal-2', name: 'Big Deal' }
      };

      mockUseApiFetch.mockResolvedValueOnce({ body: mockInvoice, success: true });

      const result = await fetchInvoiceById(2);

      expect(result?.deal?.name).toBe('Big Deal');
      expect(result?.collected).toBe(true);
    });
  });

  // ============================================
  // markCollected
  // ============================================
  describe('markCollected', () => {
    it('should mark an invoice as collected with date', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'Collected' });

      await markCollected(1, '2024-03-01');

      expect(mockUseApiFetch).toHaveBeenCalledWith('invoices/1/collect', 'PUT', { collectedDate: '2024-03-01' });
    });

    it('should mark invoice as collected without date', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'OK' });

      await markCollected(5);

      expect(mockUseApiFetch).toHaveBeenCalledWith('invoices/5/collect', 'PUT', { collectedDate: undefined });
    });

    it('should return the API response', async () => {
      const mockResponse = { success: true, body: { collected: true }, message: 'OK', code: 200 };
      mockUseApiFetch.mockResolvedValueOnce(mockResponse);

      const result = await markCollected(1, '2024-01-01');

      expect(result).toEqual(mockResponse);
    });
  });

  // ============================================
  // markUncollected
  // ============================================
  describe('markUncollected', () => {
    it('should mark an invoice as uncollected', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'Uncollected' });

      await markUncollected(3);

      expect(mockUseApiFetch).toHaveBeenCalledWith('invoices/3/uncollect', 'PUT');
    });

    it('should return the API response', async () => {
      const mockResponse = { success: true, body: { collected: false }, message: 'OK', code: 200 };
      mockUseApiFetch.mockResolvedValueOnce(mockResponse);

      const result = await markUncollected(3);

      expect(result).toEqual(mockResponse);
    });
  });

  // ============================================
  // fetchInvoiceSummary
  // ============================================
  describe('fetchInvoiceSummary', () => {
    it('should fetch invoice summary successfully', async () => {
      const mockSummary: InvoiceSummary = {
        totalInvoices: 50,
        totalAmount: 500000,
        collectedAmount: 350000,
        pendingAmount: 150000,
        collectedCount: 35,
        pendingCount: 15
      };

      mockUseApiFetch.mockResolvedValueOnce({ body: mockSummary, success: true });

      const result = await fetchInvoiceSummary();

      expect(mockUseApiFetch).toHaveBeenCalledWith('invoices/summary');
      expect(result.totalInvoices).toBe(50);
      expect(result.totalAmount).toBe(500000);
      expect(result.collectedAmount).toBe(350000);
      expect(result.pendingAmount).toBe(150000);
      expect(result.collectedCount).toBe(35);
      expect(result.pendingCount).toBe(15);
    });

    it('should return zero-value summary on failure', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ body: null, success: false });

      const result = await fetchInvoiceSummary();

      expect(result).toEqual({
        totalInvoices: 0,
        totalAmount: 0,
        collectedAmount: 0,
        pendingAmount: 0,
        collectedCount: 0,
        pendingCount: 0
      });
    });

    it('should return zero-value summary when body is null', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ body: null, success: true });

      const result = await fetchInvoiceSummary();

      expect(result.totalInvoices).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });

  // ============================================
  // downloadInvoicePdf
  // ============================================
  describe('downloadInvoicePdf', () => {
    let mockCreateObjectURL: unknown;
    let mockRevokeObjectURL: unknown;
    let mockCreateElement: unknown;
    let mockAppendChild: unknown;
    let mockRemoveChild: unknown;
    let mockLink: unknown;

    beforeEach(() => {
      mockCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake-url');
      mockRevokeObjectURL = vi.fn();
      mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      mockCreateElement = vi.fn().mockReturnValue(mockLink);
      mockAppendChild = vi.fn();
      mockRemoveChild = vi.fn();

      // Mock DOM APIs
      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;
      globalThis.document.createElement = mockCreateElement;
      globalThis.document.body.appendChild = mockAppendChild;
      globalThis.document.body.removeChild = mockRemoveChild;
    });

    it('should download invoice PDF successfully', async () => {
      const fakeBlob = new Blob(['fake pdf data'], { type: 'application/pdf' });
      mockFetch.mockResolvedValueOnce(fakeBlob);

      const result = await downloadInvoicePdf(1, 'INV-001');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/invoices/1/pdf',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          responseType: 'blob'
        })
      );
      expect(result).toBe(true);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(fakeBlob);
      expect(mockLink.download).toBe('Invoice-INV-001.pdf');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should use ID in filename when invoiceNumber is not provided', async () => {
      const fakeBlob = new Blob(['data']);
      mockFetch.mockResolvedValueOnce(fakeBlob);

      await downloadInvoicePdf(42);

      expect(mockLink.download).toBe('Invoice-42.pdf');
    });

    it('should return false and show error notification on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'));

      const result = await downloadInvoicePdf(1);

      expect(result).toBe(false);
      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('should clean up DOM elements after download', async () => {
      const fakeBlob = new Blob(['data']);
      mockFetch.mockResolvedValueOnce(fakeBlob);

      await downloadInvoicePdf(1);

      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should construct correct URL using runtime config', async () => {
      const fakeBlob = new Blob(['data']);
      mockFetch.mockResolvedValueOnce(fakeBlob);

      await downloadInvoicePdf(99);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/v1/invoices/99/pdf', expect.any(Object));
    });
  });

  // ============================================
  // InvoiceItem interface
  // ============================================
  describe('InvoiceItem interface', () => {
    it('should create valid InvoiceItem object', () => {
      const invoice: InvoiceItem = {
        id: 1,
        invoiceNumber: 'INV-2024-001',
        amount: 25000,
        collected: false,
        dealId: 'deal-1'
      };

      expect(invoice.id).toBe(1);
      expect(invoice.invoiceNumber).toBe('INV-2024-001');
      expect(invoice.amount).toBe(25000);
      expect(invoice.collected).toBe(false);
    });

    it('should support optional fields', () => {
      const invoice: InvoiceItem = {
        id: 2,
        invoiceNumber: 'INV-2024-002',
        amount: 15000,
        invoiceDate: '2024-01-01',
        collected: true,
        collectedDate: '2024-01-15',
        dealId: 'deal-2',
        deal: { id: 'deal-2', name: 'Big Deal' }
      };

      expect(invoice.invoiceDate).toBe('2024-01-01');
      expect(invoice.collectedDate).toBe('2024-01-15');
      expect(invoice.deal?.name).toBe('Big Deal');
    });
  });

  // ============================================
  // InvoiceSummary interface
  // ============================================
  describe('InvoiceSummary interface', () => {
    it('should create valid InvoiceSummary object', () => {
      const summary: InvoiceSummary = {
        totalInvoices: 100,
        totalAmount: 1000000,
        collectedAmount: 750000,
        pendingAmount: 250000,
        collectedCount: 75,
        pendingCount: 25
      };

      expect(summary.totalInvoices).toBe(100);
      expect(summary.collectedAmount + summary.pendingAmount).toBe(summary.totalAmount);
      expect(summary.collectedCount + summary.pendingCount).toBe(summary.totalInvoices);
    });
  });
});
