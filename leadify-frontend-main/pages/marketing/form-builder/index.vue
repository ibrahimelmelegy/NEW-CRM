<template lang="pug">
div
  ModuleHeader(
    :title="$t('marketing.formBuilder.title')"
    :subtitle="$t('marketing.formBuilder.subtitle')"
  )
    template(#actions)
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openCreateDialog()")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('marketing.formBuilder.newForm') }}

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
          :placeholder="$t('common.search')"
          clearable
          style="max-width: 280px"
          size="large"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      el-table(
        :data="filteredData"
        v-loading="loading"
        style="width: 100%"
        stripe
      )
        el-table-column(:label="$t('common.name')" prop="name" min-width="220" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-3
              .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.1)")
                Icon(name="ph:note-pencil-bold" size="18" style="color: #7849ff")
              div
                p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                p.text-xs(v-if="row.description" style="color: var(--text-muted)") {{ row.description?.substring(0, 50) }}{{ row.description?.length > 50 ? '...' : '' }}
        el-table-column(:label="$t('common.status')" prop="status" width="130" sortable)
          template(#default="{ row }")
            el-tag(:type="row.status === 'ACTIVE' ? 'success' : row.status === 'DRAFT' ? 'info' : 'warning'" size="small" effect="dark") {{ row.status }}
        el-table-column(:label="$t('marketing.formBuilder.fields')" prop="fieldsCount" width="100" align="center" sortable)
          template(#default="{ row }")
            span.text-sm {{ row.fieldsCount || 0 }}
        el-table-column(:label="$t('marketing.formBuilder.submissions')" prop="submissionCount" width="140" align="center" sortable)
          template(#default="{ row }")
            el-button(v-if="row.submissionCount > 0" text type="primary" size="small" @click.stop="openSubmissionsDialog(row)")
              span.font-bold {{ row.submissionCount || 0 }}
              Icon(name="ph:arrow-square-out" size="14" class="ml-1")
            span.text-sm(v-else style="color: var(--text-muted)") 0
        el-table-column(:label="$t('common.createdAt')" prop="createdAt" width="150" sortable)
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.createdAt) }}
        el-table-column(:label="$t('common.actions')" width="160" align="center")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-1
              el-button(text size="small" type="success" @click.stop="openAnalyticsDialog(row)")
                Icon(name="ph:chart-bar-bold" size="16")
              el-button(text size="small" type="primary" @click.stop="openEditDialog(row)")
                Icon(name="ph:pencil-bold" size="16")
              el-button(text size="small" type="danger" @click.stop="handleDelete(row)")
                Icon(name="ph:trash-bold" size="16")

      .text-center.py-8(v-if="!filteredData.length && !loading")
        Icon(name="ph:note-pencil" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .flex.justify-end.mt-4
        el-pagination(
          :current-page="pagination.page"
          :page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="(p: number) => { pagination.page = p; fetchData() }"
        )

  //- Create / Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingItem ? $t('common.edit') : $t('marketing.formBuilder.newForm')" width="560px" destroy-on-close)
    el-form(:model="form" label-position="top")
      el-form-item(:label="$t('common.name')" required)
        el-input(v-model="form.name" :placeholder="$t('marketing.formBuilder.namePlaceholder')")
      el-form-item(:label="$t('common.description')")
        el-input(v-model="form.description" type="textarea" :rows="2" :placeholder="$t('marketing.formBuilder.descPlaceholder')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('common.status')")
          el-select(v-model="form.status" class="w-full")
            el-option(label="Draft" value="DRAFT")
            el-option(label="Active" value="ACTIVE")
            el-option(label="Inactive" value="INACTIVE")
        el-form-item(:label="$t('marketing.formBuilder.createLead')")
          .pt-2
            el-checkbox(v-model="form.createLead") {{ $t('marketing.formBuilder.autoCreateLead') }}
      el-form-item(:label="$t('marketing.formBuilder.thankYouMessage')")
        el-input(v-model="form.thankYouMessage" type="textarea" :rows="2" :placeholder="$t('marketing.formBuilder.thankYouPlaceholder')")

      //- Field Builder (preview)
      el-form-item(:label="$t('marketing.formBuilder.formFields')")
        .glass-card.p-4
          p.text-xs.mb-3(style="color: var(--text-muted)") {{ $t('marketing.formBuilder.dragDropInfo') }}
          .space-y-2
            .glass-card.p-3.flex.items-center.justify-between.cursor-move(v-for="(field, idx) in formFieldsPreview" :key="idx" style="border: 1px solid var(--border-default)")
              .flex.items-center.gap-2
                Icon(name="ph:dots-six-vertical" size="16" style="color: var(--text-muted)")
                span.text-sm.font-semibold(style="color: var(--text-primary)") {{ field.label || field.name }}
                el-tag(size="small" effect="plain") {{ field.type }}
              el-tag(v-if="field.required" type="danger" size="small" round) {{ $t('common.required') }}
          el-button(type="primary" plain class="!rounded-xl w-full mt-3" @click="openFieldEditor()")
            Icon(name="ph:pencil-simple-bold" size="14" class="mr-1")
            | {{ $t('marketing.formBuilder.editFields') }}

    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') }}

  //- Submissions Dialog
  el-dialog(v-model="submissionsDialogVisible" :title="$t('marketing.formBuilder.submissions') + (selectedForm ? ' - ' + selectedForm.name : '')" width="700px" destroy-on-close)
    .flex.items-center.justify-center.py-8(v-if="loadingSubmissions")
      el-icon.is-loading(:size="24" style="color: var(--accent-color, #7849ff)")
    template(v-else)
      el-table(:data="submissions" style="width: 100%" stripe max-height="400")
        el-table-column(label="#" type="index" width="60")
        el-table-column(:label="$t('marketing.formBuilder.submittedData')" min-width="300")
          template(#default="{ row }")
            .space-y-1
              .flex.items-center.gap-2(v-for="(val, key) in row.data || row.fields || {}" :key="key")
                span.text-xs.font-semibold(style="color: var(--text-muted)") {{ key }}:
                span.text-xs(style="color: var(--text-primary)") {{ val }}
        el-table-column(:label="$t('common.createdAt')" prop="createdAt" width="160")
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.createdAt) }}
      .text-center.py-6(v-if="!submissions.length")
        Icon(name="ph:inbox" size="40" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('marketing.formBuilder.noSubmissions') }}

  //- Analytics Dialog
  el-dialog(v-model="analyticsDialogVisible" :title="$t('marketing.formBuilder.analytics') + (analyticsForm ? ' - ' + analyticsForm.name : '')" width="680px" destroy-on-close)
    .flex.items-center.justify-center.py-8(v-if="loadingAnalytics")
      el-icon.is-loading(:size="24" style="color: var(--accent-color, #7849ff)")
    template(v-else-if="formAnalytics")
      //- Total Submissions KPI
      .glass-card.p-5.mb-5
        .flex.items-center.justify-between
          .flex.items-center.gap-3
            .w-12.h-12.rounded-2xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
              Icon(name="ph:paper-plane-tilt-bold" size="24" style="color: #7849ff")
            div
              p.text-xs.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('marketing.formBuilder.totalSubmissions') }}
              p.text-2xl.font-bold(style="color: #7849ff") {{ (formAnalytics.totalSubmissions || 0).toLocaleString() }}
          div(v-if="formAnalytics.conversionRate != null")
            p.text-xs.uppercase.tracking-wider.text-right(style="color: var(--text-muted)") {{ $t('marketing.formBuilder.conversionRate') }}
            p.text-2xl.font-bold.text-right(style="color: #22c55e") {{ formAnalytics.conversionRate.toFixed(1) }}%

      //- Daily Trend
      .glass-card.p-5.mb-5(v-if="formAnalytics.dailyTrend && formAnalytics.dailyTrend.length")
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:chart-line-up-bold" size="18" style="color: #3b82f6")
          h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('marketing.formBuilder.dailyTrend') }}
        .flex.items-end.gap-1(style="height: 120px")
          .flex.flex-col.items-center.flex-1(v-for="day in formAnalytics.dailyTrend" :key="day.date")
            .w-full.rounded-t-md.transition-all(
              :style="{ height: maxDailyCount > 0 ? Math.max((day.count / maxDailyCount) * 100, 4) + 'px' : '4px', background: 'linear-gradient(to top, #7849ff, #a78bfa)', minHeight: '4px' }"
            )
            p.text-xs.mt-1(style="color: var(--text-muted); font-size: 10px; writing-mode: vertical-lr; transform: rotate(180deg); height: 40px") {{ formatShortDate(day.date) }}
        .flex.items-center.justify-between.mt-2
          span.text-xs(style="color: var(--text-muted)") {{ formAnalytics.dailyTrend.length }} {{ $t('common.days') }}
          span.text-xs.font-semibold(style="color: var(--text-primary)") {{ $t('marketing.formBuilder.total') }}: {{ formAnalytics.dailyTrend.reduce((s, d) => s + (d.count || 0), 0) }}

      //- Field Completion Rates
      .glass-card.p-5(v-if="formAnalytics.fieldCompletionRates && formAnalytics.fieldCompletionRates.length")
        .flex.items-center.gap-2.mb-4
          Icon(name="ph:list-checks-bold" size="18" style="color: #22c55e")
          h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('marketing.formBuilder.fieldCompletionRates') }}
        .space-y-3
          .flex.items-center.gap-3(v-for="field in formAnalytics.fieldCompletionRates" :key="field.field")
            span.text-sm.font-medium.shrink-0(style="color: var(--text-primary); width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap") {{ field.field }}
            el-progress(
              :percentage="field.rate || 0"
              :stroke-width="10"
              :color="field.rate >= 80 ? '#22c55e' : field.rate >= 50 ? '#f59e0b' : '#ef4444'"
              style="flex: 1"
            )

    template(v-else)
      .text-center.py-8
        Icon(name="ph:chart-bar" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('marketing.formBuilder.noAnalytics') }}
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
const submissionsDialogVisible = ref(false);
const analyticsDialogVisible = ref(false);
const loadingSubmissions = ref(false);
const loadingAnalytics = ref(false);
const editingItem = ref<any>(null);
const selectedForm = ref<any>(null);
const analyticsForm = ref<any>(null);
const formAnalytics = ref<any>(null);
const search = ref('');
const items = ref<any[]>([]);
const pagination = reactive({ page: 1, limit: 20, total: 0 });
const submissions = ref<any[]>([]);

