import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './surveyService';

class SurveyController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.create(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getAll(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getById(Number(req.params.id)));
    } catch (e) {
      next(e);
    }
  }
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.update(Number(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  }
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await service.delete(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }
  async submitResponse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.submitResponse(Number(req.params.id), req.body), 201);
    } catch (e) {
      next(e);
    }
  }
  async getResponses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getResponses(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }

  // ──────────── Analytics Endpoints ────────────
  async getNPS(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.calculateNPS(Number(req.params.id)));
    } catch (e) {
      next(e);
    }
  }
  async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getResponseAnalytics(Number(req.params.id)));
    } catch (e) {
      next(e);
    }
  }
  async getCompletionRate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getSurveyCompletionRate(Number(req.params.id)));
    } catch (e) {
      next(e);
    }
  }
  async closeSurvey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.closeSurvey(Number(req.params.id)));
    } catch (e) {
      next(e);
    }
  }
  async exportResponses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.exportResponsesCSV(Number(req.params.id));
      if (!result) {
        return wrapResult(res, null, 404);
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="survey-${req.params.id}-responses.csv"`);
      res.send(result);
    } catch (e) {
      next(e);
    }
  }
}
export default new SurveyController();
