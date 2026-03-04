<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            {{ $t('customerSuccess.title', 'Customer Success') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">
            {{ $t('customerSuccess.subtitle', 'Monitor client health, predict churn, and drive retention.') }}
          </p>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="loading" @click="refreshData">
          <Icon name="ph:arrows-clockwise-bold" class="w-4 h-4 mr-2" />
          {{ $t('common.refresh', 'Refresh') }}
        </el-button>
      </div>
    </div>

    <!-- KPI Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ dashboard.summary.totalClients }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Clients</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center border-l-2 border-emerald-500">
        <div class="text-2xl font-bold text-emerald-400">{{ dashboard.summary.healthy }}</div>
        <div class="text-xs text-slate-500 mt-1">Healthy</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center border-l-2 border-amber-500">
        <div class="text-2xl font-bold text-amber-400">{{ dashboard.summary.atRisk }}</div>
        <div class="text-xs text-slate-500 mt-1">At Risk</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center border-l-2 border-red-500">
        <div class="text-2xl font-bold text-red-400">{{ dashboard.summary.critical }}</div>
        <div class="text-xs text-slate-500 mt-1">Critical</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ dashboard.summary.avgHealthScore }}%</div>
        <div class="text-xs text-slate-500 mt-1">Avg Health</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ formatRevenue(dashboard.summary.totalRevenue) }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Revenue</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-teal-400">{{ dashboard.summary.avgNps }}/10</div>
        <div class="text-xs text-slate-500 mt-1">Avg NPS</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Health Distribution Pie -->
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4">Health Distribution</h3>
        <div ref="healthChartRef" class="w-full h-64"></div>
      </div>

      <!-- Revenue Trend -->
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4">Client Revenue Trend</h3>
        <div ref="revenueChartRef" class="w-full h-64"></div>
      </div>

      <!-- Engagement Trend -->
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4">Engagement Trend</h3>
        <div ref="engagementChartRef" class="w-full h-64"></div>
      </div>
    </div>

    <!-- At-Risk Clients Table -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-slate-200">At-Risk Clients</h3>
        <el-tag type="danger" effect="dark" size="small">{{ dashboard.atRiskClients.length }} clients need attention</el-tag>
      </div>
      <el-table :data="dashboard.atRiskClients" class="glass-table" style="width: 100%" stripe>
        <el-table-column prop="clientName" label="Client" min-width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                {{ row.clientName?.charAt(0) }}
              </div>
              <div>
                <div class="text-sm font-medium text-slate-200">{{ row.clientName }}</div>
                <div class="text-xs text-slate-500">{{ row.companyName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Health Score" width="150" align="center">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-progress
                :percentage="row.overallScore"
                :stroke-width="6"
                :color="getScoreColor(row.overallScore)"
                :show-text="false"
                class="flex-1"
              />
              <span class="text-sm font-medium" :style="{ color: getScoreColor(row.overallScore) }">{{ row.overallScore }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Risk Level" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.riskLevel === 'CRITICAL' ? 'danger' : 'warning'" effect="dark" size="small">
              {{ row.riskLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Last Activity" width="130" align="center">
          <template #default="{ row }">
            <span class="text-sm text-slate-400">
              {{ row.daysSinceLastActivity < 999 ? `${row.daysSinceLastActivity}d ago` : 'Never' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Revenue" width="120" align="right">
          <template #default="{ row }">
            <span class="text-sm font-medium text-slate-300">{{ formatRevenue(row.totalRevenue) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Active Deals" width="110" align="center">
          <template #default="{ row }">
            <span class="text-sm text-slate-400">{{ row.activeDeals }}</span>
          </template>
        </el-table-column>
        <el-table-column label="NPS" width="80" align="center">
          <template #default="{ row }">
            <span class="text-sm font-medium" :class="row.npsScore >= 7 ? 'text-emerald-400' : row.npsScore >= 5 ? 'text-amber-400' : 'text-red-400'">
              {{ row.npsScore }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Top Healthy Clients Table -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-slate-200">Top Performing Clients</h3>
        <el-tag type="success" effect="dark" size="small">Top 10 by health score</el-tag>
      </div>
      <el-table :data="dashboard.topClients" class="glass-table" style="width: 100%" stripe>
        <el-table-column prop="clientName" label="Client" min-width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-xs font-medium text-emerald-300">
                {{ row.clientName?.charAt(0) }}
              </div>
              <div>
                <div class="text-sm font-medium text-slate-200">{{ row.clientName }}</div>
                <div class="text-xs text-slate-500">{{ row.companyName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Health Score" width="150" align="center">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-progress
                :percentage="row.overallScore"
                :stroke-width="6"
                :color="getScoreColor(row.overallScore)"
                :show-text="false"
                class="flex-1"
              />
              <span class="text-sm font-medium" :style="{ color: getScoreColor(row.overallScore) }">{{ row.overallScore }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Engagement" width="120" align="center">
          <template #default="{ row }">
            <span class="text-sm text-slate-300">{{ row.engagementScore }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="Revenue" width="120" align="right">
          <template #default="{ row }">
            <span class="text-sm font-medium text-emerald-400">{{ formatRevenue(row.totalRevenue) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Active Deals" width="110" align="center">
          <template #default="{ row }">
            <span class="text-sm text-slate-400">{{ row.activeDeals }}</span>
          </template>
        </el-table-column>
        <el-table-column label="NPS" width="80" align="center">
          <template #default="{ row }">
            <span class="text-sm font-medium text-emerald-400">{{ row.npsScore }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts/core';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const loading = ref(false);
const healthChartRef = ref<HTMLElement>();
const revenueChartRef = ref<HTMLElement>();
const engagementChartRef = ref<HTMLElement>();

const emptyDashboard = {
  summary: { totalClients: 0, healthy: 0, atRisk: 0, critical: 0, avgHealthScore: 0, totalRevenue: 0, avgNps: 0 },
  healthDistribution: [],
  topClients: [],
  atRiskClients: [],
  revenueByMonth: [],
  engagementTrend: []
};

const dashboard = ref<any>({ ...emptyDashboard });

const formatRevenue = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toString();
};

const getScoreColor = (score: number) => {
  if (score >= 60) return '#10B981';
  if (score >= 30) return '#F59E0B';
  return '#EF4444';
};

const fetchDashboard = async () => {
  loading.value = true;
  try {
    const res: any = await useApiFetch('customer-success/dashboard', 'GET', {}, true);
    if (res?.success && res.body) {
      // Merge with defaults to guarantee all required fields exist
      dashboard.value = { ...emptyDashboard, ...res.body, summary: { ...emptyDashboard.summary, ...(res.body.summary || {}) } };
      await nextTick();
      renderCharts();
    }
  } catch {
    // Silently handle - dashboard will show empty state
  }
  loading.value = false;
};

const refreshData = () => fetchDashboard();

const renderCharts = () => {
  // Health Distribution Pie Chart
  if (healthChartRef.value) {
    const chart = echarts.init(healthChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: true, position: 'outside', color: '#94a3b8', fontSize: 12 },
          data: dashboard.value.healthDistribution.map((d: any) => ({
            name: d.name,
            value: d.value,
            itemStyle: { color: d.color }
          }))
        }
      ]
    });
  }

  // Revenue Trend Bar Chart
  if (revenueChartRef.value) {
    const chart = echarts.init(revenueChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dashboard.value.revenueByMonth.map((d: any) => d.month),
        axisLabel: { color: '#64748b' },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#64748b', formatter: (v: number) => (v >= 1000 ? `${v / 1000}K` : v) },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [
        {
          type: 'bar',
          data: dashboard.value.revenueByMonth.map((d: any) => d.revenue),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#10B981' },
              { offset: 1, color: '#065F46' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: '60%'
        }
      ]
    });
  }

  // Engagement Trend Line Chart
  if (engagementChartRef.value) {
    const chart = echarts.init(engagementChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dashboard.value.engagementTrend.map((d: any) => d.month),
        axisLabel: { color: '#64748b' },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: [
        {
          type: 'line',
          data: dashboard.value.engagementTrend.map((d: any) => d.activities),
          smooth: true,
          lineStyle: { color: '#6366F1', width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(99,102,241,0.3)' },
              { offset: 1, color: 'rgba(99,102,241,0.02)' }
            ])
          },
          itemStyle: { color: '#6366F1' }
        }
      ]
    });
  }
};

onMounted(() => {
  fetchDashboard();
});
</script>
