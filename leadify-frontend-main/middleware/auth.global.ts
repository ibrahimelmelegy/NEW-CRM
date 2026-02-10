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
    '/roles': ['VIEW_ROLES'], // Was 'manage_roles'
    '/staff': ['VIEW_GLOBAL_STAFF'], // Was 'manage_staff'
    '/reports': ['EXPORT_SALES_REPORTS'] // Was 'view_reports' (using basic one)
  };

  try {
    const accessToken = useCookie('access_token');
    let authResponse: any = { user: null };

    // Fetch user if token exists
    if (accessToken.value) {
      console.log('[Auth Middleware] Fetching user with token:', accessToken.value?.substring(0, 20) + '...');
      authResponse = await useApiFetch('auth/me', 'GET', {}, true);
      console.log('[Auth Middleware] Response:', {
        success: authResponse?.success,
        code: authResponse?.code,
        hasUserId: !!authResponse?.body?.id,
        message: authResponse?.message
      });

      // Only clear token if it's genuinely invalid (401 Unauthorized)
      // Don't clear on network errors, server errors, or transient failures
      if (!authResponse?.success) {
        // Check if it's an authentication error (401) or invalid token
        if (authResponse?.code === 401 || authResponse?.message?.toLowerCase().includes('unauthorized') || authResponse?.message?.toLowerCase().includes('invalid token')) {
          console.warn('[Auth Middleware] Invalid token (401), clearing and redirecting to login');
          accessToken.value = null;
          authResponse = { body: null };
        } else {
          // Network/server error - keep the token and use cached user if available
          console.warn('[Auth Middleware] API error (keeping token):', authResponse?.code, authResponse?.message);

          // If we have a cached user, use it
          if (user.value?.id) {
            console.log('[Auth Middleware] Using cached user:', user.value.email);
            authResponse = { body: user.value, success: true };
          } else {
            // No cached user and API failed - this is a real problem
            console.error('[Auth Middleware] No cached user and API failed - clearing token');
            accessToken.value = null;
            authResponse = { body: null };
          }
        }
      } else if (!authResponse.body?.id) {
        // Response successful but no user ID - invalid token
        console.warn('[Auth Middleware] No user ID in response, clearing token');
        accessToken.value = null;
        authResponse = { body: null };
      } else {
        // ✅ Store user data globally for other composables
        console.log('[Auth Middleware] User authenticated:', authResponse.body.email);
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
    const requiredPermissions = Object.entries(protectedRoutes).find(([route]) => to.path.startsWith(route))?.[1];

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
