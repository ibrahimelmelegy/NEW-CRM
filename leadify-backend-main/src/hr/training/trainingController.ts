import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { wrapResult } from '../../utils/response/responseWrapper';
import trainingService from './trainingService';

class TrainingController {
  async createProgram(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await trainingService.createProgram(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getPrograms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await trainingService.getPrograms(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async updateProgram(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await trainingService.updateProgram(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async deleteProgram(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await trainingService.deleteProgram(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }

  async enroll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await trainingService.enroll(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }

  async getEnrollments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await trainingService.getEnrollments(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async updateEnrollment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await trainingService.updateEnrollment(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async deleteEnrollment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await trainingService.deleteEnrollment(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }
}

export default new TrainingController();
