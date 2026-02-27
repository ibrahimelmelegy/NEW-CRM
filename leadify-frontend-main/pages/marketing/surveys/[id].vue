<template lang="pug">
div
  //- Breadcrumb Header
  .flex.items-center.justify-between.mb-8.flex-wrap.gap-4
    div
      .flex.items-center.gap-2.mb-2
        NuxtLink.text-sm.font-medium(to="/marketing/surveys" style="color: var(--accent-color, #7849ff)") {{ $t('marketing.surveys.title') || 'Surveys' }}
        Icon(name="ph:caret-right" size="14" style="color: var(--text-muted)")
        span.text-sm(style="color: var(--text-muted)") {{ survey?.title || '...' }}
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ survey?.title || ($t('marketing.surveys.detail') || 'Survey Detail') }}
      p.text-sm.mt-1(v-if="survey" style="color: var(--text-muted)")
        | {{ survey.type || 'CUSTOM' }} | {{ survey.responseCount || 0 }} {{ $t('marketing.surveys.responses') || 'responses' }}
    .flex.items-center.gap-3.flex-wrap
      el-button(v-if="survey?.status === 'ACTIVE'" size="large" type="warning" plain class="!rounded-2xl" @click="handleCloseSurvey")
        Icon(name="ph:lock-bold" size="16")
        span.ml-1 {{ $t('marketing.surveys.closeSurvey') || 'Close Survey' }}
      el-button(size="large" plain class="!rounded-2xl" @click="copyShareLink")
        Icon(name="ph:share-bold" size="16")
        span.ml-1 {{ $t('marketing.surveys.copyLink') || 'Copy Link' }}
      el-button(size="large" type="success" plain class="!rounded-2xl" @click="handleExport" :disabled="!survey?.responseCount")
        Icon(name="ph:export-bold" size="16")
        span.ml-1 {{ $t('marketing.surveys.exportCsv') || 'Export CSV' }}
      el-button(size="large" plain class="!rounded-2xl" @click="openEditDialog")
        Icon(name="ph:pencil-bold" size="16")
        span.ml-1 {{ $t('common.edit') || 'Edit' }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else-if="survey")
    //- Survey Info Card
    .glass-card.p-6.rounded-2xl.mb-6
      .grid.gap-6(class="grid-cols-2 md:grid-cols-5")
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('common.status') || 'Status' }}
          el-tag(:type="getStatusType(survey.status)" effect="dark" size="default") {{ survey.status }}
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('marketing.surveys.type') || 'Type' }}
          el-tag(effect="plain" size="default") {{ formatType(survey.type) }}
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('marketing.surveys.questions') || 'Questions' }}
          p.text-lg.font-bold(style="color: var(--text-primary)") {{ survey.questions?.length || 0 }}
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('marketing.surveys.totalResponses') || 'Total Responses' }}
          p.text-lg.font-bold(style="color: #3b82f6") {{ survey.responseCount || 0 }}
        div
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('marketing.surveys.anonymous') || 'Anonymous' }}
          el-tag(:type="survey.isAnonymous ? 'success' : 'info'" effect="plain" size="small") {{ survey.isAnonymous ? ($t('common.yes') || 'Yes') : ($t('common.no') || 'No') }}

      div.mt-4(v-if="survey.description")
        p.text-xs.uppercase.tracking-wider.mb-2(style="color: var(--text-muted)") {{ $t('common.description') || 'Description' }}
        p.text-sm(style="color: var(--text-primary); line-height: 1.7") {{ survey.description }}

    //- Analytics Row
    el-row(:gutter="16" class="mb-6")
      //- NPS Score
      el-col(:xs="24" :md="12")
        .glass-card.p-6.rounded-2xl.h-full
          .flex.items-center.gap-2.mb-4
            Icon(name="ph:gauge-bold" size="20" style="color: #7849ff")
            h3.text-sm.font-bold.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('marketing.surveys.npsScore') || 'NPS Score' }}

          div(v-if="analyticsLoading")
            .flex.items-center.justify-center.py-8
              el-icon.is-loading(:size="24" style="color: var(--accent-color, #7849ff)")

          div(v-else-if="npsData.nps != null")
            .text-center.mb-4
              p.font-bold(
                :style="{ fontSize: '48px', lineHeight: '1', color: npsData.nps < 0 ? '#ef4444' : npsData.nps <= 50 ? '#f59e0b' : '#22c55e' }"
              ) {{ npsData.nps }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ npsData.nps < 0 ? 'Needs Improvement' : npsData.nps <= 50 ? 'Good' : 'Excellent' }}
            .space-y-2
              .flex.items-center.justify-between
                .flex.items-center.gap-2
                  .w-3.h-3.rounded-full(style="background: #22c55e")
                  span.text-sm(style="color: var(--text-primary)") {{ $t('marketing.surveys.promoters') || 'Promoters' }}
                span.text-sm.font-bold(style="color: #22c55e") {{ npsData.promoters?.percentage || 0 }}%
              .flex.items-center.justify-between
                .flex.items-center.gap-2
                  .w-3.h-3.rounded-full(style="background: #f59e0b")
                  span.text-sm(style="color: var(--text-primary)") {{ $t('marketing.surveys.passives') || 'Passives' }}
                span.text-sm.font-bold(style="color: #f59e0b") {{ npsData.passives?.percentage || 0 }}%
              .flex.items-center.justify-between
                .flex.items-center.gap-2
                  .w-3.h-3.rounded-full(style="background: #ef4444")
                  span.text-sm(style="color: var(--text-primary)") {{ $t('marketing.surveys.detractors') || 'Detractors' }}
                span.text-sm.font-bold(style="color: #ef4444") {{ npsData.detractors?.percentage || 0 }}%
              //- NPS bar
              .flex.h-4.rounded-lg.overflow-hidden.mt-2
                .transition-all(v-if="npsData.promoters?.percentage > 0" :style="{ width: npsData.promoters.percentage + '%', background: '#22c55e' }")
                .transition-all(v-if="npsData.passives?.percentage > 0" :style="{ width: npsData.passives.percentage + '%', background: '#f59e0b' }")
                .transition-all(v-if="npsData.detractors?.percentage > 0" :style="{ width: npsData.detractors.percentage + '%', background: '#ef4444' }")

          .text-center.py-6(v-else)
            Icon(name="ph:gauge" size="40" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('marketing.surveys.noNpsData') || 'No NPS data available' }}

      //- Completion Rate
      el-col(:xs="24" :md="12")
        .glass-card.p-6.rounded-2xl.h-full
          .flex.items-center.gap-2.mb-4
            Icon(name="ph:check-circle-bold" size="20" style="color: #22c55e")
            h3.text-sm.font-bold.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('marketing.surveys.completionRate') || 'Completion Rate' }}

          div(v-if="analyticsLoading")
            .flex.items-center.justify-center.py-8
              el-icon.is-loading(:size="24" style="color: var(--accent-color, #7849ff)")

          div(v-else-if="completionData.started > 0")
            .text-center.mb-4
              el-progress(
                type="dashboard"
                :percentage="completionData.completionRate || 0"
                :width="140"
                :stroke-width="12"
                :color="completionData.completionRate >= 70 ? '#22c55e' : completionData.completionRate >= 40 ? '#f59e0b' : '#ef4444'"
              )
                template(#default="{ percentage }")
                  span.text-2xl.font-bold(:style="{ color: completionData.completionRate >= 70 ? '#22c55e' : completionData.completionRate >= 40 ? '#f59e0b' : '#ef4444' }") {{ percentage }}%
            .space-y-2
              .flex.items-center.justify-between
                span.text-sm(style="color: var(--text-primary)") {{ $t('marketing.surveys.started') || 'Started' }}
                span.text-sm.font-bold(style="color: #3b82f6") {{ completionData.started || 0 }}
              .flex.items-center.justify-between
                span.text-sm(style="color: var(--text-primary)") {{ $t('marketing.surveys.completed') || 'Completed' }}
                span.text-sm.font-bold(style="color: #22c55e") {{ completionData.completed || 0 }}

          .text-center.py-6(v-else)
            Icon(name="ph:chart-pie" size="40" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('marketing.surveys.noCompletionData') || 'No completion data yet' }}

    //- Question-by-Question Analytics
    .glass-card.p-6.rounded-2xl.mb-6(v-if="questionAnalytics && Object.keys(questionAnalytics).length")
      .flex.items-center.gap-2.mb-5
        Icon(name="ph:chart-bar-bold" size="20" style="color: #8b5cf6")
        h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('marketing.surveys.questionBreakdown') || 'Question Breakdown' }}

      .space-y-5
        .glass-card.p-5.rounded-xl(v-for="(qa, qId) in questionAnalytics" :key="qId")
          .flex.items-start.justify-between.mb-3
            div
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ qa.questionText }}
              p.text-xs(style="color: var(--text-muted)") {{ qa.type }} | {{ qa.responseCount || 0 }} {{ $t('marketing.surveys.responses') || 'responses' }}

          //- Rating / NPS / Number analytics
          template(v-if="qa.type === 'rating' || qa.type === 'nps' || qa.type === 'number' || qa.type === 'RATING' || qa.type === 'NPS' || qa.type === 'SCALE'")
            .flex.items-center.gap-6.mb-3
              .text-center
                p.text-2xl.font-bold(style="color: #7849ff") {{ qa.average ?? '--' }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('marketing.surveys.average') || 'Average' }}
              .text-center
                p.text-2xl.font-bold(style="color: #22c55e") {{ qa.max ?? '--' }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('marketing.surveys.max') || 'Max' }}
              .text-center
                p.text-2xl.font-bold(style="color: #ef4444") {{ qa.min ?? '--' }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('marketing.surveys.min') || 'Min' }}
            //- Distribution bars
            .space-y-1(v-if="qa.distribution")
              .flex.items-center.gap-3(v-for="(count, score) in qa.distribution" :key="score")
                span.text-xs.font-mono.w-6.text-right(style="color: var(--text-muted)") {{ score }}
                .flex-1.h-5.rounded-lg.overflow-hidden(style="background: var(--bg-surface, rgba(255,255,255,0.03))")
                  .h-full.rounded-lg.transition-all(:style="{ width: distributionWidth(count, qa.responseCount), background: '#7849ff' }")
                span.text-xs.font-semibold.w-8(style="color: var(--text-primary)") {{ count }}

          //- Multiple choice / select analytics
          template(v-else-if="qa.optionCounts")
            .space-y-2
              .flex.items-center.gap-3(v-for="(count, option) in qa.optionCounts" :key="option")
                span.text-sm.flex-1.truncate(style="color: var(--text-primary)") {{ option }}
                .w-40.h-5.rounded-lg.overflow-hidden(style="background: var(--bg-surface, rgba(255,255,255,0.03))")
                  .h-full.rounded-lg.transition-all(:style="{ width: distributionWidth(count, qa.responseCount), background: '#3b82f6' }")
                span.text-xs.font-bold.w-12.text-right(style="color: var(--text-primary)") {{ count }} ({{ qa.responseCount > 0 ? Math.round((count / qa.responseCount) * 100) : 0 }}%)

          //- Text questions
          template(v-else)
            p.text-sm(style="color: var(--text-muted)") {{ qa.responseCount || 0 }} {{ $t('marketing.surveys.textResponses') || 'text responses collected' }}

    //- Responses Table
    .glass-card.p-6.rounded-2xl
      .flex.items-center.justify-between.mb-4
        .flex.items-center.gap-2
          Icon(name="ph:list-bold" size="20" style="color: #3b82f6")
          h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('marketing.surveys.allResponses') || 'All Responses' }} ({{ responses.length }})

      el-table(:data="responses" v-loading="responsesLoading" style="width: 100%" stripe max-height="500")
        el-table-column(label="#" type="index" width="60")
        el-table-column(:label="$t('marketing.surveys.respondent') || 'Respondent'" min-width="160")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.respondentName || row.respondentEmail || 'Anonymous' }}
        el-table-column(:label="$t('marketing.surveys.answers') || 'Answers'" min-width="300")
          template(#default="{ row }")
            .space-y-1
              template(v-if="typeof row.answers === 'object'")
                .flex.items-start.gap-2(v-for="(value, key) in row.answers" :key="key")
                  span.text-xs.font-semibold.shrink-0(style="color: var(--text-muted)") {{ getQuestionLabel(key) }}:
                  span.text-xs(style="color: var(--text-primary)") {{ formatAnswer(value) }}
        el-table-column(:label="$t('common.date') || 'Date'" prop="completedAt" width="150")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.completedAt || row.createdAt) }}

      .text-center.py-8(v-if="!responses.length && !responsesLoading")
        Icon(name="ph:inbox" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('marketing.surveys.noResponses') || 'No responses yet' }}

  //- 404
  .text-center.py-20(v-else-if="!loading")
    Icon(name="ph:warning-circle" size="48" style="color: var(--text-muted)")
    p.text-lg.font-semibold.mt-4(style="color: var(--text-primary)") {{ $t('common.notFound') || 'Survey not found' }}
    NuxtLink(to="/marketing/surveys")
      el-button.mt-4(type="primary") {{ $t('common.goBack') || 'Go Back' }}

  //- Edit Dialog
  el-dialog(v-model="editDialogVisible" :title="$t('common.edit') || 'Edit Survey'" width="640px" destroy-on-close)
    el-form(:model="editForm" label-position="top")
      el-form-item(:label="$t('marketing.surveys.surveyTitle') || 'Title'" required)
        el-input(v-model="editForm.title")
      el-form-item(:label="$t('common.description') || 'Description'")
        el-input(v-model="editForm.description" type="textarea" :rows="2")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('common.status') || 'Status'")
          el-select(v-model="editForm.status" class="w-full")
            el-option(label="Draft" value="DRAFT")
            el-option(label="Active" value="ACTIVE")
            el-option(label="Closed" value="CLOSED")
            el-option(label="Archived" value="ARCHIVED")
        el-form-item(:label="$t('marketing.surveys.type') || 'Type'")
          el-select(v-model="editForm.type" class="w-full")
            el-option(label="Customer Satisfaction" value="CUSTOMER_SATISFACTION")
            el-option(label="Employee" value="EMPLOYEE")
            el-option(label="NPS" value="NPS")
            el-option(label="Product Feedback" value="PRODUCT_FEEDBACK")
            el-option(label="Custom" value="CUSTOM")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('marketing.surveys.anonymous') || 'Anonymous'")
          el-switch(v-model="editForm.isAnonymous")
        el-form-item(:label="$t('marketing.surveys.multipleResponses') || 'Allow Multiple Responses'")
          el-switch(v-model="editForm.allowMultipleResponses")
    template(#footer)
      el-button(@click="editDialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') || 'Save' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const route = useRoute();

const loading = ref(false);
const saving = ref(false);
const analyticsLoading = ref(false);
const responsesLoading = ref(false);
const survey = ref<any>(null);
const responses = ref<any[]>([]);
const npsData = ref<any>({});
const completionData = ref<any>({});
const questionAnalytics = ref<any>(null);

// Edit dialog
const editDialogVisible = ref(false);
const editForm = reactive({
  title: '', description: '', status: 'DRAFT', type: 'CUSTOM',
  isAnonymous: false, allowMultipleResponses: false
});

// Helpers
function formatDate(d: string): string {
  if (!d) return '--';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

function getStatusType(status: string): string {
  const map: Record<string, string> = { DRAFT: 'info', ACTIVE: 'success', CLOSED: 'warning', ARCHIVED: 'danger' };
  return map[status] || 'info';
}

function formatType(type: string): string {
  if (!type) return 'Custom';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatAnswer(value: any): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getQuestionLabel(qId: string): string {
  if (!survey.value?.questions) return qId;
  const q = survey.value.questions.find((q: any) => q.id === qId);
  return q ? q.text.substring(0, 40) + (q.text.length > 40 ? '...' : '') : qId;
}

function distributionWidth(count: number, total: number): string {
  if (!total) return '0%';
  return Math.max(2, Math.round((count / total) * 100)) + '%';
}

function copyShareLink() {
  const url = `${window.location.origin}/survey-public/${route.params.id}`;
  navigator.clipboard.writeText(url);
  ElMessage.success(t('marketing.surveys.linkCopied') || 'Survey link copied to clipboard');
}

// Data fetching
async function loadSurvey() {
  loading.value = true;
  try {
    const res = await useApiFetch(`surveys/${route.params.id}`);
    if (res?.success && res.body) {
      survey.value = res.body;
    }
  } catch {
    ElMessage.error(t('common.error') || 'Failed to load survey');
  } finally {
    loading.value = false;
  }
}

async function loadResponses() {
  responsesLoading.value = true;
  try {
    const res = await useApiFetch(`surveys/${route.params.id}/responses`);
    if (res?.success && res.body) {
      const data = res.body as any;
      responses.value = data.docs || (Array.isArray(data) ? data : []);
    }
  } catch {
    responses.value = [];
  } finally {
    responsesLoading.value = false;
  }
}

async function loadAnalytics() {
  analyticsLoading.value = true;
  try {
    const [npsRes, completionRes, analyticsRes] = await Promise.all([
      useApiFetch(`surveys/${route.params.id}/nps`),
      useApiFetch(`surveys/${route.params.id}/completion-rate`),
      useApiFetch(`surveys/${route.params.id}/analytics`)
    ]);
    if (npsRes?.success && npsRes.body) {
      npsData.value = npsRes.body;
    }
    if (completionRes?.success && completionRes.body) {
      completionData.value = completionRes.body;
    }
    if (analyticsRes?.success && analyticsRes.body) {
      questionAnalytics.value = (analyticsRes.body as any).questionAnalytics || null;
    }
  } catch {
    // analytics are supplementary
  } finally {
    analyticsLoading.value = false;
  }
}

// Actions
async function handleCloseSurvey() {
  try {
    await ElMessageBox.confirm(
      t('marketing.surveys.confirmClose') || 'Are you sure you want to close this survey? No more responses will be accepted.',
      t('common.warning') || 'Warning',
      { type: 'warning' }
    );
    await useApiFetch(`surveys/${route.params.id}/close`, 'PUT');
    ElMessage.success(t('marketing.surveys.surveyClosed') || 'Survey closed successfully');
    await loadSurvey();
  } catch { /* cancelled */ }
}

async function handleExport() {
  try {
    const res = await useApiFetch(`surveys/${route.params.id}/export`);
    if (res?.success && res.body) {
      // If body is a string (CSV), download it
      const csvContent = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey-${route.params.id}-responses.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      ElMessage.success(t('marketing.surveys.exported') || 'Exported successfully');
    }
  } catch {
    ElMessage.error(t('common.error') || 'Export failed');
  }
}

function openEditDialog() {
  if (!survey.value) return;
  editForm.title = survey.value.title || '';
  editForm.description = survey.value.description || '';
  editForm.status = survey.value.status || 'DRAFT';
  editForm.type = survey.value.type || 'CUSTOM';
  editForm.isAnonymous = survey.value.isAnonymous || false;
  editForm.allowMultipleResponses = survey.value.allowMultipleResponses || false;
  editDialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    const res = await useApiFetch(`surveys/${route.params.id}`, 'PUT', { ...editForm });
    if (res?.success) {
      ElMessage.success(t('common.saved') || 'Saved successfully');
      editDialogVisible.value = false;
      await loadSurvey();
    } else {
      ElMessage.error(res?.message || t('common.error') || 'Save failed');
    }
  } catch {
    ElMessage.error(t('common.error') || 'An error occurred');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadSurvey();
  loadResponses();
  loadAnalytics();
});
</script>

<style lang="scss" scoped>
.glass-card {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
}
</style>
