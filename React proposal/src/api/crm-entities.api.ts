/**
 * Opportunity API
 * For linking proposals to CRM entities
 */

import apiClient, { ApiResponse, PaginatedResponse } from './client';

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    companyName?: string;
}

export interface Opportunity {
    id: string;
    name: string;
    stage: string;
    estimatedValue: number;
    expectedCloseDate: string;
    priority: string;
    user?: { id: number; name: string };
    client?: Client;
    clientId?: string;
}

export interface Deal {
    id: string;
    name: string;
    stage: string;
    value: number;
    companyName?: string;
    user?: { id: number; name: string };
    client?: Client;
    clientId?: string;
}

export interface Project {
    id: string;
    name: string;
    status: string;
    value: number;
    user?: { id: number; name: string };
}

export const crmEntitiesApi = {
    /**
     * Get opportunities for proposal linking
     */
    async getOpportunities(): Promise<ApiResponse<PaginatedResponse<Opportunity>>> {
        const response = await apiClient.get<ApiResponse<PaginatedResponse<Opportunity>>>('/opportunity?limit=1000');
        return response.data;
    },

    /**
     * Get deals for proposal linking
     */
    async getDeals(): Promise<ApiResponse<PaginatedResponse<Deal>>> {
        const response = await apiClient.get<ApiResponse<PaginatedResponse<Deal>>>('/deal?limit=1000');
        return response.data;
    },

    /**
     * Get projects for proposal linking
     */
    async getProjects(): Promise<ApiResponse<PaginatedResponse<Project>>> {
        const response = await apiClient.get<ApiResponse<PaginatedResponse<Project>>>('/project?limit=1000');
        return response.data;
    },
};

export default crmEntitiesApi;
