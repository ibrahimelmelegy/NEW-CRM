<template lang="pug">
.p-6.animate-entrance(v-loading="loading")
  .flex.items-center.justify-between.mb-10
    .header-content
      .title.font-bold.text-3xl.mb-2.text-gradient {{ $t('churn.title') }}
      .subtitle.text-muted.text-sm.tracking-wide {{ $t('churn.subtitle') }}

  template(v-if="churnData")
    //- KPI Cards
    .grid.grid-cols-1.md.grid-cols-4.gap-6.mb-10
      .glass-card.p-6.relative.overflow-hidden.hover-translate-y
        .flex.items-center.justify-between
          div
            .text-muted.text-xs.uppercase.font-black.tracking-widest.mb-2 {{ $t('churn.highRisk') }}
            .text-4xl.font-black.text-red-400 {{ churnData.summary.highRisk }}
            .text-xs.text-red-400.mt-2 30+ {{ $t('churn.daysNoContact') }}
          .icon-box.bg-red-500_20.p-4.rounded-2xl
            Icon(name="ph:warning-bold" class="text-3xl text-red-400")

      .glass-card.p-6.relative.overflow-hidden.hover-translate-y
        .flex.items-center.justify-between
          div
            .text-muted.text-xs.uppercase.font-black.tracking-widest.mb-2 {{ $t('churn.mediumRisk') }}
            .text-4xl.font-black.text-amber-400 {{ churnData.summary.mediumRisk }}
            .text-xs.text-amber-400.mt-2 15-30 {{ $t('churn.daysNoContact') }}
          .icon-box.bg-amber-500_20.p-4.rounded-2xl
            Icon(name="ph:warning-circle-bold" class="text-3xl text-amber-400")

      .glass-card.p-6.relative.overflow-hidden.hover-translate-y
        .flex.items-center.justify-between
          div
            .text-muted.text-xs.uppercase.font-black.tracking-widest.mb-2 {{ $t('churn.lowRisk') }}
            .text-4xl.font-black.text-blue-400 {{ churnData.summary.lowRisk }}
            .text-xs.text-blue-400.mt-2 7-15 {{ $t('churn.daysNoContact') }}
          .icon-box.bg-blue-500_20.p-4.rounded-2xl
            Icon(name="ph:info-bold" class="text-3xl text-blue-400")

      .glass-card.p-6.relative.overflow-hidden.hover-translate-y
        .flex.items-center.justify-between
          div
            .text-muted.text-xs.uppercase.font-black.tracking-widest.mb-2 {{ $t('churn.totalAtRisk') }}
            .text-4xl.font-black.text-gradient {{ churnData.summary.totalAtRisk }}
            .text-xs.text-purple-400.mt-2 {{ $t('churn.leadsNeedAttention') }}
          .icon-box.bg-purple-500_20.p-4.rounded-2xl
            Icon(name="ph:users-bold" class="text-3xl text-purple-400")

    //- Charts Row
    .grid.grid-cols-1.lg.grid-cols-2.gap-10.mb-10
      .glass-card.p-8
        .flex.items-center.gap-4.mb-8
          Icon(name="ph:chart-pie-slice-bold" class="text-purple-400 text-xl")
          span.font-bold.text-muted.uppercase.tracking-widest.text-xs {{ $t('churn.riskDistribution') }}
        client-only
          v-chart(:option="riskPieOption" style="height: 350px" autoresize)

      .glass-card.p-8
        .flex.items-center.gap-4.mb-8
          Icon(name="ph:chart-bar-bold" class="text-orange-400 text-xl")
          span.font-bold.text-muted.uppercase.tracking-widest.text-xs {{ $t('churn.riskBreakdown') }}
        client-only
          v-chart(:option="riskBarOption" style="height: 350px" autoresize)

    //- At-Risk Leads Table
    .glass-card.p-8
      .flex.items-center.gap-4.mb-6
        Icon(name="ph:list-dashes-bold" class="text-red-400 text-xl")
        span.font-bold.text-muted.uppercase.tracking-widest.text-xs {{ $t('churn.atRiskLeads') }}

      el-table(:data="churnData.atRiskLeads" style="width: 100%" class="premium-table" @row-click="goToLead")
        el-table-column(prop="name" :label="$t('churn.leadName')" width="200")
          template(#default="{row}")
            span.font-bold.text-white.cursor-pointer {{ row.name }}
        el-table-column(prop="email" :label="$t('churn.email')" width="220")
          template(#default="{row}")
            span.text-gray-300 {{ row.email || '-' }}
        el-table-column(prop="riskLevel" :label="$t('churn.riskLevel')" width="140")
          template(#default="{row}")
            el-tag(:type="getRiskTagType(row.riskLevel)" effect="dark" size="small") {{ $t(`churn.${row.riskLevel.toLowerCase()}Risk`) }}
        el-table-column(prop="riskScore" :label="$t('churn.riskScore')" width="180")
          template(#default="{row}")
            .flex.items-center.gap-3
              el-progress(:percentage="row.riskScore" :color="getScoreColor(row.riskScore)" :stroke-width="8" :show-text="false" style="width: 100px")
              span.text-xs.font-mono.text-gray-400 {{ row.riskScore }}%
        el-table-column(prop="daysSinceLastContact" :label="$t('churn.daysSinceContact')" width="150")
          template(#default="{row}")
            span.text-xs.text-muted {{ row.daysSinceLastContact === 999 ? $t('churn.never') : `${row.daysSinceLastContact} ${$t('churn.days')}` }}
        el-table-column(prop="status" :label="$t('churn.status')")
          template(#default="{row}")
            span.px-3.py-1.rounded-full.text-xs.font-bold(:class="getStatusClass(row.status)") {{ row.status }}

  //- Empty State
  .text-center.py-20(v-else-if="!loading")
    Icon(name="ph:chart-line-down-bold" class="text-6xl text-gray-600 mb-4")
    p.text-muted {{ $t('churn.noData') }}
</template>

<script setup lang="ts">
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { getChurnDashboardData, getRiskTagType } from '@/composables/useChurnDashboard';
import type { ChurnDashboardData } from '@/composables/useChurnDashboard';

use([CanvasRenderer, PieChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const router = useRouter();
const loading = ref(true);
const churnData = ref<ChurnDashboardData | null>(null);

onMounted(async () => {
  loading.value = true;
  try {
    churnData.value = await getChurnDashboardData();
  } finally {
    loading.value = false;
  }
});

const goToLead = (row: any) => {
  router.push(`/sales/leads/${row.id}`);
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#EF4444';
  if (score >= 50) return '#F59E0B';
  return '#3B82F6';
};

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    NEW: 'bg-blue-500/20 text-blue-400',
    CONTACTED: 'bg-green-500/20 text-green-400',
    QUALIFIED: 'bg-purple-500/20 text-purple-400',
    LOST: 'bg-red-500/20 text-red-400',
    UNQUALIFIED: 'bg-gray-500/20 text-gray-400'
  };
  return map[status] || 'bg-gray-500/20 text-gray-400';
};

// Pie chart for risk distribution
const riskPieOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(30, 18, 48, 0.9)',
    borderWidth: 0,
    textStyle: { color: '#fff' },
    formatter: '{b}: {c} ({d}%)'
  },
  legend: {
    bottom: '0',
    left: 'center',
    textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 }
  },
  color: ['#EF4444', '#F59E0B', '#3B82F6'],
  series: [
    {
      name: 'Risk Distribution',
      type: 'pie',
      radius: ['50%', '80%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 12,
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: '16', fontWeight: 'bold', color: '#fff' },
        itemStyle: { shadowBlur: 20, shadowColor: 'rgba(239, 68, 68, 0.5)' }
      },
      data: churnData.value?.riskDistribution?.length
        ? churnData.value.riskDistribution
        : [{ value: 0, name: 'No Data' }]
    }
  ]
}));

