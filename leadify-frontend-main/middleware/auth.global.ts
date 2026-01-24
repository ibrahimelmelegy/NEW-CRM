export default defineNuxtRouteMiddleware(async (to, from) => {
  try {
    // Define public routes that do not require authentication
    const publicRoutes = ["/login", "/forget-password", "/reset-password", "/reset-complete"];
    // Fetch authentication status
    const accessToken = useCookie('access_token');
    let response: any = { user: null };

    if (accessToken.value) {
      response = await useApiFetch("auth/me", "GET", {}, true);

      // RADICAL FIX: If token is invalid (no user returned), DESTROY IT immediately.
      // This prevents the app from checking the same bad token infinitely on the login page.
      if (!response?.user?.id) {
        accessToken.value = null;
        response = { user: null }; // Ensure downstream logic sees it as unauth
      }
    }
    // If user is not authenticated
    if (!response?.user?.id) {
      // Allow access to public routes
      if (publicRoutes.some((route) => to.path.startsWith(route))) {
        return; // Allow navigation to public route
      }
      // Redirect to login ONLY if not already there
      if (to.path !== '/login') {
        return navigateTo("/login");
      }
      return;
    }
    // If user is authenticated
    if (publicRoutes.some((route) => to.path.startsWith(route))) {
      // Redirect authenticated users away from public routes (e.g., to homepage)
      return navigateTo("/");
    }
    // Allow navigation to the target route
  } catch (error) {
    console.error("Middleware error:", error); // Log unexpected errors
    // Prevent loop: If error happens on login page, DO NOT redirect to login again
    if (to.path !== '/login') {
      return navigateTo("/login");
    }
  }
});