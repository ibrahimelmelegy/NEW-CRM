<template lang="pug">
.glass-card.rounded-2xl.overflow-hidden
  //- Header
  .p-5(style="background: linear-gradient(135deg, rgba(120, 73, 255, 0.08), rgba(59, 130, 246, 0.08))")
    .flex.items-center.gap-2.mb-1
      Icon(name="ph:receipt-bold" size="20" style="color: #7849ff")
      h3.text-lg.font-semibold(style="color: var(--text-primary)") End of Service Benefit
    .flex.items-center.gap-2
      el-tag(:type="statusType" effect="light" round size="small") {{ result.status }}
      span.text-xs(style="color: var(--text-muted)") Calculated on {{ result.calculationDate }}

  //- Benefit Amount
  .p-5.text-center(style="border-bottom: 1px solid var(--border-color)")
    .text-sm.mb-1(style="color: var(--text-muted)") Total Benefit Amount
    .text-3xl.font-bold(style="color: #7849ff") {{ formatCurrency(result.benefitAmount) }}

  //- Breakdown
  .p-5
    .text-sm.font-semibold.mb-3(style="color: var(--text-primary)") Calculation Breakdown

    .space-y-3
      //- Years of Service
      .flex.items-center.justify-between.py-2(style="border-bottom: 1px dashed var(--border-color)")
        .flex.items-center.gap-2
          Icon(name="ph:calendar-bold" size="16" style="color: var(--text-muted)")
          span.text-sm(style="color: var(--text-muted)") Years of Service
        span.text-sm.font-semibold(style="color: var(--text-primary)") {{ result.yearsOfService }} years

      //- Last Salary
      .flex.items-center.justify-between.py-2(style="border-bottom: 1px dashed var(--border-color)")
        .flex.items-center.gap-2
          Icon(name="ph:money-bold" size="16" style="color: var(--text-muted)")
          span.text-sm(style="color: var(--text-muted)") Last Monthly Salary
        span.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatCurrency(result.lastSalary) }}

      //- First 5 Years Benefit
      .flex.items-center.justify-between.py-2(style="border-bottom: 1px dashed var(--border-color)")
        div
          .flex.items-center.gap-2
            .w-6.h-6.rounded-full.flex.items-center.justify-center.text-xs.font-bold(style="background: rgba(120, 73, 255, 0.1); color: #7849ff") 1
            span.text-sm(style="color: var(--text-muted)") First 5 years (0.5x/year)
          .text-xs.mt-1(style="color: var(--text-muted); padding-left: 32px") {{ Math.min(result.yearsOfService, 5).toFixed(2) }} years x 0.5 x {{ formatCurrency(result.lastSalary) }}
        span.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatCurrency(result.firstFiveYearsBenefit) }}

      //- Remaining Years Benefit
      .flex.items-center.justify-between.py-2(v-if="result.yearsOfService > 5" style="border-bottom: 1px dashed var(--border-color)")
        div
          .flex.items-center.gap-2
            .w-6.h-6.rounded-full.flex.items-center.justify-center.text-xs.font-bold(style="background: rgba(34, 197, 94, 0.1); color: #22c55e") 2
            span.text-sm(style="color: var(--text-muted)") After 5 years (1x/year)
          .text-xs.mt-1(style="color: var(--text-muted); padding-left: 32px") {{ (result.yearsOfService - 5).toFixed(2) }} years x 1.0 x {{ formatCurrency(result.lastSalary) }}
        span.text-sm.font-semibold(style="color: var(--text-primary)") {{ formatCurrency(result.remainingYearsBenefit) }}

      //- Total
      .flex.items-center.justify-between.py-3.mt-1.rounded-xl.px-3(style="background: rgba(120, 73, 255, 0.05)")
        span.text-sm.font-bold(style="color: var(--text-primary)") Total Benefit
        span.text-lg.font-bold(style="color: #7849ff") {{ formatCurrency(result.benefitAmount) }}
</template>

<script setup lang="ts">
import type { EOSResult } from '~/composables/usePayroll';
import { EOS_STATUSES } from '~/composables/usePayroll';

const props = defineProps<{
  result: EOSResult;
}>();

const statusType = computed(() => {
  const found = EOS_STATUSES.find(s => s.value === props.result.status);
  return found?.type || 'info';
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2
  }).format(value || 0);
}
</script>
