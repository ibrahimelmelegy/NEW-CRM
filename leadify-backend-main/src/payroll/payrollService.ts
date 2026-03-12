import { Op } from 'sequelize';
import PayrollRun, { PayrollRunStatus } from './models/payrollRunModel';
import Payslip from './models/payslipModel';
import SalaryStructure from './models/salaryStructureModel';
import EndOfService, { EOSStatus } from './models/endOfServiceModel';
import Employee, { EmployeeStatus } from '../hr/models/employeeModel';
import { tenantWhere } from '../utils/tenantScope';
import { clampPagination } from '../utils/pagination';

class PayrollService {
  // ─── Payroll Runs ────────────────────────────────────────────────────

  async createPayrollRun(data: Record<string, unknown>) {
    return PayrollRun.create({
      month: data.month,
      year: data.year,
      status: PayrollRunStatus.DRAFT,
      tenantId: data.tenantId
    });
  }

  async getPayrollRuns(query: Record<string, unknown>, user?: Record<string, any>) {
    const { page, limit, offset } = clampPagination(query, 20);
    const { month, year, status } = query;
    const where: Record<string, any> = { ...(user ? tenantWhere(user) : {}) };
    if (month) where.month = month;
    if (year) where.year = year;
    if (status) where.status = status;

    const { rows, count } = await PayrollRun.findAndCountAll({
      where,
      order: [
        ['year', 'DESC'],
        ['month', 'DESC']
      ],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getPayrollRunById(id: string) {
    const run = await PayrollRun.findByPk(id, {
      include: [
        {
          model: Payslip,
          as: 'payslips',
          include: [
            {
              model: Employee,
              as: 'employee',
              attributes: ['id', 'employeeNumber', 'firstName', 'lastName', 'email', 'departmentId']
            }
          ]
        }
      ]
    });
    if (!run) throw new Error('Payroll run not found');
    return run;
  }

  async calculatePayslips(runId: string) {
    const run = await PayrollRun.findByPk(runId);
    if (!run) throw new Error('Payroll run not found');
    if (run.status !== PayrollRunStatus.DRAFT && run.status !== PayrollRunStatus.CALCULATED) {
      throw new Error('Payroll run cannot be recalculated in current status');
    }

    // Remove existing payslips for this run (in case of recalculation)
    await Payslip.destroy({ where: { payrollRunId: runId } });

    // Get all active employees
    const employees = await Employee.findAll({
      where: { status: EmployeeStatus.ACTIVE }
    });

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const employee of employees) {
      // Get the most recent salary structure for this employee
      const salaryStructure = await SalaryStructure.findOne({
        where: {
          employeeId: employee.id,
          effectiveDate: { [Op.lte]: new Date() }
        },
        order: [['effectiveDate', 'DESC']]
      });

      if (!salaryStructure) continue; // Skip employees without salary structure

      const basicSalary = Number(salaryStructure.basicSalary);
      const housingAllowance = Number(salaryStructure.housingAllowance) || 0;
      const transportAllowance = Number(salaryStructure.transportAllowance) || 0;
      const otherAllowances = Number(salaryStructure.otherAllowances) || 0;
      const gosiEmployeeRate = Number(salaryStructure.gosiEmployeeRate) || 0.0975;

      const grossSalary = basicSalary + housingAllowance + transportAllowance + otherAllowances;
      const gosiDeduction = Math.round(grossSalary * gosiEmployeeRate * 100) / 100;
      const absentDeduction = 0;
      const loanDeduction = 0;
      const otherDeductionsAmount = 0;
      const totalDeductionsAmount = gosiDeduction + absentDeduction + loanDeduction + otherDeductionsAmount;
      const netSalary = grossSalary - totalDeductionsAmount;

      await Payslip.create({
        payrollRunId: runId,
        employeeId: employee.id,
        basicSalary,
        housingAllowance,
        transportAllowance,
        otherAllowances,
        grossSalary,
        gosiDeduction,
        absentDeduction,
        loanDeduction,
        otherDeductions: otherDeductionsAmount,
        totalDeductions: totalDeductionsAmount,
        netSalary,
        workingDays: 30,
        absentDays: 0
      });

      totalGross += grossSalary;
      totalDeductions += totalDeductionsAmount;
      totalNet += netSalary;
    }

    await run.update({
      status: PayrollRunStatus.CALCULATED,
      totalGross: Math.round(totalGross * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      employeeCount: employees.length
    });

    return this.getPayrollRunById(runId);
  }

  async approveRun(runId: string, userId: string) {
    const run = await PayrollRun.findByPk(runId);
    if (!run) throw new Error('Payroll run not found');
    if (run.status !== PayrollRunStatus.CALCULATED) {
      throw new Error('Only calculated payroll runs can be approved');
    }

    await run.update({
      status: PayrollRunStatus.APPROVED,
      approvedBy: userId
    });

    return this.getPayrollRunById(runId);
  }

  async processRun(runId: string, userId: string) {
    const run = await PayrollRun.findByPk(runId);
    if (!run) throw new Error('Payroll run not found');
    if (run.status !== PayrollRunStatus.APPROVED) {
      throw new Error('Only approved payroll runs can be processed');
    }

    await run.update({
      status: PayrollRunStatus.PROCESSED,
      processedBy: userId
    });

    return this.getPayrollRunById(runId);
  }

  // ─── Payslips ────────────────────────────────────────────────────────

  async getEmployeePayslips(employeeId: string, query: Record<string, any> = {}) {
    const { page, limit, offset } = clampPagination(query, 20);

    const { rows, count } = await Payslip.findAndCountAll({
      where: { employeeId },
      include: [
        {
          model: PayrollRun,
          as: 'payrollRun',
          attributes: ['id', 'month', 'year', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // ─── Salary Structures ──────────────────────────────────────────────

  async getSalaryStructures(query: Record<string, unknown>) {
    const { page, limit, offset } = clampPagination(query, 20);
    const { employeeId } = query;
    const where: Record<string, any> = {};
    if (employeeId) where.employeeId = employeeId;

    const { rows, count } = await SalaryStructure.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeNumber', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['effectiveDate', 'DESC']],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async createSalaryStructure(data: Record<string, unknown>) {
    const structure = await SalaryStructure.create(data);
    return SalaryStructure.findByPk(structure.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeNumber', 'firstName', 'lastName', 'email']
        }
      ]
    });
  }

  async updateSalaryStructure(id: string, data: Record<string, unknown>) {
    const structure = await SalaryStructure.findByPk(id);
    if (!structure) throw new Error('Salary structure not found');
    await structure.update(data);
    return SalaryStructure.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeNumber', 'firstName', 'lastName', 'email']
        }
      ]
    });
  }

  // ─── End of Service ─────────────────────────────────────────────────

  async calculateEndOfService(employeeId: string) {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) throw new Error('Employee not found');

    // Get the latest salary structure
    const salaryStructure = await SalaryStructure.findOne({
      where: {
        employeeId,
        effectiveDate: { [Op.lte]: new Date() }
      },
      order: [['effectiveDate', 'DESC']]
    });

    // Use salary from structure or fallback to employee.salary
    const lastSalary = salaryStructure
      ? Number(salaryStructure.basicSalary) +
        Number(salaryStructure.housingAllowance || 0) +
        Number(salaryStructure.transportAllowance || 0) +
        Number(salaryStructure.otherAllowances || 0)
      : Number(employee.salary) || 0;

    // Calculate years of service
    const hireDate = new Date(employee.hireDate);
    const endDate = employee.terminationDate ? new Date(employee.terminationDate) : new Date();
    const diffMs = endDate.getTime() - hireDate.getTime();
    const yearsOfService = Math.round((diffMs / (1000 * 60 * 60 * 24 * 365.25)) * 100) / 100;

    // Saudi Labor Law EOS calculation:
    // First 5 years: 0.5 month salary per year
    // After 5 years: 1 month salary per year
    let benefitAmount = 0;
    const monthlySalary = lastSalary;

    if (yearsOfService <= 5) {
      benefitAmount = yearsOfService * 0.5 * monthlySalary;
    } else {
      const firstFiveYears = 5 * 0.5 * monthlySalary;
      const remainingYears = (yearsOfService - 5) * 1 * monthlySalary;
      benefitAmount = firstFiveYears + remainingYears;
    }

    benefitAmount = Math.round(benefitAmount * 100) / 100;

    const today = new Date().toISOString().split('T')[0];

    const eosRecord = await EndOfService.create({
      employeeId,
      calculationDate: today,
      yearsOfService,
      lastSalary: monthlySalary,
      benefitAmount,
      status: EOSStatus.CALCULATED,
      tenantId: employee.tenantId
    });

    return {
      id: eosRecord.id,
      employeeId,
      yearsOfService,
      lastSalary: monthlySalary,
      benefitAmount,
      firstFiveYearsBenefit: Math.min(yearsOfService, 5) * 0.5 * monthlySalary,
      remainingYearsBenefit: yearsOfService > 5 ? (yearsOfService - 5) * 1 * monthlySalary : 0,
      calculationDate: today,
      status: EOSStatus.CALCULATED
    };
  }

  async approveEndOfService(id: string) {
    const eos = await EndOfService.findByPk(id);
    if (!eos) throw new Error('End of service record not found');
    if (eos.status !== EOSStatus.CALCULATED) throw new Error('Only calculated EOS can be approved');
    return eos.update({ status: EOSStatus.APPROVED });
  }

  async payEndOfService(id: string) {
    const eos = await EndOfService.findByPk(id);
    if (!eos) throw new Error('End of service record not found');
    if (eos.status !== EOSStatus.APPROVED) throw new Error('Only approved EOS can be paid');
    return eos.update({ status: EOSStatus.PAID });
  }
}

export default new PayrollService();
