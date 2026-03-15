/**
 * useProposals - Unit Tests
 * ==========================
 * Tests for composables/useProposals.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  proposalRelatedTypes,
  proposalStatus,
  ProposalType,
  fileAttachmentsFormats,
  getProposal,
  getProposalFinanceTableByPropsalId,
  getProposalFinanceTableItemByTablelId,
  createProposalFinanceTable,
  updateProposalFinanceTable,
  deleteProposalFinanceTableItem,
  deleteCustomColumn,
  submitForApproval,
  approveProposal,
  rejectProposal,
  archiveProposal,
  deleteProposal,
  type ProposalData,
  type FinanceTable,
  type FinanceTableItem
} from '~/composables/useProposals';

// Mock useApiFetch globally
const mockApiFetch = vi.fn();
(globalThis as Record<string, unknown>).useApiFetch = mockApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockApiFetch(...args)
}));

// Mock dependencies
vi.mock('@/composables/useOpportunity', () => ({
  getOpportunities: vi.fn()
}));

// Mock getDeals and getProjects globals (Nuxt auto-imports)
(globalThis as Record<string, unknown>).getDeals = vi.fn();
(globalThis as Record<string, unknown>).getProjects = vi.fn();

describe('useProposals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as Record<string, unknown>).ElNotification = vi.fn();
    (globalThis as Record<string, unknown>).navigateTo = vi.fn();
  });

  // ============================================
  // Static Options
  // ============================================
  describe('proposalRelatedTypes', () => {
    it('should have 3 related types', () => {
      expect(proposalRelatedTypes).toHaveLength(3);
    });

    it('should include Opportunity, Deal, Project', () => {
      const values = proposalRelatedTypes.map(t => t.value);
      expect(values).toContain('Opportunity');
      expect(values).toContain('Deal');
      expect(values).toContain('Project');
    });

    it('should have label and value for each type', () => {
      proposalRelatedTypes.forEach(t => {
        expect(t).toHaveProperty('label');
        expect(t).toHaveProperty('value');
        expect(typeof t.label).toBe('string');
      });
    });
  });

  describe('proposalStatus', () => {
    it('should have 4 status options', () => {
      expect(proposalStatus).toHaveLength(4);
    });

    it('should include APPROVED status', () => {
      const approved = proposalStatus.find(s => s.value === 'APPROVED');
      expect(approved).toBeDefined();
      expect(approved?.label).toBe('Approved');
    });

    it('should include WAITING_APPROVAL status', () => {
      const waiting = proposalStatus.find(s => s.value === 'WAITING_APPROVAL');
      expect(waiting).toBeDefined();
      expect(waiting?.label).toBe('Waiting Approval');
    });

    it('should include REJECTED and ARCHIVED', () => {
      const values = proposalStatus.map(s => s.value);
      expect(values).toContain('REJECTED');
      expect(values).toContain('ARCHIVED');
    });
  });

  describe('ProposalType', () => {
    it('should have 3 proposal types', () => {
      expect(ProposalType).toHaveLength(3);
    });

    it('should include Financial type', () => {
      const financial = ProposalType.find(t => t.value === 'FINANCIAL');
      expect(financial).toBeDefined();
      expect(financial?.label).toBe('Financial');
    });

    it('should include Technical type', () => {
      const technical = ProposalType.find(t => t.value === 'TECHNICAL');
      expect(technical).toBeDefined();
      expect(technical?.label).toBe('Technical');
    });

    it('should include MIXED type', () => {
      const mixed = ProposalType.find(t => t.value === 'MIXED');
      expect(mixed).toBeDefined();
      expect(mixed?.label).toBe('Tech & Financial');
    });
  });

  describe('fileAttachmentsFormats', () => {
    it('should include PDF', () => {
      expect(fileAttachmentsFormats).toContain('application/pdf');
    });

    it('should include common image formats', () => {
      expect(fileAttachmentsFormats).toContain('image/png');
      expect(fileAttachmentsFormats).toContain('image/jpeg');
    });

    it('should include Word document format', () => {
      expect(fileAttachmentsFormats).toContain('application/msword');
    });

    it('should have at least 10 formats', () => {
      expect(fileAttachmentsFormats.length).toBeGreaterThanOrEqual(10);
    });
  });

  // ============================================
  // getProposal
  // ============================================
  describe('getProposal', () => {
    it('should fetch proposal by id', async () => {
      const proposalData: ProposalData = {
        id: 'prop-1',
        title: 'Test Proposal',
        status: 'APPROVED',
        type: 'FINANCIAL'
      };
      mockApiFetch.mockResolvedValue({ body: proposalData, success: true });

      const result = await getProposal('prop-1');

      expect(mockApiFetch).toHaveBeenCalledWith('proposal/prop-1');
      expect(result).toEqual(proposalData);
    });

    it('should return empty object on error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const result = await getProposal('bad-id');

      expect(result).toEqual({});
      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
  });

  // ============================================
  // getProposalFinanceTableByPropsalId
  // ============================================
  describe('getProposalFinanceTableByPropsalId', () => {
    it('should fetch finance table data', async () => {
      const tableData = {
        financeTable: [{ id: 1, name: 'Table 1' }],
        pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 }
      };
      mockApiFetch.mockResolvedValue({ body: tableData, success: true });

      const result = await getProposalFinanceTableByPropsalId('prop-1');

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('proposal-finance-table'));
      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('proposalId=prop-1'));
      expect(result).toEqual(tableData);
    });

    it('should return empty object on error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Fetch failed'));

      const result = await getProposalFinanceTableByPropsalId('bad-id');

      expect(result).toEqual({});
    });
  });

  // ============================================
  // getProposalFinanceTableItemByTablelId
  // ============================================
  describe('getProposalFinanceTableItemByTablelId', () => {
    it('should fetch table items', async () => {
      const items: FinanceTableItem[] = [{ id: 1, description: 'Item 1', qty: 2, unitPrice: 100, totalPrice: 200 }];
      mockApiFetch.mockResolvedValue({ body: { items }, success: true });

      const result = await getProposalFinanceTableItemByTablelId('5');

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('proposal-finance-table-item'));
      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('financeTableId=5'));
      expect(result).toEqual({ items });
    });

    it('should return empty object on error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Fetch failed'));

      const result = await getProposalFinanceTableItemByTablelId('bad');

      expect(result).toEqual({});
    });
  });

  // ============================================
  // createProposalFinanceTable
  // ============================================
  describe('createProposalFinanceTable', () => {
    it('should POST finance table data on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createProposalFinanceTable({ name: 'New Table', proposalId: 'prop-1' });

      expect(mockApiFetch).toHaveBeenCalledWith('proposal-finance-table', 'POST', expect.objectContaining({ name: 'New Table' }));
      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    });

    it('should show error on failed response', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Validation error' });

      await createProposalFinanceTable({ name: '' });

      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Validation error' })
      );
    });

    it('should handle unexpected errors', async () => {
      mockApiFetch.mockRejectedValue(new Error('Connection timeout'));

      await createProposalFinanceTable({ name: 'Table' });

      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Connection timeout' })
      );
    });
  });

  // ============================================
  // updateProposalFinanceTable
  // ============================================
  describe('updateProposalFinanceTable', () => {
    it('should PUT finance table data on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateProposalFinanceTable({ name: 'Updated Table' }, 1, 'prop-1');

      expect(mockApiFetch).toHaveBeenCalledWith('proposal-finance-table/1', 'PUT', expect.objectContaining({ name: 'Updated Table' }));
      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    });

    it('should show error on failed response', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Not found' });

      await updateProposalFinanceTable({ name: 'X' }, 999, undefined);

      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Not found' })
      );
    });
  });

  // ============================================
  // deleteProposalFinanceTableItem
  // ============================================
  describe('deleteProposalFinanceTableItem', () => {
    it('should DELETE item on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteProposalFinanceTableItem(5);

      expect(mockApiFetch).toHaveBeenCalledWith('proposal-finance-table-item/5', 'DELETE');
      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    });

    it('should show error on failed delete', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Cannot delete' });

      await deleteProposalFinanceTableItem(5);

      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Cannot delete' })
      );
    });
  });

  // ============================================
  // deleteCustomColumn
  // ============================================
  describe('deleteCustomColumn', () => {
    it('should DELETE column by table id and key', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteCustomColumn(1, 'col_discount');

      expect(mockApiFetch).toHaveBeenCalledWith('proposal-finance-table/1/col_discount', 'DELETE');
      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    });

    it('should show error on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Column not found' });

      await deleteCustomColumn(1, 'nonexistent');

      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Column not found' })
      );
    });
  });

  // ============================================
  // submitForApproval
  // ============================================
  describe('submitForApproval', () => {
    it('should submit proposal for approval', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const result = await submitForApproval('prop-1');

      expect(mockApiFetch).toHaveBeenCalledWith('proposal/waiting-approval/prop-1', 'PUT');
      expect(result).toBe(true);
      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', message: 'Proposal submitted for approval' })
      );
    });

    it('should return false on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Not authorized' });

      const result = await submitForApproval('prop-1');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const result = await submitForApproval('prop-1');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // approveProposal
  // ============================================
  describe('approveProposal', () => {
    it('should approve proposal', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const result = await approveProposal('prop-1');

      expect(mockApiFetch).toHaveBeenCalledWith('proposal/approve/prop-1', 'PUT');
      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Already approved' });

      const result = await approveProposal('prop-1');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // rejectProposal
  // ============================================
  describe('rejectProposal', () => {
    it('should reject proposal with reason', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const result = await rejectProposal('prop-1', 'Budget exceeded');

      expect(mockApiFetch).toHaveBeenCalledWith('proposal/reject/prop-1', 'PUT', { rejectionReason: 'Budget exceeded' });
      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Cannot reject' });

      const result = await rejectProposal('prop-1', 'Reason');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // archiveProposal
  // ============================================
  describe('archiveProposal', () => {
    it('should archive proposal', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const result = await archiveProposal('prop-1');

      expect(mockApiFetch).toHaveBeenCalledWith('proposal/archive/prop-1', 'PUT');
      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Cannot archive' });

      const result = await archiveProposal('prop-1');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // deleteProposal
  // ============================================
  describe('deleteProposal', () => {
    it('should delete proposal', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const result = await deleteProposal('prop-1');

      expect(mockApiFetch).toHaveBeenCalledWith('proposal/prop-1', 'DELETE');
      expect(result).toBe(true);
      expect((globalThis as Record<string, unknown>).ElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', message: 'Proposal deleted successfully' })
      );
    });

    it('should return false on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Proposal in use' });

      const result = await deleteProposal('prop-1');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Server error'));

      const result = await deleteProposal('prop-1');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // ProposalData interface type check
  // ============================================
  describe('ProposalData interface', () => {
    it('should create valid ProposalData object', () => {
      const proposal: ProposalData = {
        id: 'prop-123',
        title: 'Technical Proposal for Client A',
        version: '1.0',
        type: 'TECHNICAL',
        status: 'APPROVED',
        content: '<h1>Proposal</h1>',
        notes: 'Reviewed by team',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15'
      };

      expect(proposal.id).toBe('prop-123');
      expect(proposal.title).toBe('Technical Proposal for Client A');
      expect(proposal.status).toBe('APPROVED');
    });

    it('should allow optional fields', () => {
      const proposal: ProposalData = {
        title: 'Minimal Proposal'
      };

      expect(proposal.title).toBe('Minimal Proposal');
      expect(proposal.id).toBeUndefined();
      expect(proposal.content).toBeUndefined();
    });
  });

  // ============================================
  // FinanceTable interface type check
  // ============================================
  describe('FinanceTable interface', () => {
    it('should create valid FinanceTable object', () => {
      const table: FinanceTable = {
        id: 1,
        proposalId: 'prop-1',
        name: 'Service Items',
        totalPrice: 5000,
        items: [
          { id: 1, description: 'Design', qty: 10, unitPrice: 200, totalPrice: 2000 },
          { id: 2, description: 'Dev', qty: 20, unitPrice: 150, totalPrice: 3000 }
        ],
        subtotal: 5000,
        total: 5000
      };

      expect(table.id).toBe(1);
      expect(table.name).toBe('Service Items');
      expect(table.items).toHaveLength(2);
      expect(table.total).toBe(5000);
    });
  });
});
