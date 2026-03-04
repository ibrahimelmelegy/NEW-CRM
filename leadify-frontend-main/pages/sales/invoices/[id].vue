<template lang="pug">
div
  //- Back button & header
  .flex.items-center.gap-3.mb-5.mt-5
    el-button(circle plain @click="goBack")
      Icon(name="ph:arrow-left-bold" size="18")
    .flex-1
      .flex.items-center.gap-3
        h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ invoice?.invoiceNumber || $t('invoices.title') }}
        InvoiceInvoiceStatusBadge(:status="invoiceStatus")
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ invoice?.deal?.name || '' }}

  //- Loading
  .text-center.py-20(v-if="loading")
    el-icon.is-loading(size="40")
    p.mt-2(style="color: var(--text-muted)") {{ $t('invoices.loadingInvoice') }}

  template(v-else-if="invoice")
    //- Action buttons
    .flex.flex-wrap.gap-2.mb-6
      el-button(
        v-if="!invoice.collected && invoiceStatus !== 'VOID'"
        type="primary"
        plain
        @click="handleSend"
        :loading="sending"
      )
        Icon(name="ph:paper-plane-tilt-bold" size="16" class="mr-1")
        span {{ $t('invoices.sendInvoiceBtn') }}
      el-button(
        v-if="!invoice.collected && invoiceStatus !== 'VOID'"
        type="danger"
        plain
        @click="handleVoid"
        :loading="voiding"
      )
        Icon(name="ph:prohibit-bold" size="16" class="mr-1")
        span {{ $t('invoices.voidInvoiceBtn') }}
      el-button(
        v-if="invoiceStatus !== 'VOID'"
        type="warning"
        plain
        @click="showCreditNoteDialog = true"
      )
        Icon(name="ph:note-bold" size="16" class="mr-1")
        span {{ $t('invoices.createCreditNoteBtn') }}

    //- Invoice detail card
    .glass-card.p-8.rounded-3xl.mb-6
      .grid.gap-6(class="md:grid-cols-2 grid-cols-1")
        div
          .font-medium.mb-1(style="color: var(--text-muted)") {{ $t('invoices.invoiceNumberLabel') }}
          .text-lg.font-semibold(style="color: var(--text-primary)") {{ invoice.invoiceNumber }}
        div
          .font-medium.mb-1(style="color: var(--text-muted)") {{ $t('invoices.invoiceDateLabel') }}
          .text-lg(style="color: var(--text-primary)") {{ formatDate(invoice.invoiceDate) }}
        div
          .font-medium.mb-1(style="color: var(--text-muted)") {{ $t('invoices.dealLabel') }}
          NuxtLink.text-lg.underline(
            :to="`/sales/deals/${invoice.dealId}`"
            style="color: var(--text-primary)"
          ) {{ invoice.deal?.name || 'N/A' }}
        div
          .font-medium.mb-1(style="color: var(--text-muted)") {{ $t('common.status') }}
          InvoiceInvoiceStatusBadge(:status="invoiceStatus")
        div
          .font-medium.mb-1(style="color: var(--text-muted)") {{ $t('salesOrders.createdDate') }}
          .text-lg(style="color: var(--text-primary)") {{ formatDate(invoice.createdAt) }}
        div
          .font-medium.mb-1(style="color: var(--text-muted)") {{ $t('salesOrders.lastUpdated') }}
          .text-lg(style="color: var(--text-primary)") {{ formatDate(invoice.updatedAt) }}

    //- Line items
    .glass-card.p-8.rounded-3xl.mb-6
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('invoices.lineItems') }}
      InvoiceInvoiceLineItems(:items="invoice.lineItems || []" :editable="false")

    //- Totals section
    .glass-card.p-8.rounded-3xl.mb-6
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('invoices.totals') }}
      .max-w-md.ml-auto
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") {{ $t('invoices.subtotal') }}
          span.font-semibold(style="color: var(--text-primary)") {{ fmtCurrency(invoice.totals?.subtotal || 0) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") {{ $t('invoices.tax') }}
          span(style="color: var(--text-primary)") + {{ fmtCurrency(invoice.totals?.tax || 0) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") {{ $t('invoices.discount') }}
          span(style="color: #ef4444") - {{ fmtCurrency(invoice.totals?.discount || 0) }}
        .flex.justify-between.py-3(style="border-bottom: 2px solid var(--glass-border)")
          span.font-bold(style="color: var(--text-primary)") {{ $t('invoices.totalLabel') }}
          span.font-bold.text-lg(style="color: var(--text-primary)") {{ fmtCurrency(invoice.totals?.total || 0) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") {{ $t('invoices.paidLabel') }}
          span(style="color: #22c55e") {{ fmtCurrency(invoice.totals?.paid || 0) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") {{ $t('invoices.creditNotesSection') }}
          span(style="color: #f59e0b") - {{ fmtCurrency(invoice.totals?.creditTotal || 0) }}
        .flex.justify-between.py-3
          span.font-bold(style="color: var(--text-primary)") {{ $t('invoices.balanceDue') }}
          span.font-bold.text-xl(style="color: #7849ff") {{ fmtCurrency(invoice.totals?.balanceDue || 0) }}

    //- Credit notes section
    .glass-card.p-8.rounded-3xl.mb-6(v-if="invoice.creditNotes && invoice.creditNotes.length > 0")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('invoices.creditNotesSection') }}
      el-table(:data="invoice.creditNotes" border style="width: 100%")
        el-table-column(prop="creditNoteNumber" :label="$t('invoices.cnNumber')" width="140")
        el-table-column(:label="$t('invoices.amountLabel')" width="140" align="right")
          template(#default="{ row }")
            span {{ fmtCurrency(row.amount) }}
        el-table-column(prop="reason" :label="$t('invoices.reasonLabel')" min-width="200")
        el-table-column(:label="$t('common.status')" width="120" align="center")
          template(#default="{ row }")
            el-tag(:type="row.status === 'APPLIED' ? 'success' : row.status === 'VOIDED' ? 'danger' : 'info'" size="small") {{ row.status }}
        el-table-column(:label="$t('invoices.dateLabel')" width="140")
          template(#default="{ row }")
            span {{ formatDate(row.date) }}

  //- Not found
  .text-center.py-20(v-else)
    Icon(name="ph:file-x-bold" size="48" style="color: var(--text-muted)")
    p.mt-3(style="color: var(--text-muted)") {{ $t('invoices.invoiceNotFound') }}

  //- Credit note dialog
  el-dialog(v-model="showCreditNoteDialog" :title="$t('invoices.createCreditNoteDialog')" width="480px")
    el-form(label-position="top")
      el-form-item(:label="$t('invoices.amountLabel')")
        el-input-number(
          v-model="creditNoteForm.amount"
          :min="0.01"
          :max="invoice?.totals?.balanceDue || 999999"
          :precision="2"
          style="width: 100%"
        )
      el-form-item(:label="$t('invoices.reasonLabel')")
        el-input(
          v-model="creditNoteForm.reason"
          type="textarea"
          :rows="3"
          :placeholder="$t('invoices.creditNoteReasonPlaceholder')"
        )
      el-form-item(:label="$t('invoices.dateLabel')")
        el-date-picker(
          v-model="creditNoteForm.date"
          type="date"
          :placeholder="$t('invoices.creditNoteDatePlaceholder')"
          style="width: 100%"
        )
    template(#footer)
      el-button(@click="showCreditNoteDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleCreateCreditNote" :loading="creatingCN") {{ $t('common.create') }}
</template>

<script setup lang="ts">
import { ElMessageBox, ElNotification } from 'element-plus';
import { useI18n } from 'vue-i18n';
import type { InvoiceDetail } from '~/composables/useInvoiceBilling';
import { getInvoiceDetail, markInvoiceSent, voidInvoice, createCreditNote, formatCurrency } from '~/composables/useInvoiceBilling';

const { t } = useI18n();

definePageMeta({ middleware: 'permissions' });

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const sending = ref(false);
const voiding = ref(false);
const creatingCN = ref(false);
const showCreditNoteDialog = ref(false);
const invoice = ref<InvoiceDetail | null>(null);

const creditNoteForm = ref({
  amount: 0,
  reason: '',
  date: ''
});

const invoiceStatus = computed(() => {
  if (!invoice.value) return 'DRAFT';
  if (invoice.value.amount === 0 && invoice.value.invoiceNumber) return 'VOID';
  if (invoice.value.collected) return 'PAID';
  return 'PENDING';
});

function goBack() {
  router.push('/sales/invoices');
}

function formatDate(date?: string): string {
  if (!date) return '--';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function fmtCurrency(amount: number): string {
  return formatCurrency(amount);
}

async function loadInvoice() {
  loading.value = true;
  try {
    const id = Number(route.params.id);
    if (isNaN(id)) {
      ElNotification({ type: 'error', title: t('common.error'), message: t('invoices.invalidInvoiceId') });
      return;
    }
    invoice.value = await getInvoiceDetail(id);
  } finally {
    loading.value = false;
  }
}

async function handleSend() {
  try {
    await ElMessageBox.confirm(t('invoices.confirmSend'), t('invoices.sendInvoice'), {
      confirmButtonText: t('invoices.sendBtn'),
      cancelButtonText: t('common.cancel'),
      type: 'info'
    });
    sending.value = true;
    const success = await markInvoiceSent(Number(route.params.id));
    if (success) await loadInvoice();
  } catch {
    /* cancelled */
  } finally {
    sending.value = false;
  }
}

async function handleVoid() {
  try {
    await ElMessageBox.confirm(t('invoices.confirmVoid'), t('invoices.voidInvoice'), {
      confirmButtonText: t('invoices.voidBtn'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    });
    voiding.value = true;
    const success = await voidInvoice(Number(route.params.id));
    if (success) await loadInvoice();
  } catch {
    /* cancelled */
  } finally {
    voiding.value = false;
  }
}

async function handleCreateCreditNote() {
  if (!creditNoteForm.value.amount || creditNoteForm.value.amount <= 0) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('invoices.validationAmount') });
    return;
  }
  creatingCN.value = true;
  try {
    const result = await createCreditNote(Number(route.params.id), {
      amount: creditNoteForm.value.amount,
      reason: creditNoteForm.value.reason,
      date: creditNoteForm.value.date ? new Date(creditNoteForm.value.date).toISOString() : undefined
    });
    if (result) {
      showCreditNoteDialog.value = false;
      creditNoteForm.value = { amount: 0, reason: '', date: '' };
      await loadInvoice();
    }
  } finally {
    creatingCN.value = false;
  }
}

onMounted(() => {
  loadInvoice();
});
</script>

<style scoped>
.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}
</style>
