<template lang="pug">
div
  ModuleHeader(
    :title="$t('marketing.surveys.title') || 'Surveys'"
    :subtitle="$t('marketing.surveys.subtitle') || 'Create surveys, collect feedback, and analyze customer responses.'"
  )
    template(#actions)
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openCreateDialog()")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('marketing.surveys.newSurvey') || 'New Survey' }}

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
        stripe
      )
        el-table-column(:label="$t('marketing.surveys.surveyTitle') || 'Title'" prop="title" min-width="240" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-3
              .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(style="background: rgba(139, 92, 246, 0.1)")
                Icon(name="ph:clipboard-text-bold" size="18" style="color: #8b5cf6")
              div
                p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.title }}
                p.text-xs(v-if="row.description" style="color: var(--text-muted)") {{ row.description?.substring(0, 50) }}{{ row.description?.length > 50 ? '...' : '' }}
        el-table-column(:label="$t('common.status') || 'Status'" prop="status" width="130" sortable)
          template(#default="{ row }")
            el-tag(:type="getStatusType(row.status)" size="small" effect="dark") {{ row.status }}
        el-table-column(:label="$t('marketing.surveys.questions') || 'Questions'" prop="questionsCount" width="120" align="center" sortable)
          template(#default="{ row }")
            span.text-sm {{ row.questionsCount || (row.questions ? row.questions.length : 0) }}
        el-table-column(:label="$t('marketing.surveys.responses') || 'Responses'" prop="responseCount" width="130" align="center" sortable)
          template(#default="{ row }")
            el-button(v-if="row.responseCount > 0" text type="primary" size="small" @click.stop="openResponsesDialog(row)")
              span.font-bold {{ row.responseCount || 0 }}
              Icon(name="ph:arrow-square-out" size="14" class="ml-1")
            span.text-sm(v-else style="color: var(--text-muted)") 0
        el-table-column(:label="$t('common.createdAt') || 'Created'" prop="createdAt" width="150" sortable)
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.createdAt) }}
        el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-1
              el-button(text size="small" type="primary" @click.stop="openEditDialog(row)")
                Icon(name="ph:pencil-bold" size="16")
              el-button(text size="small" type="danger" @click.stop="handleDelete(row)")
                Icon(name="ph:trash-bold" size="16")

      .text-center.py-8(v-if="!filteredData.length && !loading")
        Icon(name="ph:clipboard-text" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') || 'No surveys found' }}

  //- Create / Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingItem ? ($t('common.edit') || 'Edit Survey') : ($t('marketing.surveys.newSurvey') || 'New Survey')" width="640px" destroy-on-close)
    el-form(:model="form" label-position="top")
      el-form-item(:label="$t('marketing.surveys.surveyTitle') || 'Survey Title'" required)
        el-input(v-model="form.title" :placeholder="$t('marketing.surveys.titlePlaceholder') || 'e.g., Customer Satisfaction Q1 2026'")
      el-form-item(:label="$t('common.description') || 'Description'")
        el-input(v-model="form.description" type="textarea" :rows="2" :placeholder="$t('marketing.surveys.descPlaceholder') || 'Brief description of this survey'")
      el-form-item(:label="$t('common.status') || 'Status'")
        el-select(v-model="form.status" style="width: 200px")
          el-option(v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value")

      //- Questions builder
      el-form-item(:label="$t('marketing.surveys.questions') || 'Questions'")
        .space-y-3
          .glass-card.p-4(v-for="(question, idx) in form.questions" :key="idx")
            .flex.items-start.justify-between.mb-2
              span.text-sm.font-semibold(style="color: var(--text-primary)") {{ ($t('marketing.surveys.question') || 'Question') + ' #' + (idx + 1) }}
              el-button(text type="danger" size="small" @click="removeQuestion(idx)")
                Icon(name="ph:x-bold" size="14")
            .grid.gap-3(class="grid-cols-1")
              el-input(v-model="question.text" :placeholder="$t('marketing.surveys.questionText') || 'Enter question text'")
              .grid.gap-3(class="grid-cols-2")
                el-select(v-model="question.type" class="w-full")
                  el-option(label="Text" value="TEXT")
                  el-option(label="Single Choice" value="SINGLE_CHOICE")
                  el-option(label="Multiple Choice" value="MULTIPLE_CHOICE")
                  el-option(label="Rating" value="RATING")
                  el-option(label="Scale (1-10)" value="SCALE")
                el-checkbox(v-model="question.required") {{ $t('common.required') || 'Required' }}
              //- Options for choice questions
              template(v-if="question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE'")
                .space-y-2
                  .flex.items-center.gap-2(v-for="(opt, optIdx) in question.options" :key="optIdx")
                    el-input(v-model="question.options[optIdx]" :placeholder="`${$t('marketing.surveys.option') || 'Option'} ${optIdx + 1}`" size="small")
                    el-button(text type="danger" size="small" @click="question.options.splice(optIdx, 1)" :disabled="question.options.length <= 2")
                      Icon(name="ph:x-bold" size="12")
                  el-button(text type="primary" size="small" @click="question.options.push('')")
                    Icon(name="ph:plus-bold" size="12")
                    span.ml-1 {{ $t('marketing.surveys.addOption') || 'Add Option' }}

          el-button(type="primary" plain class="!rounded-xl w-full" @click="addQuestion()")
            Icon(name="ph:plus-bold" size="16")
            span.ml-1 {{ $t('marketing.surveys.addQuestion') || 'Add Question' }}
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') || 'Save' }}

  //- Responses Dialog
  el-dialog(v-model="responsesDialogVisible" :title="($t('marketing.surveys.responses') || 'Responses') + (selectedSurvey ? ' - ' + selectedSurvey.title : '')" width="750px" destroy-on-close)
    .flex.items-center.justify-center.py-8(v-if="loadingResponses")
      el-icon.is-loading(:size="24" style="color: var(--accent-color, #7849ff)")
    template(v-else)
      el-table(:data="responses" style="width: 100%" stripe max-height="400")
        el-table-column(label="#" type="index" width="60")
        el-table-column(:label="$t('marketing.surveys.respondent') || 'Respondent'" prop="respondent" min-width="160")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-primary)") {{ row.respondentName || row.respondentEmail || row.respondentId || 'Anonymous' }}
        el-table-column(:label="$t('marketing.surveys.answers') || 'Answers'" min-width="300")
          template(#default="{ row }")
            .space-y-1
              .flex.items-start.gap-2(v-for="(answer, idx) in row.answers || []" :key="idx")
                span.text-xs.font-semibold.shrink-0(style="color: var(--text-muted)") Q{{ idx + 1 }}:
                span.text-xs(style="color: var(--text-primary)") {{ typeof answer === 'object' ? answer.value || JSON.stringify(answer) : answer }}
        el-table-column(:label="$t('common.date') || 'Date'" prop="createdAt" width="150")
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.createdAt) }}
      .text-center.py-6(v-if="!responses.length")
        Icon(name="ph:inbox" size="40" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('marketing.surveys.noResponses') || 'No responses yet' }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const responsesDialogVisible = ref(false);
