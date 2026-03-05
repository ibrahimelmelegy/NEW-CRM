import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import invoiceBillingService from './invoiceBillingService';
import { AuthenticatedRequest } from '../types';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

class InvoiceBillingController {
  async createInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { dealId, invoiceDate, notes, paymentTerms, dueDate, lineItems } = req.body;

      if (!dealId) {
        throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'dealId is required');
      }

      const invoice = await invoiceBillingService.createInvoice({
        dealId,
        invoiceDate,
        notes,
        paymentTerms,
        dueDate,
        lineItems
      });

      wrapResult(res, invoice, 201);
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoiceId = Number(req.params.id);
      if (isNaN(invoiceId)) {
        throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Invalid invoice ID');
      }

      const invoice = await invoiceBillingService.getInvoiceWithLineItems(invoiceId);
      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async updateInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoiceId = Number(req.params.id);
      if (isNaN(invoiceId)) {
        throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Invalid invoice ID');
      }

      const { invoiceDate, dealId, lineItems } = req.body;
      const invoice = await invoiceBillingService.updateInvoice(invoiceId, {
        invoiceDate,
        dealId,
        lineItems
      });

      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async markSent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoiceId = Number(req.params.id);
      if (isNaN(invoiceId)) {
        throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Invalid invoice ID');
      }

      const invoice = await invoiceBillingService.markSent(invoiceId);
      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async voidInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoiceId = Number(req.params.id);
      if (isNaN(invoiceId)) {
        throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Invalid invoice ID');
      }

      const invoice = await invoiceBillingService.voidInvoice(invoiceId);
      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async getAgingReport(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await invoiceBillingService.getAgingReport();
      wrapResult(res, report);
    } catch (error) {
      next(error);
    }
  }

  async createCreditNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoiceId = Number(req.params.id);
      if (isNaN(invoiceId)) {
        throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Invalid invoice ID');
      }

      const { amount, reason, date } = req.body;
      if (!amount || amount <= 0) {
        throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Valid amount is required');
      }

      const tenantId = req.user?.tenantId ?? undefined;

      const creditNote = await invoiceBillingService.createCreditNote(invoiceId, {
        amount,
        reason,
        date,
        tenantId
      });

      wrapResult(res, creditNote, 201);
    } catch (error) {
      next(error);
    }
  }

  async createFromOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId as string;
      if (!orderId) {
        throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'orderId is required');
      }

      const invoice = await invoiceBillingService.createFromOrder(orderId);
      wrapResult(res, invoice, 201);
    } catch (error) {
      next(error);
    }
  }
}

export default new InvoiceBillingController();
