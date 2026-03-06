import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './bookingService';

class BookingController {
  async createSlot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createSlot(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }
  async getSlots(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getSlots(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async deleteSlot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await service.deleteSlot(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }
  async createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createBooking(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }
  async getBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getBookings(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }
  async updateBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.updateBooking(Number(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  }
  async deleteBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await service.deleteBooking(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  // ─── New Business Logic Endpoints ────────────────────────────────────────────

  async checkAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { staffId, date, startTime, endTime } = req.query as any;
      if (!staffId || !date || !startTime || !endTime) {
        return res.status(400).send({ success: false, message: 'staffId, date, startTime, endTime are required' });
      }
      wrapResult(res, await service.checkAvailability(Number(staffId), date, startTime, endTime));
    } catch (e) {
      next(e);
    }
  }

  async createBookingWithValidation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createBookingWithValidation(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      if ((e as any).statusCode === 409) {
        return res.status(409).send({ success: false, message: e instanceof Error ? e.message : String(e), conflicts: (e as any).conflicts });
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
    } catch (e) {
      next(e);
    }
  }

  async cancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.cancelBooking(Number(req.params.id));
      if (!result) return res.status(404).send({ success: false, message: 'Booking not found' });
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getUpcomingBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const staffId = Number(req.query.staffId);
      if (!staffId) return res.status(400).send({ success: false, message: 'staffId is required' });
      wrapResult(res, await service.getUpcomingBookings(staffId, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }

  async getBookingAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { staffId, dateFrom, dateTo } = req.query as any;
      wrapResult(res, await service.getBookingAnalytics(staffId ? Number(staffId) : undefined, req.user!.tenantId!, dateFrom, dateTo));
    } catch (e) {
      next(e);
    }
  }

  // ─── Booking Pages ───────────────────────────────────────────────────────────

  async createBookingPage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.createBookingPage(req.body, req.user!.tenantId!), 201);
    } catch (e) {
      next(e);
    }
  }

  async getBookingPages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.getBookingPages(req.query, req.user!.tenantId!));
    } catch (e) {
      next(e);
    }
  }

  async updateBookingPage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await service.updateBookingPage(Number(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  }

  async deleteBookingPage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await service.deleteBookingPage(Number(req.params.id));
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  async getBookingPageBySlug(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = await service.getBookingPageBySlug(req.params.slug as string);
      if (!page) return res.status(404).send({ success: false, message: 'Booking page not found' });
      wrapResult(res, page);
    } catch (e) {
      next(e);
    }
  }
}
export default new BookingController();
