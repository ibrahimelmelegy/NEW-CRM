import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import SalesOrderService from './salesOrderService';
import { SalesOrderStatusEnum, PaymentStatusEnum } from './models/salesOrderModel';
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
      const fulfillment = await SalesOrderService.updateFulfillment(req.params.id as string, req.params.fid as string, req.body);
      io.emit('salesOrder:fulfillmentUpdated', fulfillment);
      wrapResult(res, fulfillment);
    } catch (error) {
      next(error);
    }
  }

  public async updatePaymentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentStatus } = req.body;
      const order = await SalesOrderService.updatePaymentStatus(req.params.id as string, paymentStatus as PaymentStatusEnum);
      io.emit('salesOrder:paymentStatusUpdated', order);
      wrapResult(res, order);
    } catch (error) {
      next(error);
    }
  }

  public async deleteOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await SalesOrderService.deleteOrder(req.params.id as string);
      io.emit('salesOrder:deleted', { id: req.params.id });
      wrapResult(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  public async getClientOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SalesOrderService.getClientOrders(req.params.clientId as string, req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async convertCartToOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await SalesOrderService.convertCartToOrder(req.body);
      io.emit('salesOrder:created', order);
      wrapResult(res, order, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getOrderAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await SalesOrderService.getOrderAnalytics(req.query);
      wrapResult(res, analytics);
    } catch (error) {
      next(error);
    }
  }
}

export default new SalesOrderController();
