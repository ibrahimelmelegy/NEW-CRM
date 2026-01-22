/**
 * API Index
 * Re-exports all API modules
 */

export { default as apiClient, getToken, setToken, removeToken } from './client';
export type { ApiResponse, PaginatedResponse } from './client';

export { default as authApi } from './auth.api';
export type { LoginRequest, User, LoginResponse } from './auth.api';

export { default as proposalApi } from './proposal.api';
export type {
    CRMProposal,
    CreateProposalInput,
    UpdateProposalInput,
    GetProposalsParams,
    ProposalStatus,
    ProposalType,
    RelatedEntityType,
    ProposalFinanceTable,
    ProposalFinanceTableItem
} from './proposal.api';

export { default as crmEntitiesApi } from './crm-entities.api';
export type { Opportunity, Deal, Project } from './crm-entities.api';

export { default as fileApi } from './file.api';
