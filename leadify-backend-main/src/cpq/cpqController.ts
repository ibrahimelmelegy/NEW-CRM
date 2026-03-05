import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import cpqService from './cpqService';

class CpqController {
  // ─── Price Book CRUD ─────────────────────────────────────────────────────────

  async createPriceBook(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cpqService.createPriceBook(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getPriceBooks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cpqService.getPriceBooks(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getPriceBookById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.getPriceBookById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Price book not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async updatePriceBook(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.updatePriceBook(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Price book not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async deletePriceBook(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await cpqService.deletePriceBook(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Price book not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  // ─── Entry CRUD ──────────────────────────────────────────────────────────────

  async getEntries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cpqService.getEntries(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async addEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cpqService.addEntry(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async updateEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.updateEntry(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Entry not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async deleteEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await cpqService.deleteEntry(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Entry not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  // ─── Pricing Rule CRUD ───────────────────────────────────────────────────────

  async createPricingRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cpqService.createPricingRule(req.body, tenantId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getPricingRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cpqService.getPricingRules(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async updatePricingRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.updatePricingRule(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Pricing rule not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async deletePricingRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await cpqService.deletePricingRule(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Pricing rule not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  // ─── CPQ Quote CRUD ──────────────────────────────────────────────────────────

  async createQuote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const userId = req.user!.id;
      const result = await cpqService.createQuote(req.body, tenantId, userId);
      wrapResult(res, result, 201);
    } catch (e) {
      next(e);
    }
  }

  async getQuotes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cpqService.getQuotes(req.query, tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async getQuoteById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.getQuoteById(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Quote not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async updateQuote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.updateQuote(Number(req.params.id), req.body);
      if (!result) return wrapResult(res, { message: 'Quote not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async deleteQuote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await cpqService.deleteQuote(Number(req.params.id));
      if (!deleted) return wrapResult(res, { message: 'Quote not found' }, 404);
      wrapResult(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  async approveQuote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.approveQuote(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Quote not found or cannot be approved' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async rejectQuote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.rejectQuote(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Quote not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async sendQuote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.sendQuote(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Quote not found' }, 404);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async convertQuoteToDeal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cpqService.convertQuoteToDeal(Number(req.params.id));
      if (!result) return wrapResult(res, { message: 'Quote not found' }, 404);
      if ('error' in result) return wrapResult(res, result, 422);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  // ─── Quote Calculation (No Persistence) ──────────────────────────────────────

  async generateQuote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { priceBookId, items, discountRules, taxRate } = req.body;
      if (!priceBookId || !items || !Array.isArray(items)) {
        return wrapResult(res, { message: 'priceBookId and items array are required' }, 400);
      }
      const tenantId = req.user!.tenantId!;
      const result = await cpqService.generateQuote(priceBookId, items, { discountRules, taxRate }, tenantId);
      if ('success' in result && result.success === false) {
        return wrapResult(res, result, 422);
      }
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  async validatePricing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { priceBookId, items } = req.body;
      if (!priceBookId || !items) {
        return wrapResult(res, { message: 'priceBookId and items are required' }, 400);
      }
      const result = await cpqService.validatePricing(priceBookId, items);
      wrapResult(res, result, result.valid ? 200 : 422);
    } catch (e) {
      next(e);
    }
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cpqService.getAnalytics(tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }

  // ─── Expire Overdue ──────────────────────────────────────────────────────────

  async expireOverdueQuotes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await cpqService.expireOverdueQuotes(tenantId);
      wrapResult(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export default new CpqController();
