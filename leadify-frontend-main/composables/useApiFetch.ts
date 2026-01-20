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
  // | `users/${string}`
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
  code?: number;
  message?: string;
  error?: any;
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
        Authorization: `${url.includes('reset-password') ? '' : 'Bearer'} ${accessToken.value
          }`,
      }),
    },
  };

  try {
    const response: any = await $fetch(config.public.API_BASE_URL + url, defaultOptions);
    return response;
  } catch (error: any) {
    const errorData = error?.response?._data || {};
    const message = errorData.message || 'Something went wrong';
    const code = errorData.code || 500;

    if (!silence) {
      // ElMessage is auto-imported by @element-plus/nuxt
      if (process.client) {
        ElMessage({
          message: message,
          type: 'error',
          duration: 5000,
        });
      }
      console.error(`[API Error] ${url}:`, message);
    }

    // Auto-logout on Auth failures
    if ([401, 403, 404, 500].includes(code) && (message === 'User not found' || message === 'Failed to retrieve user data' || message === 'Invalid or expired token' || message === 'No token provided')) {
      if (process.client) {
        accessToken.value = null; // Clear cookie
        localStorage.removeItem('access_token'); // Clear local storage
        navigateTo('/login');
      }
    }

    return {
      data: null,
      status: false,
      code,
      message,
      error,
    };
  }
};
