import { NextFunction, Response } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import leadJourneyService from './leadJourneyService';

class LeadJourneyController {
  public async getJourney(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await leadJourneyService.getJourney(id, req.user?.tenantId);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new LeadJourneyController();
