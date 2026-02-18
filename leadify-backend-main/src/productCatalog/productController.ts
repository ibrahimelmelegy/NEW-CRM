import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import productService from './productService';
import quoteService from './quoteService';

class ProductController {
  // Product endpoints
  public async getProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productService.getProducts(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);
      wrapResult(res, product, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.updateProduct(req.params.id as string, req.body);
      wrapResult(res, product);
    } catch (error) {
      next(error);
    }
  }

  public async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await productService.deleteProduct(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // Quote line endpoints
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
