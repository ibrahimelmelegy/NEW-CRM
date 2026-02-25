import { Response, NextFunction } from 'express';
import { wrapResult } from '../utils/response/responseWrapper';
import payrollService from './payrollService';
import { AuthenticatedRequest } from '../types';

class PayrollController {
  // ─── Payroll Runs ────────────────────────────────────────────────────

  async createPayrollRun(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body, tenantId: (req.user as any)?.tenantId };
      wrapResult(res, await payrollService.createPayrollRun(data), 201);
    } catch (error) {
      next(error);
    }
  }

  async getPayrollRuns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await payrollService.getPayrollRuns(req.query));
    } catch (error) {
      next(error);
    }
  }

  async getPayrollRunById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await payrollService.getPayrollRunById(req.params.id as string));
    } catch (error) {
      next(error);
    }
  }

  async calculatePayslips(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await payrollService.calculatePayslips(req.params.id as string));
    } catch (error) {
      next(error);
    }
  }

  async approveRun(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await payrollService.approveRun(req.params.id as string, String((req.user as any)!.id)));
    } catch (error) {
      next(error);
    }
  }

  async processRun(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await payrollService.processRun(req.params.id as string, String((req.user as any)!.id)));
    } catch (error) {
      next(error);
    }
  }

  // ─── Payslips ────────────────────────────────────────────────────────

  async getEmployeePayslips(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await payrollService.getEmployeePayslips(req.params.employeeId as string, req.query));
    } catch (error) {
      next(error);
    }
  }

  // ─── Salary Structures ──────────────────────────────────────────────

  async getSalaryStructures(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await payrollService.getSalaryStructures(req.query));
    } catch (error) {
      next(error);
    }
  }

  async createSalaryStructure(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body, tenantId: (req.user as any)?.tenantId };
      wrapResult(res, await payrollService.createSalaryStructure(data), 201);
    } catch (error) {
      next(error);
    }
  }

  async updateSalaryStructure(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await payrollService.updateSalaryStructure(req.params.id as string, req.body));
    } catch (error) {
      next(error);
    }
  }

  // ─── End of Service ─────────────────────────────────────────────────

  async calculateEndOfService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await payrollService.calculateEndOfService(req.params.employeeId as string));
    } catch (error) {
      next(error);
    }
  }

  async approveEndOfService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await payrollService.approveEndOfService(req.params.id as string));
    } catch (error) {
      next(error);
    }
  }

  async payEndOfService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      wrapResult(res, await payrollService.payEndOfService(req.params.id as string));
    } catch (error) {
      next(error);
    }
  }
}

export default new PayrollController();
