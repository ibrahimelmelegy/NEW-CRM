<template lang="pug">
.custom-reports-page.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    div
      h1.text-3xl.font-black.tracking-tight.flex.items-center.gap-3(style="color: var(--text-primary);")
        Icon(name="ph:file-magnifying-glass-bold" size="32" style="color: #7849ff")
        | {{ $t('reportsPage.savedReports') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('reportsPage.subtitle') }}
    .flex.items-center.gap-3
      el-button(type="primary" size="large" class="!rounded-xl" @click="openCreateDialog")
        Icon(name="ph:plus-bold" size="16" class="mr-1")
        | {{ $t('reportsPage.createReport') }}

  //- Stats Cards
  .grid.gap-4.mb-8(class="grid-cols-1 md:grid-cols-3")
    .relative.overflow-hidden.p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120,73,255,0.12);")
          Icon(name="ph:files-bold" size="20" style="color: #7849ff")
        div
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('reportBuilder.savedReports') }}
          p.text-2xl.font-black.mt-1(style="color: var(--text-primary);") {{ reports.length }}

    .relative.overflow-hidden.p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34,197,94,0.12);")
          Icon(name="ph:play-circle-bold" size="20" style="color: #22c55e")
        div
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Recently Executed
          p.text-2xl.font-black.mt-1(style="color: #22c55e;") {{ recentlyExecutedCount }}

    .relative.overflow-hidden.p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59,130,246,0.12);")
          Icon(name="ph:clock-bold" size="20" style="color: #3b82f6")
        div
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Scheduled
          p.text-2xl.font-black.mt-1(style="color: #3b82f6;") {{ scheduledCount }}

  //- Filters Row
  .flex.items-center.gap-4.mb-6(class="flex-col md:flex-row")
    el-input(
      v-model="searchQuery"
      :placeholder="$t('reportsPage.searchReports')"
      clearable
      style="max-width: 320px"
      size="large"
      class="!rounded-xl"
    )
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
    el-select(
      v-model="entityTypeFilter"
      :placeholder="$t('reportsPage.allEntities')"
      clearable
      size="large"
      style="width: 200px"
    )
      el-option(
        v-for="(label, key) in entityTypes"
        :key="key"
        :label="label"
        :value="key"
      )

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Reports Table
  template(v-else)
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-if="filteredReports.length")
      el-table(:data="filteredReports" stripe style="width: 100%")
        el-table-column(:label="$t('reportsPage.reportName')" min-width="200")
          template(#default="scope")
            .flex.items-center.gap-3
              .w-8.h-8.rounded-lg.flex.items-center.justify-center(
                :style="{ background: getEntityColor(scope.row.entityType) + '18' }"
              )
                Icon(name="ph:file-text-bold" size="16" :style="{ color: getEntityColor(scope.row.entityType) }")
              div
                p.text-sm.font-bold(style="color: var(--text-primary);") {{ scope.row.name }}
                p.text-xs(style="color: var(--text-muted);" v-if="scope.row.description") {{ scope.row.description }}
        el-table-column(:label="$t('reportsPage.entityType')" min-width="130")
          template(#default="scope")
            el-tag(size="small" effect="plain" round) {{ entityTypes[scope.row.entityType] || scope.row.entityType }}
        el-table-column(:label="$t('reportBuilder.fields')" min-width="100")
          template(#default="scope")
            span.text-sm {{ scope.row.fields?.length || 0 }} fields
        el-table-column(:label="$t('reportsPage.createdBy')" min-width="140")
          template(#default="scope")
            span.text-sm {{ scope.row.user?.name || '--' }}
        el-table-column(:label="$t('reportsPage.lastRun')" min-width="150")
          template(#default="scope")
            span.text-sm.font-mono(style="color: var(--text-muted);") {{ formatDate(scope.row.updatedAt) }}
        el-table-column(:label="$t('common.actions')" width="280" fixed="right")
          template(#default="scope")
            .flex.items-center.gap-2
              el-button(
                type="primary"
                size="small"
                text
                @click="handleExecute(scope.row)"
                :loading="executingId === scope.row.id"
              )
                Icon(name="ph:play-bold" size="14" class="mr-1")
                | {{ $t('reportsPage.runReport') }}
              el-dropdown(trigger="click")
                el-button(size="small" text)
                  Icon(name="ph:download-simple-bold" size="14" class="mr-1")
                  | {{ $t('reportBuilder.export') }}
                template(#dropdown)
                  el-dropdown-menu
                    el-dropdown-item(@click="handleExport(scope.row.id, 'csv')")
                      .flex.items-center.gap-2
                        Icon(name="ph:file-csv-bold" size="16")
                        | {{ $t('reportsPage.exportCsv') }}
                    el-dropdown-item(@click="handleExport(scope.row.id, 'pdf')")
                      .flex.items-center.gap-2
                        Icon(name="ph:file-pdf-bold" size="16")
                        | {{ $t('reportsPage.exportPdf') }}
              el-button(size="small" text @click="openEditDialog(scope.row)")
                Icon(name="ph:pencil-simple-bold" size="14")
              el-popconfirm(
                :title="$t('reports.confirmDeleteReport')"
                @confirm="handleDelete(scope.row.id)"
                confirm-button-text="Delete"
                cancel-button-text="Cancel"
              )
                template(#reference)
                  el-button(size="small" text type="danger")
                    Icon(name="ph:trash-bold" size="14")

    //- Empty State
    .text-center.py-16(v-else)
      .w-20.h-20.rounded-2xl.flex.items-center.justify-center.mx-auto.mb-4(
        style="background: rgba(120,73,255,0.08);"
      )
        Icon(name="ph:file-magnifying-glass" size="40" style="color: #7849ff; opacity: 0.6;")
      p.text-lg.font-bold.mb-1(style="color: var(--text-primary);") {{ $t('reportsPage.noReports') }}
      p.text-sm.mb-4(style="color: var(--text-muted);") Create your first report to start analyzing your data.
      el-button(type="primary" class="!rounded-xl" @click="openCreateDialog")
        Icon(name="ph:plus-bold" size="14" class="mr-1")
        | {{ $t('reportsPage.createReport') }}

  //- Results Dialog
  el-dialog(
    v-model="resultsDialogVisible"
    :title="resultsReportName"
    width="90%"
    top="4vh"
    :close-on-click-modal="false"
    class="custom-reports-results-dialog"
  )
    .mb-4.flex.items-center.justify-between(v-if="executionResults")
      .flex.items-center.gap-3
        el-tag(type="info" effect="plain") {{ executionResults.entityType }}
        span.text-sm.font-mono(style="color: var(--text-muted);") {{ executionResults.totalCount }} {{ $t('reportBuilder.records') }}
      .flex.items-center.gap-2
        el-button(size="small" @click="handleExport(resultsReportId, 'csv')")
          Icon(name="ph:file-csv-bold" size="14" class="mr-1")
          | CSV
        el-button(size="small" @click="handleExport(resultsReportId, 'pdf')")
          Icon(name="ph:file-pdf-bold" size="14" class="mr-1")
          | PDF

    //- Results Loading
    .flex.items-center.justify-center.py-12(v-if="executingId")
      el-icon.is-loading(:size="28" style="color: var(--accent-color, #7849ff)")
      span.ml-3.text-sm(style="color: var(--text-muted);") {{ $t('reportBuilder.generatingReport') }}

    //- Results Table
    template(v-else-if="executionResults && executionResults.data && executionResults.data.length")
      .overflow-x-auto
        el-table(:data="executionResults.data" stripe style="width: 100%" max-height="60vh")
          el-table-column(
            v-for="col in resultColumns"
            :key="col"
            :prop="col"
            :label="formatColumnLabel(col)"
            min-width="140"
            sortable
          )
            template(#default="scope")
              span.text-sm {{ scope.row[col] ?? '--' }}

    //- No Results
    .text-center.py-12(v-else-if="executionResults && executionResults.data && !executionResults.data.length")
      Icon(name="ph:database" size="40" style="color: var(--text-muted); opacity: 0.5;")
      p.text-sm.mt-3(style="color: var(--text-muted);") {{ $t('reportBuilder.noData') }}

  //- Create / Edit Report Dialog
  el-dialog(
    v-model="formDialogVisible"
    :title="editingReport ? 'Edit Report' : ($t('reportsPage.createReport'))"
    width="700px"
    :close-on-click-modal="false"
  )
    el-form(
      ref="reportFormRef"
      :model="reportForm"
      :rules="formRules"
      label-position="top"
    )
      el-form-item(:label="$t('reportsPage.reportName')" prop="name")
        el-input(
          v-model="reportForm.name"
          :placeholder="$t('reportBuilder.reportName')"
          size="large"
        )

      el-form-item(:label="$t('common.description')")
        el-input(
          v-model="reportForm.description"
          type="textarea"
          :rows="2"
          :placeholder="$t('reports.optionalDescription')"
        )

      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('reportsPage.entityType')" prop="entityType")
          el-select(
            v-model="reportForm.entityType"
            :placeholder="$t('reportBuilder.entityType')"
            size="large"
            style="width: 100%"
            @change="handleEntityTypeChange"
          )
            el-option(
              v-for="(label, key) in entityTypes"
              :key="key"
              :label="label"
              :value="key"
            )

        el-form-item(:label="$t('reports.sortOrder')")
          el-select(v-model="reportForm.sortOrder" size="large" style="width: 100%")
            el-option(:label="$t('common.descending')" value="DESC")
            el-option(:label="$t('common.ascending')" value="ASC")

      el-form-item(:label="$t('reportBuilder.fields')" prop="fields")
        .mb-2(v-if="loadingFields")
          el-icon.is-loading(style="color: var(--text-muted);")
          span.text-xs.ml-2(style="color: var(--text-muted);") Loading fields...
        el-select(
          v-else
          v-model="reportForm.fields"
          multiple
          filterable
          :placeholder="$t('reportBuilder.searchFields')"
          size="large"
          style="width: 100%"
          :disabled="!reportForm.entityType"
        )
          el-option(
            v-for="field in availableFields"
            :key="field.name"
            :label="formatColumnLabel(field.name)"
            :value="field.name"
          )
            .flex.items-center.justify-between.w-full
              span {{ formatColumnLabel(field.name) }}
              el-tag(size="small" type="info" effect="plain") {{ field.type }}

      //- Sort By
      el-form-item(:label="$t('reports.sortBy')" v-if="reportForm.fields.length")
        el-select(
          v-model="reportForm.sortBy"
          clearable
          :placeholder="$t('reports.defaultSort')"
          size="large"
          style="width: 100%"
        )
          el-option(
            v-for="f in reportForm.fields"
            :key="f"
            :label="formatColumnLabel(f)"
            :value="f"
          )

      //- Group By
      el-form-item(:label="$t('reportBuilder.groupBy')" v-if="reportForm.fields.length")
        el-select(
          v-model="reportForm.groupBy"
          clearable
          :placeholder="$t('reportBuilder.none')"
          size="large"
          style="width: 100%"
        )
          el-option(
            v-for="f in reportForm.fields"
            :key="f"
            :label="formatColumnLabel(f)"
            :value="f"
          )

      //- Filters Section
      .mb-4
        .flex.items-center.justify-between.mb-3
          span.text-sm.font-bold(style="color: var(--text-primary);") {{ $t('reportBuilder.filters') }}
          el-button(size="small" text @click="addFilter")
            Icon(name="ph:plus-bold" size="14" class="mr-1")
            | {{ $t('reportBuilder.addFilter') }}

        .space-y-3
          .flex.items-center.gap-3(v-for="(filter, idx) in reportForm.filters" :key="idx")
            el-select(
              v-model="filter.field"
              :placeholder="$t('reportBuilder.selectField')"
              size="default"
              style="width: 30%"
              filterable
            )
              el-option(
                v-for="field in availableFields"
                :key="field.name"
                :label="formatColumnLabel(field.name)"
                :value="field.name"
              )
            el-select(
              v-model="filter.operator"
              :placeholder="$t('reportBuilder.operator')"
              size="default"
              style="width: 25%"
            )
              el-option(:label="$t('common.equals')" value="equals")
              el-option(:label="$t('reports.notEquals')" value="not_equals")
              el-option(:label="$t('common.contains')" value="contains")
              el-option(:label="$t('reports.greaterThan')" value="greater_than")
              el-option(:label="$t('reports.lessThan')" value="less_than")
              el-option(:label="$t('common.isNull')" value="is_null")
              el-option(:label="$t('common.isNotNull')" value="is_not_null")
            el-input(
              v-if="filter.operator !== 'is_null' && filter.operator !== 'is_not_null'"
              v-model="filter.value"
              :placeholder="$t('reportBuilder.enterValue')"
              size="default"
              style="width: 35%"
            )
            .w-8(v-else)
            el-button(
              size="small"
              type="danger"
              text
              circle
              @click="reportForm.filters.splice(idx, 1)"
            )
              Icon(name="ph:x-bold" size="14")

      //- Shared toggle
      el-form-item
        el-checkbox(v-model="reportForm.isShared") Share this report with all team members

    template(#footer)
      .flex.items-center.justify-end.gap-3
        el-button(size="large" @click="formDialogVisible = false") {{ $t('common.cancel') }}
        el-button(
          type="primary"
          size="large"
          :loading="saving"
          @click="handleSaveReport"
        )
          | {{ editingReport ? ($t('common.save')) : ($t('reportBuilder.saveReport')) }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { ElNotification } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

definePageMeta({});

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// ─── State ──────────────────────────────────────────────
const loading = ref(true);
const saving = ref(false);
const loadingFields = ref(false);
const reports = ref<Record<string, unknown>[]>([]);
const entityTypes = ref<Record<string, string>>({});
const availableFields = ref<Record<string, unknown>[]>([]);
const searchQuery = ref('');
const entityTypeFilter = ref('');
const formDialogVisible = ref(false);
const resultsDialogVisible = ref(false);
const editingReport = ref<Record<string, unknown> | null>(null);
const executingId = ref<number | null>(null);
const executionResults = ref<Record<string, unknown> | null>(null);
const resultsReportName = ref('');
const resultsReportId = ref<number>(0);
const reportFormRef = ref<FormInstance>();

// ─── Form ───────────────────────────────────────────────
interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

const defaultForm = () => ({
  name: '',
  description: '',
  entityType: '',
  fields: [] as string[],
  filters: [] as ReportFilter[],
  groupBy: '',
  sortBy: '',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
  isShared: false
});

const reportForm = reactive(defaultForm());

const formRules = reactive<FormRules>({
  name: [{ required: true, message: 'Report name is required', trigger: 'blur' }],
  entityType: [{ required: true, message: 'Entity type is required', trigger: 'change' }],
  fields: [{ required: true, type: 'array', min: 1, message: 'Select at least one field', trigger: 'change' }]
});

// ─── Computed ───────────────────────────────────────────
const filteredReports = computed(() => {
  let result = reports.value;
  if (entityTypeFilter.value) {
    result = result.filter((r) => r.entityType === entityTypeFilter.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter((r) => (r.name || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q));
  }
  return result;
});

const recentlyExecutedCount = computed(() => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return reports.value.filter((r) => new Date(r.updatedAt) > oneWeekAgo).length;
});

const scheduledCount = computed(() => {
  return reports.value.filter((r) => r.schedule && r.schedule.frequency).length;
});

const resultColumns = computed(() => {
  if (!executionResults.value?.data?.length) return [];
  return Object.keys(executionResults.value.data[0]);
});

// ─── API Calls ──────────────────────────────────────────
async function fetchReports() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('reports');
    if (success && body) {
      reports.value = Array.isArray(body) ? body : (body as unknown).docs || [];
    }
  } catch (e) {
    console.error('Failed to fetch reports', e);
  } finally {
    loading.value = false;
  }
}

async function fetchEntityTypes() {
  try {
    const { body, success } = await useApiFetch('reports/entity-types');
    if (success && body) {
      entityTypes.value = body as Record<string, string>;
    }
  } catch (e) {
    console.error('Failed to fetch entity types', e);
  }
}

async function fetchFields(entityType: string) {
  if (!entityType) {
    availableFields.value = [];
    return;
  }
  loadingFields.value = true;
  try {
    const { body, success } = await useApiFetch(`reports/fields/${entityType}`);
    if (success && body) {
      availableFields.value = (body as unknown).fields || [];
    }
  } catch (e) {
    console.error('Failed to fetch fields', e);
    availableFields.value = [];
  } finally {
    loadingFields.value = false;
  }
}

async function handleExecute(report: unknown) {
  executingId.value = report.id;
  resultsReportName.value = report.name;
  resultsReportId.value = report.id;
  resultsDialogVisible.value = true;
  executionResults.value = null;

  try {
    const { body, success } = await useApiFetch(`reports/${report.id}/execute`, 'POST');
    if (success && body) {
      executionResults.value = body;
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
    }
  } catch (e) {
    console.error('Failed to execute report', e);
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    executingId.value = null;
  }
}

async function handleExport(reportId: number, format: string) {
  try {
    const config = useRuntimeConfig();
    const url = `${config.public.API_BASE_URL}reports/${reportId}/export/${format}`;

    // For CSV, trigger a download via a temporary anchor
    if (format === 'csv' || format === 'excel') {
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `report-${reportId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } else {
      // PDF: get JSON data and let browser handle or notify
      const { body, success } = await useApiFetch(`reports/${reportId}/export/${format}`);
      if (success && body) {
        // Convert the JSON to a downloadable file
        const blob = new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `report-${reportId}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      }
    }

    ElNotification({ type: 'success', title: t('common.success'), message: t('common.success') });
  } catch (e) {
    console.error('Export failed', e);
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }
}

async function handleSaveReport() {
  if (!reportFormRef.value) return;
  await reportFormRef.value.validate(async valid => {
    if (!valid) return;
    saving.value = true;

    const payload: Record<string, unknown> = {
      name: reportForm.name,
      description: reportForm.description,
      entityType: reportForm.entityType,
      fields: reportForm.fields,
      filters: reportForm.filters.filter(f => f.field && f.operator),
      sortOrder: reportForm.sortOrder,
      isShared: reportForm.isShared
    };
    if (reportForm.groupBy) payload.groupBy = reportForm.groupBy;
    if (reportForm.sortBy) payload.sortBy = reportForm.sortBy;

    try {
      if (editingReport.value) {
        const { success } = await useApiFetch(`reports/${editingReport.value.id}`, 'PUT', payload);
        if (success) {
          ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
        } else {
          ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
        }
      } else {
        const { success } = await useApiFetch('reports', 'POST', payload);
        if (success) {
          ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
        } else {
          ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
        }
      }
      formDialogVisible.value = false;
      await fetchReports();
    } catch (e) {
      console.error('Save failed', e);
      ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
    } finally {
      saving.value = false;
    }
  });
}

async function handleDelete(id: number) {
  try {
    const { success } = await useApiFetch(`reports/${id}`, 'DELETE');
    if (success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      await fetchReports();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
    }
  } catch (e) {
    console.error('Delete failed', e);
  }
}

// ─── Dialog Helpers ─────────────────────────────────────
function openCreateDialog() {
  editingReport.value = null;
  Object.assign(reportForm, defaultForm());
  availableFields.value = [];
  formDialogVisible.value = true;
}

async function openEditDialog(report: unknown) {
  editingReport.value = report;
  Object.assign(reportForm, {
    name: report.name || '',
    description: report.description || '',
    entityType: report.entityType || '',
    fields: Array.isArray(report.fields) ? [...report.fields] : [],
    filters: Array.isArray(report.filters) ? report.filters.map((f) => ({ ...f })) : [],
    groupBy: report.groupBy || '',
    sortBy: report.sortBy || '',
    sortOrder: report.sortOrder || 'DESC',
    isShared: !!report.isShared
  });
  if (report.entityType) {
    await fetchFields(report.entityType);
  }
  formDialogVisible.value = true;
}

function handleEntityTypeChange(val: string) {
  reportForm.fields = [];
  reportForm.groupBy = '';
  reportForm.sortBy = '';
  reportForm.filters = [];
  fetchFields(val);
}

function addFilter() {
  reportForm.filters.push({ field: '', operator: 'equals', value: '' });
}

// ─── Formatting Helpers ─────────────────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatColumnLabel(col: string): string {
  if (!col) return '';
  // Convert camelCase or snake_case to Title Case
  return col
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

const entityColorMap: Record<string, string> = {
  lead: '#7849ff',
  deal: '#22c55e',
  client: '#3b82f6',
  opportunity: '#f59e0b',
  project: '#0891b2',
  invoice: '#ea580c',
  daily_task: '#6366f1',
  user: '#8b5cf6',
  contract: '#0d9488',
  vendor: '#d97706',
  purchase_order: '#2563eb',
  campaign: '#ec4899'
};

function getEntityColor(entityType: string): string {
  return entityColorMap[entityType] || '#6b7280';
}

// ─── Init ───────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchReports(), fetchEntityTypes()]);
});
</script>

<style lang="scss" scoped>
.custom-reports-page {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Responsive: stack stats on mobile
@media (max-width: 767px) {
  :deep(.el-table) {
    font-size: 13px;
  }

  :deep(.el-dialog) {
    width: 95% !important;
    margin: 8px auto;
  }
}
</style>
