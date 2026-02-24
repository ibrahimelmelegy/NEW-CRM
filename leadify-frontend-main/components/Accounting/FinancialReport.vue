<template lang="pug">
el-card(shadow="never" v-loading="loading")
  template(#header)
    h3.text-lg.font-semibold {{ title }}

  //- Sections
  div(v-for="(section, sIdx) in sections" :key="sIdx" class="mb-6")
    .flex.items-center.justify-between.mb-2.px-2
      h4.font-semibold.text-base(:style="{ color: section.color || '#303133' }") {{ section.title }}

    el-table(:data="section.items" class="w-full" :show-header="sIdx === 0")
      el-table-column(prop="label" label="Account" min-width="300")
        template(#default="{ row }")
          span.pl-4 {{ row.label }}
      el-table-column(label="Amount" width="180" align="right")
        template(#default="{ row }")
          span {{ formatAmount(row.amount) }}

    //- Subtotal
    .flex.items-center.justify-between.px-4.py-2.bg-gray-50.rounded.mt-1
      span.font-semibold Total {{ section.title }}
      span.font-bold(:style="{ color: section.color || '#303133' }") {{ formatAmount(section.subtotal) }}

  //- Grand total
  .flex.items-center.justify-between.px-4.py-3.rounded.mt-4(
    v-if="total"
    :style="{ backgroundColor: total.color ? total.color + '15' : '#f0f9ff', borderLeft: `4px solid ${total.color || '#409EFF'}` }"
  )
    span.text-lg.font-bold {{ total.label }}
    span.text-xl.font-bold(:style="{ color: total.color || '#303133' }") {{ formatAmount(total.amount) }}
</template>

<script setup lang="ts">
interface SectionItem {
  label: string;
  amount: number;
}

interface Section {
  title: string;
  items: SectionItem[];
  subtotal: number;
  color?: string;
}

interface TotalItem {
  label: string;
  amount: number;
  highlight?: boolean;
  color?: string;
}

interface Props {
  title: string;
  sections: Section[];
  total?: TotalItem;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

function formatAmount(amount: number): string {
  const abs = Math.abs(amount || 0);
  const formatted = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
  return amount < 0 ? `(${formatted})` : formatted;
}
</script>
