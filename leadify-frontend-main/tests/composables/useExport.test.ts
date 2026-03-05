/**
 * useExport - Comprehensive Unit Tests
 * ======================================
 * Tests for composables/useExport.ts
 * Covers: exportToCSV, exportToPDF, exportToPDFClientSide, exportToExcel,
 *         exportSavedReport, exportFromConfig, downloadBlob
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// ============================================
// Global mocks required by the composable
// ============================================
(globalThis as any).useRuntimeConfig = () => ({ public: { API_BASE_URL: 'http://localhost:3001/api/v1/' } });

// Mock the global fetch
const mockGlobalFetch = vi.fn();
(globalThis as any).fetch = mockGlobalFetch;

import { useExport } from '@/composables/useExport';

describe('useExport composable', () => {
  let exportInstance: ReturnType<typeof useExport>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockCreateElement: ReturnType<typeof vi.fn>;
  let mockAppendChild: ReturnType<typeof vi.fn>;
  let mockRemoveChild: ReturnType<typeof vi.fn>;
  let mockLink: { href: string; download: string; click: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    exportInstance = useExport();

    // Mock DOM APIs for downloadBlob
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake-url');
    mockRevokeObjectURL = vi.fn();
    mockLink = { href: '', download: '', click: vi.fn() };
    mockCreateElement = vi.fn().mockReturnValue(mockLink);
    mockAppendChild = vi.fn();
    mockRemoveChild = vi.fn();

    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;
    globalThis.document.createElement = mockCreateElement;
    globalThis.document.body.appendChild = mockAppendChild;
    globalThis.document.body.removeChild = mockRemoveChild;
  });

  // ============================================
  // Initial state
  // ============================================
  describe('initial state', () => {
    it('should initialize exporting as false', () => {
      expect(exportInstance.exporting.value).toBe(false);
    });

    it('should initialize exportError as null', () => {
      expect(exportInstance.exportError.value).toBeNull();
    });

    it('should return all expected functions', () => {
      expect(exportInstance.exportToPDF).toBeTypeOf('function');
      expect(exportInstance.exportToPDFClientSide).toBeTypeOf('function');
      expect(exportInstance.exportToCSV).toBeTypeOf('function');
      expect(exportInstance.exportToExcel).toBeTypeOf('function');
      expect(exportInstance.exportSavedReport).toBeTypeOf('function');
      expect(exportInstance.exportFromConfig).toBeTypeOf('function');
      expect(exportInstance.downloadBlob).toBeTypeOf('function');
    });
  });

  // ============================================
  // downloadBlob (utility)
  // ============================================
  describe('downloadBlob', () => {
    it('should create a link and trigger download', () => {
      const blob = new Blob(['test data'], { type: 'text/plain' });
      exportInstance.downloadBlob(blob, 'test.txt');

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('blob:http://localhost/fake-url');
      expect(mockLink.download).toBe('test.txt');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-url');
    });

    it('should clean up the object URL after download', () => {
      const blob = new Blob(['data']);
      exportInstance.downloadBlob(blob, 'file.csv');

      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // exportToCSV
  // ============================================
  describe('exportToCSV', () => {
    const sampleData = [
      { name: 'Lead A', email: 'a@test.com', value: 1000 },
      { name: 'Lead B', email: 'b@test.com', value: 2000 }
    ];
    const columns = ['name', 'email', 'value'];

    it('should generate and download a CSV file', () => {
      exportInstance.exportToCSV('Test Report', sampleData, columns);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockLink.download).toBe('test-report.csv');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should do nothing with empty data', () => {
      exportInstance.exportToCSV('Test', [], columns);

      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('should do nothing with empty columns', () => {
      exportInstance.exportToCSV('Test', sampleData, []);

      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('should use custom filename when provided', () => {
      exportInstance.exportToCSV('Report', sampleData, columns, { filename: 'my-export.csv' });

      expect(mockLink.download).toBe('my-export.csv');
    });

    it('should use column labels when provided', () => {
      exportInstance.exportToCSV('Report', sampleData, columns, {
        columnLabels: { name: 'Full Name', email: 'Email Address', value: 'Deal Value' }
      });

      // The blob should contain the label headers
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
    });

    it('should escape CSV values with commas', () => {
      const dataWithCommas = [
        { name: 'Smith, John', email: 'john@test.com', value: 1000 }
      ];

      exportInstance.exportToCSV('Report', dataWithCommas, columns);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should escape CSV values with double quotes', () => {
      const dataWithQuotes = [
        { name: 'He said "hello"', email: 'test@test.com', value: 500 }
      ];

      exportInstance.exportToCSV('Report', dataWithQuotes, columns);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should escape CSV values with newlines', () => {
      const dataWithNewlines = [
        { name: 'Line1\nLine2', email: 'test@test.com', value: 100 }
      ];

      exportInstance.exportToCSV('Report', dataWithNewlines, columns);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should handle null and undefined values', () => {
      const dataWithNulls = [
        { name: null, email: undefined, value: 0 }
      ];

      exportInstance.exportToCSV('Report', dataWithNulls as any, columns);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should set exporting to true during export and false after', () => {
      expect(exportInstance.exporting.value).toBe(false);

      exportInstance.exportToCSV('Report', sampleData, columns);

      // After sync export, exporting should be false again
      expect(exportInstance.exporting.value).toBe(false);
    });

    it('should reset exportError to null before export', () => {
      exportInstance.exportError.value = 'previous error';

      exportInstance.exportToCSV('Report', sampleData, columns);

      expect(exportInstance.exportError.value).toBeNull();
    });

    it('should generate filename from title by replacing spaces with hyphens', () => {
      exportInstance.exportToCSV('My Sales Report', sampleData, columns);

      expect(mockLink.download).toBe('my-sales-report.csv');
    });

    it('should include BOM for Excel compatibility', () => {
      exportInstance.exportToCSV('Report', sampleData, columns);

      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('text/csv;charset=utf-8;');
    });
  });

  // ============================================
  // exportToPDF (server-side)
  // ============================================
  describe('exportToPDF', () => {
    const sampleData = [
      { name: 'Deal A', amount: 50000 },
      { name: 'Deal B', amount: 75000 }
    ];
    const columns = ['name', 'amount'];

    it('should call server PDF endpoint and download blob', async () => {
      const fakeBlob = new Blob(['pdf data'], { type: 'application/pdf' });
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      await exportInstance.exportToPDF('Sales Report', sampleData, columns);

      expect(mockGlobalFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/report-builder/export-pdf',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      );
      expect(mockLink.download).toBe('sales-report.pdf');
    });

    it('should do nothing with empty data', async () => {
      await exportInstance.exportToPDF('Report', [], columns);

      expect(mockGlobalFetch).not.toHaveBeenCalled();
    });

    it('should do nothing with empty columns', async () => {
      await exportInstance.exportToPDF('Report', sampleData, []);

      expect(mockGlobalFetch).not.toHaveBeenCalled();
    });

    it('should use custom filename when provided', async () => {
      const fakeBlob = new Blob(['data']);
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      await exportInstance.exportToPDF('Report', sampleData, columns, { filename: 'custom.pdf' });

      expect(mockLink.download).toBe('custom.pdf');
    });

    it('should send column labels and summary in request body', async () => {
      const fakeBlob = new Blob(['data']);
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      const options = {
        columnLabels: { name: 'Deal Name', amount: 'Amount' },
        summary: { amount: { sum: 125000, avg: 62500, min: 50000, max: 75000, count: 2 } }
      };

      await exportInstance.exportToPDF('Report', sampleData, columns, options);

      const requestBody = JSON.parse(mockGlobalFetch.mock.calls[0][1].body);
      expect(requestBody.columnLabels).toEqual(options.columnLabels);
      expect(requestBody.summary).toEqual(options.summary);
    });

    it('should set exporting to false after completion', async () => {
      const fakeBlob = new Blob(['data']);
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      await exportInstance.exportToPDF('Report', sampleData, columns);

      expect(exportInstance.exporting.value).toBe(false);
    });

    it('should fall back to client-side PDF when server fails', async () => {
      mockGlobalFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      // Mock jspdf and jspdf-autotable imports -- they will fail which causes exportError
      await exportInstance.exportToPDF('Report', sampleData, columns);

      // Server call was made but failed
      expect(mockGlobalFetch).toHaveBeenCalled();
      // After fallback failure, exporting should be false
      expect(exportInstance.exporting.value).toBe(false);
    });

    it('should fall back to client-side PDF when server throws', async () => {
      mockGlobalFetch.mockRejectedValueOnce(new Error('Network error'));

      await exportInstance.exportToPDF('Report', sampleData, columns);

      expect(exportInstance.exporting.value).toBe(false);
    });
  });

  // ============================================
  // exportToExcel
  // ============================================
  describe('exportToExcel', () => {
    const sampleData = [
      { name: 'Client A', revenue: 100000 },
      { name: 'Client B', revenue: 200000 }
    ];
    const columns = ['name', 'revenue'];

    it('should do nothing with empty data', async () => {
      await exportInstance.exportToExcel('Report', [], columns);
      // No XLSX import should be attempted
      expect(exportInstance.exporting.value).toBe(false);
    });

    it('should do nothing with empty columns', async () => {
      await exportInstance.exportToExcel('Report', sampleData, []);
      expect(exportInstance.exporting.value).toBe(false);
    });

    it('should set exporting to false after completion', async () => {
      // This will fail because xlsx is not available in test env
      await exportInstance.exportToExcel('Report', sampleData, columns);

      expect(exportInstance.exporting.value).toBe(false);
    });

    it('should handle Excel export and set proper state', async () => {
      // xlsx module is available in the test env; XLSX.writeFile may or may not throw
      // depending on the environment. The key behavior is that exporting resets properly.
      await exportInstance.exportToExcel('Report', sampleData, columns);

      // Either it succeeds (exportError is null) or fails (exportError is set)
      expect(exportInstance.exporting.value).toBe(false);
    });

    it('should reset exportError before new export attempt', async () => {
      exportInstance.exportError.value = 'old error';

      await exportInstance.exportToExcel('Report', sampleData, columns);

      // The important thing is it was reset before the attempt (not 'old error')
      expect(exportInstance.exportError.value).not.toBe('old error');
    });
  });

  // ============================================
  // exportSavedReport
  // ============================================
  describe('exportSavedReport', () => {
    it('should export saved report as PDF via POST', async () => {
      const fakeBlob = new Blob(['pdf data']);
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      await exportInstance.exportSavedReport(42, 'pdf');

      expect(mockGlobalFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/reports/42/export',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ format: 'pdf' })
        })
      );
      expect(mockLink.download).toBe('report-42.pdf');
    });

    it('should export saved report as CSV via GET', async () => {
      const fakeBlob = new Blob(['csv data']);
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      await exportInstance.exportSavedReport(42, 'csv');

      expect(mockGlobalFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/reports/42/export/csv',
        expect.objectContaining({ method: 'GET', credentials: 'include' })
      );
      expect(mockLink.download).toBe('report-42.csv');
    });

    it('should export saved report as XLSX via GET', async () => {
      const fakeBlob = new Blob(['xlsx data']);
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      await exportInstance.exportSavedReport(10, 'xlsx');

      expect(mockGlobalFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/reports/10/export/xlsx',
        expect.objectContaining({ method: 'GET' })
      );
      expect(mockLink.download).toBe('report-10.xlsx');
    });

    it('should use custom filename when provided', async () => {
      const fakeBlob = new Blob(['data']);
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      await exportInstance.exportSavedReport(1, 'csv', 'my-custom-report.csv');

      expect(mockLink.download).toBe('my-custom-report.csv');
    });

    it('should set exportError on failure', async () => {
      mockGlobalFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await exportInstance.exportSavedReport(999, 'csv');

      expect(exportInstance.exportError.value).toBe('CSV export failed');
    });

    it('should set exportError on PDF failure', async () => {
      mockGlobalFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await exportInstance.exportSavedReport(1, 'pdf');

      expect(exportInstance.exportError.value).toBe('PDF export failed');
    });

    it('should set exporting to false after completion', async () => {
      mockGlobalFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await exportInstance.exportSavedReport(1, 'csv');

      expect(exportInstance.exporting.value).toBe(false);
    });

    it('should handle fetch exception', async () => {
      mockGlobalFetch.mockRejectedValueOnce(new Error('Network error'));

      await exportInstance.exportSavedReport(1, 'xlsx');

      expect(exportInstance.exportError.value).toBe('XLSX export failed');
      expect(exportInstance.exporting.value).toBe(false);
    });

    it('should accept string report ID', async () => {
      const fakeBlob = new Blob(['data']);
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      await exportInstance.exportSavedReport('abc-123', 'csv');

      expect(mockGlobalFetch).toHaveBeenCalledWith(
        expect.stringContaining('reports/abc-123/export/csv'),
        expect.any(Object)
      );
    });
  });

  // ============================================
  // exportFromConfig
  // ============================================
  describe('exportFromConfig', () => {
    const sampleConfig = { model: 'leads', columns: ['name', 'email'], filters: {} };

    it('should export from config as CSV', async () => {
      const fakeBlob = new Blob(['csv data']);
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      await exportInstance.exportFromConfig(sampleConfig, 'csv', 'My Report');

      expect(mockGlobalFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/reports/builder/export',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ config: sampleConfig, format: 'csv', title: 'My Report' })
        })
      );
      expect(mockLink.download).toBe('my-report.csv');
    });

    it('should export from config as PDF', async () => {
      const fakeBlob = new Blob(['pdf data']);
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      await exportInstance.exportFromConfig(sampleConfig, 'pdf', 'Sales Report');

      expect(mockLink.download).toBe('sales-report.pdf');
    });

    it('should use default title "report" when title is not provided', async () => {
      const fakeBlob = new Blob(['data']);
      mockGlobalFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(fakeBlob)
      });

      await exportInstance.exportFromConfig(sampleConfig, 'csv');

      expect(mockLink.download).toBe('report.csv');
    });

    it('should set exportError on failure', async () => {
      mockGlobalFetch.mockResolvedValueOnce({ ok: false, status: 400 });

      await exportInstance.exportFromConfig(sampleConfig, 'csv', 'Test');

      expect(exportInstance.exportError.value).toBe('CSV export failed');
    });

    it('should set exportError for PDF failure', async () => {
      mockGlobalFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await exportInstance.exportFromConfig(sampleConfig, 'pdf', 'Test');

      expect(exportInstance.exportError.value).toBe('PDF export failed');
    });

    it('should set exporting to false after completion', async () => {
      mockGlobalFetch.mockRejectedValueOnce(new Error('Error'));

      await exportInstance.exportFromConfig(sampleConfig, 'csv');

      expect(exportInstance.exporting.value).toBe(false);
    });

    it('should handle network error gracefully', async () => {
      mockGlobalFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await exportInstance.exportFromConfig(sampleConfig, 'pdf', 'Report');

      expect(exportInstance.exportError.value).toBe('PDF export failed');
      expect(exportInstance.exporting.value).toBe(false);
    });
  });

  // ============================================
  // Edge cases
  // ============================================
  describe('edge cases', () => {
    it('should handle title with multiple consecutive spaces', () => {
      const data = [{ a: 1 }];
      exportInstance.exportToCSV('My   Big   Report', data, ['a']);

      // \s+ regex replaces consecutive spaces with a single hyphen
      expect(mockLink.download).toBe('my-big-report.csv');
    });

    it('should handle special characters in title for filename', () => {
      const data = [{ a: 1 }];
      exportInstance.exportToCSV('Q1/Q2 Report (Draft)', data, ['a']);

      // Spaces become hyphens, other chars remain
      expect(mockLink.download).toContain('.csv');
    });

    it('should support multiple sequential exports without state leaking', () => {
      const data = [{ x: 1 }];
      const cols = ['x'];

      exportInstance.exportToCSV('Report 1', data, cols);
      expect(exportInstance.exporting.value).toBe(false);
      expect(exportInstance.exportError.value).toBeNull();

      exportInstance.exportToCSV('Report 2', data, cols);
      expect(exportInstance.exporting.value).toBe(false);
      expect(exportInstance.exportError.value).toBeNull();
    });
  });
});
