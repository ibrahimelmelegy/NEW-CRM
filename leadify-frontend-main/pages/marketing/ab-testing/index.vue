<template lang="pug">
div
  ModuleHeader(
    :title="$t('marketing.abTesting.title')"
    :subtitle="$t('marketing.abTesting.subtitle')"
  )
    template(#actions)
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openCreateDialog()")
        Icon(name="ph:flask-bold" size="16")
        span.ml-1 {{ $t('marketing.abTesting.newTest') }}

  StatCards(:stats="summaryStats")

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Mobile Card View
  .grid.gap-4.mb-6(v-if="!loading && isMobileView" class="grid-cols-1 md:grid-cols-2")
    .glass-card.p-5.rounded-2xl(v-for="test in filteredData" :key="test.id" @click="openEditDialog(test)")
      .flex.items-center.justify-between.mb-3
        h3.text-base.font-bold(style="color: var(--text-primary)") {{ test.name }}
        el-tag(:type="getStatusType(test.status)" size="small" effect="dark") {{ test.status }}
      .space-y-2
        .flex.items-center.justify-between
          span.text-xs(style="color: var(--text-muted)") {{ $t('common.type') }}
          el-tag(size="small" effect="plain") {{ test.type }}
        .flex.items-center.justify-between(v-if="test.winner")
          span.text-xs(style="color: var(--text-muted)") {{ $t('marketing.abTesting.winner') }}
          span.text-sm.font-semibold(style="color: #22c55e") {{ test.winner }}
        .flex.items-center.justify-between(v-if="test.confidence != null")
          span.text-xs(style="color: var(--text-muted)") {{ $t('marketing.abTesting.confidence') }}
          span.text-sm.font-bold(:style="{ color: test.confidence >= 95 ? '#22c55e' : test.confidence >= 80 ? '#f59e0b' : 'var(--text-muted)' }") {{ test.confidence }}%
      .flex.items-center.gap-2.mt-4(@click.stop)
        el-button(text size="small" type="success" @click="openResultsDialog(test)" :disabled="test.status === 'DRAFT'")
          Icon(name="ph:chart-line-bold" size="14")
        el-button(text size="small" type="primary" @click="openEditDialog(test)")
          Icon(name="ph:pencil-bold" size="14")
        el-button(text size="small" type="danger" @click="handleDelete(test)")
          Icon(name="ph:trash-bold" size="14")

  //- Table (Desktop)
  template(v-else-if="!loading && !isMobileView")
    .glass-card.p-6
      .flex.items-center.justify-between.mb-4
        el-input(
          v-model="search"
          :placeholder="$t('common.search')"
          clearable
          style="max-width: 280px"
          size="large"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
        .flex.items-center.gap-2
          el-button(size="default" @click="showSampleSizeCalculator = true")
            Icon(name="ph:calculator" size="14" class="mr-1")
            | {{ $t('marketing.abTesting.sampleSizeCalc') }}
          el-select(v-model="filterStatus" clearable :placeholder="$t('common.status')" style="width: 160px")
            el-option(v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value")

      el-table(
        :data="filteredData"
        v-loading="loading"
        style="width: 100%"
        @row-click="handleRowClick"
        row-class-name="cursor-pointer"
        stripe
      )
        el-table-column(:label="$t('common.name')" prop="name" min-width="200" sortable)
        el-table-column(:label="$t('common.type')" prop="type" width="150" sortable)
          template(#default="{ row }")
            el-tag(size="small" effect="plain") {{ row.type }}
        el-table-column(:label="$t('common.status')" prop="status" width="140" sortable)
          template(#default="{ row }")
            el-tag(:type="getStatusType(row.status)" size="small" effect="dark") {{ row.status }}
        el-table-column(:label="$t('common.startDate')" prop="startDate" width="140" sortable)
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.startDate) }}
        el-table-column(:label="$t('common.endDate')" prop="endDate" width="140" sortable)
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.endDate) }}
        el-table-column(:label="$t('marketing.abTesting.winner')" prop="winner" width="140")
          template(#default="{ row }")
            span.text-sm.font-semibold(v-if="row.winner" style="color: #22c55e") {{ row.winner }}
            span.text-sm(v-else style="color: var(--text-muted)") --
        el-table-column(:label="$t('marketing.abTesting.confidence')" prop="confidence" width="130" align="center")
          template(#default="{ row }")
            span.text-sm.font-bold(:style="{ color: row.confidence >= 95 ? '#22c55e' : row.confidence >= 80 ? '#f59e0b' : 'var(--text-muted)' }") {{ row.confidence != null ? row.confidence + '%' : '--' }}
        el-table-column(:label="$t('common.actions')" width="180" align="center")
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
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .flex.justify-end.mt-4
        el-pagination(
          :current-page="pagination.page"
          :page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="(p: number) => { pagination.page = p; fetchData() }"
        )

  //- Sample Size Calculator Dialog
  el-dialog(v-model="showSampleSizeCalculator" :title="$t('marketing.abTesting.sampleSizeCalc')" width="560px")
    .glass-card.p-5.mb-4
      .flex.items-center.gap-2.mb-3
        Icon(name="ph:info-bold" size="18" style="color: #3b82f6")
        h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('marketing.abTesting.calcInstructions') }}
      p.text-xs(style="color: var(--text-muted)") {{ $t('marketing.abTesting.calcInstructionsText') }}
    el-form(label-position="top")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('marketing.abTesting.baselineConversion')")
          el-input-number(v-model="sampleCalc.baselineConversion" :min="0" :max="100" :precision="2" class="!w-full")
            template(#suffix)
              | %
        el-form-item(:label="$t('marketing.abTesting.minDetectableEffect')")
          el-input-number(v-model="sampleCalc.minEffect" :min="0" :max="100" :precision="2" class="!w-full")
            template(#suffix)
              | %
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('marketing.abTesting.confidenceLevel')")
          el-select(v-model="sampleCalc.confidenceLevel" class="w-full")
            el-option(label="90%" :value="90")
            el-option(label="95%" :value="95")
            el-option(label="99%" :value="99")
        el-form-item(:label="$t('marketing.abTesting.statisticalPower')")
          el-select(v-model="sampleCalc.power" class="w-full")
            el-option(label="80%" :value="80")
            el-option(label="90%" :value="90")
            el-option(label="95%" :value="95")
    .glass-card.p-5.text-center
      p.text-xs.uppercase.tracking-wider.mb-2(style="color: var(--text-muted)") {{ $t('marketing.abTesting.recommendedSampleSize') }}
      p.text-4xl.font-bold(style="color: #7849ff") {{ calculatedSampleSize.toLocaleString() }}
      p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('marketing.abTesting.perVariant') }}

  //- Create / Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingItem ? $t('common.edit') : $t('marketing.abTesting.newTest')" width="640px" destroy-on-close)
    el-form(:model="form" label-position="top" ref="formRef")
      el-form-item(:label="$t('common.name')" required)
        el-input(v-model="form.name" :placeholder="$t('marketing.abTesting.namePlaceholder')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('common.type')" required)
          el-select(v-model="form.type" class="w-full")
            el-option(v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value")
        el-form-item(:label="$t('common.status')" required)
          el-select(v-model="form.status" class="w-full")
            el-option(v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('common.startDate')")
          el-date-picker(v-model="form.startDate" type="date" class="w-full" value-format="YYYY-MM-DD")
        el-form-item(:label="$t('common.endDate')")
          el-date-picker(v-model="form.endDate" type="date" class="w-full" value-format="YYYY-MM-DD")
      el-form-item(:label="$t('marketing.abTesting.variants')")
        .space-y-2
          .flex.items-center.gap-2(v-for="(variant, idx) in formVariants" :key="idx")
            el-input(v-model="variant.name" :placeholder="`${$t('marketing.abTesting.variant')} ${idx + 1}`")
            el-button(text type="danger" @click="formVariants.splice(idx, 1)" :disabled="formVariants.length <= 2")
              Icon(name="ph:x-bold" size="14")
          el-button(type="primary" plain size="small" @click="formVariants.push({ name: '' })")
            Icon(name="ph:plus-bold" size="12" class="mr-1")
            | {{ $t('marketing.abTesting.addVariant') }}
      el-form-item(:label="$t('common.notes')")
        el-input(v-model="form.notes" type="textarea" :rows="2" :placeholder="$t('marketing.abTesting.notesPlaceholder')")
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') }}

  //- Results Dialog
  el-dialog(v-model="resultsDialogVisible" :title="$t('marketing.abTesting.results') + (selectedTest ? ' - ' + selectedTest.name : '')" width="720px" destroy-on-close)
    .flex.items-center.justify-center.py-8(v-if="loadingResults")
      el-icon.is-loading(:size="24" style="color: var(--accent-color, #7849ff)")
    template(v-else-if="testResults")
      //- Statistical Significance & Confidence
      .glass-card.p-5.mb-6
        .flex.items-center.justify-between.mb-4
          .flex.items-center.gap-3
            h4.text-base.font-bold(style="color: var(--text-primary)") {{ $t('marketing.abTesting.statisticalAnalysis') }}
            el-tag(
              :type="testResults.isSignificant ? 'success' : 'info'"
              size="default"
              effect="dark"
              round
            ) {{ testResults.isSignificant ? $t('marketing.abTesting.significant') : $t('marketing.abTesting.notSignificant') }}
          .text-right
            p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('marketing.abTesting.confidence') }}
            p.text-2xl.font-bold(:style="{ color: testResults.confidence >= 95 ? '#22c55e' : testResults.confidence >= 80 ? '#f59e0b' : 'var(--text-muted)' }") {{ testResults.confidence != null ? testResults.confidence.toFixed(1) + '%' : '--' }}

      //- Variants Table
      .glass-card.p-5.mb-6
        h4.text-base.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('marketing.abTesting.variantResults') }}
        el-table(:data="testResults.variants || []" style="width: 100%" stripe)
          el-table-column(:label="$t('marketing.abTesting.variant')" prop="name" min-width="150")
            template(#default="{ row }")
              .flex.items-center.gap-2
                span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                el-tag(v-if="testResults.winner === row.name" type="success" size="small" effect="dark" round)
                  Icon(name="ph:trophy-bold" size="12" class="mr-1")
                  | {{ $t('marketing.abTesting.winner') }}
          el-table-column(:label="$t('marketing.abTesting.impressions')" prop="impressions" width="140" align="center")
            template(#default="{ row }")
              span.text-sm.font-bold(style="color: var(--text-primary)") {{ (row.impressions || 0).toLocaleString() }}
          el-table-column(:label="$t('marketing.abTesting.conversions')" prop="conversions" width="140" align="center")
            template(#default="{ row }")
              span.text-sm.font-bold(style="color: #3b82f6") {{ (row.conversions || 0).toLocaleString() }}
          el-table-column(:label="$t('marketing.abTesting.conversionRate')" width="160" align="center")
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
          | {{ $t('marketing.abTesting.declareWinner') }}

    template(v-else)
      .text-center.py-8
        Icon(name="ph:chart-line" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('marketing.abTesting.noResults') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const resultsDialogVisible = ref(false);
const showSampleSizeCalculator = ref(false);
const loadingResults = ref(false);
const declaringWinner = ref(false);
const editingItem = ref<Record<string, unknown> | null>(null);
const selectedTest = ref<Record<string, unknown> | null>(null);
const testResults = ref<Record<string, unknown> | null>(null);
const search = ref('');
const filterStatus = ref('');
const items = ref<Record<string, unknown>[]>([]);
const pagination = reactive({ page: 1, limit: 20, total: 0 });
const isMobileView = ref(false);
const formVariants = ref<Record<string, unknown>[]>([{ name: 'Variant A' }, { name: 'Variant B' }]);

const sampleCalc = reactive({
  baselineConversion: 5,
  minEffect: 10,
  confidenceLevel: 95,
  power: 80
});

const calculatedSampleSize = computed(() => {
  const p1 = sampleCalc.baselineConversion / 100;
  const p2 = p1 * (1 + sampleCalc.minEffect / 100);
  const z_alpha = sampleCalc.confidenceLevel === 95 ? 1.96 : sampleCalc.confidenceLevel === 99 ? 2.576 : 1.645;
  const z_beta = sampleCalc.power === 80 ? 0.84 : sampleCalc.power === 90 ? 1.28 : 1.645;
  const pooled = (p1 + p2) / 2;
  const n = Math.ceil(
    (Math.pow(z_alpha, 2) * 2 * pooled * (1 - pooled) + Math.pow(z_beta, 2) * (p1 * (1 - p1) + p2 * (1 - p2))) / Math.pow(p2 - p1, 2)
  );
  return n > 0 ? n : 0;
});

const typeOptions = [
  { label: 'Email', value: 'EMAIL' },
  { label: 'Landing Page', value: 'LANDING_PAGE' },
  { label: 'CTA', value: 'CTA' },
  { label: 'Pricing', value: 'PRICING' },
  { label: 'Ad Copy', value: 'AD_COPY' }
];

const statusOptions = [
  { label: t('marketing.abTesting.draft'), value: 'DRAFT' },
  { label: t('marketing.abTesting.running'), value: 'RUNNING' },
  { label: t('marketing.abTesting.paused'), value: 'PAUSED' },
  { label: t('marketing.abTesting.completed'), value: 'COMPLETED' }
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
  const running = data.filter(i => i.status === 'RUNNING').length;
  const completed = data.filter(i => i.status === 'COMPLETED').length;
  const confidences = data.filter(i => i.confidence !== null && i.confidence !== undefined).map(i => i.confidence);
  const avgConf = confidences.length ? Math.round(confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length) : 0;
  return [
    { label: t('marketing.abTesting.totalTests'), value: total, icon: 'ph:flask-bold', color: '#7849ff' },
    { label: t('marketing.abTesting.running'), value: running, icon: 'ph:play-circle-bold', color: '#3b82f6' },
    { label: t('marketing.abTesting.completed'), value: completed, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('marketing.abTesting.avgConfidence'), value: avgConf + '%', icon: 'ph:chart-bar-bold', color: '#f59e0b' }
  ];
});

const filteredData = computed(() => {
  let data = items.value;
  if (filterStatus.value) {
    data = data.filter(i => i.status === filterStatus.value);
  }
  if (!search.value) return data;
  const q = search.value.toLowerCase();
  return data.filter(
    (i: unknown) => (i.name || '').toLowerCase().includes(q) || (i.type || '').toLowerCase().includes(q) || (i.winner || '').toLowerCase().includes(q)
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

function handleRowClick(row: unknown) {
  openEditDialog(row);
}

// CRUD
async function fetchData() {
  loading.value = true;
  try {
    const res = await useApiFetch(`ab-tests?page=${pagination.page}&limit=${pagination.limit}`);
    if (res.success && res.body) {
      const data = res.body as unknown;
      items.value = (data.docs || data.rows || (Array.isArray(data) ? data : [])).map(item => ({
        ...item,
        winner: item.winnerVariant || null,
        confidence: item.confidence !== null && item.confidence !== undefined ? Number(item.confidence) : null
      }));
      pagination.total = data.pagination?.totalItems ?? data.count ?? data.total ?? items.value.length;
    }
  } catch (err) {
    ElMessage.error(t('common.error'));
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  editingItem.value = null;
  form.value = defaultForm();
  dialogVisible.value = true;
}

function openEditDialog(item: unknown) {
  editingItem.value = item;
  const variantsData = item.variants
    ? typeof item.variants === 'string'
      ? JSON.parse(item.variants)
      : item.variants
    : [{ name: 'Variant A' }, { name: 'Variant B' }];
  formVariants.value = Array.isArray(variantsData) ? variantsData : [{ name: 'Variant A' }, { name: 'Variant B' }];
  form.value = {
    name: item.name || '',
    type: item.type || 'EMAIL',
    status: item.status || 'DRAFT',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    variants: '',
    notes: item.notes || ''
  };
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.name.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    const validVariants = formVariants.value.filter(v => v.name.trim());
    if (validVariants.length < 2) {
      ElMessage.warning(t('marketing.abTesting.minTwoVariants'));
      saving.value = false;
      return;
    }

    const payload = { ...form.value, variants: validVariants };

    if (editingItem.value) {
      const res = await useApiFetch(`ab-tests/${editingItem.value.id}`, 'PUT', payload);
      if (res.success) {
        ElMessage.success(t('common.saved'));
      } else {
        ElMessage.error(res.message || t('common.error'));
      }
    } else {
      const res = await useApiFetch('ab-tests', 'POST', payload);
      if (res.success) {
        ElMessage.success(t('common.saved'));
      } else {
        ElMessage.error(res.message || t('common.error'));
      }
    }
    dialogVisible.value = false;
    await fetchData();
  } catch (err) {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(item: unknown) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });
    const res = await useApiFetch(`ab-tests/${item.id}`, 'DELETE');
    if (res.success) {
      ElMessage.success(t('common.deleted'));
      await fetchData();
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch {
    // User cancelled
  }
}

// Results
async function openResultsDialog(test: unknown) {
  selectedTest.value = test;
  testResults.value = null;
  resultsDialogVisible.value = true;
  loadingResults.value = true;
  try {
    const res = await useApiFetch(`ab-tests/${test.id}/results`);
    if (res.success && res.body) {
      const data = res.body as unknown;
      // Derive overall significance and confidence from variant significance data
      const variantsWithSig = (data.variants || []).filter(v => v.significance);
      const bestSignificance =
        variantsWithSig.length > 0
          ? variantsWithSig.reduce(
              (best: unknown, v: unknown) => (v.significance.confidenceLevel > (best?.confidenceLevel || 0) ? v.significance : best),
              null
            )
          : null;
      testResults.value = {
        ...data,
        winner: test.winner || test.winnerVariant || null,
        isSignificant: bestSignificance?.isSignificant || false,
        confidence: bestSignificance?.confidenceLevel ?? (test.confidence !== null && test.confidence !== undefined ? Number(test.confidence) : null)
      };
    }
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    loadingResults.value = false;
  }
}

async function declareWinner() {
  if (!selectedTest.value) return;
  try {
    await ElMessageBox.confirm(t('marketing.abTesting.confirmDeclareWinner'), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('marketing.abTesting.declareWinner'),
      cancelButtonText: t('common.cancel')
    });
    declaringWinner.value = true;
    const res = await useApiFetch(`ab-tests/${selectedTest.value.id}/declare-winner`, 'PUT');
    if (res.success) {
      ElMessage.success(t('marketing.abTesting.winnerDeclared'));
      resultsDialogVisible.value = false;
      await fetchData();
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch {
    // User cancelled
  } finally {
    declaringWinner.value = false;
  }
}

function checkMobileView() {
  isMobileView.value = window.innerWidth < 768;
}

onMounted(() => {
  fetchData();
  checkMobileView();
  window.addEventListener('resize', checkMobileView);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobileView);
});
</script>

<style lang="scss" scoped>
.glass-card {
  border-radius: 16px;
}
</style>
