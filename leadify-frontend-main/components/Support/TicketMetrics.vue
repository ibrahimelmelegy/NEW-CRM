<template lang="pug">
.grid.gap-4(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
  //- Open Tickets
  .glass-card.p-6.animate-entrance
    .flex.items-center.justify-between
      .flex.flex-col
        span.text-sm.font-semibold.uppercase(style="color: var(--text-muted)") Open Tickets
        span.text-3xl.font-bold.mt-2(style="color: #409eff") {{ metrics.openCount }}
      .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(64, 158, 255, 0.15)")
        el-icon(:size="24" style="color: #409eff")
          Tickets

  //- Avg Resolution Time
  .glass-card.p-6.animate-entrance
    .flex.items-center.justify-between
      .flex.flex-col
        span.text-sm.font-semibold.uppercase(style="color: var(--text-muted)") Avg Resolution
        span.text-3xl.font-bold.mt-2(style="color: #e6a23c") {{ formatHours(metrics.avgResolutionTime) }}
      .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(230, 162, 60, 0.15)")
        el-icon(:size="24" style="color: #e6a23c")
          Timer

  //- SLA Compliance
  .glass-card.p-6.animate-entrance
    .flex.items-center.justify-between
      .flex.flex-col
        span.text-sm.font-semibold.uppercase(style="color: var(--text-muted)") SLA Compliance
        span.text-3xl.font-bold.mt-2(:style="{ color: slaColor }") {{ metrics.slaComplianceRate }}%
      .w-12.h-12.rounded-xl.flex.items-center.justify-center(:style="{ background: slaBackground }")
        el-icon(:size="24" :style="{ color: slaColor }")
          CircleCheck

  //- Avg CSAT
  .glass-card.p-6.animate-entrance
    .flex.items-center.justify-between
      .flex.flex-col
        span.text-sm.font-semibold.uppercase(style="color: var(--text-muted)") Avg CSAT
        .flex.items-center.gap-2.mt-2
          span.text-3xl.font-bold(style="color: #f59e0b") {{ metrics.avgCSAT || '--' }}
          span.text-sm(v-if="metrics.avgCSAT" style="color: var(--text-muted)") / 5
      .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
        el-icon(:size="24" style="color: #f59e0b")
          Star
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Tickets, Timer, CircleCheck, Star } from '@element-plus/icons-vue';

interface MetricsData {
  openCount: number;
  avgResolutionTime: number;
  slaComplianceRate: number;
  avgCSAT: number;
  ticketsByPriority: Record<string, number>;
  ticketsByStatus: Record<string, number>;
}

const props = defineProps<{
  metrics: MetricsData;
}>();

const slaColor = computed(() => {
  if (props.metrics.slaComplianceRate >= 90) return '#67c23a';
  if (props.metrics.slaComplianceRate >= 70) return '#e6a23c';
  return '#f56c6c';
});

const slaBackground = computed(() => {
  if (props.metrics.slaComplianceRate >= 90) return 'rgba(103, 194, 58, 0.15)';
  if (props.metrics.slaComplianceRate >= 70) return 'rgba(230, 162, 60, 0.15)';
  return 'rgba(245, 108, 108, 0.15)';
});

function formatHours(hours: number): string {
  if (!hours || hours === 0) return '--';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}
</script>
