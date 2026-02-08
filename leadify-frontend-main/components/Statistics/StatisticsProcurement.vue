<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-10
    .header-content
      .title.font-bold.text-3xl.mb-2.text-gradient Procurement Analytics
      .subtitle.text-muted.text-sm.tracking-wide Real-time insights into your supply chain
  
  //- KPI Cards
  .grid.grid-cols-1.md.grid-cols-3.gap-8.mb-10
    .glass-card.p-8.relative.overflow-hidden.hover-translate-y
      .flex.items-center.justify-between
        div
          .text-muted.text-xs.uppercase.font-black.tracking-widest.mb-2 Total POs
          .text-4xl.font-black.text-white {{ stats.kpi.totalPos }}
          .text-xs.text-purple-400.mt-2 Lifetime volume
        .icon-box.bg-purple-500_20.p-4.rounded-2xl
          Icon(name="ph:shopping-cart-bold" class="text-3xl text-purple-400")
    
    .glass-card.p-8.relative.overflow-hidden.hover-translate-y
      .flex.items-center.justify-between
        div
          .text-muted.text-xs.uppercase.font-black.tracking-widest.mb-2 Total Expenditure
          .text-4xl.font-black.text-gradient {{ formatCurrency(stats.kpi.totalSpend) }}
          .text-xs.text-orange-400.mt-2 Total committed spend
        .icon-box.bg-orange-500_20.p-4.rounded-2xl
          Icon(name="ph:currency-circle-dollar-bold" class="text-3xl text-orange-400")
    
    .glass-card.p-8.relative.overflow-hidden.hover-translate-y
      .flex.items-center.justify-between
        div
          .text-muted.text-xs.uppercase.font-black.tracking-widest.mb-2 Pending Queue
          .text-4xl.font-black.text-white {{ stats.kpi.pendingCount }}
          .text-xs.text-pink-400.mt-2 Needs attention
        .icon-box.bg-pink-500_20.p-4.rounded-2xl
          Icon(name="ph:clock-countdown-bold" class="text-3xl text-pink-400")

  //- Charts
  .grid.grid-cols-1.lg.grid-cols-2.gap-10.mb-10
    .glass-card.p-8
      .flex.items-center.gap-4.mb-8
        Icon(name="ph:chart-pie-slice-bold" class="text-purple-400 text-xl")
        span.font-bold.text-muted.uppercase.tracking-widest.text-xs Top Suppliers by Volume
      client-only
        v-chart(:option="vendorChartOption", style="height: 350px", autoresize)
    
    .glass-card.p-8
      .flex.items-center.gap-4.mb-8
        Icon(name="ph:chart-line-up-bold" class="text-orange-400 text-xl")
        span.font-bold.text-muted.uppercase.tracking-widest.text-xs Procurement Trend (6 Months)
      client-only
        v-chart(:option="monthlyChartOption", style="height: 350px", autoresize)

  //- Recent Transactions Table
  .glass-card.p-8
      .flex.items-center.gap-4.mb-6
        Icon(name="ph:list-dashes-bold" class="text-blue-400 text-xl")
        span.font-bold.text-muted.uppercase.tracking-widest.text-xs Recent Transactions

      el-table(:data="stats.recentTransactions" style="width: 100%" class="premium-table")
        el-table-column(prop="poNumber" label="PO Number" width="180")
          template(#default="{row}")
             span.font-bold.text-white {{ row.poNumber }}
        el-table-column(label="Vendor" width="250")
          template(#default="{row}")
             .flex.items-center.gap-3
               .w-8.h-8.rounded-full.bg-purple-500_20.flex.items-center.justify-center.text-purple-400.font-bold.text-xs
                  | {{ row.Vendor?.name?.charAt(0) || '?' }}
               span.text-gray-300 {{ row.Vendor?.name || 'Unknown' }}
        el-table-column(prop="totalAmount" label="Amount")
           template(#default="{row}")
              span.font-mono {{ formatCurrency(row.totalAmount) }}
        el-table-column(prop="status" label="Status")
           template(#default="{row}")
              span.px-3.py-1.rounded-full.text-xs.font-bold(:class="getStatusClass(row.status)") {{ row.status }}
        el-table-column(prop="createdAt" label="Date")
           template(#default="{row}")
              span.text-xs.text-muted {{ new Date(row.createdAt).toLocaleDateString() }}

</template>

<script setup lang="ts">
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, PieChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

// State
const stats = ref({
  kpi: { totalPos: 0, totalSpend: 0, pendingCount: 0 },
  charts: { topVendors: [], monthlyTrend: [] },
  recentTransactions: []
});

const loading = ref(true);

// Fetch Data
onMounted(async () => {
  loading.value = true;
  try {
    const response = await useApiFetch('procurement/stats');
    if (response) {
      stats.value = response as any;
    }
  } catch (e) {
    console.error('Failed to fetch statistics', e);
  } finally {
    loading.value = false;
  }
});

// Helpers
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(value);
};

const getStatusClass = (status: string) => {
  const map: any = {
    Pending: 'bg-yellow-500/20 text-yellow-500',
    Approved: 'bg-green-500/20 text-green-500',
    Rejected: 'bg-red-500/20 text-red-500',
    Draft: 'bg-gray-500/20 text-gray-500'
  };
  return map[status] || 'bg-gray-500/20 text-gray-500';
};

// Chart Options (Computed to react to data changes)
const vendorChartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(30, 18, 48, 0.9)',
    borderWidth: 0,
    textStyle: { color: '#fff' }
  },
  legend: {
    bottom: '0',
    left: 'center',
    textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 10 }
  },
  series: [
    {
      name: 'Spending',
      type: 'pie',
      radius: ['50%', '80%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 15,
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: '18', fontWeight: 'bold', color: '#fff' },
        itemStyle: { shadowBlur: 20, shadowColor: 'rgba(168, 85, 247, 0.5)' }
      },
      data:
        stats.value.charts.topVendors.map((v: any) => ({
          value: v.value,
          name: v.name
        })).length > 0
          ? stats.value.charts.topVendors.map((v: any) => ({ value: v.value, name: v.name }))
          : [{ value: 0, name: 'No Data' }]
    }
  ]
}));

