import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import accountingService from './accountingService';
import { AuthenticatedRequest } from '../types';

class AccountingController {
  // ─── Chart of Accounts ────────────────────────────────────────────

  async getChartOfAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const result = await accountingService.getChartOfAccounts(tenantId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const result = await accountingService.createAccount({ ...req.body, tenantId });
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountingService.updateAccount(req.params.id as string, req.body);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountingService.deleteAccount(req.params.id as string);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async seedDefaults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const result = await accountingService.seedDefaultCOA(tenantId);
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // ─── Journal Entries ──────────────────────────────────────────────

  async createJournalEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string | undefined;
      const result = await accountingService.createJournalEntry({ ...req.body, tenantId });
      wrapResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getJournalEntries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountingService.getJournalEntries(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getJournalEntryById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountingService.getJournalEntryById(req.params.id as string);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async postEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountingService.postEntry(req.params.id as string);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async voidEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountingService.voidEntry(req.params.id as string);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ─── Financial Reports ────────────────────────────────────────────

  async getTrialBalance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountingService.getTrialBalance(req.query.date as string);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getProfitAndLoss(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query as { from: string; to: string };
      if (!from || !to) {
        return wrapResult(res, { error: 'Both "from" and "to" date parameters are required' }, 400);
      }
      const result = await accountingService.getProfitAndLoss(from, to);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getBalanceSheet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string;
      if (!date) {
        return wrapResult(res, { error: '"date" parameter is required' }, 400);
      }
      const result = await accountingService.getBalanceSheet(date);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getGeneralLedger(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const result = await accountingService.getGeneralLedger(req.params.accountId as string, from, to);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AccountingController();
