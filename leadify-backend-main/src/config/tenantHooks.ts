import { Sequelize } from 'sequelize-typescript';
import { FindOptions, Model } from 'sequelize';
import { getTenantContext, TENANT_BYPASS } from '../middleware/tenantContext';
import { buildTenantScopedModelSet, isTenantScopedModel, getTenantScopedModelCount } from '../utils/tenantModelDetector';
import logger from './logger';

/**
 * Checks whether a given model has a tenantId column using rawAttributes.
 * Used as a runtime check inside hooks (works for any model including dynamically added ones).
 */
function modelHasTenantId(model: unknown): boolean {
  if (!model) return false;
  const attrs = model.rawAttributes || model.tableAttributes;
  return !!(attrs && attrs.tenantId);
}

/**
 * Resolves the model from various hook option shapes.
 */
function getModelFromOptions(options: Record<string, unknown>): unknown {
  return options?.model || options?.Model || null;
}

/**
 * Determines if hooks should be skipped for the current context + options.
 * Returns a reason string if skipped, or null if hooks should proceed.
 */
function shouldSkip(options: Record<string, unknown>, modelOrName?: unknown): string | null {
  // Per-query bypass via symbol
  if (options && (options as Record<string, unknown>)[TENANT_BYPASS]) {
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
 * Injects tenantId into a where clause.
 */
function injectTenantWhere(options: Record<string, unknown>, tenantId: string): void {
  if (!options.where) {
    options.where = { tenantId };
  } else if (typeof options.where === 'object' && !Array.isArray(options.where)) {
    (options.where as Record<string, unknown>).tenantId = tenantId;
  }
}

/**
 * Registers Sequelize hooks that automatically inject tenantId
 * into all queries on tenant-scoped models.
 *
 * Options-based hooks (beforeFind, beforeBulkUpdate, beforeBulkDestroy) are
 * registered per-model because Sequelize v6 does NOT set options.model before
 * the beforeFind hook fires. Instance-based hooks remain global since they
 * can read the model from instance.constructor.
 *
 * Must be called after all models are registered with Sequelize.
 */
export function registerTenantHooks(sequelize: Sequelize): void {
  // Build the set of models that have a tenantId column
  buildTenantScopedModelSet(sequelize);
  const count = getTenantScopedModelCount();
  logger.debug({ count }, 'Tenant hooks registered: tenant-scoped models detected');

  // ─── Per-model hooks for options-based operations ────────────────────
  // These hooks are only registered on models that have a tenantId column,
  // avoiding the need to detect the model from options at runtime.
  for (const [modelName, modelClass] of Object.entries(sequelize.models)) {
    if (!isTenantScopedModel(modelName)) continue;

    const ModelCtor = modelClass as Record<string, unknown> & { addHook: Function };

    // ─── beforeFind (per-model) ──────────────────────────────────────
    ModelCtor.addHook('beforeFind', 'tenantScopeFind', (options: FindOptions) => {
      const skip = shouldSkip(options, ModelCtor);
      if (skip) return;
      const ctx = getTenantContext()!;
      injectTenantWhere(options, ctx.tenantId!);
    });

    // ─── beforeBulkUpdate (per-model) ────────────────────────────────
    ModelCtor.addHook('beforeBulkUpdate', 'tenantScopeBulkUpdate', (options: Record<string, unknown>) => {
      const skip = shouldSkip(options, ModelCtor);
      if (skip) return;
      const ctx = getTenantContext()!;
      injectTenantWhere(options, ctx.tenantId!);
    });

    // ─── beforeBulkDestroy (per-model) ───────────────────────────────
    ModelCtor.addHook('beforeBulkDestroy', 'tenantScopeBulkDestroy', (options: Record<string, unknown>) => {
      const skip = shouldSkip(options, ModelCtor);
      if (skip) return;
      const ctx = getTenantContext()!;
      injectTenantWhere(options, ctx.tenantId!);
    });
  }

  // ─── Global instance-based hooks (model available via instance.constructor) ──

  // ─── beforeCreate ──────────────────────────────────────────────────────
  sequelize.addHook('beforeCreate', 'tenantScopeCreate', (instance: Model, options: Record<string, unknown>) => {
    const model = (instance as Record<string, unknown>).constructor;
    if (!modelHasTenantId(model)) return;
    const skip = shouldSkip(options, model);
    if (skip) return;

    const ctx = getTenantContext()!;
    const current = (instance as Record<string, unknown>).tenantId;

    if (!current) {
      (instance as Record<string, unknown>).tenantId = ctx.tenantId;
    } else if (current !== ctx.tenantId) {
      logger.error(
        { model: model.name, attemptedTenantId: current, correctedTenantId: ctx.tenantId },
        'SECURITY: Cross-tenant create attempt blocked'
      );
      (instance as Record<string, unknown>).tenantId = ctx.tenantId;
    }
  });

  // ─── beforeBulkCreate ──────────────────────────────────────────────────
  sequelize.addHook('beforeBulkCreate', 'tenantScopeBulkCreate', (instances: Model[], options: Record<string, unknown>) => {
    if (!instances.length) return;
    const model = (instances[0] as Record<string, unknown>).constructor;
    if (!modelHasTenantId(model)) return;
    const skip = shouldSkip(options, model);
    if (skip) return;

    const ctx = getTenantContext()!;
    for (const instance of instances) {
      (instance as Record<string, unknown>).tenantId = ctx.tenantId;
    }
  });

  // ─── beforeUpdate ──────────────────────────────────────────────────────
  sequelize.addHook('beforeUpdate', 'tenantScopeUpdate', (instance: Model, options: Record<string, unknown>) => {
    const model = (instance as Record<string, unknown>).constructor;
    if (!modelHasTenantId(model)) return;
    const skip = shouldSkip(options, model);
    if (skip) return;

    const ctx = getTenantContext()!;
    const current = (instance as Record<string, unknown>).tenantId;

    if (current && current !== ctx.tenantId) {
      throw new Error(
        `[TenantScope] SECURITY: Cannot update record belonging to tenant ${current}. ` + `Current tenant: ${ctx.tenantId}. Model: ${model.name}`
      );
    }
  });

  // ─── beforeDestroy ────────────────────────────────────────────────────
  sequelize.addHook('beforeDestroy', 'tenantScopeDestroy', (instance: Model, options: Record<string, unknown>) => {
    const model = (instance as Record<string, unknown>).constructor;
    if (!modelHasTenantId(model)) return;
    const skip = shouldSkip(options, model);
    if (skip) return;

    const ctx = getTenantContext()!;
    const instanceTenantId = (instance as Record<string, unknown>).tenantId;

    if (instanceTenantId && instanceTenantId !== ctx.tenantId) {
      throw new Error(
        `[TenantScope] SECURITY: Cannot delete record belonging to tenant ${instanceTenantId}. ` +
          `Current tenant: ${ctx.tenantId}. Model: ${model.name}`
      );
    }
  });
}
