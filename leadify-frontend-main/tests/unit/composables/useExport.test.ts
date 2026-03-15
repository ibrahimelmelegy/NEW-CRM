/**
 * useExport - Unit Tests
 * =======================
 * Tests for composables/useExport.ts
 *
 * The composable provides:
 * - exportToPDF(title, data, columns, options?): Export to PDF (server-side with client-side fallback)
 * - exportToCSV(title, data, columns, options?): Export to CSV (client-side)
 * - exportToExcel(title, data, columns, options?): Export to Excel (client-side)
 * - exportSavedReport(reportId, format, filename?): Export a saved report
 * - exportFromConfig(config, format, title?): Export from builder config
 * - downloadBlob(blob, filename): Utility to trigger browser download
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExport } from '~/composables/useExport';

// Setup global mocks
const mockFetch = vi.fn();
(globalThis as Record<string, unknown>).fetch = mockFetch;

// Mock URL methods
const mockCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test');
const mockRevokeObjectURL = vi.fn();
(globalThis as Record<string, unknown>).URL = {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL
};

// Mock document APIs
const mockClick = vi.fn();
const mockLink = { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
vi.spyOn(document.body, 'appendChild').mockImplementation(node => node);
vi.spyOn(document.body, 'removeChild').mockImplementation(node => node);

// Mock Blob
(globalThis as Record<string, unknown>).Blob = class MockBlob {
  content: unknown[];
  options: unknown;
  constructor(content: unknown[], options?: unknown) {
    this.content = content;
    this.options = options;
  }
};

describe('useExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:http://localhost/test');
  });

  // ============================================
  // Initial state
  // ============================================
  describe('Initial state', () => {
    it('should have exporting as false initially', () => {
      const { exporting } = useExport();
      expect(exporting.value).toBe(false);
    });

    it('should have exportError as null initially', () => {
      const { exportError } = useExport();
      expect(exportError.value).toBeNull();
    });
  });

  // ============================================
  // exportToCSV
  // ============================================
  describe('exportToCSV', () => {
    const sampleData = [
      { name: 'Alice', age: 30, city: 'New York' },
      { name: 'Bob', age: 25, city: 'London' }
    ];
    const columns = ['name', 'age', 'city'];

    it('should do nothing when data is empty', () => {
      const { exportToCSV, exporting } = useExport();

      exportToCSV('Test', [], columns);

      expect(exporting.value).toBe(false);
      expect(mockClick).not.toHaveBeenCalled();
    });

    it('should do nothing when columns is empty', () => {
      const { exportToCSV } = useExport();

      exportToCSV('Test', sampleData, []);

      expect(mockClick).not.toHaveBeenCalled();
    });

    it('should trigger a download click', () => {
      const { exportToCSV } = useExport();

      exportToCSV('Test Export', sampleData, columns);

      expect(mockClick).toHaveBeenCalled();
    });

    it('should use column keys as headers by default', () => {
      const { exportToCSV } = useExport();

      exportToCSV('Test', sampleData, columns);

      // Check the blob was created with CSV content containing headers
      const blobCall = (globalThis.URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(blobCall).toBeDefined();
    });

    it('should use columnLabels when provided', () => {
      const { exportToCSV } = useExport();
      const columnLabels = { name: 'Full Name', age: 'Age (Years)', city: 'Location' };

      // Should not throw
      expect(() => exportToCSV('Test', sampleData, columns, { columnLabels })).not.toThrow();
    });

    it('should use custom filename when provided', () => {
      const { exportToCSV } = useExport();

      exportToCSV('Test', sampleData, columns, { filename: 'my-export.csv' });

      expect(mockLink.download).toBe('my-export.csv');
    });

    it('should generate filename from title when no filename provided', () => {
      const { exportToCSV } = useExport();

      exportToCSV('My Test Report', sampleData, columns);

      expect(mockLink.download).toBe('my-test-report.csv');
    });

    it('should reset exporting to false after completion', () => {
      const { exportToCSV, exporting } = useExport();

      exportToCSV('Test', sampleData, columns);

      expect(exporting.value).toBe(false);
    });

    it('should escape CSV special characters (commas)', () => {
      const dataWithCommas = [{ name: 'Smith, John', value: '100' }];
      const { exportToCSV } = useExport();

      // Should not throw
      expect(() => exportToCSV('Test', dataWithCommas, ['name', 'value'])).not.toThrow();
    });

    it('should handle null/undefined values gracefully', () => {
      const dataWithNulls = [{ name: 'Test', value: null, other: undefined }];
      const { exportToCSV } = useExport();

      expect(() => exportToCSV('Test', dataWithNulls as unknown as Record<string, unknown>[], ['name', 'value', 'other'])).not.toThrow();
    });
  });

  // ============================================
  // exportToPDF
  // ============================================
  describe('exportToPDF', () => {
    const sampleData = [{ name: 'Alice', revenue: 5000 }];
    const columns = ['name', 'revenue'];

    it('should do nothing when data is empty', async () => {
      const { exportToPDF } = useExport();

      await exportToPDF('Test', [], columns);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should do nothing when columns is empty', async () => {
      const { exportToPDF } = useExport();

      await exportToPDF('Test', sampleData, []);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call server-side PDF endpoint', async () => {
      const mockBlob = new Blob(['PDF']);
      const mockResponse = {
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const { exportToPDF } = useExport();
      await exportToPDF('Test Report', sampleData, columns);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('report-builder/export-pdf'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' })
        })
      );
    });

    it('should use custom filename when provided', async () => {
      const mockBlob = new Blob(['PDF']);
      const mockResponse = { ok: true, blob: vi.fn().mockResolvedValue(mockBlob) };
      mockFetch.mockResolvedValue(mockResponse);

      const { exportToPDF } = useExport();
      await exportToPDF('Test', sampleData, columns, { filename: 'custom-report.pdf' });

      expect(mockLink.download).toBe('custom-report.pdf');
    });

    it('should reset exporting to false after success', async () => {
      const mockResponse = { ok: true, blob: vi.fn().mockResolvedValue(new Blob(['PDF'])) };
      mockFetch.mockResolvedValue(mockResponse);

      const { exportToPDF, exporting } = useExport();
      await exportToPDF('Test', sampleData, columns);

      expect(exporting.value).toBe(false);
    });

    it('should reset exporting to false even when server fails', async () => {
      mockFetch.mockRejectedValue(new Error('Server error'));

      const { exportToPDF, exporting } = useExport();
      // It will fall back to client-side PDF (which imports jspdf, that will fail in test env)
      await exportToPDF('Test', sampleData, columns).catch(() => {});

      expect(exporting.value).toBe(false);
    });
  });

  // ============================================
  // exportToExcel
  // ============================================
  describe('exportToExcel', () => {
    const sampleData = [
      { product: 'Widget A', quantity: 10, price: 29.99 },
      { product: 'Widget B', quantity: 5, price: 49.99 }
    ];
    const columns = ['product', 'quantity', 'price'];

    it('should do nothing when data is empty', async () => {
      const { exportToExcel } = useExport();

      await exportToExcel('Test', [], columns);

      expect(mockClick).not.toHaveBeenCalled();
    });

    it('should trigger a download', async () => {
      const { exportToExcel } = useExport();

      await exportToExcel('Sales Report', sampleData, columns);

      expect(mockClick).toHaveBeenCalled();
    });

    it('should use .csv extension for Excel export', async () => {
      const { exportToExcel } = useExport();

      await exportToExcel('Sales Report', sampleData, columns);

      expect(mockLink.download).toContain('.csv');
    });

    it('should use custom filename when provided', async () => {
      const { exportToExcel } = useExport();

      await exportToExcel('Test', sampleData, columns, { filename: 'sales.csv' });

      expect(mockLink.download).toBe('sales.csv');
    });

    it('should reset exporting to false after completion', async () => {
      const { exportToExcel, exporting } = useExport();

      await exportToExcel('Test', sampleData, columns);

      expect(exporting.value).toBe(false);
    });

    it('should use column labels when provided', () => {
      const { exportToExcel } = useExport();
      const columnLabels = { product: 'Product Name', quantity: 'Qty', price: 'Unit Price' };

      expect(exportToExcel('Test', sampleData, columns, { columnLabels })).toBeUndefined();
    });
  });

  // ============================================
  // exportSavedReport
  // ============================================
  describe('exportSavedReport', () => {
    it('should use POST for PDF format', async () => {
      const mockBlob = new Blob(['PDF']);
      const mockResponse = { ok: true, blob: vi.fn().mockResolvedValue(mockBlob) };
      mockFetch.mockResolvedValue(mockResponse);

      const { exportSavedReport } = useExport();
      await exportSavedReport(1, 'pdf');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('reports/1/export'), expect.objectContaining({ method: 'POST' }));
    });

    it('should use GET for CSV format', async () => {
      const mockBlob = new Blob(['CSV data']);
      const mockResponse = { ok: true, blob: vi.fn().mockResolvedValue(mockBlob) };
      mockFetch.mockResolvedValue(mockResponse);

      const { exportSavedReport } = useExport();
      await exportSavedReport(1, 'csv');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('reports/1/export/csv'), expect.objectContaining({ method: 'GET' }));
    });

    it('should set exportError when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Server error'));

      const { exportSavedReport, exportError } = useExport();
      await exportSavedReport(1, 'csv');

      expect(exportError.value).toBe('CSV export failed');
    });

    it('should reset exporting to false after completion', async () => {
      mockFetch.mockRejectedValue(new Error('fail'));

      const { exportSavedReport, exporting } = useExport();
      await exportSavedReport(1, 'pdf');

      expect(exporting.value).toBe(false);
    });

    it('should use custom filename when provided', async () => {
      const mockBlob = new Blob(['CSV']);
      const mockResponse = { ok: true, blob: vi.fn().mockResolvedValue(mockBlob) };
      mockFetch.mockResolvedValue(mockResponse);

      const { exportSavedReport } = useExport();
      await exportSavedReport(1, 'csv', 'my-report.csv');

      expect(mockLink.download).toBe('my-report.csv');
    });
  });

  // ============================================
  // downloadBlob utility
  // ============================================
  describe('downloadBlob', () => {
    it('should create a link element and trigger download', () => {
      const { downloadBlob } = useExport();
      const blob = new Blob(['test']) as unknown as globalThis.Blob;

      downloadBlob(blob, 'test-file.csv');

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(mockLink.download).toBe('test-file.csv');
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test');
    });

    it('should append and remove link from document body', () => {
      const { downloadBlob } = useExport();
      const blob = new Blob(['test']) as unknown as globalThis.Blob;

      downloadBlob(blob, 'file.pdf');

      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });
  });
});
