import { NextFunction, Response } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import emailTemplateService from './emailTemplateService';

class EmailTemplateController {
  public async getTemplates(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      // Seed defaults on first access
      await emailTemplateService.seedDefaults(req.user?.tenantId);
      const result = await emailTemplateService.getTemplates(req.user?.tenantId);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public async getTemplate(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await emailTemplateService.getTemplateById(req.params.id);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public async createTemplate(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await emailTemplateService.createTemplate(req.body, req.user?.tenantId);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateTemplate(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await emailTemplateService.updateTemplate(req.params.id, req.body);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public async deleteTemplate(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      await emailTemplateService.deleteTemplate(req.params.id);
      wrapResult(res, { deleted: true }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new EmailTemplateController();
