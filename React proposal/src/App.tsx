import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { setToken, getToken } from './api';
import { authApi } from './api';
import { useProposals, useCreateProposal, useUpdateProposal, useDeleteProposal } from './hooks/useProposals';
import { useApprovalWorkflow } from './hooks/useProposals';
import { useAuthStore } from './stores';

// Import proposal components
import { CreateProposal } from '../proposal/CreateProposal';
import { ProposalsTable } from '../proposal/ProposalsTable';
import { ProposalDetails } from '../proposal/ProposalDetails';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const verify = async () => {
            // Check for token in URL (passed from Vue/Nuxt iframe)
            const urlParams = new URLSearchParams(window.location.search);
            const tokenFromUrl = urlParams.get('token');

            if (tokenFromUrl) {
                console.log('Token received from URL, storing...');
                setToken(tokenFromUrl);
                window.history.replaceState({}, '', window.location.pathname);
            }

            const token = getToken();

            if (!token) {
                console.log('No token found');
                setIsAuthenticated(false);
                setChecking(false);
                return;
            }

            try {
                console.log('Verifying token with backend...');
                const response = await authApi.me();
                const user = response.body?.user || (response as any).user;
                if (user?.id) {
                    console.log('Token valid, user authenticated:', user.email);
                    setIsAuthenticated(true);
                } else {
                    console.log('Token invalid - no user in response');
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setIsAuthenticated(false);
            }

            setChecking(false);
        };

        verify();
    }, []);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="spinner"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        const isInIframe = window.self !== window.top;
        if (isInIframe) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <div className="text-center">
                        <p className="text-gray-600">Session expired. Please refresh the parent page.</p>
                        <button
                            onClick={() => window.parent.location.reload()}
                            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            );
        }
        window.location.href = 'http://localhost:3060/login';
        return null;
    }

    return <>{children}</>;
};

// Main App component
const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Proposals List */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <ProposalsListPage />
                        </ProtectedRoute>
                    }
                />

                {/* Create Proposal */}
                <Route
                    path="/create"
                    element={
                        <ProtectedRoute>
                            <CreateProposalPage />
                        </ProtectedRoute>
                    }
                />

                {/* Edit Proposal */}
                <Route
                    path="/edit/:id"
                    element={
                        <ProtectedRoute>
                            <EditProposalPage />
                        </ProtectedRoute>
                    }
                />

                {/* View Proposal */}
                <Route
                    path="/view/:id"
                    element={
                        <ProtectedRoute>
                            <ViewProposalPage />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

// ============================================
// PAGE COMPONENTS
// ============================================

// Proposals List Page
const ProposalsListPage: React.FC = () => {
    const navigate = (path: string) => window.location.href = path;

    const { data: proposalsData, isLoading, refetch } = useProposals();
    const deleteProposal = useDeleteProposal();
    const { archive, approve, reject } = useApprovalWorkflow();

    // Transform API data to component format (using any[] for flexibility)
    const proposals: any[] = (proposalsData?.docs || []).map((p: any) => ({
        id: p.id,
        title: p.title || 'Untitled Proposal',
        refNumber: p.reference || `REF-${p.id}`,
        clientName: p.proposalFor || 'Unknown Client',
        clientCompany: p.relatedEntity?.name || '',
        date: p.proposalDate || p.createdAt?.split('T')[0] || '',
        status: mapApiStatusToUI(p.status),
        currency: 'SAR',
        items: [],
        discount: 0,
        discountType: 'percent' as const,
        taxRate: 15,
    }));

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this proposal?')) {
            await deleteProposal.mutateAsync(id);
            refetch();
        }
    };

    const handleArchive = async (id: number) => {
        if (confirm('Are you sure you want to archive this proposal?')) {
            await archive.mutateAsync(id);
            refetch();
        }
    };

    const handleApprove = async (id: number) => {
        await approve.mutateAsync(id.toString());
        refetch();
    };

    const handleReject = async (id: number, reason: string) => {
        await reject.mutateAsync({ id: id.toString(), reason });
        refetch();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <ProposalsTable
                proposals={proposals}
                onAdd={() => navigate('/create')}
                onEdit={(p) => navigate(`/edit/${p.id}`)}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onView={(p) => navigate(`/view/${p.id}`)}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </div>
    );
};

