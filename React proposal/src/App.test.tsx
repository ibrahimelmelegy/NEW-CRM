
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom matchers
import App from './App';
import * as useProposalsHooks from './hooks/useProposals';

// Mock the hooks
vi.mock('./hooks/useProposals', async () => {
    const actual = await vi.importActual('./hooks/useProposals');
    return {
        ...actual,
        useProposal: vi.fn(),
        useUpdateProposal: vi.fn(() => ({
            mutateAsync: vi.fn()
        })),
        useProposals: vi.fn(() => ({
            data: { docs: [] },
            isLoading: false,
            refetch: vi.fn()
        })),
        useCreateProposal: vi.fn(() => ({
            mutateAsync: vi.fn()
        })),
        useDeleteProposal: vi.fn(() => ({
            mutateAsync: vi.fn()
        })),
        useApprovalWorkflow: vi.fn(() => ({
            archive: { mutateAsync: vi.fn() },
            approve: { mutateAsync: vi.fn() },
            reject: { mutateAsync: vi.fn() }
        })),
    };
});

// Mock API for Auth
vi.mock('./api', async () => {
    const actual = await vi.importActual('./api');
    return {
        ...actual,
        getToken: vi.fn(() => 'test-token'),
        authApi: {
            me: vi.fn().mockResolvedValue({
                success: true,
                body: { user: { id: 1, email: 'test@example.com' } }
            })
        }
    };
});

vi.mock('../proposal/CreateProposal', () => ({
    CreateProposal: ({ initialData }: { initialData: any }) => (
        <div data-testid="mock-create-proposal">
            <span data-testid="client-name">{initialData?.clientName || 'No Client'}</span>
        </div>
    )
}));

vi.mock('../proposal/ProposalsTable', () => ({
    ProposalsTable: ({ onArchive, proposals }: any) => (
        <div>
            <h1>Proposals Table</h1>
            {proposals.map((p: any) => (
                <div key={p.id} data-testid={`proposal-${p.id}`}>
                    <button
                        data-testid={`archive-btn-${p.id}`}
                        onClick={() => onArchive(p.id)}
                    >
                        Archive/Unarchive
                    </button>
                    <span data-testid={`status-${p.id}`}>{p.status}</span>
                </div>
            ))}
        </div>
    )
}));

describe('EditProposalPage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset URL to /edit/123
        window.history.pushState({}, 'Edit Proposal', '/edit/123');
    });

    it('fetches proposal details and passes client name to form', async () => {
        // Setup mock data
        const mockProposal = {
            id: '123',
            title: 'Test Proposal',
            proposalFor: 'Test Client Name',
            status: 'DRAFT',
            content: JSON.stringify({
                client: {
                    company: 'Test Company'
                },
                branding: {},
                finance: {},
                sections: {}
            })
        };

        // Mock useProposal to return this data
        (useProposalsHooks.useProposal as any).mockReturnValue({
            data: mockProposal,
            isLoading: false,
            isError: false
        });

        render(<App />);

        // Wait for auth check to pass and component to render
        await waitFor(() => {
            expect(screen.getByTestId('mock-create-proposal')).toBeInTheDocument();
        });

        // Check if the client name is correctly extracted and passed
        const clientNameElement = screen.getByTestId('client-name');
        expect(clientNameElement).toHaveTextContent('Test Client Name');

        // Verify useProposal was called with the correct ID
        expect(useProposalsHooks.useProposal).toHaveBeenCalledWith('123');
    });

    it('shows loading state while fetching', async () => {
        (useProposalsHooks.useProposal as any).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        render(<App />);

        await waitFor(() => {
            expect(screen.getByText(/Loading proposal details/i)).toBeInTheDocument();
        });
    });
});

describe('ProposalsListPage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.history.pushState({}, 'Proposals List', '/');
        // Mock confirm to always return true
        vi.spyOn(window, 'confirm').mockImplementation(() => true);
    });

    it('calls archive mutation with unarchive action when proposal is archived', async () => {
        const mockArchiveMutate = vi.fn();

        // Mock useApprovalWorkflow
        (useProposalsHooks.useApprovalWorkflow as any).mockReturnValue({
            archive: { mutateAsync: mockArchiveMutate },
            approve: { mutateAsync: vi.fn() },
            reject: { mutateAsync: vi.fn() }
        });

        // Mock useProposals to return an archived proposal
        (useProposalsHooks.useProposals as any).mockReturnValue({
            data: {
                docs: [
                    {
                        id: 999, // ID as number to match handleArchive signature
                        title: 'Archived Proposal',
                        status: 'ARCHIVED',
                        createdAt: '2023-01-01'
                    }
                ]
            },
            isLoading: false,
            refetch: vi.fn()
        });

        render(<App />);

        // Wait for table
        await waitFor(() => {
            expect(screen.getByText('Proposals Table')).toBeInTheDocument();
        });

        // Click archive button for proposal 999
        // This should trigger handleArchive(999)
        const btn = screen.getByTestId('archive-btn-999');
        await btn.click(); // Trigger click

        // Expect confirm to have been called
        expect(window.confirm).toHaveBeenCalled();

        // Expect mutateAsync to be called with correct args
        expect(mockArchiveMutate).toHaveBeenCalledWith({
            id: '999',
            action: 'unarchive'
        });
    });
});
