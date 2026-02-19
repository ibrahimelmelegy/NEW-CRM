<template lang="pug">
.widget-kpi.glass-card.p-5.h-full
  .flex.items-center.justify-between(v-if="!loading")
    div
      p.text-xs.font-medium.mb-1.uppercase.tracking-wider(style="color: var(--text-muted)") {{ title }}
      p.text-2xl.font-bold(:style="{ color: color || 'var(--text-primary)' }") {{ displayValue }}
      .flex.items-center.gap-1.mt-1(v-if="trend !== undefined && trend !== null")
        Icon(:name="trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: trend >= 0 ? '#22c55e' : '#ef4444' }")
        span.text-xs.font-medium(:style="{ color: trend >= 0 ? '#22c55e' : '#ef4444' }") {{ trend > 0 ? '+' : '' }}{{ trend }}%
    .w-12.h-12.rounded-2xl.flex.items-center.justify-center.shrink-0(:style="{ background: (color || '#7849ff') + '15' }")
      Icon(:name="icon" size="24" :style="{ color: color || '#7849ff' }")
  //- Skeleton
  .animate-pulse(v-else)
    .flex.items-center.justify-between
      div.space-y-2.flex-1
        .h-3.rounded.w-20(style="background: rgba(168, 85, 247, 0.15)")
        .h-7.rounded.w-28(style="background: rgba(168, 85, 247, 0.1)")
        .h-3.rounded.w-16(style="background: rgba(168, 85, 247, 0.08)")
      .w-12.h-12.rounded-2xl(style="background: rgba(168, 85, 247, 0.1)")
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  icon: string;
  color?: string;
  dataSource?: string;
}>();

const loading = ref(true);
const displayValue = ref<string | number>('--');
const trend = ref<number | null>(null);

async function loadData() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('dashboards/executive-summary');
    if (success && body) {
      const data = body as any;
      switch (props.dataSource) {
        case 'revenue':
          displayValue.value = data.totalRevenue ? `SAR ${formatLargeNumber(data.totalRevenue)}` : 'SAR 0';
          trend.value = data.revenueTrend ?? null;
          break;
        case 'deals':
          displayValue.value = data.activeDeals ?? 0;
          trend.value = data.dealsTrend ?? null;
          break;
        case 'leads':
          displayValue.value = data.totalLeads ?? data.leadsCount ?? 0;
          trend.value = data.leadsTrend ?? null;
          break;
        case 'conversion':
          displayValue.value = data.conversionRate ? `${Number(data.conversionRate).toFixed(1)}%` : '0%';
          trend.value = data.conversionTrend ?? null;
          break;
        default:
          displayValue.value = data.totalRevenue ? `SAR ${formatLargeNumber(data.totalRevenue)}` : '--';
      }
    }
  } catch (e) {
    console.error('KPI widget load failed:', e);
    displayValue.value = '--';
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style lang="scss" scoped>
.widget-kpi {
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
