import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { wrapResult } from '../../utils/response/responseWrapper';
import productService from '../../productCatalog/productService';

/**
 * Controller that exposes product sub-resources under the /api/ecommerce/products path.
 * Delegates to the shared ProductService for actual logic.
 */
class EcProductController {
  public async getProductReviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviews = await productService.getProductReviews(req.params.id as string);
      wrapResult(res, reviews);
    } catch (error) {
      next(error);
    }
  }

  public async getProductPriceRules(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = await productService.getProductPriceRules(req.params.id as string);
      wrapResult(res, rules);
    } catch (error) {
      next(error);
    }
  }

  public async createPriceRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const rule = await productService.createPriceRule(req.params.id as string, req.body);
      wrapResult(res, rule, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getProductActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const activity = await productService.getProductActivity(req.params.id as string);
      wrapResult(res, activity);
    } catch (error) {
      next(error);
    }
  }
}

export default new EcProductController();
