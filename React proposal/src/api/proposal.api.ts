/**
 * Proposal API
 * CRUD operations for proposals - mirrors Vue/Nuxt useProposals.ts
 */

import apiClient, { ApiResponse, PaginatedResponse } from './client';

// Types matching CRM backend
export type ProposalStatus = 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type ProposalType = 'FINANCIAL' | 'TECHNICAL' | 'MIXED';
export type RelatedEntityType = 'Opportunity' | 'Deal' | 'Project';

export interface ProposalFinanceTableItem {
    id: number;
    financeTableId: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    customColumns?: Record<string, string | number>;
}

export interface ProposalFinanceTable {
    id: number;
    proposalId: number;
    name: string;
    items: ProposalFinanceTableItem[];
    subtotal: number;
    vat: number;
    discount: number;
    total: number;
}

export interface CRMProposal {
    id: string;
    title: string;
    version: string;
    date: string;
    type: ProposalType;
    status: ProposalStatus;
    reference?: string;
    proposalFor?: string;
    companyLogo?: string;
    content?: string;
    notes?: string;
    rejectionReason?: string;
    relatedEntityId?: string;
    relatedEntityType?: RelatedEntityType;
    relatedEntity?: {
        id: string | number;
        name: string;
        type?: string;
    };
    users?: number[];
    fileAttachments?: string[];
    financeTables?: ProposalFinanceTable[];
    createdAt: string;
    updatedAt: string;
    user?: { id: number; name: string };
}

export interface CreateProposalInput {
    title: string;
    version?: string;
    date?: string;
    type: ProposalType;
    reference?: string;
    proposalFor?: string;
    companyLogo?: string;
    content?: string;
    notes?: string;
    relatedEntityId?: string;
    relatedEntityType?: RelatedEntityType;
    users?: number[];
    fileAttachments?: string[];
}

export interface UpdateProposalInput extends Partial<CreateProposalInput> {
    id: string;
}

export interface GetProposalsParams {
    page?: number;
    limit?: number;
    searchKey?: string;
    sort?: 'ASC' | 'DESC';
    sortBy?: 'title' | 'version' | 'proposalDate' | 'type' | 'status' | 'createdAt' | 'updatedAt';
    status?: ProposalStatus[];
    type?: ProposalType[];
    userId?: number[];
    fromDate?: string;
    toDate?: string;
    relatedEntityId?: string;
}

export const proposalApi = {
    /**
     * Get all proposals with pagination and filters
     */
    async getProposals(params?: GetProposalsParams): Promise<ApiResponse<PaginatedResponse<CRMProposal>>> {
        const response = await apiClient.get<ApiResponse<PaginatedResponse<CRMProposal>>>('/proposal', { params });
        return response.data;
    },

    /**
     * Get single proposal by ID
     */
    async getProposal(id: string): Promise<ApiResponse<CRMProposal>> {
        const response = await apiClient.get<ApiResponse<CRMProposal>>(`/proposal/${id}`);
        return response.data;
    },

    /**
     * Create new proposal
     */
    async createProposal(data: CreateProposalInput): Promise<ApiResponse<CRMProposal>> {
        const response = await apiClient.post<ApiResponse<CRMProposal>>('/proposal', data);
        return response.data;
    },

    /**
     * Update proposal
     */
    async updateProposal(id: string, data: Partial<CreateProposalInput>): Promise<ApiResponse<CRMProposal>> {
        const response = await apiClient.put<ApiResponse<CRMProposal>>(`/proposal/${id}`, data);
        return response.data;
    },

    /**
     * Submit proposal for approval
     */
    async submitForApproval(id: string): Promise<ApiResponse<CRMProposal>> {
        const response = await apiClient.put<ApiResponse<CRMProposal>>(`/proposal/waiting-approval/${id}`);
        return response.data;
    },

    /**
     * Approve proposal
     */
    async approveProposal(id: string): Promise<ApiResponse<CRMProposal>> {
        const response = await apiClient.put<ApiResponse<CRMProposal>>(`/proposal/approve/${id}`);
        return response.data;
    },

    /**
     * Reject proposal
     */
    async rejectProposal(id: string, rejectionReason: string): Promise<ApiResponse<CRMProposal>> {
        const response = await apiClient.put<ApiResponse<CRMProposal>>(`/proposal/reject/${id}`, { rejectionReason });
        return response.data;
    },

    /**
     * Assign users to proposal
     */
    async assignUsers(id: string, users: number[]): Promise<ApiResponse<CRMProposal>> {
        const response = await apiClient.put<ApiResponse<CRMProposal>>(`/proposal/assign-users/${id}`, { users });
        return response.data;
    },

    /**
     * Archive proposal
     */
    async archiveProposal(id: string): Promise<ApiResponse<CRMProposal>> {
        const response = await apiClient.put<ApiResponse<CRMProposal>>(`/proposal/archive/${id}`);
        return response.data;
    },

    /**
     * Delete proposal
     */
    async deleteProposal(id: string): Promise<ApiResponse> {
        const response = await apiClient.delete<ApiResponse>(`/proposal/${id}`);
        return response.data;
    },

    // Finance Table APIs
    async getFinanceTables(proposalId: string): Promise<ApiResponse<PaginatedResponse<ProposalFinanceTable>>> {
        const response = await apiClient.get<ApiResponse<PaginatedResponse<ProposalFinanceTable>>>(
            `/proposal-finance-table/?proposalId=${proposalId}`
        );
        return response.data;
    },

    async createFinanceTable(data: Partial<ProposalFinanceTable>): Promise<ApiResponse<ProposalFinanceTable>> {
        const response = await apiClient.post<ApiResponse<ProposalFinanceTable>>('/proposal-finance-table', data);
        return response.data;
    },

    async updateFinanceTable(id: number, data: Partial<ProposalFinanceTable>): Promise<ApiResponse<ProposalFinanceTable>> {
        const response = await apiClient.put<ApiResponse<ProposalFinanceTable>>(`/proposal-finance-table/${id}`, data);
        return response.data;
    },

    async createFinanceTableItem(data: Partial<ProposalFinanceTableItem>): Promise<ApiResponse<ProposalFinanceTableItem>> {
        const response = await apiClient.post<ApiResponse<ProposalFinanceTableItem>>('/proposal-finance-table-item', data);
        return response.data;
    },

    async updateFinanceTableItem(id: number, data: Partial<ProposalFinanceTableItem>): Promise<ApiResponse<ProposalFinanceTableItem>> {
        const response = await apiClient.put<ApiResponse<ProposalFinanceTableItem>>(`/proposal-finance-table-item/${id}`, data);
        return response.data;
    },

    async deleteFinanceTableItem(id: number): Promise<ApiResponse> {
        const response = await apiClient.delete<ApiResponse>(`/proposal-finance-table-item/${id}`);
        return response.data;
    },
};

export default proposalApi;