const defaultForm = () => ({
  name: '',
  description: '',
  status: 'DRAFT',
  thankYouMessage: '',
  createLead: false,
  fields: []
});

const form = ref(defaultForm());
const formFieldsPreview = ref<any[]>([]);

// Stats
const summaryStats = computed(() => {
  const data = items.value;
  const total = data.length;
  const active = data.filter((i: any) => i.status === 'ACTIVE').length;
  const totalSubs = data.reduce((sum: number, i: any) => sum + (i.submissionCount || 0), 0);
  return [
    { label: t('marketing.formBuilder.totalForms'), value: total, icon: 'ph:note-pencil-bold', color: '#7849ff' },
    { label: t('marketing.formBuilder.activeForms'), value: active, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('marketing.formBuilder.totalSubmissions'), value: totalSubs, icon: 'ph:paper-plane-tilt-bold', color: '#3b82f6' }
  ];
});

const filteredData = computed(() => {
  if (!search.value) return items.value;
  const q = search.value.toLowerCase();
  return items.value.filter((i: any) =>
    (i.name || '').toLowerCase().includes(q) ||
    (i.description || '').toLowerCase().includes(q)
  );
});

function formatDate(d: string): string {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

// CRUD
async function fetchData() {
  loading.value = true;
  try {
    const res = await useApiFetch(`form-builder/templates?page=${pagination.page}&limit=${pagination.limit}`);
    if (res.success && res.body) {
      const data = res.body as any;
      const rawItems = data.rows || data.docs || (Array.isArray(data) ? data : []);
      items.value = rawItems.map((item: any) => ({
        ...item,
        fieldsCount: item.fieldsCount ?? (Array.isArray(item.fields) ? item.fields.length : 0)
      }));
      pagination.total = data.count ?? data.total ?? data.pagination?.totalItems ?? items.value.length;
    }
  } catch {
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

function openEditDialog(item: any) {
  editingItem.value = item;
  formFieldsPreview.value = item.fields && Array.isArray(item.fields) ? item.fields : [];
  form.value = {
    name: item.name || '',
    description: item.description || '',
    status: item.status || 'DRAFT',
    thankYouMessage: item.thankYouMessage || '',
    createLead: item.createLead || false,
    fields: formFieldsPreview.value as any
  };
  dialogVisible.value = true;
}

function openFieldEditor() {
  ElMessage.info(t('marketing.formBuilder.fieldEditorInfo'));
}

async function handleSave() {
  if (!form.value.name.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form.value };

    if (editingItem.value) {
      const res = await useApiFetch(`form-builder/templates/${editingItem.value.id}`, 'PUT', payload);
      if (res.success) {
        ElMessage.success(t('common.saved'));
      } else {
        ElMessage.error(res.message || t('common.error'));
      }
    } else {
      const res = await useApiFetch('form-builder/templates', 'POST', payload);
      if (res.success) {
        ElMessage.success(t('common.saved'));
      } else {
        ElMessage.error(res.message || t('common.error'));
      }
    }
    dialogVisible.value = false;
    await fetchData();
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(item: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete'),
      t('common.warning'),
      { type: 'warning', confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel') }
    );
    const res = await useApiFetch(`form-builder/templates/${item.id}`, 'DELETE');
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

async function openSubmissionsDialog(formItem: any) {
  selectedForm.value = formItem;
  submissionsDialogVisible.value = true;
  loadingSubmissions.value = true;
  try {
    const res = await useApiFetch(`form-builder/submissions?formId=${formItem.id}`);
    if (res.success && res.body) {
      submissions.value = Array.isArray(res.body) ? res.body : (res.body as any).docs || [];
    } else {
      submissions.value = [];
    }
  } catch {
    submissions.value = [];
    ElMessage.error(t('common.error'));
  } finally {
    loadingSubmissions.value = false;
  }
}

// Analytics
async function openAnalyticsDialog(formItem: any) {
  analyticsForm.value = formItem;
  formAnalytics.value = null;
  analyticsDialogVisible.value = true;
  loadingAnalytics.value = true;
  try {
    const res = await useApiFetch(`form-builder/templates/${formItem.id}/analytics`);
    if (res.success && res.body) {
      formAnalytics.value = res.body;
    }
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    loadingAnalytics.value = false;
  }
}

const maxDailyCount = computed(() => {
  if (!formAnalytics.value?.dailyTrend?.length) return 0;
  return Math.max(...formAnalytics.value.dailyTrend.map((d: any) => d.count || 0));
});

function formatShortDate(d: string): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return d;
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
