import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import duplicateService from './duplicateService';
import { AuthenticatedRequest } from '../types';

class DuplicateController {
  async getDuplicateSets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await duplicateService.getDuplicateSets(req.query));
    } catch (error) {
      next(error);
    }
  }

  async checkForDuplicates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await duplicateService.findDuplicates(req.params.entityType as string, req.body));
    } catch (error) {
      next(error);
    }
  }

  async scanForDuplicates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await duplicateService.scanForDuplicates(req.params.entityType as string));
    } catch (error) {
      next(error);
    }
  }

  async confirmDuplicate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await duplicateService.confirmDuplicate(Number(req.params.id), req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  async dismissDuplicate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await duplicateService.dismissDuplicate(Number(req.params.id), req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  async mergeRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await duplicateService.mergeRecords(Number(req.params.id), req.body.masterRecordId, req.user!.id));
    } catch (error) {
      next(error);
    }
  }
}

export default new DuplicateController();
