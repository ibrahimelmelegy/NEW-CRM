import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import relationshipService from './relationshipService';

class RelationshipController {
  public async getGraph(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = req.query.types ? (req.query.types as string).split(',') : undefined;
      const result = await relationshipService.getGraph({ types });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new RelationshipController();
