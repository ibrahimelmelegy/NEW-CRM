import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { wrapResult } from '../../utils/response/responseWrapper';
import categoryService from './categoryService';

class CategoryController {
  public async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await categoryService.getCategories(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getCategoryTree(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await categoryService.getCategoryTree();
      wrapResult(res, tree);
    } catch (error) {
      next(error);
    }
  }

  public async getCategoryById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.getCategoryById(req.params.id as string);
      wrapResult(res, category);
    } catch (error) {
      next(error);
    }
  }

  public async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.createCategory(req.body);
      wrapResult(res, category, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.updateCategory(req.params.id as string, req.body);
      wrapResult(res, category);
    } catch (error) {
      next(error);
    }
  }

  public async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoryService.deleteCategory(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
