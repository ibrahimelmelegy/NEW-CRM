import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import ProcurementService from './procurementService';
import User from '../user/userModel';
import { POStatusEnum } from './models/purchaseOrderModel';

class ProcurementController {
    public async createPurchaseOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const po = await ProcurementService.createPurchaseOrder(req.body, req.user as User);
            wrapResult(res, po, 201);
        } catch (error) {
            next(error);
        }
    }

    public async getPurchaseOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await ProcurementService.getPurchaseOrders(req.query);
            wrapResult(res, result);
        } catch (error) {
            next(error);
        }
    }

    public async getPOById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const po = await ProcurementService.getPOById(req.params.id as string);
            wrapResult(res, po);
        } catch (error) {
            next(error);
        }
    }

    public async approvePO(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const po = await ProcurementService.updatePurchaseOrderStatus(req.params.id as string, POStatusEnum.APPROVED, req.user as User);
            wrapResult(res, po);
        } catch (error) {
            next(error);
        }
    }

    public async rejectPO(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const po = await ProcurementService.updatePurchaseOrderStatus(req.params.id as string, POStatusEnum.REJECTED, req.user as User, req.body.rejectionReason);
            wrapResult(res, po);
        } catch (error) {
            next(error);
        }
    }

    public async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await ProcurementService.getDashboardStats();
            wrapResult(res, stats);
        } catch (error) {
            next(error);
        }
    }
    public async deletePurchaseOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            await ProcurementService.removePurchaseOrder(req.params.id as string, req.user as User);
            wrapResult(res, { message: 'Purchase Order deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

export default new ProcurementController();
