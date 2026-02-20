<template lang="pug">
.mrr-chart
  .chart-container(v-if="data && data.length > 0")
    .chart-bars
      .bar-wrapper(
        v-for="(item, idx) in data"
        :key="idx"
      )
        .bar-value {{ formatAmount(item.amount) }}
        .bar-track
          .bar-fill(
            :style="{ height: getBarHeight(item.amount) + '%' }"
            :class="getBarClass(idx)"
          )
        .bar-label {{ formatMonth(item.month) }}
    .chart-baseline
  .empty-chart(v-else)
    Icon(name="ph:chart-bar-bold" size="48" style="color: var(--text-muted)")
    p.mt-2(style="color: var(--text-muted)") No MRR data available
</template>

<script setup lang="ts">
interface MRRData {
  month: string;
  amount: number;
}

const props = defineProps<{
  data: MRRData[];
}>();

const maxAmount = computed(() => {
  if (!props.data || props.data.length === 0) return 1;
  return Math.max(...props.data.map(d => d.amount), 1);
});

function getBarHeight(amount: number): number {
  return Math.max(5, (amount / maxAmount.value) * 100);
}

function getBarClass(idx: number): string {
  if (idx === props.data.length - 1) return 'bar-current';
  if (idx === props.data.length - 2) return 'bar-previous';
  return 'bar-default';
}

function formatMonth(month: string): string {
  if (!month) return '';
  const [year, m] = month.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(m, 10) - 1] || month;
}

function formatAmount(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toFixed(0);
}
</script>

<style scoped>
.mrr-chart {
  width: 100%;
  min-height: 200px;
}

.chart-container {
  position: relative;
  width: 100%;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  height: 200px;
  padding-bottom: 4px;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-value {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, #909399);
  margin-bottom: 4px;
  white-space: nowrap;
}

.bar-track {
  flex: 1;
  width: 100%;
  max-width: 60px;
  display: flex;
  align-items: flex-end;
  position: relative;
}

.bar-fill {
  width: 100%;
  border-radius: 6px 6px 2px 2px;
  transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 4px;
}

.bar-default {
  background: linear-gradient(180deg, #c0c4cc 0%, #dcdfe6 100%);
}

.bar-previous {
  background: linear-gradient(180deg, #a0cfff 0%, #d9ecff 100%);
}

.bar-current {
  background: linear-gradient(180deg, #7849ff 0%, #a78bfa 100%);
  box-shadow: 0 4px 12px rgba(120, 73, 255, 0.3);
}

.bar-label {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted, #909399);
}

.chart-baseline {
  height: 2px;
  background: var(--border-color, #e4e7ed);
  border-radius: 1px;
  margin-top: -2px;
}

.empty-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}
</style>
