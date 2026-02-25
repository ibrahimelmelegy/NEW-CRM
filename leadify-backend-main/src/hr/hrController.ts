import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import hrService from './hrService';
import { AuthenticatedRequest } from '../types';

class HRController {
  // Attendance
  async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.getAttendance(req.query));
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.checkIn(req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.checkOut(req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  async createAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.createAttendance(req.body), 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.updateAttendance(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  }

  async deleteAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.deleteAttendance(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  // Leave Requests
  async getLeaveRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.getLeaveRequestById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  async getLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.getLeaveRequests(req.query));
    } catch (error) {
      next(error);
    }
  }

  async createLeaveRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.createLeaveRequest(req.body, req.user!.id), 201);
    } catch (error) {
      next(error);
    }
  }

  async approveLeaveRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.approveLeaveRequest(Number(req.params.id), req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  async rejectLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.rejectLeaveRequest(Number(req.params.id), req.body.reason));
    } catch (error) {
      next(error);
    }
  }

  async cancelLeaveRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.cancelLeaveRequest(Number(req.params.id), req.user!.id));
    } catch (error) {
      next(error);
    }
  }

  async deleteLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await hrService.deleteLeaveRequest(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }
}

export default new HRController();
