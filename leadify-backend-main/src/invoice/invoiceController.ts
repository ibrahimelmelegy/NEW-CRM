import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import invoiceService from './invoiceService';
import { AuthenticatedRequest } from '../types';

class InvoiceController {
  async getInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.getInvoices(req.query as any);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.getInvoiceById(Number(req.params.id));
      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async markCollected(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.markCollected(Number(req.params.id), req.body.collectedDate);
      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async markUncollected(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.markUncollected(Number(req.params.id));
      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async getSummary(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const summary = await invoiceService.getSummary();
      wrapResult(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export default new InvoiceController();
