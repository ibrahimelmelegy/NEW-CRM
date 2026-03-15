<template lang="pug">
div
  //- Child routes (builder, pro-builder) render here; index content is below
  NuxtPage(v-if="isChildRoute")

  template(v-else)
    ModuleHeader(
      :title="$t('documentTemplates.title')"
      :subtitle="$t('documentTemplates.subtitle')"
    )
      template(#actions)
        el-button(size="large" @click="handleSeedDefaults" :loading="seeding" class="!rounded-2xl")
          Icon(name="ph:download-bold" size="16" class="mr-1")
          span {{ $t('documentTemplates.seedDefaults') }}
        el-button(size="large" @click="openDialog()" type="primary" class="!rounded-2xl")
          Icon(name="ph:plus-bold" size="16" class="mr-1")
          span {{ $t('documentTemplates.createTemplate') }}

    StatCards(:stats="summaryStats")

    //- Filters & Search
    .glass-card.py-8.animate-entrance
      .px-6.flex.items-center.flex-wrap.gap-3.mb-6.justify-start
        el-radio-group(v-model="typeFilter" @change="handleFilterChange" size="large")
          el-radio-button(value="") {{ $t('common.all') }}
          el-radio-button(value="INVOICE") {{ $t('documentTemplates.invoice') }}
          el-radio-button(value="PURCHASE_ORDER") {{ $t('documentTemplates.purchaseOrder') }}
          el-radio-button(value="QUOTE") {{ $t('documentTemplates.quote') }}
          el-radio-button(value="CONTRACT") {{ $t('documentTemplates.contract') }}
          el-radio-button(value="PROPOSAL") {{ $t('documentTemplates.proposal') }}
        .input.table-search(class="w-full md:w-[250px]")
          el-input(
            size="large"
            style="height:50px"
            v-model="searchKey"
            :placeholder="$t('common.search') + ' ' + $t('documentTemplates.title')"
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
          el-table-column(:label="$t('common.name')" prop="name" min-width="200")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(
                  :style="{ background: getTypeColor(row.type) + '15' }"
                )
                  Icon(
                    :name="getTypeIcon(row.type)"
                    size="18"
                    :style="{ color: getTypeColor(row.type) }"
                  )
                div
                  span.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                  .flex.items-center.gap-1(v-if="row.category === 'system'" class="mt-0.5")
                    Icon(name="ph:lock-bold" size="10" style="color: var(--text-muted)")
                    span.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.system') }}

          el-table-column(:label="$t('documentTemplates.builder.templateType')" prop="type" width="180")
            template(#default="{ row }")
              el-tag(
                size="small"
                effect="dark"
                round
                :style="{ background: getTypeColor(row.type) + '20', color: '#fff', borderColor: getTypeColor(row.type) + '30' }"
              ) {{ getTypeLabel(row.type) }}

          el-table-column(:label="$t('documentTemplates.category')" width="120" align="center")
            template(#default="{ row }")
              el-tag(
                v-if="row.category === 'system'"
                size="small"
                type="info"
                effect="plain"
                round
              ) System
              el-tag(
                v-else
                size="small"
                effect="plain"
                round
              ) {{ $t('documentTemplates.custom') }}

          el-table-column(:label="$t('documentTemplates.default')" prop="isDefault" width="100" align="center")
            template(#default="{ row }")
              el-tag(v-if="row.isDefault" size="small" type="success" effect="plain" round) {{ $t('documentTemplates.default') }}
              span.text-xs(v-else style="color: var(--text-muted)") --

          el-table-column(:label="$t('documentTemplates.elements')" width="100" align="center")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted)") {{ row.layout?.elements?.length || 0 }}

          el-table-column(:label="$t('common.createdAt')" width="140")
            template(#default="{ row }")
              span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}

          el-table-column(:label="$t('common.actions')" width="160" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1(@click.stop)
                el-tooltip(content="Duplicate" placement="top")
                  el-button(size="small" @click="handleClone(row)" :loading="cloneLoadingId === row.id" class="!rounded-lg")
                    Icon(name="ph:copy-bold" size="14")
                el-tooltip(:content="row.category === 'system' ? 'System templates are read-only' : 'Edit'" placement="top")
                  el-button(size="small" @click="openDialog(row)" :disabled="row.category === 'system'" class="!rounded-lg")
                    Icon(name="ph:pencil-bold" size="14")
                el-tooltip(:content="row.category === 'system' ? 'Cannot delete system templates' : 'Delete'" placement="top")
                  el-button(size="small" type="danger" plain @click="handleDelete(row)" :disabled="row.category === 'system'" class="!rounded-lg")
                    Icon(name="ph:trash-bold" size="14")

        //- Empty state
        .text-center.py-16(v-if="!templates.length && !loading")
          Icon(name="ph:file-doc-bold" size="64" style="color: var(--text-muted)")
          p.mt-4.text-lg.font-medium(style="color: var(--text-primary)") {{ $t('documentTemplates.noTemplates') }}
          p.mt-1.text-sm(style="color: var(--text-muted)") {{ $t('documentTemplates.noTemplatesHint') }}
          .flex.justify-center.gap-3.mt-6
            el-button(@click="handleSeedDefaults" :loading="seeding" class="!rounded-2xl")
              Icon(name="ph:download-bold" size="16" class="mr-1")
              span {{ $t('documentTemplates.seedDefaults') }}
            el-button(@click="openDialog()" type="primary" class="!rounded-2xl")
              Icon(name="ph:plus-bold" size="16" class="mr-1")
              span {{ $t('documentTemplates.createTemplate') }}

      //- Pagination
      .pagination.mt-5.flex.items-center.flex-wrap.gap-2.px-6(class="sm:justify-between justify-center" v-if="pagination.totalPages > 1")
        span.text-xs(style="color: var(--text-muted)") {{ pagination.totalItems }} {{ $t('common.entries') }}
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
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    )
      el-form(:model="form" label-position="top")
        el-form-item(:label="nameLabel" required)
          el-input(v-model="form.name" :placeholder="templateNamePlaceholder")

        .grid.grid-cols-2.gap-4
          el-form-item(:label="typeLabel" required)
            el-select(v-model="form.type" style="width: 100%" @change="updateVariablesForType")
              el-option(v-for="opt in templateTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value")

          el-form-item(:label="$t('documentTemplates.pageSize')")
            el-select(v-model="form.pageSize" style="width: 100%")
              el-option(:label="$t('documentTemplates.a4')" value="A4")
              el-option(:label="$t('documentTemplates.letter')" value="Letter")
              el-option(:label="$t('documentTemplates.legal')" value="Legal")

        el-form-item
          el-checkbox(v-model="form.isDefault") {{ $t('documentTemplates.default') }}

        //- Variable Reference Panel
        el-form-item(:label="$t('documentTemplates.availableVariables')")
          .p-3.rounded-lg.border.border-slate-700.max-h-40.overflow-y-auto(style="background: var(--bg-elevated)")
            .flex.flex-wrap.gap-2
              el-tag(
                v-for="v in currentVariables"
                :key="v"
                size="small"
                effect="plain"
                class="!cursor-pointer"
                @click="copyVariable(v)"
              )
                span.font-mono.text-xs {{ formatVar(v) }}
            p.text-xs.mt-2(style="color: var(--text-muted)") {{ $t('documentTemplates.clickToCopy') }}

      template(#footer)
        el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
        el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') }}

    //- Delete confirmation
    ActionModel(v-model="deletePopup" :loading="deleting" :description="deleteConfirmText" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { DocumentTemplate } from '~/composables/useDocumentTemplates';
import logger from '~/utils/logger';
import {
  fetchDocumentTemplates,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  cloneDocumentTemplate,
  seedDefaultTemplates
} from '~/composables/useDocumentTemplates';

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const route = useRoute();

// Pre-computed labels to avoid complex $t() expressions in Pug attributes
const dialogTitle = computed(() => (editingTemplate.value ? t('documentTemplates.editTemplate') : t('documentTemplates.createTemplate')));
const nameLabel = computed(() => t('common.name'));
const typeLabel = computed(() => t('documentTemplates.builder.templateType'));
const templateNamePlaceholder = computed(() => t('documentTemplates.builder.templateName'));
const deleteConfirmText = computed(() => t('common.confirmDelete'));

// Determine if a child route (builder/pro-builder) is active
const isChildRoute = computed(() => {
  const path = route.path;
  return path !== '/settings/document-templates' && path !== '/settings/document-templates/';
});

const templateTypeOptions = [
  { label: 'Invoice', value: 'INVOICE' },
  { label: 'Purchase Order', value: 'PURCHASE_ORDER' },
  { label: 'Quote', value: 'QUOTE' },
  { label: 'Contract', value: 'CONTRACT' },
  { label: 'Sales Order', value: 'SALES_ORDER' },
  { label: 'Delivery Note', value: 'DELIVERY_NOTE' },
  { label: 'Credit Note', value: 'CREDIT_NOTE' },
  { label: 'Proforma Invoice', value: 'PROFORMA_INVOICE' },
  { label: 'RFQ', value: 'RFQ' },
  { label: 'SLA', value: 'SLA' },
  { label: 'Proposal', value: 'PROPOSAL' },
  { label: 'Generic', value: 'GENERIC' }
];

// State
const templates = ref<DocumentTemplate[]>([]);
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const seeding = ref(false);
const cloneLoadingId = ref<string | null>(null);
const dialogVisible = ref(false);
const deletePopup = ref(false);
const deleteId = ref<string | null>(null);
const editingTemplate = ref<DocumentTemplate | null>(null);
const typeFilter = ref('');
const searchKey = ref('');
const pagination = ref({ totalItems: 0, page: 1, limit: 20, totalPages: 0 });

let searchTimeout: ReturnType<typeof setTimeout>;

// Variable definitions by template type
const INVOICE_VARS = [
  'companyName',
  'companyAddress',
  'companyPhone',
  'companyEmail',
  'companyLogo',
  'invoiceNumber',
  'date',
  'dueDate',
  'clientName',
  'clientAddress',
  'clientPhone',
  'clientEmail',
  'items',
  'subtotal',
  'tax',
  'total',
  'notes'
];

const PO_VARS = [
  'companyName',
  'companyAddress',
  'companyPhone',
  'companyEmail',
  'companyLogo',
  'poNumber',
  'date',
  'deliveryDate',
  'vendorName',
  'vendorAddress',
  'vendorPhone',
  'vendorEmail',
  'projectName',
  'items',
  'subtotal',
  'tax',
  'total',
  'notes'
];

const QUOTE_VARS = [
  'companyName',
  'companyAddress',
  'companyPhone',
  'companyEmail',
  'companyLogo',
  'quoteNumber',
  'date',
  'validUntil',
  'clientName',
  'clientAddress',
  'items',
  'subtotal',
  'tax',
  'total',
  'notes',
  'termsAndConditions'
];

const CONTRACT_VARS = [
  'companyName',
  'companyAddress',
  'companyLogo',
  'contractNumber',
  'date',
  'startDate',
  'endDate',
  'clientName',
  'clientAddress',
  'description',
  'scope',
  'termsAndConditions',
  'totalValue',
  'notes',
  'signatureDate'
];

const GENERIC_VARS = [
  'companyName',
  'companyAddress',
  'companyPhone',
  'companyEmail',
  'companyLogo',
  'documentNumber',
  'date',
  'recipientName',
  'recipientAddress',
  'items',
  'subtotal',
  'tax',
  'total',
  'notes'
];

const form = reactive({
  name: '',
  type: 'INVOICE' as string,
  isDefault: false,
  pageSize: 'A4'
});

// Variables based on selected type
const currentVariables = computed(() => {
  switch (form.type) {
    case 'INVOICE':
    case 'PROFORMA_INVOICE':
    case 'CREDIT_NOTE':
      return INVOICE_VARS;
    case 'PURCHASE_ORDER':
    case 'RFQ':
      return PO_VARS;
    case 'QUOTE':
    case 'PROPOSAL':
    case 'SALES_ORDER':
      return QUOTE_VARS;
    case 'CONTRACT':
    case 'SLA':
      return CONTRACT_VARS;
    default:
      return GENERIC_VARS;
  }
});

function updateVariablesForType() {
  // Reactivity handles this via computed
}

function formatVar(v: string): string {
  return '{{' + v + '}}';
}

function copyVariable(v: string) {
  const text = `{{${v}}}`;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      ElNotification({ type: 'success', title: 'Copied', message: `${text} copied to clipboard`, duration: 1500 });
    })
    .catch(() => {
      // Clipboard not available, show info
      ElNotification({ type: 'info', title: 'Variable', message: text, duration: 2000 });
    });
}

// Type display helpers
function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    INVOICE: '#7849ff',
    PURCHASE_ORDER: '#f59e0b',
    QUOTE: '#3b82f6',
    CONTRACT: '#10b981',
    SALES_ORDER: '#8b5cf6',
    DELIVERY_NOTE: '#06b6d4',
    CREDIT_NOTE: '#ef4444',
    PROFORMA_INVOICE: '#a855f7',
    RFQ: '#f97316',
    SLA: '#14b8a6',
    PROPOSAL: '#ec4899',
    GENERIC: '#64748b'
  };
  return colors[type] || '#64748b';
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    INVOICE: 'ph:receipt-bold',
    PURCHASE_ORDER: 'ph:shopping-cart-bold',
    QUOTE: 'ph:quotes-bold',
    CONTRACT: 'ph:handshake-bold',
    SALES_ORDER: 'ph:package-bold',
    DELIVERY_NOTE: 'ph:truck-bold',
    CREDIT_NOTE: 'ph:arrow-u-up-left-bold',
    PROFORMA_INVOICE: 'ph:receipt-bold',
    RFQ: 'ph:clipboard-text-bold',
    SLA: 'ph:shield-check-bold',
    PROPOSAL: 'ph:presentation-chart-bold',
    GENERIC: 'ph:file-doc-bold'
  };
  return icons[type] || 'ph:file-doc-bold';
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    INVOICE: t('documentTemplates.invoice'),
    PURCHASE_ORDER: t('documentTemplates.purchaseOrder'),
    QUOTE: 'Quote',
    CONTRACT: 'Contract',
    SALES_ORDER: 'Sales Order',
    DELIVERY_NOTE: 'Delivery Note',
    CREDIT_NOTE: 'Credit Note',
    PROFORMA_INVOICE: 'Proforma Invoice',
    RFQ: 'RFQ',
    SLA: 'SLA',
    PROPOSAL: 'Proposal',
    GENERIC: 'Generic'
  };
  return labels[type] || type;
}

