import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './formBuilderService';

class FormBuilderController {
  async createTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.createTemplate(req.body, (req.user as any)?.tenantId), 201); } catch (e) { next(e); }
  }
  async getTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getTemplates(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
  async updateTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.updateTemplate(Number(req.params.id), req.body)); } catch (e) { next(e); }
  }
  async deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await service.deleteTemplate(Number(req.params.id)); wrapResult(res, { deleted: true }); } catch (e) { next(e); }
  }
  async submitForm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.submitForm(Number(req.params.id), req.body, { source: req.headers.referer, ipAddress: req.ip });
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }
  async getSubmissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getSubmissions(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
}
export default new FormBuilderController();
