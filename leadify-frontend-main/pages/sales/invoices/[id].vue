<template lang="pug">
div
  //- Back button & header
  .flex.items-center.gap-3.mb-5.mt-5
    el-button(circle plain @click="goBack")
      Icon(name="ph:arrow-left-bold" size="18")
    .flex-1
      .flex.items-center.gap-3
        h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ invoice?.invoiceNumber || 'Invoice' }}
        InvoiceInvoiceStatusBadge(:status="invoiceStatus")
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ invoice?.deal?.name || '' }}

  //- Loading
  .text-center.py-20(v-if="loading")
    el-icon.is-loading(size="40")
    p.mt-2(style="color: var(--text-muted)") Loading invoice...

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
        span Send Invoice
      el-button(
        v-if="!invoice.collected && invoiceStatus !== 'VOID'"
        type="danger"
        plain
        @click="handleVoid"
        :loading="voiding"
      )
        Icon(name="ph:prohibit-bold" size="16" class="mr-1")
        span Void Invoice
      el-button(
        v-if="invoiceStatus !== 'VOID'"
        type="warning"
        plain
        @click="showCreditNoteDialog = true"
      )
        Icon(name="ph:note-bold" size="16" class="mr-1")
        span Create Credit Note

    //- Invoice detail card
    .glass-card.p-8.rounded-3xl.mb-6
      .grid.gap-6(class="md:grid-cols-2 grid-cols-1")
        div
          .font-medium.mb-1(style="color: var(--text-muted)") Invoice Number
          .text-lg.font-semibold(style="color: var(--text-primary)") {{ invoice.invoiceNumber }}
        div
          .font-medium.mb-1(style="color: var(--text-muted)") Invoice Date
          .text-lg(style="color: var(--text-primary)") {{ formatDate(invoice.invoiceDate) }}
        div
          .font-medium.mb-1(style="color: var(--text-muted)") Deal
          NuxtLink.text-lg.underline(
            :to="`/sales/deals/${invoice.dealId}`"
            style="color: var(--text-primary)"
          ) {{ invoice.deal?.name || 'N/A' }}
        div
          .font-medium.mb-1(style="color: var(--text-muted)") Status
          InvoiceInvoiceStatusBadge(:status="invoiceStatus")
        div
          .font-medium.mb-1(style="color: var(--text-muted)") Created
          .text-lg(style="color: var(--text-primary)") {{ formatDate(invoice.createdAt) }}
        div
          .font-medium.mb-1(style="color: var(--text-muted)") Last Updated
          .text-lg(style="color: var(--text-primary)") {{ formatDate(invoice.updatedAt) }}

    //- Line items
    .glass-card.p-8.rounded-3xl.mb-6
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") Line Items
      InvoiceInvoiceLineItems(:items="invoice.lineItems || []" :editable="false")

    //- Totals section
    .glass-card.p-8.rounded-3xl.mb-6
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") Totals
      .max-w-md.ml-auto
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") Subtotal
          span.font-semibold(style="color: var(--text-primary)") {{ fmtCurrency(invoice.totals?.subtotal || 0) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") Tax
          span(style="color: var(--text-primary)") + {{ fmtCurrency(invoice.totals?.tax || 0) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") Discount
          span(style="color: #ef4444") - {{ fmtCurrency(invoice.totals?.discount || 0) }}
        .flex.justify-between.py-3(style="border-bottom: 2px solid var(--glass-border)")
          span.font-bold(style="color: var(--text-primary)") Total
          span.font-bold.text-lg(style="color: var(--text-primary)") {{ fmtCurrency(invoice.totals?.total || 0) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") Paid
          span(style="color: #22c55e") {{ fmtCurrency(invoice.totals?.paid || 0) }}
        .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
          span(style="color: var(--text-muted)") Credit Notes
          span(style="color: #f59e0b") - {{ fmtCurrency(invoice.totals?.creditTotal || 0) }}
        .flex.justify-between.py-3
          span.font-bold(style="color: var(--text-primary)") Balance Due
          span.font-bold.text-xl(style="color: #7849ff") {{ fmtCurrency(invoice.totals?.balanceDue || 0) }}

    //- Credit notes section
    .glass-card.p-8.rounded-3xl.mb-6(v-if="invoice.creditNotes && invoice.creditNotes.length > 0")
      h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") Credit Notes
      el-table(:data="invoice.creditNotes" border style="width: 100%")
        el-table-column(prop="creditNoteNumber" label="CN #" width="140")
        el-table-column(label="Amount" width="140" align="right")
          template(#default="{ row }")
            span {{ fmtCurrency(row.amount) }}
        el-table-column(prop="reason" label="Reason" min-width="200")
        el-table-column(label="Status" width="120" align="center")
          template(#default="{ row }")
            el-tag(:type="row.status === 'APPLIED' ? 'success' : row.status === 'VOIDED' ? 'danger' : 'info'" size="small") {{ row.status }}
        el-table-column(label="Date" width="140")
          template(#default="{ row }")
            span {{ formatDate(row.date) }}

  //- Not found
  .text-center.py-20(v-else)
    Icon(name="ph:file-x-bold" size="48" style="color: var(--text-muted)")
    p.mt-3(style="color: var(--text-muted)") Invoice not found

  //- Credit note dialog
  el-dialog(v-model="showCreditNoteDialog" title="Create Credit Note" width="480px")
    el-form(label-position="top")
      el-form-item(label="Amount")
        el-input-number(
          v-model="creditNoteForm.amount"
          :min="0.01"
          :max="invoice?.totals?.balanceDue || 999999"
          :precision="2"
          style="width: 100%"
        )
      el-form-item(label="Reason")
        el-input(
          v-model="creditNoteForm.reason"
          type="textarea"
          :rows="3"
          placeholder="Reason for credit note..."
        )
      el-form-item(label="Date")
        el-date-picker(
          v-model="creditNoteForm.date"
          type="date"
          placeholder="Credit note date"
          style="width: 100%"
        )
    template(#footer)
      el-button(@click="showCreditNoteDialog = false") Cancel
      el-button(type="primary" @click="handleCreateCreditNote" :loading="creatingCN") Create
</template>

<script setup lang="ts">
import { ElMessageBox, ElNotification } from 'element-plus';
import type { InvoiceDetail } from '~/composables/useInvoiceBilling';
import { getInvoiceDetail, markInvoiceSent, voidInvoice, createCreditNote, formatCurrency } from '~/composables/useInvoiceBilling';

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
      ElNotification({ type: 'error', title: 'Error', message: 'Invalid invoice ID' });
      return;
    }
    invoice.value = await getInvoiceDetail(id);
  } finally {
    loading.value = false;
  }
}

async function handleSend() {
  try {
    await ElMessageBox.confirm('Mark this invoice as sent?', 'Send Invoice', {
      confirmButtonText: 'Send',
      cancelButtonText: 'Cancel',
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
    await ElMessageBox.confirm('Voiding this invoice is irreversible. Continue?', 'Void Invoice', {
      confirmButtonText: 'Void',
      cancelButtonText: 'Cancel',
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
    ElNotification({ type: 'warning', title: 'Validation', message: 'Please enter a valid amount' });
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
