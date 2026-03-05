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

export interface PortalTokenAccess {
  clientId: string;
  email: string;
  client: { id: string; clientName: string } | null;
  token: string;
}

export function usePortalAuth() {
  const portalUser = useState<PortalUserProfile | null>('portalUser', () => null);
  const portalToken = useState<string | null>('portalToken', () => null);

  function init() {
    if (import.meta.client) {
      const savedToken = localStorage.getItem(PORTAL_TOKEN_KEY);
      const savedUser = localStorage.getItem(PORTAL_USER_KEY);
      if (savedToken) {
        portalToken.value = savedToken;
      }
      if (savedUser) {
        try {
          portalUser.value = JSON.parse(savedUser);
        } catch {
          // ignore parse error
        }
      }
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const config = useRuntimeConfig();
      const baseURL = config.public.baseURL || 'http://localhost:3001/api';
      const res = await $fetch<{ success: boolean; body?: { token: string; user: PortalUserProfile }; message?: string }>(
        `${baseURL}/portal/auth/login`,
        {
          method: 'POST',
          body: { email, password }
        }
      );
      if (res.success && res.body) {
        portalToken.value = res.body.token;
        portalUser.value = res.body.user;
        if (import.meta.client) {
          localStorage.setItem(PORTAL_TOKEN_KEY, res.body.token);
          localStorage.setItem(PORTAL_USER_KEY, JSON.stringify(res.body.user));
        }
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string };
      const msg = fetchErr?.data?.message || fetchErr?.message || 'Login failed';
      return { success: false, message: msg };
    }
  }

  /**
   * Request portal access via magic link
   */
  async function requestAccess(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const config = useRuntimeConfig();
      const baseURL = config.public.baseURL || 'http://localhost:3001/api';
      const res = await $fetch<{ success: boolean; body?: { portalLink: string; token: string }; message?: string }>(
        `${baseURL}/portal/request-access`,
        {
          method: 'POST',
          body: { email }
        }
      );
      if (res.success) {
        return { success: true, message: 'Access link has been sent to your email' };
      }
      return { success: false, message: res.message || 'Failed to request access' };
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string };
      const msg = fetchErr?.data?.message || fetchErr?.message || 'Failed to request access';
      return { success: false, message: msg };
    }
  }

  /**
   * Verify a portal access token (from magic link)
   */
  async function verifyToken(token: string): Promise<{ success: boolean; data?: PortalTokenAccess; message?: string }> {
    try {
      const config = useRuntimeConfig();
      const baseURL = config.public.baseURL || 'http://localhost:3001/api';
      const res = await $fetch<{ success: boolean; body?: PortalTokenAccess; message?: string }>(`${baseURL}/portal/verify`, {
        method: 'POST',
        body: { token }
      });
      if (res.success && res.body) {
        // Store the token for subsequent API calls
        portalToken.value = res.body.token;
        // Create a synthetic user profile from the token data
        portalUser.value = {
          id: res.body.clientId,
          email: res.body.email,
          name: res.body.client?.clientName || res.body.email,
          isActive: true,
          clientId: res.body.clientId,
          client: res.body.client || undefined,
          lastLoginAt: null
        };
        if (import.meta.client) {
          localStorage.setItem(PORTAL_TOKEN_KEY, res.body.token);
          localStorage.setItem(PORTAL_USER_KEY, JSON.stringify(portalUser.value));
        }
        return { success: true, data: res.body };
      }
      return { success: false, message: res.message || 'Invalid token' };
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string };
      const msg = fetchErr?.data?.message || fetchErr?.message || 'Token verification failed';
      return { success: false, message: msg };
    }
  }

  function logout() {
    portalToken.value = null;
    portalUser.value = null;
    if (import.meta.client) {
      localStorage.removeItem(PORTAL_TOKEN_KEY);
      localStorage.removeItem(PORTAL_USER_KEY);
    }
    navigateTo('/portal/login');
  }

  function isAuthenticated(): boolean {
    return !!portalToken.value;
  }

  async function portalFetch<T = unknown>(
    path: string,
    method: string = 'GET',
    body?: Record<string, unknown>
  ): Promise<{ success: boolean; body?: T; message?: string }> {
    if (!portalToken.value) return { success: false, message: 'Not authenticated' };
    try {
      const config = useRuntimeConfig();
      const baseURL = config.public.baseURL || 'http://localhost:3001/api';
      const res = await $fetch<{ success: boolean; body?: T; message?: string }>(`${baseURL}/portal/${path}`, {
        method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        headers: {
          Authorization: `Bearer ${portalToken.value}`
        },
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

  return { portalUser, portalToken, init, login, requestAccess, verifyToken, logout, isAuthenticated, portalFetch };
}
