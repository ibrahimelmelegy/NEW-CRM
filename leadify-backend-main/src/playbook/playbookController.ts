import { NextFunction, Response } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import playbookService from './playbookService';

class PlaybookController {
  public async getPlaybooks(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playbookService.getPlaybooks(req.user?.tenantId);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public async getPlaybook(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playbookService.getPlaybookById(req.params.id);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public async createPlaybook(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playbookService.createPlaybook(req.body, req.user?.tenantId);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updatePlaybook(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playbookService.updatePlaybook(req.params.id, req.body);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public async deletePlaybook(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      await playbookService.deletePlaybook(req.params.id);
      wrapResult(res, { deleted: true }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new PlaybookController();