const loadingResponses = ref(false);
const editingItem = ref<any>(null);
const selectedSurvey = ref<any>(null);
const search = ref('');
const filterStatus = ref('');
const items = ref<any[]>([]);
const responses = ref<any[]>([]);

interface QuestionItem {
  text: string;
  type: string;
  required: boolean;
  options: string[];
}

const statusOptions = [
  { label: t('marketing.surveys.draft') || 'Draft', value: 'DRAFT' },
  { label: t('marketing.surveys.active') || 'Active', value: 'ACTIVE' },
  { label: t('marketing.surveys.closed') || 'Closed', value: 'CLOSED' },
  { label: t('marketing.surveys.archived') || 'Archived', value: 'ARCHIVED' }
];

const defaultForm = () => ({
  title: '',
  description: '',
  status: 'DRAFT',
  questions: [{ text: '', type: 'TEXT', required: false, options: ['', ''] }] as QuestionItem[]
});

const form = ref(defaultForm());

// Stats
const summaryStats = computed(() => {
  const data = items.value;
  const total = data.length;
  const active = data.filter((i: any) => i.status === 'ACTIVE').length;
  const totalResp = data.reduce((sum: number, i: any) => sum + (i.responseCount || 0), 0);
  return [
    { label: t('marketing.surveys.totalSurveys') || 'Total Surveys', value: total, icon: 'ph:clipboard-text-bold', color: '#8b5cf6' },
    { label: t('marketing.surveys.activeSurveys') || 'Active', value: active, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('marketing.surveys.totalResponses') || 'Total Responses', value: totalResp, icon: 'ph:chat-circle-dots-bold', color: '#3b82f6' }
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
    (i.title || '').toLowerCase().includes(q) ||
    (i.description || '').toLowerCase().includes(q)
  );
});

