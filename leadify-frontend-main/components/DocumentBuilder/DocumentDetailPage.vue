<template lang="pug">
.p-6.animate-entrance(v-loading="loading")
  //- Header
  .flex.items-center.justify-between.mb-6(v-if="document")
    .flex.items-center.gap-4
      el-button(circle size="large" class="!rounded-xl" @click="goBack")
        Icon(name="ph:arrow-left" size="18")
      div
        .flex.items-center.gap-3
          h1.text-2xl.font-extrabold(style="color: var(--text-primary)") {{ document.title }}
          span.font-mono.text-sm.px-2.py-1.rounded-lg(style="background: var(--bg-surface); color: var(--text-muted)") {{ document.reference }}
        .flex.items-center.gap-2.mt-1
          el-tag(:type="statusTagType(document.status)" size="small" round effect="dark") {{ formatStatus(document.status) }}
          span.text-xs(style="color: var(--text-muted)") v{{ document.version }}
          span.text-xs(style="color: var(--text-muted)") &middot; Created {{ formatDate(document.createdAt) }}
          span.text-xs(v-if="document.creator" style="color: var(--text-muted)") by {{ document.creator.name }}

    //- Actions
    .flex.items-center.gap-2
      el-dropdown(v-if="getNextStatuses(document.status).length" trigger="click" @command="handleStatusChange")
        el-button(size="large" class="!rounded-xl")
          | Change Status
          el-icon.ml-1: ArrowDown
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item(v-for="s in getNextStatuses(document.status)" :key="s" :command="s")
              | {{ formatStatus(s) }}
      el-dropdown(v-if="availableConversions.length > 0" trigger="click" @command="handleConvert")
        el-button(size="large" class="!rounded-xl")
          | Convert to...
          el-icon.ml-1: ArrowDown
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item(v-for="conv in availableConversions" :key="conv" :command="conv")
              | {{ formatType(conv) }}
      el-button(size="large" class="!rounded-xl" :loading="generatingPdf" @click="handleGeneratePdf")
        Icon(name="ph:file-pdf" size="16" class="mr-1")
        | Export PDF
      el-button(size="large" class="!rounded-xl" @click="showSendDialog = true")
        Icon(name="ph:paper-plane-tilt" size="16" class="mr-1")
        | {{ $t('docBuilder.send') }}

  //- Tabs
  el-tabs(v-model="activeTab" type="border-card" class="doc-detail-tabs" v-if="document")
    //- Editor Tab
    el-tab-pane(:label="$t('docBuilder.editor')" name="editor")
      template(#label)
        .flex.items-center.gap-2
          Icon(name="ph:pencil-simple" size="16")
          span {{ $t('docBuilder.editor') }}
      .py-4(style="height: calc(100vh - 200px); min-height: 500px")
        ProDocBuilder(
          :documentType="documentType"
          :documentId="document.id"
          :initialData="parsedContent"
          @saved="handleSaved"
        )

    //- Versions Tab
    el-tab-pane(:label="$t('docBuilder.versions')" name="versions")
      template(#label)
        .flex.items-center.gap-2
          Icon(name="ph:clock-counter-clockwise" size="16")
          span {{ $t('docBuilder.versions') }}
      .py-6.max-w-3xl.mx-auto
        DocumentVersionHistory(
          :versions="versions"
          :currentVersion="document.version"
          @view="handleViewVersion"
          @restore="handleRestoreVersion"
        )

    //- Linked Documents Tab
    el-tab-pane(:label="$t('docBuilder.linked')" name="linked")
      template(#label)
        .flex.items-center.gap-2
          Icon(name="ph:link" size="16")
          span {{ $t('docBuilder.linked') }}
      .py-6.max-w-2xl.mx-auto
        LinkedDocuments(
          :parentDocument="document.parentDocument"
          :childDocuments="document.childDocuments"
        )

  //- Error state
  .glass-card.p-12.flex.flex-col.items-center.justify-center.text-center(v-if="!loading && !document")
    Icon(name="ph:warning-circle" size="64" class="text-red-300 mb-4")
    h3.text-xl.font-bold(style="color: var(--text-primary)") Document Not Found
    p.text-muted.mt-2 The document you're looking for doesn't exist or you don't have access.
    el-button.mt-4(type="primary" class="!rounded-xl" @click="goBack") Go Back

  //- Send Document Dialog
  SendDocumentDialog(
    v-model="showSendDialog"
    :documentId="documentId"
    :clientEmail="document?.clientEmail"
    :documentReference="document?.reference"
    :documentTitle="document?.title"
    :documentType="documentType"
    @sent="handleSent"
  )

  //- Version preview dialog
  el-dialog(v-model="versionPreviewVisible" title="Version Preview" width="80%" top="5vh")
    .p-4(v-if="previewVersionContent")
      ProDocBuilder(
        :documentType="documentType"
        :initialData="previewVersionContent"
      )
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import { useDocBuilder } from '~/composables/useDocBuilder';
import { getAvailableConversions } from '~/composables/useDocumentConversion';
import type { DocBuilderVersion } from '~/composables/useDocBuilder';

const props = defineProps<{
  documentType: string;
  documentId: string;
}>();

// Note: definePageMeta must be used in the page file, not in components.
// The parent page [id].vue already defines the page meta.

const route = useRoute();
const {
  currentDocument: document,
  loading,
  getDocument,
  getVersions,
  getVersionById,
  restoreVersion,
  changeStatus,
  convertDocument,
  generatePdf
} = useDocBuilder();

const activeTab = ref('editor');
const versions = ref<DocBuilderVersion[]>([]);
const versionPreviewVisible = ref(false);
const previewVersionContent = ref<Record<string, unknown> | null>(null);
const showSendDialog = ref(false);
const generatingPdf = ref(false);

const parsedContent = computed(() => {
  if (!document.value?.content) return {};
  try {
    return JSON.parse(document.value.content);
  } catch {
    return {};
  }
});

const availableConversions = computed(() => {
  return getAvailableConversions(props.documentType).map(c => c.type || c);
});

// Helpers
function formatStatus(status: string) {
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
}

function statusTagType(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'info',
    PENDING_APPROVAL: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    SENT: '',
    PAID: 'success',
    CANCELLED: 'info',
    ARCHIVED: 'info'
  };
  return map[status] || '';
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
}

function getNextStatuses(current: string): string[] {
  const flow: Record<string, string[]> = {
    DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
    PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
    APPROVED: ['SENT', 'CANCELLED'],
    REJECTED: ['DRAFT'],
    SENT: ['PAID', 'CANCELLED'],
    PAID: ['ARCHIVED'],
    CANCELLED: ['DRAFT'],
    ARCHIVED: ['DRAFT']
  };
  return flow[current] || [];
}

function goBack() {
  const typeRoutes: Record<string, string> = {
    quote: '/sales/quotes',
    invoice: '/sales/invoices',
    proforma_invoice: '/sales/proforma-invoices',
    purchase_order: '/sales/purchase-orders',
    contract: '/sales/contracts',
    sales_order: '/sales/sales-orders',
    delivery_note: '/sales/delivery-notes'
  };
  navigateTo(typeRoutes[props.documentType] || '/sales/documents');
}

// Actions
async function handleStatusChange(newStatus: string) {
  try {
    let reason: string | undefined;
    if (newStatus === 'REJECTED') {
      const result = await ElMessageBox.prompt('Enter rejection reason:', 'Reject', {
        inputPlaceholder: 'Reason...',
        confirmButtonText: 'Reject'
      });
      reason = (result as unknown).value;
    }
    const response = await changeStatus(props.documentId, newStatus, reason);
    if (response?.success) {
      ElMessage.success(`Status changed to ${formatStatus(newStatus)}`);
      await loadDocument();
    }
  } catch {
    /* cancelled */
  }
}

async function handleConvert(targetType: string) {
  try {
    await ElMessageBox.confirm(`Convert this document to ${formatType(targetType)}?`, 'Convert Document', {
      confirmButtonText: 'Convert',
      type: 'info'
    });
    const response = await convertDocument(props.documentId, targetType);
    if (response?.success && response.body) {
      ElMessage.success('Document converted successfully');
      const typeSlug = targetType.replace(/_/g, '-') + 's';
      navigateTo(`/sales/${typeSlug}/${response.body.id}`);
    }
  } catch {
    /* cancelled */
  }
}

async function handleGeneratePdf() {
  generatingPdf.value = true;
  try {
    const response = await generatePdf(props.documentId);
    if (response?.success && response.body?.pdfUrl) {
      const baseUrl = useRuntimeConfig().public.apiBase || '';
      window.open(`${baseUrl}${response.body.pdfUrl}`, '_blank');
      ElMessage.success('PDF generated successfully');
    } else {
      ElMessage.error(response?.message || 'Failed to generate PDF');
    }
  } catch {
    ElMessage.error('Failed to generate PDF');
  } finally {
    generatingPdf.value = false;
  }
}

function handleSent() {
  loadDocument();
}

function handleSaved(data: unknown) {
  loadDocument();
  loadVersions();
}

async function handleViewVersion(version: DocBuilderVersion) {
  const response = await getVersionById(props.documentId, version.id);
  if (response?.success && response.body?.content) {
    try {
      previewVersionContent.value = JSON.parse(response.body.content);
      versionPreviewVisible.value = true;
    } catch {
      ElMessage.error('Could not parse version content');
    }
  }
}

async function handleRestoreVersion(version: DocBuilderVersion) {
  const response = await restoreVersion(props.documentId, version.id);
  if (response?.success) {
    ElMessage.success(`Restored to version ${version.version}`);
    await loadDocument();
    await loadVersions();
  }
}

// Data loading
async function loadDocument() {
  await getDocument(props.documentId);
}

async function loadVersions() {
  const response = await getVersions(props.documentId);
  if (response?.success && response.body) {
    versions.value = response.body;
  }
}

onMounted(async () => {
  await loadDocument();
  // Only load versions if the document was found
  if (document.value) {
    await loadVersions();
  }
});
</script>

<style scoped>
.doc-detail-tabs :deep(.el-tabs__header) {
  border-radius: 1rem 1rem 0 0;
  margin-bottom: 0;
}
.doc-detail-tabs :deep(.el-tabs__content) {
  padding: 0;
}
</style>
