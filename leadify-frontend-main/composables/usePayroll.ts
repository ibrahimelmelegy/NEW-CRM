/* eslint-disable no-use-before-define */
/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

// ─── Types ─────────────────────────────────────────────────────────────

export enum PayrollRunStatusEnum {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PROCESSED = 'PROCESSED'
}

export const PAYROLL_RUN_STATUSES = [
  { value: PayrollRunStatusEnum.DRAFT, label: 'Draft', type: 'info' },
  { value: PayrollRunStatusEnum.CALCULATED, label: 'Calculated', type: 'warning' },
  { value: PayrollRunStatusEnum.APPROVED, label: 'Approved', type: 'success' },
  { value: PayrollRunStatusEnum.PROCESSED, label: 'Processed', type: '' }
];

export const EOS_STATUSES = [
  { value: 'CALCULATED', label: 'Calculated', type: 'warning' },
  { value: 'APPROVED', label: 'Approved', type: 'success' },
  { value: 'PAID', label: 'Paid', type: '' }
];

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  processedBy?: string;
  approvedBy?: string;
  payslips?: PayslipItem[];
  createdAt: string;
}

export interface PayslipItem {
  id: string;
  payrollRunId: string;
  employeeId: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  gosiDeduction: number;
  absentDeduction: number;
  loanDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  absentDays: number;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SalaryStructureItem {
  id: string;
  employeeId: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  gosiEmployeeRate: number;
  gosiEmployerRate: number;
  effectiveDate: string;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface EOSResult {
  id: string;
  employeeId: string;
  yearsOfService: number;
  lastSalary: number;
  benefitAmount: number;
  firstFiveYearsBenefit: number;
  remainingYearsBenefit: number;
  calculationDate: string;
  status: string;
}

// ─── Payroll Runs ──────────────────────────────────────────────────────

export async function fetchPayrollRuns(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`payroll/runs${query}`);
  if (success && body) return body as { docs: PayrollRun[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchPayrollRunById(id: string): Promise<PayrollRun | null> {
  const { body, success } = await useApiFetch(`payroll/runs/${id}`);
  return success && body ? (body as PayrollRun) : null;
}

export async function createPayrollRun(data: { month: number; year: number }) {
  return useApiFetch('payroll/runs', 'POST', data);
}

export async function calculatePayslips(runId: string) {
  return useApiFetch(`payroll/runs/${runId}/calculate`, 'PATCH');
}

export async function approvePayrollRun(runId: string) {
  return useApiFetch(`payroll/runs/${runId}/approve`, 'PATCH');
}

export async function processPayrollRun(runId: string) {
  return useApiFetch(`payroll/runs/${runId}/process`, 'PATCH');
}

// ─── Payslips ──────────────────────────────────────────────────────────

export async function fetchEmployeePayslips(employeeId: string, params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`payroll/payslips/${employeeId}${query}`);
  if (success && body) return body as { docs: PayslipItem[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

// ─── Salary Structures ─────────────────────────────────────────────────

export async function fetchSalaryStructures(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`payroll/salary-structures${query}`);
  if (success && body)
    return body as { docs: SalaryStructureItem[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function createSalaryStructure(data: Partial<SalaryStructureItem>) {
  return useApiFetch('payroll/salary-structures', 'POST', data);
}

export async function updateSalaryStructure(id: string, data: Partial<SalaryStructureItem>) {
  return useApiFetch(`payroll/salary-structures/${id}`, 'PUT', data);
}

// ─── End of Service ────────────────────────────────────────────────────

export async function calculateEndOfService(employeeId: string) {
  return useApiFetch(`payroll/end-of-service/${employeeId}`, 'POST');
}

export async function approveEndOfService(id: string) {
  return useApiFetch(`payroll/end-of-service/${id}/approve`, 'PATCH');
}

export async function payEndOfService(id: string) {
  return useApiFetch(`payroll/end-of-service/${id}/pay`, 'PATCH');
}
