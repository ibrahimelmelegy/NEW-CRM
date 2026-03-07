import { Response, NextFunction } from 'express';
import virtualOfficeService from './virtualOfficeService';
import { wrapResult } from '../utils/response/responseWrapper';
import { AuthenticatedRequest } from '../types';

class VirtualOfficeController {
  async getRooms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      await virtualOfficeService.seedDefaultRooms(user?.tenantId);
      const rooms = await virtualOfficeService.getRooms(user);
      return wrapResult(res, rooms);
    } catch (error) {
      next(error);
    }
  }

  async createRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const room = await virtualOfficeService.createRoom(req.body, req.user);
      return wrapResult(res, room, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const room = await virtualOfficeService.updateRoom(Number(req.params.id), req.body, req.user);
      return wrapResult(res, room);
    } catch (error) {
      next(error);
    }
  }

  async deleteRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await virtualOfficeService.deleteRoom(Number(req.params.id), req.user);
      return wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new VirtualOfficeController();
