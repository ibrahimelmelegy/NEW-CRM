/**
 * Tenant Scope Helpers
 *
 * Provides simple helper functions to inject tenantId into Sequelize queries.
 * When user.tenantId is undefined/null (single-tenant mode), returns empty object
 * to preserve backward compatibility.
 */

interface UserWithTenant {
  tenantId?: string | null;
  [key: string]: unknown;
}

/**
 * Returns a WHERE clause fragment for filtering by tenantId.
 * Returns {} if user has no tenantId (backward compatible with single-tenant setups).
 *
 * @deprecated Tenant scoping is now automatic via global Sequelize hooks.
 * This function still works (produces a harmless duplicate WHERE condition)
 * but is no longer necessary. See src/config/tenantHooks.ts.
 */
export function tenantWhere(user: UserWithTenant): { tenantId?: string } {
  return user?.tenantId ? { tenantId: user.tenantId } : {};
}

/**
 * Injects tenantId into a data object for creation.
 * Returns data unchanged if user has no tenantId.
 *
 * @deprecated Tenant scoping is now automatic via global Sequelize hooks.
 * This function still works (produces a harmless duplicate tenantId assignment)
 * but is no longer necessary. See src/config/tenantHooks.ts.
 */
export function tenantCreate<T extends Record<string, unknown>>(data: T, user: UserWithTenant): T & { tenantId?: string } {
  return user?.tenantId ? { ...data, tenantId: user.tenantId } : data;
}
