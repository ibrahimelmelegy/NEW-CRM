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
          span {{ row.deal?.name || '—' }}
      el-table-column(:label="$t('portal.invoices.amount')" width="150" align="right")
        template(#default="{ row }")
          span.font-bold {{ formatCurrency(row.amount) }}
      el-table-column(:label="$t('portal.invoices.date')" width="140")
        template(#default="{ row }")
          span {{ row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '—' }}
      el-table-column(:label="$t('portal.invoices.status')" width="130" align="center")
        template(#default="{ row }")
          el-tag(:type="invoiceStatusType(row)" size="small" effect="dark") {{ invoiceStatusLabel(row) }}
      el-table-column(:label="''" width="100" align="center")
        template(#default="{ row }")
          el-button(text size="small" @click="viewInvoice(row)")
            Icon(name="ph:eye-bold" size="14" aria-label="View")

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
import { useEnhancedPortal, type PortalInvoice } from '~/composables/usePortal';

definePageMeta({ layout: 'portal' });

const { init, isAuthenticated } = usePortalAuth();
const { invoices, invoicePagination: pagination, loading, fetchInvoices } = useEnhancedPortal();

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

async function handlePageChange(page: number) {
  currentPage.value = page;
  await fetchInvoices(page);
}

function invoiceStatusType(row: any): string {
  if (row.status === 'PAID' || row.collected) return 'success';
  if (row.status === 'OVERDUE') return 'warning';
  if (row.status === 'PARTIAL') return '';
  return 'danger';
}

function invoiceStatusLabel(row: any): string {
  if (row.status === 'PAID' || row.collected) return 'Paid';
  if (row.status === 'OVERDUE') return 'Overdue';
  if (row.status === 'PARTIAL') return 'Partial';
  return 'Unpaid';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
}
</script>
