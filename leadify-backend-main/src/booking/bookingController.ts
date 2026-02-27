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

  // ─── New Business Logic Endpoints ────────────────────────────────────────────

  async checkAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { staffId, date, startTime, endTime } = req.query as any;
      if (!staffId || !date || !startTime || !endTime) {
        return res.status(400).send({ success: false, message: 'staffId, date, startTime, endTime are required' });
      }
      wrapResult(res, await service.checkAvailability(Number(staffId), date, startTime, endTime));
    } catch (e) { next(e); }
  }

  async createBookingWithValidation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createBookingWithValidation(req.body, (req.user as any)?.tenantId), 201);
    } catch (e: any) {
      if (e.statusCode === 409) {
        return res.status(409).send({ success: false, message: e.message, conflicts: e.conflicts });
      }
      next(e);
    }
  }

  async getAvailableSlots(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { staffId, date } = req.query as any;
      if (!staffId || !date) {
        return res.status(400).send({ success: false, message: 'staffId and date are required' });
      }
      wrapResult(res, await service.getAvailableSlots(Number(staffId), date));
    } catch (e) { next(e); }
  }

  async cancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.cancelBooking(Number(req.params.id));
      if (!result) return res.status(404).send({ success: false, message: 'Booking not found' });
      wrapResult(res, result);
    } catch (e) { next(e); }
  }

  async getUpcomingBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const staffId = Number(req.query.staffId);
      if (!staffId) return res.status(400).send({ success: false, message: 'staffId is required' });
      wrapResult(res, await service.getUpcomingBookings(staffId, (req.user as any)?.tenantId));
    } catch (e) { next(e); }
  }
}
export default new BookingController();
