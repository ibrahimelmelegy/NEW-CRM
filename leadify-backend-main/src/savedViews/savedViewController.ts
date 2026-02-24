import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import savedViewService from './savedViewService';
import { AuthenticatedRequest } from '../types';

class SavedViewController {
  async getViews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entityType = req.params.entityType as string;
      const views = await savedViewService.getViews(entityType, req.user!.id);
      wrapResult(res, views);
    } catch (error) {
      next(error);
    }
  }

  async getViewById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const view = await savedViewService.getViewById(id);
      wrapResult(res, view);
    } catch (error) {
      next(error);
    }
  }

  async createView(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await savedViewService.createView(req.body, req.user!.id);
      wrapResult(res, view, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateView(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const view = await savedViewService.updateView(id, req.body, req.user!.id);
      wrapResult(res, view);
    } catch (error) {
      next(error);
    }
  }

  async deleteView(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      await savedViewService.deleteView(id, req.user!.id);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  async setDefault(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const view = await savedViewService.setDefault(id, req.user!.id);
      wrapResult(res, view);
    } catch (error) {
      next(error);
    }
  }
}

export default new SavedViewController();
