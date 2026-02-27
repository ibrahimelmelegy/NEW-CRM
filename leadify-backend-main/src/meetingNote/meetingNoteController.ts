import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import service from './meetingNoteService';

class MeetingNoteController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.id;
      const tenantId = (req.user as any)?.tenantId;
      wrapResult(res, await service.create(req.body, userId, tenantId), 201);
    } catch (e) { next(e); }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { wrapResult(res, await service.getAll(req.query, (req.user as any)?.tenantId)); } catch (e) { next(e); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const item = await service.getById(req.params.id as string);
      if (!item) return res.status(404).send({ success: false, message: 'Meeting note not found' });
      wrapResult(res, item);
    } catch (e) { next(e); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const item = await service.update(req.params.id as string, req.body);
      if (!item) return res.status(404).send({ success: false, message: 'Meeting note not found' });
      wrapResult(res, item);
    } catch (e) { next(e); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await service.delete(req.params.id as string);
      if (!deleted) return res.status(404).send({ success: false, message: 'Meeting note not found' });
      wrapResult(res, { deleted: true });
    } catch (e) { next(e); }
  }
}

export default new MeetingNoteController();
