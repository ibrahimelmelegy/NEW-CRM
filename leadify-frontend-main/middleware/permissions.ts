import { user } from '~/composables/useUser';

export default defineNuxtRouteMiddleware(async to => {
  const { hasPermission } = await usePermissions();

  const requiredPermission = to.meta?.permission as string | undefined;

  // SUPER_ADMIN bypass - check FIRST before permission validation
  if (user.value?.role?.name === 'SUPER_ADMIN') return;

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return navigateTo('/');
  }
});
