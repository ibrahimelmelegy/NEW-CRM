<template lang="pug">
.premium-kpi-cards.grid.grid-cols-1.md_grid-cols-2.lg_grid-cols-4.gap-4.mb-8
  .kpi-card.glass-card.p-5.rounded-2xl.flex.flex-col.justify-between.relative.overflow-hidden(
    v-for="(kpi, index) in metrics" 
    :key="index"
    :style="{ borderColor: kpi.color ? `${kpi.color}30` : 'var(--glass-border-color)' }"
  )
    //- Subtle background glow
    .absolute.-right-6.-top-6.w-24.h-24.rounded-full.blur-2xl.opacity-10(
      v-if="kpi.color"
      :style="{ background: kpi.color }"
    )
    
    .flex.items-start.justify-between.mb-4(style="position: relative; z-index: 1")
      .flex.items-center.justify-center.w-10.h-10.rounded-lg(
        :style="{ background: kpi.color ? `${kpi.color}15` : 'rgba(120,73,255,0.1)', color: kpi.color || 'var(--primary-color)' }"
      )
        Icon(:name="kpi.icon" size="20")
      .trend.flex.items-center.text-xs.font-semibold.px-2.py-1.rounded-full(
        v-if="kpi.trend"
        :class="kpi.trendType === 'up' ? 'text-green-600 bg-green-500/10' : 'text-red-500 bg-red-500/10'"
      )
        Icon(
          :name="kpi.trendType === 'up' ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" 
          size="12" 
          class="mr-1"
        )
        span {{ kpi.trend }}

    .content(style="position: relative; z-index: 1")
      h3.text-sm.font-medium.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
      .text-3xl.font-extrabold.tracking-tight(style="color: var(--text-primary)") {{ kpi.value }}
</template>

<script setup lang="ts">
export interface KPIMetric {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  trend?: string;
  trendType?: 'up' | 'down';
}

defineProps<{
  metrics: KPIMetric[]
}>()
</script>

<style scoped>
.kpi-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05);
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -5px rgba(0,0,0,0.08);
  border-color: var(--primary-color) !important;
}
</style>
