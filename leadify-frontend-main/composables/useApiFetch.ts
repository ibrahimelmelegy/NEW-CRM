import { user } from './useUser';

// ✅ FIX: Proper TypeScript interface for API responses
export interface ApiResponse<T = any> {
  body: T | null; // Changed data to body to match backend responseWrapper
  success: boolean;
  message: string;
  error?: any;
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

export const useApiFetch = async <T = any>(
  url: ApiEndpoints,
  method: HttpMethod = 'GET',
  data: Record<string, any> = {},
  silence: boolean = false,
  isFd: boolean = false
): Promise<ApiResponse<T>> => {
  const config = useRuntimeConfig();
  const accessToken = useCookie('access_token', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax' as const
  });

  const defaultOptions = {
    method,
    body: method === 'GET' ? null : data,
    headers: {
      ...(!isFd && { 'Content-Type': 'application/json' }),
      ...(!isFd && { Accept: 'application/json' }),
      ...(accessToken.value &&
        !url.includes('reset-password') && {
          Authorization: `Bearer ${accessToken.value}`
        }),
      // Multi-tenant header
      ...(user.value?.tenantId && { 'X-Tenant-ID': user.value.tenantId })
    }
  };

  try {
    const rawResponse: any = await $fetch(config.public.API_BASE_URL + url, defaultOptions);

    // ✅ ROBUST NORMALIZATION: Handle both standardized and legacy responses
    const normalizedResponse: ApiResponse<T> = {
      body: null,
      success: true,
      message: rawResponse?.message || 'Success',
      code: 200
    };

    if (rawResponse && typeof rawResponse === 'object') {
      // 1. New Format: { success: true, body: { ... } }
      if ('success' in rawResponse && 'body' in rawResponse) {
        normalizedResponse.body = rawResponse.body;
        normalizedResponse.success = rawResponse.success;
      }
      // 2. Legacy User Format: { user: { ... } } -> used in auth/me
      else if ('user' in rawResponse) {
        normalizedResponse.body = rawResponse.user;
      }
      // 3. Legacy Token Format: { token: '...' } -> used in auth/login
      else if ('token' in rawResponse && Object.keys(rawResponse).length <= 2) {
        normalizedResponse.body = rawResponse;
      }
      // 4. Fallback: Treat whole object as body if it doesn't look like a wrapper
      else {
        normalizedResponse.body = rawResponse;
      }
    } else {
      normalizedResponse.body = rawResponse;
    }

    return normalizedResponse;
  } catch (error: any) {
    const errorData = error?.response?._data || {};
    const message = errorData.message || error.message || 'Something went wrong';

    // ✅ FIX: Get the Status Code correctly from the HTTP Response first
    const code = error?.response?.status || error?.statusCode || errorData.code || 500;

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
