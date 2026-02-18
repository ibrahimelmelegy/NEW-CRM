import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import currencyService from './currencyService';

class CurrencyController {
  async getCurrencies(req: Request, res: Response, next: NextFunction) {
    try { wrapResult(res, await currencyService.getCurrencies()); }
    catch (error) { next(error); }
  }

  async createCurrency(req: Request, res: Response, next: NextFunction) {
    try { wrapResult(res, await currencyService.createCurrency(req.body), 201); }
    catch (error) { next(error); }
  }

  async updateCurrency(req: Request, res: Response, next: NextFunction) {
    try { wrapResult(res, await currencyService.updateCurrency(Number(req.params.id), req.body)); }
    catch (error) { next(error); }
  }

  async deleteCurrency(req: Request, res: Response, next: NextFunction) {
    try { wrapResult(res, await currencyService.deleteCurrency(Number(req.params.id))); }
    catch (error) { next(error); }
  }

  async convert(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, from, to } = req.query;
      wrapResult(res, await currencyService.convert(Number(amount), from as string, to as string));
    } catch (error) { next(error); }
  }

  async getTaxRules(req: Request, res: Response, next: NextFunction) {
    try { wrapResult(res, await currencyService.getTaxRules()); }
    catch (error) { next(error); }
  }

  async createTaxRule(req: Request, res: Response, next: NextFunction) {
    try { wrapResult(res, await currencyService.createTaxRule(req.body), 201); }
    catch (error) { next(error); }
  }

  async updateTaxRule(req: Request, res: Response, next: NextFunction) {
    try { wrapResult(res, await currencyService.updateTaxRule(Number(req.params.id), req.body)); }
    catch (error) { next(error); }
  }

  async deleteTaxRule(req: Request, res: Response, next: NextFunction) {
    try { wrapResult(res, await currencyService.deleteTaxRule(Number(req.params.id))); }
    catch (error) { next(error); }
  }

  async calculateTax(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, taxRuleId } = req.query;
      wrapResult(res, await currencyService.calculateTax(Number(amount), Number(taxRuleId)));
    } catch (error) { next(error); }
  }

  async calculateVAT(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, rate, isInclusive } = req.query;
      const result = currencyService.calculateVAT(
        Number(amount),
        Number(rate),
        isInclusive === 'true'
      );
      wrapResult(res, result);
    } catch (error) { next(error); }
  }
}

export default new CurrencyController();
