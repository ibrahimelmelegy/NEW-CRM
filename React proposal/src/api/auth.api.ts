/**
 * Auth API
 * Authentication endpoints for the CRM
 */

import apiClient, { ApiResponse, setToken, removeToken } from './client';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    roleId?: number;
    permissions?: string[];
}

export interface LoginResponse {
    token: string;
    user: User;
}

export const authApi = {
    /**
     * Login with email and password
     */
    async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
        const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);

        if (response.data.success && response.data.body?.token) {
            setToken(response.data.body.token);
        }

        return response.data;
    },

    /**
     * Get current user info
     */
    async me(): Promise<ApiResponse<{ user: User }>> {
        const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
        return response.data;
    },

    /**
     * Logout
     */
    async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout');
        } finally {
            removeToken();
        }
    },

    /**
     * Request password reset
     */
    async forgotPassword(email: string): Promise<ApiResponse> {
        const response = await apiClient.post<ApiResponse>('/auth/forgot-password', { email });
        return response.data;
    },

    /**
     * Reset password with token
     */
    async resetPassword(token: string, password: string): Promise<ApiResponse> {
        const response = await apiClient.post<ApiResponse>('/auth/reset-password', {
            token,
            password
        });
        return response.data;
    },
};

export default authApi;
