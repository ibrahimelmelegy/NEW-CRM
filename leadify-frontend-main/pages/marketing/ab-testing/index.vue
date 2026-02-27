<template lang="pug">
div
  ModuleHeader(
    :title="$t('marketing.abTesting.title') || 'A/B Testing'"
    :subtitle="$t('marketing.abTesting.subtitle') || 'Create experiments, test variations, and optimize with data-driven decisions.'"
  )
    template(#actions)
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openCreateDialog()")
        Icon(name="ph:flask-bold" size="16")
        span.ml-1 {{ $t('marketing.abTesting.newTest') || 'New Test' }}

  StatCards(:stats="summaryStats")

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Table
  template(v-else)
    .glass-card.p-6
      .flex.items-center.justify-between.mb-4
        el-input(
          v-model="search"
          :placeholder="$t('common.search') || 'Search'"
          clearable
          style="max-width: 280px"
          size="large"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
        .flex.items-center.gap-2
          el-select(v-model="filterStatus" clearable :placeholder="$t('common.status') || 'Status'" style="width: 160px")
            el-option(v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value")

      el-table(
        :data="filteredData"
        v-loading="loading"
        style="width: 100%"
        @row-click="handleRowClick"
        row-class-name="cursor-pointer"
        stripe
      )
        el-table-column(:label="$t('common.name') || 'Name'" prop="name" min-width="200" sortable)
        el-table-column(:label="$t('common.type') || 'Type'" prop="type" width="150" sortable)
          template(#default="{ row }")
            el-tag(size="small" effect="plain") {{ row.type }}
        el-table-column(:label="$t('common.status') || 'Status'" prop="status" width="140" sortable)
          template(#default="{ row }")
            el-tag(:type="getStatusType(row.status)" size="small" effect="dark") {{ row.status }}
        el-table-column(:label="$t('common.startDate') || 'Start Date'" prop="startDate" width="140" sortable)
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.startDate) }}
        el-table-column(:label="$t('common.endDate') || 'End Date'" prop="endDate" width="140" sortable)
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.endDate) }}
        el-table-column(:label="$t('marketing.abTesting.winner') || 'Winner'" prop="winner" width="140")
          template(#default="{ row }")
            span.text-sm.font-semibold(v-if="row.winner" style="color: #22c55e") {{ row.winner }}
            span.text-sm(v-else style="color: var(--text-muted)") --
        el-table-column(:label="$t('marketing.abTesting.confidence') || 'Confidence'" prop="confidence" width="130" align="center")
          template(#default="{ row }")
            span.text-sm.font-bold(:style="{ color: row.confidence >= 95 ? '#22c55e' : row.confidence >= 80 ? '#f59e0b' : 'var(--text-muted)' }") {{ row.confidence != null ? row.confidence + '%' : '--' }}
        el-table-column(:label="$t('common.actions') || 'Actions'" width="180" align="center")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-1(@click.stop)
              el-button(text size="small" type="success" @click.stop="openResultsDialog(row)" :disabled="row.status === 'DRAFT'")
                Icon(name="ph:chart-line-bold" size="16")
              el-button(text size="small" type="primary" @click.stop="openEditDialog(row)")
                Icon(name="ph:pencil-bold" size="16")
              el-button(text size="small" type="danger" @click.stop="handleDelete(row)")
                Icon(name="ph:trash-bold" size="16")

      .text-center.py-8(v-if="!filteredData.length && !loading")
        Icon(name="ph:flask" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') || 'No data found' }}

      .flex.justify-end.mt-4
        el-pagination(
          :current-page="pagination.page"
          :page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="(p: number) => { pagination.page = p; fetchData() }"
        )

  //- Create / Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingItem ? ($t('common.edit') || 'Edit') : ($t('marketing.abTesting.newTest') || 'New Test')" width="600px" destroy-on-close)
    el-form(:model="form" label-position="top" ref="formRef")
      el-form-item(:label="$t('common.name') || 'Name'" required)
        el-input(v-model="form.name" :placeholder="$t('marketing.abTesting.namePlaceholder') || 'e.g., Subject Line Test'")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('common.type') || 'Type'" required)
          el-select(v-model="form.type" class="w-full")
            el-option(v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value")
        el-form-item(:label="$t('common.status') || 'Status'" required)
          el-select(v-model="form.status" class="w-full")
            el-option(v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('common.startDate') || 'Start Date'")
          el-date-picker(v-model="form.startDate" type="date" class="w-full" value-format="YYYY-MM-DD")
        el-form-item(:label="$t('common.endDate') || 'End Date'")
          el-date-picker(v-model="form.endDate" type="date" class="w-full" value-format="YYYY-MM-DD")
      el-form-item(:label="$t('marketing.abTesting.variants') || 'Variants (JSON)'")
        el-input(v-model="form.variants" type="textarea" :rows="4" :placeholder="$t('marketing.abTesting.variantsPlaceholder') || '[{\"name\":\"Variant A\"},{\"name\":\"Variant B\"}]'")
      el-form-item(:label="$t('common.notes') || 'Notes'")
        el-input(v-model="form.notes" type="textarea" :rows="2" :placeholder="$t('marketing.abTesting.notesPlaceholder') || 'Additional notes about this test'")
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') || 'Save' }}

  //- Results Dialog
  el-dialog(v-model="resultsDialogVisible" :title="($t('marketing.abTesting.results') || 'Test Results') + (selectedTest ? ' - ' + selectedTest.name : '')" width="720px" destroy-on-close)
    .flex.items-center.justify-center.py-8(v-if="loadingResults")
      el-icon.is-loading(:size="24" style="color: var(--accent-color, #7849ff)")
    template(v-else-if="testResults")
      //- Statistical Significance & Confidence
      .glass-card.p-5.mb-6
        .flex.items-center.justify-between.mb-4
          .flex.items-center.gap-3
            h4.text-base.font-bold(style="color: var(--text-primary)") {{ $t('marketing.abTesting.statisticalAnalysis') || 'Statistical Analysis' }}
            el-tag(
              :type="testResults.isSignificant ? 'success' : 'info'"
              size="default"
              effect="dark"
              round
            ) {{ testResults.isSignificant ? ($t('marketing.abTesting.significant') || 'Significant') : ($t('marketing.abTesting.notSignificant') || 'Not Significant') }}
          .text-right
            p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('marketing.abTesting.confidence') || 'Confidence Level' }}
            p.text-2xl.font-bold(:style="{ color: testResults.confidence >= 95 ? '#22c55e' : testResults.confidence >= 80 ? '#f59e0b' : 'var(--text-muted)' }") {{ testResults.confidence != null ? testResults.confidence.toFixed(1) + '%' : '--' }}

      //- Variants Table
      .glass-card.p-5.mb-6
        h4.text-base.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('marketing.abTesting.variantResults') || 'Variant Results' }}
        el-table(:data="testResults.variants || []" style="width: 100%" stripe)
          el-table-column(:label="$t('marketing.abTesting.variant') || 'Variant'" prop="name" min-width="150")
            template(#default="{ row }")
              .flex.items-center.gap-2
                span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                el-tag(v-if="testResults.winner === row.name" type="success" size="small" effect="dark" round)
                  Icon(name="ph:trophy-bold" size="12" class="mr-1")
                  | {{ $t('marketing.abTesting.winner') || 'Winner' }}
          el-table-column(:label="$t('marketing.abTesting.impressions') || 'Impressions'" prop="impressions" width="140" align="center")
            template(#default="{ row }")
              span.text-sm.font-bold(style="color: var(--text-primary)") {{ (row.impressions || 0).toLocaleString() }}
          el-table-column(:label="$t('marketing.abTesting.conversions') || 'Conversions'" prop="conversions" width="140" align="center")
            template(#default="{ row }")
              span.text-sm.font-bold(style="color: #3b82f6") {{ (row.conversions || 0).toLocaleString() }}
          el-table-column(:label="$t('marketing.abTesting.conversionRate') || 'Conversion Rate'" width="160" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-2
                el-progress(
                  :percentage="row.impressions ? Math.round((row.conversions / row.impressions) * 10000) / 100 : 0"
                  :stroke-width="8"
                  :show-text="false"
                  :color="row.impressions && (row.conversions / row.impressions) >= 0.05 ? '#22c55e' : '#f59e0b'"
                  style="width: 60px"
                )
                span.text-sm.font-bold(:style="{ color: row.impressions && (row.conversions / row.impressions) >= 0.05 ? '#22c55e' : '#f59e0b' }") {{ row.impressions ? ((row.conversions / row.impressions) * 100).toFixed(2) : '0.00' }}%

      //- Declare Winner
      .flex.justify-center(v-if="selectedTest && selectedTest.status !== 'DRAFT' && !selectedTest.winner")
        el-button(type="success" size="large" class="!rounded-2xl" @click="declareWinner" :loading="declaringWinner")
          Icon(name="ph:trophy-bold" size="16" class="mr-1")
          | {{ $t('marketing.abTesting.declareWinner') || 'Declare Winner' }}

    template(v-else)
      .text-center.py-8
        Icon(name="ph:chart-line" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('marketing.abTesting.noResults') || 'No results available yet' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const resultsDialogVisible = ref(false);
const loadingResults = ref(false);
const declaringWinner = ref(false);
const editingItem = ref<any>(null);
const selectedTest = ref<any>(null);
const testResults = ref<any>(null);
const search = ref('');
const filterStatus = ref('');
const items = ref<any[]>([]);
const pagination = reactive({ page: 1, limit: 20, total: 0 });

const typeOptions = [
  { label: 'Email', value: 'EMAIL' },
  { label: 'Landing Page', value: 'LANDING_PAGE' },
  { label: 'CTA', value: 'CTA' },
  { label: 'Pricing', value: 'PRICING' },
  { label: 'Ad Copy', value: 'AD_COPY' }
];

const statusOptions = [
  { label: t('marketing.abTesting.draft') || 'Draft', value: 'DRAFT' },
  { label: t('marketing.abTesting.running') || 'Running', value: 'RUNNING' },
  { label: t('marketing.abTesting.paused') || 'Paused', value: 'PAUSED' },
  { label: t('marketing.abTesting.completed') || 'Completed', value: 'COMPLETED' }
];

const defaultForm = () => ({
  name: '',
  type: 'EMAIL',
  status: 'DRAFT',
  startDate: '',
  endDate: '',
  variants: '',
  notes: ''
});

const form = ref(defaultForm());

// Stats
const summaryStats = computed(() => {
  const data = items.value;
  const total = data.length;
  const running = data.filter((i: any) => i.status === 'RUNNING').length;
  const completed = data.filter((i: any) => i.status === 'COMPLETED').length;
  const confidences = data.filter((i: any) => i.confidence != null).map((i: any) => i.confidence);
  const avgConf = confidences.length ? Math.round(confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length) : 0;
  return [
    { label: t('marketing.abTesting.totalTests') || 'Total Tests', value: total, icon: 'ph:flask-bold', color: '#7849ff' },
    { label: t('marketing.abTesting.running') || 'Running', value: running, icon: 'ph:play-circle-bold', color: '#3b82f6' },
    { label: t('marketing.abTesting.completed') || 'Completed', value: completed, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('marketing.abTesting.avgConfidence') || 'Avg Confidence', value: avgConf + '%', icon: 'ph:chart-bar-bold', color: '#f59e0b' }
  ];
});

const filteredData = computed(() => {
  let data = items.value;
  if (filterStatus.value) {
    data = data.filter((i: any) => i.status === filterStatus.value);
  }
  if (!search.value) return data;
  const q = search.value.toLowerCase();
  return data.filter((i: any) =>
    (i.name || '').toLowerCase().includes(q) ||
    (i.type || '').toLowerCase().includes(q) ||
    (i.winner || '').toLowerCase().includes(q)
  );
});

function getStatusType(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'info',
    RUNNING: '',
    PAUSED: 'warning',
    COMPLETED: 'success'
  };
  return map[status] || 'info';
}

function formatDate(d: string): string {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

function handleRowClick(row: any) {
  openEditDialog(row);
}

// CRUD
async function fetchData() {
  loading.value = true;
  try {
    const res = await useApiFetch(`ab-tests?page=${pagination.page}&limit=${pagination.limit}`);
    if (res.success && res.body) {
      const data = res.body as any;
      items.value = (data.docs || data.rows || (Array.isArray(data) ? data : [])).map((item: any) => ({
        ...item,
        winner: item.winnerVariant || null,
        confidence: item.confidence != null ? Number(item.confidence) : null
      }));
      pagination.total = data.pagination?.totalItems ?? data.count ?? data.total ?? items.value.length;
    }
  } catch (err) {
    ElMessage.error(t('common.error') || 'Failed to load data');
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  editingItem.value = null;
  form.value = defaultForm();
  dialogVisible.value = true;
}

function openEditDialog(item: any) {
  editingItem.value = item;
  form.value = {
    name: item.name || '',
    type: item.type || 'EMAIL',
    status: item.status || 'DRAFT',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    variants: item.variants ? (typeof item.variants === 'string' ? item.variants : JSON.stringify(item.variants, null, 2)) : '',
    notes: item.notes || ''
  };
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.name.trim()) {
    ElMessage.warning(t('common.fillRequired') || 'Please fill in required fields');
    return;
  }
  saving.value = true;
  try {
    let parsedVariants = form.value.variants;
    if (typeof parsedVariants === 'string' && parsedVariants.trim()) {
      try {
        parsedVariants = JSON.parse(parsedVariants);
      } catch {
        // Keep as string if not valid JSON
      }
    }

    const payload = { ...form.value, variants: parsedVariants };

    if (editingItem.value) {
      const res = await useApiFetch(`ab-tests/${editingItem.value.id}`, 'PUT', payload);
      if (res.success) {
        ElMessage.success(t('common.saved') || 'Saved successfully');
      } else {
        ElMessage.error(res.message || t('common.error') || 'Save failed');
      }
    } else {
      const res = await useApiFetch('ab-tests', 'POST', payload);
      if (res.success) {
        ElMessage.success(t('common.saved') || 'Created successfully');
      } else {
        ElMessage.error(res.message || t('common.error') || 'Create failed');
      }
    }
    dialogVisible.value = false;
    await fetchData();
  } catch (err) {
    ElMessage.error(t('common.error') || 'An error occurred');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(item: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure you want to delete this item?',
      t('common.warning') || 'Warning',
      { type: 'warning', confirmButtonText: t('common.delete') || 'Delete', cancelButtonText: t('common.cancel') || 'Cancel' }
    );
    const res = await useApiFetch(`ab-tests/${item.id}`, 'DELETE');
    if (res.success) {
      ElMessage.success(t('common.deleted') || 'Deleted successfully');
      await fetchData();
    } else {
      ElMessage.error(res.message || t('common.error') || 'Delete failed');
    }
  } catch {
    // User cancelled
  }
}

// Results
async function openResultsDialog(test: any) {
  selectedTest.value = test;
  testResults.value = null;
  resultsDialogVisible.value = true;
  loadingResults.value = true;
  try {
    const res = await useApiFetch(`ab-tests/${test.id}/results`);
    if (res.success && res.body) {
      const data = res.body as any;
      // Derive overall significance and confidence from variant significance data
      const variantsWithSig = (data.variants || []).filter((v: any) => v.significance);
      const bestSignificance = variantsWithSig.length > 0
        ? variantsWithSig.reduce((best: any, v: any) => (v.significance.confidenceLevel > (best?.confidenceLevel || 0)) ? v.significance : best, null)
        : null;
      testResults.value = {
        ...data,
        winner: test.winner || test.winnerVariant || null,
        isSignificant: bestSignificance?.isSignificant || false,
        confidence: bestSignificance?.confidenceLevel ?? (test.confidence != null ? Number(test.confidence) : null)
      };
    }
  } catch {
    ElMessage.error(t('common.error') || 'Failed to load results');
  } finally {
    loadingResults.value = false;
  }
}

async function declareWinner() {
  if (!selectedTest.value) return;
  try {
    await ElMessageBox.confirm(
      t('marketing.abTesting.confirmDeclareWinner') || 'Are you sure you want to declare the winner based on the current results? This action cannot be undone.',
      t('common.warning') || 'Warning',
      { type: 'warning', confirmButtonText: t('marketing.abTesting.declareWinner') || 'Declare Winner', cancelButtonText: t('common.cancel') || 'Cancel' }
    );
    declaringWinner.value = true;
    const res = await useApiFetch(`ab-tests/${selectedTest.value.id}/declare-winner`, 'PUT');
    if (res.success) {
      ElMessage.success(t('marketing.abTesting.winnerDeclared') || 'Winner declared successfully');
      resultsDialogVisible.value = false;
      await fetchData();
    } else {
      ElMessage.error(res.message || t('common.error') || 'Failed to declare winner');
    }
  } catch {
    // User cancelled
  } finally {
    declaringWinner.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.glass-card {
  border-radius: 16px;
}
</style>
