<template lang="pug">
.deal-room(v-loading="loading")
  //- Header
  .page-header.glass-card.mb-6.p-6
    .flex.items-center.justify-between.flex-wrap.gap-4
      .flex.items-center.gap-3
        Icon.text-2xl(name="ph:strategy-bold" :style="{ color: 'var(--accent-color)' }")
        div
          h1.text-2xl.font-bold.text-primary {{ roomData?.deal?.name || 'Deal Room' }}
          .flex.items-center.gap-3.mt-1
            el-tag(:type="stageType" size="small") {{ roomData?.deal?.stage }}
            span.text-secondary.text-sm ${{ (roomData?.deal?.price || 0).toLocaleString() }}
            span.text-secondary.text-sm {{ roomData?.deal?.age }} days old
      .flex.items-center.gap-2
        el-button(@click="router.push(`/sales/deals/${dealId}`)" type="default" plain)
          Icon.mr-1(name="ph:arrow-left-bold" size="14")
          | {{ $t("deals.backToDeal") }}

  template(v-if="roomData")
    .grid.gap-6(class="grid-cols-1 lg:grid-cols-3")
      //- Left Column: Health + Quick Actions + Stakeholders
      .col-span-1.space-y-6
        .glass-card.p-5
          DealHealthGauge(:score="roomData.healthScore")

        .glass-card.p-5
          QuickActions(:dealId="dealId")

        .glass-card.p-5
          StakeholderMap(
            :sellers="roomData.stakeholders?.sellers || []"
            :buyers="roomData.stakeholders?.buyers || []"
          )

      //- Right Column: Timeline + Stats
      .col-span-1(class="lg:col-span-2")
        .glass-card.p-5.mb-6
          DealTimeline(:timeline="roomData.timeline || []")

        //- Stats Grid
        .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
          .stat-card.glass-card.p-4.text-center
            .stat-value {{ roomData.stats?.totalActivities || 0 }}
            .stat-label Activities
          .stat-card.glass-card.p-4.text-center
            .stat-value {{ roomData.stats?.daysSinceActivity || 0 }}
            .stat-label Days Idle
          .stat-card.glass-card.p-4.text-center
            .stat-value {{ roomData.comments || 0 }}
            .stat-label Comments
          .stat-card.glass-card.p-4.text-center
            .stat-value {{ roomData.stats?.completedTasks || 0 }}/{{ roomData.stats?.totalTasks || 0 }}
            .stat-label Tasks Done

  //- Sales Coach Panel
  SalesCoachPanel(:dealId="dealId")
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useDealRoom } from '~/composables/useDealRoom';
import DealHealthGauge from '~/components/DealRoom/DealHealthGauge.vue';
import DealTimeline from '~/components/DealRoom/DealTimeline.vue';
import StakeholderMap from '~/components/DealRoom/StakeholderMap.vue';
import QuickActions from '~/components/DealRoom/QuickActions.vue';
import SalesCoachPanel from '~/components/SalesCoach/SalesCoachPanel.vue';

const route = useRoute();
const router = useRouter();
const dealId = route.params.id as string;

const { roomData, loading, fetchDealRoom } = useDealRoom();

const stageType = computed(() => {
  const stage = roomData.value?.deal?.stage;
  if (stage === 'CLOSED') return 'success';
  if (stage === 'CANCELLED') return 'danger';
  return 'primary';
});

onMounted(() => {
  fetchDealRoom(dealId);
});
</script>

<style lang="scss" scoped>
.deal-room {
  max-width: 1400px;
  margin: 0 auto;
}

.text-primary {
  color: var(--text-primary);
}
.text-secondary {
  color: var(--text-secondary);
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}
</style>
