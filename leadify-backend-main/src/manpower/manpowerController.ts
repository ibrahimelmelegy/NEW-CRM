import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import manpowerService from './manpowerService';

class ManpowerController {
  public async createManpower(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await manpowerService.createManpower(req.body);
      wrapResult(res, responseFromService, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateManpower(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await manpowerService.updateManpower(req.params.id as string, req.body);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async getManpowers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await manpowerService.getManpowers(req.query);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async manpowerById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const responseFromService = await manpowerService.manpowerById(req.params.id as string);
      wrapResult(res, responseFromService);
    } catch (error) {
      next(error);
    }
  }

  public async sendManpowerExcelByEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await manpowerService.sendManpowerExcelByEmail(req.query, req.params.email as string);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async deleteManpower(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await manpowerService.deleteManpower(req.params.id as string);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }
}

export default new ManpowerController();
