import { AsyncLocalStorage } from 'async_hooks';

/**
 * Tenant context store carried through async boundaries via AsyncLocalStorage.
 */
export interface TenantStore {
  tenantId: string | null;
  isSuperAdmin: boolean;
}

/**
 * Symbol used to bypass tenant scoping on a per-query basis.
 * Usage: Model.findAll({ [TENANT_BYPASS]: true })
 */
export const TENANT_BYPASS: unique symbol = Symbol('TENANT_BYPASS');

/**
 * AsyncLocalStorage instance that propagates tenant context through
 * the entire request lifecycle without touching service/controller code.
 */
export const tenantStorage = new AsyncLocalStorage<TenantStore>();

/**
 * Returns the current tenant context or null if none is active
 * (e.g. background jobs, startup, unauthenticated routes).
 */
export function getTenantContext(): TenantStore | null {
  return tenantStorage.getStore() ?? null;
}

/**
 * Runs a function within an explicit tenant context.
 * Useful for background jobs or cron tasks that need tenant scoping.
 */
export function runWithTenantContext<T>(store: TenantStore, fn: () => T): T {
  return tenantStorage.run(store, fn);
}

/**
 * Runs a function without any tenant context (hooks will skip).
 * Useful for cross-tenant operations like admin reports or migrations.
 */
export function withoutTenantScope<T>(fn: () => T): T {
  // Run with an empty store (undefined) so getTenantContext() returns null
  return tenantStorage.run(undefined as any, fn);
}

/**
 * Returns a SQL fragment and bind value for raw SQL queries.
 * Returns null if no tenant filtering should be applied.
 *
 * Usage:
 *   const filter = getTenantFilterForRawQuery();
 *   if (filter) {
 *     query += ` AND "tenantId" = :tenantId`;
 *     replacements.tenantId = filter.tenantId;
 *   }
 */
export function getTenantFilterForRawQuery(): { tenantId: string } | null {
  const ctx = getTenantContext();
  if (!ctx || ctx.isSuperAdmin || !ctx.tenantId) return null;
  return { tenantId: ctx.tenantId };
}
