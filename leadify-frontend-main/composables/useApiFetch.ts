import { user } from './useUser';

// ✅ FIX: Proper TypeScript interface for API responses
export interface ApiResponse<T = any> {
  data: T | null;
  status: boolean;
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
  const accessToken = useCookie('access_token');

  const defaultOptions = {
    method,
    body: method === 'GET' ? null : data,
    headers: {
      'Access-Control-Allow-Origin': '*',
      ...(!isFd && { 'Content-Type': 'application/json' }),
      ...(!isFd && { Accept: 'application/json' }),
      ...(accessToken.value && {
        Authorization: `${url.includes('reset-password') ? '' : 'Bearer'} ${accessToken.value}`,
      }),
      // Multi-tenant header
      ...(user.value?.tenantId && { 'X-Tenant-ID': user.value.tenantId }),
    },
  };

  try {
    return await $fetch(config.public.API_BASE_URL + url, defaultOptions);
  } catch (error: any) {
    const errorData = error?.response?._data || {};
    const message = errorData.message || error.message || 'Something went wrong';

    // ✅ FIX: Get the Status Code correctly from the HTTP Response first
    const code = error?.response?.status || error?.statusCode || errorData.code || 500;

    if (!silence) {
      console.error(`API Error (${code}):`, message);
    }

    return {
      data: null,
      status: false,
      message,
      error, // Returning the raw error object helps debugging
      code,  // Now this will correctly be 422, 403, 500 etc.
    };
  }
};