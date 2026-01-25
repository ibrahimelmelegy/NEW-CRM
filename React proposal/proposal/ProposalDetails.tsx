/**
 * Proposal Details Page
 * Displays full proposal information with status, attachments, and actions
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Edit, Trash2, Download, Clock, CheckCircle,
    XCircle, Send, Building2, User, DollarSign,
    ExternalLink, AlertCircle, Loader2, RefreshCw, FileText
} from 'lucide-react';
import { useProposal, useDeleteProposal, useApprovalWorkflow } from '../src/hooks/useProposals';
import { ApprovalActions, ProposalStatus } from './components/ApprovalActions';

interface ProposalDetailsProps {
    proposalId?: string;
}

export const ProposalDetails: React.FC<ProposalDetailsProps> = ({ proposalId: propId }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const proposalId = propId || id || '';

    const { data: proposal, isLoading, error, refetch } = useProposal(proposalId);
    const deleteProposal = useDeleteProposal();
    const { submitForApproval, approve, reject } = useApprovalWorkflow();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Parse content if it's stored as JSON
    const getContent = () => {
        if (!proposal?.content) return null;
        try {
            return typeof proposal.content === 'string'
                ? JSON.parse(proposal.content)
                : proposal.content;
        } catch {
            return null;
        }
    };

    const content = getContent();

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; icon: typeof Clock; label: string }> = {
            'DRAFT': { color: 'bg-gray-100 text-gray-600', icon: Clock, label: 'Draft' },
            'WAITING_APPROVAL': { color: 'bg-amber-100 text-amber-600', icon: Clock, label: 'Waiting Approval' },
            'APPROVED': { color: 'bg-green-100 text-green-600', icon: CheckCircle, label: 'Approved' },
            'REJECTED': { color: 'bg-red-100 text-red-600', icon: XCircle, label: 'Rejected' },
            'SENT': { color: 'bg-blue-100 text-blue-600', icon: Send, label: 'Sent to Client' },
            'ARCHIVED': { color: 'bg-slate-100 text-slate-600', icon: AlertCircle, label: 'Archived' },
        };
        return configs[status] || configs['DRAFT'];
    };

    const handleDelete = async () => {
        await deleteProposal.mutateAsync(proposalId);
        navigate('/');
    };

    const handleApprovalAction = async (action: 'submit' | 'approve' | 'reject', reason?: string) => {
        try {
            if (action === 'submit') {
                await submitForApproval.mutateAsync(proposalId);
            } else if (action === 'approve') {
                await approve.mutateAsync(proposalId);
            } else if (action === 'reject' && reason) {
                await reject.mutateAsync({ id: proposalId, reason });
            }
            refetch();
        } catch (error) {
            console.error('Approval action failed:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-violet-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading proposal...</p>
                </div>
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">Proposal not found</p>
                    <button
                        onClick={() => navigate('/')}
                        className="text-violet-600 hover:text-violet-700 font-medium"
                    >
                        Back to Proposals
                    </button>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(proposal.status || 'DRAFT');
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{proposal.title || 'Untitled Proposal'}</h1>
                            <p className="text-sm text-gray-500">
                                {proposal.reference || `REF-${proposal.id}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className="text-gray-500" />
                        </button>
                        <button
                            onClick={() => navigate(`/edit/${proposalId}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700"
                        >
                            <Edit size={16} />
                            Edit
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="col-span-2 space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${statusConfig.color}`}>
                                        <StatusIcon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <p className="font-bold text-gray-900">{statusConfig.label}</p>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-full text-sm font-medium ${statusConfig.color}`}>
                                    {statusConfig.label}
                                </div>
                            </div>

                            {/* Approval Actions */}
                            <ApprovalActions
                                proposalId={parseInt(proposalId)}
                                currentStatus={(proposal.status || 'DRAFT') as ProposalStatus}
                                onSubmitForApproval={() => handleApprovalAction('submit')}
                                onApprove={() => handleApprovalAction('approve')}
                                onReject={(_id, reason) => handleApprovalAction('reject', reason)}
                                onSendToClient={async () => console.log('Send to client')}
                            />
                        </div>

                        {/* Executive Summary */}
                        {content?.sections?.executiveSummary && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Executive Summary</h3>
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: content.sections.executiveSummary }}
                                />
                            </div>
                        )}

                        {/* Solution Scope */}
                        {content?.sections?.solutionScope && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Solution & Scope</h3>
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: content.sections.solutionScope }}
                                />
                            </div>
                        )}

                        {/* Financial Summary */}
                        {content?.finance?.items && content.finance.items.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <DollarSign size={20} className="text-violet-600" />
                                    Financial Summary
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr className="text-xs text-gray-500 uppercase">
                                                <th className="py-3 px-4 text-left">Description</th>
                                                <th className="py-3 px-4 text-center">Qty</th>
                                                <th className="py-3 px-4 text-right">Rate</th>
                                                <th className="py-3 px-4 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {content.finance.items.map((item: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="py-3 px-4 font-medium">{item.description}</td>
                                                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                                                    <td className="py-3 px-4 text-right">{item.rate?.toLocaleString()}</td>
                                                    <td className="py-3 px-4 text-right font-bold">
                                                        {((item.quantity || 0) * (item.rate || 0)).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Related Entity */}
                        {proposal.relatedEntityType && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                                    Related To
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-violet-100 rounded-xl">
                                        <Building2 size={20} className="text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {proposal.relatedEntity?.name || `ID: ${proposal.relatedEntityId}`}
                                        </p>
                                        <p className="text-sm text-gray-500">{proposal.relatedEntityType}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Client Info */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                                Client
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User size={18} className="text-gray-400" />
                                    <span className="text-gray-900">{proposal.proposalFor || 'Not specified'}</span>
                                </div>
                                {content?.client?.email && (
                                    <div className="flex items-center gap-3">
                                        <ExternalLink size={18} className="text-gray-400" />
                                        <a href={`mailto:${content.client.email}`} className="text-violet-600 hover:underline">
                                            {content.client.email}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                                Dates
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Created</span>
                                    <span className="font-medium text-gray-900">
                                        {proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Proposal Date</span>
                                    <span className="font-medium text-gray-900">
                                        {proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Last Modified</span>
                                    <span className="font-medium text-gray-900">
                                        {proposal.updatedAt ? new Date(proposal.updatedAt).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => window.open(`/document/${proposalId}`, '_blank')}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors text-left"
                                >
                                    <FileText size={18} className="text-violet-600" />
                                    <span className="font-medium text-violet-700">View Proposal Page</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
                                    <Download size={18} className="text-gray-500" />
                                    <span className="font-medium text-gray-700">Download PDF</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
                                    <Send size={18} className="text-gray-500" />
                                    <span className="font-medium text-gray-700">Send to Client</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-xl">
                                <AlertCircle size={20} className="text-red-600" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">Delete Proposal</h3>
                        </div>
                        <p className="text-gray-500 mb-6">
                            Are you sure you want to delete this proposal? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteProposal.isPending}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteProposal.isPending && <Loader2 size={16} className="animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProposalDetails;
