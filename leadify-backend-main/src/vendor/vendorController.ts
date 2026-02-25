import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import VendorService from './vendorService';
import User from '../user/userModel';

class VendorController {
  public async createVendor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendor = await VendorService.createVendor(req.body, req.user as User);
      wrapResult(res, vendor, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateVendor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendor = await VendorService.updateVendor(req.params.id as string, req.body, req.user as User);
      wrapResult(res, vendor);
    } catch (error) {
      next(error);
    }
  }

  public async deleteVendor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await VendorService.deleteVendor(req.params.id as string, req.user as User);
      wrapResult(res);
    } catch (error) {
      next(error);
    }
  }

  public async getVendors(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await VendorService.getVendors(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getVendorById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendor = await VendorService.getVendorById(req.params.id as string);
      wrapResult(res, vendor);
    } catch (error) {
      next(error);
    }
  }

  public async getAllVendors(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendors = await VendorService.getAllVendors();
      wrapResult(res, vendors);
    } catch (error) {
      console.error('[Vendor] getAllVendors error:', (error as Error).message);
      wrapResult(res, []);
    }
  }
}

export default new VendorController();
