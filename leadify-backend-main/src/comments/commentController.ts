import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import commentService from './commentService';
import { AuthenticatedRequest } from '../types';

class CommentController {
  async getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.query;
      wrapResult(res, await commentService.getComments(entityType as string, Number(entityId)));
    } catch (error) {
      next(error);
    }
  }

  async createComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await commentService.createComment(req.body, req.user?.id!), 201);
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await commentService.updateComment(Number(req.params.id), req.body.content, req.user?.id!));
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await commentService.deleteComment(Number(req.params.id), req.user?.id!));
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentController();
