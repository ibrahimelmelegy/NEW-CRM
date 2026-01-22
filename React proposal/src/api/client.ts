/**
 * CRM API Client
 * Axios instance configured for the CRM backend with auth interceptors
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Token storage utilities
const TOKEN_KEY = 'access_token';

export const getToken = (): string | null => {
    // Try localStorage first (more reliable in iframes)
    const localToken = localStorage.getItem(TOKEN_KEY);
    if (localToken) return localToken;

    // Then try cookie
    const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${TOKEN_KEY}=`))
        ?.split('=')[1];

    return cookieToken || null;
};

export const setToken = (token: string): void => {
    // Store in localStorage (works in iframes)
    localStorage.setItem(TOKEN_KEY, token);
    // Also set as cookie with SameSite=None for cross-origin iframe support
    try {
        document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Lax`;
    } catch (e) {
        console.warn('Could not set cookie:', e);
    }
};

export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    try {
        document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    } catch (e) {
        console.warn('Could not remove cookie:', e);
    }
};

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; code?: number }>) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        // Auto-logout on auth failures
        if (status === 401 || status === 403) {
            const authMessages = [
                'Invalid or expired token',
                'No token provided',
                'User not found',
                'Failed to retrieve user data'
            ];

            if (authMessages.some(m => message?.includes(m))) {
                removeToken();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    body?: T;
    message?: string;
    code?: number;
}

export interface PaginatedResponse<T> {
    docs: T[];
    pagination: {
        totalItems: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export default apiClient;
