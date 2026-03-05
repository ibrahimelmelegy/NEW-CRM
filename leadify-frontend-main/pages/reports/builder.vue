<template lang="pug">
.report-builder-page.p-8
  //- Page Header
  .flex.justify-between.items-start.mb-6
    div
      h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.title') }}
      p(style="color: var(--text-muted)") {{ $t('reportBuilder.subtitle') }}
    .flex.gap-3
      el-button(@click="openSavedReports" :loading="loadingSaved")
        Icon(name="ph:folder-open" size="16" aria-hidden="true")
        span.ml-2 {{ $t('reportBuilder.savedReports') }}
      el-button(
        type="primary"
        :loading="pro.loading.value"
        @click="runReport"
        class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none"
      )
        Icon(name="ph:play" size="16" aria-hidden="true")
        span.ml-2 {{ $t('reportBuilder.run') }}

  //- Main Layout: 3-column
  .builder-layout.flex.gap-6(style="min-height: calc(100vh - 200px)")

    //- LEFT: Field Picker Sidebar
    .field-picker-sidebar.glass-card.rounded-2xl.overflow-hidden(style="width: 280px; min-width: 280px; flex-shrink: 0")
      .px-4.py-3(style="border-bottom: 1px solid var(--glass-border-color)")
        .flex.items-center.gap-2
          Icon(name="ph:columns" size="18" style="color: #7849ff" aria-hidden="true")
          h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('reportBuilder.fields') }}

      //- Module selector
      .px-3.py-2(style="border-bottom: 1px solid var(--glass-border-color)")
        el-select(
          v-model="pro.config.value.modules[0]"
          class="w-full"
          size="small"
          @change="onModuleChange"
        )
          el-option(value="leads" :label="$t('navigation.leads')")
          el-option(value="deals" :label="$t('navigation.deals')")
          el-option(value="clients" :label="$t('navigation.clients')")
          el-option(value="salesOrders" :label="$t('reports.salesOrders')")
          el-option(value="invoices" :label="$t('navigation.invoices')")
          el-option(value="payments" :label="$t('reports.payments')")
          el-option(value="tickets" :label="$t('reports.tickets')")
          el-option(value="employees" :label="$t('reports.employees')")

      ReportsFieldPicker(
        v-model="pro.config.value.fields"
        :active-module="pro.config.value.modules[0]"
        @update:active-module="onModuleSwitch"
      )

    //- CENTER: Configuration + Preview
    .flex-1.flex.flex-col.gap-6.min-w-0

      //- Selected columns display (drag zone)
      .glass-card.p-4.rounded-2xl
        .flex.items-center.justify-between.mb-3
          .flex.items-center.gap-2
            Icon(name="ph:list-checks" size="18" style="color: #7849ff" aria-hidden="true")
            h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('reportBuilder.selectedColumns') }}
            el-tag(size="small" type="info" effect="plain" round) {{ pro.config.value.fields.length }}
          el-button(size="small" text type="danger" @click="pro.config.value.fields = []" v-if="pro.config.value.fields.length")
            Icon(name="ph:trash" size="14" class="mr-1" aria-hidden="true")
            span {{ $t('reportBuilder.clearAll') }}

        .selected-fields-area
          draggable(
            v-model="pro.config.value.fields"
            :group="{ name: 'reportFields', pull: false, put: true }"
            item-key="element"
            class="flex flex-wrap gap-2 min-h-[40px]"
            ghost-class="ghost-field"
            @add="onFieldDropped"
          )
            template(#item="{ element }")
              el-tag(
                closable
                effect="dark"
                size="default"
                @close="removeField(element)"
                style="background: rgba(120, 73, 255, 0.15); border-color: rgba(120, 73, 255, 0.3); color: #7849ff; cursor: grab"
              )
                Icon(:name="getFieldIcon(element)" size="12" class="mr-1" aria-hidden="true")
                span {{ getFieldLabel(element) }}

          .text-center.py-3(v-if="!pro.config.value.fields.length")
            p.text-xs(style="color: var(--text-muted)") {{ $t('reportBuilder.dragFieldsHere') }}

      //- Tabs: Filters, Chart, Group By, Schedule
      .glass-card.rounded-2xl.overflow-hidden
        el-tabs(v-model="activeTab" class="builder-tabs")
          //- Filters Tab
          el-tab-pane(:label="$t('reportBuilder.filters')" name="filters")
            template(#label)
              .flex.items-center.gap-2
                Icon(name="ph:funnel" size="16" aria-hidden="true")
                span {{ $t('reportBuilder.filters') }}
                el-badge(
                  v-if="pro.config.value.filters.length"
                  :value="pro.config.value.filters.length"
                  type="primary"
                  class="ml-1"
                )
            .p-5
              ReportsFilterPanel(
                v-model="pro.config.value.filters"
                :active-module="pro.config.value.modules[0]"
                :logic="pro.filterLogic.value"
                @update:logic="pro.filterLogic.value = $event"
              )

          //- Group By Tab
          el-tab-pane(:label="$t('reports.groupBy')" name="groupby")
            template(#label)
              .flex.items-center.gap-2
                Icon(name="ph:stack" size="16" aria-hidden="true")
                span {{ $t('reportBuilder.groupBy') }}
            .p-5
              .space-y-4
                .form-group
                  label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.groupByField') }}
                  el-select(
                    v-model="pro.config.value.groupBy"
                    clearable
                    class="w-full"
                    :placeholder="$t('reportBuilder.none')"
                  )
                    el-option(
                      v-for="f in activeFields"
                      :key="f.name"
                      :value="f.name"
                      :label="f.label"
                    )

                .form-group(v-if="pro.config.value.groupBy")
                  label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.aggregation') }}
                  .space-y-2
                    .flex.items-center.gap-2(v-for="(agg, i) in pro.config.value.aggregations" :key="i")
                      el-select(v-model="agg.function" size="default" class="w-32")
                        el-option(value="COUNT" :label="$t('reports.count')")
                        el-option(value="SUM" :label="$t('reports.sum')")
                        el-option(value="AVG" :label="$t('reports.average')")
                        el-option(value="MIN" :label="$t('reports.min')")
                        el-option(value="MAX" :label="$t('reports.max')")
                      el-select(v-model="agg.field" size="default" class="flex-1")
                        el-option(
                          v-for="f in numericFields"
                          :key="f.name"
                          :value="f.name"
                          :label="f.label"
                        )
                      el-button(link @click="pro.config.value.aggregations.splice(i, 1)" size="small")
                        Icon(name="ph:x-circle" size="16" class="text-red-400" aria-label="Remove")
                    el-button(
                      size="small"
                      @click="addAggregation"
                      style="border-style: dashed"
                    )
                      Icon(name="ph:plus" size="14" class="mr-1" aria-hidden="true")
                      span {{ $t('reportBuilder.addAggregation') }}

                .form-group
                  label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.sortBy') }}
                  .flex.gap-2
                    el-select(
                      v-model="pro.config.value.sortBy"
                      clearable
                      class="flex-1"
                      :placeholder="$t('reportBuilder.none')"
                    )
                      el-option(
                        v-for="f in activeFields"
                        :key="f.name"
                        :value="f.name"
                        :label="f.label"
                      )
                    el-select(v-model="pro.config.value.sortOrder" class="w-28")
                      el-option(value="ASC" :label="$t('common.ascending')")
                      el-option(value="DESC" :label="$t('common.descending')")

          //- Chart Tab
          el-tab-pane(:label="$t('reportBuilder.chartType')" name="chart")
            template(#label)
              .flex.items-center.gap-2
                Icon(name="ph:chart-bar" size="16" aria-hidden="true")
                span {{ $t('reportBuilder.chart') }}
            .p-5
              ReportsChartPicker(
                v-model="pro.config.value.chartType"
                :config="pro.config.value.chartConfig"
                :fields="activeFields"
                @update:config="pro.config.value.chartConfig = $event"
              )

          //- Schedule Tab
          el-tab-pane(:label="$t('reports.schedule')" name="schedule")
            template(#label)
              .flex.items-center.gap-2
                Icon(name="ph:clock" size="16" aria-hidden="true")
                span {{ $t('reportBuilder.schedule') }}
                .w-2.h-2.rounded-full.bg-green-500(v-if="pro.config.value.schedule?.enabled")
            .p-5
              ReportsScheduleConfig(v-model="pro.config.value.schedule")

      //- Preview Panel
      .glass-card.p-6.rounded-2xl.flex-1
        .flex.items-center.justify-between.mb-4
          .flex.items-center.gap-2
            Icon(name="ph:chart-line-up" size="18" style="color: #7849ff" aria-hidden="true")
            h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('reportBuilder.results') }}
          .flex.gap-2(v-if="pro.results.value.length")
            el-button(size="small" @click="openSaveDialog")
              Icon(name="ph:floppy-disk" size="14" class="mr-1" aria-hidden="true")
              span {{ $t('reportBuilder.save') }}

        ReportsReportPreview(
          :data="pro.results.value"
          :columns="displayColumns"
          :chart-type="pro.config.value.chartType"
          :chart-option="chartOption"
          :loading="pro.loading.value"
          :summary="pro.summary.value"
          :total-count="pro.totalCount.value"
          @export="handleExport"
          @sort="handleSort"
        )

  //- Save Report Dialog
  el-dialog(v-model="showSaveDialog" :title="$t('reportBuilder.saveReport')" width="450px")
    .space-y-4
      .form-group
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.reportName') }}
        el-input(v-model="reportName" :placeholder="$t('reportBuilder.enterReportName')" size="large")
      .form-group
        label.block.text-sm.font-medium.mb-2(style="color: var(--text-primary)") {{ $t('reportBuilder.description') }}
        el-input(
          v-model="reportDescription"
          type="textarea"
          :rows="3"
          :placeholder="$t('reportBuilder.enterDescription')"
        )
      .form-group
        el-checkbox(v-model="shareReport") {{ $t('reportBuilder.shareWithTeam') }}
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showSaveDialog = false") {{ $t('reportBuilder.cancel') }}
        el-button(
          type="primary"
          :loading="pro.saving.value"
          :disabled="!reportName"
          @click="saveCurrentReport"
          class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none"
        ) {{ $t('reportBuilder.save') }}

  //- Saved Reports Drawer
  el-drawer(v-model="showSavedDrawer" :title="$t('reportBuilder.savedReports')" size="420px")
    .space-y-3
      .saved-item.p-4.rounded-xl.cursor-pointer(
        v-for="r in pro.savedReports.value"
        :key="r.id"
        style="background: var(--bg-input); border: 1px solid var(--border-default)"
        @click="loadSavedReport(r)"
      )
        .flex.justify-between.items-start
          div
            p.font-bold(style="color: var(--text-primary)") {{ r.name }}
            p.text-xs.mt-1(v-if="r.description" style="color: var(--text-secondary)") {{ r.description }}
            .flex.gap-2.mt-2
              el-tag(size="small" effect="plain") {{ r.entityType }}
              el-tag(v-if="r.chartType" size="small" effect="plain" type="info") {{ r.chartType }}
              el-tag(v-if="r.schedule" size="small" effect="plain" type="success")
                Icon(name="ph:clock" size="10" class="mr-1" aria-hidden="true")
                span Scheduled
              span.text-xs(style="color: var(--text-muted)") {{ formatDate(r.createdAt) }}
          el-button(link @click.stop="deleteReport(r.id)")
            Icon(name="ph:trash" size="16" class="text-red-400" aria-label="Delete")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import draggable from 'vuedraggable';
import { useReportBuilderPro, MODULE_DEFINITIONS, type FieldDefinition, type ChartConfig } from '~/composables/useReportBuilderPro';

definePageMeta({ title: 'Report Builder' });

const pro = useReportBuilderPro();

// ─── Local State ──────────────────────────────────────────

const activeTab = ref('filters');
const showSaveDialog = ref(false);
const showSavedDrawer = ref(false);
const loadingSaved = ref(false);
const reportName = ref('');
const reportDescription = ref('');
const shareReport = ref(false);

// ─── Computed ─────────────────────────────────────────────

const activeFields = computed((): FieldDefinition[] => {
  return pro.getActiveModuleFields();
});

const numericFields = computed(() => {
  return activeFields.value.filter(f => f.type === 'number');
});

const displayColumns = computed(() => {
  if (pro.config.value.groupBy) {
    const groupField = activeFields.value.find(f => f.name === pro.config.value.groupBy);
    const cols = [{ name: pro.config.value.groupBy, label: groupField?.label || pro.config.value.groupBy, type: groupField?.type || 'text' }];
    // Add aggregation columns
    if (pro.config.value.aggregations.length) {
      for (const agg of pro.config.value.aggregations) {
        const field = activeFields.value.find(f => f.name === agg.field);
        cols.push({
          name: `${agg.function.toLowerCase()}_${agg.field}`,
          label: `${agg.function} of ${field?.label || agg.field}`,
          type: 'number'
        });
      }
    }
    // Always include count
    cols.push({ name: 'count', label: 'Count', type: 'number' });
    return cols;
  }

  return pro.config.value.fields.map(fieldName => {
    const fd = pro.getFieldDefinition(fieldName);
    return {
      name: fieldName,
      label: fd?.label || fieldName,
      type: fd?.type || 'text'
    };
  });
});

const chartOption = computed(() => {
  if (!pro.config.value.chartType || pro.config.value.chartType === 'table') return {};
  if (!pro.results.value.length) return {};

  return pro.getChartOption(pro.results.value, pro.config.value.chartType, pro.config.value.chartConfig);
});

// ─── Methods ──────────────────────────────────────────────

function onModuleChange(moduleKey: string) {
  const mod = MODULE_DEFINITIONS[moduleKey];
  if (mod) {
    pro.config.value.fields = mod.fields.slice(0, 4).map(f => f.name);
    pro.config.value.filters = [];
    pro.config.value.groupBy = '';
    pro.config.value.aggregations = [];
    pro.config.value.chartConfig.xAxis = '';
    pro.config.value.chartConfig.yAxis = '';
    pro.results.value = [];
  }
}

function onModuleSwitch(moduleKey: string) {
  if (pro.config.value.modules[0] !== moduleKey) {
    pro.config.value.modules = [moduleKey];
    onModuleChange(moduleKey);
  }
}

function onFieldDropped(event: unknown) {
  // When a field is dropped from the picker, it comes as a FieldDefinition object
  // We need to convert it to a string (field name) for our fields array
  const added = event.added;
  if (added && added.element && typeof added.element === 'object' && added.element.name) {
    const idx = added.newIndex;
    pro.config.value.fields[idx] = added.element.name;
  }
}

function removeField(fieldName: string) {
  pro.config.value.fields = pro.config.value.fields.filter(f => f !== fieldName);
}

function getFieldLabel(fieldName: string): string {
  const fd = pro.getFieldDefinition(fieldName);
  return fd?.label || fieldName;
}

function getFieldIcon(fieldName: string): string {
  const fd = pro.getFieldDefinition(fieldName);
  return fd?.icon || 'ph:text-aa';
}

function addAggregation() {
  const firstNumeric = numericFields.value[0];
  pro.config.value.aggregations.push({
    field: firstNumeric?.name || '',
    function: 'SUM'
  });
}

async function runReport() {
  await pro.buildReport();
}

function handleExport(format: string) {
  const filename = `report-${pro.config.value.modules[0]}-${Date.now()}`;
  const data = pro.results.value;
  const columns = displayColumns.value.map(c => c.name);

  if (format === 'csv') {
    pro.exportToCSV(data, columns, filename);
  } else if (format === 'excel') {
    pro.exportToExcel(data, columns, filename);
  } else if (format === 'pdf') {
    pro.exportToPDF(data, columns, filename);
  }
}

function handleSort(payload: { field: string; order: string }) {
  pro.config.value.sortBy = payload.field;
  pro.config.value.sortOrder = payload.order as 'ASC' | 'DESC';
  runReport();
}

function openSaveDialog() {
  showSaveDialog.value = true;
}

async function saveCurrentReport() {
  if (!reportName.value) return;
  const result = await pro.saveReport(reportName.value, reportDescription.value);
  if (result) {
    ElNotification({ type: 'success', title: 'Saved', message: 'Report saved successfully' });
    showSaveDialog.value = false;
    reportName.value = '';
    reportDescription.value = '';
  }
}

async function openSavedReports() {
  loadingSaved.value = true;
  try {
    await pro.fetchSavedReports();
    showSavedDrawer.value = true;
  } finally {
    loadingSaved.value = false;
  }
}

async function loadSavedReport(report: unknown) {
  await pro.loadReport(report.id);
  reportName.value = report.name;
  showSavedDrawer.value = false;
  await runReport();
}

async function deleteReport(id: string | number) {
  await pro.deleteSavedReport(id);
  ElNotification({ type: 'success', title: 'Deleted', message: 'Report removed' });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}
</script>

<style lang="scss" scoped>
.report-builder-page {
  animation: fadeIn 0.4s ease-out;
}

.builder-layout {
  @media (max-width: 1024px) {
    flex-direction: column;

    .field-picker-sidebar {
      width: 100% !important;
      min-width: unset !important;
      max-height: 300px;
    }
  }
}

.saved-item:hover {
  border-color: #7849ff !important;
}

.ghost-field {
  opacity: 0.4;
  background: rgba(120, 73, 255, 0.1);
  border: 2px dashed #7849ff;
  border-radius: 8px;
}

.builder-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
    padding: 0 16px;
    border-bottom: 1px solid var(--glass-border-color);
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted);
    &.is-active {
      color: #7849ff;
    }
  }

  :deep(.el-tabs__active-bar) {
    background-color: #7849ff;
  }

  :deep(.el-tabs__content) {
    padding: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
