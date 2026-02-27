import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './shippingService';

class ShippingController {
  async createShipment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.createShipment(req.body, (req.user as any)?.tenantId), 201); } catch (e) { next(e); }
  }
  async getShipments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getShipments(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
  async updateShipment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.updateShipment(Number(req.params.id), req.body)); } catch (e) { next(e); }
  }
  async deleteShipment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await service.deleteShipment(Number(req.params.id)); wrapResult(res, { deleted: true }); } catch (e) { next(e); }
  }
  async createRate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.createRate(req.body, (req.user as any)?.tenantId), 201); } catch (e) { next(e); }
  }
  async getRates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getRates(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
  async updateRate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.updateRate(Number(req.params.id), req.body)); } catch (e) { next(e); }
  }
  async deleteRate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await service.deleteRate(Number(req.params.id)); wrapResult(res, { deleted: true }); } catch (e) { next(e); }
  }
}
export default new ShippingController();
