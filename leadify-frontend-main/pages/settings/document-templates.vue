<template lang="pug">
div
  //- Child routes (builder, pro-builder) render here; index content is below
  NuxtPage(v-if="isChildRoute")

  template(v-else)
    ModuleHeader(
      :title="$t('documentTemplates.title') || 'Document Templates'"
      :subtitle="$t('documentTemplates.subtitle') || 'Design professional PDF templates for invoices and purchase orders.'"
    )
      template(#actions)
        el-button(size="large" @click="openDialog()" type="primary" class="!rounded-2xl")
          Icon(name="ph:plus-bold" size="16" class="mr-1")
          span {{ $t('documentTemplates.createTemplate') || 'Create Template' }}

    StatCards(:stats="summaryStats")

    //- Filters & Search
    .glass-card.py-8.animate-entrance
      .px-6.flex.items-center.flex-wrap.gap-3.mb-6.justify-start
        el-radio-group(v-model="typeFilter" @change="handleFilterChange" size="large")
          el-radio-button(value="") {{ $t('common.all') || 'All' }}
          el-radio-button(value="INVOICE") {{ $t('documentTemplates.invoice') || 'Invoice' }}
          el-radio-button(value="PURCHASE_ORDER") {{ $t('documentTemplates.purchaseOrder') || 'Purchase Order' }}
        .input.table-search(class="w-full md:w-[250px]")
          el-input(
            size="large"
            style="height:50px"
            v-model="searchKey"
            :placeholder="($t('common.search') || 'Search') + ' ' + ($t('documentTemplates.title') || 'Document Templates')"
            clearable
            @input="debouncedSearch"
          )
            template(#prefix)
              Icon(name="ph:magnifying-glass" size="16")

      //- Table
      .px-6(v-loading="loading")
        el-table(
          v-if="templates.length"
          :data="templates"
          style="width: 100%"
          row-class-name="cursor-pointer"
          @row-click="handleRowClick"
          :header-cell-style="{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-default)' }"
          :cell-style="{ borderBottom: '1px solid var(--border-default)' }"
        )
          el-table-column(:label="$t('common.name') || 'Name'" prop="name" min-width="200")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(
                  :style="{ background: row.type === 'INVOICE' ? '#7849ff15' : '#f59e0b15' }"
                )
                  Icon(
                    :name="row.type === 'INVOICE' ? 'ph:receipt-bold' : 'ph:shopping-cart-bold'"
                    size="18"
                    :style="{ color: row.type === 'INVOICE' ? '#7849ff' : '#f59e0b' }"
                  )
                span.font-semibold(style="color: var(--text-primary)") {{ row.name }}

          el-table-column(:label="$t('documentTemplates.builder.templateType') || 'Type'" prop="type" width="180")
            template(#default="{ row }")
              el-tag(
                size="small"
                effect="dark"
                round
                :class="row.type === 'INVOICE' ? '!bg-purple-500/20 !text-white !border-purple-500/30' : '!bg-orange-500/20 !text-white !border-orange-500/30'"
              ) {{ row.type === 'INVOICE' ? ($t('documentTemplates.invoice') || 'Invoice') : ($t('documentTemplates.purchaseOrder') || 'Purchase Order') }}

          el-table-column(:label="$t('documentTemplates.default') || 'Default'" prop="isDefault" width="120" align="center")
            template(#default="{ row }")
              el-tag(v-if="row.isDefault" size="small" type="success" effect="plain" round) {{ $t('documentTemplates.default') || 'Default' }}
              span.text-xs(v-else style="color: var(--text-muted)") --

          el-table-column(:label="$t('documentTemplates.elements') || 'Elements'" width="120" align="center")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted)") {{ row.layout?.elements?.length || 0 }}

          el-table-column(:label="$t('common.createdAt') || 'Created'" width="160")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}

          el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1(@click.stop)
                el-button(size="small" @click="openDialog(row)" class="!rounded-lg")
                  Icon(name="ph:pencil-bold" size="14")
                el-button(size="small" type="danger" plain @click="handleDelete(row)" class="!rounded-lg")
                  Icon(name="ph:trash-bold" size="14")

        //- Empty state
        .text-center.py-16(v-if="!templates.length && !loading")
          Icon(name="ph:file-doc-bold" size="64" style="color: var(--text-muted)")
          p.mt-4.text-lg.font-medium(style="color: var(--text-primary)") {{ $t('documentTemplates.noTemplates') || 'No templates yet' }}
          p.mt-1.text-sm(style="color: var(--text-muted)") {{ $t('documentTemplates.noTemplatesHint') || 'Create a custom template or load the default professional templates.' }}
          .flex.justify-center.gap-3.mt-6
            el-button(@click="openDialog()" type="primary" class="!rounded-2xl")
              Icon(name="ph:plus-bold" size="16" class="mr-1")
              span {{ $t('documentTemplates.createTemplate') || 'Create Template' }}

      //- Pagination
      .pagination.mt-5.flex.items-center.flex-wrap.gap-2.px-6(class="sm:justify-between justify-center" v-if="pagination.totalPages > 1")
        span.text-xs(style="color: var(--text-muted)") {{ pagination.totalItems }} {{ $t('common.entries') || 'entries' }}
        el-pagination(
          background
          style="direction:ltr"
          :pager-count="4"
          v-model:current-page="pagination.page"
          :page-size="pagination.limit"
          layout="prev, pager, next"
          :total="pagination.totalItems"
          @current-change="handlePageChange"
        )

    //- Create/Edit Dialog
    el-dialog(
      v-model="dialogVisible"
      :title="editingTemplate ? ($t('documentTemplates.editTemplate') || 'Edit Template') : ($t('documentTemplates.createTemplate') || 'Create Template')"
      width="500px"
      :close-on-click-modal="false"
    )
      el-form(:model="form" label-position="top")
        el-form-item(:label="$t('common.name') || 'Name'" required)
          el-input(v-model="form.name" :placeholder="$t('documentTemplates.builder.templateName') || 'Template Name'")

        el-form-item(:label="$t('documentTemplates.builder.templateType') || 'Type'" required)
          el-select(v-model="form.type" style="width: 100%")
            el-option(:label="$t('documentTemplates.invoice') || 'Invoice'" value="INVOICE")
            el-option(:label="$t('documentTemplates.purchaseOrder') || 'Purchase Order'" value="PURCHASE_ORDER")

        el-form-item
          el-checkbox(v-model="form.isDefault") {{ $t('documentTemplates.default') || 'Set as Default' }}

      template(#footer)
        el-button(@click="dialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
        el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') || 'Save' }}

    //- Delete confirmation
    ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete') || 'Are you sure you want to delete this item?'" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { DocumentTemplate } from '~/composables/useDocumentTemplates';
import {
  fetchDocumentTemplates,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate
} from '~/composables/useDocumentTemplates';

definePageMeta({});

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const route = useRoute();

// Determine if a child route (builder/pro-builder) is active
const isChildRoute = computed(() => {
  const path = route.path;
  return path !== '/settings/document-templates' && path !== '/settings/document-templates/';
});

// State
const templates = ref<DocumentTemplate[]>([]);
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const dialogVisible = ref(false);
const deletePopup = ref(false);
const deleteId = ref<string | null>(null);
const editingTemplate = ref<DocumentTemplate | null>(null);
const typeFilter = ref('');
const searchKey = ref('');
const pagination = ref({ totalItems: 0, page: 1, limit: 20, totalPages: 0 });

let searchTimeout: ReturnType<typeof setTimeout>;

const form = reactive({
  name: '',
  type: 'INVOICE' as 'INVOICE' | 'PURCHASE_ORDER',
  isDefault: false
});

// Summary stats
const summaryStats = computed(() => {
  const all = templates.value;
  const invoiceCount = all.filter(t => t.type === 'INVOICE').length;
  const poCount = all.filter(t => t.type === 'PURCHASE_ORDER').length;
  const defaultCount = all.filter(t => t.isDefault).length;
  return [
    {
      label: t('documentTemplates.allTemplates') || 'Total Templates',
      value: pagination.value.totalItems || all.length,
      icon: 'ph:file-doc-bold',
      color: '#7849ff'
    },
    {
      label: t('documentTemplates.default') || 'Default',
      value: defaultCount,
      icon: 'ph:star-bold',
      color: '#22c55e'
    },
    {
      label: t('documentTemplates.invoice') || 'Invoice',
      value: invoiceCount,
      icon: 'ph:receipt-bold',
      color: '#3b82f6'
    },
    {
      label: t('documentTemplates.purchaseOrder') || 'Purchase Order',
      value: poCount,
      icon: 'ph:shopping-cart-bold',
      color: '#f59e0b'
    }
  ];
});

// Lifecycle
onMounted(async () => {
  if (!isChildRoute.value) {
    await loadTemplates();
  }
});

// Data loading
async function loadTemplates() {
  loading.value = true;
  try {
    const query: Record<string, any> = {
      page: pagination.value.page,
      limit: pagination.value.limit
    };
    if (typeFilter.value) query.type = typeFilter.value;
    if (searchKey.value) query.searchKey = searchKey.value;
    const result = await fetchDocumentTemplates(query);
    templates.value = result.docs;
    pagination.value = { ...pagination.value, ...result.pagination };
  } finally {
    loading.value = false;
  }
}

function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadTemplates();
  }, 400);
}

function handleFilterChange() {
  pagination.value.page = 1;
  loadTemplates();
}

function handlePageChange(page: number) {
  pagination.value.page = page;
  loadTemplates();
}

function handleRowClick(row: DocumentTemplate) {
  openDialog(row);
}

// Dialog
function openDialog(template?: DocumentTemplate) {
  if (template) {
    editingTemplate.value = template;
    form.name = template.name;
    form.type = template.type;
    form.isDefault = template.isDefault;
  } else {
    editingTemplate.value = null;
    form.name = '';
    form.type = 'INVOICE';
    form.isDefault = false;
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.name.trim()) {
    ElNotification({
      type: 'warning',
      title: t('common.warning') || 'Warning',
      message: t('common.fillRequired') || 'Please fill in all required fields'
    });
    return;
  }

  saving.value = true;
  try {
    const payload: Partial<DocumentTemplate> = {
      name: form.name,
      type: form.type,
      isDefault: form.isDefault
    };

    let result;
    if (editingTemplate.value) {
      result = await updateDocumentTemplate(editingTemplate.value.id, payload);
    } else {
      // New templates get a default empty layout
      payload.layout = {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 15, bottom: 20, left: 15 },
        elements: [],
        variables: form.type === 'INVOICE'
          ? ['companyName', 'invoiceNumber', 'date', 'clientName', 'items', 'subtotal', 'tax', 'total']
          : ['companyName', 'poNumber', 'date', 'vendorName', 'items', 'subtotal', 'tax', 'total']
      };
      result = await createDocumentTemplate(payload);
    }

    if (result.success) {
      ElNotification({
        type: 'success',
        title: t('common.success') || 'Success',
        message: t('common.saved') || 'Saved successfully'
      });
      dialogVisible.value = false;
      await loadTemplates();
    } else {
      ElNotification({
        type: 'error',
        title: t('common.error') || 'Error',
        message: result.message || t('common.error') || 'Something went wrong'
      });
    }
  } finally {
    saving.value = false;
  }
}

// Delete
function handleDelete(template: DocumentTemplate) {
  deleteId.value = template.id;
  deletePopup.value = true;
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const { success } = await deleteDocumentTemplate(deleteId.value);
    if (success) {
      ElNotification({
        type: 'success',
        title: t('common.success') || 'Success',
        message: t('common.deleted') || 'Deleted successfully'
      });
      await loadTemplates();
    }
  } finally {
    deleting.value = false;
    deletePopup.value = false;
    deleteId.value = null;
  }
}

// Helpers
function formatDate(d?: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString();
}
</script>

<style lang="scss" scoped>
.animate-entrance {
  animation: fadeIn 0.5s ease-out;
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
