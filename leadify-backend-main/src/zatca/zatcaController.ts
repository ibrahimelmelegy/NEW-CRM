import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import zatcaService from './zatcaService';
import { AuthenticatedRequest } from '../types';

class ZatcaController {
  async getInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await zatcaService.getZatcaInvoices(req.query as Record<string, string>);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await zatcaService.getZatcaInvoice(Number(req.params.id));
      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async createInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await zatcaService.createZatcaInvoice(req.body);
      wrapResult(res, invoice, 201);
    } catch (error) {
      next(error);
    }
  }

  async submitInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await zatcaService.submitToZatca(Number(req.params.id));
      wrapResult(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async getQRCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await zatcaService.getQRCode(Number(req.params.id));
      wrapResult(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getXML(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await zatcaService.getXML(Number(req.params.id));
      res.set({
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${data.invoiceNumber}.xml"`
      });
      res.send(data.xml);
    } catch (error) {
      next(error);
    }
  }

  async validateInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = zatcaService.validateInvoiceData(req.body);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ZatcaController();
