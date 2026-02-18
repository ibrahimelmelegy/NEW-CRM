import { user } from '~/composables/useUser';

export default defineNuxtRouteMiddleware(async to => {
  const { hasPermission } = await usePermissions();

  const requiredPermission = to.meta?.permission as string | undefined;

  if (requiredPermission && !hasPermission(requiredPermission)) {
    // SUPER_ADMIN bypass uses role name, never hardcoded email
    if (user.value?.role?.name === 'SUPER_ADMIN') return;

    return navigateTo('/');
  }
});
