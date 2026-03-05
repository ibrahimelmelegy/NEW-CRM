import { Sequelize } from 'sequelize-typescript';

let tenantScopedModels: Set<string> | null = null;

/**
 * Iterates all registered Sequelize models and builds a Set of model names
 * that have a `tenantId` column. Called once at startup.
 */
export function buildTenantScopedModelSet(sequelize: Sequelize): Set<string> {
  const scoped = new Set<string>();

  for (const [modelName, model] of Object.entries(sequelize.models)) {
    const attrs = (model as unknown).rawAttributes;
    if (attrs && attrs.tenantId) {
      scoped.add(modelName);
    }
  }

  tenantScopedModels = scoped;
  return scoped;
}

/**
 * Fast lookup: returns true if the given model name has a tenantId column.
 * Returns false if the model set hasn't been built yet (startup safety).
 */
export function isTenantScopedModel(modelName: string): boolean {
  if (!tenantScopedModels) return false;
  return tenantScopedModels.has(modelName);
}

/**
 * Returns the count of tenant-scoped models (for startup logging).
 */
export function getTenantScopedModelCount(): number {
  return tenantScopedModels?.size ?? 0;
}
