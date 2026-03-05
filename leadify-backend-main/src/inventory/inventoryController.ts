import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import InventoryService from './inventoryService';

class InventoryController {
  public async getProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InventoryService.getProducts(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getProductById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await InventoryService.getProductById(req.params.id as string);
      wrapResult(res, product);
    } catch (error) {
      next(error);
    }
  }

  public async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await InventoryService.createProduct(req.body);
      wrapResult(res, product, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await InventoryService.updateProduct(req.params.id as string, req.body);
      wrapResult(res, product);
    } catch (error) {
      next(error);
    }
  }

  public async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await InventoryService.deleteProduct(req.params.id as string);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async getLowStock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await InventoryService.getLowStockProducts();
      wrapResult(res, products);
    } catch (error) {
      next(error);
    }
  }

  public async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await InventoryService.getCategories();
      wrapResult(res, categories);
    } catch (error) {
      next(error);
    }
  }

  public async getWarehouses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouses = await InventoryService.getWarehouses();
      wrapResult(res, warehouses);
    } catch (error) {
      next(error);
    }
  }

  public async getMovements(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const movements = await InventoryService.getStockMovements(req.params.id as string);
      wrapResult(res, movements);
    } catch (error) {
      next(error);
    }
  }

  public async addMovement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const movement = await InventoryService.addStockMovement({
        ...req.body,
        userId: req.user!.id
      });
      wrapResult(res, movement, 201);
    } catch (error) {
      next(error);
    }
  }
}

export default new InventoryController();