// Create Proposal Page
const CreateProposalPage: React.FC = () => {
    const createProposal = useCreateProposal();
    // Get current user from auth store
    const user = useAuthStore((state) => state.user);

    const handleSave = async (data: any) => {
        try {
            // Ensure current user is included in the users array
            const payload = transformToApiPayload({
                ...data,
                users: data.users?.length > 0 ? data.users : (user?.id ? [user.id.toString()] : [])
            });
            const result = await createProposal.mutateAsync(payload);

            // Send message to Vue parent (iframe communication)
            if (window.parent !== window) {
                window.parent.postMessage({
                    action: 'PROPOSAL_SAVED',
                    id: result?.id,
                    mode: 'create'
                }, '*');
            } else {
                // Standalone mode - show success
                alert('Proposal saved successfully!');
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Failed to create proposal:', error);
            alert('Failed to create proposal. Please try again.');
        }
    };

    const handleCancel = () => {
        // Send cancel message to Vue parent
        if (window.parent !== window) {
            window.parent.postMessage({ action: 'PROPOSAL_CANCELLED' }, '*');
        } else {
            window.location.href = '/';
        }
    };

    return (
        <CreateProposal
            onSave={handleSave}
            onCancel={handleCancel}
        />
    );
};

// Edit Proposal Page
const EditProposalPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const updateProposal = useUpdateProposal();
    const { data: proposalsData } = useProposals();

    // Find the proposal to edit
    const proposal = proposalsData?.docs?.find((p: any) => p.id === parseInt(id || '0'));

    const handleSave = async (data: any) => {
        try {
            const payload = transformToApiPayload(data);
            await updateProposal.mutateAsync({ id: id || '0', data: payload });

            // Send message to Vue parent (iframe communication)
            if (window.parent !== window) {
                window.parent.postMessage({
                    action: 'PROPOSAL_SAVED',
                    id: parseInt(id || '0'),
                    mode: 'edit'
                }, '*');
            } else {
                // Standalone mode
                alert('Proposal updated successfully!');
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Failed to update proposal:', error);
            alert('Failed to update proposal. Please try again.');
        }
    };

    const handleCancel = () => {
        // Send cancel message to Vue parent
        if (window.parent !== window) {
            window.parent.postMessage({ action: 'PROPOSAL_CANCELLED' }, '*');
        } else {
            window.location.href = '/';
        }
    };

    // Transform API data to CreateProposal format
    const initialData = proposal ? transformApiToFormData(proposal) : undefined;

    return (
        <CreateProposal
            initialData={initialData}
            onSave={handleSave}
            onCancel={handleCancel}
        />
    );
};

// View Proposal Page - Uses ProposalDetails component
const ViewProposalPage: React.FC = () => {
    return <ProposalDetails />;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Map API status to UI status
function mapApiStatusToUI(status: string): string {
    const statusMap: Record<string, string> = {
        'DRAFT': 'Draft',
        'WAITING_APPROVAL': 'In Review',
        'APPROVED': 'Approved',
        'REJECTED': 'Rejected',
        'SENT': 'Sent',
        'ARCHIVED': 'Archived',
    };
    return statusMap[status] || status;
}

// Transform form data to API payload
function transformToApiPayload(data: any): any {
    return {
        title: data.title || 'New Proposal',
        version: String(data.version || '1'),
        date: data.date || new Date().toISOString().split('T')[0], // Backend expects 'date' not 'proposalDate'
        type: data.type || 'MIXED',
        reference: data.refNumber || `REF-${Date.now()}`,
        proposalFor: data.clientName || 'Client',
        companyLogo: data.logo || '/default-logo.png', // Required field
        users: data.users || [], // Required field - array of user IDs
        notes: data.executiveSummary || '',
        content: JSON.stringify({
            branding: {
                logo: data.logo,
                themeColor: data.themeColor,
                typography: data.typography,
                coverStyle: data.coverStyle,
            },
            client: {
                name: data.clientName,
                company: data.clientCompany,
                email: data.clientEmail,
                phone: data.clientPhone,
            },
            sections: {
                executiveSummary: data.executiveSummary,
                solutionScope: data.solutionScope,
                customSections: data.customSections,
            },
            finance: {
                items: data.items,
                discount: data.discount,
                discountType: data.discountType,
                taxRate: data.taxRate,
                currency: data.currency,
            },
            timeline: data.phases,
            terms: data.termsConditions,
        }),
        relatedEntityType: data.relatedEntity?.type,
        relatedEntityId: data.relatedEntity?.id,
    };
}

// Transform API data to form data
function transformApiToFormData(apiData: any): any {
    const content = apiData.content ? JSON.parse(apiData.content) : {};

    return {
        id: apiData.id,
        title: apiData.title || 'New Project Proposal',
        refNumber: apiData.reference || '',
        date: apiData.proposalDate || new Date().toISOString().split('T')[0],
        clientName: apiData.proposalFor || '',
        clientCompany: content.client?.company || '',
        clientEmail: content.client?.email || '',
        clientPhone: content.client?.phone || '',
        logo: content.branding?.logo || '',
        themeColor: content.branding?.themeColor || '#7c3aed',
        typography: content.branding?.typography || 'Sans',
        coverStyle: content.branding?.coverStyle || 'corporate',
        executiveSummary: content.sections?.executiveSummary || '',
        solutionScope: content.sections?.solutionScope || '',
        customSections: content.sections?.customSections || [],
        items: content.finance?.items || [],
        discount: content.finance?.discount || 0,
        discountType: content.finance?.discountType || 'percent',
        taxRate: content.finance?.taxRate || 15,
        currency: content.finance?.currency || 'SAR',
        phases: content.timeline || [],
        termsConditions: content.terms || '',
        status: apiData.status || 'DRAFT',
    };
}

export default App;
