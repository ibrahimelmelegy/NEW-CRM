<template lang="pug">
.portal-invoices
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold.mb-1(style="color: var(--text-primary)") {{ $t('portal.invoices.title') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('portal.invoices.subtitle') }}

  //- Invoice Detail Dialog with Payment Widget
  el-dialog(
    v-model="showInvoiceDetail"
    :title="$t('portal.payment.invoiceDetails')"
    width="560px"
    destroy-on-close
  )
    PortalPaymentWidget(
      v-if="selectedInvoice"
      :invoice="selectedInvoice"
    )

  .glass-card.p-6
    el-table(:data="invoices" v-loading="loading" style="width: 100%")
      el-table-column(:label="$t('portal.invoices.invoiceNo')" prop="invoiceNumber" width="160")
      el-table-column(:label="$t('portal.invoices.deal')" min-width="200")
        template(#default="{ row }")
          span {{ row.deal?.name || '---' }}
      el-table-column(:label="$t('portal.invoices.amount')" width="150" align="right")
        template(#default="{ row }")
          span.font-bold {{ formatCurrency(row.amount) }}
      el-table-column(:label="$t('portal.invoices.date')" width="140")
        template(#default="{ row }")
          span {{ row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '---' }}
      el-table-column(:label="$t('portal.invoices.status')" width="130" align="center")
        template(#default="{ row }")
          el-tag(:type="invoiceStatusType(row)" size="small" effect="dark") {{ invoiceStatusLabel(row) }}
      el-table-column(:label="$t('common.actions')" width="140" align="center")
        template(#default="{ row }")
          .flex.items-center.justify-center.gap-1
            el-tooltip(:content="$t('portal.invoices.viewDetails')" placement="top")
              el-button(text size="small" @click="viewInvoice(row)")
                Icon(name="ph:eye-bold" size="14" aria-label="View")
            el-tooltip(:content="$t('portal.invoices.downloadPdf')" placement="top")
              el-button(text size="small" @click="downloadPdf(row)")
                Icon(name="ph:file-pdf-bold" size="14" aria-label="Download PDF")

    //- Pagination
    .flex.justify-center.mt-4(v-if="pagination.totalPages > 1")
      el-pagination(
        v-model:current-page="currentPage"
        :page-size="pagination.limit"
        :total="pagination.total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      )

    .text-center.py-8(v-if="!loading && !invoices.length")
      Icon(name="ph:receipt" size="48" style="color: var(--text-muted)" aria-label="No invoices")
      p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('portal.invoices.noInvoices') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useEnhancedPortal, type PortalInvoice } from '~/composables/usePortal';

definePageMeta({ layout: 'portal' });

const { t } = useI18n();

const { init, isAuthenticated } = usePortalAuth();
const { invoices, invoicePagination: pagination, loading, fetchInvoices, fetchInvoicePdfData } = useEnhancedPortal();

const showInvoiceDetail = ref(false);
const selectedInvoice = ref<PortalInvoice | null>(null);
const currentPage = ref(1);

onMounted(async () => {
  init();
  if (!isAuthenticated()) {
    navigateTo('/portal/login');
    return;
  }
  await fetchInvoices(1);
});

function viewInvoice(row: PortalInvoice) {
  selectedInvoice.value = row;
  showInvoiceDetail.value = true;
}

async function downloadPdf(row: PortalInvoice) {
  const data = await fetchInvoicePdfData(row.id);
  if (!data) {
    ElNotification({ type: 'error', title: t('common.error'), message: t('portal.invoices.pdfError') });
    return;
  }

  // Generate a simple text-based invoice document for download
  const lines = [
    '='.repeat(50),
    'INVOICE',
    '='.repeat(50),
    '',
    `Invoice #: ${data.invoiceNumber}`,
    `Amount: ${formatCurrency(data.amount)}`,
    `Issue Date: ${data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString() : 'N/A'}`,
    `Due Date: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A'}`,
    `Status: ${data.status}`,
    `Deal: ${data.deal?.name || 'N/A'}`,
    '',
    '='.repeat(50),
    `Generated on ${new Date().toLocaleString()}`
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${data.invoiceNumber}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  ElNotification({ type: 'success', title: t('common.success'), message: t('portal.invoices.pdfDownloaded') });
}

async function handlePageChange(page: number) {
  currentPage.value = page;
  await fetchInvoices(page);
}

function invoiceStatusType(row: PortalInvoice): string {
  if (row.status === 'PAID' || row.collected) return 'success';
  if (row.status === 'OVERDUE') return 'warning';
  if (row.status === 'PARTIAL') return '';
  return 'danger';
}

function invoiceStatusLabel(row: PortalInvoice): string {
  if (row.status === 'PAID' || row.collected) return t('portal.invoices.paid');
  if (row.status === 'OVERDUE') return t('portal.invoices.overdue');
  if (row.status === 'PARTIAL') return t('portal.invoices.partial');
  return t('portal.invoices.unpaid');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
}
</script>
