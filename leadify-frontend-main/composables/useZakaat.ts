/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

export type ZakaatStatus = 'DRAFT' | 'CALCULATED' | 'SUBMITTED' | 'PAID';

export interface ZakaatAssessment {
  id: number;
  fiscalYear: string;
  assessmentDate: string;

  // Assets
  cashAndBank: number;
  accountsReceivable: number;
  inventoryValue: number;
  shortTermInvestments: number;
  prepaidExpenses: number;
  otherCurrentAssets: number;

  // Deductions
  fixedAssets: number;
  longTermLiabilities: number;
  otherDeductions: number;

  // Calculated fields
  totalAssets: number;
  exemptAssets: number;
  zakaatableBase: number;
  zakaatRate: number;
  zakaatDue: number;

  // Status
  status: ZakaatStatus;
  submittedAt?: string;
  paidAt?: string;

  // Meta
  notes?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZakaatPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export const zakaatStatusMap: Record<ZakaatStatus, { type: string; color: string }> = {
  DRAFT: { type: 'info', color: '#909399' },
  CALCULATED: { type: '', color: '#409eff' },
  SUBMITTED: { type: 'warning', color: '#e6a23c' },
  PAID: { type: 'success', color: '#67c23a' }
};

export const zakaatStatusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Calculated', value: 'CALCULATED' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Paid', value: 'PAID' }
];

export async function fetchAssessments(query?: Record<string, string>): Promise<{ docs: ZakaatAssessment[]; pagination: ZakaatPagination }> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`zakaat/assessments${qs}`);
  if (success && body) return body as { docs: ZakaatAssessment[]; pagination: ZakaatPagination };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchAssessment(id: number | string): Promise<ZakaatAssessment | null> {
  const { body, success } = await useApiFetch(`zakaat/assessments/${id}`);
  return success && body ? (body as ZakaatAssessment) : null;
}

export async function createAssessment(data: Partial<ZakaatAssessment>): Promise<any> {
  return useApiFetch('zakaat/assessments', 'POST', data as Record<string, any>);
}

export async function updateAssessment(id: number | string, data: Partial<ZakaatAssessment>): Promise<any> {
  return useApiFetch(`zakaat/assessments/${id}`, 'PUT', data as Record<string, any>);
}

export async function calculateZakaat(id: number | string): Promise<any> {
  return useApiFetch(`zakaat/assessments/${id}/calculate`, 'POST');
}

export async function getZakaatReport(id: number | string): Promise<any> {
  const { body, success } = await useApiFetch(`zakaat/assessments/${id}/report`);
  return success && body ? body : null;
}

export async function fetchZakaatSummary(): Promise<{
  totalAssessments: number;
  totalZakaatDue: number;
  currentYearStatus: string;
}> {
  // Summary endpoint doesn't exist yet - compute from assessments list
  try {
    const { docs } = await fetchAssessments({ limit: '1000' });
    const totalAssessments = docs.length;
    const totalZakaatDue = docs.reduce((sum, a) => sum + (a.zakaatDue || 0), 0);
    const currentYear = new Date().getFullYear().toString();
    const currentYearAssessment = docs.find(a => a.fiscalYear === currentYear);
    const currentYearStatus = currentYearAssessment?.status || 'N/A';
    return { totalAssessments, totalZakaatDue, currentYearStatus };
  } catch {
    return { totalAssessments: 0, totalZakaatDue: 0, currentYearStatus: 'N/A' };
  }
}
