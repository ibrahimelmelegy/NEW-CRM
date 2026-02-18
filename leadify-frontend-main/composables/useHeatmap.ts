import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function useHeatmap() {
  const heatmapData = ref<HeatmapDay[]>([]);
  const recentActivity = ref<any[]>([]);
  const loading = ref(false);
  const year = ref(new Date().getFullYear());
  const isTeamView = ref(true);

  function buildYearGrid(data: { date: string; count: number }[]): HeatmapDay[] {
    const map = new Map(data.map(d => [d.date, d.count]));
    const days: HeatmapDay[] = [];
    const start = new Date(year.value, 0, 1);
    const end = new Date(year.value, 11, 31);

    // Pad start to Sunday
    const startDay = start.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push({ date: '', count: 0, level: 0 });
    }

    const maxCount = Math.max(...data.map(d => d.count), 1);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const count = map.get(dateStr) || 0;
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count > 0) {
        const ratio = count / maxCount;
        if (ratio <= 0.25) level = 1;
        else if (ratio <= 0.5) level = 2;
        else if (ratio <= 0.75) level = 3;
        else level = 4;
      }
      days.push({ date: dateStr, count, level });
    }

    return days;
  }

  async function fetchHeatmap(userId?: number) {
    loading.value = true;
    const query = userId ? `insights/heatmap?year=${year.value}&userId=${userId}` : `insights/heatmap?year=${year.value}`;
    const res = await useApiFetch(query);
    if (res.success && res.body) {
      heatmapData.value = buildYearGrid(res.body);
    }
    loading.value = false;
  }

  async function fetchRecentActivity() {
    const res = await useApiFetch('insights/heatmap/recent?limit=30');
    if (res.success && res.body) {
      recentActivity.value = res.body;
    }
  }

  return {
    heatmapData,
    recentActivity,
    loading,
    year,
    isTeamView,
    fetchHeatmap,
    fetchRecentActivity
  };
}
