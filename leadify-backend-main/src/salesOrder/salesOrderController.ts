import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import SalesOrderService from './salesOrderService';
import { SalesOrderStatusEnum } from './models/salesOrderModel';
import { io } from '../server';

class SalesOrderController {
    public async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const order = await SalesOrderService.createOrder(req.body);
            io.emit('salesOrder:created', order);
            wrapResult(res, order, 201);
        } catch (error) {
            next(error);
        }
    }

    public async getOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await SalesOrderService.getOrders(req.query);
            wrapResult(res, result);
        } catch (error) {
            next(error);
        }
    }

    public async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const order = await SalesOrderService.getOrderById(req.params.id as string);
            wrapResult(res, order);
        } catch (error) {
            next(error);
        }
    }

    public async updateOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const order = await SalesOrderService.updateOrder(req.params.id as string, req.body);
            io.emit('salesOrder:updated', order);
            wrapResult(res, order);
        } catch (error) {
            next(error);
        }
    }

    public async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status } = req.body;
            const order = await SalesOrderService.updateStatus(req.params.id as string, status as SalesOrderStatusEnum);
            io.emit('salesOrder:statusUpdated', order);
            wrapResult(res, order);
        } catch (error) {
            next(error);
        }
    }

    public async convertDealToOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const order = await SalesOrderService.convertDealToOrder(req.params.dealId as string);
            io.emit('salesOrder:created', order);
            wrapResult(res, order, 201);
        } catch (error) {
            next(error);
        }
    }

    public async addFulfillment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const fulfillment = await SalesOrderService.addFulfillment(req.params.id as string, req.body);
            io.emit('salesOrder:fulfillmentAdded', fulfillment);
            wrapResult(res, fulfillment, 201);
        } catch (error) {
            next(error);
        }
    }

    public async updateFulfillment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const fulfillment = await SalesOrderService.updateFulfillment(
                req.params.id as string,
                req.params.fid as string,
                req.body
            );
            io.emit('salesOrder:fulfillmentUpdated', fulfillment);
            wrapResult(res, fulfillment);
        } catch (error) {
            next(error);
        }
    }
}

export default new SalesOrderController();
