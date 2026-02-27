import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './warrantyService';

class WarrantyController {
  async createWarranty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.createWarranty(req.body, (req.user as any)?.tenantId), 201); } catch (e) { next(e); }
  }
  async getWarranties(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getWarranties(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
  async updateWarranty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.updateWarranty(Number(req.params.id), req.body)); } catch (e) { next(e); }
  }
  async deleteWarranty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await service.deleteWarranty(Number(req.params.id)); wrapResult(res, { deleted: true }); } catch (e) { next(e); }
  }
  async createClaim(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.createClaim(req.body, (req.user as any)?.tenantId), 201); } catch (e) { next(e); }
  }
  async getClaims(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getClaims(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
  async updateClaim(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.updateClaim(Number(req.params.id), req.body)); } catch (e) { next(e); }
  }
}
export default new WarrantyController();
