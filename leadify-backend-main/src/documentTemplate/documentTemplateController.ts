import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import documentTemplateService from './documentTemplateService';

class DocumentTemplateController {
  public async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const result = await documentTemplateService.createTemplate(req.body, userId);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await documentTemplateService.updateTemplate(req.params.id as string, req.body);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await documentTemplateService.getTemplates(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await documentTemplateService.getTemplateById(req.params.id as string);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await documentTemplateService.deleteTemplate(req.params.id as string);
      wrapResult(res, null, 200);
    } catch (error) {
      next(error);
    }
  }

  public async cloneTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const result = await documentTemplateService.cloneTemplate(req.params.id as string, userId);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getDefaultConfigs(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const configs = documentTemplateService.getDefaultTemplateConfigs();
      wrapResult(res, configs);
    } catch (error) {
      next(error);
    }
  }

  public async seedDefaults(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await documentTemplateService.seedDefaults();
      wrapResult(res, { message: 'Default templates seeded successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new DocumentTemplateController();
