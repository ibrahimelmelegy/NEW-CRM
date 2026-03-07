import PipelineStage from './pipelineConfigModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { sequelize } from '../config/db';
import cacheService from '../infrastructure/cacheService';

const PIPELINE_CACHE_TTL = 600; // 10 minutes
const PIPELINE_CACHE_PREFIX = 'pipeline:stages';

/**
 * Transition rule derived from pipeline stage configuration.
 * Each rule describes an allowed move from one stage to another.
 */
interface TransitionRule {
  fromStage: string;
  toStage: string;
  fromOrder: number;
  toOrder: number;
}

class PipelineConfigService {
  async getStages(entityType?: string): Promise<PipelineStage[]> {
    const cacheKey = `${PIPELINE_CACHE_PREFIX}:${entityType || 'all'}`;
    return cacheService.getOrSet<PipelineStage[]>(
      cacheKey,
      async () => {
        const where: Record<string, any> = {};
        if (entityType) where.entityType = entityType;
        return PipelineStage.findAll({ where, order: [['order', 'ASC']] });
      },
      PIPELINE_CACHE_TTL
    );
  }

  async getStageById(id: string): Promise<PipelineStage> {
    const stage = await PipelineStage.findByPk(id);
    if (!stage) throw new BaseError(ERRORS.NOT_FOUND);
    return stage;
  }

  async createStage(data: any): Promise<PipelineStage> {
    const maxOrder =
      ((await PipelineStage.max('order', {
        where: { entityType: data.entityType || 'deal' }
      })) as number) || 0;
    data.order = maxOrder + 1;
    const stage = await PipelineStage.create(data);
    await this.invalidatePipelineCache();
    return stage;
  }

  async updateStage(id: string, data: any): Promise<PipelineStage> {
    const result = await sequelize.transaction(async t => {
      const stage = await PipelineStage.findByPk(id, { transaction: t, lock: true });
      if (!stage) throw new BaseError(ERRORS.NOT_FOUND);
      if (data.isDefault) {
        await PipelineStage.update({ isDefault: false }, { where: { entityType: stage.entityType }, transaction: t });
      }
      stage.set(data);
      return stage.save({ transaction: t });
    });
    await this.invalidatePipelineCache();
    return result;
  }

  async deleteStage(id: string): Promise<void> {
    const stage = await this.getStageById(id);
    await stage.destroy();
    await this.invalidatePipelineCache();
  }

  async reorderStages(entityType: string, stageIds: string[]): Promise<PipelineStage[]> {
    for (let i = 0; i < stageIds.length; i++) {
      await PipelineStage.update({ order: i + 1 }, { where: { id: stageIds[i] } });
    }
    await this.invalidatePipelineCache();
    return this.getStages(entityType);
  }

  /**
   * Returns allowed stage transitions derived from pipeline configuration.
   *
   * The default rule set allows:
   *   - Forward transitions: any stage can move to the next stage in order.
   *   - Backward transitions: any stage can move to the previous stage in order.
   *   - Lost/cancelled: any non-terminal stage can move to an isLost stage.
   *   - Reopen: an isLost stage can move back to the first (isDefault) stage.
   *
   * NOTE: This does not yet replace the hardcoded DEAL_STAGE_TRANSITIONS or
   * OPP_STAGE_TRANSITIONS maps in the respective services. It provides the
   * infrastructure so that pipeline config can override defaults in the future
   * when a tenant has customized their pipeline stages.
   */
  async getTransitionRules(entityType: string): Promise<TransitionRule[]> {
    const stages = await this.getStages(entityType);
    if (stages.length === 0) return [];

    const rules: TransitionRule[] = [];

    for (let i = 0; i < stages.length; i++) {
      const current = stages[i];

      // Terminal stages (isWon) have no outgoing transitions
      if (current.isWon) continue;

      // Forward transition to next stage in order
      if (i + 1 < stages.length) {
        const next = stages[i + 1];
        rules.push({
          fromStage: current.name,
          toStage: next.name,
          fromOrder: current.order,
          toOrder: next.order
        });
      }

      // Backward transition to previous stage in order
      if (i - 1 >= 0 && !current.isLost) {
        const prev = stages[i - 1];
        rules.push({
          fromStage: current.name,
          toStage: prev.name,
          fromOrder: current.order,
          toOrder: prev.order
        });
      }

      // Any non-terminal, non-lost stage can transition to a lost stage
      if (!current.isLost) {
        const lostStages = stages.filter(s => s.isLost);
        for (const lost of lostStages) {
          // Avoid duplicate if the lost stage is already the next stage
          if (lost.order !== stages[i + 1]?.order) {
            rules.push({
              fromStage: current.name,
              toStage: lost.name,
              fromOrder: current.order,
              toOrder: lost.order
            });
          }
        }
      }

      // A lost stage can reopen to the default (first) stage
      if (current.isLost) {
        const defaultStage = stages.find(s => s.isDefault) || stages[0];
        rules.push({
          fromStage: current.name,
          toStage: defaultStage.name,
          fromOrder: current.order,
          toOrder: defaultStage.order
        });
      }
    }

    return rules;
  }

  /**
   * Checks whether a specific stage transition is allowed based on pipeline config.
   *
   * NOTE: This does not yet replace the hardcoded transition validation in
   * dealService or opportunityService. It is provided as infrastructure so that
   * pipeline config can override the default hardcoded transitions in the future.
   * To enable dynamic transitions, the respective service methods would call this
   * instead of (or in addition to) their static transition maps.
   */
  async validateTransition(entityType: string, fromStage: string, toStage: string): Promise<boolean> {
    const rules = await this.getTransitionRules(entityType);

    // If no pipeline stages are configured for this entity type, fall back to
    // allowing the transition (the hardcoded maps in the services will enforce).
    if (rules.length === 0) return true;

    return rules.some(rule => rule.fromStage === fromStage && rule.toStage === toStage);
  }

  /**
   * Invalidate all pipeline stage caches.
   * Called after any mutation (create, update, delete, reorder).
   */
  private async invalidatePipelineCache(): Promise<void> {
    await cacheService.invalidatePattern(`${PIPELINE_CACHE_PREFIX}:*`);
  }
}

export default new PipelineConfigService();
