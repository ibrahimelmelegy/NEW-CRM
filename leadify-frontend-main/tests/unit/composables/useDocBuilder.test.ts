/**
 * useDocBuilder - Unit Tests
 * ============================
 * Tests for composables/useDocBuilder.ts
 *
 * The composable provides:
 * - fetchDocuments, getDocument, createDocument, updateDocument, deleteDocument
 * - changeStatus, convertDocument
 * - getVersions, getVersionById, restoreVersion
 * - generatePdf, sendDocument, getStats
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDocBuilder } from '@/composables/useDocBuilder';

const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);

const { ref } = await import('vue');
(globalThis as Record<string, unknown>).ref = ref;

describe('useDocBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchDocuments
  // ============================================
  describe('fetchDocuments', () => {
    it('should fetch documents and set documents state', async () => {
      const mockDocs = [
        { id: 'doc-1', type: 'PROPOSAL', reference: 'PRO-001', title: 'Test Proposal', status: 'DRAFT', version: 1, currency: 'SAR', createdBy: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ];
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockDocs, pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 } }, success: true });

      const { fetchDocuments, documents } = useDocBuilder();
      await fetchDocuments();

      expect(documents.value).toHaveLength(1);
      expect(documents.value[0]?.id).toBe('doc-1');
    });

    it('should apply filters to query string', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      const { fetchDocuments } = useDocBuilder();
      await fetchDocuments({ type: 'PROPOSAL', status: 'DRAFT' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('type=PROPOSAL');
      expect(calledUrl).toContain('status=DRAFT');
    });

    it('should handle array status filter', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      const { fetchDocuments } = useDocBuilder();
      await fetchDocuments({ status: ['DRAFT', 'SENT'] });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('status=DRAFT');
      expect(calledUrl).toContain('status=SENT');
    });

    it('should manage loading state', async () => {
      let resolvePromise: (value: unknown) => void;
      mockUseApiFetch.mockReturnValueOnce(new Promise(resolve => { resolvePromise = resolve; }));

      const { fetchDocuments, loading } = useDocBuilder();

      expect(loading.value).toBe(false);
      const promise = fetchDocuments();
      expect(loading.value).toBe(true);

      resolvePromise!({ body: { docs: [], pagination: {} }, success: true });
      await promise;
      expect(loading.value).toBe(false);
    });
  });

  // ============================================
  // getDocument
  // ============================================
  describe('getDocument', () => {
    it('should fetch a single document by ID', async () => {
      const mockDoc = { id: 'doc-1', type: 'PROPOSAL', reference: 'PRO-001', title: 'My Proposal', status: 'DRAFT', version: 1, currency: 'SAR', createdBy: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      mockUseApiFetch.mockResolvedValue({ body: mockDoc, success: true });

      const { getDocument, currentDocument } = useDocBuilder();
      await getDocument('doc-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/doc-1');
      expect(currentDocument.value).toEqual(mockDoc);
    });

    it('should not set currentDocument when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const { getDocument, currentDocument } = useDocBuilder();
      await getDocument('nonexistent');

      expect(currentDocument.value).toBeNull();
    });
  });

  // ============================================
  // createDocument
  // ============================================
  describe('createDocument', () => {
    it('should call POST and set currentDocument', async () => {
      const data = { type: 'PROPOSAL', title: 'New Proposal', currency: 'SAR' };
      const created = { id: 'doc-2', ...data, reference: 'PRO-002', status: 'DRAFT', version: 1, createdBy: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      mockUseApiFetch.mockResolvedValue({ body: created, success: true });

      const { createDocument, currentDocument } = useDocBuilder();
      await createDocument(data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/', 'POST', data);
      expect(currentDocument.value).toEqual(created);
    });

    it('should manage saving state', async () => {
      let resolvePromise: (value: unknown) => void;
      mockUseApiFetch.mockReturnValueOnce(new Promise(resolve => { resolvePromise = resolve; }));

      const { createDocument, saving } = useDocBuilder();

      expect(saving.value).toBe(false);
      const promise = createDocument({});
      expect(saving.value).toBe(true);

      resolvePromise!({ body: { id: 'doc-1' }, success: true });
      await promise;
      expect(saving.value).toBe(false);
    });
  });

  // ============================================
  // updateDocument
  // ============================================
  describe('updateDocument', () => {
    it('should call PUT with document ID and data', async () => {
      const data = { title: 'Updated Title' };
      const updated = { id: 'doc-1', type: 'PROPOSAL', reference: 'PRO-001', ...data, status: 'DRAFT', version: 2, currency: 'SAR', createdBy: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      mockUseApiFetch.mockResolvedValue({ body: updated, success: true });

      const { updateDocument, currentDocument } = useDocBuilder();
      await updateDocument('doc-1', data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/doc-1', 'PUT', data);
      expect(currentDocument.value?.title).toBe('Updated Title');
    });
  });

  // ============================================
  // deleteDocument
  // ============================================
  describe('deleteDocument', () => {
    it('should call DELETE endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      const { deleteDocument } = useDocBuilder();
      await deleteDocument('doc-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/doc-1', 'DELETE');
    });
  });

  // ============================================
  // changeStatus
  // ============================================
  describe('changeStatus', () => {
    it('should call PUT status endpoint and update documents list', async () => {
      const updatedDoc = { id: 'doc-1', type: 'PROPOSAL', reference: 'PRO-001', title: 'Test', status: 'SENT', version: 1, currency: 'SAR', createdBy: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      mockUseApiFetch.mockResolvedValue({ body: updatedDoc, success: true });

      const { changeStatus, documents } = useDocBuilder();
      documents.value = [{ id: 'doc-1', type: 'PROPOSAL', reference: 'PRO-001', title: 'Test', status: 'DRAFT', version: 1, currency: 'SAR', createdBy: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }];

      await changeStatus('doc-1', 'SENT');

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/doc-1/status', 'PUT', { status: 'SENT', reason: undefined });
      expect(documents.value[0]?.status).toBe('SENT');
    });

    it('should pass rejection reason when provided', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const { changeStatus } = useDocBuilder();
      await changeStatus('doc-1', 'REJECTED', 'Price too high');

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/doc-1/status', 'PUT', { status: 'REJECTED', reason: 'Price too high' });
    });
  });

  // ============================================
  // generatePdf
  // ============================================
  describe('generatePdf', () => {
    it('should call the PDF generation endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { pdfUrl: 'https://example.com/doc.pdf' } });

      const { generatePdf } = useDocBuilder();
      const result = await generatePdf('doc-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/doc-1/pdf', 'POST');
      expect(result).toBeDefined();
    });
  });

  // ============================================
  // sendDocument
  // ============================================
  describe('sendDocument', () => {
    it('should call the send endpoint with email data', async () => {
      const sendData = { to: 'client@example.com', subject: 'Your Proposal', message: 'Please review' };
      mockUseApiFetch.mockResolvedValue({ body: { id: 'doc-1', sentAt: '2024-01-01' }, success: true });

      const { sendDocument } = useDocBuilder();
      await sendDocument('doc-1', sendData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/doc-1/send', 'POST', sendData);
    });
  });

  // ============================================
  // getStats
  // ============================================
  describe('getStats', () => {
    it('should fetch stats without type filter', async () => {
      const mockStats = { total: 50, byStatus: { DRAFT: 10, SENT: 20, ACCEPTED: 20 }, byType: {}, totalValue: 500000, valueByType: {} };
      mockUseApiFetch.mockResolvedValue({ body: mockStats, success: true });

      const { getStats, stats } = useDocBuilder();
      await getStats();

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/stats');
      expect(stats.value).toEqual(mockStats);
    });

    it('should include type in URL when provided', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const { getStats } = useDocBuilder();
      await getStats('PROPOSAL');

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/stats?type=PROPOSAL');
    });
  });

  // ============================================
  // getVersions / restoreVersion
  // ============================================
  describe('getVersions', () => {
    it('should fetch version history for a document', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: [{ id: 'v1', version: 1 }] });

      const { getVersions } = useDocBuilder();
      const result = await getVersions('doc-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/doc-1/versions');
      expect(result).toBeDefined();
    });
  });

  describe('restoreVersion', () => {
    it('should call restore endpoint and update currentDocument', async () => {
      const restoredDoc = { id: 'doc-1', type: 'PROPOSAL', reference: 'PRO-001', title: 'Restored', status: 'DRAFT', version: 1, currency: 'SAR', createdBy: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      mockUseApiFetch.mockResolvedValue({ body: restoredDoc, success: true });

      const { restoreVersion, currentDocument } = useDocBuilder();
      await restoreVersion('doc-1', 'v1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('doc-builder/doc-1/versions/v1/restore', 'POST');
      expect(currentDocument.value).toEqual(restoredDoc);
    });
  });
});
