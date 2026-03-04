/**
 * useWorkflows - Unit Tests
 * ===========================
 * Tests for composables/useWorkflows.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  WORKFLOW_TRIGGERS,
  CONDITION_OPERATORS,
  ACTION_TYPES,
  fetchWorkflows,
  fetchWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  fetchWorkflowLogs
} from '~/composables/useWorkflows';

const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

const mockNotification = vi.fn();
(globalThis as any).ElNotification = mockNotification;

vi.mock('element-plus', () => ({
  ElNotification: (...args: any[]) => mockNotification(...args)
}));

describe('useWorkflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Constants
  // ============================================
  describe('constants', () => {
    it('should have 10 workflow triggers', () => {
      expect(WORKFLOW_TRIGGERS).toHaveLength(10);
    });

    it('should have 6 condition operators', () => {
      expect(CONDITION_OPERATORS).toHaveLength(6);
    });

    it('should have 4 action types', () => {
      expect(ACTION_TYPES).toHaveLength(4);
    });

    it('should include LEAD_CREATED trigger', () => {
      expect(WORKFLOW_TRIGGERS.find(t => t.value === 'LEAD_CREATED')).toBeDefined();
    });
  });

  // ============================================
  // fetchWorkflows
  // ============================================
  describe('fetchWorkflows', () => {
    it('should return workflows on success', async () => {
      const workflows = [{ id: '1', name: 'WF1', trigger: 'LEAD_CREATED', isActive: true }];
      mockApiFetch.mockResolvedValue({ body: workflows, success: true });

      const result = await fetchWorkflows();

      expect(mockApiFetch).toHaveBeenCalledWith('workflows');
      expect(result).toEqual(workflows);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchWorkflows();

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // fetchWorkflow
  // ============================================
  describe('fetchWorkflow', () => {
    it('should return single workflow on success', async () => {
      const wf = { id: '1', name: 'WF1' };
      mockApiFetch.mockResolvedValue({ body: wf, success: true });

      const result = await fetchWorkflow('1');

      expect(mockApiFetch).toHaveBeenCalledWith('workflows/1');
      expect(result).toEqual(wf);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchWorkflow('999');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // createWorkflow
  // ============================================
  describe('createWorkflow', () => {
    it('should create workflow and show success notification', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createWorkflow({ name: 'New WF', trigger: 'LEAD_CREATED' });

      expect(mockApiFetch).toHaveBeenCalledWith('workflows', 'POST', expect.objectContaining({ name: 'New WF' }));
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Workflow created' }));
    });

    it('should show error notification on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Name required' });

      await createWorkflow({ name: '' });

      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Name required' }));
    });
  });

  // ============================================
  // updateWorkflow
  // ============================================
  describe('updateWorkflow', () => {
    it('should update workflow and show success notification', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateWorkflow('1', { name: 'Updated' });

      expect(mockApiFetch).toHaveBeenCalledWith('workflows/1', 'PUT', { name: 'Updated' });
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Workflow updated' }));
    });

    it('should show error on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Not found' });

      await updateWorkflow('999', { name: 'X' });

      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
  });

  // ============================================
  // deleteWorkflow
  // ============================================
  describe('deleteWorkflow', () => {
    it('should delete workflow and show success notification', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteWorkflow('1');

      expect(mockApiFetch).toHaveBeenCalledWith('workflows/1', 'DELETE');
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Workflow deleted' }));
    });

    it('should not show notification on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false });

      await deleteWorkflow('1');

      expect(mockNotification).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // toggleWorkflow
  // ============================================
  describe('toggleWorkflow', () => {
    it('should toggle workflow active status', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await toggleWorkflow('1', true);

      expect(mockApiFetch).toHaveBeenCalledWith('workflows/1', 'PUT', { isActive: true });
    });

    it('should toggle workflow to inactive', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await toggleWorkflow('1', false);

      expect(mockApiFetch).toHaveBeenCalledWith('workflows/1', 'PUT', { isActive: false });
    });
  });

  // ============================================
  // fetchWorkflowLogs
  // ============================================
  describe('fetchWorkflowLogs', () => {
    it('should fetch logs for workflow', async () => {
      const logs = [{ id: '1', status: 'SUCCESS', executedAt: '2024-01-01' }];
      mockApiFetch.mockResolvedValue({ body: logs, success: true });

      const result = await fetchWorkflowLogs('1');

      expect(mockApiFetch).toHaveBeenCalledWith('workflows/1/logs');
      expect(result).toEqual(logs);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchWorkflowLogs('1');

      expect(result).toEqual([]);
    });
  });
});
