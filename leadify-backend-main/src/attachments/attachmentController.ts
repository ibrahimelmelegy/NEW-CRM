import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import attachmentService from './attachmentService';
import { AuthenticatedRequest } from '../types';

class AttachmentController {
  async getAttachments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.query;
      wrapResult(res, await attachmentService.getAttachments(entityType as string, Number(entityId)));
    } catch (error) {
      next(error);
    }
  }

  async createAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      const data = {
        entityType: req.body.entityType,
        entityId: Number(req.body.entityId),
        fileUrl: file?.path || req.body.fileUrl || '',
        fileName: file?.originalname || req.body.fileName || '',
        fileSize: file?.size || req.body.fileSize,
        mimeType: file?.mimetype || req.body.mimeType
      };
      wrapResult(res, await attachmentService.createAttachment(data, req.user?.id!), 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await attachmentService.deleteAttachment(Number(req.params.id), req.user?.id!));
    } catch (error) {
      next(error);
    }
  }
}

export default new AttachmentController();
