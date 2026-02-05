import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import RFQService from './rfqService';
import User from '../user/userModel';

class RFQController {
    public async createRFQ(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const rfq = await RFQService.createRFQ(req.body, req.user as User);
            wrapResult(res, rfq, 201);
        } catch (error) {
            next(error);
        }
    }

    public async getAllRFQs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await RFQService.getRFQs(req.query);
            wrapResult(res, result);
        } catch (error) {
            next(error);
        }
    }

    public async getRFQById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const rfq = await RFQService.getRFQById(req.params.id as string);
            wrapResult(res, rfq);
        } catch (error) {
            next(error);
        }
    }

    public async sendRFQ(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { vendorIds } = req.body;
            const rfq = await RFQService.sendRFQToVendors(req.params.id as string, vendorIds);
            wrapResult(res, rfq);
        } catch (error) {
            next(error);
        }
    }

    public async addVendorResponse(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            // Assuming current user is an admin entering data on behalf of vendor, 
            // In a real portal, we'd check if req.user is the vendor.
            const response = await RFQService.addVendorResponse(req.params.id as string, parseInt(req.params.vendorId as string), req.body);
            wrapResult(res, response);
        } catch (error) {
            next(error);
        }
    }
}

export default new RFQController();
