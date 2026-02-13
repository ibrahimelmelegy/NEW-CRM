<template lang="pug">
.report-builder-page.p-8
  .flex.justify-between.items-start.mb-8
    div
      h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.title') }}
      p(style="color: var(--text-muted)") {{ $t('reportBuilder.subtitle') }}
    .flex.gap-3
      el-button(@click="loadSaved" :loading="loadingSaved")
        Icon(name="ph:folder-open" size="16" aria-hidden="true")
        span.ml-2 {{ $t('reportBuilder.savedReports') }}

  .grid.grid-cols-1.gap-6(class="lg:grid-cols-3")
    //- Config Panel
    .glass-card.p-6(class="lg:col-span-1")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('reportBuilder.configuration') }}

      .space-y-5
        .form-group
          label.block.text-sm.font-medium.mb-2 {{ $t('reportBuilder.entityType') }}
          el-select(v-model="config.entityType" class="w-full" @change="onEntityChange")
            el-option(value="LEAD" :label="$t('navigation.leads')")
            el-option(value="DEAL" :label="$t('navigation.deals')")
            el-option(value="OPPORTUNITY" :label="$t('navigation.opportunities')")
            el-option(value="CLIENT" :label="$t('navigation.clients')")

        .form-group
          label.block.text-sm.font-medium.mb-2 {{ $t('reportBuilder.columns') }}
          el-checkbox-group(v-model="config.columns")
            el-checkbox(v-for="col in availableColumns" :key="col" :value="col" :label="col" class="mb-1")

        .form-group
          label.block.text-sm.font-medium.mb-2 {{ $t('reportBuilder.groupBy') }}
          el-select(v-model="config.groupBy" clearable class="w-full" :placeholder="$t('reportBuilder.none')")
            el-option(v-for="col in availableColumns" :key="col" :value="col" :label="col")

        .form-group
          label.block.text-sm.font-medium.mb-2 {{ $t('reportBuilder.chartType') }}
          el-select(v-model="config.chartType" clearable class="w-full")
            el-option(value="bar" :label="$t('reportBuilder.barChart')")
            el-option(value="pie" :label="$t('reportBuilder.pieChart')")
            el-option(value="line" :label="$t('reportBuilder.lineChart')")

        .form-group
          label.block.text-sm.font-medium.mb-2 {{ $t('reportBuilder.filters') }}
          .space-y-2
            .flex.items-center.gap-2(v-for="(filter, i) in config.filters" :key="i")
              el-select(v-model="filter.field" size="small" class="w-28")
                el-option(v-for="col in availableColumns" :key="col" :value="col" :label="col")
              el-select(v-model="filter.operator" size="small" class="w-28")
                el-option(v-for="op in FILTER_OPERATORS" :key="op.value" :value="op.value" :label="op.label")
              el-input(v-model="filter.value" size="small" class="flex-1")
              el-button(link @click="config.filters.splice(i, 1)" size="small")
                Icon(name="ph:x" size="14" aria-label="Remove filter")
          el-button(size="small" @click="config.filters.push({ field: '', operator: 'equals', value: '' })") + {{ $t('reportBuilder.addFilter') }}

        .flex.gap-2
          el-button(type="primary" :loading="executing" @click="runReport" class="flex-1 !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('reportBuilder.run') }}
          el-button(@click="exportCSV" :loading="exporting") {{ $t('reportBuilder.exportCSV') }}

    //- Results Panel
    .glass-card.p-6(class="lg:col-span-2")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('reportBuilder.results') }}

      .text-center.py-8(v-if="!results.length && !executing")
        Icon(name="ph:chart-bar" size="48" style="color: var(--text-muted)" aria-hidden="true")
        p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('reportBuilder.configureAndRun') }}

      template(v-else)
        //- Chart
        .mb-6(v-if="config.chartType && config.groupBy && results.length")
          ClientOnly
            VChart(:option="chartOption" autoresize style="height: 300px")

        //- Table
        el-table(:data="results" style="width: 100%" max-height="500" v-loading="executing")
          el-table-column(
            v-for="col in displayColumns"
            :key="col"
            :prop="col"
            :label="col"
            sortable
            min-width="120"
          )

      //- Save Report
      .flex.gap-2.mt-6(v-if="results.length")
        el-input(v-model="reportName" :placeholder="$t('reportBuilder.reportName')" class="flex-1")
        el-button(type="primary" :loading="savingReport" @click="saveReport" :disabled="!reportName" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('reportBuilder.save') }}

  //- Saved Reports Drawer
  el-drawer(v-model="showSaved" :title="$t('reportBuilder.savedReports')" size="400px")
    .space-y-3
      .saved-item.p-4.rounded-xl.cursor-pointer(
        v-for="r in savedReports"
        :key="r.id"
        style="background: var(--bg-input); border: 1px solid var(--border-default)"
        @click="loadReport(r)"
      )
        .flex.justify-between.items-start
          div
            p.font-bold(style="color: var(--text-primary)") {{ r.name }}
            .flex.gap-2.mt-1
              el-tag(size="small" effect="plain") {{ r.entityType }}
              span.text-xs(style="color: var(--text-muted)") {{ new Date(r.createdAt).toLocaleDateString() }}
          el-button(link @click.stop="deleteReport(r.id)")
            Icon(name="ph:trash" size="16" class="text-red-400" aria-label="Delete")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import type { SavedReport, ReportConfig } from '~/composables/useReportBuilder';
