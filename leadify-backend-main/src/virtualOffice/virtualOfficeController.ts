import { Request, Response, NextFunction } from 'express';
import virtualOfficeService from './virtualOfficeService';
import { wrapResult } from '../utils/response/responseWrapper';

class VirtualOfficeController {
  async getRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      await virtualOfficeService.seedDefaultRooms(user?.tenantId);
      const rooms = await virtualOfficeService.getRooms(user);
      return wrapResult(res, rooms);
    } catch (error) { next(error); }
  }

  async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await virtualOfficeService.createRoom(req.body, (req as any).user);
      return wrapResult(res, room, 201);
    } catch (error) { next(error); }
  }

  async updateRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await virtualOfficeService.updateRoom(Number(req.params.id), req.body, (req as any).user);
      return wrapResult(res, room);
    } catch (error) { next(error); }
  }

  async deleteRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await virtualOfficeService.deleteRoom(Number(req.params.id), (req as any).user);
      return wrapResult(res, result);
    } catch (error) { next(error); }
  }
}

export default new VirtualOfficeController();
