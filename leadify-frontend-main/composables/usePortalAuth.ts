const PORTAL_TOKEN_KEY = 'portal_token';
const PORTAL_USER_KEY = 'portal_user';

export interface PortalUserProfile {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  clientId: string;
  client?: { id: string; clientName: string };
  lastLoginAt: string | null;
}

export function usePortalAuth() {
  const portalUser = useState<PortalUserProfile | null>('portalUser', () => null);
  const portalToken = useState<string | null>('portalToken', () => null);

  function init() {
    // Portal auth is now cookie-based; state is hydrated from the server via /portal/auth/me
    // No localStorage reads needed — HttpOnly cookies are sent automatically
  }

  async function login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const config = useRuntimeConfig();
      const baseURL = config.public.baseURL || 'http://localhost:3001/api';
      const res = await $fetch<{ success: boolean; body?: { user: PortalUserProfile }; message?: string }>(`${baseURL}/portal/auth/login`, {
        method: 'POST',
        body: { email, password }
      });
      if (res.success && res.body) {
        // Token is set as HttpOnly cookie by the server response
        portalUser.value = res.body.user;
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string };
      const msg = fetchErr?.data?.message || fetchErr?.message || 'Login failed';
      return { success: false, message: msg };
    }
  }

  function logout() {
    portalToken.value = null;
    portalUser.value = null;
    // HttpOnly cookie is cleared by the server on logout endpoint
    navigateTo('/portal/login');
  }

  function isAuthenticated(): boolean {
    return !!portalToken.value;
  }

  async function portalFetch<T = unknown>(path: string, method: string = 'GET', body?: Record<string, unknown>): Promise<{ success: boolean; body?: T; message?: string }> {
    if (!portalToken.value) return { success: false, message: 'Not authenticated' };
    try {
      const config = useRuntimeConfig();
      const baseURL = config.public.baseURL || 'http://localhost:3001/api';
      const res = await $fetch<{ success: boolean; body?: T; message?: string }>(`${baseURL}/portal/${path}`, {
        method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        body: method !== 'GET' ? body : undefined,
        credentials: 'include'
      });
      return { success: res.success, body: res.body, message: res.message };
    } catch (err: unknown) {
      const fetchErr = err as { status?: number; statusCode?: number; data?: { message?: string }; message?: string };
      if (fetchErr?.status === 401 || fetchErr?.statusCode === 401) {
        logout();
        return { success: false, message: 'Session expired' };
      }
      return { success: false, message: fetchErr?.data?.message || fetchErr?.message || 'Request failed' };
    }
  }

  return { portalUser, portalToken, init, login, logout, isAuthenticated, portalFetch };
}
