import { NextFunction, Response } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import leadJourneyService from './leadJourneyService';
import { AuthenticatedRequest } from '../types';

class LeadJourneyController {
  public async getJourney(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await leadJourneyService.getJourney(id, req.user!.tenantId!);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new LeadJourneyController();
