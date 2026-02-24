import { user } from '~/composables/useUser';

// Module-level state (persists across client-side navigations in SPA)
let lastVerifiedAt = 0;
const VERIFY_INTERVAL = 5 * 60 * 1000; // Re-verify token every 5 minutes

/**
 * Global Authentication Middleware
 * Handles auth state, permission checks, and route protection.
 * Caches auth/me responses to avoid redundant API calls on every navigation.
 */
export default defineNuxtRouteMiddleware(async (to, _from) => {
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forget-password', '/reset-password', '/reset-complete'];

  // Routes that require specific permissions (Synced with Backend roleEnum.ts)
  const protectedRoutes: Record<string, string[]> = {
    '/roles': ['VIEW_ROLES'],
    '/staff': ['VIEW_GLOBAL_STAFF'],
    '/reports': ['EXPORT_SALES_REPORTS']
  };

  const accessToken = useCookie('access_token', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax' as const
  });

  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route));

  // CASE 1: No token — unauthenticated
  if (!accessToken.value) {
    user.value = null;
    lastVerifiedAt = 0;
    if (isPublicRoute) return;
    if (to.path !== '/login') return navigateTo('/login');
    return;
  }

  // CASE 2: Token exists — check if we need to verify with the server
  const now = Date.now();
  const hasCachedUser = !!user.value?.id;
  const needsVerification = !hasCachedUser || (now - lastVerifiedAt > VERIFY_INTERVAL);

  if (needsVerification) {
    try {
      const authResponse = await useApiFetch('auth/me', 'GET', {}, true);

      if (authResponse?.success && authResponse.body?.id) {
        // Valid token — cache user data
        user.value = authResponse.body;
        lastVerifiedAt = now;
      } else {
        // Invalid/expired token — clear everything
        accessToken.value = null;
        user.value = null;
        lastVerifiedAt = 0;
        if (!isPublicRoute && to.path !== '/login') return navigateTo('/login');
        return;
      }
    } catch (error) {
      console.error('[Auth Middleware] Verification error:', error);
      // Network error — if we have cached user data, allow navigation
      // (don't redirect to login because of a temporary network glitch)
      if (!hasCachedUser) {
        if (!isPublicRoute && to.path !== '/login') return navigateTo('/login');
        return;
      }
      // else: we have cached user data, proceed with stale data
    }
  }

  // CASE 3: Authenticated user on public route -> redirect to home
  if (isPublicRoute) {
    return navigateTo('/');
  }

  // CASE 4: Permission-based route protection
  const requiredPermissions = Object.entries(protectedRoutes).find(
    ([route]) => to.path.startsWith(route)
  )?.[1];

  if (requiredPermissions && requiredPermissions.length > 0) {
    const userRole: string = user.value?.role?.name || '';
    if (userRole === 'SUPER_ADMIN') return;

    const userPermissions: string[] = user.value?.role?.permissions || user.value?.permissions || [];
    const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      return navigateTo('/');
    }
  }

  // Allow navigation
});
