import { user } from '~/composables/useUser';

export default defineNuxtRouteMiddleware(async to => {
  const { hasPermission } = await usePermissions();

  const requiredPermission = to.meta?.permission as string | undefined;

  // SUPER_ADMIN bypass - check FIRST before permission validation
  if (user.value?.role?.name === 'SUPER_ADMIN') return;

  if (requiredPermission && !hasPermission(requiredPermission)) {
    throw createError({
      statusCode: 403,
      message: "You don't have permission to access this page"
    });
  }
});
