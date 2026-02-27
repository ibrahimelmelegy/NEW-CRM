import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './bookingService';

class BookingController {
  async createSlot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.createSlot(req.body, (req.user as any)?.tenantId), 201); } catch (e) { next(e); }
  }
  async getSlots(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getSlots(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
  async deleteSlot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await service.deleteSlot(Number(req.params.id)); wrapResult(res, { deleted: true }); } catch (e) { next(e); }
  }
  async createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.createBooking(req.body, (req.user as any)?.tenantId), 201); } catch (e) { next(e); }
  }
  async getBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getBookings(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }
  async updateBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.updateBooking(Number(req.params.id), req.body)); } catch (e) { next(e); }
  }
  async deleteBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { await service.deleteBooking(Number(req.params.id)); wrapResult(res, { deleted: true }); } catch (e) { next(e); }
  }
}
export default new BookingController();
