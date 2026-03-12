/**
 * useReports - Unit Tests
 * ========================
 * Tests for composables/useReports.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  fetchReports,
  fetchReport,
  createReport,
  updateReport,
  deleteReport,
  executeSavedReport,
  exportReport,
  fetchAvailableFields,
  executeReportConfig,
  fetchReportAnalytics,
  downloadBlob
} from '~/composables/useReports';

const mockApiFetch = vi.fn();
(globalThis as Record<string, unknown>).useApiFetch = mockApiFetch;
(globalThis as Record<string, unknown>).useRuntimeConfig = () => ({
  public: { apiBaseUrl: 'http://localhost:3001/api/v1/' }
});

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockApiFetch(...args)
}));

describe('useReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchReports
  // ============================================
  describe('fetchReports', () => {
    it('should fetch all reports without entityType', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [{ id: 1, name: 'Report 1' }] }, success: true });

      const result = await fetchReports();

      expect(mockApiFetch).toHaveBeenCalledWith('reports');
      expect(result).toEqual([{ id: 1, name: 'Report 1' }]);
    });

    it('should fetch reports filtered by entityType', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [] }, success: true });

      await fetchReports('LEAD');

      expect(mockApiFetch).toHaveBeenCalledWith('reports?entityType=LEAD');
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchReports();

      expect(result).toEqual([]);
    });

    it('should handle body as direct array (no docs wrapper)', async () => {
      const reports = [
        { id: 1, name: 'R1' },
        { id: 2, name: 'R2' }
      ];
      mockApiFetch.mockResolvedValue({ body: reports, success: true });

      const result = await fetchReports();

      expect(result).toEqual(reports);
    });
  });

  // ============================================
  // fetchReport
  // ============================================
  describe('fetchReport', () => {
    it('should fetch a single report by id', async () => {
      const report = { id: 1, name: 'Test Report' };
      mockApiFetch.mockResolvedValue({ body: report, success: true });

      const result = await fetchReport(1);

      expect(mockApiFetch).toHaveBeenCalledWith('reports/1');
      expect(result).toEqual(report);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchReport(999);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // createReport
  // ============================================
  describe('createReport', () => {
    it('should call POST with report data', async () => {
      const data = { name: 'New Report', entityType: 'LEAD', fields: ['name'] };
      mockApiFetch.mockResolvedValue({ success: true });

      await createReport(data);

      expect(mockApiFetch).toHaveBeenCalledWith('reports', 'POST', data);
    });
  });

  // ============================================
  // updateReport
  // ============================================
  describe('updateReport', () => {
    it('should call PUT with report id and data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateReport(1, { name: 'Updated' });

      expect(mockApiFetch).toHaveBeenCalledWith('reports/1', 'PUT', { name: 'Updated' });
    });
  });

  // ============================================
  // deleteReport
  // ============================================
  describe('deleteReport', () => {
    it('should call DELETE with report id', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteReport(1);

      expect(mockApiFetch).toHaveBeenCalledWith('reports/1', 'DELETE');
    });
  });

  // ============================================
  // executeSavedReport
  // ============================================
  describe('executeSavedReport', () => {
    it('should execute report without filters', async () => {
      mockApiFetch.mockResolvedValue({ body: { rows: [] }, success: true });

      const result = await executeSavedReport(1);

      expect(mockApiFetch).toHaveBeenCalledWith('reports/1/execute', 'POST', {});
      expect(result).toEqual({ rows: [] });
    });

    it('should execute report with filters', async () => {
      mockApiFetch.mockResolvedValue({ body: { rows: [{ id: 1 }] }, success: true });

      await executeSavedReport(1, { status: 'ACTIVE' });

      expect(mockApiFetch).toHaveBeenCalledWith('reports/1/execute', 'POST', { filters: { status: 'ACTIVE' } });
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await executeSavedReport(1);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // exportReport
  // ============================================
  describe('exportReport', () => {
    it('should call export endpoint with format', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await exportReport(1, 'csv');

      expect(mockApiFetch).toHaveBeenCalledWith('reports/1/export?format=csv');
    });
  });

  // ============================================
  // fetchAvailableFields
  // ============================================
  describe('fetchAvailableFields', () => {
    it('should fetch fields for entity type', async () => {
      const fields = [{ key: 'name', label: 'Name', type: 'string' }];
      mockApiFetch.mockResolvedValue({ body: fields, success: true });

      const result = await fetchAvailableFields('LEAD');

      expect(mockApiFetch).toHaveBeenCalledWith('reports/fields/LEAD');
      expect(result).toEqual(fields);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchAvailableFields('LEAD');

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // executeReportConfig
  // ============================================
  describe('executeReportConfig', () => {
    it('should POST report config for execution', async () => {
      const config = { entityType: 'LEAD' as const };
      mockApiFetch.mockResolvedValue({ success: true, body: {} });

      await executeReportConfig(config);

      expect(mockApiFetch).toHaveBeenCalledWith('report-builder/execute', 'POST', config);
    });
  });

  // ============================================
  // fetchReportAnalytics
  // ============================================
  describe('fetchReportAnalytics', () => {
    it('should fetch analytics with entityType only', async () => {
      const analytics = { total: 100, byStatus: [], timeline: [], valueMetrics: null };
      mockApiFetch.mockResolvedValue({ body: analytics, success: true });

      const result = await fetchReportAnalytics('LEAD');

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('entityType=LEAD'));
      expect(result).toEqual(analytics);
    });

    it('should include date params when provided', async () => {
      mockApiFetch.mockResolvedValue({ body: {}, success: true });

      await fetchReportAnalytics('DEAL', '2024-01-01', '2024-12-31');

      const calledUrl = mockApiFetch.mock.calls[0]![0];
      expect(calledUrl).toContain('startDate=2024-01-01');
      expect(calledUrl).toContain('endDate=2024-12-31');
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchReportAnalytics('LEAD');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // downloadBlob
  // ============================================
  describe('downloadBlob', () => {
    it('should create and click a download link', () => {
      const mockUrl = 'blob:http://localhost/abc';
      const mockCreateObjectURL = vi.fn().mockReturnValue(mockUrl);
      const mockRevokeObjectURL = vi.fn();
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockCreateElement = vi.fn().mockReturnValue({
        href: '',
        download: '',
        click: mockClick
      });

      globalThis.window = {
        URL: { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL }
      } as unknown;
      globalThis.document = {
        createElement: mockCreateElement,
        body: { appendChild: mockAppendChild, removeChild: mockRemoveChild }
      } as unknown;

      const blob = new Blob(['test'], { type: 'text/csv' });
      downloadBlob(blob, 'report.csv');

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });
  });
});
