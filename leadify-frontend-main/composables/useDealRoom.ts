import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';

export function useDealRoom() {
  const roomData = ref<Record<string, unknown> | null>(null);
  const loading = ref(false);

  async function fetchDealRoom(dealId: string) {
    loading.value = true;
    try {
      const res = await useApiFetch(`deal/${dealId}/room`);
      if (res.success && res.body) {
        roomData.value = res.body;
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    roomData,
    loading,
    fetchDealRoom
  };
}
