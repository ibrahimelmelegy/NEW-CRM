import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface MomentumResult {
  score: number;
  velocity: number;
  engagement: number;
  progression: number;
  responsiveness: number;
  trend: number[];
  label: 'Hot' | 'Warm' | 'Cooling' | 'Cold';
  color: string;
}

export function useDealMomentum() {
  const momentum = ref<MomentumResult | null>(null);
  const loading = ref(false);

  async function fetchMomentum(dealId: string) {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch(`deal/${dealId}/momentum`);
      if (success && body) {
        momentum.value = body as MomentumResult;
      }
    } finally {
      loading.value = false;
    }
  }

  const scoreColor = computed(() => {
    if (!momentum.value) return '#666';
    const s = momentum.value.score;
    if (s >= 76) return '#00ff88';
    if (s >= 51) return '#ffaa00';
    if (s >= 26) return '#ff8800';
    return '#ff4444';
  });

  return { momentum, loading, fetchMomentum, scoreColor };
}
