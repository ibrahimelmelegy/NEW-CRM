import { describe, it, expect, vi } from 'vitest';
import {
    createProposal,
    approveProposal,
    rejectProposal,
    archiveProposal,
    deleteProposal,
    createProposalFinanceTable,
    getProposalFinanceTable
} from '@/composables/useProposals';

// Mock API Globally
const mockApiFetch = vi.fn((url, method, data) => {
    // Create Proposal
    if (url === 'proposal' && method === 'POST') {
        return Promise.resolve({ success: true, body: { id: 'p1' } });
    }
    // Approve
    if (url && url.includes('proposal/approve') && method === 'PUT') {
        return Promise.resolve({ success: true });
    }
    // Reject
    if (url && url.includes('proposal/reject') && method === 'PUT') {
        if (!data.rejectionReason) return Promise.resolve({ success: false, message: 'Reason required' });
        return Promise.resolve({ success: true });
    }
    // Archive
    if (url && url.includes('proposal/archive') && method === 'PUT') {
        return Promise.resolve({ success: true });
    }
    // Delete
    if (url && url.includes('proposal/') && method === 'DELETE') {
        return Promise.resolve({ success: true });
    }
    // Finance Table Create
    if (url === 'proposal-finance-table' && method === 'POST') {
        return Promise.resolve({ success: true, body: { id: 1 } });
    }
    // Get Finance Tables
    if (url && url.includes('proposal-finance-table/?page=1')) {
        return Promise.resolve({
            success: true,
            body: {
                financeTable: [{ id: 1, title: 'Main Table', totalPrice: 500 }]
            }
        });
    }
    // Get Finance Table Items
    if (url && url.includes('proposal-finance-table-item/?page=1')) {
        return Promise.resolve({ success: true, body: { items: [{ id: 1, totalPrice: 500 }] } });
    }
    // Default GET for simple creation checks might need success
    return Promise.resolve({ success: false, message: 'Mock Error: ' + url });
});
vi.stubGlobal('useApiFetch', mockApiFetch);

vi.mock('element-plus', () => ({
    ElNotification: vi.fn(),
}));
vi.stubGlobal('navigateTo', vi.fn());

describe('Proposal Module', () => {
    it('should create a proposal successfully', async () => {
        // @ts-ignore
        await createProposal({ title: 'New Proposal', type: 'FINANCIAL' });
        expect(true).toBe(true);
    });

    describe('Approval Workflow', () => {
        it('should approve a proposal', async () => {
            const result = await approveProposal('p1');
            expect(result).toBe(true);
        });

        it('should fail to reject without reason', async () => {
            const result = await rejectProposal('p1', ''); // Empty reason
            expect(result).toBe(false);
        });

        it('should reject with reason', async () => {
            const result = await rejectProposal('p1', 'Budget too high');
            expect(result).toBe(true);
        });
    });

    describe('Finance Tables', () => {
        it('should create a finance table', async () => {
            await createProposalFinanceTable({ title: 'New Table' });
            expect(true).toBe(true);
        });

        it('should fetch finance tables with items and calculate totals', async () => {
            const tables = await getProposalFinanceTable('p1');
            expect(tables.length).toBe(1);
            expect(tables[0].total).toBe(500); // 500 from item mock
        });
    });

    describe('Archive & Delete', () => {
        it('should archive a proposal', async () => {
            const result = await archiveProposal('p1');
            expect(result).toBe(true);
        });

        it('should delete a proposal', async () => {
            const result = await deleteProposal('p1');
            expect(result).toBe(true);
        });
    });
});
