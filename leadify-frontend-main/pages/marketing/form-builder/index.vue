<template lang="pug">
div
  ModuleHeader(
    :title="$t('marketing.formBuilder.title') || 'Form Builder'"
    :subtitle="$t('marketing.formBuilder.subtitle') || 'Create lead capture forms, manage submissions, and convert visitors into leads.'"
  )
    template(#actions)
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openCreateDialog()")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('marketing.formBuilder.newForm') || 'New Form' }}

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

      el-table(
        :data="filteredData"
        v-loading="loading"
        style="width: 100%"
        stripe
      )
        el-table-column(:label="$t('common.name') || 'Name'" prop="name" min-width="220" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-3
              .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.1)")
                Icon(name="ph:note-pencil-bold" size="18" style="color: #7849ff")
              div
                p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                p.text-xs(v-if="row.description" style="color: var(--text-muted)") {{ row.description?.substring(0, 50) }}{{ row.description?.length > 50 ? '...' : '' }}
        el-table-column(:label="$t('common.status') || 'Status'" prop="status" width="130" sortable)
          template(#default="{ row }")
            el-tag(:type="row.status === 'ACTIVE' ? 'success' : row.status === 'DRAFT' ? 'info' : 'warning'" size="small" effect="dark") {{ row.status }}
        el-table-column(:label="$t('marketing.formBuilder.fields') || 'Fields'" prop="fieldsCount" width="100" align="center" sortable)
          template(#default="{ row }")
            span.text-sm {{ row.fieldsCount || 0 }}
        el-table-column(:label="$t('marketing.formBuilder.submissions') || 'Submissions'" prop="submissionCount" width="140" align="center" sortable)
          template(#default="{ row }")
            el-button(v-if="row.submissionCount > 0" text type="primary" size="small" @click.stop="openSubmissionsDialog(row)")
              span.font-bold {{ row.submissionCount || 0 }}
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
        Icon(name="ph:note-pencil" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') || 'No forms found' }}

  //- Create / Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingItem ? ($t('common.edit') || 'Edit Form') : ($t('marketing.formBuilder.newForm') || 'New Form')" width="560px" destroy-on-close)
    el-form(:model="form" label-position="top")
      el-form-item(:label="$t('common.name') || 'Form Name'" required)
        el-input(v-model="form.name" :placeholder="$t('marketing.formBuilder.namePlaceholder') || 'e.g., Contact Us Form'")
      el-form-item(:label="$t('common.description') || 'Description'")
        el-input(v-model="form.description" type="textarea" :rows="2" :placeholder="$t('marketing.formBuilder.descPlaceholder') || 'Brief description of this form'")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('common.status') || 'Status'")
          el-select(v-model="form.status" class="w-full")
            el-option(label="Draft" value="DRAFT")
            el-option(label="Active" value="ACTIVE")
            el-option(label="Inactive" value="INACTIVE")
        el-form-item(:label="$t('marketing.formBuilder.createLead') || 'Create Lead on Submit'")
          .pt-2
            el-checkbox(v-model="form.createLead") {{ $t('marketing.formBuilder.autoCreateLead') || 'Auto-create lead' }}
      el-form-item(:label="$t('marketing.formBuilder.thankYouMessage') || 'Thank You Message'")
        el-input(v-model="form.thankYouMessage" type="textarea" :rows="2" :placeholder="$t('marketing.formBuilder.thankYouPlaceholder') || 'Thank you for your submission!'")
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') || 'Save' }}

  //- Submissions Dialog
  el-dialog(v-model="submissionsDialogVisible" :title="($t('marketing.formBuilder.submissions') || 'Submissions') + (selectedForm ? ' - ' + selectedForm.name : '')" width="700px" destroy-on-close)
    .flex.items-center.justify-center.py-8(v-if="loadingSubmissions")
      el-icon.is-loading(:size="24" style="color: var(--accent-color, #7849ff)")
    template(v-else)
      el-table(:data="submissions" style="width: 100%" stripe max-height="400")
        el-table-column(label="#" type="index" width="60")
        el-table-column(:label="$t('marketing.formBuilder.submittedData') || 'Submitted Data'" min-width="300")
          template(#default="{ row }")
            .space-y-1
              .flex.items-center.gap-2(v-for="(val, key) in row.data || row.fields || {}" :key="key")
                span.text-xs.font-semibold(style="color: var(--text-muted)") {{ key }}:
                span.text-xs(style="color: var(--text-primary)") {{ val }}
        el-table-column(:label="$t('common.createdAt') || 'Submitted At'" prop="createdAt" width="160")
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.createdAt) }}
      .text-center.py-6(v-if="!submissions.length")
        Icon(name="ph:inbox" size="40" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('marketing.formBuilder.noSubmissions') || 'No submissions yet' }}
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
const submissionsDialogVisible = ref(false);
const loadingSubmissions = ref(false);
const editingItem = ref<any>(null);
const selectedForm = ref<any>(null);
const search = ref('');
const items = ref<any[]>([]);
const submissions = ref<any[]>([]);

const defaultForm = () => ({
  name: '',
  description: '',
  status: 'DRAFT',
  thankYouMessage: '',
  createLead: false
});

const form = ref(defaultForm());

// Stats
const summaryStats = computed(() => {
  const data = items.value;
  const total = data.length;
  const active = data.filter((i: any) => i.status === 'ACTIVE').length;
  const totalSubs = data.reduce((sum: number, i: any) => sum + (i.submissionCount || 0), 0);
  return [
    { label: t('marketing.formBuilder.totalForms') || 'Total Forms', value: total, icon: 'ph:note-pencil-bold', color: '#7849ff' },
    { label: t('marketing.formBuilder.activeForms') || 'Active', value: active, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('marketing.formBuilder.totalSubmissions') || 'Total Submissions', value: totalSubs, icon: 'ph:paper-plane-tilt-bold', color: '#3b82f6' }
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
    const res = await useApiFetch('form-builder/templates');
    if (res.success && res.body) {
      items.value = Array.isArray(res.body) ? res.body : (res.body as any).docs || [];
    }
  } catch {
    ElMessage.error(t('common.error') || 'Failed to load forms');
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
    description: item.description || '',
    status: item.status || 'DRAFT',
    thankYouMessage: item.thankYouMessage || '',
    createLead: item.createLead || false
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
    const payload = { ...form.value };

    if (editingItem.value) {
      const res = await useApiFetch(`form-builder/templates/${editingItem.value.id}`, 'PUT', payload);
      if (res.success) {
        ElMessage.success(t('common.saved') || 'Saved successfully');
      } else {
        ElMessage.error(res.message || t('common.error') || 'Save failed');
      }
    } else {
      const res = await useApiFetch('form-builder/templates', 'POST', payload);
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
      t('common.confirmDelete') || 'Are you sure you want to delete this form?',
      t('common.warning') || 'Warning',
      { type: 'warning', confirmButtonText: t('common.delete') || 'Delete', cancelButtonText: t('common.cancel') || 'Cancel' }
    );
    const res = await useApiFetch(`form-builder/templates/${item.id}`, 'DELETE');
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
    ElMessage.error(t('common.error') || 'Failed to load submissions');
  } finally {
    loadingSubmissions.value = false;
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
