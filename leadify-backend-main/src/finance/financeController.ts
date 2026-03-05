import { Request, Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import financeService from './financeService';
import { AuthenticatedRequest } from '../types';

class FinanceController {
  // Categories
  async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.getCategories());
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.createCategory(req.body), 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.updateCategory(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.deleteCategory(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  // Expenses
  async getExpenses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.getExpenses(req.query));
    } catch (error) {
      next(error);
    }
  }

  async getExpenseById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.getExpenseById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  async createExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.createExpense(req.body, req.user?.id), 201);
    } catch (error) {
      next(error);
    }
  }

  async updateExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.updateExpense(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  }

  async deleteExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.deleteExpense(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  async approveExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.approveExpense(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  async rejectExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.rejectExpense(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  async getExpenseSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.getExpenseSummary());
    } catch (error) {
      next(error);
    }
  }

  // Budgets
  async getBudgets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.getBudgets(req.query));
    } catch (error) {
      next(error);
    }
  }

  async getBudgetById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.getBudgetById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  async createBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.createBudget(req.body), 201);
    } catch (error) {
      next(error);
    }
  }

  async updateBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.updateBudget(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  }

  async deleteBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await financeService.deleteBudget(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }
}

export default new FinanceController();
