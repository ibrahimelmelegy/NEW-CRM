import { Op } from 'sequelize';
import ZakaatAssessment, { ZakaatBreakdown } from './zakaatModel';
import User from '../user/userModel';
import { clampPagination } from '../utils/pagination';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateAssessmentData {
  fiscalYear: string;
  companyId?: string;
  assessmentDate: string;
  breakdown: ZakaatBreakdown;
  zakaatRate?: number;
  notes?: string;
}

export interface UpdateAssessmentData {
  fiscalYear?: string;
  companyId?: string;
  assessmentDate?: string;
  breakdown?: ZakaatBreakdown;
  zakaatRate?: number;
  notes?: string;
  status?: string;
}

export interface AssessmentQuery {
  page?: number;
  limit?: number;
  status?: string;
  fiscalYear?: string;
  search?: string;
}

// ---------------------------------------------------------------------------
// Zakaat Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate Zakaat based on the asset breakdown.
 *
 * Zakaatable base = Total current assets - Fixed/exempt assets
 * Specifically: (cash + receivables + inventory + investments + prepaid) - liabilities
 * Fixed assets are exempt from Zakaat per ZATCA guidelines.
 *
 * Zakaat due = zakaatable base * rate (default 2.5%)
 */
function calculateZakaat(breakdown: ZakaatBreakdown, rate: number = 0.025) {
  const cashAndBank = Number(breakdown.cashAndBank) || 0;
  const receivables = Number(breakdown.receivables) || 0;
  const inventory = Number(breakdown.inventory) || 0;
  const investments = Number(breakdown.investments) || 0;
  const prepaidExpenses = Number(breakdown.prepaidExpenses) || 0;
  const fixedAssets = Number(breakdown.fixedAssets) || 0;
  const liabilities = Number(breakdown.liabilities) || 0;

  // Total assets including fixed
  const totalAssets = cashAndBank + receivables + inventory + investments + prepaidExpenses + fixedAssets;

  // Fixed assets are exempt from Zakaat
  const exemptAssets = fixedAssets;

  // Zakaatable base: current assets minus liabilities
  // Per Saudi ZATCA method: (total assets - exempt assets - liabilities)
  // But zakaatable base cannot be negative
  const zakaatableBase = Math.max(0, totalAssets - exemptAssets - liabilities);

  // Zakaat due: 2.5% (Hijri year) of zakaatable base
  const zakaatDue = Math.round(zakaatableBase * rate * 100) / 100;

  return {
    totalAssets: Math.round(totalAssets * 100) / 100,
    exemptAssets: Math.round(exemptAssets * 100) / 100,
    zakaatableBase: Math.round(zakaatableBase * 100) / 100,
    zakaatRate: rate,
    zakaatDue
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class ZakaatService {
  /**
   * Create a new Zakaat assessment with automatic calculation.
   */
  async createAssessment(data: CreateAssessmentData, userId: number): Promise<ZakaatAssessment> {
    if (!data.fiscalYear) throw new Error('Fiscal year is required');
    if (!data.assessmentDate) throw new Error('Assessment date is required');
    if (!data.breakdown) throw new Error('Asset breakdown is required');

    const rate = data.zakaatRate || 0.025;
    const calculation = calculateZakaat(data.breakdown, rate);

    const assessment = await ZakaatAssessment.create({
      fiscalYear: data.fiscalYear,
      companyId: data.companyId || null,
      assessmentDate: data.assessmentDate,
      totalAssets: calculation.totalAssets,
      exemptAssets: calculation.exemptAssets,
      zakaatableBase: calculation.zakaatableBase,
      zakaatRate: calculation.zakaatRate,
      zakaatDue: calculation.zakaatDue,
      status: 'CALCULATED',
      breakdown: data.breakdown,
      notes: data.notes || null,
      createdBy: userId
    });

    return assessment.reload({ include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }] });
  }

  /**
   * List assessments with pagination and filtering.
   */
  async getAssessments(query: AssessmentQuery) {
    const { page, limit, offset } = clampPagination(query, 20);
    const where: Record<string, any> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.fiscalYear) {
      where.fiscalYear = query.fiscalYear;
    }

    if (query.search) {
      where[Op.or as any] = [{ fiscalYear: { [Op.iLike]: `%${query.search}%` } }, { companyId: { [Op.iLike]: `%${query.search}%` } }];
    }

    const { rows, count } = await ZakaatAssessment.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
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

  /**
   * Get a single assessment by ID.
   */
  async getAssessmentById(id: number): Promise<ZakaatAssessment> {
    const assessment = await ZakaatAssessment.findByPk(id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
    });
    if (!assessment) throw new Error('Zakaat assessment not found');
    return assessment;
  }

  /**
   * Update an assessment. Recalculates if breakdown changes.
   */
  async updateAssessment(id: number, data: UpdateAssessmentData): Promise<ZakaatAssessment> {
    const assessment = await ZakaatAssessment.findByPk(id);
    if (!assessment) throw new Error('Zakaat assessment not found');

    if (assessment.status === 'PAID') {
      throw new Error('Cannot update a paid assessment');
    }

    const updateData: Record<string, any> = {};

    if (data.fiscalYear !== undefined) updateData.fiscalYear = data.fiscalYear;
    if (data.companyId !== undefined) updateData.companyId = data.companyId;
    if (data.assessmentDate !== undefined) updateData.assessmentDate = data.assessmentDate;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;

    // Recalculate if breakdown or rate changes
    if (data.breakdown || data.zakaatRate) {
      const breakdown = data.breakdown || (assessment.breakdown as ZakaatBreakdown);
      const rate = data.zakaatRate || Number(assessment.zakaatRate);
      const calculation = calculateZakaat(breakdown, rate);

      updateData.breakdown = breakdown;
      updateData.totalAssets = calculation.totalAssets;
      updateData.exemptAssets = calculation.exemptAssets;
      updateData.zakaatableBase = calculation.zakaatableBase;
      updateData.zakaatRate = calculation.zakaatRate;
      updateData.zakaatDue = calculation.zakaatDue;
      updateData.status = 'CALCULATED';
    }

    await assessment.update(updateData);
    return assessment.reload({
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
    });
  }

  /**
   * Recalculate Zakaat for an existing assessment using its current breakdown.
   */
  async recalculate(id: number): Promise<ZakaatAssessment> {
    const assessment = await ZakaatAssessment.findByPk(id);
    if (!assessment) throw new Error('Zakaat assessment not found');

    if (!assessment.breakdown) {
      throw new Error('Assessment has no breakdown data to recalculate');
    }

    const rate = Number(assessment.zakaatRate) || 0.025;
    const calculation = calculateZakaat(assessment.breakdown as ZakaatBreakdown, rate);

    await assessment.update({
      totalAssets: calculation.totalAssets,
      exemptAssets: calculation.exemptAssets,
      zakaatableBase: calculation.zakaatableBase,
      zakaatDue: calculation.zakaatDue,
      status: 'CALCULATED'
    });

    return assessment.reload({
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
    });
  }

  /**
   * Generate Zakaat report data for PDF/export.
   */
  async generateZakaatReport(id: number) {
    const assessment = await ZakaatAssessment.findByPk(id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
    });
    if (!assessment) throw new Error('Zakaat assessment not found');

    const breakdown = assessment.breakdown as ZakaatBreakdown | undefined;

    return {
      title: `Zakaat Assessment Report - FY ${assessment.fiscalYear}`,
      assessmentDate: assessment.assessmentDate,
      fiscalYear: assessment.fiscalYear,
      companyId: assessment.companyId,
      status: assessment.status,
      assetBreakdown: breakdown
        ? {
            currentAssets: {
              cashAndBank: Number(breakdown.cashAndBank) || 0,
              receivables: Number(breakdown.receivables) || 0,
              inventory: Number(breakdown.inventory) || 0,
              investments: Number(breakdown.investments) || 0,
              prepaidExpenses: Number(breakdown.prepaidExpenses) || 0,
              subtotal:
                (Number(breakdown.cashAndBank) || 0) +
                (Number(breakdown.receivables) || 0) +
                (Number(breakdown.inventory) || 0) +
                (Number(breakdown.investments) || 0) +
                (Number(breakdown.prepaidExpenses) || 0)
            },
            fixedAssets: Number(breakdown.fixedAssets) || 0,
            totalAssets: Number(assessment.totalAssets),
            liabilities: Number(breakdown.liabilities) || 0
          }
        : null,
      calculation: {
        totalAssets: Number(assessment.totalAssets),
        exemptAssets: Number(assessment.exemptAssets),
        zakaatableBase: Number(assessment.zakaatableBase),
        zakaatRate: Number(assessment.zakaatRate),
        zakaatRatePercent: `${(Number(assessment.zakaatRate) * 100).toFixed(1)}%`,
        zakaatDue: Number(assessment.zakaatDue)
      },
      notes: assessment.notes,
      preparedBy: assessment.creator
        ? {
            id: assessment.creator.id,
            name: (assessment.creator as any).name,
            email: (assessment.creator as any).email
          }
        : null,
      generatedAt: new Date().toISOString()
    };
  }
}

export default new ZakaatService();