function getStatusType(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'info',
    ACTIVE: 'success',
    CLOSED: 'warning',
    ARCHIVED: 'danger'
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

function addQuestion() {
  form.value.questions.push({ text: '', type: 'TEXT', required: false, options: ['', ''] });
}

function removeQuestion(idx: number) {
  if (form.value.questions.length <= 1) {
    ElMessage.warning(t('marketing.surveys.minOneQuestion') || 'At least one question is required');
    return;
  }
  form.value.questions.splice(idx, 1);
}

// CRUD
async function fetchData() {
  loading.value = true;
  try {
    const res = await useApiFetch('surveys');
    if (res.success && res.body) {
      items.value = Array.isArray(res.body) ? res.body : (res.body as any).docs || [];
    }
  } catch {
    ElMessage.error(t('common.error') || 'Failed to load surveys');
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
  const questions = item.questions && Array.isArray(item.questions)
    ? item.questions.map((q: any) => ({
        text: q.text || '',
        type: q.type || 'TEXT',
        required: q.required || false,
        options: q.options && Array.isArray(q.options) ? [...q.options] : ['', '']
      }))
    : [{ text: '', type: 'TEXT', required: false, options: ['', ''] }];

  form.value = {
    title: item.title || '',
    description: item.description || '',
    status: item.status || 'DRAFT',
    questions
  };
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.title.trim()) {
    ElMessage.warning(t('common.fillRequired') || 'Please fill in required fields');
    return;
  }

  // Validate at least one question has text
  const validQuestions = form.value.questions.filter(q => q.text.trim());
  if (!validQuestions.length) {
    ElMessage.warning(t('marketing.surveys.addAtLeastOneQuestion') || 'Please add at least one question');
    return;
  }

  saving.value = true;
  try {
    // Clean up options for non-choice questions
    const cleanedQuestions = validQuestions.map(q => {
      const base: any = { text: q.text, type: q.type, required: q.required };
      if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') {
        base.options = q.options.filter(o => o.trim());
      }
      return base;
    });

    const payload = {
      title: form.value.title,
      description: form.value.description,
      status: form.value.status,
      questions: cleanedQuestions
    };

    if (editingItem.value) {
      const res = await useApiFetch(`surveys/${editingItem.value.id}`, 'PUT', payload);
      if (res.success) {
        ElMessage.success(t('common.saved') || 'Saved successfully');
      } else {
        ElMessage.error(res.message || t('common.error') || 'Save failed');
      }
    } else {
      const res = await useApiFetch('surveys', 'POST', payload);
      if (res.success) {
        ElMessage.success(t('common.saved') || 'Created successfully');
      } else {
        ElMessage.error(res.message || t('common.error') || 'Create failed');
      }
    }
    dialogVisible.value = false;
    await fetchData();
  } catch {
    ElMessage.error(t('common.error') || 'An error occurred');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(item: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure you want to delete this survey?',
      t('common.warning') || 'Warning',
      { type: 'warning', confirmButtonText: t('common.delete') || 'Delete', cancelButtonText: t('common.cancel') || 'Cancel' }
    );
    const res = await useApiFetch(`surveys/${item.id}`, 'DELETE');
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

async function openResponsesDialog(survey: any) {
  selectedSurvey.value = survey;
  responsesDialogVisible.value = true;
  loadingResponses.value = true;
  try {
    const res = await useApiFetch(`surveys/${survey.id}/responses`);
    if (res.success && res.body) {
      responses.value = Array.isArray(res.body) ? res.body : (res.body as any).docs || [];
    } else {
      responses.value = [];
    }
  } catch {
    responses.value = [];
    ElMessage.error(t('common.error') || 'Failed to load responses');
  } finally {
    loadingResponses.value = false;
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
