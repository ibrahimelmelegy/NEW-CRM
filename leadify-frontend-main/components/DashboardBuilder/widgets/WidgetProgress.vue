<template lang="pug">
.widget-progress.glass-card.p-5.h-full
  h4.text-sm.font-bold.mb-4(style="color: var(--text-primary)") {{ title }}
  //- Loading skeleton
  .animate-pulse.space-y-4(v-if="loading")
    div(v-for="i in 3" :key="i")
      .flex.justify-between.mb-1
        .h-3.rounded.w-24(style="background: rgba(168, 85, 247, 0.1)")
        .h-3.rounded.w-16(style="background: rgba(168, 85, 247, 0.08)")
      .h-3.rounded-full(style="background: rgba(168, 85, 247, 0.06)")
  //- Targets
  .space-y-4(v-else)
    .target-item(v-for="target in targets" :key="target.label")
      .flex.items-center.justify-between.mb-1
        span.text-sm.font-medium(style="color: var(--text-primary)") {{ target.label }}
        .flex.items-center.gap-2
          span.text-xs.font-medium(:style="{ color: target.color }") {{ target.actual }}
          span.text-xs(style="color: var(--text-muted)") / {{ target.goal }}
      .progress-bar-bg.rounded-full.overflow-hidden(style="height: 8px; background: rgba(255,255,255,0.06)")
        .progress-bar-fill.rounded-full.h-full.transition-all.duration-700(
          :style="{ width: `${target.percentage}%`, background: `linear-gradient(90deg, ${target.color}, ${target.color}88)` }"
        )
      .flex.justify-end.mt-1
        span.text-xs.font-bold(:style="{ color: target.percentage >= 100 ? '#10B981' : target.percentage >= 70 ? '#F59E0B' : '#EF4444' }") {{ target.percentage }}%
    .text-center.py-6(v-if="!targets.length")
      Icon(name="ph:target" size="32" style="color: var(--text-muted)")
      p.text-xs.mt-2(style="color: var(--text-muted)") No targets set
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();

interface Target {
  label: string;
  actual: string | number;
  goal: string | number;
  percentage: number;
  color: string;
}

const loading = ref(true);
const targets = ref<Target[]>([]);

const TARGET_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

async function loadData() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('dashboards/executive-summary');
    if (success && body) {
      const data = body as any;
      // Build targets from summary data
      const revenueTarget = data.revenueTarget || data.targetRevenue || 500000;
      const actualRevenue = data.totalRevenue || 0;
      const dealsTarget = data.dealsTarget || data.targetDeals || 50;
      const actualDeals = data.activeDeals || data.dealsCount || 0;
      const leadsTarget = data.leadsTarget || data.targetLeads || 200;
      const actualLeads = data.totalLeads || data.leadsCount || 0;

      targets.value = [
        {
          label: 'Revenue',
          actual: `SAR ${formatLargeNumber(actualRevenue)}`,
          goal: `SAR ${formatLargeNumber(revenueTarget)}`,
          percentage: Math.min(Math.round((actualRevenue / revenueTarget) * 100), 100) || 0,
          color: TARGET_COLORS[0],
        },
        {
          label: 'Deals Closed',
          actual: actualDeals,
          goal: dealsTarget,
          percentage: Math.min(Math.round((actualDeals / dealsTarget) * 100), 100) || 0,
          color: TARGET_COLORS[1],
        },
        {
          label: 'Leads Generated',
          actual: actualLeads,
          goal: leadsTarget,
          percentage: Math.min(Math.round((actualLeads / leadsTarget) * 100), 100) || 0,
          color: TARGET_COLORS[2],
        },
      ];
    }
  } catch (e) {
    console.error('Progress widget load failed:', e);
    // Provide fallback visual data
    targets.value = [
      { label: 'Revenue', actual: '--', goal: '--', percentage: 0, color: TARGET_COLORS[0] },
      { label: 'Deals Closed', actual: '--', goal: '--', percentage: 0, color: TARGET_COLORS[1] },
      { label: 'Leads Generated', actual: '--', goal: '--', percentage: 0, color: TARGET_COLORS[2] },
    ];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style lang="scss" scoped>
.widget-progress {
  min-height: 200px;
}

.progress-bar-fill {
  box-shadow: 0 0 8px rgba(120, 73, 255, 0.3);
}
</style>
