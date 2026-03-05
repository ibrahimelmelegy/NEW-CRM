import { NextFunction, Response } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import playbookService from './playbookService';
import { AuthenticatedRequest } from '../types';

class PlaybookController {
  public async getPlaybooks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playbookService.getPlaybooks(req.user!.tenantId!);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public async getPlaybook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playbookService.getPlaybookById(req.params.id as string);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public async createPlaybook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playbookService.createPlaybook(req.body, req.user!.tenantId!);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updatePlaybook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await playbookService.updatePlaybook(req.params.id as string, req.body);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public async deletePlaybook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await playbookService.deletePlaybook(req.params.id as string);
      wrapResult(res, { deleted: true }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new PlaybookController();
