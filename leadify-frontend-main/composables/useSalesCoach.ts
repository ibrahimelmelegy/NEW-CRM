import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface DealAnalysis {
  dealId: string;
  dealName: string;
  winProbability: number;
  healthStatus: 'healthy' | 'at-risk' | 'stalling' | 'trending-up';
  nextBestActions: { action: string; priority: 'high' | 'medium' | 'low'; icon: string }[];
  insights: string[];
}

export interface PipelineHealth {
  totalDeals: number;
  atRisk: number;
  stalling: number;
  trendingUp: number;
  healthy: number;
  avgDealAge: number;
  avgDealValue: number;
}

export function useSalesCoach() {
  const dealAnalysis = ref<DealAnalysis | null>(null);
  const pipelineHealth = ref<PipelineHealth | null>(null);
  const weeklySummary = ref<any>(null);
  const loading = ref(false);
  const isOpen = ref(false);

  async function analyzeDeal(dealId: string) {
    loading.value = true;
    const res = await useApiFetch(`ai/sales-coach/deal/${dealId}`);
    if (res.success && res.body) {
      dealAnalysis.value = res.body as any;
    }
    loading.value = false;
  }

  async function fetchPipelineHealth() {
    loading.value = true;
    const res = await useApiFetch('ai/sales-coach/pipeline');
    if (res.success && res.body) {
      pipelineHealth.value = res.body as any;
    }
    loading.value = false;
  }

  async function fetchWeeklySummary() {
    const res = await useApiFetch('ai/sales-coach/weekly-summary');
    if (res.success && res.body) {
      weeklySummary.value = res.body;
    }
  }

  function openCoach() {
    isOpen.value = true;
  }
  function closeCoach() {
    isOpen.value = false;
  }

  return {
    dealAnalysis,
    pipelineHealth,
    weeklySummary,
    loading,
    isOpen,
    analyzeDeal,
    fetchPipelineHealth,
    fetchWeeklySummary,
    openCoach,
    closeCoach
  };
}
