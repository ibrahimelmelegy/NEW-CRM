import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import fieldOpsService from './fieldOpsService';
import { AuthenticatedRequest } from '../types';

class FieldOpsController {
  async getCheckIns(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await fieldOpsService.getCheckIns(req.query));
    } catch (error) {
      next(error);
    }
  }

  async createCheckIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await fieldOpsService.createCheckIn(req.body, req.user!.id), 201);
    } catch (error) {
      next(error);
    }
  }

  async getUserHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await fieldOpsService.getUserHistory(req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  async getTeamLocations(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await fieldOpsService.getTeamLocations());
    } catch (error) {
      next(error);
    }
  }
}

export default new FieldOpsController();
