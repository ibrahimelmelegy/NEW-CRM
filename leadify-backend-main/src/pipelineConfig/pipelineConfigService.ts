import PipelineStage from './pipelineConfigModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

class PipelineConfigService {
  async getStages(entityType?: string): Promise<PipelineStage[]> {
    const where: any = {};
    if (entityType) where.entityType = entityType;
    return PipelineStage.findAll({ where, order: [['order', 'ASC']] });
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
    return PipelineStage.create(data);
  }

  async updateStage(id: string, data: any): Promise<PipelineStage> {
    const stage = await this.getStageById(id);
    stage.set(data);
    return stage.save();
  }

  async deleteStage(id: string): Promise<void> {
    const stage = await this.getStageById(id);
    await stage.destroy();
  }

  async reorderStages(entityType: string, stageIds: string[]): Promise<PipelineStage[]> {
    for (let i = 0; i < stageIds.length; i++) {
      await PipelineStage.update({ order: i + 1 }, { where: { id: stageIds[i] } });
    }
    return this.getStages(entityType);
  }
}

export default new PipelineConfigService();