import {
  ENTITY_COLUMNS, FILTER_OPERATORS,
  fetchSavedReports, createSavedReport, deleteSavedReport,
  executeReport, exportReportCSV
} from '~/composables/useReportBuilder';

use([CanvasRenderer, BarChart, PieChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

definePageMeta({ title: 'Report Builder', middleware: 'auth' });

const config = ref<ReportConfig>({
  entityType: 'LEAD',
  columns: ['name', 'email', 'status', 'createdAt'],
  filters: [],
  groupBy: '',
  chartType: '',
  sortBy: 'createdAt',
  sortOrder: 'DESC'
});

const results = ref<any[]>([]);
const savedReports = ref<SavedReport[]>([]);
const executing = ref(false);
const exporting = ref(false);
const loadingSaved = ref(false);
const savingReport = ref(false);
const showSaved = ref(false);
const reportName = ref('');

const availableColumns = computed(() => ENTITY_COLUMNS[config.value.entityType] || []);

const displayColumns = computed(() => {
  if (config.value.groupBy) return [config.value.groupBy, 'count'];
  return config.value.columns.length ? config.value.columns : availableColumns.value;
});

const chartOption = computed(() => {
  if (!config.value.groupBy || !results.value.length) return {};

  const labels = results.value.map((r: any) => r[config.value.groupBy!] || 'N/A');
  const values = results.value.map((r: any) => Number(r.count) || 0);

  if (config.value.chartType === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: labels.map((l: string, i: number) => ({ name: l, value: values[i] }))
      }]
    };
  }

  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value' },
    series: [{
      type: config.value.chartType || 'bar',
      data: values,
      itemStyle: { color: '#7849ff' }
    }]
  };
});

function onEntityChange() {
  config.value.columns = availableColumns.value.slice(0, 4);
  config.value.groupBy = '';
  config.value.filters = [];
  results.value = [];
}

async function runReport() {
  executing.value = true;
  try {
    results.value = await executeReport(config.value);
  } finally {
    executing.value = false;
  }
}

async function exportCSV() {
  exporting.value = true;
  try {
    const csv = await exportReportCSV(config.value);
    if (csv) {
      const blob = new Blob([csv as string], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${config.value.entityType.toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } finally {
    exporting.value = false;
  }
}

async function loadSaved() {
  loadingSaved.value = true;
  try {
    savedReports.value = await fetchSavedReports();
    showSaved.value = true;
  } finally {
    loadingSaved.value = false;
  }
}

function loadReport(report: SavedReport) {
  config.value = { ...report.config };
  reportName.value = report.name;
  showSaved.value = false;
  runReport();
}

async function saveReport() {
  if (!reportName.value) return;
  savingReport.value = true;
  try {
    await createSavedReport({
      name: reportName.value,
      entityType: config.value.entityType,
      config: config.value
    });
    ElNotification({ type: 'success', title: 'Saved', message: 'Report saved' });
    reportName.value = '';
  } finally {
    savingReport.value = false;
  }
}

async function deleteReport(id: string) {
  await deleteSavedReport(id);
  savedReports.value = savedReports.value.filter(r => r.id !== id);
  ElNotification({ type: 'success', title: 'Deleted', message: 'Report removed' });
}
</script>

<style lang="scss" scoped>
.report-builder-page {
  animation: fadeIn 0.4s ease-out;
}
.saved-item:hover {
  border-color: #7849ff !important;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
