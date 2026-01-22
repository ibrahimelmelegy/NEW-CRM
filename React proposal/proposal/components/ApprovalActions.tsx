/**
 * Approval Workflow Component
 * Handles proposal approval, rejection, and status changes
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Send, AlertCircle, Loader2, MessageSquare } from 'lucide-react';

export type ProposalStatus = 'DRAFT' | 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SENT' | 'ARCHIVED';

interface ApprovalActionsProps {
    proposalId: number;
    currentStatus: ProposalStatus;
    onSubmitForApproval: (id: number) => Promise<void>;
    onApprove: (id: number) => Promise<void>;
    onReject: (id: number, reason: string) => Promise<void>;
    onSendToClient: (id: number) => Promise<void>;
    canApprove?: boolean;
    disabled?: boolean;
}

export const ApprovalActions: React.FC<ApprovalActionsProps> = ({
    proposalId,
    currentStatus,
    onSubmitForApproval,
    onApprove,
    onReject,
    onSendToClient,
    canApprove = true,
    disabled = false
}) => {
    const [loading, setLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const handleAction = async (action: string, callback: () => Promise<void>) => {
        setLoadingAction(action);
        setLoading(true);
        try {
            await callback();
        } catch (error) {
            console.error(`${action} failed:`, error);
        } finally {
            setLoading(false);
            setLoadingAction(null);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        await handleAction('reject', () => onReject(proposalId, rejectReason));
        setShowRejectModal(false);
        setRejectReason('');
    };

    const getStatusBadge = (status: ProposalStatus) => {
        const configs: Record<ProposalStatus, { color: string; icon: typeof Clock; label: string }> = {
            DRAFT: { color: 'bg-gray-100 text-gray-600', icon: Clock, label: 'Draft' },
            WAITING_APPROVAL: { color: 'bg-amber-100 text-amber-600', icon: Clock, label: 'Waiting Approval' },
            APPROVED: { color: 'bg-green-100 text-green-600', icon: CheckCircle, label: 'Approved' },
            REJECTED: { color: 'bg-red-100 text-red-600', icon: XCircle, label: 'Rejected' },
            SENT: { color: 'bg-blue-100 text-blue-600', icon: Send, label: 'Sent to Client' },
            ARCHIVED: { color: 'bg-slate-100 text-slate-600', icon: AlertCircle, label: 'Archived' },
        };

        const config = configs[status];
        const Icon = config.icon;

        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
                <Icon size={16} />
                {config.label}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 rounded-xl">
                        <CheckCircle size={20} className="text-violet-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Approval Workflow</h3>
                        <p className="text-xs text-gray-500">Manage proposal status and approvals</p>
                    </div>
                </div>
                {getStatusBadge(currentStatus)}
            </div>

            {/* Actions based on status */}
            <div className="flex flex-wrap gap-3">
                {/* Draft - Can submit for approval */}
                {currentStatus === 'DRAFT' && (
                    <button
                        onClick={() => handleAction('submit', () => onSubmitForApproval(proposalId))}
                        disabled={disabled || loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loadingAction === 'submit' ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Clock size={18} />
                        )}
                        Submit for Approval
                    </button>
                )}

                {/* Waiting Approval - Can approve or reject */}
                {currentStatus === 'WAITING_APPROVAL' && canApprove && (
                    <>
                        <button
                            onClick={() => handleAction('approve', () => onApprove(proposalId))}
                            disabled={disabled || loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loadingAction === 'approve' ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <CheckCircle size={18} />
                            )}
                            Approve
                        </button>
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={disabled || loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <XCircle size={18} />
                            Reject
                        </button>
                    </>
                )}

                {/* Approved - Can send to client */}
                {currentStatus === 'APPROVED' && (
                    <button
                        onClick={() => handleAction('send', () => onSendToClient(proposalId))}
                        disabled={disabled || loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loadingAction === 'send' ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                        Send to Client
                    </button>
                )}

                {/* Rejected - Can resubmit */}
                {currentStatus === 'REJECTED' && (
                    <button
                        onClick={() => handleAction('submit', () => onSubmitForApproval(proposalId))}
                        disabled={disabled || loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loadingAction === 'submit' ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Clock size={18} />
                        )}
                        Resubmit for Approval
                    </button>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-xl">
                                <MessageSquare size={20} className="text-red-600" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">Rejection Reason</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Please provide a reason for rejecting this proposal.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4 resize-none"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || loading}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loadingAction === 'reject' && <Loader2 size={18} className="animate-spin" />}
                                Reject Proposal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalActions;
