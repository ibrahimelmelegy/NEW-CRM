import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import pipelineConfigService from './pipelineConfigService';
import { wrapResult } from '../utils/response/responseWrapper';

class PipelineConfigController {
  public async getStages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entityType = req.query.entityType as string | undefined;
      const stages = await pipelineConfigService.getStages(entityType);
      wrapResult(res, { docs: stages });
    } catch (error) {
      next(error);
    }
  }

  public async createStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stage = await pipelineConfigService.createStage(req.body);
      wrapResult(res, stage, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stage = await pipelineConfigService.updateStage(req.params.id as string, req.body);
      wrapResult(res, stage);
    } catch (error) {
      next(error);
    }
  }

  public async deleteStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await pipelineConfigService.deleteStage(req.params.id as string);
      wrapResult(res, { message: 'Stage deleted' });
    } catch (error) {
      next(error);
    }
  }

  public async reorderStages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, stageIds } = req.body;
      const stages = await pipelineConfigService.reorderStages(entityType, stageIds);
      wrapResult(res, { docs: stages });
    } catch (error) {
      next(error);
    }
  }
}

export default new PipelineConfigController();