const monthlyChartOption = computed(() => ({
  backgroundColor: 'transparent',
  grid: { top: '10%', left: '3%', right: '4%', bottom: '15%', containLabel: true },
  xAxis: {
    type: 'category',
    data: stats.value.charts.monthlyTrend.map((d: any) => d.month),
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
    axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10 }
  },
  series: [
    {
      data: stats.value.charts.monthlyTrend.map((d: any) => d.value),
      type: 'bar',
      barWidth: '40%',
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#f97316' },
            { offset: 1, color: '#a855f7' }
          ]
        }
      },
      emphasis: {
        itemStyle: { shadowBlur: 15, shadowColor: 'rgba(249, 115, 22, 0.4)' }
      }
    }
  ]
}));
</script>

<style scoped lang="scss">
.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.bg-purple-500_20 {
  background: rgba(168, 85, 247, 0.15);
}
.bg-orange-500_20 {
  background: rgba(249, 115, 22, 0.15);
}
.bg-pink-500_20 {
  background: rgba(236, 72, 153, 0.15);
}

.hover-translate-y {
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
}

.premium-table {
  :deep(.el-table) {
    background: transparent !important;
    --el-table-bg-color: transparent;
    --el-table-tr-bg-color: transparent;
    --el-table-header-bg-color: rgba(255, 255, 255, 0.02);
    --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.05);

    th.el-table__cell {
      background: rgba(168, 85, 247, 0.05) !important;
      color: var(--text-secondary);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    td.el-table__cell {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
      padding: 16px 0;
      color: white;
    }

    .cell {
      padding: 0 16px;
    }
  }
}
</style>
