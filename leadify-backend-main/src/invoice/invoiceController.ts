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

  async calculateTotals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { items, taxRate, discountAmount, discountType } = req.body;
      if (!items || !Array.isArray(items)) {
        return wrapResult(res, { error: 'items array is required' }, 400);
      }
      const totals = invoiceService.calculateInvoiceTotals(items, taxRate, discountAmount, discountType);
      wrapResult(res, totals);
    } catch (error) {
      next(error);
    }
  }

  async getAgingReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId || undefined;
      const report = await invoiceService.getAgingReport(tenantId);
      wrapResult(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId || undefined;
      const period = Number(req.query.period) || 12;
      const summary = await invoiceService.getRevenueSummary(tenantId, period);
      wrapResult(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async getOverdueInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.user as any)?.tenantId || undefined;
      const invoices = await invoiceService.getOverdueInvoices(tenantId);
      wrapResult(res, invoices);
    } catch (error) {
      next(error);
    }
  }
}

export default new InvoiceController();
