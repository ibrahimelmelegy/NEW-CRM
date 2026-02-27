<template lang="pug">
div
  //- Header
  ModuleHeader(
    :title="report?.name || $t('reportsPage.reportView')"
    :breadcrumbs="[{ label: $t('reports.title'), to: '/reports' }, { label: report?.name || '' }]"
  )
    template(#actions)
      el-button(size="large" :loading="running" @click="runReport" type="primary" class="!rounded-2xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
        Icon(name="ph:play-bold" size="16")
        span.ml-1 {{ $t('reportsPage.runReport') }}
      ExportButton(:filename="report?.name || 'report'" @export="handleExport")

  .grid.grid-cols-1.gap-6(class="lg:grid-cols-4")
    //- Sidebar: Filters & Config
    .glass-card.p-6.animate-entrance(class="lg:col-span-1")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('reportsPage.reportConfig') }}

      .space-y-4
        .form-group
          label.block.text-xs.font-medium.mb-1.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('reportBuilder.entityType') }}
          el-tag(size="default" effect="plain") {{ report?.entityType || '--' }}

        .form-group(v-if="report?.config?.columns?.length")
          label.block.text-xs.font-medium.mb-1.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('reportBuilder.columns') }}
          .flex.flex-wrap.gap-1
            el-tag(v-for="col in report.config.columns" :key="col" size="small" effect="plain") {{ col }}

        .form-group(v-if="report?.config?.groupBy")
          label.block.text-xs.font-medium.mb-1.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('reportBuilder.groupBy') }}
          el-tag(size="small" type="warning" effect="plain") {{ report.config.groupBy }}

        .form-group(v-if="report?.config?.chartType")
          label.block.text-xs.font-medium.mb-1.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('reportBuilder.chartType') }}
          el-tag(size="small" type="info" effect="plain") {{ report.config.chartType }}

      //- Filter Overrides
      .mt-6(v-if="report?.config?.filters?.length")
        h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)") {{ $t('reportsPage.filterOverrides') }}
        .space-y-2
          .flex.items-center.gap-2(v-for="(filter, i) in filterOverrides" :key="i")
            span.text-xs.font-medium.w-20.truncate {{ filter.field }}
            el-input(v-model="filter.value" size="small" class="flex-1" :placeholder="filter.field")
        el-button.mt-3(size="small" @click="runReport" :loading="running") {{ $t('reportsPage.applyFilters') }}

    //- Main Results Area
    .space-y-6(class="lg:col-span-3")
      //- Chart Visualization
      .glass-card.p-6.animate-entrance(v-if="report?.config?.chartType && report?.config?.groupBy && results.length" style="animation-delay: 0.05s")
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('reportsPage.chartVisualization') }}
        ClientOnly
          VChart(:option="chartOption" autoresize style="height: 350px")

      //- Results Table
      .glass-card.p-6.animate-entrance(style="animation-delay: 0.1s")
        .flex.items-center.justify-between.mb-4
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('reportBuilder.results') }}
          span.text-sm(v-if="results.length" style="color: var(--text-muted)") {{ results.length }} {{ $t('common.rows') }}

        el-table(:data="paginatedResults" v-loading="running" style="width: 100%" max-height="600")
          el-table-column(
            v-for="col in displayColumns"
            :key="col"
            :prop="col"
            :label="col"
            sortable
            min-width="140"
          )
          template(#empty)
            .text-center.py-12
              Icon(name="ph:chart-bar" size="48" style="color: var(--text-muted)")
              p.mt-2.text-sm(style="color: var(--text-muted)") {{ running ? $t('common.loading') : $t('reportsPage.runToSeeResults') }}

        .pagination.mt-5.flex.items-center.flex-wrap.gap-2(class="sm:justify-between justify-center" v-if="results.length > resultPageSize")
          span.text-xs(style="color: var(--text-muted)") {{ results.length }} {{ $t('common.entries') }}
          el-pagination(background style="direction:ltr" :pager-count="4" v-model:current-page="resultPage" :page-size="resultPageSize" layout="prev, pager, next" :total="results.length")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { fetchSavedReports, executeReport, exportReportBuilderCSV, type SavedReport, type ReportBuilderConfig } from '~/composables/useReportBuilder';

use([CanvasRenderer, BarChart, PieChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

definePageMeta({ middleware: 'permissions' });

const route = useRoute();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const report = ref<SavedReport | null>(null);
const results = ref<any[]>([]);
const running = ref(false);
const resultPage = ref(1);
const resultPageSize = 25;
const filterOverrides = ref<{ field: string; operator: string; value: any }[]>([]);

// Load report
onMounted(async () => {
  const reportId = route.params.id as string;
  const all = await fetchSavedReports();
  report.value = all.find((r: SavedReport) => r.id === reportId) || null;

  if (report.value?.config?.filters) {
    filterOverrides.value = report.value.config.filters.map(f => ({ ...f }));
  }

  if (report.value) {
    await runReport();
  }
});

const displayColumns = computed(() => {
  if (!report.value) return [];
  if (report.value.config.groupBy) return [report.value.config.groupBy, 'count'];
  return report.value.config.columns.length ? report.value.config.columns : [];
});

const paginatedResults = computed(() => {
  const start = (resultPage.value - 1) * resultPageSize;
  return results.value.slice(start, start + resultPageSize);
});

const chartOption = computed(() => {
  if (!report.value?.config?.groupBy || !results.value.length) return {};
  const config = report.value.config;
  const labels = results.value.map((r: any) => r[config.groupBy!] || 'N/A');
  const values = results.value.map((r: any) => Number(r.count) || 0);

  if (config.chartType === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      color: ['#7849FF', '#3B82F6', '#10B981', '#F97316', '#EF4444', '#A855F7', '#06B6D4'],
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          itemStyle: { borderRadius: 8, borderColor: 'transparent', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          data: labels.map((l: string, i: number) => ({ name: l, value: values[i] }))
        }
      ]
    };
  }

  return {
    tooltip: { trigger: 'axis' },
    grid: { top: 20, right: 20, bottom: 30, left: 40, containLabel: true },
    xAxis: { type: 'category', data: labels, axisLabel: { color: '#94A3B8' } },
    yAxis: { type: 'value', axisLabel: { color: '#64748B' }, splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.05)' } } },
    series: [
      {
        type: config.chartType || 'bar',
        data: values,
        itemStyle: { color: '#7849ff', borderRadius: [4, 4, 0, 0] }
      }
    ]
  };
});

async function runReport() {
  if (!report.value) return;
  running.value = true;
  resultPage.value = 1;
  try {
    const configWithOverrides: ReportBuilderConfig = {
      ...report.value.config,
      filters: filterOverrides.value.filter(f => f.field && f.value)
    };
    results.value = await executeReport(configWithOverrides);
  } catch (e: any) {
    ElNotification({ type: 'error', title: t('common.error'), message: e?.message || 'Failed to run report' });
  } finally {
    running.value = false;
  }
}

async function handleExport(format: string) {
  if (!report.value) return;
  try {
    const csv = await exportReportBuilderCSV(report.value.config);
    if (csv) {
      const mimeType = format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
      const blob = new Blob([csv as string], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.value.name}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (e: any) {
    ElNotification({ type: 'error', title: t('common.error'), message: e?.message || '' });
  }
}
</script>
