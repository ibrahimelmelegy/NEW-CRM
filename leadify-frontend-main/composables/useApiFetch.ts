import { user } from './useUser';
import { csrfToken, refreshCsrfToken } from './useCsrf';

// ✅ FIX: Proper TypeScript interface for API responses
export interface ApiResponse<T = unknown> {
  body: T | null; // Changed data to body to match backend responseWrapper
  success: boolean;
  message: string;
  error?: unknown;
  code: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ApiEndpoints =
  | 'auth/forgot-password'
  | 'auth/reset-password'
  | 'auth/check-reset-token'
  | 'auth/logout'
  | 'auth/login'
  | 'auth/me'
  | 'auth/change-password'
  | 'users'
  | 'role'
  | 'lead'
  | 'opportunity'
  | 'proposal'
  | `lead/${string}`
  | `lead?${string}`
  | `opportunity/${string}`
  | `opportunity?${string}`
  | `users/${string}`
  | `${string}?${string}`
  | `${string}`;

export const useApiFetch = async <T = unknown>(
  url: ApiEndpoints,
  method: HttpMethod = 'GET',
  data: Record<string, unknown> | FormData = {},
  silence: boolean = false,
  isFd: boolean = false
): Promise<ApiResponse<T>> => {
  const config = useRuntimeConfig();

  // During SSR, forward cookies from the incoming request to the backend
  // (credentials: 'include' only works in the browser)
  const ssrHeaders: Record<string, string> = {};
  if (import.meta.server) {
    const reqHeaders = useRequestHeaders(['cookie']);
    if (reqHeaders.cookie) {
      ssrHeaders.cookie = reqHeaders.cookie;
    }
  }

  const defaultOptions = {
    method,
    body: method === 'GET' ? null : data,
    credentials: 'include' as RequestCredentials,
    headers: {
      ...(!isFd && { 'Content-Type': 'application/json' }),
      ...(!isFd && { Accept: 'application/json' }),
      // Multi-tenant header
      ...(user.value?.tenantId && { 'X-Tenant-ID': user.value.tenantId }),
      // CSRF token for state-changing requests
      ...(method !== 'GET' && csrfToken.value && { 'X-CSRF-Token': csrfToken.value }),
      // Forward cookies during SSR
      ...ssrHeaders
    }
  };

  const doFetch = () =>
    $fetch<Record<string, unknown>>(config.public.API_BASE_URL + url, {
      ...defaultOptions,
      headers: {
        ...defaultOptions.headers,
        // Re-read CSRF token at call time (may have been refreshed)
        ...(method !== 'GET' && csrfToken.value && { 'X-CSRF-Token': csrfToken.value })
      }
    });

  try {
    let rawResponse: Record<string, unknown>;
    try {
      rawResponse = await doFetch();
    } catch (firstError: any) {
      // If CSRF token expired, refresh and retry once
      const status = firstError?.response?.status || firstError?.statusCode;
      const msg = (firstError?.response?._data?.message || firstError?.message || '').toLowerCase();
      if (status === 403 && msg.includes('csrf')) {
        await refreshCsrfToken();
        rawResponse = await doFetch();
      } else {
        throw firstError;
      }
    }

    // ✅ ROBUST NORMALIZATION: Handle both standardized and legacy responses
    const normalizedResponse: ApiResponse<T> = {
      body: null,
      success: true,
      message: (rawResponse?.message as string) || 'Success',
      code: 200
    };

    if (rawResponse && typeof rawResponse === 'object') {
      // 1. New Format: { success: true, body: { ... } }
      if ('success' in rawResponse && 'body' in rawResponse) {
        normalizedResponse.body = rawResponse.body as T;
        normalizedResponse.success = rawResponse.success as boolean;
      }
      // 2. Legacy User Format: { user: { ... } } -> used in auth/me
      else if ('user' in rawResponse) {
        normalizedResponse.body = rawResponse.user as T;
      }
      // 3. Legacy Token Format: { token: '...' } -> used in auth/login
      else if ('token' in rawResponse && Object.keys(rawResponse).length <= 2) {
        normalizedResponse.body = rawResponse as unknown as T;
      }
      // 4. Fallback: Treat whole object as body if it doesn't look like a wrapper
      else {
        normalizedResponse.body = rawResponse as unknown as T;
      }
    } else {
      normalizedResponse.body = rawResponse as unknown as T;
    }

    return normalizedResponse;
  } catch (error: unknown) {
    const fetchError = error as { response?: { _data?: Record<string, unknown>; status?: number }; statusCode?: number; message?: string };
    const errorData = fetchError?.response?._data || {};
    const message = (errorData.message as string) || fetchError?.message || 'Something went wrong';

    // ✅ FIX: Get the Status Code correctly from the HTTP Response first
    const code = fetchError?.response?.status || fetchError?.statusCode || (errorData.code as number) || 500;

    if (!silence) {
      console.error(`API Error (${code}):`, message);
    }

    return {
      body: null, // Changed from data to body
      success: false,
      message,
      error, // Returning the raw error object helps debugging
      code // Now this will correctly be 422, 403, 500 etc.
    };
  }
};
