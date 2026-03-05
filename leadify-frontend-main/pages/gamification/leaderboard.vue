<template lang="pug">
div
  ModuleHeader(
    :title="$t('gamification.title')"
    :subtitle="$t('gamification.subtitle')"
  )
    template(#actions)
      el-button(
        v-if="canManageAchievements"
        size="large"
        type="primary"
        class="!rounded-2xl"
        @click="showAchievementDialog = true"
      )
        Icon.mr-1(name="ph:medal-bold" size="18")
        | {{ $t('gamification.createAchievement') }}
      el-button(
        v-if="canAwardPoints"
        size="large"
        type="primary"
        class="!rounded-2xl"
        @click="showAwardDialog = true"
      )
        Icon.mr-1(name="ph:star-bold" size="18")
        | {{ $t('gamification.awardPoints') }}

  StatCards(:stats="summaryStats")

  //- Top 3 Podium
  .grid.grid-cols-1.gap-4.mb-8(v-if="topThree.length > 0" class="md:grid-cols-3")
    .glass-card.p-6.text-center.animate-entrance(
      v-for="(entry, index) in topThree"
      :key="entry.userId"
      :class="getMedalClass(index)"
      :style="{ animationDelay: `${index * 0.05}s` }"
    )
      Icon.mb-4(
        :name="getMedalIcon(index)"
        size="64"
        :style="{ color: getMedalColor(index) }"
      )
      .flex.justify-center.mb-3
        el-avatar(
          :size="80"
          :src="entry.user.profilePicture || '/images/default-avatar.png'"
        )
      h3.text-xl.font-bold.mb-1(style="color: var(--text-primary)") {{ entry.user.name }}
      p.mb-2(style="color: var(--text-muted)") {{ $t('gamification.rank') }} \#{{ entry.rank }}
      .text-3xl.font-bold(style="color: var(--accent-color, #7849ff)") {{ entry.totalPoints }}
        span.text-sm.ml-1(style="color: var(--text-muted)") {{ $t('gamification.points') }}

  //- Leaderboard Table
  .glass-card.py-8.animate-entrance
    .px-6
      h2.text-xl.font-semibold.mb-4(style="color: var(--text-primary)") {{ $t('gamification.leaderboard') }}

      el-table(
        v-if="leaderboard.length > 0"
        :data="leaderboard"
        style="width: 100%"
        :default-sort="{ prop: 'rank', order: 'ascending' }"
      )
        el-table-column(
          prop="rank"
          :label="$t('gamification.rank')"
          width="100"
        )
          template(#default="{ row }")
            .text-lg.font-bold(style="color: var(--accent-color, #7849ff)") \#{{ row.rank }}

        el-table-column(
          :label="$t('gamification.user')"
          min-width="250"
        )
          template(#default="{ row }")
            .flex.items-center.gap-3
              el-avatar(
                :size="40"
                :src="row.user.profilePicture || '/images/default-avatar.png'"
              )
              div
                .font-semibold(style="color: var(--text-primary)") {{ row.user.name }}
                .text-sm(style="color: var(--text-muted)") {{ row.user.email }}

        el-table-column(
          prop="totalPoints"
          :label="$t('gamification.totalPoints')"
          width="180"
          :sortable="true"
        )
          template(#default="{ row }")
            .text-xl.font-bold(style="color: var(--text-primary)") {{ row.totalPoints }}
              span.text-sm.ml-1(style="color: var(--text-muted)") {{ $t('gamification.points') }}

      .text-center.py-8(v-else)
        Icon(name="ph:trophy-bold" size="64" style="color: var(--text-muted)" aria-hidden="true")
        p.mt-4(style="color: var(--text-muted)") {{ $t('gamification.noPeople') }}

  //- Achievements Section
  .glass-card.py-8.animate-entrance.mt-6
    .px-6
      .flex.justify-between.items-center.mb-4
        h2.text-xl.font-semibold(style="color: var(--text-primary)") {{ $t('gamification.achievements') }}

      .grid.grid-cols-1.gap-4(v-if="achievements.length > 0" class="md:grid-cols-2 lg:grid-cols-3")
        .glass-card.p-4.flex.items-center.gap-4.animate-entrance(
          v-for="(achievement, i) in achievements"
          :key="achievement.id"
          :style="{ animationDelay: `${i * 0.05}s` }"
        )
          Icon(
            :name="achievement.icon || 'ph:trophy-bold'"
            size="48"
            style="color: var(--accent-color, #7849ff)"
          )
          div.flex-1
            h3.font-semibold(style="color: var(--text-primary)") {{ achievement.name }}
            p.text-sm.mb-1(v-if="achievement.description" style="color: var(--text-muted)") {{ achievement.description }}
            .text-sm.font-bold(style="color: var(--accent-color, #7849ff)") {{ achievement.pointsValue }} {{ $t('gamification.points') }}
          el-button(
            v-if="canManageAchievements"
            type="danger"
            size="small"
            circle
            class="!rounded-2xl"
            @click="[deleteAchievementId = achievement.id, deletePopup = true]"
          )
            Icon(name="ph:trash-bold" size="16")

      .text-center.py-8(v-else)
        Icon(name="ph:medal-bold" size="64" style="color: var(--text-muted)" aria-hidden="true")
        p.mt-4(style="color: var(--text-muted)") {{ $t('gamification.noAchievements') }}

  //- Award Points Dialog
  el-dialog(
    v-model="showAwardDialog"
    :title="$t('gamification.awardPoints')"
    width="500px"
  )
    el-form(
      :model="awardForm"
      label-position="top"
      @submit.prevent="handleAwardPoints"
    )
      el-form-item(:label="$t('gamification.user')")
        el-select(
          v-model="awardForm.userId"
          :placeholder="$t('gamification.user')"
          :filterable="true"
          style="width: 100%"
        )
          el-option(
            v-for="user in allUsers"
            :key="user.id"
            :label="user.name"
            :value="user.id"
          )

      el-form-item(:label="$t('gamification.pointsValue')")
        el-input-number(
          v-model="awardForm.points"
          :min="1"
          :max="10000"
          style="width: 100%"
        )

      el-form-item(:label="$t('gamification.reason')")
        el-input(
          v-model="awardForm.reason"
          type="textarea"
          :rows="3"
          :placeholder="$t('gamification.reason')"
        )

      el-form-item(:label="$t('gamification.entityType')")
        el-input(
          v-model="awardForm.entityType"
          :placeholder="$t('gamification.entityType')"
        )

      el-form-item(:label="$t('gamification.entityId')")
        el-input(
          v-model="awardForm.entityId"
          :placeholder="$t('gamification.entityId')"
        )

    template(#footer)
      el-button(@click="showAwardDialog = false") {{ $t('common.cancel') }}
      el-button(
        type="primary"
        @click="handleAwardPoints"
        :loading="awarding"
        class="!rounded-2xl"
      ) {{ $t('gamification.awarded') }}

  //- Create Achievement Dialog
  el-dialog(
    v-model="showAchievementDialog"
    :title="$t('gamification.createAchievement')"
    width="500px"
  )
    el-form(
      :model="achievementForm"
      label-position="top"
      @submit.prevent="handleCreateAchievement"
    )
      el-form-item(:label="$t('gamification.achievementName')")
        el-input(
          v-model="achievementForm.name"
          :placeholder="$t('gamification.achievementName')"
        )

      el-form-item(:label="$t('gamification.description')")
        el-input(
          v-model="achievementForm.description"
          type="textarea"
          :rows="3"
          :placeholder="$t('gamification.description')"
        )

      el-form-item(:label="$t('gamification.icon')")
        el-input(
          v-model="achievementForm.icon"
          :placeholder="$t('gamification.icon')"
        )

      el-form-item(:label="$t('gamification.pointsValue')")
        el-input-number(
          v-model="achievementForm.pointsValue"
          :min="1"
          :max="10000"
          style="width: 100%"
        )

      el-form-item(:label="$t('gamification.criteria')")
        el-input(
          v-model="achievementForm.criteria"
          :placeholder="$t('gamification.criteria')"
        )

    template(#footer)
      el-button(@click="showAchievementDialog = false") {{ $t('common.cancel') }}
      el-button(
        type="primary"
        @click="handleCreateAchievement"
        :loading="creatingAchievement"
        class="!rounded-2xl"
      ) {{ $t('common.create') }}

  //- Delete Confirmation
  ActionModel(
    v-model="deletePopup"
    :loading="deletingAchievement"
    :description="$t('common.confirmDelete')"
    @confirm="confirmDeleteAchievement"
  )
</template>

<script lang="ts" setup>
import { ElNotification } from 'element-plus';
import {
  fetchLeaderboard,
  fetchAchievements,
  awardPoints,
  createAchievement,
  deleteAchievement,
  type LeaderboardEntry,
  type Achievement
} from '~/composables/useGamification';

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const leaderboard = ref<LeaderboardEntry[]>([]);
const achievements = ref<Achievement[]>([]);
const allUsers = ref<Record<string, unknown>[]>([]);
const showAwardDialog = ref(false);
const showAchievementDialog = ref(false);
const awarding = ref(false);
const creatingAchievement = ref(false);
const deletingAchievement = ref(false);
const deletePopup = ref(false);
const deleteAchievementId = ref<number | null>(null);

const awardForm = ref({
  userId: null as number | null,
  points: 100,
  reason: '',
  entityType: '',
  entityId: ''
});

const achievementForm = ref({
  name: '',
  description: '',
  icon: 'ph:trophy-bold',
  pointsValue: 100,
  criteria: ''
});

const canAwardPoints = computed(() => true);
const canManageAchievements = computed(() => true);

const topThree = computed(() => leaderboard.value.slice(0, 3));

const topScorer = computed(() => (leaderboard.value.length > 0 ? leaderboard.value[0]!.user.name : '—'));

const totalPoints = computed(() => leaderboard.value.reduce((sum, e) => sum + e.totalPoints, 0));

const summaryStats = computed(() => [
  { label: t('gamification.totalUsers'), value: leaderboard.value.length, icon: 'ph:users-bold', color: '#7849ff' },
  { label: t('gamification.totalPoints'), value: totalPoints.value, icon: 'ph:star-bold', color: '#f59e0b' },
  { label: t('gamification.topScorer'), value: topScorer.value, icon: 'ph:crown-bold', color: '#22c55e' },
  { label: t('gamification.achievements'), value: achievements.value.length, icon: 'ph:trophy-bold', color: '#ef4444' }
]);

const getMedalIcon = (index: number) => {
  const icons = ['ph:medal-fill', 'ph:medal-fill', 'ph:medal-fill'];
  return icons[index] || 'ph:trophy-bold';
};

const getMedalColor = (index: number) => {
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  return colors[index] || '#7849ff';
};

const getMedalClass = (index: number) => {
  const classes = ['border-2 border-[#FFD700]', 'border-2 border-[#C0C0C0]', 'border-2 border-[#CD7F32]'];
  return classes[index] || '';
};

async function loadLeaderboard() {
  leaderboard.value = await fetchLeaderboard();
}

async function loadAchievements() {
  achievements.value = await fetchAchievements();
}

async function loadUsers() {
  try {
    const { body, success } = await useApiFetch('users');
    if (success && body) {
      allUsers.value = body as unknown[];
    }
  } catch (error) {
    console.error('Failed to load users', error);
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.fetchError') });
  }
}

async function handleAwardPoints() {
  if (!awardForm.value.userId || !awardForm.value.reason) {
    ElNotification({
      type: 'warning',
      title: t('common.warning'),
      message: t('common.fillRequired')
    });
    return;
  }

  awarding.value = true;
  try {
    const { success, message } = await awardPoints({
      userId: awardForm.value.userId,
      points: awardForm.value.points,
      reason: awardForm.value.reason,
      entityType: awardForm.value.entityType || undefined,
      entityId: awardForm.value.entityId || undefined
    });

    if (success) {
      ElNotification({
        type: 'success',
        title: t('common.success'),
        message: message || t('gamification.awarded')
      });
      showAwardDialog.value = false;
      awardForm.value = { userId: null, points: 100, reason: '', entityType: '', entityId: '' };
      await loadLeaderboard();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: message || t('common.error') });
    }
  } catch (error) {
    console.error('Failed to award points', error);
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    awarding.value = false;
  }
}

async function handleCreateAchievement() {
  if (!achievementForm.value.name) {
    ElNotification({
      type: 'warning',
      title: t('common.warning'),
      message: t('common.fillRequired')
    });
    return;
  }

  creatingAchievement.value = true;
  try {
    const { success, message } = await createAchievement(achievementForm.value);

    if (success) {
      ElNotification({
        type: 'success',
        title: t('common.success'),
        message: message || t('common.created')
      });
      showAchievementDialog.value = false;
      achievementForm.value = { name: '', description: '', icon: 'ph:trophy-bold', pointsValue: 100, criteria: '' };
      await loadAchievements();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: message || t('common.error') });
    }
  } catch (error) {
    console.error('Failed to create achievement', error);
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    creatingAchievement.value = false;
  }
}

async function confirmDeleteAchievement() {
  if (!deleteAchievementId.value) return;
  deletingAchievement.value = true;
  try {
    const { success, message } = await deleteAchievement(deleteAchievementId.value);

    if (success) {
      ElNotification({
        type: 'success',
        title: t('common.success'),
        message: message || t('common.deleted')
      });
      await loadAchievements();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: message || t('common.error') });
    }
  } catch (error) {
    console.error('Failed to delete achievement', error);
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    deletingAchievement.value = false;
    deletePopup.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadLeaderboard(), loadAchievements(), loadUsers()]);
});
</script>
