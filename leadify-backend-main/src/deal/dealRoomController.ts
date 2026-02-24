import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import dealRoomService from './dealRoomService';

class DealRoomController {
  public async getDealRoom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await dealRoomService.getDealRoom(id);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new DealRoomController();
