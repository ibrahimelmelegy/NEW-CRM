import { user } from '~/composables/useUser';

/**
 * Global Authentication Middleware
 * Handles auth state, permission checks, and route protection
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forget-password', '/reset-password', '/reset-complete'];

  // Routes that require specific permissions (can be extended)
  const protectedRoutes: Record<string, string[]> = {
    '/roles': ['manage_roles'],
    '/staff': ['manage_staff'],
    '/reports': ['view_reports'],
  };

  try {
    const accessToken = useCookie('access_token');
    let authResponse: any = { user: null };

    // Fetch user if token exists
    if (accessToken.value) {
      authResponse = await useApiFetch('auth/me', 'GET', {}, true);

      // Invalid token - clear it immediately
      if (!authResponse?.user?.id) {
        accessToken.value = null;
        authResponse = { user: null };
      } else {
        // ✅ Store user data globally for other composables
        user.value = authResponse.user;
      }
    }

    const isAuthenticated = !!authResponse?.user?.id;
    const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route));

    // CASE 1: Unauthenticated user
    if (!isAuthenticated) {
      // Clear user state
      user.value = null;

      // Allow public routes
      if (isPublicRoute) return;

      // Redirect to login (avoid loop)
      if (to.path !== '/login') {
        return navigateTo('/login');
      }
      return;
    }

    // CASE 2: Authenticated user on public route -> redirect to home
    if (isPublicRoute) {
      return navigateTo('/');
    }

    // CASE 3: Permission-based route protection
    const requiredPermissions = Object.entries(protectedRoutes)
      .find(([route]) => to.path.startsWith(route))?.[1];

    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions: string[] = authResponse.user.permissions || [];
      const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

      if (!hasPermission) {
        // ✅ User doesn't have required permission
        console.warn(`[Auth] Access denied to ${to.path}. Required: ${requiredPermissions.join(', ')}`);

        // Redirect to unauthorized page or dashboard
        return navigateTo('/');
      }
    }

    // Allow navigation
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);

    // Prevent infinite loop
    if (to.path !== '/login') {
      return navigateTo('/login');
    }
  }
});