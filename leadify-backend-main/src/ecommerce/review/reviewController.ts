import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { wrapResult } from '../../utils/response/responseWrapper';
import reviewService from './reviewService';

class ReviewController {
  public async getReviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reviewService.getReviews(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getReviewById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await reviewService.getReviewById(req.params.id as string);
      wrapResult(res, review);
    } catch (error) {
      next(error);
    }
  }

  public async getProductReviewStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await reviewService.getProductReviewStats(req.params.productId as string);
      wrapResult(res, stats);
    } catch (error) {
      next(error);
    }
  }

  public async createReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await reviewService.createReview(req.body);
      wrapResult(res, review, 201);
    } catch (error) {
      next(error);
    }
  }

  public async approveReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await reviewService.approveReview(req.params.id as string);
      wrapResult(res, review);
    } catch (error) {
      next(error);
    }
  }

  public async rejectReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await reviewService.rejectReview(req.params.id as string);
      wrapResult(res, review);
    } catch (error) {
      next(error);
    }
  }

  public async respondToReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await reviewService.respondToReview(req.params.id as string, req.body.response);
      wrapResult(res, review);
    } catch (error) {
      next(error);
    }
  }

  public async deleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await reviewService.deleteReview(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
