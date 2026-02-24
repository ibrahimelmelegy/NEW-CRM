<template lang="pug">
.grid.gap-4.mb-2(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
  .glass-card.p-5.animate-entrance(v-for="(card, i) in cards" :key="card.label" :style="{ animationDelay: `${i * 0.05}s` }" v-loading="loading")
    .flex.items-center.justify-between
      div
        p.text-xs.font-medium.mb-1.uppercase.tracking-wider(style="color: var(--text-muted)") {{ card.label }}
        p.text-2xl.font-bold(:style="{ color: card.color }") {{ card.display }}
        .flex.items-center.gap-1.mt-1(v-if="card.subtitle")
          span.text-xs(style="color: var(--text-muted)") {{ card.subtitle }}
      .w-12.h-12.rounded-2xl.flex.items-center.justify-center(:style="{ background: card.color + '15' }")
        Icon(:name="card.icon" size="24" :style="{ color: card.color }")
</template>

<script setup lang="ts">
interface DashboardData {
  totalReceivable: number;
  overdue: number;
  collectedMTD: number;
  collectionRate: number;
}

const props = defineProps<{
  data: DashboardData;
  loading?: boolean;
}>();

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
}

const cards = computed(() => [
  {
    label: 'Total Receivable',
    display: formatCurrency(props.data.totalReceivable),
    icon: 'ph:money-bold',
    color: '#7849ff',
    subtitle: 'Outstanding invoices'
  },
  {
    label: 'Overdue Amount',
    display: formatCurrency(props.data.overdue),
    icon: 'ph:warning-circle-bold',
    color: '#ef4444',
    subtitle: 'Past due date'
  },
  {
    label: 'Collected This Month',
    display: formatCurrency(props.data.collectedMTD),
    icon: 'ph:check-circle-bold',
    color: '#22c55e',
    subtitle: 'Month to date'
  },
  {
    label: 'Collection Rate',
    display: `${props.data.collectionRate}%`,
    icon: 'ph:chart-line-up-bold',
    color: '#3b82f6',
    subtitle: 'Efficiency ratio'
  }
]);
</script>
