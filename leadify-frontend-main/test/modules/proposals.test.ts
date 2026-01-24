import { describe, it, expect } from 'vitest';

// --- Mock Logic for Proposal ---
// In a real scenario, these would be imported from your stores or utils
interface ProposalItem {
    name: string;
    price: number;
    qty: number;
}

interface Proposal {
    id: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    items: ProposalItem[];
    total: number;
}

const calculateProposalTotal = (proposal: Proposal) => {
    proposal.total = proposal.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    return proposal.total;
};

const updateProposalStatus = (proposal: Proposal, newStatus: Proposal['status']) => {
    // Basic validation logic
    if (proposal.status === 'draft' && newStatus === 'sent') {
        proposal.status = newStatus;
        return true;
    }
    return false;
};

describe('Module: Proposals', () => {
    it('should correctly calculate the total price of items', () => {
        const proposal: Proposal = {
            id: '1',
            status: 'draft',
            items: [
                { name: 'Web Development', price: 100, qty: 2 },
                { name: 'Hosting', price: 50, qty: 1 }
            ],
            total: 0
        };

        const total = calculateProposalTotal(proposal);

        // Math Logic: (100 * 2) + (50 * 1) = 250
        expect(total).toBe(250);
        expect(proposal.total).toBe(250);
    });

    it('should allow status transition from Draft to Sent', () => {
        const proposal: Proposal = {
            id: '1',
            status: 'draft',
            items: [],
            total: 0
        };

        const success = updateProposalStatus(proposal, 'sent');

        expect(success).toBe(true);
        expect(proposal.status).toBe('sent');
    });
});
