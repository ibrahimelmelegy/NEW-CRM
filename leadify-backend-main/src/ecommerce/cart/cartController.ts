import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { wrapResult } from '../../utils/response/responseWrapper';
import cartService from './cartService';

class CartController {
  public async getCarts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await cartService.getCarts(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getCartById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.getCartById(req.params.id as string);
      wrapResult(res, cart);
    } catch (error) {
      next(error);
    }
  }

  public async getActiveCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.getActiveCart(req.params.clientId as string);
      wrapResult(res, cart);
    } catch (error) {
      next(error);
    }
  }

  public async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await cartService.addItem(req.params.id as string, req.body);
      wrapResult(res, item, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await cartService.updateItem(req.params.itemId as string, req.body);
      wrapResult(res, item);
    } catch (error) {
      next(error);
    }
  }

  public async removeItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await cartService.removeItem(req.params.itemId as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  public async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await cartService.clearCart(req.params.id as string);
      wrapResult(res, { cleared: true });
    } catch (error) {
      next(error);
    }
  }

  public async applyCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.applyCoupon(req.params.id as string, req.body.couponCode);
      wrapResult(res, cart);
    } catch (error) {
      next(error);
    }
  }

  public async convertToOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderData = await cartService.convertToOrder(req.params.id as string);
      wrapResult(res, orderData);
    } catch (error) {
      next(error);
    }
  }

  public async getAbandonedCarts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await cartService.getAbandonedCarts(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new CartController();
