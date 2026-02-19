import { NextFunction, Response } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import dealMomentumService from './dealMomentumService';

class DealMomentumController {
  public async getMomentum(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await dealMomentumService.calculateMomentum(id, req.user?.tenantId);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new DealMomentumController();
