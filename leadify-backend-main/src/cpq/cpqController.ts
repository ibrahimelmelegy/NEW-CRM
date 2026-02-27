import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import cpqService from './cpqService';

class CpqController {
  async createPriceBook(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await cpqService.createPriceBook(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }
  async getPriceBooks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await cpqService.getPriceBooks(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
  async updatePriceBook(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.updatePriceBook(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
  async deletePriceBook(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await cpqService.deletePriceBook(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }
  async addEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      const result = await cpqService.addEntry(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) { next(e); }
  }
  async updateEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.updateEntry(Number(req.params.id), req.body);
      wrapResult(res, result);
    } catch (e) { next(e); }
  }
  async deleteEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await cpqService.deleteEntry(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }
}

export default new CpqController();
