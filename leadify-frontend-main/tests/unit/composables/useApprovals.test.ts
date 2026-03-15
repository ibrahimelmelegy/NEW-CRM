/**
 * useApprovals - Unit Tests
 * ==========================
 * Tests for composables/useApprovals.ts
 *
 * The composable provides:
 * - fetchWorkflows, createWorkflow, updateWorkflow, deleteWorkflow
 * - fetchRequests, fetchPendingApprovals, createRequest
 * - approveRequest, rejectRequest, cancelRequest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApprovals } from '@/composables/useApprovals';

const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);

describe('useApprovals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchWorkflows
  // ============================================
  describe('fetchWorkflows', () => {
    it('should call the correct endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: [] });

      const { fetchWorkflows } = useApprovals();
      await fetchWorkflows();

      expect(mockUseApiFetch).toHaveBeenCalledWith('approvals/workflows');
    });

    it('should return the API response', async () => {
      const mockResponse = { success: true, body: [{ id: 1, name: 'Discount Approval' }] };
      mockUseApiFetch.mockResolvedValue(mockResponse);

      const { fetchWorkflows } = useApprovals();
      const result = await fetchWorkflows();

      expect(result).toEqual(mockResponse);
    });
  });

  // ============================================
  // createWorkflow
  // ============================================
  describe('createWorkflow', () => {
    it('should call POST endpoint with workflow data', async () => {
      const data = { name: 'New Workflow', steps: [] };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 2, ...data } });

      const { createWorkflow } = useApprovals();
      await createWorkflow(data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('approvals/workflows', 'POST', data);
    });

    it('should return the created workflow', async () => {
      const response = { success: true, body: { id: 2, name: 'Test Workflow' } };
      mockUseApiFetch.mockResolvedValue(response);

      const { createWorkflow } = useApprovals();
      const result = await createWorkflow({ name: 'Test Workflow' });

      expect(result).toEqual(response);
    });

    it('should handle creation failure', async () => {
      const response = { success: false, message: 'Validation failed' };
      mockUseApiFetch.mockResolvedValue(response);

      const { createWorkflow } = useApprovals();
      const result = await createWorkflow({ name: '' });

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // updateWorkflow
  // ============================================
  describe('updateWorkflow', () => {
    it('should call PUT endpoint with correct ID and data', async () => {
      const data = { name: 'Updated Workflow' };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 1, ...data } });

      const { updateWorkflow } = useApprovals();
      await updateWorkflow(1, data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('approvals/workflows/1', 'PUT', data);
    });
  });

  // ============================================
  // deleteWorkflow
  // ============================================
  describe('deleteWorkflow', () => {
    it('should call DELETE endpoint with correct ID', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      const { deleteWorkflow } = useApprovals();
      await deleteWorkflow(1);

      expect(mockUseApiFetch).toHaveBeenCalledWith('approvals/workflows/1', 'DELETE');
    });
  });

  // ============================================
  // fetchRequests
  // ============================================
  describe('fetchRequests', () => {
    it('should fetch all approval requests without params', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { docs: [] } });

      const { fetchRequests } = useApprovals();
      await fetchRequests();

      expect(mockUseApiFetch).toHaveBeenCalledWith('approvals/requests');
    });

    it('should include query params when provided', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { docs: [] } });

      const { fetchRequests } = useApprovals();
      await fetchRequests({ status: 'PENDING', page: '1' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('status=PENDING');
      expect(calledUrl).toContain('page=1');
    });
  });

  // ============================================
  // fetchPendingApprovals
  // ============================================
  describe('fetchPendingApprovals', () => {
    it('should call the pending approvals endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: [{ id: 10, status: 'PENDING' }] });

      const { fetchPendingApprovals } = useApprovals();
      const result = await fetchPendingApprovals();

      expect(mockUseApiFetch).toHaveBeenCalledWith('approvals/requests/pending');
      expect(result).toBeDefined();
    });

    it('should return empty body on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ success: false, body: null });

      const { fetchPendingApprovals } = useApprovals();
      const result = await fetchPendingApprovals();

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // createRequest
  // ============================================
  describe('createRequest', () => {
    it('should call POST with request data', async () => {
      const data = { workflowId: 1, entityType: 'deal', entityId: '5', amount: 5000 };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 20, status: 'PENDING', ...data } });

      const { createRequest } = useApprovals();
      await createRequest(data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('approvals/requests', 'POST', data);
    });
  });

  // ============================================
  // approveRequest
  // ============================================
  describe('approveRequest', () => {
    it('should call the approve endpoint with comment', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 10, status: 'APPROVED' } });

      const { approveRequest } = useApprovals();
      await approveRequest(10, 'Looks good');

      expect(mockUseApiFetch).toHaveBeenCalledWith('approvals/requests/10/approve', 'POST', { comment: 'Looks good' });
    });

    it('should allow empty comment', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      const { approveRequest } = useApprovals();
      await approveRequest(10, '');

      expect(mockUseApiFetch).toHaveBeenCalledWith('approvals/requests/10/approve', 'POST', { comment: '' });
    });
  });

  // ============================================
  // rejectRequest
  // ============================================
  describe('rejectRequest', () => {
    it('should call the reject endpoint with reason comment', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 10, status: 'REJECTED' } });

      const { rejectRequest } = useApprovals();
      await rejectRequest(10, 'Amount too high');

      expect(mockUseApiFetch).toHaveBeenCalledWith('approvals/requests/10/reject', 'POST', { comment: 'Amount too high' });
    });

    it('should return the API response', async () => {
      const response = { success: true, body: { id: 10, status: 'REJECTED' } };
      mockUseApiFetch.mockResolvedValue(response);

      const { rejectRequest } = useApprovals();
      const result = await rejectRequest(10, 'Too expensive');

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // cancelRequest
  // ============================================
  describe('cancelRequest', () => {
    it('should call the cancel endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      const { cancelRequest } = useApprovals();
      await cancelRequest(10);

      expect(mockUseApiFetch).toHaveBeenCalledWith('approvals/requests/10/cancel', 'POST');
    });

    it('should handle cancellation failure', async () => {
      const response = { success: false, message: 'Cannot cancel approved request' };
      mockUseApiFetch.mockResolvedValue(response);

      const { cancelRequest } = useApprovals();
      const result = await cancelRequest(10);

      expect(result.success).toBe(false);
    });
  });
});
