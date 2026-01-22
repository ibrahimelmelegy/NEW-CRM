/**
 * useCRMEntities Hook
 * For fetching Opportunities, Deals, Projects to link proposals
 */

import { useQuery } from '@tanstack/react-query';
import { crmEntitiesApi, Opportunity, Deal, Project, PaginatedResponse } from '../api';

export const crmEntityKeys = {
    opportunities: ['opportunities'] as const,
    deals: ['deals'] as const,
    projects: ['projects'] as const,
};

/**
 * Hook to fetch opportunities
 */
export function useOpportunities() {
    return useQuery({
        queryKey: crmEntityKeys.opportunities,
        queryFn: async () => {
            const response = await crmEntitiesApi.getOpportunities();
            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch opportunities');
            }
            return response.body as PaginatedResponse<Opportunity>;
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

/**
 * Hook to fetch deals
 */
export function useDeals() {
    return useQuery({
        queryKey: crmEntityKeys.deals,
        queryFn: async () => {
            const response = await crmEntitiesApi.getDeals();
            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch deals');
            }
            return response.body as PaginatedResponse<Deal>;
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to fetch projects
 */
export function useProjects() {
    return useQuery({
        queryKey: crmEntityKeys.projects,
        queryFn: async () => {
            const response = await crmEntitiesApi.getProjects();
            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch projects');
            }
            return response.body as PaginatedResponse<Project>;
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Combined hook to get options for "Related To" dropdown
 */
export function useRelatedEntityOptions(type: 'Opportunity' | 'Deal' | 'Project') {
    const opportunities = useOpportunities();
    const deals = useDeals();
    const projects = useProjects();

    const getOptions = () => {
        switch (type) {
            case 'Opportunity':
                return (opportunities.data?.docs || []).map((o) => ({
                    label: o.name,
                    value: o.id,
                }));
            case 'Deal':
                return (deals.data?.docs || []).map((d) => ({
                    label: d.name,
                    value: d.id,
                }));
            case 'Project':
                return (projects.data?.docs || []).map((p) => ({
                    label: p.name,
                    value: p.id,
                }));
            default:
                return [];
        }
    };

    const isLoading =
        type === 'Opportunity' ? opportunities.isLoading :
            type === 'Deal' ? deals.isLoading :
                projects.isLoading;

    return {
        options: getOptions(),
        isLoading,
    };
}

/**
 * Combined hook for all CRM entities (used by CRMEntitySelector)
 */
export function useCRMEntities() {
    const opportunitiesQuery = useOpportunities();
    const dealsQuery = useDeals();
    const projectsQuery = useProjects();

    return {
        opportunities: opportunitiesQuery.data?.docs || [],
        deals: dealsQuery.data?.docs || [],
        projects: projectsQuery.data?.docs || [],
        isLoadingOpportunities: opportunitiesQuery.isLoading,
        isLoadingDeals: dealsQuery.isLoading,
        isLoadingProjects: projectsQuery.isLoading,
    };
}

export default {
    useOpportunities,
    useDeals,
    useProjects,
    useRelatedEntityOptions,
    useCRMEntities,
};

