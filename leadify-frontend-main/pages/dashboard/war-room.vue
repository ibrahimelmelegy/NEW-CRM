<template lang="pug">
.war-room(:class="{ fullscreen: isFullscreen }")
  //- Header Bar
  .war-room-header.flex.items-center.justify-between.mb-6
    .flex.items-center.gap-3
      Icon.text-3xl.glow-icon(name="ph:crosshair-bold")
      div
        h1.war-title MISSION CONTROL
        p.war-subtitle Real-time CRM Intelligence
    .flex.items-center.gap-3
      .live-badge
        .pulse-dot
        span LIVE
      el-button(circle @click="toggleFullscreen")
        Icon(:name="isFullscreen ? 'ph:arrows-in-bold' : 'ph:arrows-out-bold'" size="18")
      el-button(circle @click="refreshAll")
        Icon(name="ph:arrow-clockwise-bold" size="18")

  //- Metric Counters Row
  .metrics-row.grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
    .metric-glass
      MetricCounter(
        :value="metrics.totalRevenue"
        label="Total Revenue"
        icon="ph:currency-dollar-bold"
        color="#22c55e"
        prefix="$"
      )
    .metric-glass
      MetricCounter(
        :value="metrics.wonDeals"
        label="Deals Won"
        icon="ph:trophy-bold"
        color="#8b5cf6"
      )
    .metric-glass
      MetricCounter(
        :value="metrics.openLeads"
        label="Open Leads"
        icon="ph:users-three-bold"
        color="#3b82f6"
      )
    .metric-glass
      MetricCounter(
        :value="metrics.conversionRate"
        label="Conversion Rate"
        icon="ph:chart-line-up-bold"
        color="#f59e0b"
        suffix="%"
      )

  //- Main Grid
  .grid.gap-6(class="grid-cols-1 lg:grid-cols-3")
    //- Sparkline Cards
    .col-span-1(class="lg:col-span-2")
      .grid.gap-4.mb-6(class="grid-cols-1 sm:grid-cols-2")
        SparklineCard(
          label="Revenue"
          :value="metrics.totalRevenue"
          :data="sparklineData.revenue || []"
          color="#22c55e"
          prefix="$"
        )
        SparklineCard(
          label="Deals"
          :value="metrics.totalDeals"
          :data="sparklineData.deals || []"
          color="#8b5cf6"
        )
        SparklineCard(
          label="Leads"
          :value="metrics.openLeads"
          :data="sparklineData.leads || []"
          color="#3b82f6"
        )
        SparklineCard(
          label="Conversion"
          :value="metrics.conversionRate"
          :data="sparklineData.conversion || []"
          color="#f59e0b"
        )

      //- Team Pulse
      .glass-card.p-5
        TeamPulse(:members="teamMembers")

    //- Deal Alert Feed
    .col-span-1
      .glass-card.p-5.h-full
        DealAlertFeed(:alerts="dealAlerts")
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useWarRoom } from '~/composables/useWarRoom';
import MetricCounter from '~/components/WarRoom/MetricCounter.vue';
import DealAlertFeed from '~/components/WarRoom/DealAlertFeed.vue';
import TeamPulse from '~/components/WarRoom/TeamPulse.vue';
import SparklineCard from '~/components/WarRoom/SparklineCard.vue';

definePageMeta({ layout: 'default-no-padding' });

const { metrics, dealAlerts, teamMembers, sparklineData, fetchMetrics, fetchTeam, fetchDealAlerts } = useWarRoom();

const isFullscreen = ref(false);
let refreshInterval: ReturnType<typeof setInterval> | null = null;

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
}

async function refreshAll() {
  await Promise.all([fetchMetrics(), fetchTeam(), fetchDealAlerts()]);
}

onMounted(async () => {
  await refreshAll();
  refreshInterval = setInterval(refreshAll, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style lang="scss" scoped>
.war-room {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;

  &.fullscreen {
    max-width: 100%;
    background: #050510;
    min-height: 100vh;
  }
}

.war-room-header {
  padding: 16px 0;
}

.war-title {
  font-size: 24px;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.war-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.glow-icon {
  color: var(--accent-color, #7849ff);
  filter: drop-shadow(0 0 10px var(--accent-color, #7849ff));
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 4px 12px;
  border-radius: 20px;

  span {
    font-size: 11px;
    font-weight: 800;
    color: #ef4444;
    letter-spacing: 1px;
  }
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
  }
}

.metric-glass {
  background: var(--glass-bg-primary);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border-color, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
  overflow: hidden;
}
</style>
