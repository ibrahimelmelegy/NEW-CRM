import { user, useUser } from '@/composables/useUser';

const permissions = ref<string[]>([]);
const isLoaded = ref(false);

export async function usePermissions(isUpdated = false) {
  if (!isLoaded.value || isUpdated) {
    if (!user.value?.id) {
      await useUser(); // populates `user`
    }
    if (user.value?.roleId) {
      const response = await useApiFetch(`role/${user.value.roleId}`);

      if (response?.body?.permissions) {
        permissions.value = response.body.permissions;
        isLoaded.value = true;
      }
    }
  }

  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some(perm => hasPermission(perm));
  };

  return {
    hasPermission,
    hasAnyPermission
  };
}

/**
 * Sync wrapper for components that don't need to block on permission loading.
 * Triggers a background fetch if permissions aren't loaded yet, but returns
 * immediately with reactive permission checkers.
 */
export function usePermissionsSync() {
  if (!isLoaded.value) {
    usePermissions().catch(() => {});
  }
  return {
    hasPermission: (permission: string): boolean => permissions.value.includes(permission),
    hasAnyPermission: (perms: string[]): boolean => perms.some(p => permissions.value.includes(p)),
  };
}
