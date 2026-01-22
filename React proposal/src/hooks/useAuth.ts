/**
 * useAuth Hook
 * Authentication hook with React Query
 */

import { useEffect } from 'react';
import { useAuthStore } from '../stores';

export function useAuth() {
    const {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth
    } = useAuthStore();

    // Check auth on mount
    useEffect(() => {
        if (!isAuthenticated) {
            checkAuth();
        }
    }, []);

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
    };
}

export default useAuth;