// Bar chart for risk breakdown
const riskBarOption = computed(() => ({
  backgroundColor: 'transparent',
  grid: { top: '10%', left: '3%', right: '4%', bottom: '15%', containLabel: true },
  xAxis: {
    type: 'category',
    data: churnData.value?.riskDistribution?.map(d => d.name) || [],
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' as const } },
    axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10 }
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(30, 18, 48, 0.9)',
    borderWidth: 0,
    textStyle: { color: '#fff' }
  },
  series: [
    {
      data: churnData.value?.riskDistribution?.map((d, i) => ({
        value: d.value,
        itemStyle: {
          color: ['#EF4444', '#F59E0B', '#3B82F6'][i],
          borderRadius: [8, 8, 0, 0]
        }
      })) || [],
      type: 'bar',
      barWidth: '45%',
      emphasis: {
        itemStyle: { shadowBlur: 15, shadowColor: 'rgba(239, 68, 68, 0.4)' }
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

.bg-red-500_20 { background: rgba(239, 68, 68, 0.15); }
.bg-amber-500_20 { background: rgba(245, 158, 11, 0.15); }
.bg-blue-500_20 { background: rgba(59, 130, 246, 0.15); }
.bg-purple-500_20 { background: rgba(168, 85, 247, 0.15); }

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
      background: rgba(239, 68, 68, 0.05) !important;
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

    .cell { padding: 0 16px; }

    tr { cursor: pointer; }
  }
}
</style>
