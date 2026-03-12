import { Op } from 'sequelize';
import ABTest from './abTestModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

interface VariantData {
  name: string;
  description: string;
  traffic: number;
}

interface VariantResults {
  impressions: number;
  conversions: number;
  conversionRate: number;
}

interface SignificanceResult {
  zScore: number;
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;
}

interface TestResultVariant extends VariantResults {
  name: string;
  significance?: SignificanceResult;
}

class ABTestService {
  async create(data: Record<string, unknown>, tenantId?: string) {
    return ABTest.create({ ...data, tenantId });
  }

  async getAll(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await ABTest.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async update(id: number, data: Record<string, unknown>) {
    const item = await ABTest.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async delete(id: number) {
    const item = await ABTest.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  /**
   * Increment the impressions count for a specific variant within a test.
   * Stores results in the JSONB `results` column keyed by variant name.
   */
  async recordImpression(testId: number, variantId: string) {
    const test = await ABTest.findByPk(testId);
    if (!test) return null;
    if (test.status !== 'RUNNING') return null;

    const results: Record<string, VariantResults> = (test.results as any) || {};
    if (!results[variantId]) {
      results[variantId] = { impressions: 0, conversions: 0, conversionRate: 0 };
    }
    results[variantId].impressions += 1;
    results[variantId].conversionRate = results[variantId].impressions > 0 ? results[variantId].conversions / results[variantId].impressions : 0;

    await test.update({ results });
    return results[variantId];
  }

  /**
   * Increment the conversions count for a specific variant within a test.
   */
  async recordConversion(testId: number, variantId: string) {
    const test = await ABTest.findByPk(testId);
    if (!test) return null;
    if (test.status !== 'RUNNING') return null;

    const results: Record<string, VariantResults> = (test.results as any) || {};
    if (!results[variantId]) {
      results[variantId] = { impressions: 0, conversions: 0, conversionRate: 0 };
    }
    results[variantId].conversions += 1;
    results[variantId].conversionRate = results[variantId].impressions > 0 ? results[variantId].conversions / results[variantId].impressions : 0;

    await test.update({ results });
    return results[variantId];
  }

  /**
   * Return per-variant results with conversion rates and statistical significance
   * compared against the first variant (control).
   */
  async getTestResults(testId: number) {
    const test = await ABTest.findByPk(testId);
    if (!test) return null;

    const results: Record<string, VariantResults> = (test.results as any) || {};
    const variants = test.variants || [];
    const variantNames = variants.map((v: VariantData) => v.name);

    // Build results array with significance vs control
    const controlName = variantNames[0];
    const controlData = results[controlName] || { impressions: 0, conversions: 0, conversionRate: 0 };
    const controlRate = controlData.impressions > 0 ? controlData.conversions / controlData.impressions : 0;

    const variantResults: TestResultVariant[] = variantNames.map((name: string, idx: number) => {
      const data = results[name] || { impressions: 0, conversions: 0, conversionRate: 0 };
      const rate = data.impressions > 0 ? data.conversions / data.impressions : 0;
      const entry: TestResultVariant = {
        name,
        impressions: data.impressions,
        conversions: data.conversions,
        conversionRate: rate
      };

      // Calculate significance vs control for non-control variants
      if (idx > 0 && controlData.impressions > 0 && data.impressions > 0) {
        entry.significance = this.calculateSignificance(controlRate, controlData.impressions, rate, data.impressions);
      }

      return entry;
    });

    return {
      testId,
      testName: test.name,
      status: test.status,
      variants: variantResults,
      totalImpressions: variantResults.reduce((sum, v) => sum + v.impressions, 0),
      totalConversions: variantResults.reduce((sum, v) => sum + v.conversions, 0)
    };
  }

  /**
   * Two-proportion z-test to determine if the difference between two conversion rates
   * is statistically significant.
   *
   * z = (p1 - p2) / sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))
   * where p_pool = (x1 + x2) / (n1 + n2)
   */
  calculateSignificance(controlRate: number, controlN: number, variantRate: number, variantN: number): SignificanceResult {
    const x1 = Math.round(controlRate * controlN);
    const x2 = Math.round(variantRate * variantN);
    const pPool = (x1 + x2) / (controlN + variantN);

    // Guard against edge cases (0% or 100% pooled rate)
    if (pPool === 0 || pPool === 1 || controlN === 0 || variantN === 0) {
      return { zScore: 0, pValue: 1, isSignificant: false, confidenceLevel: 0 };
    }

    const standardError = Math.sqrt(pPool * (1 - pPool) * (1 / controlN + 1 / variantN));
    if (standardError === 0) {
      return { zScore: 0, pValue: 1, isSignificant: false, confidenceLevel: 0 };
    }

    const zScore = (variantRate - controlRate) / standardError;

    // Approximate two-tailed p-value using the standard normal CDF
    const pValue = 2 * (1 - this._normalCdf(Math.abs(zScore)));
    const confidenceLevel = (1 - pValue) * 100;

    return {
      zScore: Math.round(zScore * 10000) / 10000,
      pValue: Math.round(pValue * 10000) / 10000,
      isSignificant: pValue < 0.05,
      confidenceLevel: Math.round(confidenceLevel * 100) / 100
    };
  }

  /**
   * Approximate the standard normal cumulative distribution function.
   * Uses the Abramowitz & Stegun approximation (formula 26.2.17).
   */
  private _normalCdf(x: number): number {
    if (x < -8) return 0;
    if (x > 8) return 1;

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x) / Math.SQRT2;
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Declare the winner of an A/B test. Finds the variant with the highest
   * conversion rate that is statistically significant vs the control.
   * Sets test status to COMPLETED and records the winning variant.
   */
  async declareWinner(testId: number) {
    const test = await ABTest.findByPk(testId);
    if (!test) return null;

    const results: Record<string, VariantResults> = (test.results as any) || {};
    const variants = test.variants || [];
    const variantNames = variants.map((v: VariantData) => v.name);

    if (variantNames.length < 2) return null;

    const controlName = variantNames[0];
    const controlData = results[controlName] || { impressions: 0, conversions: 0, conversionRate: 0 };
    const controlRate = controlData.impressions > 0 ? controlData.conversions / controlData.impressions : 0;

    let bestVariant: string | null = null;
    let bestRate = controlRate;
    let bestConfidence = 0;

    // Check each non-control variant
    for (let i = 1; i < variantNames.length; i++) {
      const name = variantNames[i];
      const data = results[name] || { impressions: 0, conversions: 0, conversionRate: 0 };
      const rate = data.impressions > 0 ? data.conversions / data.impressions : 0;

      if (data.impressions > 0 && controlData.impressions > 0) {
        const sig = this.calculateSignificance(controlRate, controlData.impressions, rate, data.impressions);
        if (sig.isSignificant && rate > bestRate) {
          bestVariant = name;
          bestRate = rate;
          bestConfidence = sig.confidenceLevel;
        }
      }
    }

    // If no variant beat control significantly, the control wins by default
    // only if we have enough data
    if (!bestVariant && controlData.impressions > 0) {
      bestVariant = controlName;
      bestConfidence = 0; // Control is baseline, no significance test needed
    }

    await test.update({
      status: 'COMPLETED',
      winnerVariant: bestVariant,
      confidence: bestConfidence,
      endDate: new Date().toISOString().split('T')[0]
    });

    const result = {
      testId,
      winner: bestVariant,
      winnerConversionRate: bestRate,
      confidence: bestConfidence,
      status: 'COMPLETED'
    };

    try {
      io.emit('abtest:winner_declared', { testId, testName: test.name, winner: bestVariant, confidence: bestConfidence });
    } catch (_ignored: unknown) { /* non-critical */ }
    return result;
  }

  /**
   * Return all tests with status RUNNING for a given tenant, including current results.
   */
  async getActiveTests(tenantId: string) {
    const tests = await ABTest.findAll({
      where: { tenantId, status: 'RUNNING' },
      order: [['createdAt', 'DESC']]
    });

    return tests.map(test => {
      const results: Record<string, VariantResults> = (test.results as any) || {};
      const variants = (test.variants || []).map((v: VariantData) => {
        const data = results[v.name] || { impressions: 0, conversions: 0, conversionRate: 0 };
        return {
          name: v.name,
          traffic: v.traffic,
          impressions: data.impressions,
          conversions: data.conversions,
          conversionRate: data.impressions > 0 ? data.conversions / data.impressions : 0
        };
      });

      return {
        id: test.id,
        name: test.name,
        type: test.type,
        status: test.status,
        startDate: test.startDate,
        variants,
        totalImpressions: variants.reduce((sum: number, v: any) => sum + v.impressions, 0),
        totalConversions: variants.reduce((sum: number, v: any) => sum + v.conversions, 0)
      };
    });
  }
}
export default new ABTestService();
