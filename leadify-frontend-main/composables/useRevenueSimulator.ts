import { ref, reactive, computed } from 'vue';
import logger from '~/utils/logger';

export interface SimulatorBaseline {
  conversionRate: number;
  avgDealSize: number;
  salesCycleLength: number;
  newLeadsPerMonth: number;
  winRate: number;
  currentMonthlyRevenue: number;
}

export interface SimulatorSliders {
  conversionRate: number;
  avgDealSize: number;
  salesCycleLength: number;
  newLeadsPerMonth: number;
  winRate: number;
}

export interface SimulatorImpact {
  revenueChange: number;
  revenueChangePercent: number;
  totalRevenueCurrent: number;
  totalRevenueSimulated: number;
  projectedDeals: number;
  monthlyAvgCurrent: number;
  monthlyAvgSimulated: number;
}

type PresetType = 'aggressive' | 'conservative' | 'current';

export function useRevenueSimulator() {
  const loading = ref(false);

  // Baseline metrics (fetched from API)
  const baseline = ref<SimulatorBaseline>({
    conversionRate: 25,
    avgDealSize: 15000,
    salesCycleLength: 45,
    newLeadsPerMonth: 50,
    winRate: 30,
    currentMonthlyRevenue: 120000
  });

  // User-adjustable sliders
  const sliders = reactive<SimulatorSliders>({
    conversionRate: 25,
    avgDealSize: 15000,
    salesCycleLength: 45,
    newLeadsPerMonth: 50,
    winRate: 30
  });

  /**
   * Calculate a 12-month revenue projection based on given parameters.
   * Monthly revenue = (newLeads * conversionRate/100 * winRate/100 * avgDealSize)
   * Adjusted by sales cycle length: shorter cycle = faster revenue realization.
   * Adds a 2% monthly compound growth trend.
   */
  function calculateProjection(params: SimulatorSliders | SimulatorBaseline): number[] {
    const monthlyRevenue = params.newLeadsPerMonth * (params.conversionRate / 100) * (params.winRate / 100) * params.avgDealSize;

    // Shorter sales cycle means deals close faster, generating more revenue per period
    const defaultCycle = 45;
    const cycleMultiplier = defaultCycle / Math.max(params.salesCycleLength, 1);
    const adjustedRevenue = monthlyRevenue * cycleMultiplier;

    return Array.from({ length: 12 }, (_, i) => {
      return Math.round(adjustedRevenue * Math.pow(1.02, i));
    });
  }

  // 12-month projection based on baseline (current trajectory)
  const currentProjection = computed<number[]>(() => {
    return calculateProjection(baseline.value);
  });

  // 12-month projection based on slider values (simulated scenario)
  const simulatedProjection = computed<number[]>(() => {
    return calculateProjection(sliders);
  });

  // Month labels for chart display
  const monthLabels = computed<string[]>(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });
  });

  // Impact metrics comparing simulated vs current
  const impact = computed<SimulatorImpact>(() => {
    const currentTotal = currentProjection.value.reduce((a, b) => a + b, 0);
    const simulatedTotal = simulatedProjection.value.reduce((a, b) => a + b, 0);
    const currentEnd = currentProjection.value[11] || 0;
    const simulatedEnd = simulatedProjection.value[11] || 0;
    const revenueChange = simulatedEnd - currentEnd;
    const revenueChangePercent = currentEnd > 0 ? ((simulatedEnd - currentEnd) / currentEnd) * 100 : 0;

    // Projected deals closed per month on simulated settings
    const projectedDeals = Math.round(sliders.newLeadsPerMonth * (sliders.conversionRate / 100) * (sliders.winRate / 100) * 12);

    return {
      revenueChange,
      revenueChangePercent,
      totalRevenueCurrent: currentTotal,
      totalRevenueSimulated: simulatedTotal,
      projectedDeals,
      monthlyAvgCurrent: Math.round(currentTotal / 12),
      monthlyAvgSimulated: Math.round(simulatedTotal / 12)
    };
  });

  /**
   * Apply a preset scenario to the sliders.
   */
  function applyPreset(preset: PresetType) {
    const base = baseline.value;
    switch (preset) {
      case 'aggressive':
        sliders.conversionRate = Math.min(base.conversionRate * 1.5, 100);
        sliders.avgDealSize = Math.round(base.avgDealSize * 1.3);
        sliders.salesCycleLength = Math.max(Math.round(base.salesCycleLength * 0.7), 1);
        sliders.newLeadsPerMonth = Math.round(base.newLeadsPerMonth * 1.6);
        sliders.winRate = Math.min(base.winRate * 1.4, 100);
        break;
      case 'conservative':
        sliders.conversionRate = Math.round(base.conversionRate * 1.1);
        sliders.avgDealSize = Math.round(base.avgDealSize * 1.05);
        sliders.salesCycleLength = Math.round(base.salesCycleLength * 0.95);
        sliders.newLeadsPerMonth = Math.round(base.newLeadsPerMonth * 1.1);
        sliders.winRate = Math.min(Math.round(base.winRate * 1.1), 100);
        break;
      case 'current':
      default:
        reset();
        break;
    }
  }

  /**
   * Reset sliders to baseline values.
   */
  function reset() {
    sliders.conversionRate = baseline.value.conversionRate;
    sliders.avgDealSize = baseline.value.avgDealSize;
    sliders.salesCycleLength = baseline.value.salesCycleLength;
    sliders.newLeadsPerMonth = baseline.value.newLeadsPerMonth;
    sliders.winRate = baseline.value.winRate;
  }

  /**
   * Fetch baseline metrics from the insights API.
   * Falls back to sensible defaults if the API call fails.
   */
  async function fetchBaseline() {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('insights/leads-sales');
      if (success && body) {
        const convRate = parseFloat(body.leadConversionRate) || 25;
        const dealCount = Number(body.dealsCount) || 0;
        const leadCount = Number(body.leadCount) || 50;
        const revenue = Number(body.revenueFromDeals) || 120000;

        // Derive win rate from deals and opportunities
        const oppCount = Number(body.opportunityCount) || 1;
        const derivedWinRate = oppCount > 0 ? Math.min(Math.round((dealCount / oppCount) * 100), 100) : 30;

        // Estimate monthly leads (assume data spans roughly recent months)
        const estimatedMonthlyLeads = Math.max(Math.round(leadCount / 3), 10);

        // Estimate average deal size
        const avgDeal = dealCount > 0 ? Math.round(revenue / dealCount) : 15000;

        baseline.value = {
          conversionRate: Math.round(convRate),
          avgDealSize: avgDeal,
          salesCycleLength: 45,
          newLeadsPerMonth: estimatedMonthlyLeads,
          winRate: derivedWinRate,
          currentMonthlyRevenue: Math.round(revenue / 3)
        };

        // Sync sliders to fetched baseline
        reset();
      }
    } catch (err) {
      logger.error('Failed to fetch simulator baseline:', err);
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    baseline,
    sliders,
    currentProjection,
    simulatedProjection,
    monthLabels,
    impact,
    applyPreset,
    reset,
    fetchBaseline
  };
}
