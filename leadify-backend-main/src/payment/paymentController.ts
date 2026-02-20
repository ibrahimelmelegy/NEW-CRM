import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import paymentService from './paymentService';
import { AuthenticatedRequest } from '../types';
import { io } from '../server';

class PaymentController {
  public async recordPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentService.recordPayment(req.body);
      io.emit('payment:recorded', { paymentId: payment.id });
      wrapResult(res, payment, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getPayments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.getPayments(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getPaymentById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentService.getPaymentById(req.params.id as string);
      wrapResult(res, payment);
    } catch (error) {
      next(error);
    }
  }

  public async voidPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentService.voidPayment(req.params.id as string);
      io.emit('payment:voided', { paymentId: payment.id });
      wrapResult(res, payment);
    } catch (error) {
      next(error);
    }
  }

  public async getCollectionDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dashboard = await paymentService.getCollectionDashboard();
      wrapResult(res, dashboard);
    } catch (error) {
      next(error);
    }
  }

  public async getClientPaymentHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await paymentService.getClientPaymentHistory(req.params.clientId as string);
      wrapResult(res, history);
    } catch (error) {
      next(error);
    }
  }

  public async sendReminder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, method } = req.body;
      const invoiceId = Number(req.params.invoiceId as string);
      const reminder = await paymentService.sendReminder(invoiceId, type, method);
      io.emit('payment:reminder-sent', { invoiceId, reminderId: reminder.id });
      wrapResult(res, reminder, 201);
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
