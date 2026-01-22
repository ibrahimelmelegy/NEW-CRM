/**
 * Auth Store
 * Zustand store for authentication state - mirrors Vue/Nuxt auth.ts
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User, getToken, removeToken } from '../api';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    permissions: string[];

    // Actions
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<boolean>;
    setUser: (user: User | null) => void;
    setPermissions: (permissions: string[]) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            permissions: [],

            login: async (email: string, password: string): Promise<boolean> => {
                set({ isLoading: true });
                try {
                    const response = await authApi.login({ email, password });

                    if (response.success && response.body) {
                        set({
                            user: response.body.user,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                        return true;
                    }

                    set({ isLoading: false });
                    return false;
                } catch (error) {
                    set({ isLoading: false });
                    return false;
                }
            },

            logout: async (): Promise<void> => {
                try {
                    await authApi.logout();
                } finally {
                    removeToken();
                    set({
                        user: null,
                        isAuthenticated: false,
                        permissions: [],
                    });
                }
            },

            checkAuth: async (): Promise<boolean> => {
                const token = getToken();
                if (!token) {
                    set({ isAuthenticated: false, user: null });
                    return false;
                }

                set({ isLoading: true });
                try {
                    const response = await authApi.me();

                    if (response.success && response.body?.user?.id) {
                        set({
                            user: response.body.user,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                        return true;
                    }

                    removeToken();
                    set({ isAuthenticated: false, user: null, isLoading: false });
                    return false;
                } catch (error) {
                    removeToken();
                    set({ isAuthenticated: false, user: null, isLoading: false });
                    return false;
                }
            },

            setUser: (user: User | null): void => {
                set({ user, isAuthenticated: !!user });
            },

            setPermissions: (permissions: string[]): void => {
                set({ permissions });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);

export default useAuthStore;
