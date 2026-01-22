/**
 * usePermissions Hook
 * Role-based access control - mirrors Vue/Nuxt usePermissions.ts
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores';
import apiClient from '../api/client';

// Proposal Permissions - from backend roleEnum.ts
export const PROPOSAL_PERMISSIONS = {
    VIEW_OWN: 'VIEW_OWN_PROPOSALS',
    VIEW_GLOBAL: 'VIEW_GLOBAL_PROPOSALS',
    CREATE: 'CREATE_PROPOSALS',
    EDIT: 'EDIT_PROPOSALS',
} as const;

export function usePermissions() {
    const { user, permissions, setPermissions } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Fetch permissions when user changes
    useEffect(() => {
        const fetchPermissions = async () => {
            if (user?.roleId && permissions.length === 0) {
                setIsLoading(true);
                try {
                    const response = await apiClient.get(`/role/${user.roleId}`);
                    if (response.data?.body?.permissions) {
                        setPermissions(response.data.body.permissions);
                    }
                } catch (error) {
                    console.error('Failed to fetch permissions:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchPermissions();
    }, [user?.roleId]);

    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission);
    };

    /**
     * Check if user has any of the given permissions
     */
    const hasAnyPermission = (perms: string[]): boolean => {
        return perms.some((perm) => hasPermission(perm));
    };

    /**
     * Check if user can view proposals
     */
    const canViewProposals = (): boolean => {
        return hasAnyPermission([PROPOSAL_PERMISSIONS.VIEW_OWN, PROPOSAL_PERMISSIONS.VIEW_GLOBAL]);
    };

    /**
     * Check if user can view all proposals (global)
     */
    const canViewGlobalProposals = (): boolean => {
        return hasPermission(PROPOSAL_PERMISSIONS.VIEW_GLOBAL);
    };

    /**
     * Check if user can create proposals
     */
    const canCreateProposals = (): boolean => {
        return hasPermission(PROPOSAL_PERMISSIONS.CREATE);
    };

    /**
     * Check if user can edit/approve/reject proposals
     */
    const canEditProposals = (): boolean => {
        return hasPermission(PROPOSAL_PERMISSIONS.EDIT);
    };

    return {
        permissions,
        isLoading,
        hasPermission,
        hasAnyPermission,
        canViewProposals,
        canViewGlobalProposals,
        canCreateProposals,
        canEditProposals,
    };
}

export default usePermissions;
