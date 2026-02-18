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
    if (import.meta.client) {
      const saved = localStorage.getItem(PORTAL_TOKEN_KEY);
      const savedUser = localStorage.getItem(PORTAL_USER_KEY);
      if (saved) portalToken.value = saved;
      if (savedUser) {
        try { portalUser.value = JSON.parse(savedUser); } catch { /* ignore */ }
      }
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const config = useRuntimeConfig();
      const baseURL = config.public.baseURL || 'http://localhost:3001/api';
      const res = await $fetch<any>(`${baseURL}/portal/auth/login`, {
        method: 'POST',
        body: { email, password }
      });
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
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Login failed';
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

  async function portalFetch<T = any>(path: string, method: string = 'GET', body?: any): Promise<{ success: boolean; body?: T; message?: string }> {
    if (!portalToken.value) return { success: false, message: 'Not authenticated' };
    try {
      const config = useRuntimeConfig();
      const baseURL = config.public.baseURL || 'http://localhost:3001/api';
      const res = await $fetch<any>(`${baseURL}/portal/${path}`, {
        method: method as any,
        body: method !== 'GET' ? body : undefined,
        headers: { Authorization: `Bearer ${portalToken.value}` }
      });
      return { success: res.success, body: res.body, message: res.message };
    } catch (err: any) {
      if (err?.status === 401 || err?.statusCode === 401) {
        logout();
        return { success: false, message: 'Session expired' };
      }
      return { success: false, message: err?.data?.message || err?.message || 'Request failed' };
    }
  }

  return { portalUser, portalToken, init, login, logout, isAuthenticated, portalFetch };
}
