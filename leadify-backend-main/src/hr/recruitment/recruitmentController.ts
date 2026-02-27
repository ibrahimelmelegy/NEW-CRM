import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { wrapResult } from '../../utils/response/responseWrapper';
import recruitmentService from './recruitmentService';

class RecruitmentController {
  async createPosting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await recruitmentService.createPosting(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getPostings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await recruitmentService.getPostings(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async updatePosting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentService.updatePosting(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async deletePosting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await recruitmentService.deletePosting(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  async createApplicant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await recruitmentService.createApplicant(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getApplicants(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await recruitmentService.getApplicants(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async updateApplicant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentService.updateApplicant(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async deleteApplicant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await recruitmentService.deleteApplicant(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }
}

export default new RecruitmentController();
