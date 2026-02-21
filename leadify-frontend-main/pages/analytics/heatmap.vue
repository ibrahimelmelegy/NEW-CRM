<template lang="pug">
.heatmap-page
  .page-header.glass-card.mb-6.p-6
    .flex.items-center.justify-between.flex-wrap.gap-4
      .flex.items-center.gap-3
        Icon.text-2xl(name="ph:chart-bar-bold" :style="{ color: accentColor }")
        div
          h1.text-2xl.font-bold.text-primary {{ $t('heatmap.title') }}
          p.text-secondary.text-sm {{ $t('heatmap.subtitle') }}
      .flex.items-center.gap-3
        el-segmented(v-model="viewMode" :options="viewOptions" size="default")
        el-select(v-model="selectedYear" style="width: 120px" @change="onYearChange")
          el-option(v-for="y in yearOptions" :key="y" :label="y" :value="y")

  .grid.gap-6(class="grid-cols-1 lg:grid-cols-3")
    //- Heatmap
    .col-span-1(class="lg:col-span-2")
      .glass-card.p-6
        h2.text-lg.font-semibold.text-primary.mb-4
          Icon.mr-2(name="ph:squares-four-bold" size="20")
          | {{ $t('heatmap.activityMap') }}
        .flex.justify-center(v-if="loading")
          el-skeleton(:rows="7" animated)
        ActivityHeatmap(v-else :data="heatmapData")

    //- Live Ticker
    .col-span-1
      .glass-card.p-6
        LiveTicker(:items="recentActivity")
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useHeatmap } from '~/composables/useHeatmap';
import { useThemeStore } from '~/stores/theme';
import ActivityHeatmap from '~/components/Heatmap/ActivityHeatmap.vue';
import LiveTicker from '~/components/Heatmap/LiveTicker.vue';

const themeStore = useThemeStore();
const accentColor = computed(() => themeStore.accentColor);

const { heatmapData, recentActivity, loading, year, fetchHeatmap, fetchRecentActivity } = useHeatmap();

const viewMode = ref('team');
const viewOptions = [
  { label: 'Team', value: 'team' },
  { label: 'Individual', value: 'individual' }
];

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const yearOptions = [currentYear - 2, currentYear - 1, currentYear];

function onYearChange(val: number) {
  year.value = val;
  fetchHeatmap();
}

onMounted(async () => {
  await Promise.all([fetchHeatmap(), fetchRecentActivity()]);
});
</script>

<style lang="scss" scoped>
.heatmap-page {
  max-width: 1400px;
  margin: 0 auto;
}

.text-primary {
  color: var(--text-primary);
}
.text-secondary {
  color: var(--text-secondary);
}
</style>
