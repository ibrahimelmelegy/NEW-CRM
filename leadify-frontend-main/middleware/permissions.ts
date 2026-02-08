import { user } from '~/composables/useUser';

export default defineNuxtRouteMiddleware(async to => {
  const { hasPermission } = await usePermissions();

  const requiredPermission = to.meta?.permission as string | undefined;

  if (requiredPermission && !hasPermission(requiredPermission)) {
    // SUPER_ADMIN bypass uses role name, never hardcoded email
    if (user.value?.role?.name === 'SUPER_ADMIN') return;

    throw createError({
      statusCode: 403,
      message: "You don't have permission to access this page"
    });
  }
});
