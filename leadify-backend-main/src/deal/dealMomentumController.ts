import { NextFunction, Response } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import dealMomentumService from './dealMomentumService';
import { AuthenticatedRequest } from '../types';

class DealMomentumController {
  public async getMomentum(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await dealMomentumService.calculateMomentum(id, req.user!.tenantId!);
      wrapResult(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new DealMomentumController();
