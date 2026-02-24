<template lang="pug">
.grid.gap-4.mb-8(:class="gridClass")
  .glass-card.p-5.animate-entrance(v-for="(stat, i) in stats" :key="i" :style="{ animationDelay: `${i * 0.05}s` }")
    .flex.items-center.justify-between
      div
        p.text-xs.font-medium.mb-1.uppercase.tracking-wider(style="color: var(--text-muted)") {{ stat.label }}
        p.text-2xl.font-bold(:style="{ color: stat.color || 'var(--text-primary)' }") {{ stat.value }}
        .flex.items-center.gap-1.mt-1(v-if="stat.trend !== undefined")
          Icon(:name="stat.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: stat.trend >= 0 ? '#22c55e' : '#ef4444' }")
          span.text-xs.font-medium(:style="{ color: stat.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
      .w-12.h-12.rounded-2xl.flex.items-center.justify-center(v-if="stat.icon" :style="{ background: (stat.color || '#7849ff') + '15' }")
        Icon(:name="stat.icon" size="24" :style="{ color: stat.color || '#7849ff' }")
</template>

<script setup lang="ts">
interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  trend?: number;
}

const props = defineProps<{
  stats: StatItem[];
  columns?: number;
}>();

const gridClass = computed(() => {
  const cols = props.columns || props.stats.length;
  const map: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6'
  };
  return map[Math.min(cols, 6)] || map[4];
});
</script>
