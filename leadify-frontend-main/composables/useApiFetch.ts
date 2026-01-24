import { user } from './useUser';

export type apiEndpoints =
  | 'auth/forgot-password'
  | 'users'
  | 'auth/reset-password'
  | 'auth/check-reset-token'
  | 'auth/logout'
  | 'auth/login'
  | 'auth/me'
  | 'lead'
  | 'users'
  | 'role'
  | `lead/${string}`
  | `lead?${string}`
  | `${string}?${string}`
  | `opportunity`
  | `opportunity/${string}`
  | `opportunity?${string}`
  | `${string}`
  | 'proposal';

export const useApiFetch = async (
  url: apiEndpoints,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  data = {},
  silence: boolean = false,
  isFd: boolean = false
): Promise<{
  [x: string]: any;
  data?: any;
  status?: boolean;
  message?: string;
  error?: any;
  code?: number;
}> => {
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