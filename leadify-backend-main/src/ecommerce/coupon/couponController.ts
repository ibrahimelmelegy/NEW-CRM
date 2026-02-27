import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { wrapResult } from '../../utils/response/responseWrapper';
import couponService from './couponService';

class CouponController {
  public async getCoupons(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await couponService.getCoupons(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getCouponById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await couponService.getCouponById(req.params.id as string);
      wrapResult(res, coupon);
    } catch (error) {
      next(error);
    }
  }

  public async validateCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, orderAmount, productIds } = req.body;
      const result = await couponService.validateCoupon(code, orderAmount, productIds);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async applyCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, orderAmount } = req.body;
      const result = await couponService.applyCoupon(code, orderAmount);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async createCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await couponService.createCoupon(req.body);
      wrapResult(res, coupon, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await couponService.updateCoupon(req.params.id as string, req.body);
      wrapResult(res, coupon);
    } catch (error) {
      next(error);
    }
  }

  public async deleteCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await couponService.deleteCoupon(req.params.id as string);
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }
}

export default new CouponController();
