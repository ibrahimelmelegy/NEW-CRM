import { Sequelize } from 'sequelize-typescript';
import { FindOptions, Model } from 'sequelize';
import { getTenantContext, TENANT_BYPASS } from '../middleware/tenantContext';
import { buildTenantScopedModelSet, isTenantScopedModel, getTenantScopedModelCount } from '../utils/tenantModelDetector';
import logger from './logger';

/**
 * Checks whether a given model has a tenantId column using rawAttributes.
 * Used as a runtime check inside hooks (works for any model including dynamically added ones).
 */
function modelHasTenantId(model: any): boolean {
  if (!model) return false;
  const attrs = model.rawAttributes || model.tableAttributes;
  return !!(attrs && attrs.tenantId);
}

/**
 * Resolves the model from various hook option shapes.
 */
function getModelFromOptions(options: any): unknown {
  return options?.model || options?.Model || null;
}

/**
 * Determines if hooks should be skipped for the current context + options.
 * Returns a reason string if skipped, or null if hooks should proceed.
 */
function shouldSkip(options: any, modelOrName?: any): string | null {
  // Per-query bypass via symbol
  if (options && (options as any)[TENANT_BYPASS]) {
    return 'TENANT_BYPASS';
  }

  // Check model has tenantId
  const model = modelOrName || getModelFromOptions(options);
  if (model) {
    const name = typeof model === 'string' ? model : model.name || model.modelName;
    if (name && !isTenantScopedModel(name)) {
      // Also do a runtime check in case the model set wasn't built yet
      if (!modelHasTenantId(model)) {
        return 'no-tenantId-column';
      }
    }
  }

  // No async context (background jobs, startup, unauthenticated routes)
  const ctx = getTenantContext();
  if (!ctx) {
    return 'no-context';
  }

  // Super admin sees all tenants
  if (ctx.isSuperAdmin) {
    return 'super-admin';
  }

  // Single-tenant mode (tenantId is null)
  if (!ctx.tenantId) {
    return 'null-tenantId';
  }

  return null;
}

/**
 * Registers global Sequelize hooks that automatically inject tenantId
 * into all queries on tenant-scoped models.
 *
 * Must be called after all models are registered with Sequelize.
 */
export function registerTenantHooks(sequelize: Sequelize): void {
  // Build the set of models that have a tenantId column
  buildTenantScopedModelSet(sequelize);
  const count = getTenantScopedModelCount();
  logger.debug({ count }, 'Tenant hooks registered: tenant-scoped models detected');

  // ─── beforeFind ────────────────────────────────────────────────────────
  sequelize.addHook('beforeFind', 'tenantScopeFind', (options: FindOptions) => {
    const model = getModelFromOptions(options);
    const skip = shouldSkip(options, model);
    if (skip) return;

    const ctx = getTenantContext()!;
    if (!options.where) {
      options.where = { tenantId: ctx.tenantId };
    } else if (typeof options.where === 'object' && !Array.isArray(options.where)) {
      (options.where as any).tenantId = ctx.tenantId;
    }
  });

  // ─── beforeCreate ──────────────────────────────────────────────────────
  sequelize.addHook('beforeCreate', 'tenantScopeCreate', (instance: Model, options: any) => {
    const model = (instance as any).constructor;
    if (!modelHasTenantId(model)) return;
    const skip = shouldSkip(options, model);
    if (skip) return;

    const ctx = getTenantContext()!;
    const current = (instance as any).tenantId;

    if (!current) {
      // Set tenantId if not already set
      (instance as any).tenantId = ctx.tenantId;
    } else if (current !== ctx.tenantId) {
      // Prevent cross-tenant creation — override with correct tenantId
      logger.error(
        { model: model.name, attemptedTenantId: current, correctedTenantId: ctx.tenantId },
        'SECURITY: Cross-tenant create attempt blocked'
      );
      (instance as any).tenantId = ctx.tenantId;
    }
  });

  // ─── beforeBulkCreate ──────────────────────────────────────────────────
  sequelize.addHook('beforeBulkCreate', 'tenantScopeBulkCreate', (instances: Model[], options: any) => {
    if (!instances.length) return;
    const model = (instances[0] as any).constructor;
    if (!modelHasTenantId(model)) return;
    const skip = shouldSkip(options, model);
    if (skip) return;

    const ctx = getTenantContext()!;
    for (const instance of instances) {
      (instance as any).tenantId = ctx.tenantId;
    }
  });

  // ─── beforeUpdate ──────────────────────────────────────────────────────
  sequelize.addHook('beforeUpdate', 'tenantScopeUpdate', (instance: Model, options: any) => {
    const model = (instance as any).constructor;
    if (!modelHasTenantId(model)) return;
    const skip = shouldSkip(options, model);
    if (skip) return;

    const ctx = getTenantContext()!;
    const current = (instance as any).tenantId;

    // Prevent changing tenantId to a different tenant
    if (current && current !== ctx.tenantId) {
      throw new Error(
        `[TenantScope] SECURITY: Cannot update record belonging to tenant ${current}. ` + `Current tenant: ${ctx.tenantId}. Model: ${model.name}`
      );
    }
  });

  // ─── beforeBulkUpdate ─────────────────────────────────────────────────
  sequelize.addHook('beforeBulkUpdate', 'tenantScopeBulkUpdate', (options: any) => {
    const model = getModelFromOptions(options);
    if (model && !modelHasTenantId(model)) return;
    const skip = shouldSkip(options, model);
    if (skip) return;

    const ctx = getTenantContext()!;
    if (!options.where) {
      options.where = { tenantId: ctx.tenantId };
    } else if (typeof options.where === 'object' && !Array.isArray(options.where)) {
      options.where.tenantId = ctx.tenantId;
    }
  });

  // ─── beforeDestroy ────────────────────────────────────────────────────
  sequelize.addHook('beforeDestroy', 'tenantScopeDestroy', (instance: Model, options: any) => {
    const model = (instance as any).constructor;
    if (!modelHasTenantId(model)) return;
    const skip = shouldSkip(options, model);
    if (skip) return;

    const ctx = getTenantContext()!;
    const instanceTenantId = (instance as any).tenantId;

    if (instanceTenantId && instanceTenantId !== ctx.tenantId) {
      throw new Error(
        `[TenantScope] SECURITY: Cannot delete record belonging to tenant ${instanceTenantId}. ` +
          `Current tenant: ${ctx.tenantId}. Model: ${model.name}`
      );
    }
  });

  // ─── beforeBulkDestroy ────────────────────────────────────────────────
  sequelize.addHook('beforeBulkDestroy', 'tenantScopeBulkDestroy', (options: any) => {
    const model = getModelFromOptions(options);
    if (model && !modelHasTenantId(model)) return;
    const skip = shouldSkip(options, model);
    if (skip) return;

    const ctx = getTenantContext()!;
    if (!options.where) {
      options.where = { tenantId: ctx.tenantId };
    } else if (typeof options.where === 'object' && !Array.isArray(options.where)) {
      options.where.tenantId = ctx.tenantId;
    }
  });
}
