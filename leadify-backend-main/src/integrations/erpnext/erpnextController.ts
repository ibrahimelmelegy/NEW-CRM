import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../../utils/response/responseWrapper';
import erpnextSyncService from './erpnextSyncService';
import { AuthenticatedRequest } from '../../types';

class ERPNextController {
  // ---- Connection / Status ----

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await erpnextSyncService.getERPNextStatus();
      wrapResult(res, status);
    } catch (error) {
      next(error);
    }
  }

  async testConnection(req: Request, res: Response, next: NextFunction) {
    try {
      erpnextSyncService.resetClient(); // force fresh connection
      const status = await erpnextSyncService.getERPNextStatus();
      wrapResult(res, status);
    } catch (error) {
      next(error);
    }
  }

  // ---- Push syncs ----

  async syncInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoiceId = Number(req.params.id);
      if (!invoiceId || isNaN(invoiceId)) {
        res.status(400).json({ message: 'Invalid invoice ID' });
        return;
      }
      const result = await erpnextSyncService.syncInvoiceToERPNext(invoiceId);
      wrapResult(res, result, result.success ? 200 : 422);
    } catch (error) {
      next(error);
    }
  }

  async syncClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.params.id;
      if (!clientId) {
        res.status(400).json({ message: 'Invalid client ID' });
        return;
      }
      const result = await erpnextSyncService.syncCustomerToERPNext(clientId as string);
      wrapResult(res, result, result.success ? 200 : 422);
    } catch (error) {
      next(error);
    }
  }

  async syncVendor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const vendorId = Number(req.params.id);
      if (!vendorId || isNaN(vendorId)) {
        res.status(400).json({ message: 'Invalid vendor ID' });
        return;
      }
      const result = await erpnextSyncService.syncSupplierToERPNext(vendorId);
      wrapResult(res, result, result.success ? 200 : 422);
    } catch (error) {
      next(error);
    }
  }

  async syncPurchaseOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const poId = Number(req.params.id);
      if (!poId || isNaN(poId)) {
        res.status(400).json({ message: 'Invalid purchase order ID' });
        return;
      }
      const result = await erpnextSyncService.syncPurchaseOrderToERPNext(poId);
      wrapResult(res, result, result.success ? 200 : 422);
    } catch (error) {
      next(error);
    }
  }

  // ---- Pull from ERPNext ----

  async getAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = await erpnextSyncService.pullChartOfAccounts();
      wrapResult(res, accounts);
    } catch (error) {
      next(error);
    }
  }

  async getBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const balances = await erpnextSyncService.pullAccountBalances();
      wrapResult(res, balances);
    } catch (error) {
      next(error);
    }
  }

  async getProfitLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query;
      if (!from || !to) {
        res.status(400).json({ message: 'Query parameters "from" and "to" (YYYY-MM-DD) are required' });
        return;
      }
      const report = await erpnextSyncService.pullProfitAndLoss(from as string, to as string);
      wrapResult(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getBalanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      if (!date) {
        res.status(400).json({ message: 'Query parameter "date" (YYYY-MM-DD) is required' });
        return;
      }
      const report = await erpnextSyncService.pullBalanceSheet(date as string);
      wrapResult(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: Record<string, any> = {};
      if (req.query.party_type) filters.party_type = req.query.party_type;
      if (req.query.party) filters.party = req.query.party;
      if (req.query.payment_type) filters.payment_type = req.query.payment_type;
      if (req.query.from_date) filters.posting_date = ['>=', req.query.from_date];
      if (req.query.to_date) {
        if (filters.posting_date) {
          // Both from and to: use between
          filters.posting_date = ['between', [req.query.from_date, req.query.to_date]];
        } else {
          filters.posting_date = ['<=', req.query.to_date];
        }
      }

      const payments = await erpnextSyncService.pullPaymentEntries(Object.keys(filters).length > 0 ? filters : undefined);
      wrapResult(res, payments);
    } catch (error) {
      next(error);
    }
  }

  // ---- Sync Logs ----

  async getSyncLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, status, direction, limit, offset } = req.query;
      const result = await erpnextSyncService.getSyncLogs({
        entityType: entityType as string | undefined,
        status: status as string | undefined,
        direction: direction as string | undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      });
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ERPNextController();