// Summary stats
const summaryStats = computed(() => {
  const all = templates.value;
  const invoiceCount = all.filter(t => t.type === 'INVOICE').length;
  const poCount = all.filter(t => t.type === 'PURCHASE_ORDER').length;
  const defaultCount = all.filter(t => t.isDefault).length;
  return [
    {
      label: t('documentTemplates.allTemplates'),
      value: pagination.value.totalItems || all.length,
      icon: 'ph:file-doc-bold',
      color: '#7849ff'
    },
    {
      label: t('documentTemplates.default'),
      value: defaultCount,
      icon: 'ph:star-bold',
      color: '#22c55e'
    },
    {
      label: t('documentTemplates.invoice'),
      value: invoiceCount,
      icon: 'ph:receipt-bold',
      color: '#3b82f6'
    },
    {
      label: t('documentTemplates.purchaseOrder'),
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
    const query: Record<string, unknown> = {
      page: pagination.value.page,
      limit: pagination.value.limit
    };
    if (typeFilter.value) query.type = typeFilter.value;
    if (searchKey.value) query.searchKey = searchKey.value;
    const result = await fetchDocumentTemplates(query);
    templates.value = result.docs || [];
    if (result.pagination) {
      pagination.value = { ...pagination.value, ...result.pagination };
    }
  } catch (e) {
    logger.error('Failed to load document templates', e);
    templates.value = [];
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('common.fetchError') || 'Failed to load templates'
    });
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
  // System templates open in read-only context (just view)
  openDialog(row);
}

// Dialog
function openDialog(template?: DocumentTemplate) {
  if (template) {
    // System templates: show info only, not editable
    if ((template as unknown).category === 'system') {
      ElNotification({
        type: 'info',
        title: 'System Template',
        message: 'System templates are read-only. Use "Duplicate" to create an editable copy.'
      });
      return;
    }
    editingTemplate.value = template;
    form.name = template.name;
    form.type = template.type;
    form.isDefault = template.isDefault;
    form.pageSize = template.layout?.pageSize || 'A4';
  } else {
    editingTemplate.value = null;
    form.name = '';
    form.type = 'INVOICE';
    form.isDefault = false;
    form.pageSize = 'A4';
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.name.trim()) {
    ElNotification({
      type: 'warning',
      title: t('common.warning'),
      message: t('common.fillRequired')
    });
    return;
  }

  saving.value = true;
  try {
    const payload: Partial<DocumentTemplate> = {
      name: form.name,
      type: form.type as unknown,
      isDefault: form.isDefault
    };

    let result;
    if (editingTemplate.value) {
      // Update: also allow changing layout pageSize
      if (editingTemplate.value.layout) {
        payload.layout = {
          ...editingTemplate.value.layout,
          pageSize: form.pageSize
        };
      }
      result = await updateDocumentTemplate(editingTemplate.value.id, payload);
    } else {
      // New templates get a default empty layout
      payload.layout = {
        pageSize: form.pageSize,
        orientation: 'portrait',
        margins: { top: 20, right: 15, bottom: 20, left: 15 },
        elements: [],
        variables: currentVariables.value
      };
      result = await createDocumentTemplate(payload);
    }

    if (result.success) {
      ElNotification({
        type: 'success',
        title: t('common.success'),
        message: t('common.saved')
      });
      dialogVisible.value = false;
      await loadTemplates();
    } else {
      ElNotification({
        type: 'error',
        title: t('common.error'),
        message: result.message || t('common.error')
      });
    }
  } finally {
    saving.value = false;
  }
}

// Clone / Duplicate
async function handleClone(template: DocumentTemplate) {
  cloneLoadingId.value = template.id;
  try {
    const result = await cloneDocumentTemplate(template.id);
    if (result.success) {
      ElNotification({
        type: 'success',
        title: t('common.success'),
        message: t('documentTemplates.cloned')
      });
      await loadTemplates();
    } else {
      ElNotification({
        type: 'error',
        title: t('common.error'),
        message: result.message || t('common.error')
      });
    }
  } catch {
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('common.error')
    });
  } finally {
    cloneLoadingId.value = null;
  }
}

// Seed defaults
async function handleSeedDefaults() {
  seeding.value = true;
  try {
    const result = await seedDefaultTemplates();
    if (result.success) {
      ElNotification({
        type: 'success',
        title: t('common.success'),
        message: t('documentTemplates.seeded')
      });
      await loadTemplates();
    } else {
      ElNotification({
        type: 'error',
        title: t('common.error'),
        message: result.message || t('common.fetchError') || 'Failed to seed templates'
      });
    }
  } catch (e) {
    logger.error('Failed to seed default templates', e);
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('common.fetchError') || 'Failed to seed templates'
    });
  } finally {
    seeding.value = false;
  }
}

// Delete
function handleDelete(template: DocumentTemplate) {
  if ((template as unknown).category === 'system') {
    ElNotification({
      type: 'warning',
      title: 'System Template',
      message: 'System templates cannot be deleted.'
    });
    return;
  }
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
        title: t('common.success'),
        message: t('common.deleted')
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
