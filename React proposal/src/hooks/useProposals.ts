/**
 * useProposals Hook
 * React Query hooks for proposal CRUD - mirrors Vue/Nuxt useProposals.ts
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    proposalApi,
    CRMProposal,
    CreateProposalInput,
    GetProposalsParams,
    PaginatedResponse
} from '../api';

// Query keys
export const proposalKeys = {
    all: ['proposals'] as const,
    lists: () => [...proposalKeys.all, 'list'] as const,
    list: (params: GetProposalsParams) => [...proposalKeys.lists(), params] as const,
    details: () => [...proposalKeys.all, 'detail'] as const,
    detail: (id: string) => [...proposalKeys.details(), id] as const,
    financeTables: (proposalId: string) => [...proposalKeys.all, 'financeTables', proposalId] as const,
};

/**
 * Hook to fetch proposals list
 */
export function useProposalsList(params?: GetProposalsParams) {
    return useQuery({
        queryKey: proposalKeys.list(params || {}),
        queryFn: async () => {
            const response = await proposalApi.getProposals(params);
            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch proposals');
            }
            return response.body as PaginatedResponse<CRMProposal>;
        },
    });
}

/**
 * Hook to fetch single proposal
 */
export function useProposal(id: string) {
    return useQuery({
        queryKey: proposalKeys.detail(id),
        queryFn: async () => {
            const response = await proposalApi.getProposal(id);
            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch proposal');
            }
            return response.body as CRMProposal;
        },
        enabled: !!id,
    });
}

/**
 * Hook to create proposal
 */
export function useCreateProposal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateProposalInput) => {
            const response = await proposalApi.createProposal(data);
            if (!response.success) {
                throw new Error(response.message || 'Failed to create proposal');
            }
            return response.body as CRMProposal;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
            toast.success('Proposal created successfully');
            return data;
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create proposal');
        },
    });
}

/**
 * Hook to update proposal
 */
export function useUpdateProposal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProposalInput> }) => {
            const response = await proposalApi.updateProposal(id, data);
            if (!response.success) {
                throw new Error(response.message || 'Failed to update proposal');
            }
            return response.body as CRMProposal;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
            queryClient.invalidateQueries({ queryKey: proposalKeys.detail(data.id) });
            toast.success('Proposal updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update proposal');
        },
    });
}

/**
 * Hook to submit proposal for approval
 */
export function useSubmitForApproval() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await proposalApi.submitForApproval(id);
            if (!response.success) {
                throw new Error(response.message || 'Failed to submit proposal');
            }
            return response.body as CRMProposal;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
            queryClient.invalidateQueries({ queryKey: proposalKeys.detail(data.id) });
            toast.success('Proposal submitted for approval');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to submit proposal');
        },
    });
}

/**
 * Hook to approve proposal
 */
export function useApproveProposal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await proposalApi.approveProposal(id);
            if (!response.success) {
                throw new Error(response.message || 'Failed to approve proposal');
            }
            return response.body as CRMProposal;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
            queryClient.invalidateQueries({ queryKey: proposalKeys.detail(data.id) });
            toast.success('Proposal approved');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to approve proposal');
        },
    });
}

/**
 * Hook to reject proposal
 */
export function useRejectProposal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
            const response = await proposalApi.rejectProposal(id, reason);
            if (!response.success) {
                throw new Error(response.message || 'Failed to reject proposal');
            }
            return response.body as CRMProposal;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
            queryClient.invalidateQueries({ queryKey: proposalKeys.detail(data.id) });
            toast.success('Proposal rejected');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to reject proposal');
        },
    });
}

/**
 * Hook to delete proposal
 */
export function useDeleteProposal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            // Note: Using update with archive status since backend may not have delete endpoint
            const response = await proposalApi.updateProposal(id.toString(), { status: 'ARCHIVED' } as any);
            if (!response.success) {
                throw new Error(response.message || 'Failed to delete proposal');
            }
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
            toast.success('Proposal deleted');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete proposal');
        },
    });
}

/**
 * Alias for useProposalsList with default params
 */
export function useProposals(params?: GetProposalsParams) {
    return useProposalsList(params);
}

/**
 * Combined hook for approval workflow actions
 */
export function useApprovalWorkflow() {
    const submitForApproval = useSubmitForApproval();
    const approve = useApproveProposal();
    const reject = useRejectProposal();
    const queryClient = useQueryClient();

    const archive = useMutation({
        mutationFn: async (id: number) => {
            const response = await proposalApi.updateProposal(id.toString(), { status: 'ARCHIVED' } as any);
            if (!response.success) {
                throw new Error(response.message || 'Failed to archive proposal');
            }
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
            toast.success('Proposal archived');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to archive proposal');
        },
    });

    return {
        submitForApproval,
        approve,
        reject,
        archive,
    };
}

export default {
    useProposalsList,
    useProposals,
    useProposal,
    useCreateProposal,
    useUpdateProposal,
    useDeleteProposal,
    useSubmitForApproval,
    useApproveProposal,
    useRejectProposal,
    useApprovalWorkflow,
};

