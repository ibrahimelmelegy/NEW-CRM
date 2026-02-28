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

  // ─── New Business Logic Endpoints ────────────────────────────────────────────

  async calculateRate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { weight, zone } = req.query as any;
      if (!weight) return res.status(400).send({ success: false, message: 'weight query param is required' });
      wrapResult(res, await service.calculateShippingRate(Number(weight), zone, (req.user as any)?.tenantId));
    } catch (e) { next(e); }
  }

  async updateShipmentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).send({ success: false, message: 'status is required in the request body' });
      wrapResult(res, await service.updateShipmentStatus(Number(req.params.id), status));
    } catch (e) { next(e); }
  }

  async getShipmentTracking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const trackingNumber = req.params.trackingNumber as string;
      if (!trackingNumber) return res.status(400).send({ success: false, message: 'trackingNumber param is required' });
      wrapResult(res, await service.getShipmentTracking(trackingNumber));
    } catch (e) { next(e); }
  }

  async getShippingAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId;
      wrapResult(res, await service.getShippingAnalytics(tenantId));
    } catch (e) { next(e); }
  }

  async getCarrierRates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { weight, zone } = req.query as any;
      if (!weight) return res.status(400).send({ success: false, message: 'weight query param is required' });
      wrapResult(res, await service.getCarrierRates(Number(weight), zone, (req.user as any)?.tenantId));
    } catch (e) { next(e); }
  }

  async bulkUpdateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { updates } = req.body;
      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).send({ success: false, message: 'updates array is required' });
      }
      wrapResult(res, await service.bulkUpdateStatus(updates));
    } catch (e) { next(e); }
  }
}
export default new ShippingController();
