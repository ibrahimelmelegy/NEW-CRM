import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import productService from './productService';
import quoteService from './quoteService';
import { io } from '../server';

class ProductController {
  // ─── Product CRUD ─────────────────────────────────────────────────────────

  public async getProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productService.getProducts(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getProductById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getProductById(req.params.id as string);
      wrapResult(res, product);
    } catch (error) {
      next(error);
    }
  }

  public async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);
      io.emit('product:created', product);
      wrapResult(res, product, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.updateProduct(req.params.id as string, req.body);
      io.emit('product:updated', product);
      wrapResult(res, product);
    } catch (error) {
      next(error);
    }
  }

  public async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await productService.deleteProduct(req.params.id as string);
      io.emit('product:deleted', { id: req.params.id });
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // ─── Inventory ────────────────────────────────────────────────────────────

  public async getLowStockProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productService.getLowStockProducts(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async updateStock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { quantity, operation } = req.body;
      const product = await productService.updateStock(req.params.id as string, quantity, operation);
      io.emit('product:stockUpdated', product);
      wrapResult(res, product);
    } catch (error) {
      next(error);
    }
  }

  // ─── Price Rules ──────────────────────────────────────────────────────────

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

  public async updatePriceRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const rule = await productService.updatePriceRule(req.params.id as string, req.params.ruleId as string, req.body);
      wrapResult(res, rule);
    } catch (error) {
      next(error);
    }
  }

  public async deletePriceRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await productService.deletePriceRule(req.params.id as string, req.params.ruleId as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // ─── Product Reviews ──────────────────────────────────────────────────────

  public async getProductReviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviews = await productService.getProductReviews(req.params.id as string);
      wrapResult(res, reviews);
    } catch (error) {
      next(error);
    }
  }

  // ─── Product Activity ─────────────────────────────────────────────────────

  public async getProductActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const activity = await productService.getProductActivity(req.params.id as string);
      wrapResult(res, activity);
    } catch (error) {
      next(error);
    }
  }

  // ─── Bulk Operations ──────────────────────────────────────────────────────

  public async bulkImport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        wrapResult(res, { message: 'Request body must contain a "products" array' }, 400);
        return;
      }
      const result = await productService.bulkImport(products);
      io.emit('product:bulkImported', result);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  public async getProductAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await productService.getProductAnalytics();
      wrapResult(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  // ─── Quote line endpoints ─────────────────────────────────────────────────

  public async getQuoteLines(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const lines = await quoteService.getQuoteLines(req.params.quoteId as string);
      wrapResult(res, lines);
    } catch (error) {
      next(error);
    }
  }

  public async addQuoteLine(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const line = await quoteService.addQuoteLine(req.body);
      wrapResult(res, line, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateQuoteLine(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const line = await quoteService.updateQuoteLine(req.params.id as string, req.body);
      wrapResult(res, line);
    } catch (error) {
      next(error);
    }
  }

  public async removeQuoteLine(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await quoteService.removeQuoteLine(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
