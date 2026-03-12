import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface AchievementData {
  id: number;
  name: string;
  description: string;
  icon: string;
  pointsValue: number;
  criteria: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface AchievementsState {
  achievements: AchievementData[];
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  progressToNextLevel: number;
  streak: { current: number; longest: number; lastActivity: string | null };
}

export function useAchievements() {
  const state = ref<AchievementsState>({
    achievements: [],
    totalPoints: 0,
    level: 0,
    nextLevelPoints: 25,
    progressToNextLevel: 0,
    streak: { current: 0, longest: 0, lastActivity: null }
  });
  const challenges = ref<Record<string, unknown>[]>([]);
  const loading = ref(false);

  async function fetchAchievements() {
    loading.value = true;
    try {
      const res = await useApiFetch('gamification/achievements/me');
      if (res.success && res.body) {
        state.value = res.body as unknown;
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchChallenges() {
    const res = await useApiFetch('gamification/challenges');
    if (res.success && res.body) {
      challenges.value = res.body as unknown;
    }
  }

  const unlockedCount = computed(() => state.value.achievements.filter(a => a.unlocked).length);
  const totalCount = computed(() => state.value.achievements.length);

  return {
    state,
    challenges,
    loading,
    unlockedCount,
    totalCount,
    fetchAchievements,
    fetchChallenges
  };
}
