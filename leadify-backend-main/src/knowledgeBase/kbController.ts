import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import kbService from './kbService';
import { AuthenticatedRequest } from '../types';

class KBController {
  async createArticle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await kbService.createArticle(req.body, req.user?.id);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateArticle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await kbService.updateArticle(req.params.id as string, req.body);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getArticles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await kbService.getArticles(req.query));
    } catch (error) {
      next(error);
    }
  }

  async getPublishedArticles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await kbService.getPublishedArticles(req.query));
    } catch (error) {
      next(error);
    }
  }

  async getArticleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await kbService.getArticleById(req.params.id as string));
    } catch (error) {
      next(error);
    }
  }

  async getArticleBySlug(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await kbService.getArticleBySlug(req.params.slug as string));
    } catch (error) {
      next(error);
    }
  }

  async deleteArticle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await kbService.deleteArticle(req.params.id as string));
    } catch (error) {
      next(error);
    }
  }

  async markHelpful(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await kbService.markHelpful(req.params.id as string));
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await kbService.getCategories());
    } catch (error) {
      next(error);
    }
  }
}

export default new KBController();
