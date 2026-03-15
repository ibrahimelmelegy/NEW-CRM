import { user } from '~/composables/useUser';

// Module-level state (persists across client-side navigations in SPA)
let lastVerifiedAt = 0;
const VERIFY_INTERVAL = 5 * 60 * 1000; // Re-verify token every 5 minutes

/**
 * Global Authentication Middleware
 * Handles auth state, permission checks, and route protection.
 * Auth cookie is HttpOnly (not readable by JS) — relies on user state + /auth/me verification.
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

  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route));

  // Check if we need to verify with the server
  const now = Date.now();
  const hasCachedUser = !!user.value?.id;
  const needsVerification = !hasCachedUser || now - lastVerifiedAt > VERIFY_INTERVAL;

  if (needsVerification) {
    try {
      const authResponse = await useApiFetch('auth/me', 'GET', {}, true);

      if (authResponse?.success && authResponse.body?.id) {
        // Valid session — cache user data
        user.value = authResponse.body;
        lastVerifiedAt = now;
      } else {
        // No valid session — clear user state
        user.value = null;
        lastVerifiedAt = 0;
        if (!isPublicRoute && to.path !== '/login') return navigateTo('/login');
        return;
      }
    } catch (error) {
      // Verification error handled below — allow cached user through
      // Network error — if we have cached user data, allow navigation
      if (!hasCachedUser) {
        if (!isPublicRoute && to.path !== '/login') return navigateTo('/login');
        return;
      }
    }
  }

  // No user after verification — redirect to login
  if (!user.value?.id) {
    if (isPublicRoute) return;
    if (to.path !== '/login') return navigateTo('/login');
    return;
  }

  // Authenticated user on public route -> redirect to home
  if (isPublicRoute) {
    return navigateTo('/');
  }

  // Permission-based route protection
  const requiredPermissions = Object.entries(protectedRoutes).find(([route]) => to.path.startsWith(route))?.[1];

  if (requiredPermissions && requiredPermissions.length > 0) {
    const userRole: string = user.value?.role?.name || '';
    if (userRole === 'SUPER_ADMIN') return;

    const userPermissions: string[] = user.value?.role?.permissions || ((user.value as Record<string, unknown>)?.permissions as string[]) || [];
    const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      return navigateTo('/');
    }
  }

  // Allow navigation
});
