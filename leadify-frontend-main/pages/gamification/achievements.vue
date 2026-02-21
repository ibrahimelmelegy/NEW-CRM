<template lang="pug">
.achievements-page
  //- Header
  .page-header.glass-card.mb-6.p-6
    .flex.items-center.justify-between.flex-wrap.gap-4
      .flex.items-center.gap-3
        Icon.text-2xl(name="ph:trophy-bold" style="color: #fbbf24")
        div
          h1.text-2xl.font-bold.text-primary {{ $t('achievements.title') }}
          p.text-secondary.text-sm {{ unlockedCount }}/{{ totalCount }} unlocked

  //- Level + Streak Row
  .grid.gap-6.mb-6(class="grid-cols-1 md:grid-cols-2")
    .glass-card
      LevelProgress(
        :level="state.level"
        :totalPoints="state.totalPoints"
        :nextLevelPoints="state.nextLevelPoints"
        :progress="state.progressToNextLevel"
      )
    .glass-card
      StreakTracker(
        :current="state.streak.current"
        :longest="state.streak.longest"
      )

  //- Achievement Cards
  .glass-card.p-6.mb-6
    h2.text-lg.font-semibold.text-primary.mb-4
      Icon.mr-2(name="ph:medal-bold" size="20")
      | Trophy Showcase
    .achievement-grid
      .achievement-flip-card(v-for="a in state.achievements" :key="a.id")
        .flip-inner(:class="{ unlocked: a.unlocked }")
          .flip-front
            .trophy-icon(:class="{ locked: !a.unlocked }")
              Icon(:name="a.icon || 'ph:trophy-bold'" size="28")
            .trophy-name {{ a.name }}
            .trophy-points +{{ a.pointsValue }} XP
          .flip-back
            .trophy-desc {{ a.description }}
            .trophy-date(v-if="a.unlockedAt") {{ new Date(a.unlockedAt).toLocaleDateString() }}
            .trophy-locked(v-else) Locked

  //- Challenges
  .glass-card.p-6(v-if="challenges.length")
    h2.text-lg.font-semibold.text-primary.mb-4
      Icon.mr-2(name="ph:target-bold" size="20")
      | Active Challenges
    .grid.gap-4(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
      ChallengeCard(v-for="c in challenges" :key="c.id" :challenge="c")

  //- Achievement Unlock Overlay
  AchievementUnlock(
    :visible="showUnlock"
    :achievement="unlockedAchievement"
    @close="showUnlock = false"
  )
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAchievements } from '~/composables/useAchievements';
import LevelProgress from '~/components/Gamification/LevelProgress.vue';
import StreakTracker from '~/components/Gamification/StreakTracker.vue';
import ChallengeCard from '~/components/Gamification/ChallengeCard.vue';
import AchievementUnlock from '~/components/Gamification/AchievementUnlock.vue';

const { state, challenges, loading, unlockedCount, totalCount, fetchAchievements, fetchChallenges } = useAchievements();

const showUnlock = ref(false);
const unlockedAchievement = ref<any>(null);

onMounted(async () => {
  await Promise.all([fetchAchievements(), fetchChallenges()]);
});
</script>

<style lang="scss" scoped>
.achievements-page {
  max-width: 1200px;
  margin: 0 auto;
}

.text-primary {
  color: var(--text-primary);
}
.text-secondary {
  color: var(--text-secondary);
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.achievement-flip-card {
  perspective: 800px;
  height: 180px;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;

  &:hover {
    transform: rotateY(180deg);
  }
}

.flip-front,
.flip-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border-color, rgba(255, 255, 255, 0.08));
}

.flip-back {
  transform: rotateY(180deg);
  background: rgba(120, 73, 255, 0.1);
}

.trophy-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  background: linear-gradient(135deg, var(--accent-color, #7849ff), var(--gradient-end, #a855f7));
  color: white;

  &.locked {
    background: rgba(107, 114, 128, 0.3);
    color: #6b7280;
    filter: grayscale(1);
  }
}

.unlocked .trophy-icon {
  box-shadow: 0 0 20px rgba(120, 73, 255, 0.3);
}

.trophy-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.trophy-points {
  font-size: 12px;
  font-weight: 600;
  color: #fbbf24;
}

.trophy-desc {
  font-size: 12px;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: 8px;
}

.trophy-date {
  font-size: 11px;
  color: #22c55e;
}

.trophy-locked {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
}
</style>
