import { user } from '~/composables/useUser';

/**
 * Global Authentication Middleware
 * Handles auth state, permission checks, and route protection
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forget-password', '/reset-password', '/reset-complete'];

  // Routes that require specific permissions (Synced with Backend roleEnum.ts)
  const protectedRoutes: Record<string, string[]> = {
    '/roles': ['VIEW_ROLES'],           // Was 'manage_roles'
    '/staff': ['VIEW_GLOBAL_STAFF'],    // Was 'manage_staff' 
    '/reports': ['EXPORT_SALES_REPORTS'], // Was 'view_reports' (using basic one)
  };

  try {
    const accessToken = useCookie('access_token');
    let authResponse: any = { user: null };

    // Fetch user if token exists
    if (accessToken.value) {
      authResponse = await useApiFetch('auth/me', 'GET', {}, true);

      // Invalid token - clear it immediately
      if (!authResponse?.success || !authResponse.body?.id) {
        accessToken.value = null;
        authResponse = { body: null };
      } else {
        // ✅ Store user data globally for other composables
        user.value = authResponse.body;
      }
    }

    const isAuthenticated = !!authResponse?.body?.id;
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
      // SUPER_ADMIN bypass uses role name, never hardcoded email
      const userRole: string = authResponse.body.role?.name || '';
      if (userRole === 'SUPER_ADMIN') return;

      const userPermissions: string[] = authResponse.body.role?.permissions || authResponse.body.permissions || [];
      const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

      if (!hasPermission) {
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