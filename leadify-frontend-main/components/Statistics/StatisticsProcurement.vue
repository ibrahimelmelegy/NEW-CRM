<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-10
    .header-content
      .page-title.mb-2 {{ $t('procurement.statistics.title') }}
      .subtitle.text-muted {{ $t('procurement.statistics.subtitle') }}

  //- KPI Cards
  .grid.grid-cols-1.md_grid-cols-2.lg_grid-cols-3.gap-8.mb-10
    .stat-card-primary
      .flex.items-center.justify-between
        div
          .stat-label {{ $t('procurement.statistics.totalPOs') }}
          .stat-value {{ stats.kpi.totalPos }}
          .stat-sublabel {{ $t('procurement.statistics.lifetimeVolume') }}
        .icon-box
          Icon(name="ph:shopping-cart-bold")

    .stat-card-warning
      .flex.items-center.justify-between
        div
          .stat-label {{ $t('procurement.statistics.totalExpenditure') }}
          .stat-value {{ formatCurrency(stats.kpi.totalSpend) }}
          .stat-sublabel {{ $t('procurement.statistics.totalCommittedSpend') }}
        .icon-box
          Icon(name="ph:currency-circle-dollar-bold")

    .stat-card-danger
      .flex.items-center.justify-between
        div
          .stat-label {{ $t('procurement.statistics.pendingQueue') }}
          .stat-value {{ stats.kpi.pendingCount }}
          .stat-sublabel {{ $t('procurement.statistics.needsAttention') }}
        .icon-box
          Icon(name="ph:clock-countdown-bold")

  //- Charts
  .grid.grid-cols-1.lg_grid-cols-2.gap-10.mb-10
    .chart-card
      .chart-header
        Icon(name="ph:chart-pie-slice-bold")
        .chart-title {{ $t('procurement.statistics.topSuppliers') }}
      client-only
        v-chart(:option="vendorChartOption", style="height: 350px", autoresize)

    .chart-card
      .chart-header
        Icon(name="ph:chart-line-up-bold")
        .chart-title {{ $t('procurement.statistics.procurementTrend') }}
      client-only
        v-chart(:option="monthlyChartOption", style="height: 350px", autoresize)

  //- Recent Transactions Table
  .premium-table.p-8
      .chart-header
        Icon(name="ph:list-dashes-bold")
        .chart-title {{ $t('procurement.statistics.recentTransactions') }}

      el-table(:data="stats.recentTransactions" style="width: 100%")
        el-table-column(prop="poNumber" :label="$t('procurement.statistics.poNumber')" width="180")
          template(#default="{row}")
             span.font-bold {{ row.poNumber }}
        el-table-column(:label="$t('procurement.statistics.vendor')" width="250")
          template(#default="{row}")
             .flex.items-center.gap-3
               .vendor-avatar
                  | {{ row.Vendor?.name?.charAt(0) || '?' }}
               span {{ row.Vendor?.name || 'Unknown' }}
        el-table-column(prop="totalAmount" :label="$t('procurement.statistics.amount')")
           template(#default="{row}")
              span.font-mono {{ formatCurrency(row.totalAmount) }}
        el-table-column(prop="status" :label="$t('procurement.statistics.status')")
           template(#default="{row}")
              el-tag(:type="getStatusType(row.status)" size="small") {{ row.status }}
        el-table-column(prop="createdAt" :label="$t('procurement.statistics.date')")
           template(#default="{row}")
              span.text-muted {{ new Date(row.createdAt).toLocaleDateString() }}

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
    // Failed to fetch statistics - silently handle
  } finally {
    loading.value = false;
  }
});

// Helpers
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(value);
};

const getStatusType = (status: string) => {
  const map: any = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'danger',
    Draft: 'info'
  };
  return map[status] || 'info';
};

// Get current theme colors
const isDark = ref(true);
if (process.client) {
  isDark.value = document.documentElement.classList.contains('dark-mode');
}

// Chart Options (Computed to react to data changes)
const vendorChartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    backgroundColor: isDark.value ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: isDark.value ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    textStyle: {
      color: isDark.value ? '#FFFFFF' : '#242424',
      fontSize: 14,
      fontWeight: 500
    }
  },
  legend: {
    bottom: '0',
    left: 'center',
    textStyle: {
      color: isDark.value ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      fontSize: 12
    }
  },
  series: [
    {
      name: 'Spending',
      type: 'pie',
      radius: ['50%', '80%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 15,
        borderColor: isDark.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 18,
          fontWeight: 'bold',
          color: isDark.value ? '#FFFFFF' : '#242424'
        },
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0, 120, 212, 0.4)'
        }
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
  tooltip: {
    trigger: 'axis',
    backgroundColor: isDark.value ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: isDark.value ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    textStyle: {
      color: isDark.value ? '#FFFFFF' : '#242424',
      fontSize: 14,
      fontWeight: 500
    }
  },
  xAxis: {
    type: 'category',
    data: stats.value.charts.monthlyTrend.map((d: any) => d.month),
    axisLine: {
      lineStyle: {
        color: isDark.value ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
      }
    },
    axisLabel: {
      color: isDark.value ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      fontSize: 12,
      fontWeight: 500
    }
  },
  yAxis: {
    type: 'value',
    splitLine: {
      lineStyle: {
        color: isDark.value ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        type: 'dashed'
      }
    },
    axisLabel: {
      color: isDark.value ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      fontSize: 12,
      fontWeight: 500
    }
  },
  series: [
    {
      data: stats.value.charts.monthlyTrend.map((d: any) => d.value),
      type: 'bar',
      barWidth: '50%',
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#0078D4' },
            { offset: 1, color: '#106EBE' }
          ]
        }
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 15,
          shadowColor: 'rgba(0, 120, 212, 0.5)'
        }
      }
    }
  ]
}));
</script>

<style scoped lang="scss">
.page-title {
  font-size: var(--font-size-700);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: var(--font-size-200);
  color: var(--color-text-secondary);
}

.vendor-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-circular);
  background: var(--color-primary);
  opacity: 0.15;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-100);
}
</style>
