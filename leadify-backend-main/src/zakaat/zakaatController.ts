import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import zakaatService from './zakaatService';
import { AuthenticatedRequest } from '../types';

class ZakaatController {
  async getAssessments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await zakaatService.getAssessments(req.query as Record<string, string>);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const assessment = await zakaatService.getAssessmentById(Number(req.params.id));
      wrapResult(res, assessment);
    } catch (error) {
      next(error);
    }
  }

  async createAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      const assessment = await zakaatService.createAssessment(req.body, userId);
      wrapResult(res, assessment, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const assessment = await zakaatService.updateAssessment(Number(req.params.id), req.body);
      wrapResult(res, assessment);
    } catch (error) {
      next(error);
    }
  }

  async recalculate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const assessment = await zakaatService.recalculate(Number(req.params.id));
      wrapResult(res, assessment);
    } catch (error) {
      next(error);
    }
  }

  async getReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await zakaatService.generateZakaatReport(Number(req.params.id));
      wrapResult(res, report);
    } catch (error) {
      next(error);
    }
  }
}

export default new ZakaatController();
