<template lang="pug">
.grid.gap-4(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
  .glass-card.p-5.rounded-2xl
    .flex.items-center.justify-between.mb-3
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.1)")
        Icon(name="ph:money-bold" size="22" style="color: #22c55e")
      .text-right
        .text-xs(style="color: var(--text-muted)") Total Gross
    .text-2xl.font-bold(style="color: #22c55e") {{ formatCurrency(data.totalGross) }}

  .glass-card.p-5.rounded-2xl
    .flex.items-center.justify-between.mb-3
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.1)")
        Icon(name="ph:minus-circle-bold" size="22" style="color: #ef4444")
      .text-right
        .text-xs(style="color: var(--text-muted)") Total Deductions
    .text-2xl.font-bold(style="color: #ef4444") {{ formatCurrency(data.totalDeductions) }}

  .glass-card.p-5.rounded-2xl
    .flex.items-center.justify-between.mb-3
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
        Icon(name="ph:wallet-bold" size="22" style="color: #7849ff")
      .text-right
        .text-xs(style="color: var(--text-muted)") Total Net
    .text-2xl.font-bold(style="color: #7849ff") {{ formatCurrency(data.totalNet) }}

  .glass-card.p-5.rounded-2xl
    .flex.items-center.justify-between.mb-3
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.1)")
        Icon(name="ph:users-bold" size="22" style="color: #3b82f6")
      .text-right
        .text-xs(style="color: var(--text-muted)") Employees
    .text-2xl.font-bold(style="color: #3b82f6") {{ data.employeeCount }}
</template>

<script setup lang="ts">
const props = defineProps<{
  data: {
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    employeeCount: number;
  };
}>();

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2
  }).format(value || 0);
}
</script>
