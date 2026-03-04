<template lang="pug">
.report-preview

  //- Loading state
  .text-center.py-16(v-if="loading")
    .inline-block.animate-spin.mb-4
      Icon(name="ph:circle-notch" size="40" style="color: #7849ff" aria-hidden="true")
    p.text-sm(style="color: var(--text-muted)") {{ $t('reportBuilder.generatingReport') }}

  //- Empty state
  .text-center.py-16(v-else-if="!data.length")
    .mx-auto.mb-4.flex.items-center.justify-center(
      style="width: 80px; height: 80px; border-radius: 20px; background: rgba(120, 73, 255, 0.08)"
    )
      Icon(name="ph:chart-bar" size="40" style="color: #7849ff" aria-hidden="true")
    p.text-lg.font-semibold.mb-1(style="color: var(--text-primary)") {{ $t('reportBuilder.noData') }}
    p.text-sm(style="color: var(--text-muted)") {{ $t('reportBuilder.configureAndRun') }}

  //- Results
  template(v-else)
    //- Header with record count and export buttons
    .flex.justify-between.items-center.mb-4
      .flex.items-center.gap-3
        .record-count.px-3.py-1.rounded-full.text-sm.font-medium(
          style="background: rgba(120, 73, 255, 0.1); color: #7849ff"
        )
          Icon(name="ph:database" size="14" class="mr-1" aria-hidden="true")
          span {{ totalCount }} {{ $t('reportBuilder.records') }}
      .flex.gap-2
        el-dropdown(trigger="click" @command="handleExport")
          el-button(size="small")
            Icon(name="ph:download" size="14" aria-hidden="true")
            span.ml-1 {{ $t('reportBuilder.export') }}
          template(#dropdown)
            el-dropdown-menu
              el-dropdown-item(command="csv")
                Icon(name="ph:file-csv" size="16" class="mr-2" aria-hidden="true")
                span CSV
              el-dropdown-item(command="excel")
                Icon(name="ph:file-xls" size="16" class="mr-2" aria-hidden="true")
                span Excel
              el-dropdown-item(command="pdf")
                Icon(name="ph:file-pdf" size="16" class="mr-2" aria-hidden="true")
                span PDF

    //- Chart visualization
    .chart-container.mb-6.rounded-xl.p-4(
      v-if="chartType && chartType !== 'table' && chartOption && Object.keys(chartOption).length > 0"
      style="background: var(--bg-input); border: 1px solid var(--glass-border-color)"
    )
      ClientOnly
        VChart(:option="chartOption" autoresize style="height: 320px; width: 100%")

    //- Data table
    .table-container
      el-table(
        :data="paginatedData"
        style="width: 100%"
        max-height="500"
        stripe
        :default-sort="{ prop: sortField, order: sortOrder }"
        @sort-change="handleSortChange"
      )
        el-table-column(
          v-for="col in displayColumns"
          :key="col.name"
          :prop="col.name"
          :label="col.label"
          sortable="custom"
          min-width="130"
        )
          template(#default="{ row }")
            span(v-if="col.type === 'date' && row[col.name]") {{ formatDate(row[col.name]) }}
            span(v-else-if="col.type === 'number' && row[col.name] !== null") {{ formatNumber(row[col.name]) }}
            el-tag(
              v-else-if="col.type === 'select'"
              size="small"
              effect="plain"
            ) {{ row[col.name] || '-' }}
            span(v-else) {{ row[col.name] ?? '-' }}

      //- Summary row
      .summary-row.flex.gap-4.mt-3.p-3.rounded-lg(
        v-if="hasSummary"
        style="background: rgba(120, 73, 255, 0.05); border: 1px solid rgba(120, 73, 255, 0.15)"
      )
        .summary-item(
          v-for="(stats, field) in summary"
          :key="field"
        )
          .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ getFieldLabel(field) }}
          .flex.gap-3
            .text-xs
              span.font-medium(style="color: var(--text-muted)") {{ $t('reportBuilder.sum') }}:&nbsp;
              span.font-bold(style="color: var(--text-primary)") {{ formatNumber(stats.sum) }}
            .text-xs
              span.font-medium(style="color: var(--text-muted)") {{ $t('reportBuilder.avg') }}:&nbsp;
              span.font-bold(style="color: var(--text-primary)") {{ formatNumber(stats.avg) }}

    //- Pagination
    .flex.justify-center.mt-4(v-if="data.length > pageSize")
      el-pagination(
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="data.length"
        layout="prev, pager, next"
        background
        small
      )
</template>

<script setup lang="ts">
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import type { FieldDefinition, ChartConfig, ReportSummary } from '~/composables/useReportBuilderPro';
import { MODULE_DEFINITIONS } from '~/composables/useReportBuilderPro';

use([CanvasRenderer, BarChart, PieChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

interface ColumnDef {
  name: string;
  label: string;
  type: string;
}

interface Props {
  data: any[];
  columns: ColumnDef[];
  chartType: string;
  chartOption: Record<string, any>;
  loading: boolean;
  summary?: ReportSummary;
  totalCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  summary: () => ({}),
  totalCount: 0
});

const emit = defineEmits<{
  export: [format: string];
  sort: [payload: { field: string; order: string }];
}>();

const currentPage = ref(1);
const pageSize = 50;
const sortField = ref('');
const sortOrder = ref('');

const displayColumns = computed(() => {
  return props.columns;
});

const totalCount = computed(() => {
  return props.totalCount || props.data.length;
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return props.data.slice(start, start + pageSize);
});

const hasSummary = computed(() => {
  return Object.keys(props.summary).length > 0;
});

const summary = computed(() => props.summary);

function handleExport(format: string) {
  emit('export', format);
}

function handleSortChange(payload: any) {
  if (payload.prop && payload.order) {
    sortField.value = payload.prop;
    sortOrder.value = payload.order === 'ascending' ? 'ASC' : 'DESC';
    emit('sort', { field: sortField.value, order: sortOrder.value });
  }
}

function getFieldLabel(fieldName: string): string {
  for (const mod of Object.values(MODULE_DEFINITIONS)) {
    const field = mod.fields.find(f => f.name === fieldName);
    if (field) return field.label;
  }
  return fieldName;
}

function formatDate(value: any): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

function formatNumber(value: any): string {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
</script>

<style lang="scss" scoped>
.chart-container {
  transition: all 0.3s ease;
}

.summary-item + .summary-item {
  padding-left: 16px;
  border-left: 1px solid rgba(120, 73, 255, 0.2);
}

.record-count {
  display: inline-flex;
  align-items: center;
}
</style>
