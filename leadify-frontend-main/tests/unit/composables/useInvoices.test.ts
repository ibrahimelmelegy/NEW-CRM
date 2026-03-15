/**
 * useInvoices - Unit Tests
 * ==========================
 * Tests for composables/useInvoices.ts
 *
 * The module exports:
 * - fetchInvoices(query): Fetch invoices list with pagination
 * - fetchInvoiceById(id): Fetch single invoice
 * - markCollected(id, date?): Mark invoice as collected
 * - markUncollected(id): Mark invoice as uncollected
 * - fetchInvoiceSummary(): Get summary stats
 * - downloadInvoicePdf(id, invoiceNumber?): Download PDF
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchInvoices, fetchInvoiceById, markCollected, markUncollected, fetchInvoiceSummary, downloadInvoicePdf } from '~/composables/useInvoices';

// Mock useApiFetch globally
const mockApiFetch = vi.fn();
(globalThis as Record<string, unknown>).useApiFetch = mockApiFetch;

// Mock ElNotification
const mockNotification = vi.fn();
(globalThis as Record<string, unknown>).ElNotification = mockNotification;

vi.mock('element-plus', () => ({
  ElNotification: (...args: unknown[]) => mockNotification(...args)
}));

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockApiFetch(...args)
}));

// Mock $fetch for downloadInvoicePdf
(globalThis as Record<string, unknown>).$fetch = vi.fn();

// Mock document for PDF download
const mockLink = {
  href: '',
  download: '',
  click: vi.fn()
};
const mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(node => node);
const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(node => node);

describe('useInvoices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchInvoices
  // ============================================
  describe('fetchInvoices', () => {
    it('should call the correct API endpoint with no query params', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } } });

      await fetchInvoices();

      expect(mockApiFetch).toHaveBeenCalledWith('invoices?');
    });

    it('should include page parameter in query', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: [], pagination: { page: 2, limit: 20, totalItems: 0, totalPages: 0 } } });

      await fetchInvoices({ page: 2 });

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    });

    it('should include limit parameter in query', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: [], pagination: { page: 1, limit: 50, totalItems: 0, totalPages: 0 } } });

      await fetchInvoices({ limit: 50 });

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('limit=50'));
    });

    it('should include status filter in query', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: [], pagination: {} } });

      await fetchInvoices({ status: 'COLLECTED' });

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('status=COLLECTED'));
    });

    it('should include search term in query', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: [], pagination: {} } });

      await fetchInvoices({ search: 'INV-001' });

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('search=INV-001'));
    });

    it('should return docs and pagination on success', async () => {
      const docs = [{ id: 1, invoiceNumber: 'INV-001', amount: 1000, collected: false, dealId: 'deal-1' }];
      const pagination = { page: 1, limit: 20, totalItems: 1, totalPages: 1 };
      mockApiFetch.mockResolvedValue({ success: true, body: { docs, pagination } });

      const result = await fetchInvoices();

      expect(result.docs).toEqual(docs);
      expect(result.pagination).toEqual(pagination);
    });

    it('should return empty defaults on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, body: null });

      const result = await fetchInvoices();

      expect(result.docs).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.page).toBe(1);
    });

    it('should support all query parameters combined', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: [], pagination: {} } });

      await fetchInvoices({ page: 2, limit: 10, status: 'PENDING', search: 'client' });

      const callArg = mockApiFetch.mock.calls[0]?.[0] as string;
      expect(callArg).toContain('page=2');
      expect(callArg).toContain('limit=10');
      expect(callArg).toContain('status=PENDING');
      expect(callArg).toContain('search=client');
    });
  });

  // ============================================
  // fetchInvoiceById
  // ============================================
  describe('fetchInvoiceById', () => {
    it('should call the correct endpoint', async () => {
      const invoice = { id: 1, invoiceNumber: 'INV-001', amount: 500, collected: false, dealId: 'deal-1' };
      mockApiFetch.mockResolvedValue({ success: true, body: invoice });

      await fetchInvoiceById(1);

      expect(mockApiFetch).toHaveBeenCalledWith('invoices/1');
    });

    it('should return invoice on success', async () => {
      const invoice = { id: 1, invoiceNumber: 'INV-001', amount: 500, collected: false, dealId: 'deal-1' };
      mockApiFetch.mockResolvedValue({ success: true, body: invoice });

      const result = await fetchInvoiceById(1);

      expect(result).toEqual(invoice);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, body: null });

      const result = await fetchInvoiceById(999);

      expect(result).toBeNull();
    });

    it('should return null when body is null even on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: null });

      const result = await fetchInvoiceById(1);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // markCollected
  // ============================================
  describe('markCollected', () => {
    it('should call the correct endpoint with PUT method', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await markCollected(1);

      expect(mockApiFetch).toHaveBeenCalledWith('invoices/1/collect', 'PUT', expect.any(Object));
    });

    it('should include collectedDate in payload', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await markCollected(1, '2024-01-15');

      expect(mockApiFetch).toHaveBeenCalledWith('invoices/1/collect', 'PUT', { collectedDate: '2024-01-15' });
    });

    it('should include undefined collectedDate when not provided', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await markCollected(5);

      expect(mockApiFetch).toHaveBeenCalledWith('invoices/5/collect', 'PUT', { collectedDate: undefined });
    });

    it('should return the API response', async () => {
      const response = { success: true, body: null };
      mockApiFetch.mockResolvedValue(response);

      const result = await markCollected(1);

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // markUncollected
  // ============================================
  describe('markUncollected', () => {
    it('should call the correct endpoint with PUT method', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await markUncollected(3);

      expect(mockApiFetch).toHaveBeenCalledWith('invoices/3/uncollect', 'PUT');
    });

    it('should return the API response', async () => {
      const response = { success: true, message: 'Updated' };
      mockApiFetch.mockResolvedValue(response);

      const result = await markUncollected(3);

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // fetchInvoiceSummary
  // ============================================
  describe('fetchInvoiceSummary', () => {
    it('should call the correct endpoint', async () => {
      mockApiFetch.mockResolvedValue({
        success: true,
        body: { totalInvoices: 10, totalAmount: 50000, collectedAmount: 30000, pendingAmount: 20000, collectedCount: 6, pendingCount: 4 }
      });

      await fetchInvoiceSummary();

      expect(mockApiFetch).toHaveBeenCalledWith('invoices/summary');
    });

    it('should return summary data on success', async () => {
      const summary = {
        totalInvoices: 10,
        totalAmount: 50000,
        collectedAmount: 30000,
        pendingAmount: 20000,
        collectedCount: 6,
        pendingCount: 4
      };
      mockApiFetch.mockResolvedValue({ success: true, body: summary });

      const result = await fetchInvoiceSummary();

      expect(result).toEqual(summary);
    });

    it('should return zero defaults on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, body: null });

      const result = await fetchInvoiceSummary();

      expect(result.totalInvoices).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.collectedAmount).toBe(0);
      expect(result.pendingAmount).toBe(0);
      expect(result.collectedCount).toBe(0);
      expect(result.pendingCount).toBe(0);
    });

    it('should correctly reflect collected vs pending amounts', async () => {
      const summary = {
        totalInvoices: 5,
        totalAmount: 25000,
        collectedAmount: 15000,
        pendingAmount: 10000,
        collectedCount: 3,
        pendingCount: 2
      };
      mockApiFetch.mockResolvedValue({ success: true, body: summary });

      const result = await fetchInvoiceSummary();

      // Verify the math: collected + pending = total
      expect(result.collectedAmount + result.pendingAmount).toBe(result.totalAmount);
      expect(result.collectedCount + result.pendingCount).toBe(result.totalInvoices);
    });
  });

  // ============================================
  // downloadInvoicePdf
  // ============================================
  describe('downloadInvoicePdf', () => {
    beforeEach(() => {
      (globalThis as Record<string, unknown>).URL = {
        createObjectURL: vi.fn().mockReturnValue('blob:http://test'),
        revokeObjectURL: vi.fn()
      };
    });

    it('should return true on successful download', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      (globalThis.$fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlob);

      const result = await downloadInvoicePdf(1, 'INV-001');

      expect(result).toBe(true);
    });

    it('should set correct filename with invoice number', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      (globalThis.$fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlob);

      await downloadInvoicePdf(1, 'INV-001');

      expect(mockLink.download).toBe('Invoice-INV-001.pdf');
    });

    it('should use invoice id in filename when no invoice number', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      (globalThis.$fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlob);

      await downloadInvoicePdf(42);

      expect(mockLink.download).toBe('Invoice-42.pdf');
    });

    it('should return false and show error notification on failure', async () => {
      (globalThis.$fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Download failed'));

      const result = await downloadInvoicePdf(1);

      expect(result).toBe(false);
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
  });
});
